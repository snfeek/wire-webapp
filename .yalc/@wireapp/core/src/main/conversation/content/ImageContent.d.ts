/// <reference types="node" />
export interface ImageContent {
    data: Buffer | Uint8Array;
    height: number;
    type: string;
    width: number;
}
