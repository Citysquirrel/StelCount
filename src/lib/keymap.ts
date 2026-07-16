/* eslint-disable @typescript-eslint/no-explicit-any */
type KeyMap = Record<string, string>;

export const KEY_MAP: KeyMap = {
	// 공통 및 영상 필드
	id: "i",
	type: "t",
	videoId: "vi",
	createdAt: "ca",
	updatedAt: "ua",
	countUpdatedAt: "cua",
	viewCount: "vc",
	likeCount: "lc",
	mostPopular: "mp",
	mostPopularMusic: "mpm",
	value: "v",
	unit: "u",
	title: "tl",
	titleAlias: "ta",
	thumbnail: "th",
	thumbnails: "ths",
	channelId: "ci",
	inheritChannelId: "ici",
	ownerId: "oi",
	isOriginal: "io",
	isCollaborated: "ic",
	isActive: "ia",
	isCover: "icv",
	approachedAt: "aa",
	publishedAt: "pa",
	scheduledStartTime: "sst",
	annie_at: "at",
	liveBroadcastContent: "lbc",
	details: "dt",
	statistics: "st",
	tags: "tg",
	name: "n",
	colorCode: "cc",

	// 멤버 기본 정보 ===
	uuid: "uid",
	profileImage: "pi",
	graduation: "gd",
	group: "gp",
	groups: "gps",
	liveStatus: "ls",
	justLive: "jl",

	// 치지직
	chzzkId: "czi",
	chzzkFollowerCount: "cfc",

	// 유튜브
	youtubeId: "yi",
	youtubeCustomUrl: "ycu",
	youtubeSubscriberCount: "ysc",
	youtubeMusic: "ym",
	playlistIdForMusic: "plm",
};

// export const REVERSE_KEY_MAP: KeyMap = Object.entries(KEY_MAP).reduce((acc, [key, value]) => {
// 	acc[value] = key;
// 	return acc;
// }, {} as KeyMap);

export const REVERSE_KEY_MAP = {
	i: "id",
	t: "type",
	vi: "videoId",
	ca: "createdAt",
	ua: "updatedAt",
	cua: "countUpdatedAt",
	vc: "viewCount",
	lc: "likeCount",
	mp: "mostPopular",
	mpm: "mostPopularMusic",
	v: "value",
	u: "unit",
	tl: "title",
	ta: "titleAlias",
	th: "thumbnail",
	ths: "thumbnails",
	ci: "channelId",
	ici: "inheritChannelId",
	oi: "ownerId",
	io: "isOriginal",
	ic: "isCollaborated",
	ia: "isActive",
	icv: "isCover",
	aa: "approachedAt",
	pa: "publishedAt",
	sst: "scheduledStartTime",
	at: "annie_at",
	lbc: "liveBroadcastContent",
	dt: "details",
	st: "statistics",
	tg: "tags",
	n: "name",
	cc: "colorCode",
	uid: "uuid",
	pi: "profileImage",
	gd: "graduation",
	gp: "group",
	gps: "groups",
	ls: "liveStatus",
	jl: "justLive",
	czi: "chzzkId",
	cfc: "chzzkFollowerCount",
	yi: "youtubeId",
	ycu: "youtubeCustomUrl",
	ysc: "youtubeSubscriberCount",
	ym: "youtubeMusic",
	plm: "playlistIdForMusic",
};

export const restoreKeys = (data: any): any => {
	if (data === null || typeof data !== "object") {
		return data;
	}

	// 배열 순회
	if (Array.isArray(data)) {
		return data.map(restoreKeys);
	}

	const result: Record<string, any> = {};
	for (const key of Object.keys(data)) {
		const originalKey = REVERSE_KEY_MAP[key] || key;
		result[originalKey] = restoreKeys(data[key]);
	}

	return result;
};
