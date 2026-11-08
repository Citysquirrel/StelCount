import { DefaultResponseData } from "./functions/fetch";

export interface YouTubeMethodUsage {
	key: "video_list" | "playlist_items" | "channel_list" | "playlist_list";
	method: "videos.list" | "playlistItems.list" | "channels.list" | "playlists.list";
	unitsPerRequest: number;
	requests: number;
	estimatedQuotaUnits: number;
}

export interface YouTubeDailyUsage {
	date: string;
	hasRecords: boolean;
	requests: number;
	estimatedQuotaUnits: number;
	methods: YouTubeMethodUsage[];
	sources?: {
		source: "squirrel-server" | "hamkubby-server" | "squirrel-webhook";
		hasRecords: boolean;
		requests: number;
		estimatedQuotaUnits: number;
		methods: YouTubeMethodUsage[];
	}[];
}

export interface DashboardMetrics {
	visits: {
		timeZone: "Asia/Seoul";
		startDate: string;
		endDate: string;
		series: {
			key: string;
			days: { date: string; requests: number; uniqueIps: number }[];
		}[];
	};
	youtubeApi: {
		timeZone: "America/Los_Angeles";
		measurement: "estimated_request_attempts";
		dailyLimit: number;
		dailyLimitSource: "default" | "environment";
		startDate: string;
		endDate: string;
		days: YouTubeDailyUsage[];
		today: YouTubeDailyUsage & { remainingUnits: number; usagePercent: number };
	};
	persistenceIntervalSeconds: number;
}

export type DashboardResponse = DefaultResponseData<unknown> & { metrics?: DashboardMetrics };

export function normalizeDashboardDate(value: string): string {
	const text = value.trim();
	const yearFirst = /^(\d{4})[-/.]\s*(\d{1,2})[-/.]\s*(\d{1,2})(?:\.|(?:[T ]\d{2}:\d{2}.*))?$/.exec(text);
	const monthFirst = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
	const parts = yearFirst ? [yearFirst[1], yearFirst[2], yearFirst[3]] : monthFirst ? [monthFirst[3], monthFirst[1], monthFirst[2]] : null;
	if (!parts) throw new Error("집계 날짜 형식을 확인할 수 없습니다.");
	const [year, month, day] = parts.map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (year < 1000 || date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
		throw new Error("유효하지 않은 집계 날짜입니다.");
	}
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function selectDashboardMetrics(response: DashboardResponse): DashboardMetrics {
	const metrics = response?.metrics;
	if (!metrics || !Array.isArray(metrics.visits?.series) || !Array.isArray(metrics.youtubeApi?.days) || !metrics.youtubeApi?.today) {
		throw new Error("새 집계 데이터(metrics)를 확인할 수 없습니다. 서버 반영 상태를 확인해 주세요.");
	}
	return {
		...metrics,
		visits: { ...metrics.visits,
			startDate: normalizeDashboardDate(metrics.visits.startDate), endDate: normalizeDashboardDate(metrics.visits.endDate),
			series: metrics.visits.series.map(series => ({ ...series, days: series.days.map(day => ({ ...day, date: normalizeDashboardDate(day.date) })) })),
		},
		youtubeApi: { ...metrics.youtubeApi,
			startDate: normalizeDashboardDate(metrics.youtubeApi.startDate), endDate: normalizeDashboardDate(metrics.youtubeApi.endDate),
			days: metrics.youtubeApi.days.map(day => ({ ...day, date: normalizeDashboardDate(day.date) })),
			today: { ...metrics.youtubeApi.today, date: normalizeDashboardDate(metrics.youtubeApi.today.date) },
		},
	};
}
