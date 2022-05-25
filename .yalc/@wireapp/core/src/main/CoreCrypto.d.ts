declare type Buffer = Uint8Array;
export declare type ConversationId = Buffer;
export interface CoreCryptoParams {
    path: string;
    key: string;
    clientId: string;
}
export interface Invitee {
    id: string;
    kp: Buffer;
}
export interface MemberAddedMessages {
    welcome: Buffer;
    message: Buffer;
}
export interface ConversationConfiguration {
    extraMembers?: Invitee[];
    admins?: string[];
    ciphersuite?: string;
    keyRotationSpan?: number;
}
export declare class CoreCrypto {
    #private;
    static init(wasmFile: string, params: CoreCryptoParams): Promise<CoreCrypto>;
    static initStubbed(_wasmFile: string, params: CoreCryptoParams): Promise<CoreCrypto>;
    constructor({ wasmModule, path, key, clientId, }: CoreCryptoParams & {
        wasmModule: WebAssembly.WebAssemblyInstantiatedSource;
    });
    createConversation(conversationId: string, { extraMembers, admins, ciphersuite, keyRotationSpan }: ConversationConfiguration): Uint8Array;
    decryptMessage(conversationId: string, payload: Buffer): Buffer;
    encryptMessage(conversationId: string, message: Buffer): Buffer;
    processWelcomeMessage(welcomeMessage: Buffer, { extraMembers, admins, ciphersuite, keyRotationSpan }: ConversationConfiguration): ConversationId;
    clientPublicKey(): Buffer;
    clientKeypackages(amountRequested: number): Buffer[];
    addClientsToConverastion(conversationId: ConversationId, clients: Invitee[]): MemberAddedMessages | null;
    removeClientsFromConversation(conversationId: ConversationId, clients: Invitee[]): Buffer | null;
    conversationExists(conversationId: ConversationId): boolean;
    version(): string;
}
export {};
