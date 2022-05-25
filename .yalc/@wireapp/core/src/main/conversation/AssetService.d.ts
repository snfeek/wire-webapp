/// <reference types="node" />
import type { APIClient } from '@wireapp/api-client';
import type { AssetOptions } from '@wireapp/api-client/src/asset';
import type { ProgressCallback, RequestCancelable } from '@wireapp/api-client/src/http';
import type { EncryptedAssetUploaded } from '../cryptography/';
export interface AssetDataV4 {
    assetKey: string;
    assetToken: string;
    assetDomain: string;
    forceCaching: boolean;
    version: 4;
}
export interface AssetDataV3 {
    assetKey: string;
    assetToken: string;
    forceCaching: boolean;
    version: 3;
}
export interface AssetDataV2 {
    assetId: string;
    conversationId: string;
    forceCaching: boolean;
    version: 2;
}
export interface AssetDataV1 {
    assetId: string;
    conversationId: string;
    forceCaching: boolean;
    version: 1;
}
export declare type AssetUrlData = AssetDataV1 | AssetDataV2 | AssetDataV3 | AssetDataV4;
export declare class AssetService {
    private readonly apiClient;
    constructor(apiClient: APIClient);
    /**
     * Will download an asset on the server.
     * Will route the request to the right endpoint depending on the asset version
     *
     * @param assetData The versioned asset data
     * @param progressCallback?
     * @return Resolves when the asset has been uploaded
     */
    downloadAsset(assetData: AssetUrlData, progressCallback?: ProgressCallback): RequestCancelable<import("@wireapp/api-client/src/asset").AssetResponse>;
    /**
     * Uploads a raw asset to the backend without encrypting it
     *
     * @param plainText The raw content of the asset to upload
     * @param options?
     * @param progressCallback?
     * @return cancellable request that resolves with the uploaded image
     */
    uploadRawAsset(asset: Buffer | Uint8Array, options?: AssetOptions, progressCallback?: ProgressCallback): RequestCancelable<import("@wireapp/api-client/src/asset").AssetUploadData>;
    /**
     * Will encrypt and upload an asset to the backend
     *
     * @param plainText The raw content of the asset to upload
     * @param options?
     * @param progressCallback?
     * @return cancellable request that resolves with the uploaded image and decryption keys
     */
    uploadAsset(plainText: Buffer | Uint8Array, options?: AssetOptions, progressCallback?: ProgressCallback): Promise<RequestCancelable<EncryptedAssetUploaded>>;
}
