import type { ILinkPreview } from '@wireapp/protocol-messaging';
import type { ImageAssetContent, ImageContent, LegalHoldStatus } from '../content/';
export interface LinkPreviewContent extends Omit<ILinkPreview, 'image'> {
    expectsReadConfirmation?: boolean;
    legalHoldStatus?: LegalHoldStatus;
    image: ImageContent;
}
export interface LinkPreviewUploadedContent extends Omit<LinkPreviewContent, 'image'> {
    imageUploaded?: ImageAssetContent;
}
