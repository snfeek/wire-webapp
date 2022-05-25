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
exports.AssetService = void 0;
const AssetCryptography_1 = require("../cryptography/AssetCryptography");
class AssetService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }
    /**
     * Will download an asset on the server.
     * Will route the request to the right endpoint depending on the asset version
     *
     * @param assetData The versioned asset data
     * @param progressCallback?
     * @return Resolves when the asset has been uploaded
     */
    downloadAsset(assetData, progressCallback) {
        const { forceCaching } = assetData;
        switch (assetData.version) {
            case 1:
                return this.apiClient.api.asset.getAssetV1(assetData.assetId, assetData.conversationId, forceCaching, progressCallback);
            case 2:
                return this.apiClient.api.asset.getAssetV2(assetData.assetId, assetData.conversationId, forceCaching, progressCallback);
            case 3:
                return this.apiClient.api.asset.getAssetV3(assetData.assetKey, assetData.assetToken, forceCaching, progressCallback);
            case 4:
                return this.apiClient.api.asset.getAssetV4(assetData.assetKey, assetData.assetDomain, assetData.assetToken, forceCaching, progressCallback);
        }
    }
    /**
     * Uploads a raw asset to the backend without encrypting it
     *
     * @param plainText The raw content of the asset to upload
     * @param options?
     * @param progressCallback?
     * @return cancellable request that resolves with the uploaded image
     */
    uploadRawAsset(asset, options, progressCallback) {
        return this.apiClient.api.asset.postAsset(new Uint8Array(asset), options, progressCallback);
    }
    /**
     * Will encrypt and upload an asset to the backend
     *
     * @param plainText The raw content of the asset to upload
     * @param options?
     * @param progressCallback?
     * @return cancellable request that resolves with the uploaded image and decryption keys
     */
    async uploadAsset(plainText, options, progressCallback) {
        const { cipherText, keyBytes, sha256 } = await (0, AssetCryptography_1.encryptAsset)({
            plainText,
            algorithm: options === null || options === void 0 ? void 0 : options.algorithm,
            hash: options === null || options === void 0 ? void 0 : options.hash,
        });
        const request = this.uploadRawAsset(cipherText, options, progressCallback);
        return Object.assign(Object.assign({}, request), { response: request.response.then(response => {
                const { key, token, domain } = response;
                return {
                    cipherText,
                    domain,
                    key,
                    keyBytes,
                    sha256,
                    token,
                };
            }) });
    }
}
exports.AssetService = AssetService;
//# sourceMappingURL=AssetService.js.map