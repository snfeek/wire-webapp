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
exports.isUserClients = exports.isQualifiedUserClients = exports.isQualifiedIdArray = exports.isQualifiedId = exports.isStringArray = void 0;
function isStringArray(obj) {
    return Array.isArray(obj) && (obj.length === 0 || typeof obj[0] === 'string');
}
exports.isStringArray = isStringArray;
function isQualifiedId(obj) {
    return typeof obj === 'object' && typeof obj['domain'] === 'string';
}
exports.isQualifiedId = isQualifiedId;
function isQualifiedIdArray(obj) {
    return Array.isArray(obj) && isQualifiedId(obj[0]);
}
exports.isQualifiedIdArray = isQualifiedIdArray;
function isQualifiedUserClients(obj) {
    var _a;
    if (typeof obj === 'object') {
        const firstUserClientObject = (_a = Object.values(obj)) === null || _a === void 0 ? void 0 : _a[0];
        if (typeof firstUserClientObject === 'object') {
            const firstClientIdArray = Object.values(firstUserClientObject)[0];
            return isStringArray(firstClientIdArray);
        }
    }
    return false;
}
exports.isQualifiedUserClients = isQualifiedUserClients;
function isUserClients(obj) {
    var _a;
    if (typeof obj === 'object') {
        const firstUserClientArray = (_a = Object.values(obj)) === null || _a === void 0 ? void 0 : _a[0];
        return isStringArray(firstUserClientArray);
    }
    return false;
}
exports.isUserClients = isUserClients;
//# sourceMappingURL=TypePredicateUtil.js.map