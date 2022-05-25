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
exports.TeamService = void 0;
class TeamService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }
    addMember(teamId, memberData) {
        return this.apiClient.api.teams.member.postMembers(teamId, memberData);
    }
    createTeam(teamData) {
        return this.apiClient.api.teams.team.postTeam(teamData);
    }
    deleteTeam(teamId, password) {
        return this.apiClient.api.teams.team.deleteTeam(teamId, password);
    }
    getAllMembers(teamId) {
        return this.apiClient.api.teams.member.getAllMembers(teamId);
    }
    getTeam(teamId) {
        return this.apiClient.api.teams.team.getTeam(teamId);
    }
    getTeams() {
        return this.apiClient.api.teams.team.getTeams();
    }
    removeMember(teamId, userId, password) {
        return this.apiClient.api.teams.member.deleteMember(teamId, userId, password);
    }
    updateMember(teamId, memberData) {
        return this.apiClient.api.teams.member.putMembers(teamId, memberData);
    }
    updateTeam(teamId, teamData) {
        return this.apiClient.api.teams.team.putTeam(teamId, teamData);
    }
}
exports.TeamService = TeamService;
//# sourceMappingURL=TeamService.js.map