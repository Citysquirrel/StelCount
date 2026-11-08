import { DefaultResponseData } from "./functions/fetch";

export interface YouTubeMethodUsage {
	key: "video_list" | "playlist_items" | "channel_list";
	method: "videos.list" | "playlistItems.list" | "channels.list";
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

export function selectDashboardMetrics(response: DashboardResponse): DashboardMetrics {
	const metrics = response?.metrics;
	if (!metrics || !Array.isArray(metrics.visits?.series) || !Array.isArray(metrics.youtubeApi?.days) || !metrics.youtubeApi?.today) {
		throw new Error("새 집계 데이터(metrics)를 확인할 수 없습니다. 서버 반영 상태를 확인해 주세요.");
	}
	return metrics;
}
