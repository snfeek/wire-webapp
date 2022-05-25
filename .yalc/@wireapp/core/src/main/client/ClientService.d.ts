import type { APIClient } from '@wireapp/api-client';
import type { LoginData } from '@wireapp/api-client/src/auth/';
import { RegisteredClient } from '@wireapp/api-client/src/client/';
import type { CRUDEngine } from '@wireapp/store-engine';
import type { CryptographyService } from '../cryptography/';
import { ClientInfo } from './';
export interface MetaClient extends RegisteredClient {
    domain?: string;
    meta: {
        is_verified?: boolean;
        primary_key: string;
    };
}
export declare class ClientService {
    private readonly apiClient;
    private readonly storeEngine;
    private readonly cryptographyService;
    private readonly database;
    private readonly backend;
    constructor(apiClient: APIClient, storeEngine: CRUDEngine, cryptographyService: CryptographyService);
    getClients(): Promise<RegisteredClient[]>;
    /**
     * Will delete the given client from backend and will also delete it from the local database
     *
     * note: use deleteLocalClient if you wish to delete the client currently used by the user
     *
     * @param clientId The id of the client to delete
     * @param password? Password of the owning user. Can be omitted for temporary devices
     */
    deleteClient(clientId: string, password?: string): Promise<unknown>;
    /**
     * Will delete the local client (client currently in use by the user) from backend and will also delete it from the local database
     * @param password? Password of the owning user. Can be omitted for temporary devices
     */
    deleteLocalClient(password?: string): Promise<string>;
    getLocalClient(): Promise<MetaClient>;
    createLocalClient(client: RegisteredClient, domain?: string): Promise<MetaClient>;
    synchronizeClients(): Promise<MetaClient[]>;
    register(loginData: LoginData, clientInfo: ClientInfo, entropyData?: Uint8Array): Promise<RegisteredClient>;
}
