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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Account = void 0;
const http_status_codes_1 = require("http-status-codes");
const api_client_1 = require("@wireapp/api-client");
const auth_1 = require("@wireapp/api-client/src/auth/");
const client_1 = require("@wireapp/api-client/src/client/");
const tcp_1 = require("@wireapp/api-client/src/tcp/");
const cryptobox = __importStar(require("@wireapp/cryptobox"));
const store_engine_1 = require("@wireapp/store-engine");
const events_1 = require("events");
const logdown_1 = __importDefault(require("logdown"));
const auth_2 = require("./auth/");
const broadcast_1 = require("./broadcast/");
const client_2 = require("./client/");
const connection_1 = require("./connection/");
const conversation_1 = require("./conversation/");
const cryptography_1 = require("./cryptography/");
const giphy_1 = require("./giphy/");
const notification_1 = require("./notification/");
const self_1 = require("./self/");
const team_1 = require("./team/");
const user_1 = require("./user/");
const account_1 = require("./account/");
const linkPreview_1 = require("./linkPreview");
var TOPIC;
(function (TOPIC) {
    TOPIC["ERROR"] = "Account.TOPIC.ERROR";
})(TOPIC || (TOPIC = {}));
const coreDefaultClient = {
    classification: client_1.ClientClassification.DESKTOP,
    cookieLabel: 'default',
    model: '@wireapp/core',
};
class Account extends events_1.EventEmitter {
    /**
     * @param apiClient The apiClient instance to use in the core (will create a new new one if undefined)
     * @param storeEngineProvider
     */
    constructor(apiClient = new api_client_1.APIClient(), { createStore = () => undefined, nbPrekeys = 2 } = {}) {
        super();
        this.apiClient = apiClient;
        this.backendFeatures = this.apiClient.backendFeatures;
        this.nbPrekeys = nbPrekeys;
        this.createStore = createStore;
        apiClient.on(api_client_1.APIClient.TOPIC.COOKIE_REFRESH, async (cookie) => {
            if (cookie && this.storeEngine) {
                try {
                    await this.persistCookie(this.storeEngine, cookie);
                }
                catch (error) {
                    this.logger.error(`Failed to save cookie: ${error.message}`, error);
                }
            }
        });
        this.logger = (0, logdown_1.default)('@wireapp/core/Account', {
            logger: console,
            markdown: false,
        });
    }
    persistCookie(storeEngine, cookie) {
        const entity = { expiration: cookie.expiration, zuid: cookie.zuid };
        return storeEngine.updateOrCreate(auth_1.AUTH_TABLE_NAME, auth_1.AUTH_COOKIE_KEY, entity);
    }
    get clientId() {
        return this.apiClient.validatedClientId;
    }
    get userId() {
        return this.apiClient.validatedUserId;
    }
    /**
     * Will register a new user to the backend
     *
     * @param registration The user's data
     * @param clientType Type of client to create (temporary or permanent)
     */
    async register(registration, clientType) {
        const context = await this.apiClient.register(registration, clientType);
        await this.initServices(context);
        return context;
    }
    /**
     * Will init the core with an aleady existing client (both on backend and local)
     * Will fail if local client cannot be found
     *
     * @param clientType The type of client the user is using (temporary or permanent)
     * @param cookie The cookie to identify the user against backend (will use the browser's one if not given)
     */
    async init(clientType, cookie, initClient = true) {
        const context = await this.apiClient.init(clientType, cookie);
        await this.initServices(context);
        if (initClient) {
            await this.initClient({ clientType });
        }
        return context;
    }
    /**
     * Will log the user in with the given credential.
     * Will also create the local client and store it in DB
     *
     * @param loginData The credentials of the user
     * @param initClient Should the call also create the local client
     * @param clientInfo Info about the client to create (name, type...)
     */
    async login(loginData, initClient = true, clientInfo = coreDefaultClient) {
        this.resetContext();
        auth_2.LoginSanitizer.removeNonPrintableCharacters(loginData);
        const context = await this.apiClient.login(loginData);
        await this.initServices(context);
        if (initClient) {
            await this.initClient(loginData, clientInfo);
        }
        return context;
    }
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
    async initClient(loginData, clientInfo, entropyData) {
        var _a, _b;
        if (!this.service) {
            throw new Error('Services are not set.');
        }
        try {
            const localClient = await this.loadAndValidateLocalClient();
            return { isNewClient: false, localClient };
        }
        catch (error) {
            if (!clientInfo) {
                // If no client info provided, the client should not be created
                throw error;
            }
            // There was no client so we need to "create" and "register" a client
            const notFoundInDatabase = error instanceof cryptobox.error.CryptoboxError ||
                error.constructor.name === 'CryptoboxError' ||
                error instanceof store_engine_1.error.RecordNotFoundError ||
                error.constructor.name === store_engine_1.error.RecordNotFoundError.name;
            const notFoundOnBackend = ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === http_status_codes_1.StatusCodes.NOT_FOUND;
            if (notFoundInDatabase) {
                this.logger.log(`Could not find valid client in database "${(_b = this.storeEngine) === null || _b === void 0 ? void 0 : _b.storeName}".`);
                return this.registerClient(loginData, clientInfo, entropyData);
            }
            if (notFoundOnBackend) {
                this.logger.log('Could not find valid client on backend');
                const client = await this.service.client.getLocalClient();
                const shouldDeleteWholeDatabase = client.type === client_1.ClientType.TEMPORARY;
                if (shouldDeleteWholeDatabase) {
                    this.logger.log('Last client was temporary - Deleting database');
                    if (this.storeEngine) {
                        await this.storeEngine.clearTables();
                    }
                    const context = await this.apiClient.init(loginData.clientType);
                    await this.initEngine(context);
                    return this.registerClient(loginData, clientInfo, entropyData);
                }
                this.logger.log('Last client was permanent - Deleting cryptography stores');
                await this.service.cryptography.deleteCryptographyStores();
                return this.registerClient(loginData, clientInfo, entropyData);
            }
            throw error;
        }
    }
    async initServices(context) {
        this.storeEngine = await this.initEngine(context);
        const accountService = new account_1.AccountService(this.apiClient);
        const assetService = new conversation_1.AssetService(this.apiClient);
        const cryptographyService = new cryptography_1.CryptographyService(this.apiClient, this.storeEngine, {
            // We want to encrypt with fully qualified session ids, only if the backend is federated with other backends
            useQualifiedIds: this.backendFeatures.isFederated,
            nbPrekeys: this.nbPrekeys,
        });
        const clientService = new client_2.ClientService(this.apiClient, this.storeEngine, cryptographyService);
        const connectionService = new connection_1.ConnectionService(this.apiClient);
        const giphyService = new giphy_1.GiphyService(this.apiClient);
        const linkPreviewService = new linkPreview_1.LinkPreviewService(assetService);
        const conversationService = new conversation_1.ConversationService(this.apiClient, cryptographyService, {
            // We can use qualified ids to send messages as long as the backend supports federated endpoints
            useQualifiedIds: this.backendFeatures.federationEndpoints,
        });
        const notificationService = new notification_1.NotificationService(this.apiClient, cryptographyService, this.storeEngine);
        const selfService = new self_1.SelfService(this.apiClient);
        const teamService = new team_1.TeamService(this.apiClient);
        const broadcastService = new broadcast_1.BroadcastService(this.apiClient, cryptographyService);
        const userService = new user_1.UserService(this.apiClient, broadcastService, conversationService, connectionService);
        this.service = {
            account: accountService,
            asset: assetService,
            broadcast: broadcastService,
            client: clientService,
            connection: connectionService,
            conversation: conversationService,
            cryptography: cryptographyService,
            giphy: giphyService,
            linkPreview: linkPreviewService,
            notification: notificationService,
            self: selfService,
            team: teamService,
            user: userService,
        };
    }
    async loadAndValidateLocalClient() {
        await this.service.cryptography.initCryptobox();
        const loadedClient = await this.service.client.getLocalClient();
        await this.apiClient.api.client.getClient(loadedClient.id);
        this.apiClient.context.clientId = loadedClient.id;
        return loadedClient;
    }
    async registerClient(loginData, clientInfo = coreDefaultClient, entropyData) {
        if (!this.service) {
            throw new Error('Services are not set.');
        }
        const registeredClient = await this.service.client.register(loginData, clientInfo, entropyData);
        this.apiClient.context.clientId = registeredClient.id;
        this.logger.log('Client is created');
        await this.service.notification.initializeNotificationStream();
        await this.service.client.synchronizeClients();
        return { isNewClient: true, localClient: registeredClient };
    }
    resetContext() {
        delete this.apiClient.context;
        delete this.service;
    }
    async logout() {
        await this.apiClient.logout();
        this.resetContext();
    }
    /**
     * Will download and handle the notification stream since last stored notification id.
     * Once the notification stream has been handled from backend, will then connect to the websocket and start listening to incoming events
     *
     * @param callbacks callbacks that will be called to handle different events
     * @returns close a function that will disconnect from the websocket
     */
    async listen({ onEvent = () => { }, onConnected = () => { }, onConnectionStateChanged = () => { }, onNotificationStreamProgress = () => { }, } = {}) {
        if (!this.apiClient.context) {
            throw new Error('Context is not set - please login first');
        }
        const handleEvent = async (payload, source) => {
            const { mappedEvent } = payload;
            switch (mappedEvent === null || mappedEvent === void 0 ? void 0 : mappedEvent.type) {
                case conversation_1.PayloadBundleType.TIMER_UPDATE: {
                    const { data: { message_timer }, conversation, } = payload;
                    const expireAfterMillis = Number(message_timer);
                    this.service.conversation.messageTimer.setConversationLevelTimer(conversation, expireAfterMillis);
                    break;
                }
            }
            onEvent(payload, source);
            if (mappedEvent) {
                this.emit(mappedEvent.type, payload.mappedEvent);
            }
        };
        const handleNotification = async (notification, source) => {
            var e_1, _a;
            try {
                const messages = this.service.notification.handleNotification(notification, conversation_1.PayloadBundleSource.WEBSOCKET);
                try {
                    for (var messages_1 = __asyncValues(messages), messages_1_1; messages_1_1 = await messages_1.next(), !messages_1_1.done;) {
                        const message = messages_1_1.value;
                        await handleEvent(message, source);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (messages_1_1 && !messages_1_1.done && (_a = messages_1.return)) await _a.call(messages_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }
            catch (error) {
                this.logger.error(`Failed to handle notification ID "${notification.id}": ${error.message}`, error);
            }
        };
        this.apiClient.transport.ws.removeAllListeners(tcp_1.WebSocketClient.TOPIC.ON_MESSAGE);
        this.apiClient.transport.ws.on(tcp_1.WebSocketClient.TOPIC.ON_MESSAGE, notification => handleNotification(notification, conversation_1.PayloadBundleSource.WEBSOCKET));
        this.apiClient.transport.ws.on(tcp_1.WebSocketClient.TOPIC.ON_STATE_CHANGE, onConnectionStateChanged);
        const onBeforeConnect = async () => {
            await this.service.notification.handleNotificationStream(async (notification, source, progress) => {
                await handleNotification(notification, source);
                onNotificationStreamProgress(progress);
            });
            onConnected();
        };
        await this.apiClient.connect(onBeforeConnect);
        return () => {
            this.apiClient.disconnect();
        };
    }
    async initEngine(context) {
        const clientType = context.clientType === client_1.ClientType.NONE ? '' : `@${context.clientType}`;
        const dbName = `wire@${this.apiClient.config.urls.name}@${context.userId}${clientType}`;
        this.logger.log(`Initialising store with name "${dbName}"...`);
        const openDb = async () => {
            const initializedDb = await this.createStore(dbName, context);
            if (initializedDb) {
                this.logger.log(`Initialized store with existing engine "${dbName}".`);
                return initializedDb;
            }
            this.logger.log(`Initialized store with new memory engine "${dbName}".`);
            const memoryEngine = new store_engine_1.MemoryEngine();
            await memoryEngine.init(dbName);
            return memoryEngine;
        };
        const storeEngine = await openDb();
        const cookie = auth_1.CookieStore.getCookie();
        if (cookie) {
            await this.persistCookie(storeEngine, cookie);
        }
        return storeEngine;
    }
}
exports.Account = Account;
Account.TOPIC = TOPIC;
//# sourceMappingURL=Account.js.map