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
exports.crypto = void 0;
const cryptoLib = window.crypto;
exports.crypto = {
    async digest(cipherText) {
        const checksum = await cryptoLib.subtle.digest('SHA-256', cipherText);
        return new Uint8Array(checksum);
    },
    async decrypt(cipherText, keyBytes) {
        const key = await cryptoLib.subtle.importKey('raw', keyBytes, 'AES-CBC', false, ['decrypt']);
        const initializationVector = cipherText.slice(0, 16);
        const assetCipherText = cipherText.slice(16);
        const decipher = await cryptoLib.subtle.decrypt({ iv: initializationVector, name: 'AES-CBC' }, key, assetCipherText);
        return new Uint8Array(decipher);
    },
    getRandomValues(size) {
        return cryptoLib.getRandomValues(new Uint8Array(size));
    },
    async encrypt(plainText, keyBytes, initializationVector) {
        const key = await cryptoLib.subtle.importKey('raw', keyBytes, 'AES-CBC', true, ['encrypt']);
        return {
            key: new Uint8Array(await cryptoLib.subtle.exportKey('raw', key)),
            cipher: await cryptoLib.subtle.encrypt({ iv: initializationVector, name: 'AES-CBC' }, key, plainText),
        };
    },
};
//# sourceMappingURL=crypto.browser.js.map