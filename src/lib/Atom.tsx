import { atom } from "recoil";
import { createAtomKey } from "./functions/createAtomKey";
import { YoutubeMusicData } from "./types";

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
	justLive: boolean | null;
}
export interface StellarState extends StellarInfo {
	chzzkFollowerCount: string;
	youtubeSubscriberCount: string;
	youtubeMusic: YoutubeMusicData[];
}

export interface LiveStatusState {
	chzzkId?: string | undefined;
	liveStatus?: boolean;
	uuid: string;
	openDate?: string;
	closeDate?: string;
	liveTitle?: string | null | undefined;
	liveCategoryValue?: string | undefined;
	liveImageUrl?: string | null;
	openLive?: boolean;
	adult?: boolean;
}

type FetchInfoKey = "stellar" | "liveStatus" | "liveDetail" | (string & {});

export type FetchInfoState = {
	[K in FetchInfoKey]?: { [key: string]: string | null | undefined };
};

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

export const isLiveLoadingState = atom<boolean>({
	key: createAtomKey("isLiveLoading"),
	default: true,
});

export const isLiveFetchingState = atom<boolean>({
	key: createAtomKey("isLiveFetching"),
	default: false,
});

export const isLiveDetailFetchingState = atom<boolean>({
	key: createAtomKey("isLiveDetailFetching"),
	default: false,
});

export const fetchInfoState = atom<FetchInfoState>({
	key: createAtomKey("fetchInfo"),
	default: {},
});

export const nowState = atom<Date>({
	key: createAtomKey("now"),
	default: new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })),
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
