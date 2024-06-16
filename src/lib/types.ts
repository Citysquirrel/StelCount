export interface UserSettingStorage {
	homeStellar?: string;
	isFilterOn?: string;
	sortBy?: number;
	sortDirection?: number;
}

export interface Tag {
	id: number;
	name: string;
	colorCode?: string;
}

export interface VideoDetail {
	id: number;
	type: string;
	videoId: string;
	viewCount: string;
	likeCount: string;
	countUpdatedAt: string;
}
