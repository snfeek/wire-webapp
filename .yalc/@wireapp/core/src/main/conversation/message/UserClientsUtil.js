"use strict";
/*
 * Wire
 * Copyright (C) 2021 Wire Swiss GmbH
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
exports.flattenQualifiedUserClients = exports.flattenUserClients = void 0;
function flattenUserClients(userClients, domain = '') {
    return Object.entries(userClients).map(([id, data]) => ({ data, userId: { domain, id } }));
}
exports.flattenUserClients = flattenUserClients;
/**
 * Will flatten a container of users=>clients infos to an array
 *
 * @param userClients The UserClients (qualified or not) to flatten
 * @return An array containing the qualified user Ids and the clients info
 */
function flattenQualifiedUserClients(userClients) {
    return Object.entries(userClients).reduce((ids, [domain, userClients]) => {
        return [...ids, ...flattenUserClients(userClients, domain)];
    }, []);
}
exports.flattenQualifiedUserClients = flattenQualifiedUserClients;
//# sourceMappingURL=UserClientsUtil.js.map