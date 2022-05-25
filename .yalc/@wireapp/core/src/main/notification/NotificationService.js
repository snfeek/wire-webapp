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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const Events = __importStar(require("@wireapp/api-client/src/event"));
const store_engine_1 = require("@wireapp/store-engine");
const events_1 = require("events");
const logdown_1 = __importDefault(require("logdown"));
const conversation_1 = require("../conversation");
const ConversationMapper_1 = require("../conversation/ConversationMapper");
const CoreError_1 = require("../CoreError");
const UserMapper_1 = require("../user/UserMapper");
const NotificationBackendRepository_1 = require("./NotificationBackendRepository");
const NotificationDatabaseRepository_1 = require("./NotificationDatabaseRepository");
var TOPIC;
(function (TOPIC) {
    TOPIC["NOTIFICATION_ERROR"] = "NotificationService.TOPIC.NOTIFICATION_ERROR";
})(TOPIC || (TOPIC = {}));
class NotificationService extends events_1.EventEmitter {
    constructor(apiClient, cryptographyService, storeEngine) {
        super();
        this.logger = (0, logdown_1.default)('@wireapp/core/notification/NotificationService', {
            logger: console,
            markdown: false,
        });
        this.apiClient = apiClient;
        this.cryptographyService = cryptographyService;
        this.backend = new NotificationBackendRepository_1.NotificationBackendRepository(this.apiClient);
        this.database = new NotificationDatabaseRepository_1.NotificationDatabaseRepository(storeEngine);
    }
    async getAllNotifications() {
        const clientId = this.apiClient.clientId;
        const lastNotificationId = await this.database.getLastNotificationId();
        return this.backend.getAllNotifications(clientId, lastNotificationId);
    }
    /** Should only be called with a completely new client. */
    async initializeNotificationStream() {
        const clientId = this.apiClient.clientId;
        await this.setLastEventDate(new Date(0));
        const latestNotification = await this.backend.getLastNotification(clientId);
        return this.setLastNotificationId(latestNotification);
    }
    async hasHistory() {
        const notificationEvents = await this.getNotificationEventList();
        return !!notificationEvents.length;
    }
    getNotificationEventList() {
        return this.database.getNotificationEventList();
    }
    async setLastEventDate(eventDate) {
        let databaseLastEventDate;
        try {
            databaseLastEventDate = await this.database.getLastEventDate();
        }
        catch (error) {
            if (error instanceof store_engine_1.error.RecordNotFoundError ||
                error.constructor.name === store_engine_1.error.RecordNotFoundError.name) {
                return this.database.createLastEventDate(eventDate);
            }
            throw error;
        }
        if (databaseLastEventDate && eventDate > databaseLastEventDate) {
            return this.database.updateLastEventDate(eventDate);
        }
        return databaseLastEventDate;
    }
    async setLastNotificationId(lastNotification) {
        return this.database.updateLastNotificationId(lastNotification);
    }
    async handleNotificationStream(notificationHandler) {
        const notifications = await this.getAllNotifications();
        for (const [index, notification] of notifications.entries()) {
            await notificationHandler(notification, conversation_1.PayloadBundleSource.NOTIFICATION_STREAM, {
                done: index + 1,
                total: notifications.length,
            }).catch(error => this.logger.error(error));
        }
    }
    handleNotification(notification, source) {
        return __asyncGenerator(this, arguments, function* handleNotification_1() {
            for (const event of notification.payload) {
                this.logger.log(`Handling event of type "${event.type}" for notification with ID "${notification.id}"`, event);
                try {
                    const data = yield __await(this.handleEvent(event, source));
                    if (!notification.transient) {
                        // keep track of the last handled notification for next time we fetch the notification stream
                        yield __await(this.setLastNotificationId(notification));
                    }
                    yield yield __await(Object.assign(Object.assign({}, data), { mappedEvent: data.mappedEvent ? this.cleanupPayloadBundle(data.mappedEvent) : undefined }));
                }
                catch (error) {
                    this.logger.error(`There was an error with notification ID "${notification.id}": ${error.message}`, error);
                    const notificationError = {
                        error: error,
                        notification,
                        type: CoreError_1.CoreError.NOTIFICATION_ERROR,
                    };
                    this.emit(NotificationService.TOPIC.NOTIFICATION_ERROR, notificationError);
                }
            }
            if (!notification.transient) {
                // keep track of the last handled notification for next time we fetch the notification stream
                yield __await(this.setLastNotificationId(notification));
            }
        });
    }
    cleanupPayloadBundle(payload) {
        switch (payload.type) {
            case conversation_1.PayloadBundleType.ASSET: {
                const assetContent = payload.content;
                const isMetaData = !!assetContent && !!assetContent.original && !assetContent.uploaded;
                const isAbort = !!assetContent.abortReason || (!assetContent.original && !assetContent.uploaded);
                if (isMetaData) {
                    payload.type = conversation_1.PayloadBundleType.ASSET_META;
                }
                else if (isAbort) {
                    payload.type = conversation_1.PayloadBundleType.ASSET_ABORT;
                }
                return payload;
            }
            default:
                return payload;
        }
    }
    async handleEvent(event, source) {
        switch (event.type) {
            // Encrypted events
            case Events.CONVERSATION_EVENT.OTR_MESSAGE_ADD: {
                try {
                    const decryptedData = await this.cryptographyService.decryptMessage(event);
                    return {
                        mappedEvent: this.cryptographyService.mapGenericMessage(event, decryptedData, source),
                        event,
                        decryptedData,
                    };
                }
                catch (error) {
                    return { event, decryptionError: error };
                }
            }
            // Meta events
            case Events.CONVERSATION_EVENT.MEMBER_JOIN:
            case Events.CONVERSATION_EVENT.MESSAGE_TIMER_UPDATE:
            case Events.CONVERSATION_EVENT.RENAME:
            case Events.CONVERSATION_EVENT.TYPING: {
                const { conversation, from } = event;
                const metaEvent = Object.assign(Object.assign({}, event), { conversation, from });
                return { mappedEvent: ConversationMapper_1.ConversationMapper.mapConversationEvent(metaEvent, source), event };
            }
            // User events
            case Events.USER_EVENT.CONNECTION:
            case Events.USER_EVENT.CLIENT_ADD:
            case Events.USER_EVENT.UPDATE:
            case Events.USER_EVENT.CLIENT_REMOVE: {
                return { mappedEvent: UserMapper_1.UserMapper.mapUserEvent(event, this.apiClient.context.userId, source), event };
            }
        }
        return { event };
    }
}
exports.NotificationService = NotificationService;
NotificationService.TOPIC = TOPIC;
//# sourceMappingURL=NotificationService.js.map