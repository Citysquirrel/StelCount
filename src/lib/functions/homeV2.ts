import { StatisticsV2, StellarV2State, YoutubeMusicDataV2 } from "../types";
import { sortStatsByUnit, sortStatsByUnitForBigNews } from "./etc";

export const HOME_LIMITS = { recentDays: 60, milestoneDays: 5, shelf: 20 };
const HERO_LIMITS = { recentDays: 7, milestoneDays: 5, milestones: 5, total: 8 };

export interface HomeVideo {
	video: YoutubeMusicDataV2;
	member: StellarV2State;
	labels: string[];
	eventTime: number;
	milestone?: { source: string; videoId: string; views?: string; record: StatisticsV2 };
}

export function recentMilestone(records: StatisticsV2[], now = Date.now()) {
	return records.filter((record) => {
		const age = now - record.at * 1000;
		const unit = Number(record.u);
		return record.at > 0 && age >= 0 && age <= HOME_LIMITS.milestoneDays * 86400000
			&& Number.isSafeInteger(unit) && unit > 0 && sortStatsByUnit(record.u);
	}).sort((a, b) => b.at - a.at || Number(b.u) - Number(a.u))[0];
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
	const heroRecent: HomeVideo[] = [];
	const heroMilestones: HomeVideo[] = [];
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
		];
		let heroMilestone: HomeVideo["milestone"];
		for (const source of sources) {
			const records = [...source.records].sort((a, b) => b.at - a.at || Number(b.u) - Number(a.u));
			const heroRecord = records.find((stat) => sortStatsByUnitForBigNews(stat.u) && within(stat.at, HERO_LIMITS.milestoneDays));
			if (heroRecord && (!heroMilestone || heroRecord.at > heroMilestone.record.at)) {
				heroMilestone = { source: source.source, videoId: source.videoId, views: source.views, record: heroRecord };
			}
			const record = recentMilestone(records, now);
			if (!record) continue;
			const milestone = { source: source.source, videoId: source.videoId, views: source.views, record };
			milestones.push({ ...item, labels: [...item.labels, "조회수 달성"], milestone, eventTime: record.at * 1000 });
			if (!item.milestone || record.at > item.milestone.record.at) item.milestone = milestone;
			item.eventTime = Math.max(item.eventTime, record.at * 1000);
		}
		if (item.milestone) item.labels.push("조회수 달성");
		if (within(video.pa, HERO_LIMITS.recentDays)) {
			heroRecent.push({
				...item,
				labels: heroMilestone ? ["새 영상", "조회수 달성"] : ["새 영상"],
				milestone: heroMilestone,
				eventTime: (video.pa || 0) * 1000,
			});
		} else if (heroMilestone) {
			heroMilestones.push({ ...item, labels: ["조회수 달성"], milestone: heroMilestone, eventTime: heroMilestone.record.at * 1000 });
		}
	}
	const latest = (a: HomeVideo, b: HomeVideo) => b.eventTime - a.eventTime || a.video.vi.localeCompare(b.video.vi);
	premiere.sort(
		(a, b) =>
			Number(b.video.lbc === "live") - Number(a.video.lbc === "live") ||
			(a.video.sst || Number.MAX_SAFE_INTEGER) - (b.video.sst || Number.MAX_SAFE_INTEGER),
	);
	recent.sort((a, b) => (b.video.pa || 0) - (a.video.pa || 0) || a.video.vi.localeCompare(b.video.vi));
	milestones.sort(latest);
	heroRecent.sort(latest);
	heroMilestones.sort(latest);
	return {
		premiere,
		hero: [...premiere, ...heroRecent, ...heroMilestones.slice(0, HERO_LIMITS.milestones)].slice(0, HERO_LIMITS.total),
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

