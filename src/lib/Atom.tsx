import { atom } from "recoil";
import { createAtomKey } from "./functions/createAtomKey";

export const headerOffsetState = atom({
	key: createAtomKey("headerOffset"),
	default: 64,
});

// interface StellarState {
// 	[key: string]: Stellar;
// }

interface Stellar {
	chzzk: PlatformInfosDetail;
	youtube: PlatformInfosDetail;
	videos?: VideoDataDetail[];
	// subs?: SubscriberData;
	// views?: VideoData;
}

export interface PlatformInfosDetail {
	viewCount?: string;
	subscriberCount?: string;
	videoCount?: string;
	followerCount?: string;
}

interface SubscriberData {
	[key: string]: number | string;
}

interface SubscriberDataDetail {}

interface VideoData {
	[key: string]: VideoDataDetail;
}

interface VideoDataDetail {
	type: "youtube" | "chzzk";
	id: string;
	uuid: string;
	name: string;
	count: number | string;
}

export interface PlatformInfos {
	[key: string]: { youtube: PlatformInfosDetail; chzzk: PlatformInfosDetail };
}

export interface StellarInfo {
	name: string;
	uuid: string;
}
export interface StellarState extends StellarInfo {
	youtube?: PlatformInfosDetail;
	chzzk?: PlatformInfosDetail;
}

export const stellarState = atom<StellarState[]>({
	key: createAtomKey("stellar"),
	default: [],
});
