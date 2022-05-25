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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crypto = void 0;
const cryptoLib = __importStar(require("crypto"));
exports.crypto = {
    async digest(cipherText) {
        return cryptoLib.createHash('SHA256').update(cipherText).digest();
    },
    async decrypt(cipherText, keyBytes) {
        const initializationVector = cipherText.slice(0, 16);
        const assetCipherText = cipherText.slice(16);
        const decipher = cryptoLib.createDecipheriv('AES-256-CBC', keyBytes, initializationVector);
        const decipherUpdated = decipher.update(assetCipherText);
        const decipherFinal = decipher.final();
        return Buffer.concat([decipherUpdated, decipherFinal]);
    },
    getRandomValues(size) {
        return cryptoLib.randomBytes(size);
    },
    async encrypt(plainText, keyBytes, initializationVector, algorithm) {
        const cipher = cryptoLib.createCipheriv(algorithm, keyBytes, initializationVector);
        const cipherUpdated = cipher.update(plainText);
        const cipherFinal = cipher.final();
        const cipherText = Buffer.concat([cipherUpdated, cipherFinal]);
        return {
            key: keyBytes,
            cipher: cipherText,
        };
    },
};
//# sourceMappingURL=crypto.node.js.map