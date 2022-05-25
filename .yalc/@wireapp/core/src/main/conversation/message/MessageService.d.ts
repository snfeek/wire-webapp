import { APIClient } from '@wireapp/api-client';
import { ClientMismatch, MessageSendingStatus, QualifiedUserClients, UserClients } from '@wireapp/api-client/src/conversation';
import { CryptographyService } from '../../cryptography';
import { QualifiedId, QualifiedUserPreKeyBundleMap, UserPreKeyBundleMap } from '@wireapp/api-client/src/user';
export declare class MessageService {
    private readonly apiClient;
    private readonly cryptographyService;
    constructor(apiClient: APIClient, cryptographyService: CryptographyService);
    /**
     * Sends a message to a non-federated backend.
     *
     * @param sendingClientId The clientId of the current user
     * @param recipients The list of recipients to send the message to
     * @param plainText The plainText data to send
     * @param options.conversationId? the conversation to send the message to. Will broadcast if not set
     * @param options.reportMissing? trigger a mismatch error when there are missing recipients in the payload
     * @param options.sendAsProtobuf?
     * @param options.onClientMismatch? Called when a mismatch happens on the server
     * @return the ClientMismatch status returned by the backend
     */
    sendMessage(sendingClientId: string, recipients: UserClients | UserPreKeyBundleMap, plainText: Uint8Array, options?: {
        conversationId?: string;
        reportMissing?: boolean | string[];
        sendAsProtobuf?: boolean;
        nativePush?: boolean;
        onClientMismatch?: (mismatch: ClientMismatch) => void | boolean | Promise<boolean>;
    }): Promise<ClientMismatch & {
        errored?: boolean;
    }>;
    /**
     * Sends a message to a federated backend.
     *
     * @param sendingClientId The clientId of the current user
     * @param recipients The list of recipients to send the message to
     * @param plainText The plainText data to send
     * @param options.conversationId? the conversation to send the message to. Will broadcast if not set
     * @param options.reportMissing? trigger a mismatch error when there are missing recipients in the payload
     * @param options.sendAsProtobuf?
     * @param options.onClientMismatch? Called when a mismatch happens on the server
     * @return the MessageSendingStatus returned by the backend
     */
    sendFederatedMessage(sendingClientId: string, recipients: QualifiedUserClients | QualifiedUserPreKeyBundleMap, plainText: Uint8Array, options: {
        assetData?: Uint8Array;
        conversationId?: QualifiedId;
        reportMissing?: boolean | QualifiedId[];
        nativePush?: boolean;
        onClientMismatch?: (mismatch: MessageSendingStatus) => void | boolean | Promise<boolean>;
    }): Promise<MessageSendingStatus & {
        errored?: boolean;
    }>;
    private sendFederatedOtrMessage;
    private sendOTRMessage;
    private generateExternalPayload;
    private shouldSendAsExternal;
    private isClientMismatchError;
    private reencryptAfterMismatch;
    /**
     * Will re-encrypt a message when there were some missing clients in the initial send (typically when the server replies with a client mismatch error)
     *
     * @param {ProtobufOTR.QualifiedNewOtrMessage} messageData The initial message that was sent
     * @param {MessageSendingStatus} messageSendingStatus Info about the missing/deleted clients
     * @param {Uint8Array} plainText The text that should be encrypted for the missing clients
     * @return resolves with a new message payload that can be sent
     */
    private reencryptAfterFederatedMismatch;
    private sendOTRProtobufMessage;
}
