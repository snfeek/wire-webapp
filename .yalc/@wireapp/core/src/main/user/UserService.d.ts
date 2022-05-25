import type { APIClient } from '@wireapp/api-client';
import type { QualifiedId, User } from '@wireapp/api-client/src/user/';
import type { AvailabilityType, BroadcastService } from '../broadcast/';
import { ConnectionService } from '../connection';
import { ConversationService } from '../conversation';
export declare class UserService {
    private readonly apiClient;
    private readonly broadcastService;
    private readonly connectionService;
    private readonly conversationService;
    constructor(apiClient: APIClient, broadcastService: BroadcastService, conversationService: ConversationService, connectionService: ConnectionService);
    getUser(userId: string | QualifiedId): Promise<User>;
    getUsers(userIds: string[] | QualifiedId[]): Promise<User[]>;
    /**
     * Sends a availability update to members of the same team
     * @param teamId
     * @param type
     * @param options.sendAll=false will broadcast the message to all the members of the team (instead of just direct connections). Should be avoided in a big team
     * @param options.sendAsProtobuf=false
     */
    setAvailability(teamId: string, type: AvailabilityType, { sendAll, sendAsProtobuf }?: {
        sendAll?: boolean | undefined;
        sendAsProtobuf?: boolean | undefined;
    }): Promise<void>;
}
