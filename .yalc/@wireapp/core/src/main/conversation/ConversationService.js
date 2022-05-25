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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationService = exports.MessageTargetMode = void 0;
const conversation_1 = require("@wireapp/api-client/src/conversation");
const data_1 = require("@wireapp/api-client/src/conversation/data");
const protocol_messaging_1 = require("@wireapp/protocol-messaging");
const conversation_2 = require("../conversation/");
const AssetCryptography_1 = require("../cryptography/AssetCryptography");
const TypePredicateUtil_1 = require("../util/TypePredicateUtil");
const MessageBuilder_1 = require("./message/MessageBuilder");
const MessageService_1 = require("./message/MessageService");
const MessageToProtoMapper_1 = require("./message/MessageToProtoMapper");
var MessageTargetMode;
(function (MessageTargetMode) {
    MessageTargetMode[MessageTargetMode["NONE"] = 0] = "NONE";
    MessageTargetMode[MessageTargetMode["USERS"] = 1] = "USERS";
    MessageTargetMode[MessageTargetMode["USERS_CLIENTS"] = 2] = "USERS_CLIENTS";
})(MessageTargetMode = exports.MessageTargetMode || (exports.MessageTargetMode = {}));
class ConversationService {
    constructor(apiClient, cryptographyService, config) {
        this.apiClient = apiClient;
        this.config = config;
        this.messageTimer = new conversation_2.MessageTimer();
        this.messageService = new MessageService_1.MessageService(this.apiClient, cryptographyService);
    }
    createEphemeral(originalGenericMessage, expireAfterMillis) {
        const ephemeralMessage = protocol_messaging_1.Ephemeral.create({
            expireAfterMillis,
            [originalGenericMessage.content]: originalGenericMessage[originalGenericMessage.content],
        });
        const genericMessage = protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.EPHEMERAL]: ephemeralMessage,
            messageId: originalGenericMessage.messageId,
        });
        return genericMessage;
    }
    async getConversationQualifiedMembers(conversationId) {
        const conversation = await this.apiClient.api.conversation.getConversation(conversationId);
        /*
         * If you are sending a message to a conversation, you have to include
         * yourself in the list of users if you want to sync a message also to your
         * other clients.
         */
        return (conversation.members.others
            .filter(member => !!member.qualified_id)
            .map(member => member.qualified_id)
            // TODO(Federation): Use 'domain' from 'conversation.members.self' when backend has it implemented
            .concat({ domain: this.apiClient.context.domain, id: conversation.members.self.id }));
    }
    /**
     * Will generate a prekey bundle for specific users.
     * If a QualifiedId array is given the bundle will contain all the clients from those users fetched from the server.
     * If a QualifiedUserClients is provided then only the clients in the payload will be targeted (which could generate a ClientMismatch when sending messages)
     *
     * @param {QualifiedId[]|QualifiedUserClients} userIds - Targeted users.
     * @returns {Promise<QualifiedUserPreKeyBundleMap}
     */
    async getQualifiedPreKeyBundle(userIds) {
        let targets = [];
        if (userIds) {
            if ((0, TypePredicateUtil_1.isQualifiedIdArray)(userIds)) {
                targets = userIds.map(id => ({ id }));
            }
            else {
                targets = Object.entries(userIds).reduce((accumulator, [domain, userClients]) => {
                    for (const userId in userClients) {
                        accumulator.push({ id: { id: userId, domain }, clients: userClients[userId] });
                    }
                    return accumulator;
                }, []);
            }
        }
        const preKeys = await Promise.all(targets.map(async ({ id: userId, clients }) => {
            const prekeyBundle = await this.apiClient.api.user.getUserPreKeys(userId);
            // We filter the clients that should not receive the message (if a QualifiedUserClients was given as parameter)
            const userClients = clients
                ? prekeyBundle.clients.filter(client => clients.includes(client.client))
                : prekeyBundle.clients;
            return { user: userId, clients: userClients };
        }));
        return preKeys.reduce((bundleMap, qualifiedPrekey) => {
            var _a, _b, _c;
            bundleMap[_a = qualifiedPrekey.user.domain] || (bundleMap[_a] = {});
            for (const client of qualifiedPrekey.clients) {
                (_b = bundleMap[qualifiedPrekey.user.domain])[_c = qualifiedPrekey.user.id] || (_b[_c] = {});
                bundleMap[qualifiedPrekey.user.domain][qualifiedPrekey.user.id][client.client] = client.prekey;
            }
            return bundleMap;
        }, {});
    }
    async getPreKeyBundleMap(conversationId, userIds) {
        let members = [];
        if (userIds) {
            if ((0, TypePredicateUtil_1.isStringArray)(userIds)) {
                members = userIds;
            }
            else if ((0, TypePredicateUtil_1.isUserClients)(userIds)) {
                members = Object.keys(userIds);
            }
        }
        if (!members.length) {
            const conversation = await this.apiClient.api.conversation.getConversation(conversationId);
            /*
             * If you are sending a message to a conversation, you have to include
             * yourself in the list of users if you want to sync a message also to your
             * other clients.
             */
            members = conversation.members.others.map(member => member.id).concat(conversation.members.self.id);
        }
        const preKeys = await Promise.all(members.map(member => this.apiClient.api.user.getUserPreKeys(member)));
        return preKeys.reduce((bundleMap, bundle) => {
            const userId = bundle.user;
            bundleMap[userId] || (bundleMap[userId] = {});
            for (const client of bundle.clients) {
                bundleMap[userId][client.client] = client.prekey;
            }
            return bundleMap;
        }, {});
    }
    async getSelfConversationId() {
        if (!this.selfConversationId) {
            const { userId } = this.apiClient.context;
            const { qualified_id, id } = await this.apiClient.api.conversation.getConversation(userId);
            const domain = this.config.useQualifiedIds ? qualified_id.domain : '';
            this.selfConversationId = { id, domain };
        }
        return this.selfConversationId;
    }
    async getQualifiedRecipientsForConversation(conversationId, userIds) {
        if ((0, TypePredicateUtil_1.isQualifiedUserClients)(userIds)) {
            return userIds;
        }
        const recipientIds = userIds || (await this.getConversationQualifiedMembers(conversationId));
        return this.getQualifiedPreKeyBundle(recipientIds);
    }
    async getRecipientsForConversation(conversationId, userIds) {
        if ((0, TypePredicateUtil_1.isUserClients)(userIds)) {
            return userIds;
        }
        return this.getPreKeyBundleMap(conversationId, userIds);
    }
    /**
     * Sends a message to a conversation
     *
     * @param sendingClientId The clientId from which the message is sent
     * @param conversationId The conversation in which to send the message
     * @param genericMessage The payload of the message to send
     * @return Resolves with the message sending status from backend
     */
    async sendGenericMessage(sendingClientId, conversationId, genericMessage, { conversationDomain, userIds, nativePush, sendAsProtobuf, onClientMismatch, targetMode = MessageTargetMode.NONE, } = {}) {
        const plainText = protocol_messaging_1.GenericMessage.encode(genericMessage).finish();
        if (targetMode !== MessageTargetMode.NONE && !userIds) {
            throw new Error('Cannot send targetted message when no userIds are given');
        }
        if (conversationDomain && this.config.useQualifiedIds) {
            if ((0, TypePredicateUtil_1.isStringArray)(userIds) || (0, TypePredicateUtil_1.isUserClients)(userIds)) {
                throw new Error('Invalid userIds option for sending to federated backend');
            }
            const recipients = await this.getQualifiedRecipientsForConversation({ id: conversationId, domain: conversationDomain }, userIds);
            let reportMissing;
            if (targetMode === MessageTargetMode.NONE) {
                reportMissing = (0, TypePredicateUtil_1.isQualifiedUserClients)(userIds); // we want to check mismatch in case the consumer gave an exact list of users/devices
            }
            else if (targetMode === MessageTargetMode.USERS) {
                reportMissing = this.extractQualifiedUserIds(userIds);
            }
            else {
                // in case the message is fully targetted at user/client pairs, we do not want to report the missing clients or users at all
                reportMissing = false;
            }
            return this.messageService.sendFederatedMessage(sendingClientId, recipients, plainText, {
                conversationId: { id: conversationId, domain: conversationDomain },
                nativePush,
                reportMissing,
                onClientMismatch: mismatch => onClientMismatch === null || onClientMismatch === void 0 ? void 0 : onClientMismatch(mismatch, false),
            });
        }
        if ((0, TypePredicateUtil_1.isQualifiedIdArray)(userIds) || (0, TypePredicateUtil_1.isQualifiedUserClients)(userIds)) {
            throw new Error('Invalid userIds option for sending');
        }
        const recipients = await this.getRecipientsForConversation(conversationId, userIds);
        let reportMissing;
        if (targetMode === MessageTargetMode.NONE) {
            reportMissing = (0, TypePredicateUtil_1.isUserClients)(userIds); // we want to check mismatch in case the consumer gave an exact list of users/devices
        }
        else if (targetMode === MessageTargetMode.USERS) {
            reportMissing = this.extractUserIds(userIds);
        }
        else {
            // in case the message is fully targetted at user/client pairs, we do not want to report the missing clients or users at all
            reportMissing = false;
        }
        return this.messageService.sendMessage(sendingClientId, recipients, plainText, {
            conversationId,
            sendAsProtobuf,
            nativePush,
            reportMissing,
            onClientMismatch: mistmatch => onClientMismatch === null || onClientMismatch === void 0 ? void 0 : onClientMismatch(mistmatch, false),
        });
    }
    extractUserIds(userIds) {
        if ((0, TypePredicateUtil_1.isUserClients)(userIds)) {
            return Object.keys(userIds);
        }
        return userIds;
    }
    extractQualifiedUserIds(userIds) {
        if ((0, TypePredicateUtil_1.isQualifiedUserClients)(userIds)) {
            return Object.entries(userIds).reduce((ids, [domain, userClients]) => {
                return ids.concat(Object.keys(userClients).map(userId => ({ domain, id: userId })));
            }, []);
        }
        return userIds;
    }
    generateButtonActionGenericMessage(payloadBundle) {
        return protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.BUTTON_ACTION]: protocol_messaging_1.ButtonAction.create(payloadBundle.content),
            messageId: payloadBundle.id,
        });
    }
    generateButtonActionConfirmationGenericMessage(payloadBundle) {
        return protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.BUTTON_ACTION_CONFIRMATION]: protocol_messaging_1.ButtonActionConfirmation.create(payloadBundle.content),
            messageId: payloadBundle.id,
        });
    }
    generateCompositeGenericMessage(payloadBundle) {
        return protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.COMPOSITE]: protocol_messaging_1.Composite.create(payloadBundle.content),
            messageId: payloadBundle.id,
        });
    }
    generateConfirmationGenericMessage(payloadBundle) {
        const content = protocol_messaging_1.Confirmation.create(payloadBundle.content);
        return protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.CONFIRMATION]: content,
            messageId: payloadBundle.id,
        });
    }
    generateEditedTextGenericMessage(payloadBundle) {
        const editedMessage = protocol_messaging_1.MessageEdit.create({
            replacingMessageId: payloadBundle.content.originalMessageId,
            text: MessageToProtoMapper_1.MessageToProtoMapper.mapText(payloadBundle),
        });
        return protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.EDITED]: editedMessage,
            messageId: payloadBundle.id,
        });
    }
    generateFileDataGenericMessage(payloadBundle) {
        if (!payloadBundle.content) {
            throw new Error('No content for sendFileData provided.');
        }
        const { asset, expectsReadConfirmation, legalHoldStatus } = payloadBundle.content;
        const remoteData = protocol_messaging_1.Asset.RemoteData.create({
            assetId: asset.key,
            assetToken: asset.token,
            otrKey: asset.keyBytes,
            sha256: asset.sha256,
            assetDomain: asset.domain,
        });
        const assetMessage = protocol_messaging_1.Asset.create({
            expectsReadConfirmation,
            legalHoldStatus,
            uploaded: remoteData,
        });
        assetMessage.status = conversation_2.AssetTransferState.UPLOADED;
        const genericMessage = protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.ASSET]: assetMessage,
            messageId: payloadBundle.id,
        });
        const expireAfterMillis = this.messageTimer.getMessageTimer(payloadBundle.conversation);
        return expireAfterMillis > 0 ? this.createEphemeral(genericMessage, expireAfterMillis) : genericMessage;
    }
    generateFileMetaDataGenericMessage(payloadBundle) {
        if (!payloadBundle.content) {
            throw new Error('No content for sendFileMetaData provided.');
        }
        const { expectsReadConfirmation, legalHoldStatus, metaData } = payloadBundle.content;
        const original = protocol_messaging_1.Asset.Original.create({
            audio: metaData.audio,
            mimeType: metaData.type,
            name: metaData.name,
            size: metaData.length,
            video: metaData.video,
            image: metaData.image,
        });
        const assetMessage = protocol_messaging_1.Asset.create({
            expectsReadConfirmation,
            legalHoldStatus,
            original,
        });
        const genericMessage = protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.ASSET]: assetMessage,
            messageId: payloadBundle.id,
        });
        const expireAfterMillis = this.messageTimer.getMessageTimer(payloadBundle.conversation);
        return expireAfterMillis > 0 ? this.createEphemeral(genericMessage, expireAfterMillis) : genericMessage;
    }
    generateFileAbortGenericMessage(payloadBundle) {
        if (!payloadBundle.content) {
            throw new Error('No content for sendFileAbort provided.');
        }
        const { expectsReadConfirmation, legalHoldStatus, reason } = payloadBundle.content;
        const assetMessage = protocol_messaging_1.Asset.create({
            expectsReadConfirmation,
            legalHoldStatus,
            notUploaded: reason,
        });
        assetMessage.status = conversation_2.AssetTransferState.NOT_UPLOADED;
        const genericMessage = protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.ASSET]: assetMessage,
            messageId: payloadBundle.id,
        });
        const expireAfterMillis = this.messageTimer.getMessageTimer(payloadBundle.conversation);
        return expireAfterMillis > 0 ? this.createEphemeral(genericMessage, expireAfterMillis) : genericMessage;
    }
    generateImageGenericMessage(payloadBundle) {
        if (!payloadBundle.content) {
            throw new Error('No content for sendImage provided.');
        }
        const { asset, expectsReadConfirmation, image, legalHoldStatus } = payloadBundle.content;
        const imageMetadata = protocol_messaging_1.Asset.ImageMetaData.create({
            height: image.height,
            width: image.width,
        });
        const original = protocol_messaging_1.Asset.Original.create({
            [conversation_2.GenericMessageType.IMAGE]: imageMetadata,
            mimeType: image.type,
            name: null,
            size: image.data.length,
        });
        const remoteData = protocol_messaging_1.Asset.RemoteData.create({
            assetId: asset.key,
            assetToken: asset.token,
            assetDomain: asset.domain,
            otrKey: asset.keyBytes,
            sha256: asset.sha256,
        });
        const assetMessage = protocol_messaging_1.Asset.create({
            expectsReadConfirmation,
            legalHoldStatus,
            original,
            uploaded: remoteData,
        });
        assetMessage.status = conversation_2.AssetTransferState.UPLOADED;
        let genericMessage = protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.ASSET]: assetMessage,
            messageId: payloadBundle.id,
        });
        const expireAfterMillis = this.messageTimer.getMessageTimer(payloadBundle.conversation);
        if (expireAfterMillis) {
            genericMessage = this.createEphemeral(genericMessage, expireAfterMillis);
        }
        return { content: assetMessage, genericMessage };
    }
    generateLocationGenericMessage(payloadBundle) {
        const { expectsReadConfirmation, latitude, legalHoldStatus, longitude, name, zoom } = payloadBundle.content;
        const locationMessage = protocol_messaging_1.Location.create({
            expectsReadConfirmation,
            latitude,
            legalHoldStatus,
            longitude,
            name,
            zoom,
        });
        const genericMessage = protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.LOCATION]: locationMessage,
            messageId: payloadBundle.id,
        });
        const expireAfterMillis = this.messageTimer.getMessageTimer(payloadBundle.conversation);
        return expireAfterMillis > 0 ? this.createEphemeral(genericMessage, expireAfterMillis) : genericMessage;
    }
    generatePingGenericMessage(payloadBundle) {
        const content = protocol_messaging_1.Knock.create(payloadBundle.content);
        const genericMessage = protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.KNOCK]: content,
            messageId: payloadBundle.id,
        });
        const expireAfterMillis = this.messageTimer.getMessageTimer(payloadBundle.conversation);
        return expireAfterMillis > 0 ? this.createEphemeral(genericMessage, expireAfterMillis) : genericMessage;
    }
    generateReactionGenericMessage(payloadBundle) {
        const { legalHoldStatus, originalMessageId, type } = payloadBundle.content;
        const reaction = protocol_messaging_1.Reaction.create({
            emoji: type,
            legalHoldStatus,
            messageId: originalMessageId,
        });
        const genericMessage = protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.REACTION]: reaction,
            messageId: payloadBundle.id,
        });
        return genericMessage;
    }
    generateSessionResetGenericMessage(payloadBundle) {
        return protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.CLIENT_ACTION]: protocol_messaging_1.ClientAction.RESET_SESSION,
            messageId: payloadBundle.id,
        });
    }
    generateCallGenericMessage(payloadBundle) {
        const callMessage = protocol_messaging_1.Calling.create({
            content: payloadBundle.content,
        });
        return protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.CALLING]: callMessage,
            messageId: payloadBundle.id,
        });
    }
    generateTextGenericMessage(payloadBundle) {
        const genericMessage = protocol_messaging_1.GenericMessage.create({
            messageId: payloadBundle.id,
            [conversation_2.GenericMessageType.TEXT]: MessageToProtoMapper_1.MessageToProtoMapper.mapText(payloadBundle),
        });
        const expireAfterMillis = this.messageTimer.getMessageTimer(payloadBundle.conversation);
        return expireAfterMillis > 0 ? this.createEphemeral(genericMessage, expireAfterMillis) : genericMessage;
    }
    async clearConversation(conversationId, timestamp = new Date(), messageId = MessageBuilder_1.MessageBuilder.createId(), sendAsProtobuf) {
        if (timestamp instanceof Date) {
            timestamp = timestamp.getTime();
        }
        const content = {
            clearedTimestamp: timestamp,
            conversationId,
        };
        const clearedMessage = protocol_messaging_1.Cleared.create(content);
        const genericMessage = protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.CLEARED]: clearedMessage,
            messageId,
        });
        const { id: selfConversationId, domain } = await this.getSelfConversationId();
        await this.sendGenericMessage(this.apiClient.validatedClientId, selfConversationId, genericMessage, {
            conversationDomain: domain,
            sendAsProtobuf,
        });
        return {
            content,
            conversation: conversationId,
            from: this.apiClient.context.userId,
            id: messageId,
            messageTimer: 0,
            source: conversation_2.PayloadBundleSource.LOCAL,
            state: conversation_2.PayloadBundleState.OUTGOING_SENT,
            timestamp: Date.now(),
            type: conversation_2.PayloadBundleType.CONVERSATION_CLEAR,
        };
    }
    /**
     * Sends a LastRead message to the current user's self conversation.
     * This will allow all the user's devices to compute which messages are unread
     *
     * @param conversationId The conversation which has been read
     * @param lastReadTimestamp The timestamp at which the conversation was read
     * @param sendingOptions?
     * @return Resolves when the message has been sent
     */
    async sendLastRead(conversationId, lastReadTimestamp, sendingOptions) {
        const lastRead = new protocol_messaging_1.LastRead({
            conversationId,
            lastReadTimestamp,
        });
        const genericMessage = protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.LAST_READ]: lastRead,
            messageId: MessageBuilder_1.MessageBuilder.createId(),
        });
        const { id: selfConversationId, domain: selfConversationDomain } = await this.getSelfConversationId();
        return this.sendGenericMessage(this.apiClient.validatedClientId, selfConversationId, genericMessage, Object.assign({ conversationDomain: selfConversationDomain }, sendingOptions));
    }
    /**
     * Syncs all self user's devices with the countly id
     *
     * @param countlyId The countly id of the current device
     * @param sendingOptions?
     * @return Resolves when the message has been sent
     */
    async sendCountlySync(countlyId, sendingOptions) {
        const { id: selfConversationId, domain: selfConversationDomain } = await this.getSelfConversationId();
        const dataTransfer = new protocol_messaging_1.DataTransfer({
            trackingIdentifier: {
                identifier: countlyId,
            },
        });
        const genericMessage = new protocol_messaging_1.GenericMessage({
            [conversation_2.GenericMessageType.DATA_TRANSFER]: dataTransfer,
            messageId: MessageBuilder_1.MessageBuilder.createId(),
        });
        return this.sendGenericMessage(this.apiClient.validatedClientId, selfConversationId, genericMessage, Object.assign({ conversationDomain: selfConversationDomain }, sendingOptions));
    }
    /**
     * Get a fresh list from backend of clients for all the participants of the conversation.
     * This is a hacky way of getting all the clients for a conversation.
     * The idea is to send an empty message to the backend to absolutely no users and let backend reply with a mismatch error.
     * We then get the missing members in the mismatch, that is our fresh list of participants' clients.
     *
     * @param {string} conversationId
     * @param {string} conversationDomain? - If given will send the message to the new qualified endpoint
     */
    getAllParticipantsClients(conversationId, conversationDomain) {
        const sendingClientId = this.apiClient.validatedClientId;
        const recipients = {};
        const text = new Uint8Array();
        return new Promise(async (resolve) => {
            const onClientMismatch = (mismatch) => {
                resolve(mismatch.missing);
                // When the mismatch happens, we ask the messageService to cancel the sending
                return false;
            };
            if (conversationDomain && this.config.useQualifiedIds) {
                await this.messageService.sendFederatedMessage(sendingClientId, recipients, text, {
                    conversationId: { id: conversationId, domain: conversationDomain },
                    onClientMismatch,
                    reportMissing: true,
                });
            }
            else {
                await this.messageService.sendMessage(sendingClientId, recipients, text, {
                    conversationId,
                    onClientMismatch,
                });
            }
        });
    }
    async deleteMessageLocal(conversationId, messageIdToHide, sendAsProtobuf, conversationDomain) {
        const messageId = MessageBuilder_1.MessageBuilder.createId();
        const content = protocol_messaging_1.MessageHide.create({
            conversationId,
            messageId: messageIdToHide,
        });
        const genericMessage = protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.HIDDEN]: content,
            messageId,
        });
        const { id: selfConversationId } = await this.getSelfConversationId();
        await this.sendGenericMessage(this.apiClient.validatedClientId, selfConversationId, genericMessage, {
            sendAsProtobuf,
            conversationDomain,
        });
        return {
            content,
            conversation: conversationId,
            from: this.apiClient.context.userId,
            id: messageId,
            messageTimer: this.messageTimer.getMessageTimer(conversationId),
            source: conversation_2.PayloadBundleSource.LOCAL,
            state: conversation_2.PayloadBundleState.OUTGOING_SENT,
            timestamp: Date.now(),
            type: conversation_2.PayloadBundleType.MESSAGE_HIDE,
        };
    }
    async deleteMessageEveryone(conversationId, messageIdToDelete, userIds, sendAsProtobuf, conversationDomain, callbacks) {
        var _a, _b;
        const messageId = MessageBuilder_1.MessageBuilder.createId();
        const content = protocol_messaging_1.MessageDelete.create({
            messageId: messageIdToDelete,
        });
        const genericMessage = protocol_messaging_1.GenericMessage.create({
            [conversation_2.GenericMessageType.DELETED]: content,
            messageId,
        });
        (_a = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onStart) === null || _a === void 0 ? void 0 : _a.call(callbacks, genericMessage);
        const response = await this.sendGenericMessage(this.apiClient.validatedClientId, conversationId, genericMessage, {
            userIds,
            sendAsProtobuf,
            conversationDomain,
        });
        (_b = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onSuccess) === null || _b === void 0 ? void 0 : _b.call(callbacks, genericMessage, response === null || response === void 0 ? void 0 : response.time);
        return {
            content,
            conversation: conversationId,
            from: this.apiClient.context.userId,
            id: messageId,
            messageTimer: this.messageTimer.getMessageTimer(conversationId),
            source: conversation_2.PayloadBundleSource.LOCAL,
            state: conversation_2.PayloadBundleState.OUTGOING_SENT,
            timestamp: Date.now(),
            type: conversation_2.PayloadBundleType.MESSAGE_DELETE,
        };
    }
    leaveConversation(conversationId) {
        return this.apiClient.api.conversation.deleteMember(conversationId, this.apiClient.context.userId);
    }
    async leaveConversations(conversationIds) {
        if (!conversationIds) {
            const conversation = await this.getConversations();
            conversationIds = conversation
                .filter(conversation => conversation.type === conversation_1.CONVERSATION_TYPE.REGULAR)
                .map(conversation => conversation.id);
        }
        return Promise.all(conversationIds.map(conversationId => this.leaveConversation(conversationId)));
    }
    createConversation(conversationData, otherUserIds) {
        let payload;
        if (typeof conversationData === 'string') {
            const ids = typeof otherUserIds === 'string' ? [otherUserIds] : otherUserIds;
            payload = {
                name: conversationData,
                receipt_mode: null,
                users: ids !== null && ids !== void 0 ? ids : [],
            };
        }
        else {
            payload = conversationData;
        }
        return this.apiClient.api.conversation.postConversation(payload);
    }
    async getConversations(conversationIds) {
        if (!conversationIds || !conversationIds.length) {
            return this.apiClient.api.conversation.getAllConversations();
        }
        if (typeof conversationIds === 'string') {
            return this.apiClient.api.conversation.getConversation(conversationIds);
        }
        return this.apiClient.api.conversation.getConversationsByIds(conversationIds);
    }
    async getAsset({ assetId, assetToken, otrKey, sha256 }) {
        const request = this.apiClient.api.asset.getAssetV3(assetId, assetToken);
        const encryptedBuffer = (await request.response).buffer;
        return (0, AssetCryptography_1.decryptAsset)({
            cipherText: new Uint8Array(encryptedBuffer),
            keyBytes: otrKey,
            sha256: sha256,
        });
    }
    async getUnencryptedAsset(assetId, assetToken) {
        const request = await this.apiClient.api.asset.getAssetV3(assetId, assetToken);
        return (await request.response).buffer;
    }
    async addUser(conversationId, userIds) {
        const ids = Array.isArray(userIds) ? userIds : [userIds];
        const qualifiedIds = (0, TypePredicateUtil_1.isStringArray)(ids) ? ids.map(id => ({ id, domain: '' })) : ids;
        await this.apiClient.api.conversation.postMembers(conversationId, qualifiedIds);
        return qualifiedIds;
    }
    async removeUser(conversationId, userId) {
        await this.apiClient.api.conversation.deleteMember(conversationId, userId);
        return userId;
    }
    /**
     * Sends a message to a conversation
     *
     * @param params.payloadBundle The message to send to the conversation
     * @param params.userIds? Can be either a QualifiedId[], string[], UserClients or QualfiedUserClients. The type has some effect on the behavior of the method.
     *    When given a QualifiedId[] or string[] the method will fetch the freshest list of devices for those users (since they are not given by the consumer). As a consequence no ClientMismatch error will trigger and we will ignore missing clients when sending
     *    When given a QualifiedUserClients or UserClients the method will only send to the clients listed in the userIds. This could lead to ClientMismatch (since the given list of devices might not be the freshest one and new clients could have been created)
     *    When given a QualifiedId[] or QualifiedUserClients the method will send the message through the federated API endpoint
     *    When given a string[] or UserClients the method will send the message through the old API endpoint
     * @return resolves with the sent message
     */
    async send({ payloadBundle, userIds, sendAsProtobuf, conversationDomain, nativePush, targetMode, callbacks, }) {
        var _a, _b, _c, _d;
        let genericMessage;
        let processedContent = undefined;
        switch (payloadBundle.type) {
            case conversation_2.PayloadBundleType.ASSET:
                genericMessage = this.generateFileDataGenericMessage(payloadBundle);
                break;
            case conversation_2.PayloadBundleType.ASSET_ABORT:
                genericMessage = this.generateFileAbortGenericMessage(payloadBundle);
                break;
            case conversation_2.PayloadBundleType.ASSET_META:
                genericMessage = this.generateFileMetaDataGenericMessage(payloadBundle);
                break;
            case conversation_2.PayloadBundleType.ASSET_IMAGE:
                const res = this.generateImageGenericMessage(payloadBundle);
                genericMessage = res.genericMessage;
                processedContent = res.content;
                break;
            case conversation_2.PayloadBundleType.BUTTON_ACTION:
                genericMessage = this.generateButtonActionGenericMessage(payloadBundle);
                break;
            case conversation_2.PayloadBundleType.BUTTON_ACTION_CONFIRMATION:
                genericMessage = this.generateButtonActionConfirmationGenericMessage(payloadBundle);
                break;
            case conversation_2.PayloadBundleType.CALL:
                genericMessage = this.generateCallGenericMessage(payloadBundle);
                break;
            case conversation_2.PayloadBundleType.CLIENT_ACTION: {
                if (payloadBundle.content.clientAction !== protocol_messaging_1.ClientAction.RESET_SESSION) {
                    throw new Error(`No send method implemented for "${payloadBundle.type}" and ClientAction "${payloadBundle.content}".`);
                }
                genericMessage = this.generateSessionResetGenericMessage(payloadBundle);
                break;
            }
            case conversation_2.PayloadBundleType.COMPOSITE:
                genericMessage = this.generateCompositeGenericMessage(payloadBundle);
                break;
            case conversation_2.PayloadBundleType.CONFIRMATION:
                genericMessage = this.generateConfirmationGenericMessage(payloadBundle);
                break;
            case conversation_2.PayloadBundleType.LOCATION:
                genericMessage = this.generateLocationGenericMessage(payloadBundle);
                break;
            case conversation_2.PayloadBundleType.MESSAGE_EDIT:
                genericMessage = this.generateEditedTextGenericMessage(payloadBundle);
                break;
            case conversation_2.PayloadBundleType.PING:
                genericMessage = this.generatePingGenericMessage(payloadBundle);
                break;
            case conversation_2.PayloadBundleType.REACTION:
                genericMessage = this.generateReactionGenericMessage(payloadBundle);
                break;
            case conversation_2.PayloadBundleType.TEXT:
                genericMessage = this.generateTextGenericMessage(payloadBundle);
                break;
            default:
                throw new Error(`No send method implemented for "${payloadBundle['type']}".`);
        }
        if ((await ((_a = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onStart) === null || _a === void 0 ? void 0 : _a.call(callbacks, genericMessage))) === false) {
            // If the onStart call returns false, it means the consumer wants to cancel the message sending
            return Object.assign(Object.assign({}, payloadBundle), { state: conversation_2.PayloadBundleState.CANCELLED });
        }
        const response = await this.sendGenericMessage(this.apiClient.validatedClientId, payloadBundle.conversation, genericMessage, {
            userIds,
            sendAsProtobuf,
            conversationDomain,
            nativePush,
            targetMode,
            onClientMismatch: callbacks === null || callbacks === void 0 ? void 0 : callbacks.onClientMismatch,
        });
        if (!response.errored) {
            if (!this.isClearFromMismatch(response)) {
                // We warn the consumer that there is a mismatch that did not prevent message sending
                await ((_b = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onClientMismatch) === null || _b === void 0 ? void 0 : _b.call(callbacks, response, true));
            }
            (_c = callbacks === null || callbacks === void 0 ? void 0 : callbacks.onSuccess) === null || _c === void 0 ? void 0 : _c.call(callbacks, genericMessage, response.time);
        }
        return Object.assign(Object.assign({}, payloadBundle), { content: processedContent || payloadBundle.content, messageTimer: ((_d = genericMessage.ephemeral) === null || _d === void 0 ? void 0 : _d.expireAfterMillis) || 0, state: response.errored ? conversation_2.PayloadBundleState.CANCELLED : conversation_2.PayloadBundleState.OUTGOING_SENT });
    }
    sendTypingStart(conversationId) {
        return this.apiClient.api.conversation.postTyping(conversationId, { status: data_1.CONVERSATION_TYPING.STARTED });
    }
    sendTypingStop(conversationId) {
        return this.apiClient.api.conversation.postTyping(conversationId, { status: data_1.CONVERSATION_TYPING.STOPPED });
    }
    setConversationMutedStatus(conversationId, status, muteTimestamp) {
        if (typeof muteTimestamp === 'number') {
            muteTimestamp = new Date(muteTimestamp);
        }
        const payload = {
            otr_muted_ref: muteTimestamp.toISOString(),
            otr_muted_status: status,
        };
        return this.apiClient.api.conversation.putMembershipProperties(conversationId, payload);
    }
    toggleArchiveConversation(conversationId, archived, archiveTimestamp = new Date()) {
        if (typeof archiveTimestamp === 'number') {
            archiveTimestamp = new Date(archiveTimestamp);
        }
        const payload = {
            otr_archived: archived,
            otr_archived_ref: archiveTimestamp.toISOString(),
        };
        return this.apiClient.api.conversation.putMembershipProperties(conversationId, payload);
    }
    setMemberConversationRole(conversationId, userId, conversationRole) {
        return this.apiClient.api.conversation.putOtherMember(userId, conversationId, {
            conversation_role: conversationRole,
        });
    }
    isClearFromMismatch(mismatch) {
        const hasMissing = Object.keys(mismatch.missing || {}).length > 0;
        const hasDeleted = Object.keys(mismatch.deleted || {}).length > 0;
        const hasRedundant = Object.keys(mismatch.redundant || {}).length > 0;
        const hasFailed = Object.keys(mismatch.failed_to_send || {}).length > 0;
        return !hasMissing && !hasDeleted && !hasRedundant && !hasFailed;
    }
}
exports.ConversationService = ConversationService;
//# sourceMappingURL=ConversationService.js.map