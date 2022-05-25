import { AssetService } from '../conversation';
import { LinkPreviewContent, LinkPreviewUploadedContent } from '../conversation/content';
export declare class LinkPreviewService {
    private readonly assetService;
    constructor(assetService: AssetService);
    uploadLinkPreviewImage(linkPreview: LinkPreviewContent, domain?: string): Promise<LinkPreviewUploadedContent>;
}
