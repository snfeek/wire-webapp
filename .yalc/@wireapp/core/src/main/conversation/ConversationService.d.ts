import type { APIClient } from '@wireapp/api-client';
import { MessageSendingStatus, Conversation, DefaultConversationRoleName, MutedStatus, NewConversation, QualifiedUserClients, UserClients, ClientMismatch } from '@wireapp/api-client/src/conversation';
import type { ConversationMemberLeaveEvent } from '@wireapp/api-client/src/event';
import type { QualifiedId, UserPreKeyBundleMap } from '@wireapp/api-client/src/user';
import { GenericMessage } from '@wireapp/protocol-messaging';
import { MessageTimer } from '../conversation/';
import type { RemoteData } from '../conversation/content/';
import type { CryptographyService } from '../cryptography/';
import type { ClearConversationMessage, DeleteMessage, HideMessage, OtrMessage } from './message/OtrMessage';
export declare enum MessageTargetMode {
    NONE = 0,
    USERS = 1,
    USERS_CLIENTS = 2
}
interface MessageSendingOptions {
    /**
     * The federated domain the server runs on. Should only be set for federation enabled envs
     */
    conversationDomain?: string;
    /**
     * can be either a QualifiedId[] or QualfiedUserClients or undefined. The type has some effect on the behavior of the method.
     *    When given undefined the method will fetch both the members of the conversations and their devices. No ClientMismatch can happen in that case
     *    When given a QualifiedId[] the method will fetch the freshest list of devices for those users (since they are not given by the consumer). As a consequence no ClientMismatch error will trigger and we will ignore missing clients when sending
     *    When given a QualifiedUserClients the method will only send to the clients listed in the userIds. This could lead to ClientMismatch (since the given list of devices might not be the freshest one and new clients could have been created)
     */
    userIds?: string[] | QualifiedId[] | UserClients | QualifiedUserClients;
    /**
     * Will send the message as a protobuf payload
     */
    sendAsProtobuf?: boolean;
    nativePush?: boolean;
    /**
     * Will be called whenever there is a clientmismatch returned from the server. Needs to be combined with a userIds of type QualifiedUserClients
     */
    onClientMismatch?: MessageSendingCallbacks['onClientMismatch'];
    /**
     * Defines the behavior to use when a mismatch happens on backend side:
     *     - NONE -> Not a targetted message, we want to send to all the users/clients in the conversation. Will report all missing users and clients (default mode)
     *     - USERS -> A message targetted to all the clients of the given users (according to params.userIds). Will ignore missing users and only report missing clients for the given params.userIds
     *     - USERS_CLIENTS -> A message targetted at some specific clients of specific users (according to params.userIds). Will force sending the message even if users or clients are missing
     */
    targetMode?: MessageTargetMode;
}
export interface MessageSendingCallbacks {
    /**
     * Will be called before a message is actually sent. Returning 'false' will prevent the message from being sent
     * @param message The message being sent
     * @return true or undefined if the message should be sent, false if the message sending should be cancelled
     */
    onStart?: (message: GenericMessage) => void | boolean | Promise<boolean>;
    onSuccess?: (message: GenericMessage, sentTime?: string) => void;
    /**
     * Called whenever there is a clientmismatch returned from the server. Will also indicate the sending status of the message (if it was already sent or not)
     *
     * @param status The mismatch info
     * @param wasSent Indicate whether the message was already sent or if it can still be canceled
     * @return
     */
    onClientMismatch?: (status: ClientMismatch | MessageSendingStatus, wasSent: boolean) => void | boolean | Promise<boolean>;
}
export declare class ConversationService {
    private readonly apiClient;
    private readonly config;
    readonly messageTimer: MessageTimer;
    private readonly messageService;
    private selfConversationId?;
    constructor(apiClient: APIClient, cryptographyService: CryptographyService, config: {
        useQualifiedIds?: boolean;
    });
    private createEphemeral;
    private getConversationQualifiedMembers;
    /**
     * Will generate a prekey bundle for specific users.
     * If a QualifiedId array is given the bundle will contain all the clients from those users fetched from the server.
     * If a QualifiedUserClients is provided then only the clients in the payload will be targeted (which could generate a ClientMismatch when sending messages)
     *
     * @param {QualifiedId[]|QualifiedUserClients} userIds - Targeted users.
     * @returns {Promise<QualifiedUserPreKeyBundleMap}
     */
    private getQualifiedPreKeyBundle;
    getPreKeyBundleMap(conversationId: string, userIds?: string[] | UserClients): Promise<UserPreKeyBundleMap>;
    private getSelfConversationId;
    private getQualifiedRecipientsForConversation;
    private getRecipientsForConversation;
    /**
     * Sends a message to a conversation
     *
     * @param sendingClientId The clientId from which the message is sent
     * @param conversationId The conversation in which to send the message
     * @param genericMessage The payload of the message to send
     * @return Resolves with the message sending status from backend
     */
    private sendGenericMessage;
    private extractUserIds;
    private extractQualifiedUserIds;
    private generateButtonActionGenericMessage;
    private generateButtonActionConfirmationGenericMessage;
    private generateCompositeGenericMessage;
    private generateConfirmationGenericMessage;
    private generateEditedTextGenericMessage;
    private generateFileDataGenericMessage;
    private generateFileMetaDataGenericMessage;
    private generateFileAbortGenericMessage;
    private generateImageGenericMessage;
    private generateLocationGenericMessage;
    private generatePingGenericMessage;
    private generateReactionGenericMessage;
    private generateSessionResetGenericMessage;
    private generateCallGenericMessage;
    private generateTextGenericMessage;
    clearConversation(conversationId: string, timestamp?: number | Date, messageId?: string, sendAsProtobuf?: boolean): Promise<ClearConversationMessage>;
    /**
     * Sends a LastRead message to the current user's self conversation.
     * This will allow all the user's devices to compute which messages are unread
     *
     * @param conversationId The conversation which has been read
     * @param lastReadTimestamp The timestamp at which the conversation was read
     * @param sendingOptions?
     * @return Resolves when the message has been sent
     */
    sendLastRead(conversationId: string, lastReadTimestamp: number, sendingOptions?: MessageSendingOptions): Promise<(MessageSendingStatus & {
        errored?: boolean | undefined;
    }) | (ClientMismatch & {
        errored?: boolean | undefined;
    })>;
    /**
     * Syncs all self user's devices with the countly id
     *
     * @param countlyId The countly id of the current device
     * @param sendingOptions?
     * @return Resolves when the message has been sent
     */
    sendCountlySync(countlyId: string, sendingOptions: MessageSendingOptions): Promise<(MessageSendingStatus & {
        errored?: boolean | undefined;
    }) | (ClientMismatch & {
        errored?: boolean | undefined;
    })>;
    /**
     * Get a fresh list from backend of clients for all the participants of the conversation.
     * This is a hacky way of getting all the clients for a conversation.
     * The idea is to send an empty message to the backend to absolutely no users and let backend reply with a mismatch error.
     * We then get the missing members in the mismatch, that is our fresh list of participants' clients.
     *
     * @param {string} conversationId
     * @param {string} conversationDomain? - If given will send the message to the new qualified endpoint
     */
    getAllParticipantsClients(conversationId: string, conversationDomain?: string): Promise<UserClients | QualifiedUserClients>;
    deleteMessageLocal(conversationId: string, messageIdToHide: string, sendAsProtobuf?: boolean, conversationDomain?: string): Promise<HideMessage>;
    deleteMessageEveryone(conversationId: string, messageIdToDelete: string, userIds?: string[] | QualifiedId[] | UserClients | QualifiedUserClients, sendAsProtobuf?: boolean, conversationDomain?: string, callbacks?: MessageSendingCallbacks): Promise<DeleteMessage>;
    leaveConversation(conversationId: string): Promise<ConversationMemberLeaveEvent>;
    leaveConversations(conversationIds?: string[]): Promise<ConversationMemberLeaveEvent[]>;
    /**
     * Create a group conversation.
     * @param  {string} name
     * @param  {string|string[]} otherUserIds
     * @deprecated
     * @returns Promise
     */
    createConversation(name: string, otherUserIds: string | string[]): Promise<Conversation>;
    /**
     * Create a group conversation.
     *
     * @note Do not include yourself as the requestor
     * @see https://staging-nginz-https.zinfra.io/swagger-ui/#!/conversations/createGroupConversation
     *
     * @param conversationData Payload object for group creation
     * @returns Resolves when the conversation was created
     */
    createConversation(conversationData: NewConversation): Promise<Conversation>;
    getConversations(conversationId: string): Promise<Conversation>;
    getConversations(conversationIds?: string[]): Promise<Conversation[]>;
    getAsset({ assetId, assetToken, otrKey, sha256 }: RemoteData): Promise<Uint8Array>;
    getUnencryptedAsset(assetId: string, assetToken?: string): Promise<ArrayBuffer>;
    addUser(conversationId: string, userIds: string | string[] | QualifiedId | QualifiedId[]): Promise<QualifiedId[]>;
    removeUser(conversationId: string, userId: string): Promise<string>;
    /**
     * Sends a message to a conversation
     *
     * @param params.payloadBundle The message to send to the conversation
     * @param params.userIds? Can be either a QualifiedId[], string[], UserClients or QualfiedUserClients. The type has some effect on the behavior of the method.
     *    When given a QualifiedId[] or string[] the method will fetch the freshest list of devices for those users (since they are not given by the consumer). As a consequence no ClientMismatch error will trigger and we will ignore missing clients when sending
     *    When given a QualifiedUserClients or UserClients the method will only send to the clients listed in the userIds. This could lead to ClientMismatch (since the given list of devices might not be the freshest one and new clients could have been created)
     *    When given a QualifiedId[] or QualifiedUserClients the method will send the message through the federated API endpoint
     *    When given a string[] or UserClients the method will send the message through the old API endpoint
     * @return resolves with the sent message
     */
    send<T extends OtrMessage = OtrMessage>({ payloadBundle, userIds, sendAsProtobuf, conversationDomain, nativePush, targetMode, callbacks, }: {
        payloadBundle: T;
        userIds?: string[] | QualifiedId[] | UserClients | QualifiedUserClients;
        callbacks?: MessageSendingCallbacks;
    } & MessageSendingOptions): Promise<T>;
    sendTypingStart(conversationId: string): Promise<void>;
    sendTypingStop(conversationId: string): Promise<void>;
    setConversationMutedStatus(conversationId: string, status: MutedStatus, muteTimestamp: number | Date): Promise<void>;
    toggleArchiveConversation(conversationId: string, archived: boolean, archiveTimestamp?: number | Date): Promise<void>;
    setMemberConversationRole(conversationId: string, userId: string, conversationRole: DefaultConversationRoleName | string): Promise<void>;
    private isClearFromMismatch;
}
export {};
