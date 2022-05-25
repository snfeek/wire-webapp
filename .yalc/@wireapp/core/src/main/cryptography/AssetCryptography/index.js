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
exports.encryptAsset = exports.decryptAsset = void 0;
const crypto_node_1 = require("./crypto.node");
const isEqual = (a, b) => {
    const arrayA = new Uint32Array(a);
    const arrayB = new Uint32Array(b);
    const hasSameLength = arrayA.length === arrayB.length;
    const hasSameValues = arrayA.every((value, index) => value === arrayB[index]);
    return hasSameLength && hasSameValues;
};
const decryptAsset = async ({ cipherText, keyBytes, sha256: referenceSha256, }) => {
    const computedSha256 = await crypto_node_1.crypto.digest(cipherText);
    if (!isEqual(computedSha256, referenceSha256)) {
        throw new Error('Encrypted asset does not match its SHA-256 hash');
    }
    return crypto_node_1.crypto.decrypt(cipherText, keyBytes);
};
exports.decryptAsset = decryptAsset;
const encryptAsset = async ({ plainText, algorithm = 'AES-256-CBC' }) => {
    const initializationVector = crypto_node_1.crypto.getRandomValues(16);
    const rawKeyBytes = crypto_node_1.crypto.getRandomValues(32);
    const { key, cipher } = await crypto_node_1.crypto.encrypt(plainText, rawKeyBytes, initializationVector, algorithm);
    const ivCipherText = new Uint8Array(cipher.byteLength + initializationVector.byteLength);
    ivCipherText.set(initializationVector, 0);
    ivCipherText.set(new Uint8Array(cipher), initializationVector.byteLength);
    const sha256 = await crypto_node_1.crypto.digest(ivCipherText);
    return {
        cipherText: ivCipherText,
        keyBytes: key,
        sha256,
    };
};
exports.encryptAsset = encryptAsset;
//# sourceMappingURL=index.js.map