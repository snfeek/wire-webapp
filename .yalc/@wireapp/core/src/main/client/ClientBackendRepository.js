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
exports.ClientBackendRepository = void 0;
class ClientBackendRepository {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }
    getClients() {
        return this.apiClient.api.client.getClients();
    }
    postClient(client) {
        return this.apiClient.api.client.postClient(client);
    }
    putClient(clientId, updates) {
        return this.apiClient.api.client.putClient(clientId, updates);
    }
    deleteClient(clientId, password) {
        return this.apiClient.api.client.deleteClient(clientId, password);
    }
    uploadMLSKeyPackages(clientId, keyPackages) {
        return this.apiClient.api.client.uploadMLSKeyPackages(clientId, keyPackages);
    }
}
exports.ClientBackendRepository = ClientBackendRepository;
//# sourceMappingURL=ClientBackendRepository.js.map