export interface Crypto {
    digest(cipherText: Uint8Array): Promise<Uint8Array>;
    decrypt(cipherText: Uint8Array, keyBytes: Uint8Array): Promise<Uint8Array>;
    getRandomValues(size: number): Uint8Array;
    encrypt(plainText: Uint8Array, keyBytes: Uint8Array, initializationVector: Uint8Array, algorithm: string): Promise<{
        key: Uint8Array;
        cipher: Uint8Array;
    }>;
}
