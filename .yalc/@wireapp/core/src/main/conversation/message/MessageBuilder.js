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
exports.MessageBuilder = void 0;
const protocol_messaging_1 = require("@wireapp/protocol-messaging");
const uuidjs_1 = __importDefault(require("uuidjs"));
const __1 = require("..");
const CompositeContentBuilder_1 = require("./CompositeContentBuilder");
const TextContentBuilder_1 = require("./TextContentBuilder");
function createCommonProperties(options) {
    return {
        id: options.messageId || MessageBuilder.createId(),
        conversation: options.conversationId,
        from: options.from,
        source: __1.PayloadBundleSource.LOCAL,
        state: __1.PayloadBundleState.OUTGOING_UNSENT,
        timestamp: Date.now(),
    };
}
class MessageBuilder {
    static createEditedText(payload) {
        return new TextContentBuilder_1.TextContentBuilder(Object.assign(Object.assign({}, createCommonProperties(payload)), { content: {
                originalMessageId: payload.originalMessageId,
                text: payload.newMessageText,
            }, type: __1.PayloadBundleType.MESSAGE_EDIT }));
    }
    static createFileData(payload) {
        const { asset, expectsReadConfirmation, file, legalHoldStatus, originalMessageId } = payload;
        return Object.assign(Object.assign({}, createCommonProperties(payload)), { content: {
                asset,
                expectsReadConfirmation,
                file,
                legalHoldStatus,
            }, id: originalMessageId, type: __1.PayloadBundleType.ASSET });
    }
    static createFileMetadata(payload) {
        const { expectsReadConfirmation, legalHoldStatus, metaData } = payload;
        return Object.assign(Object.assign({}, createCommonProperties(payload)), { content: {
                expectsReadConfirmation,
                legalHoldStatus,
                metaData,
            }, type: __1.PayloadBundleType.ASSET_META });
    }
    static createFileAbort(payload) {
        const { expectsReadConfirmation, legalHoldStatus, reason } = payload;
        return Object.assign(Object.assign({}, createCommonProperties(payload)), { content: {
                expectsReadConfirmation,
                legalHoldStatus,
                reason,
            }, id: payload.originalMessageId, type: __1.PayloadBundleType.ASSET_ABORT });
    }
    static createImage(payload) {
        const { expectsReadConfirmation, image, asset, legalHoldStatus } = payload;
        return Object.assign(Object.assign({}, createCommonProperties(payload)), { content: {
                expectsReadConfirmation,
                image,
                asset,
                legalHoldStatus,
            }, type: __1.PayloadBundleType.ASSET_IMAGE });
    }
    static createLocation(payload) {
        return Object.assign(Object.assign({}, createCommonProperties(payload)), { content: payload.location, type: __1.PayloadBundleType.LOCATION });
    }
    static createCall(payload) {
        return Object.assign(Object.assign({}, createCommonProperties(payload)), { content: payload.content, type: __1.PayloadBundleType.CALL });
    }
    static createReaction(payload) {
        return Object.assign(Object.assign({}, createCommonProperties(payload)), { content: payload.reaction, type: __1.PayloadBundleType.REACTION });
    }
    static createText(payload) {
        return new TextContentBuilder_1.TextContentBuilder(Object.assign(Object.assign({}, createCommonProperties(payload)), { content: { text: payload.text }, type: __1.PayloadBundleType.TEXT }));
    }
    static createConfirmation(payload) {
        const { firstMessageId, moreMessageIds, type } = payload;
        return Object.assign(Object.assign({}, createCommonProperties(payload)), { content: { firstMessageId, moreMessageIds, type }, type: __1.PayloadBundleType.CONFIRMATION });
    }
    static createButtonActionMessage(payload) {
        return Object.assign(Object.assign({}, createCommonProperties(payload)), { content: payload.content, type: __1.PayloadBundleType.BUTTON_ACTION });
    }
    static createButtonActionConfirmationMessage(payload) {
        return Object.assign(Object.assign({}, createCommonProperties(payload)), { content: payload.content, type: __1.PayloadBundleType.BUTTON_ACTION_CONFIRMATION });
    }
    static createComposite(payload) {
        return new CompositeContentBuilder_1.CompositeContentBuilder(Object.assign(Object.assign({}, createCommonProperties(payload)), { content: {}, type: __1.PayloadBundleType.COMPOSITE }));
    }
    static createPing(payload) {
        return Object.assign(Object.assign({}, createCommonProperties(payload)), { content: payload.ping || { hotKnock: false }, type: __1.PayloadBundleType.PING });
    }
    static createSessionReset(payload) {
        return Object.assign(Object.assign({}, createCommonProperties(payload)), { content: {
                clientAction: protocol_messaging_1.ClientAction.RESET_SESSION,
            }, type: __1.PayloadBundleType.CLIENT_ACTION });
    }
    static createId() {
        return uuidjs_1.default.genV4().toString();
    }
}
exports.MessageBuilder = MessageBuilder;
//# sourceMappingURL=MessageBuilder.js.map