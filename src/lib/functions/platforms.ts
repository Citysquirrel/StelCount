import { Thumbnails } from "../types";

export interface ParamsObject {
	part: (
		| "auditDetails"
		| "brandingSettings"
		| "contentDetails"
		| "contentOwnerDetails"
		| "id"
		| "localizations"
		| "snippet"
		| "statistics"
		| "status"
		| "topicDetails"
	)[];
	[key: string]: string | string[];
}

export const youtube = {
	channelUrl: (channelId?: string) => (channelId ? `https://www.youtube.com/${channelId}` : undefined),
	channelUrlByYoutubeId: (youtubeId?: string) =>
		youtubeId ? `https://www.youtube.com/channel/${youtubeId}` : undefined,
	videoUrl: (videoId: string) => (videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined),
	musicUrl: (videoId: string) => (videoId ? `https://music.youtube.com/watch?v=${videoId}` : undefined),
	playlistUrl: (playlistId: string) => (playlistId ? `https://www.youtube.com/playlist?list=${playlistId}` : undefined),
};

export const naver = {
	chzzk: {
		liveUrl: (channelId?: string) => (channelId ? `https://chzzk.naver.com/live/${channelId}` : undefined),
		liveChatUrl: (channelId?: string) => (channelId ? `https://chzzk.naver.com/live/${channelId}/chat` : undefined),
		channelUrl: (channelId?: string) => (channelId ? `https://chzzk.naver.com/${channelId}` : undefined),
	},
};

export function objectToUrlParams(object: object) {
	let params = "";
	Object.entries(object).forEach(([key, value], idx) => {
		const prefix = idx === 0 ? "?" : "&";
		params += `${prefix}${key}=${value}`;
	});
	return params;
}

export const generateThumbnails = (videoId: string): Thumbnails => {
	const baseUrl = `https://i.ytimg.com/vi/${videoId}`;

	return {
		default: { url: `${baseUrl}/default.jpg`, width: 120, height: 90 },
		medium: { url: `${baseUrl}/mqdefault.jpg`, width: 320, height: 180 },
		high: { url: `${baseUrl}/hqdefault.jpg`, width: 480, height: 360 },
		standard: { url: `${baseUrl}/sddefault.jpg`, width: 640, height: 480 },
		maxres: { url: `${baseUrl}/maxresdefault.jpg`, width: 1280, height: 720 },
	};
};

export const generateStandardThumbnail = (videoId: string) => {
	return `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`;
};
