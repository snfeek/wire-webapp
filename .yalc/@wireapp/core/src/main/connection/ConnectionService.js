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
exports.ConnectionService = void 0;
const connection_1 = require("@wireapp/api-client/src/connection/");
class ConnectionService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }
    getConnections() {
        return this.apiClient.api.connection.getAllConnections();
    }
    acceptConnection(userId) {
        return this.apiClient.api.connection.putConnection(userId, {
            status: connection_1.ConnectionStatus.ACCEPTED,
        });
    }
    ignoreConnection(userId) {
        return this.apiClient.api.connection.putConnection(userId, {
            status: connection_1.ConnectionStatus.IGNORED,
        });
    }
    createConnection(userId) {
        return this.apiClient.api.connection.postConnection(userId, '');
    }
}
exports.ConnectionService = ConnectionService;
//# sourceMappingURL=ConnectionService.js.map