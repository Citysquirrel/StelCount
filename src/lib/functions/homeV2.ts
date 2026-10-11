import { StatisticsV2, StellarV2State, YoutubeMusicDataV2 } from "../types";
import { sortStatsByUnit } from "./etc";

export const HOME_LIMITS = { recentDays: 60, milestoneDays: 5, shelf: 20, hero: 20 };

export interface HomeVideo {
	video: YoutubeMusicDataV2;
	member: StellarV2State;
	labels: string[];
	eventTime: number;
	milestone?: { source: string; videoId: string; views?: string; record: StatisticsV2 };
}

export function selectHomeVideos(stellar: StellarV2State[], now = Date.now()) {
	const byId = new Map<string, HomeVideo>();
	for (const member of stellar) {
		for (const video of member.ym) {
			if (video.ia === false || byId.has(video.vi)) continue;
			byId.set(video.vi, { video, member, labels: [], eventTime: 0 });
		}
	}
	const within = (timestamp: number | undefined, days: number) => {
		const age = now - (timestamp || 0) * 1000;
		return !!timestamp && age >= 0 && age <= days * 86400000;
	};
	const premiere: HomeVideo[] = [];
	const recent: HomeVideo[] = [];
	const milestones: HomeVideo[] = [];
	for (const item of byId.values()) {
		const { video } = item;
		if (video.lbc === "upcoming" || video.lbc === "live") {
			item.labels.push(video.lbc === "live" ? "지금 최초공개 중" : "최초공개 예정");
			premiere.push(item);
			continue;
		}
		if (within(video.pa, HOME_LIMITS.recentDays)) {
			item.labels.push("새 영상");
			item.eventTime = (video.pa || 0) * 1000;
			recent.push(item);
		}
		const sources = [
			{ source: "Main", videoId: video.vi, views: video.vc, records: video.st },
			...video.dt.map((detail) => ({ source: detail.t, videoId: detail.vi, views: detail.vc, records: detail.st })),
		];
		for (const source of sources) {
			const record = source.records
				.filter((stat) => sortStatsByUnit(stat.u) && within(stat.at, HOME_LIMITS.milestoneDays))
				.sort((a, b) => b.at - a.at || Number(b.u) - Number(a.u))[0];
			if (!record) continue;
			const milestone = { source: source.source, videoId: source.videoId, views: source.views, record };
			milestones.push({ ...item, labels: [...item.labels, "조회수 달성"], milestone, eventTime: record.at * 1000 });
			if (!item.milestone || record.at > item.milestone.record.at) item.milestone = milestone;
			item.eventTime = Math.max(item.eventTime, record.at * 1000);
		}
		if (item.milestone) item.labels.push("조회수 달성");
	}
	const latest = (a: HomeVideo, b: HomeVideo) => b.eventTime - a.eventTime || a.video.vi.localeCompare(b.video.vi);
	premiere.sort(
		(a, b) =>
			Number(b.video.lbc === "live") - Number(a.video.lbc === "live") ||
			(a.video.sst || Number.MAX_SAFE_INTEGER) - (b.video.sst || Number.MAX_SAFE_INTEGER),
	);
	recent.sort((a, b) => (b.video.pa || 0) - (a.video.pa || 0) || a.video.vi.localeCompare(b.video.vi));
	milestones.sort(latest);
	const featured = [...byId.values()].filter((item) => item.labels.length && !premiere.includes(item)).sort(latest);
	return {
		hero: [...premiere, ...featured].slice(0, HOME_LIMITS.hero),
		recent: recent.slice(0, HOME_LIMITS.shelf),
		milestones: milestones.slice(0, HOME_LIMITS.shelf),
	};
}

export function homeDate(timestamp?: number) {
	if (!timestamp) return "일시 미정";
	return (
		new Intl.DateTimeFormat("ko-KR", {
			timeZone: "Asia/Seoul",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		}).format(new Date(timestamp * 1000))
	);
}

export function homeCount(value?: string) {
	return value != null && value !== "" && Number.isFinite(Number(value))
		? `${Number(value).toLocaleString("ko-KR")}회`
		: "집계 대기";
}

