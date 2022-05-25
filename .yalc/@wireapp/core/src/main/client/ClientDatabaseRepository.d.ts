import type { RegisteredClient } from '@wireapp/api-client/src/client/';
import type { CRUDEngine } from '@wireapp/store-engine';
import { CryptographyService } from '../cryptography/';
import type { MetaClient } from './ClientService';
export declare enum DatabaseStores {
    CLIENTS = "clients"
}
export declare class ClientDatabaseRepository {
    private readonly storeEngine;
    private readonly cryptographyService;
    static readonly STORES: typeof DatabaseStores;
    static KEYS: {
        LOCAL_IDENTITY: string;
    };
    constructor(storeEngine: CRUDEngine, cryptographyService: CryptographyService);
    getLocalClient(): Promise<MetaClient>;
    getClient(sessionId: string): Promise<MetaClient>;
    deleteLocalClient(): Promise<string>;
    deleteClient(sessionId: string): Promise<string>;
    createClientList(userId: string, clientList: RegisteredClient[], domain?: string): Promise<MetaClient[]>;
    createLocalClient(client: RegisteredClient, domain?: string): Promise<MetaClient>;
    updateLocalClient(client: RegisteredClient, domain?: string): Promise<MetaClient>;
    updateClient(userId: string, client: RegisteredClient, domain?: string): Promise<MetaClient>;
    createClient(userId: string, client: RegisteredClient, domain?: string): Promise<MetaClient>;
    private transformClient;
    private transformLocalClient;
}
