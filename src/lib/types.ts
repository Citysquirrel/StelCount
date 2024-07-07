export interface UserSettingStorage {
	isAutoScrollOn?: boolean;
	homeStellar?: string;
	isFilterOn?: string;
	sortBy?: number;
	sortDirection?: number;
}

export interface Tag extends DefaultDateFields {
	id: number;
	name: string;
	colorCode?: string;
}

export interface YoutubeMusicData {
	type?: "music" | "main" | "replay" | (string & {}); // "music", "main", "replay"
	title: string;
	titleAlias?: string;
	channelId: string;
	thumbnail: string;
	thumbnails: string;
	videoId: string;
	viewCount?: string;
	likeCount?: string;
	countUpdatedAt?: string;
	ownerId?: string;
	isOriginal?: boolean;
	isCollaborated?: boolean;
	publishedAt?: string;
	liveBroadcastContent?: "live" | "upcoming" | "none" | (string & {});
	scheduledStartTime?: string;
	mostPopular: number;
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
	maxres: ThumbnailScheme;
	standard: ThumbnailScheme;
	high: ThumbnailScheme;
	medium: ThumbnailScheme;
	default: ThumbnailScheme;
}

interface ThumbnailScheme {
	height?: number | null;
	url?: string | null;
	width?: number | null;
}
