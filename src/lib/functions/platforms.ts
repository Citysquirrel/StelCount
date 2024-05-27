import { FetchOptions, fetch_ } from "./fetch";

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
	// channels: (params: ParamsObject, options?: FetchOptions) =>
	// 	fetch_(`https://www.googleapis.com/youtube/v3/channels${objectToUrlParams(params)}`, options),
	channelUrl: (channelId?: string) => (channelId ? `https://www.youtube.com/${channelId}` : undefined),
	videoUrl: (videoId?: string) => (videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined),
};

function objectToUrlParams(object: Object) {
	let params = "";
	Object.entries(object).forEach(([key, value], idx) => {
		let prefix = idx === 0 ? "?" : "&";
		params += `${prefix}${key}=${value}`;
	});
	return params;
}

export const naver = {
	chzzk: {
		// channels: (channelId: string) => fetch_(`https://api.chzzk.naver.com/service/v1/channels/${channelId}`, {}),
		liveUrl: (channelId?: string) => (channelId ? `https://chzzk.naver.com/live/${channelId}` : undefined),
		channelUrl: (channelId?: string) => (channelId ? `https://chzzk.naver.com/${channelId}` : undefined),
	},
};
