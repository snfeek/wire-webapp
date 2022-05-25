"use strict";
/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptographyService = void 0;
const cryptobox_1 = require("@wireapp/cryptobox");
const proteus_1 = require("@wireapp/proteus");
const protocol_messaging_1 = require("@wireapp/protocol-messaging");
const bazinga64_1 = require("bazinga64");
const logdown_1 = __importDefault(require("logdown"));
const conversation_1 = require("../conversation");
const util_1 = require("../util");
const CryptographyDatabaseRepository_1 = require("./CryptographyDatabaseRepository");
const GenericMessageMapper_1 = require("./GenericMessageMapper");
class CryptographyService {
    constructor(apiClient, storeEngine, config) {
        this.apiClient = apiClient;
        this.storeEngine = storeEngine;
        this.config = config;
        this.cryptobox = new cryptobox_1.Cryptobox(this.storeEngine, config.nbPrekeys);
        this.database = new CryptographyDatabaseRepository_1.CryptographyDatabaseRepository(this.storeEngine);
        this.logger = (0, logdown_1.default)('@wireapp/core/cryptography/CryptographyService', {
            logger: console,
            markdown: false,
        });
    }
    constructSessionId(userId, clientId, domain) {
        const { id, domain: baseDomain } = typeof userId === 'string' ? { id: userId, domain } : userId;
        const baseId = `${id}@${clientId}`;
        return baseDomain && this.config.useQualifiedIds ? `${baseDomain}@${baseId}` : baseId;
    }
    static convertArrayRecipientsToBase64(recipients) {
        return Object.fromEntries(Object.entries(recipients).map(([userId, otrClientMap]) => {
            const otrClientMapWithBase64 = Object.fromEntries(Object.entries(otrClientMap).map(([clientId, payload]) => {
                return [clientId, bazinga64_1.Encoder.toBase64(payload).asString];
            }));
            return [userId, otrClientMapWithBase64];
        }));
    }
    static convertBase64RecipientsToArray(recipients) {
        return Object.fromEntries(Object.entries(recipients).map(([userId, otrClientMap]) => {
            const otrClientMapWithUint8Array = Object.fromEntries(Object.entries(otrClientMap).map(([clientId, payload]) => {
                return [clientId, bazinga64_1.Decoder.fromBase64(payload).asBytes];
            }));
            return [userId, otrClientMapWithUint8Array];
        }));
    }
    async createCryptobox(entropyData) {
        const initialPreKeys = await this.cryptobox.create(entropyData);
        return initialPreKeys
            .map(preKey => {
            const preKeyJson = this.cryptobox.serialize_prekey(preKey);
            if (preKeyJson.id !== proteus_1.keys.PreKey.MAX_PREKEY_ID) {
                return preKeyJson;
            }
            return { id: -1, key: '' };
        })
            .filter(serializedPreKey => serializedPreKey.key);
    }
    decrypt(sessionId, encodedCiphertext) {
        this.logger.log(`Decrypting message for session ID "${sessionId}"`);
        const messageBytes = bazinga64_1.Decoder.fromBase64(encodedCiphertext).asBytes;
        return this.cryptobox.decrypt(sessionId, messageBytes.buffer);
    }
    async encryptQualified(plainText, preKeyBundles) {
        const qualifiedOTRRecipients = {};
        const missing = {};
        for (const [domain, preKeyBundleMap] of Object.entries(preKeyBundles)) {
            const result = await this.encrypt(plainText, preKeyBundleMap, domain);
            qualifiedOTRRecipients[domain] = result.encrypted;
            missing[domain] = result.missing;
        }
        return {
            encrypted: qualifiedOTRRecipients,
            missing,
        };
    }
    async encrypt(plainText, users, domain) {
        var _a;
        const encrypted = {};
        const missing = {};
        for (const userId in users) {
            const clientIds = (0, util_1.isUserClients)(users)
                ? users[userId]
                : Object.keys(users[userId])
                    // We filter out clients that have `null` prekey
                    .filter(clientId => !!users[userId][clientId]);
            for (const clientId of clientIds) {
                const base64PreKey = (0, util_1.isUserClients)(users) ? undefined : (_a = users[userId][clientId]) === null || _a === void 0 ? void 0 : _a.key;
                const sessionId = this.constructSessionId(userId, clientId, domain);
                const result = await this.encryptPayloadForSession(sessionId, plainText, base64PreKey);
                if (result) {
                    encrypted[userId] || (encrypted[userId] = {});
                    encrypted[userId][clientId] = result.encryptedPayload;
                }
                else {
                    missing[userId] || (missing[userId] = []);
                    missing[userId].push(clientId);
                }
            }
        }
        return { encrypted, missing };
    }
    async encryptPayloadForSession(sessionId, plainText, base64EncodedPreKey) {
        this.logger.log(`Encrypting payload for session ID "${sessionId}"`);
        let encryptedPayload;
        try {
            const decodedPreKeyBundle = base64EncodedPreKey
                ? bazinga64_1.Decoder.fromBase64(base64EncodedPreKey).asBytes.buffer
                : undefined;
            const payloadAsArrayBuffer = await this.cryptobox.encrypt(sessionId, plainText, decodedPreKeyBundle);
            encryptedPayload = new Uint8Array(payloadAsArrayBuffer);
        }
        catch (error) {
            const notFoundErrorCode = 2;
            if (error.code === notFoundErrorCode) {
                // If the session is not in the database, we just return undefined. Later on there will be a mismatch and the session will be created
                return undefined;
            }
            this.logger.error(`Could not encrypt payload: ${error.message}`);
            encryptedPayload = new Uint8Array(Buffer.from('💣', 'utf-8'));
        }
        return { encryptedPayload, sessionId };
    }
    async initCryptobox() {
        await this.cryptobox.load();
    }
    deleteCryptographyStores() {
        return this.database.deleteStores();
    }
    async resetSession(sessionId) {
        await this.cryptobox.session_delete(sessionId);
        this.logger.log(`Deleted session ID "${sessionId}".`);
    }
    async decryptMessage(otrMessage) {
        const { from, qualified_from, data: { sender, text: cipherText }, } = otrMessage;
        const sessionId = this.constructSessionId(from, sender, qualified_from === null || qualified_from === void 0 ? void 0 : qualified_from.domain);
        try {
            const decryptedMessage = await this.decrypt(sessionId, cipherText);
            return protocol_messaging_1.GenericMessage.decode(decryptedMessage);
        }
        catch (error) {
            throw this.generateDecryptionError(otrMessage, error);
        }
    }
    mapGenericMessage(otrMessage, genericMessage, source) {
        if (genericMessage.content === conversation_1.GenericMessageType.EPHEMERAL) {
            const unwrappedMessage = GenericMessageMapper_1.GenericMessageMapper.mapGenericMessage(genericMessage.ephemeral, otrMessage, source);
            unwrappedMessage.id = genericMessage.messageId;
            if (genericMessage.ephemeral) {
                const expireAfterMillis = genericMessage.ephemeral.expireAfterMillis;
                unwrappedMessage.messageTimer =
                    typeof expireAfterMillis === 'number' ? expireAfterMillis : expireAfterMillis.toNumber();
            }
            return unwrappedMessage;
        }
        return GenericMessageMapper_1.GenericMessageMapper.mapGenericMessage(genericMessage, otrMessage, source);
    }
    generateDecryptionError(event, error) {
        var _a;
        const errorCode = (_a = error.code) !== null && _a !== void 0 ? _a : 999;
        let message = 'Unknown decryption error';
        const { data: eventData, from: remoteUserId, time: formattedTime } = event;
        const remoteClientId = eventData.sender;
        const isDuplicateMessage = error instanceof proteus_1.errors.DecryptError.DuplicateMessage;
        const isOutdatedMessage = error instanceof proteus_1.errors.DecryptError.OutdatedMessage;
        // We don't need to show these message errors to the user
        if (isDuplicateMessage || isOutdatedMessage) {
            message = `Message from user ID "${remoteUserId}" at "${formattedTime}" will not be handled because it is outdated or a duplicate.`;
        }
        const isInvalidMessage = error instanceof proteus_1.errors.DecryptError.InvalidMessage;
        const isInvalidSignature = error instanceof proteus_1.errors.DecryptError.InvalidSignature;
        const isRemoteIdentityChanged = error instanceof proteus_1.errors.DecryptError.RemoteIdentityChanged;
        // Session is broken, let's see what's really causing it...
        if (isInvalidMessage || isInvalidSignature) {
            message = `Session with user '${remoteUserId}' (${remoteClientId}) is broken.\nReset the session for possible fix.`;
        }
        else if (isRemoteIdentityChanged) {
            message = `Remote identity of client '${remoteClientId}' from user '${remoteUserId}' changed`;
        }
        this.logger.warn(`Failed to decrypt event from client '${remoteClientId}' of user '${remoteUserId}' (${formattedTime}).\nError Code: '${errorCode}'\nError Message: ${error.message}`, error);
        return { code: errorCode, message };
    }
}
exports.CryptographyService = CryptographyService;
//# sourceMappingURL=CryptographyService.js.map