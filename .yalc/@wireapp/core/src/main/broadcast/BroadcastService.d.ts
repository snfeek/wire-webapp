import type { APIClient } from '@wireapp/api-client';
import { ClientMismatch, MessageSendingStatus, QualifiedUserClients, UserClients } from '@wireapp/api-client/src/conversation';
import type { UserPreKeyBundleMap } from '@wireapp/api-client/src/user/';
import { GenericMessage } from '@wireapp/protocol-messaging';
import type { CryptographyService } from '../cryptography/';
export declare class BroadcastService {
    private readonly apiClient;
    private readonly cryptographyService;
    private readonly messageService;
    constructor(apiClient: APIClient, cryptographyService: CryptographyService);
    /**
     * Will create a key bundle for all the users of the team
     *
     * @param teamId
     * @param skipOwnClients=false
     * @param onlyDirectConnections=false Will generate a bundle only for directly connected users (users the self user has conversation with). Allows avoiding broadcasting messages to too many people
     */
    getPreKeyBundlesFromTeam(teamId: string, skipOwnClients?: boolean, onlyDirectConnections?: boolean): Promise<UserPreKeyBundleMap>;
    broadcastGenericMessage(genericMessage: GenericMessage, recipients: UserPreKeyBundleMap | UserClients | QualifiedUserClients, sendAsProtobuf?: boolean, onClientMismatch?: (mismatch: ClientMismatch | MessageSendingStatus) => void | boolean | Promise<boolean>): Promise<(MessageSendingStatus & {
        errored?: boolean | undefined;
    }) | (ClientMismatch & {
        errored?: boolean | undefined;
    })>;
}
