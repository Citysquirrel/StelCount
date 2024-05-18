import { atom } from "recoil";
import { createAtomKey } from "./functions/createAtomKey";

export const headerOffsetState = atom({
	key: createAtomKey("headerOffset"),
	default: 64,
});

export interface PlatformInfosDetail {
	viewCount?: string;
	subscriberCount?: string;
	videoCount?: string;
	followerCount?: string;
	profileImage?: string;
}

export interface VideoDataDetail {
	type: "youtube" | "chzzk";
	id: string;
	uuid: string;
	name: string;
	count: number | string;
	thumbnail: string;
}

export interface PlatformInfos {
	[key: string]: { youtube: PlatformInfosDetail[]; chzzk: PlatformInfosDetail; videos?: VideoDataDetail[] };
}

export interface StellarInfo {
	name: string;
	uuid: string;
}
export interface StellarState extends StellarInfo {
	youtube?: PlatformInfosDetail[];
	chzzk?: PlatformInfosDetail;
	videos?: VideoDataDetail[];
}

export const stellarState = atom<StellarState[]>({
	key: createAtomKey("stellar"),
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

export const isServerErrorState = atom<boolean>({
	key: createAtomKey("isServerError"),
	default: false,
});
