/// <reference types="node" />
import type { APIClient } from '@wireapp/api-client';
import * as Events from '@wireapp/api-client/src/event';
import type { Notification } from '@wireapp/api-client/src/notification/';
import { CRUDEngine } from '@wireapp/store-engine';
import { EventEmitter } from 'events';
import { PayloadBundle, PayloadBundleSource } from '../conversation';
import { NotificationError } from '../CoreError';
import type { CryptographyService } from '../cryptography';
import { GenericMessage } from '@wireapp/protocol-messaging';
export declare type HandledEventPayload = {
    event: Events.BackendEvent;
    mappedEvent?: PayloadBundle;
    decryptedData?: GenericMessage;
    decryptionError?: {
        code: number;
        message: string;
    };
};
declare enum TOPIC {
    NOTIFICATION_ERROR = "NotificationService.TOPIC.NOTIFICATION_ERROR"
}
export declare type NotificationHandler = (notification: Notification, source: PayloadBundleSource, progress: {
    done: number;
    total: number;
}) => Promise<void>;
export interface NotificationService {
    on(event: TOPIC.NOTIFICATION_ERROR, listener: (payload: NotificationError) => void): this;
}
export declare class NotificationService extends EventEmitter {
    private readonly apiClient;
    private readonly backend;
    private readonly cryptographyService;
    private readonly database;
    private readonly logger;
    static readonly TOPIC: typeof TOPIC;
    constructor(apiClient: APIClient, cryptographyService: CryptographyService, storeEngine: CRUDEngine);
    private getAllNotifications;
    /** Should only be called with a completely new client. */
    initializeNotificationStream(): Promise<string>;
    hasHistory(): Promise<boolean>;
    getNotificationEventList(): Promise<Events.BackendEvent[]>;
    setLastEventDate(eventDate: Date): Promise<Date>;
    setLastNotificationId(lastNotification: Notification): Promise<string>;
    handleNotificationStream(notificationHandler: NotificationHandler): Promise<void>;
    handleNotification(notification: Notification, source: PayloadBundleSource): AsyncGenerator<HandledEventPayload>;
    private cleanupPayloadBundle;
    private handleEvent;
}
export {};
