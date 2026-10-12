import type { LiveStatusState } from "../Atom";
import type { StellarV2State, YoutubeMusicDataV2 } from "../types";
import { convertKstInputToUtc, toDateTimeInputValue } from "./date";

const DEBUT_COHORT_DAYS = 7;
const DEBUT_VIDEO_DAYS = 7;
const DEBUT_EVENT_DURATION = 60 * 60 * 1000;

export function debutColor(...colors: (string | undefined)[]) {
	const color = colors.find(value => value && /^#?[0-9a-f]{6}$/i.test(value));
	if (!color) return undefined;
	const hex = color.replace(/^#/, "");
	const [r, g, b] = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
	const brightness = r * .299 + g * .587 + b * .114;
	const nearTextColor = Math.hypot(r - 169, g - 154, b - 191) < 70; // #a99abf
	if (brightness >= 160 && !nearTextColor) return `#${hex}`;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;
	const lightness = (max + min) / 510;
	if (delta === 0) {
		const gray = Math.round(Math.max(lightness, .8) * 255).toString(16).padStart(2, "0");
		return `#${gray.repeat(3)}`;
	}
	const hue = ((max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) + 6) % 6;
	// 색상각을 보존하고 채도를 확보해, 밝기 보정으로 멤버 색이 회색에 가까워지지 않도록 한다.
	const saturation = Math.max(delta / (255 * (1 - Math.abs(2 * lightness - 1))), .55);
	const adjustedLightness = Math.max(lightness, .68);
	const chroma = (1 - Math.abs(2 * adjustedLightness - 1)) * saturation;
	const x = chroma * (1 - Math.abs(hue % 2 - 1));
	const offset = adjustedLightness - chroma / 2;
	const channels = [[chroma, x, 0], [x, chroma, 0], [0, chroma, x], [0, x, chroma], [x, 0, chroma], [chroma, 0, x]][Math.floor(hue)];
	return `#${channels.map(channel => Math.round((channel + offset) * 255).toString(16).padStart(2, "0")).join("")}`;
}

export const DEBUT_PV = {
	videoId: "tlCeLkw8Upc",
	members: [
		{ name: "시즈키 토아", start: 10, end: 20 },
		{ name: "코가네 랑", start: 21, end: 31 },
		{ name: "하나요 히요리", start: 32, end: 42 },
		{ name: "토키노 메리", start: 43, end: 53 },
	],
};

export function debutPvSegment(...names: (string | undefined)[]) {
	const normalized = names.filter((name): name is string => !!name).map((name) => name.replace(/\s/g, ""));
	const segment = DEBUT_PV.members.find(
		({ name }) => normalized.includes(name.replace(/\s/g, "")) || normalized.includes(name.split(" ").at(-1)!),
	);
	return segment ? { videoId: DEBUT_PV.videoId, start: segment.start, end: segment.end } : undefined;
}

export interface DebutEvent {
	profile: LiveStatusState;
	debutAt: number;
	member?: StellarV2State;
	video?: YoutubeMusicDataV2;
}

export function selectDebutEvents(
	profiles: LiveStatusState[],
	members: StellarV2State[],
	now = Date.now(),
): DebutEvent[] {
	const events = new Map<string, DebutEvent>();
	for (const profile of profiles) {
		if (!profile.uuid || !profile.debut || events.has(profile.uuid)) continue;
		let debutAt: number;
		try {
			// 기존 debut 값은 KST 시각을 UTC 문자열로 저장하므로 관리자 입력과 같은 방식으로 복원한다.
			debutAt = Date.parse(convertKstInputToUtc(toDateTimeInputValue(profile.debut)));
		} catch {
			continue;
		}
		if (!Number.isFinite(debutAt) || debutAt <= 0) continue;
		const videoEndsAt = debutAt + DEBUT_VIDEO_DAYS * 86400000;
		const member = members.find((candidate) => candidate.uid === profile.uuid);
		const releaseAt = (video: YoutubeMusicDataV2) => {
			const timestamp = video.lbc === "upcoming" || video.lbc === "live" ? video.sst || video.pa : video.pa;
			return timestamp && Number.isFinite(timestamp) && timestamp > 0 ? timestamp * 1000 : Infinity;
		};
		const video = member?.ym
			.filter(
				(candidate) =>
					candidate.ia !== false && candidate.t !== "replay" && candidate.vi && releaseAt(candidate) < videoEndsAt,
			)
			.sort((a, b) => releaseAt(a) - releaseAt(b) || a.vi.localeCompare(b.vi))[0];
		events.set(profile.uuid, { profile, debutAt, member, video });
	}
	const sorted = [...events.values()].sort((a, b) => a.debutAt - b.debutAt || a.profile.uuid.localeCompare(b.profile.uuid));
	const last = sorted.at(-1);
	if (!last) return [];
	// 과거 기수는 제외하되 이번 데뷔 일정의 멤버들은 마지막 방송까지 함께 유지한다.
	const cohort = sorted.filter(event => event.debutAt >= last.debutAt - DEBUT_COHORT_DAYS * 86400000);
	const endsAt = last.debutAt + DEBUT_EVENT_DURATION;
	if (now < endsAt) return cohort;
	const stillLive = cohort.some(({ profile, debutAt }) => {
		if (debutAt !== last.debutAt || !profile.openLive) return false;
		if (!profile.openDate) return true;
		let openedAt: number;
		try {
			const date = profile.openDate.replace(" ", "T");
			openedAt = Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/i.test(date) ? date : convertKstInputToUtc(date));
		} catch {
			return true;
		}
		// 종료 기준 이후 새로 시작한 일반 방송으로 스페셜이 재노출되지 않게 한다.
		return !Number.isFinite(openedAt) || openedAt < endsAt;
	});
	return stillLive ? cohort : [];
}

