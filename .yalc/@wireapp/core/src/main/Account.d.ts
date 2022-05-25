/// <reference types="node" />
import { APIClient, BackendFeatures } from '@wireapp/api-client';
import type { RegisterData } from '@wireapp/api-client/src/auth';
import { Context, Cookie, LoginData } from '@wireapp/api-client/src/auth/';
import { ClientType, RegisteredClient } from '@wireapp/api-client/src/client/';
import * as Events from '@wireapp/api-client/src/event';
import { CRUDEngine } from '@wireapp/store-engine';
import { EventEmitter } from 'events';
import { BroadcastService } from './broadcast/';
import { ClientInfo, ClientService } from './client/';
import { ConnectionService } from './connection/';
import { AssetService, ConversationService, PayloadBundleSource, PayloadBundleType } from './conversation/';
import * as OtrMessage from './conversation/message/OtrMessage';
import * as UserMessage from './conversation/message/UserMessage';
import type { CoreError } from './CoreError';
import { CryptographyService } from './cryptography/';
import { GiphyService } from './giphy/';
import { HandledEventPayload, NotificationService } from './notification/';
import { SelfService } from './self/';
import { TeamService } from './team/';
import { UserService } from './user/';
import { AccountService } from './account/';
import { LinkPreviewService } from './linkPreview';
import { WEBSOCKET_STATE } from '@wireapp/api-client/src/tcp/ReconnectingWebsocket';
export declare type ProcessedEventPayload = HandledEventPayload;
declare enum TOPIC {
    ERROR = "Account.TOPIC.ERROR"
}
export interface Account {
    on(event: PayloadBundleType.ASSET, listener: (payload: OtrMessage.FileAssetMessage | OtrMessage.ImageAssetMessage) => void): this;
    on(event: PayloadBundleType.BUTTON_ACTION, listener: (payload: OtrMessage.ButtonActionMessage) => void): this;
    on(event: PayloadBundleType.ASSET_ABORT, listener: (payload: OtrMessage.FileAssetAbortMessage) => void): this;
    on(event: PayloadBundleType.ASSET_IMAGE, listener: (payload: OtrMessage.ImageAssetMessage) => void): this;
    on(event: PayloadBundleType.ASSET_META, listener: (payload: OtrMessage.FileAssetMetaDataMessage) => void): this;
    on(event: PayloadBundleType.CALL, listener: (payload: OtrMessage.CallMessage) => void): this;
    on(event: PayloadBundleType.CLIENT_ACTION, listener: (payload: OtrMessage.ResetSessionMessage) => void): this;
    on(event: PayloadBundleType.CLIENT_ADD, listener: (payload: UserMessage.UserClientAddMessage) => void): this;
    on(event: PayloadBundleType.CLIENT_REMOVE, listener: (payload: UserMessage.UserClientRemoveMessage) => void): this;
    on(event: PayloadBundleType.CONFIRMATION, listener: (payload: OtrMessage.ConfirmationMessage) => void): this;
    on(event: PayloadBundleType.CONNECTION_REQUEST, listener: (payload: UserMessage.UserConnectionMessage) => void): this;
    on(event: PayloadBundleType.USER_UPDATE, listener: (payload: UserMessage.UserUpdateMessage) => void): this;
    on(event: PayloadBundleType.CONVERSATION_CLEAR, listener: (payload: OtrMessage.ClearConversationMessage) => void): this;
    on(event: PayloadBundleType.CONVERSATION_RENAME, listener: (payload: Events.ConversationRenameEvent) => void): this;
    on(event: PayloadBundleType.LOCATION, listener: (payload: OtrMessage.LocationMessage) => void): this;
    on(event: PayloadBundleType.MEMBER_JOIN, listener: (payload: Events.TeamMemberJoinEvent) => void): this;
    on(event: PayloadBundleType.MESSAGE_DELETE, listener: (payload: OtrMessage.DeleteMessage) => void): this;
    on(event: PayloadBundleType.MESSAGE_EDIT, listener: (payload: OtrMessage.EditedTextMessage) => void): this;
    on(event: PayloadBundleType.MESSAGE_HIDE, listener: (payload: OtrMessage.HideMessage) => void): this;
    on(event: PayloadBundleType.PING, listener: (payload: OtrMessage.PingMessage) => void): this;
    on(event: PayloadBundleType.REACTION, listener: (payload: OtrMessage.ReactionMessage) => void): this;
    on(event: PayloadBundleType.TEXT, listener: (payload: OtrMessage.TextMessage) => void): this;
    on(event: PayloadBundleType.TIMER_UPDATE, listener: (payload: Events.ConversationMessageTimerUpdateEvent) => void): this;
    on(event: PayloadBundleType.TYPING, listener: (payload: Events.ConversationTypingEvent) => void): this;
    on(event: PayloadBundleType.UNKNOWN, listener: (payload: any) => void): this;
    on(event: TOPIC.ERROR, listener: (payload: CoreError) => void): this;
}
export declare type CreateStoreFn = (storeName: string, context: Context) => undefined | Promise<CRUDEngine | undefined>;
interface AccountOptions {
    /** Used to store info in the database (will create a inMemory engine if returns undefined) */
    createStore?: CreateStoreFn;
    /** Number of prekeys to generate when creating a new device (defaults to 2)
     * Prekeys are Diffie-Hellmann public keys which allow offline initiation of a secure Proteus session between two devices.
     * Having a high value will:
     *    - make creating a new device consuming more CPU resources
     *    - make it less likely that all prekeys get consumed while the device is offline and the last resort prekey will not be used to create new session
     * Having a low value will:
     *    - make creating a new device fast
     *    - make it likely that all prekeys get consumed while the device is offline and the last resort prekey will be used to create new session
     */
    nbPrekeys?: number;
}
export declare class Account extends EventEmitter {
    private readonly apiClient;
    private readonly logger;
    private readonly createStore;
    private storeEngine?;
    private readonly nbPrekeys;
    static readonly TOPIC: typeof TOPIC;
    service?: {
        account: AccountService;
        asset: AssetService;
        broadcast: BroadcastService;
        client: ClientService;
        connection: ConnectionService;
        conversation: ConversationService;
        cryptography: CryptographyService;
        giphy: GiphyService;
        linkPreview: LinkPreviewService;
        notification: NotificationService;
        self: SelfService;
        team: TeamService;
        user: UserService;
    };
    backendFeatures: BackendFeatures;
    /**
     * @param apiClient The apiClient instance to use in the core (will create a new new one if undefined)
     * @param storeEngineProvider
     */
    constructor(apiClient?: APIClient, { createStore, nbPrekeys }?: AccountOptions);
    private persistCookie;
    get clientId(): string;
    get userId(): string;
    /**
     * Will register a new user to the backend
     *
     * @param registration The user's data
     * @param clientType Type of client to create (temporary or permanent)
     */
    register(registration: RegisterData, clientType: ClientType): Promise<Context>;
    /**
     * Will init the core with an aleady existing client (both on backend and local)
     * Will fail if local client cannot be found
     *
     * @param clientType The type of client the user is using (temporary or permanent)
     * @param cookie The cookie to identify the user against backend (will use the browser's one if not given)
     */
    init(clientType: ClientType, cookie?: Cookie, initClient?: boolean): Promise<Context>;
    /**
     * Will log the user in with the given credential.
     * Will also create the local client and store it in DB
     *
     * @param loginData The credentials of the user
     * @param initClient Should the call also create the local client
     * @param clientInfo Info about the client to create (name, type...)
     */
    login(loginData: LoginData, initClient?: boolean, clientInfo?: ClientInfo): Promise<Context>;
    /**
     * Will try to get the load the local client from local DB.
     * If clientInfo are provided, will also create the client on backend and DB
     * If clientInfo are not provideo, the method will fail if local client cannot be found
     *
     * @param loginData User's credentials
     * @param clientInfo Will allow creating the client if the local client cannot be found (else will fail if local client is not found)
     * @param entropyData Additional entropy data
     * @returns The local existing client or newly created client
     */
    initClient(loginData: LoginData, clientInfo?: ClientInfo, entropyData?: Uint8Array): Promise<{
        isNewClient: boolean;
        localClient: RegisteredClient;
    }>;
    initServices(context: Context): Promise<void>;
    loadAndValidateLocalClient(): Promise<RegisteredClient>;
    private registerClient;
    private resetContext;
    logout(): Promise<void>;
    /**
     * Will download and handle the notification stream since last stored notification id.
     * Once the notification stream has been handled from backend, will then connect to the websocket and start listening to incoming events
     *
     * @param callbacks callbacks that will be called to handle different events
     * @returns close a function that will disconnect from the websocket
     */
    listen({ onEvent, onConnected, onConnectionStateChanged, onNotificationStreamProgress, }?: {
        /**
         * Called when a new event arrives from backend
         * @param payload the payload of the event. Contains the raw event received and the decrypted data (if event was encrypted)
         * @param source where the message comes from (either websocket or notification stream)
         */
        onEvent?: (payload: HandledEventPayload, source: PayloadBundleSource) => void;
        /**
         * During the notification stream processing, this function will be called whenever a new notification has been processed
         */
        onNotificationStreamProgress?: ({ done, total }: {
            done: number;
            total: number;
        }) => void;
        /**
         * called when the connection to the websocket is established and the notification stream has been processed
         */
        onConnected?: () => void;
        /**
         * called when the connection stateh with the backend has changed
         */
        onConnectionStateChanged?: (state: WEBSOCKET_STATE) => void;
    }): Promise<() => void>;
    private initEngine;
}
export {};
