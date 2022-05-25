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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastService = void 0;
const protocol_messaging_1 = require("@wireapp/protocol-messaging");
const MessageService_1 = require("../conversation/message/MessageService");
const UserClientsUtil_1 = require("../conversation/message/UserClientsUtil");
const util_1 = require("../util");
class BroadcastService {
    constructor(apiClient, cryptographyService) {
        this.apiClient = apiClient;
        this.cryptographyService = cryptographyService;
        this.messageService = new MessageService_1.MessageService(this.apiClient, this.cryptographyService);
    }
    /**
     * Will create a key bundle for all the users of the team
     *
     * @param teamId
     * @param skipOwnClients=false
     * @param onlyDirectConnections=false Will generate a bundle only for directly connected users (users the self user has conversation with). Allows avoiding broadcasting messages to too many people
     */
    async getPreKeyBundlesFromTeam(teamId, skipOwnClients = false, onlyDirectConnections = false) {
        const teamMembers = onlyDirectConnections
            ? (await this.apiClient.api.conversation.getConversations()).conversations
                .map(({ members }) => members.others.map(user => user.id).concat(members.self.id))
                .flat()
            : (await this.apiClient.api.teams.member.getAllMembers(teamId)).members.map(({ user }) => user);
        let members = Array.from(new Set(teamMembers)).map(member => ({ id: member }));
        if (skipOwnClients) {
            const selfUser = await this.apiClient.api.self.getSelf();
            members = members.filter(member => member.id !== selfUser.id);
        }
        const preKeys = await Promise.all(members.map(member => this.apiClient.api.user.getUserPreKeys(member.id)));
        return preKeys.reduce((bundleMap, bundle) => {
            bundleMap[bundle.user] = {};
            for (const client of bundle.clients) {
                bundleMap[bundle.user][client.client] = client.prekey;
            }
            return bundleMap;
        }, {});
    }
    async broadcastGenericMessage(genericMessage, recipients, sendAsProtobuf, onClientMismatch) {
        const plainTextArray = protocol_messaging_1.GenericMessage.encode(genericMessage).finish();
        return (0, util_1.isQualifiedUserClients)(recipients)
            ? this.messageService.sendFederatedMessage(this.apiClient.validatedClientId, recipients, plainTextArray, {
                reportMissing: (0, UserClientsUtil_1.flattenQualifiedUserClients)(recipients).map(({ userId }) => userId),
                onClientMismatch,
            })
            : this.messageService.sendMessage(this.apiClient.validatedClientId, recipients, plainTextArray, {
                sendAsProtobuf,
                reportMissing: Object.keys(recipients),
                onClientMismatch,
            });
    }
}
exports.BroadcastService = BroadcastService;
//# sourceMappingURL=BroadcastService.js.map