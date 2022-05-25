"use strict";
/*
 * Wire
 * Copyright (C) 2020 Wire Swiss GmbH
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
exports.MessageService = void 0;
const http_status_codes_1 = require("http-status-codes");
const otr_1 = require("@wireapp/protocol-messaging/web/otr");
const long_1 = __importDefault(require("long"));
const StringUtil_1 = require("@wireapp/commons/src/main/util/StringUtil");
const bazinga64_1 = require("bazinga64");
const AssetCryptography_1 = require("../../cryptography/AssetCryptography");
const cryptography_1 = require("../../cryptography");
const MessageBuilder_1 = require("./MessageBuilder");
const protocol_messaging_1 = require("@wireapp/protocol-messaging");
const __1 = require("..");
const UserClientsUtil_1 = require("./UserClientsUtil");
const util_1 = require("../../util");
class MessageService {
    constructor(apiClient, cryptographyService) {
        this.apiClient = apiClient;
        this.cryptographyService = cryptographyService;
    }
    /**
     * Sends a message to a non-federated backend.
     *
     * @param sendingClientId The clientId of the current user
     * @param recipients The list of recipients to send the message to
     * @param plainText The plainText data to send
     * @param options.conversationId? the conversation to send the message to. Will broadcast if not set
     * @param options.reportMissing? trigger a mismatch error when there are missing recipients in the payload
     * @param options.sendAsProtobuf?
     * @param options.onClientMismatch? Called when a mismatch happens on the server
     * @return the ClientMismatch status returned by the backend
     */
    async sendMessage(sendingClientId, recipients, plainText, options = {}) {
        let plainTextPayload = plainText;
        let cipherText;
        if (this.shouldSendAsExternal(plainText, recipients)) {
            const externalPayload = await this.generateExternalPayload(plainText);
            plainTextPayload = externalPayload.text;
            cipherText = externalPayload.cipherText;
        }
        const { encrypted, missing } = await this.cryptographyService.encrypt(plainTextPayload, recipients);
        const encryptedPayload = Object.keys(missing).length
            ? await this.reencryptAfterMismatch({ missing, deleted: {} }, encrypted, plainText)
            : encrypted;
        const send = (payload) => {
            return options.sendAsProtobuf
                ? this.sendOTRProtobufMessage(sendingClientId, payload, Object.assign(Object.assign({}, options), { assetData: cipherText }))
                : this.sendOTRMessage(sendingClientId, payload, Object.assign(Object.assign({}, options), { assetData: cipherText }));
        };
        try {
            return await send(encryptedPayload);
        }
        catch (error) {
            if (!this.isClientMismatchError(error)) {
                throw error;
            }
            const mismatch = error.response.data;
            const shouldStopSending = options.onClientMismatch && (await options.onClientMismatch(mismatch)) === false;
            if (shouldStopSending) {
                return Object.assign(Object.assign({}, mismatch), { errored: true });
            }
            const reEncryptedMessage = await this.reencryptAfterMismatch(mismatch, encryptedPayload, plainText);
            return send(reEncryptedMessage);
        }
    }
    /**
     * Sends a message to a federated backend.
     *
     * @param sendingClientId The clientId of the current user
     * @param recipients The list of recipients to send the message to
     * @param plainText The plainText data to send
     * @param options.conversationId? the conversation to send the message to. Will broadcast if not set
     * @param options.reportMissing? trigger a mismatch error when there are missing recipients in the payload
     * @param options.sendAsProtobuf?
     * @param options.onClientMismatch? Called when a mismatch happens on the server
     * @return the MessageSendingStatus returned by the backend
     */
    async sendFederatedMessage(sendingClientId, recipients, plainText, options) {
        const send = (payload) => {
            return this.sendFederatedOtrMessage(sendingClientId, payload, options);
        };
        const { encrypted, missing } = await this.cryptographyService.encryptQualified(plainText, recipients);
        const encryptedPayload = Object.keys(missing).length
            ? await this.reencryptAfterFederatedMismatch({ missing, deleted: {} }, encrypted, plainText)
            : encrypted;
        try {
            return await send(encryptedPayload);
        }
        catch (error) {
            if (!this.isClientMismatchError(error)) {
                throw error;
            }
            const mismatch = error.response.data;
            const shouldStopSending = options.onClientMismatch && (await options.onClientMismatch(mismatch)) === false;
            if (shouldStopSending) {
                return Object.assign(Object.assign({}, mismatch), { errored: true });
            }
            const reEncryptedPayload = await this.reencryptAfterFederatedMismatch(mismatch, encryptedPayload, plainText);
            return send(reEncryptedPayload);
        }
    }
    async sendFederatedOtrMessage(sendingClientId, recipients, options) {
        const qualifiedUserEntries = Object.entries(recipients).map(([domain, otrRecipients]) => {
            const userEntries = Object.entries(otrRecipients).map(([userId, otrClientMap]) => {
                const clientEntries = Object.entries(otrClientMap).map(([clientId, payload]) => {
                    return {
                        client: {
                            client: long_1.default.fromString(clientId, 16),
                        },
                        text: payload,
                    };
                });
                return {
                    user: {
                        uuid: (0, StringUtil_1.uuidToBytes)(userId),
                    },
                    clients: clientEntries,
                };
            });
            return { domain, entries: userEntries };
        });
        const protoMessage = otr_1.proteus.QualifiedNewOtrMessage.create({
            recipients: qualifiedUserEntries,
            sender: {
                client: long_1.default.fromString(sendingClientId, 16),
            },
            nativePush: options.nativePush,
        });
        if (options.assetData) {
            protoMessage.blob = options.assetData;
        }
        if (options.reportMissing) {
            if ((0, util_1.isQualifiedIdArray)(options.reportMissing)) {
                protoMessage.reportOnly = { userIds: options.reportMissing };
            }
            else {
                protoMessage.reportAll = true;
            }
        }
        else {
            protoMessage.ignoreAll = true;
        }
        if (!options.conversationId) {
            return this.apiClient.api.broadcast.postBroadcastFederatedMessage(sendingClientId, protoMessage);
        }
        const { id, domain } = options.conversationId;
        return this.apiClient.api.conversation.postOTRMessageV2(id, domain, protoMessage);
    }
    async sendOTRMessage(sendingClientId, recipients, options) {
        const message = {
            data: options.assetData ? bazinga64_1.Encoder.toBase64(options.assetData).asString : undefined,
            recipients: cryptography_1.CryptographyService.convertArrayRecipientsToBase64(recipients),
            sender: sendingClientId,
            native_push: options.nativePush,
        };
        let ignoreMissing;
        if ((0, util_1.isStringArray)(options.reportMissing)) {
            message.report_missing = options.reportMissing;
        }
        else {
            // By default we want ignore missing to be false (and have mismatch errors in case some clients are missing)
            ignoreMissing = typeof options.reportMissing === 'boolean' ? !options.reportMissing : false;
        }
        return !options.conversationId
            ? this.apiClient.api.broadcast.postBroadcastMessage(sendingClientId, message, ignoreMissing)
            : this.apiClient.api.conversation.postOTRMessage(sendingClientId, options.conversationId, message, ignoreMissing);
    }
    async generateExternalPayload(plainText) {
        const asset = await (0, AssetCryptography_1.encryptAsset)({ plainText });
        const { cipherText, keyBytes, sha256 } = asset;
        const messageId = MessageBuilder_1.MessageBuilder.createId();
        const externalMessage = {
            otrKey: new Uint8Array(keyBytes),
            sha256: new Uint8Array(sha256),
        };
        const genericMessage = protocol_messaging_1.GenericMessage.create({
            [__1.GenericMessageType.EXTERNAL]: externalMessage,
            messageId,
        });
        return { text: protocol_messaging_1.GenericMessage.encode(genericMessage).finish(), cipherText };
    }
    shouldSendAsExternal(plainText, preKeyBundles) {
        const EXTERNAL_MESSAGE_THRESHOLD_BYTES = 200 * 1024;
        let clientCount = 0;
        for (const user in preKeyBundles) {
            clientCount += Object.keys(preKeyBundles[user]).length;
        }
        const messageInBytes = new Uint8Array(plainText).length;
        const estimatedPayloadInBytes = clientCount * messageInBytes;
        return estimatedPayloadInBytes > EXTERNAL_MESSAGE_THRESHOLD_BYTES;
    }
    isClientMismatchError(error) {
        var _a;
        return ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === http_status_codes_1.StatusCodes.PRECONDITION_FAILED;
    }
    async reencryptAfterMismatch(mismatch, recipients, plainText) {
        const deleted = (0, UserClientsUtil_1.flattenUserClients)(mismatch.deleted);
        const missing = (0, UserClientsUtil_1.flattenUserClients)(mismatch.missing);
        // remove deleted clients to the recipients
        deleted.forEach(({ userId, data }) => data.forEach(clientId => delete recipients[userId.id][clientId]));
        if (missing.length) {
            const missingPreKeyBundles = await this.apiClient.api.user.postMultiPreKeyBundles(mismatch.missing);
            const { encrypted } = await this.cryptographyService.encrypt(plainText, missingPreKeyBundles);
            const reEncryptedPayloads = (0, UserClientsUtil_1.flattenUserClients)(encrypted);
            // add missing clients to the recipients
            reEncryptedPayloads.forEach(({ data, userId }) => (recipients[userId.id] = Object.assign(Object.assign({}, recipients[userId.id]), data)));
        }
        return recipients;
    }
    /**
     * Will re-encrypt a message when there were some missing clients in the initial send (typically when the server replies with a client mismatch error)
     *
     * @param {ProtobufOTR.QualifiedNewOtrMessage} messageData The initial message that was sent
     * @param {MessageSendingStatus} messageSendingStatus Info about the missing/deleted clients
     * @param {Uint8Array} plainText The text that should be encrypted for the missing clients
     * @return resolves with a new message payload that can be sent
     */
    async reencryptAfterFederatedMismatch(mismatch, recipients, plainText) {
        const deleted = (0, UserClientsUtil_1.flattenQualifiedUserClients)(mismatch.deleted);
        const missing = (0, UserClientsUtil_1.flattenQualifiedUserClients)(mismatch.missing);
        // remove deleted clients to the recipients
        deleted.forEach(({ userId, data }) => data.forEach(clientId => delete recipients[userId.domain][userId.id][clientId]));
        if (Object.keys(missing).length) {
            const missingPreKeyBundles = await this.apiClient.api.user.postQualifiedMultiPreKeyBundles(mismatch.missing);
            const { encrypted } = await this.cryptographyService.encryptQualified(plainText, missingPreKeyBundles);
            const reEncryptedPayloads = (0, UserClientsUtil_1.flattenQualifiedUserClients)(encrypted);
            reEncryptedPayloads.forEach(({ data, userId }) => (recipients[userId.domain][userId.id] = Object.assign(Object.assign({}, recipients[userId.domain][userId.id]), data)));
        }
        return recipients;
    }
    async sendOTRProtobufMessage(sendingClientId, recipients, options) {
        const userEntries = Object.entries(recipients).map(([userId, otrClientMap]) => {
            const clients = Object.entries(otrClientMap).map(([clientId, payload]) => {
                return {
                    client: {
                        client: long_1.default.fromString(clientId, 16),
                    },
                    text: payload,
                };
            });
            return {
                clients,
                user: {
                    uuid: (0, StringUtil_1.uuidToBytes)(userId),
                },
            };
        });
        const protoMessage = otr_1.proteus.NewOtrMessage.create({
            recipients: userEntries,
            sender: {
                client: long_1.default.fromString(sendingClientId, 16),
            },
        });
        let ignoreMissing;
        if ((0, util_1.isStringArray)(options.reportMissing)) {
            const encoder = new TextEncoder();
            protoMessage.reportMissing = options.reportMissing.map(userId => ({ uuid: encoder.encode(userId) }));
        }
        else {
            // By default we want ignore missing to be false (and have mismatch errors in case some clients are missing)
            ignoreMissing = typeof options.reportMissing === 'boolean' ? !options.reportMissing : false;
        }
        if (options.assetData) {
            protoMessage.blob = options.assetData;
        }
        return !options.conversationId
            ? this.apiClient.api.broadcast.postBroadcastProtobufMessage(sendingClientId, protoMessage, ignoreMissing)
            : this.apiClient.api.conversation.postOTRProtobufMessage(sendingClientId, options.conversationId, protoMessage, ignoreMissing);
    }
}
exports.MessageService = MessageService;
//# sourceMappingURL=MessageService.js.map