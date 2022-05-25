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
exports.GiphyService = void 0;
class GiphyService {
    constructor(apiClient) {
        this.apiClient = apiClient;
    }
    getRandomGif(tag, rating) {
        return this.apiClient.api.giphy.getGiphyRandom({ rating, tag });
    }
    getTrendingGif(rating) {
        return this.apiClient.api.giphy.getGiphyTrending({ rating });
    }
    searchGif(options) {
        return this.apiClient.api.giphy.getGiphySearch(options);
    }
}
exports.GiphyService = GiphyService;
//# sourceMappingURL=GiphyService.js.map