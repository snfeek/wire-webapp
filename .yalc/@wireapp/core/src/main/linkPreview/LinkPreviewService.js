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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkPreviewService = void 0;
class LinkPreviewService {
    constructor(assetService) {
        this.assetService = assetService;
    }
    async uploadLinkPreviewImage(linkPreview, domain) {
        const { image } = linkPreview, preview = __rest(linkPreview, ["image"]);
        if (!image) {
            return preview;
        }
        const uploadedLinkPreview = preview;
        const asset = await (await this.assetService.uploadAsset(linkPreview.image.data, { domain })).response;
        uploadedLinkPreview.imageUploaded = {
            asset,
            image,
        };
        return uploadedLinkPreview;
    }
}
exports.LinkPreviewService = LinkPreviewService;
//# sourceMappingURL=LinkPreviewService.js.map