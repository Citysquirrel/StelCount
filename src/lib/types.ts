export interface UserSettingStorage {
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
	videoId: string;
	viewCount?: string;
	likeCount?: string;
	countUpdatedAt?: string;
	ownerId?: string;
	isOriginal?: boolean;
	isCollaborated?: boolean;
	publishedAt?: string;
	liveBroadcastContent?: string;
	scheduledStartTime?: string;
	mostPopular: number;
	isActive?: boolean;
	tags?: Tag[];
	details: VideoDetail[];
	statistics: any[];
}

export interface Statistics {
	id: number;
	type: string;
	unit: string;
	value: string;
	annie_at: string;
}

export interface VideoDetail extends DefaultDateFields {
	id: number;
	type: string;
	videoId: string;
	viewCount: string;
	likeCount: string;
	countUpdatedAt: string;

	youtube_video_detail_id: number | null;
	youtube_video_id: number | null;
}

export interface DefaultDateFields {
	createdAt?: string;
	updatedAt?: string;
}
