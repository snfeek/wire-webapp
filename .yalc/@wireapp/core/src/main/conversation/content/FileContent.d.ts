/// <reference types="node" />
import type { AudioMetaData, VideoMetaData, ImageMetaData } from './AssetContent';
export interface FileContent {
    data: Buffer;
}
export interface FileMetaDataContent {
    audio?: AudioMetaData;
    length: number;
    name: string;
    type: string;
    video?: VideoMetaData;
    image?: ImageMetaData;
}
