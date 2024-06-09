export interface UserSettingStorage {
	homeStellar?: string;
	isFilterOn?: string;
}

export interface Tag {
	id: number;
	name: string;
	colorCode?: string;
}
