import { atom } from "recoil";
import { createAtomKey } from "./functions/createAtomKey";
import { Tag, VideoDetail } from "./types";

export const headerOffsetState = atom({
	key: createAtomKey("headerOffset"),
	default: 64,
});

export const backgroundColorState = atom({
	key: createAtomKey("backgroundColor"),
	default: "blue.50",
});

export interface PlatformInfosDetail {
	viewCount?: string;
	subscriberCount?: string;
	videoCount?: string;
	followerCount?: string;
	profileImage?: string;
	liveStatus?: boolean;
	channelId?: string;
}

export interface VideoDataDetail {
	type: "youtube" | "chzzk";
	id: string;
	uuid: string;
	name: string;
	count: number | string;
	thumbnail: string;
	url: string;
}

export interface PlatformInfos {
	[key: string]: { youtube: PlatformInfosDetail[]; chzzk: PlatformInfosDetail; videos?: VideoDataDetail[] };
}

export interface StellarInfo {
	name: string;
	group: number;
	uuid: string;
	colorCode: string;
	liveStatus: boolean | undefined;
	profileImage: string;
	chzzkId: string;
	youtubeId: string;
	youtubeCustomUrl: string;
}
export interface StellarState extends StellarInfo {
	chzzkFollowerCount: string;
	youtubeSubscriberCount: string;
	youtubeMusic: YoutubeMusicData[];
}

export interface LiveStatusState {
	chzzkId: string;
	liveStatus: boolean;
	uuid: string;
}

export interface YoutubeMusicData {
	type?: string; // "music", "main", "replay"
	title: string;
	titleAlias?: string;
	thumbnail: string;
	videoId: string;
	viewCount?: string;
	likeCount?: string;
	ownerId?: string;
	isOriginal?: boolean;
	isCollaborated?: boolean;
	publishedAt?: string;
	liveBroadcastContent?: string;
	scheduledStartTime?: string;
	tags?: Tag[];
	details: VideoDetail[];
}

export const stellarState = atom<StellarState[]>({
	key: createAtomKey("stellar"),
	default: [],
});

export const liveStatusState = atom<LiveStatusState[]>({
	key: createAtomKey("liveStatus"),
	default: [],
});

export const isLoginState = atom<boolean>({
	key: createAtomKey("isLogin"),
	default: false,
});
export const isLoadingState = atom<boolean>({
	key: createAtomKey("isLoading"),
	default: true,
});

export const isStellarLoadingState = atom<boolean>({
	key: createAtomKey("isStellarLoading"),
	default: false,
});

export const isAdminState = atom<boolean>({
	key: createAtomKey("isAdmin"),
	default: false,
});

export const errorStorageState = atom<string>({
	key: createAtomKey("errorStorage"),
	default: "",
});

export const serverErrorState = atom<{ isError: boolean; statusCode: number }>({
	key: createAtomKey("serverError"),
	default: { isError: false, statusCode: 500 },
});
