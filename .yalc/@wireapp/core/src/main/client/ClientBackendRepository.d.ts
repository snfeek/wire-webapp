import type { APIClient } from '@wireapp/api-client';
import type { CreateClientPayload, RegisteredClient, UpdateClientPayload } from '@wireapp/api-client/src/client/';
export declare class ClientBackendRepository {
    private readonly apiClient;
    constructor(apiClient: APIClient);
    getClients(): Promise<RegisteredClient[]>;
    postClient(client: CreateClientPayload): Promise<RegisteredClient>;
    putClient(clientId: string, updates: UpdateClientPayload): Promise<void>;
    deleteClient(clientId: string, password?: string): Promise<void>;
    uploadMLSKeyPackages(clientId: string, keyPackages: string[]): Promise<void>;
}
