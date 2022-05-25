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
exports.SelfService = void 0;
class SelfService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }
    async checkUsername(username) {
        const [availableUsername] = await this.checkUsernames([username]);
        return !!availableUsername;
    }
    checkUsernames(usernames) {
        return this.apiClient.api.user.postHandles({
            handles: usernames,
        });
    }
    async getName() {
        const { name } = await this.apiClient.api.self.getName();
        return name;
    }
    async getSelf() {
        const selfData = await this.apiClient.api.self.getSelf();
        return selfData;
    }
    async getUsername() {
        const { handle } = await this.getSelf();
        return handle;
    }
    setName(name) {
        return this.apiClient.api.self.putSelf({ name });
    }
    setUsername(username) {
        return this.apiClient.api.self.putHandle({ handle: username });
    }
}
exports.SelfService = SelfService;
//# sourceMappingURL=SelfService.js.map