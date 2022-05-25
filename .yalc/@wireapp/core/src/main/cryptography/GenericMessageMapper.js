"use strict";
/*
 * Wire
 * Copyright (C) 2019 Wire Swiss GmbH
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
exports.GenericMessageMapper = void 0;
const logdown_1 = __importDefault(require("logdown"));
const conversation_1 = require("../conversation");
class GenericMessageMapper {
    // TODO: Turn "any" into a specific type (or collection of types) and make the return type more specific based on the
    // "genericMessage" input parameter.
    static mapGenericMessage(genericMessage, event, source) {
        const baseMessage = {
            conversation: event.conversation,
            qualifiedConversation: event.qualified_conversation,
            qualifiedFrom: event.qualified_from,
            fromClientId: event.data.sender,
            from: event.from,
            state: conversation_1.PayloadBundleState.INCOMING,
            timestamp: new Date(event.time).getTime(),
            id: genericMessage.messageId,
            messageTimer: 0,
            source,
        };
        switch (genericMessage.content) {
            case conversation_1.GenericMessageType.TEXT: {
                const { content: text, expectsReadConfirmation, legalHoldStatus, linkPreview: linkPreviews, mentions, quote, } = genericMessage[conversation_1.GenericMessageType.TEXT];
                const content = { expectsReadConfirmation, legalHoldStatus, text };
                if (linkPreviews === null || linkPreviews === void 0 ? void 0 : linkPreviews.length) {
                    content.linkPreviews = linkPreviews;
                }
                if (mentions === null || mentions === void 0 ? void 0 : mentions.length) {
                    content.mentions = mentions;
                }
                if (quote) {
                    content.quote = quote;
                }
                if (typeof legalHoldStatus !== 'undefined') {
                    content.legalHoldStatus = legalHoldStatus;
                }
                return Object.assign(Object.assign({}, baseMessage), { content, type: conversation_1.PayloadBundleType.TEXT });
            }
            case conversation_1.GenericMessageType.BUTTON_ACTION: {
                return Object.assign(Object.assign({}, baseMessage), { content: genericMessage.buttonAction, type: conversation_1.PayloadBundleType.BUTTON_ACTION });
            }
            case conversation_1.GenericMessageType.CALLING: {
                return Object.assign(Object.assign({}, baseMessage), { content: genericMessage.calling.content, type: conversation_1.PayloadBundleType.CALL });
            }
            case conversation_1.GenericMessageType.CONFIRMATION: {
                const { firstMessageId, moreMessageIds, type } = genericMessage[conversation_1.GenericMessageType.CONFIRMATION];
                const content = { firstMessageId, moreMessageIds, type };
                return Object.assign(Object.assign({}, baseMessage), { content, type: conversation_1.PayloadBundleType.CONFIRMATION });
            }
            case conversation_1.GenericMessageType.CLEARED: {
                const content = genericMessage[conversation_1.GenericMessageType.CLEARED];
                return Object.assign(Object.assign({}, baseMessage), { content, type: conversation_1.PayloadBundleType.CONVERSATION_CLEAR });
            }
            case conversation_1.GenericMessageType.DELETED: {
                const originalMessageId = genericMessage[conversation_1.GenericMessageType.DELETED].messageId;
                const content = { messageId: originalMessageId };
                return Object.assign(Object.assign({}, baseMessage), { content, type: conversation_1.PayloadBundleType.MESSAGE_DELETE });
            }
            case conversation_1.GenericMessageType.EDITED: {
                const { expectsReadConfirmation, text: { content: editedText, legalHoldStatus, linkPreview: editedLinkPreviews, mentions: editedMentions, quote: editedQuote, }, replacingMessageId, } = genericMessage[conversation_1.GenericMessageType.EDITED];
                const content = {
                    expectsReadConfirmation,
                    legalHoldStatus,
                    originalMessageId: replacingMessageId,
                    text: editedText,
                };
                if (editedLinkPreviews === null || editedLinkPreviews === void 0 ? void 0 : editedLinkPreviews.length) {
                    content.linkPreviews = editedLinkPreviews;
                }
                if (editedMentions === null || editedMentions === void 0 ? void 0 : editedMentions.length) {
                    content.mentions = editedMentions;
                }
                if (editedQuote) {
                    content.quote = editedQuote;
                }
                return Object.assign(Object.assign({}, baseMessage), { content, type: conversation_1.PayloadBundleType.MESSAGE_EDIT });
            }
            case conversation_1.GenericMessageType.HIDDEN: {
                const { conversationId, messageId } = genericMessage[conversation_1.GenericMessageType.HIDDEN];
                const content = {
                    conversationId,
                    messageId,
                };
                return Object.assign(Object.assign({}, baseMessage), { content, type: conversation_1.PayloadBundleType.MESSAGE_HIDE });
            }
            case conversation_1.GenericMessageType.KNOCK: {
                const { expectsReadConfirmation, legalHoldStatus } = genericMessage[conversation_1.GenericMessageType.KNOCK];
                const content = { expectsReadConfirmation, hotKnock: false, legalHoldStatus };
                return Object.assign(Object.assign({}, baseMessage), { content, type: conversation_1.PayloadBundleType.PING });
            }
            case conversation_1.GenericMessageType.LOCATION: {
                const { expectsReadConfirmation, latitude, legalHoldStatus, longitude, name, zoom } = genericMessage[conversation_1.GenericMessageType.LOCATION];
                const content = {
                    expectsReadConfirmation,
                    latitude,
                    legalHoldStatus,
                    longitude,
                    name,
                    zoom,
                };
                return Object.assign(Object.assign({}, baseMessage), { content, type: conversation_1.PayloadBundleType.LOCATION });
            }
            case conversation_1.GenericMessageType.ASSET: {
                const { expectsReadConfirmation, legalHoldStatus, notUploaded, original, preview, status, uploaded } = genericMessage[conversation_1.GenericMessageType.ASSET];
                const isImage = !!(uploaded === null || uploaded === void 0 ? void 0 : uploaded.assetId) && !!(original === null || original === void 0 ? void 0 : original.image);
                const content = {
                    abortReason: notUploaded,
                    expectsReadConfirmation,
                    legalHoldStatus,
                    original,
                    preview,
                    status,
                    uploaded,
                };
                return Object.assign(Object.assign({}, baseMessage), { content, type: isImage ? conversation_1.PayloadBundleType.ASSET_IMAGE : conversation_1.PayloadBundleType.ASSET });
            }
            case conversation_1.GenericMessageType.REACTION: {
                const { emoji, legalHoldStatus, messageId } = genericMessage[conversation_1.GenericMessageType.REACTION];
                const content = {
                    legalHoldStatus,
                    originalMessageId: messageId,
                    type: emoji,
                };
                return Object.assign(Object.assign({}, baseMessage), { content, type: conversation_1.PayloadBundleType.REACTION });
            }
            default: {
                this.logger.warn(`Unhandled event type "${genericMessage.content}": ${JSON.stringify(genericMessage)}`);
                return Object.assign(Object.assign({}, baseMessage), { content: genericMessage.content, type: conversation_1.PayloadBundleType.UNKNOWN });
            }
        }
    }
}
exports.GenericMessageMapper = GenericMessageMapper;
GenericMessageMapper.logger = (0, logdown_1.default)('@wireapp/core/cryptography/GenericMessageMapper', {
    logger: console,
    markdown: false,
});
//# sourceMappingURL=GenericMessageMapper.js.map