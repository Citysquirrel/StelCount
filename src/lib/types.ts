// #region utility-types

// eslint-disable-next-line @typescript-eslint/ban-types
export type LiteralUnion<T extends U, U = string> = T | (U & {});

// #endregion

export interface HomeVideoData {
	id: string;
	title: string;
	/**
	 * @deprecated
	 */
	thumbnailUrl: string;
	videoUrl: string;
	viewCount: number;
	publishedAt?: string;
	updatedAt?: string;
	unit?: number[];
}

export interface UserSettingStorage {
	isAutoScrollOn?: boolean;
	homeStellar?: string;
	isFilterOn?: string;
	sortBy?: number;
	sortDirection?: number;
	chatToLeft?: boolean;
	listOpenerWidth?: string;
	customStreams?: CustomStreamsForUS[];
	isCardCompact?: boolean;
	controllerPos?: string;
	isFoxUsingFirefox?: boolean;
}

export interface CustomStreamsForUS {
	name: string;
	streamId: string;
	platform: LiteralUnion<"chzzk">;
	isBookmarked?: boolean;
}

export interface Tag extends DefaultDateFields {
	id?: number;
	name: string;
	colorCode?: string;
	isCover: boolean;
	count?: number;
}

export interface YoutubeMusicData {
	type?: LiteralUnion<"music" | "main" | "replay">; // "music", "main", "replay"
	title: string;
	titleAlias?: string;
	channelId: string;
	/**
	 * @deprecated
	 */
	thumbnail: string;
	/**
	 * @deprecated
	 */
	thumbnails: string;
	videoId: string;
	viewCount?: string;
	likeCount?: string;
	countUpdatedAt?: string;
	ownerId?: string;
	isOriginal?: boolean;
	isCollaborated?: boolean;
	publishedAt?: string;
	liveBroadcastContent?: LiteralUnion<"live" | "upcoming" | "none">;
	scheduledStartTime?: string;
	mostPopular: number;
	mostPopularMusic: number;
	isActive?: boolean;
	tags?: Tag[];
	details: VideoDetail[];
	statistics: Statistics[];
}

export interface Statistics extends DefaultDateFields {
	id: number;
	type: string;
	unit: string;
	value: string;
	annie_at: string;

	youtube_video_id: number | null;
	youtube_video_detail_id: number | null;
}

export interface VideoDetail extends DefaultDateFields {
	id: number;
	type: string;
	videoId: string;
	viewCount: string;
	likeCount: string;
	countUpdatedAt: string;
	statistics: Statistics[];

	youtube_video_detail_id: number | null;
	youtube_video_id: number | null;
}

export interface DefaultDateFields {
	createdAt?: string;
	updatedAt?: string;
}

export interface Thumbnails {
	maxres?: ThumbnailScheme;
	standard?: ThumbnailScheme;
	high?: ThumbnailScheme;
	medium?: ThumbnailScheme;
	default?: ThumbnailScheme;
}

interface ThumbnailScheme {
	height?: number | null;
	url?: string | null;
	width?: number | null;
}

export interface MultiViewData {
	name: string;
	nameShort?: string;
	chzzkId: string;
	uuid: string;
	colorCode?: string | undefined;
	channelName?: string;
	channelImageUrl?: string | null;
	liveCategoryValue?: string;
	liveTitle?: string | null;
	liveImageUrl?: string | null;
	openLive?: boolean;
	openDate?: string;
	closeDate?: string;
	adult?: boolean;
	isCustom?: boolean;
	isBookmarked?: boolean;
	graduation?: string | null | undefined;
	debut?: string | null | undefined;
	party: Party | null;
}

interface Party {
	partyNo: number;
	memberCount: number;
}

export interface ImprovedIntervalOptions {
	executeCallbackWhenWindowFocused?: boolean;
}

export interface MultiViewDataData {
	data: MultiViewData[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	upcoming: any[];
}

export type DateInput = Date | string | number;

export interface StellarV2Info {
	n: string;
	gp: number;
	uid: string;
	cc: string;
	ls: boolean | undefined;
	pi: string;
	czi: string;
	yi: string;
	ycu: string;
	jl: boolean | null;
}
export interface StellarV2State extends StellarV2Info {
	cfc: string;
	ysc: string;
	ym: YoutubeMusicDataV2[];
	db?: string | null | undefined;
	gd?: string | null | undefined;
	oi: string | null;
	plm: string | null;
}

export interface YoutubeMusicDataV2 {
	t?: LiteralUnion<"music" | "main" | "replay">; // "music", "main", "replay"
	tl: string;
	ta?: string;
	ci: string;
	vi: string;
	vc?: string;
	lc?: string;
	cua?: number;
	oi?: string;
	pa?: number;
	lbc?: LiteralUnion<"live" | "upcoming" | "none">;
	sst?: number;
	mp: number;
	mpm: number;
	ia?: boolean;
	tg?: TagV2[];
	dt: VideoDetailV2[];
	st: StatisticsV2[];
}

export interface TagV2 extends DefaultDateFieldsV2 {
	i?: number;
	n: string;
	cc?: string;
	icv: boolean;
}

export interface VideoDetailV2 extends DefaultDateFieldsV2 {
	t: string;
	vi: string;
	vc: string;
	lc: string;
	cua: number;
	mp: number;
	mpm: number;
	st: StatisticsV2[];
}

export interface StatisticsV2 extends Omit<DefaultDateFieldsV2, "ca"> {
	u: string;
	v: string;
	at: number;
}

export interface DefaultDateFieldsV2 {
	ca?: number;
	ua?: number;
}
