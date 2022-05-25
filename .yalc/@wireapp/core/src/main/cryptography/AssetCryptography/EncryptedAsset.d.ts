export interface EncryptedAsset {
    cipherText: Uint8Array;
    keyBytes: Uint8Array;
    /** The SHA-256 sum of `cipherText` */
    sha256: Uint8Array;
}
export interface EncryptedAssetUploaded extends EncryptedAsset {
    key: string;
    domain?: string;
    token: string;
}
