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
	videoUrl: (videoId?: string) => (videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined),
};

export function objectToUrlParams(object: Object) {
	let params = "";
	Object.entries(object).forEach(([key, value], idx) => {
		let prefix = idx === 0 ? "?" : "&";
		params += `${prefix}${key}=${value}`;
	});
	return params;
}

export const naver = {
	chzzk: {
		liveUrl: (channelId?: string) => (channelId ? `https://chzzk.naver.com/live/${channelId}` : undefined),
		channelUrl: (channelId?: string) => (channelId ? `https://chzzk.naver.com/${channelId}` : undefined),
	},
};
