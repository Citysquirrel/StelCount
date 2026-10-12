import Fuse from "fuse.js";
import Inko from "inko";
import type { StellarGroupV2, StellarV2State, TagV2, YoutubeMusicDataV2 } from "../types";
import { getChosung, normalizeKeyword } from "./search";

const inko = new Inko();

export type CounterSort = "newest" | "oldest" | "remaining-asc" | "remaining-desc";
export type CounterKind = "all" | "cover" | "original" | "other";

export function counterValue(value?: string | null) {
	if (!value?.trim()) return null;
	const count = Number(value);
	return Number.isSafeInteger(count) && count >= 0 ? count : null;
}

export function counterGoal(value?: string | null) {
	const count = counterValue(value);
	if (count === null) return null;
	let step = 10_000;
	while (count >= step * 10) step *= 10;
	const target = (Math.floor(count / step) + 1) * step;
	return { count, target, remaining: target - count };
}

export function counterGroupLabel(group: StellarGroupV2) {
	const name = group.en?.trim() || group.n.trim() || "미분류";
	const numbering = group.nur?.trim();
	const generation = numbering && /^\d+$/.test(numbering) ? `${numbering}기` : numbering;
	return generation ? `${generation} · ${name}` : name;
}

export function counterProfileImage(member: StellarV2State) {
	return member.gps?.some((group) => group.nur?.trim() === "공식")
		? "/images/symbol/symbol_stellive.svg"
		: member.pi;
}

export function counterTagKey(tag: TagV2) {
	return tag.i === undefined ? `name:${tag.n}` : `id:${tag.i}`;
}

export function counterCategoryTagIds(tags: TagV2[]) {
	const cover = new Set<number>();
	const original = new Set<number>();
	for (const tag of tags) {
		if (tag.i === undefined) continue;
		if (tag.icv === true) cover.add(tag.i);
		if (tag.io === true) original.add(tag.i);
	}
	return { cover, original };
}

export function counterChannels(member: StellarV2State) {
	const ids = member.yi?.split(",") || [];
	const handles = member.ycu?.split(",") || [];
	const counts = member.ysc?.split(",") || [];
	return Array.from({ length: Math.max(ids.length, handles.length) }, (_, index) => ({
		id: ids[index]?.trim() || "",
		handle: handles[index]?.trim() || "",
		count: counterValue(counts[index]),
		index,
	})).filter((channel) => (channel.id || channel.handle) && channel.count !== null);
}

export function selectCounterVideos(videos: YoutubeMusicDataV2[], filters: {
	query: string; kind: CounterKind; tags: string[]; sort: CounterSort;
}, categoryTagIds: ReturnType<typeof counterCategoryTagIds>) {
	const query = normalizeKeyword(filters.query);
	const candidates = videos.filter((video) => {
		if (video.ia === false) return false;
		const cover = video.tg?.some((tag) => tag.i !== undefined && categoryTagIds.cover.has(tag.i));
		const original = video.tg?.some((tag) => tag.i !== undefined && categoryTagIds.original.has(tag.i));
		if (filters.kind === "cover" && !cover) return false;
		if (filters.kind === "original" && !original) return false;
		if (filters.kind === "other" && (cover || original)) return false;
		return filters.tags.every((key) => video.tg?.some((tag) => counterTagKey(tag) === key));
	});
	const results = query ? new Fuse(candidates.map((video) => {
		const titles = [video.tl, video.ta || ""].map(normalizeKeyword).filter(Boolean);
		return {
			video,
			searchTitles: titles,
			searchTitlesCho: titles.map(getChosung),
			searchTitlesEng: titles.map((title) => inko.ko2en(title)),
		};
	}), {
		keys: ["searchTitles", "searchTitlesCho", "searchTitlesEng"],
		threshold: 0.4,
		ignoreLocation: true,
	}).search(query).map(({ item }) => item.video) : candidates;
	return results.sort((a, b) => {
		const newest = (b.pa || 0) - (a.pa || 0) || a.vi.localeCompare(b.vi);
		if (filters.sort === "newest") return newest;
		if (filters.sort === "oldest") return (a.pa || 0) - (b.pa || 0) || a.vi.localeCompare(b.vi);
		const remaining = (video: YoutubeMusicDataV2) => video.lbc === "live" || video.lbc === "upcoming" ? null : counterGoal(video.vc)?.remaining ?? null;
		const left = remaining(a);
		const right = remaining(b);
		if (left === null || right === null) return left === right ? newest : left === null ? 1 : -1;
		return (filters.sort === "remaining-asc" ? left - right : right - left) || newest;
	});
}
