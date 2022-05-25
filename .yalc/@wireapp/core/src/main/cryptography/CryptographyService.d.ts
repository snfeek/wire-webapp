import type { APIClient } from '@wireapp/api-client';
import type { PreKey as SerializedPreKey } from '@wireapp/api-client/src/auth/';
import type { RegisteredClient } from '@wireapp/api-client/src/client/';
import type { OTRRecipients, QualifiedOTRRecipients, QualifiedUserClients, UserClients } from '@wireapp/api-client/src/conversation/';
import type { ConversationOtrMessageAddEvent } from '@wireapp/api-client/src/event';
import type { QualifiedId, QualifiedUserPreKeyBundleMap, UserPreKeyBundleMap } from '@wireapp/api-client/src/user/';
import { Cryptobox } from '@wireapp/cryptobox';
import { GenericMessage } from '@wireapp/protocol-messaging';
import type { CRUDEngine } from '@wireapp/store-engine';
import { PayloadBundle, PayloadBundleSource } from '../conversation';
export declare type DecryptionError = {
    code: number;
    message: string;
};
export interface MetaClient extends RegisteredClient {
    meta: {
        is_verified?: boolean;
        primary_key: string;
    };
}
export declare class CryptographyService {
    readonly apiClient: APIClient;
    private readonly storeEngine;
    private readonly config;
    private readonly logger;
    cryptobox: Cryptobox;
    private readonly database;
    constructor(apiClient: APIClient, storeEngine: CRUDEngine, config: {
        useQualifiedIds: boolean;
        nbPrekeys: number;
    });
    constructSessionId(userId: string | QualifiedId, clientId: string, domain?: string): string;
    static convertArrayRecipientsToBase64(recipients: OTRRecipients<Uint8Array>): OTRRecipients<string>;
    static convertBase64RecipientsToArray(recipients: OTRRecipients<string>): OTRRecipients<Uint8Array>;
    createCryptobox(entropyData?: Uint8Array): Promise<SerializedPreKey[]>;
    decrypt(sessionId: string, encodedCiphertext: string): Promise<Uint8Array>;
    encryptQualified(plainText: Uint8Array, preKeyBundles: QualifiedUserPreKeyBundleMap | QualifiedUserClients): Promise<{
        missing: QualifiedUserClients;
        encrypted: QualifiedOTRRecipients;
    }>;
    encrypt(plainText: Uint8Array, users: UserPreKeyBundleMap | UserClients, domain?: string): Promise<{
        missing: UserClients;
        encrypted: OTRRecipients<Uint8Array>;
    }>;
    private encryptPayloadForSession;
    initCryptobox(): Promise<void>;
    deleteCryptographyStores(): Promise<boolean[]>;
    resetSession(sessionId: string): Promise<void>;
    decryptMessage(otrMessage: ConversationOtrMessageAddEvent): Promise<GenericMessage>;
    mapGenericMessage(otrMessage: ConversationOtrMessageAddEvent, genericMessage: GenericMessage, source: PayloadBundleSource): PayloadBundle;
    private generateDecryptionError;
}
