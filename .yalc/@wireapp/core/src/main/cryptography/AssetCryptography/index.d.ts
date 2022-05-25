import { CipherOptions } from '@wireapp/api-client/src/asset';
import type { EncryptedAsset } from './EncryptedAsset';
interface EncryptOptions extends CipherOptions {
    plainText: Uint8Array;
}
export declare const decryptAsset: ({ cipherText, keyBytes, sha256: referenceSha256, }: EncryptedAsset) => Promise<Uint8Array>;
export declare const encryptAsset: ({ plainText, algorithm }: EncryptOptions) => Promise<EncryptedAsset>;
export {};
