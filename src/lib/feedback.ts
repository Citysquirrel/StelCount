import type { DefaultResponseData } from "./functions/fetch";

export const FEEDBACK_API_URL = import.meta.env.DEV ? "/api/feedback" : "https://api.stelcount.fans/api/feedback";
export const FEEDBACK_SOURCE_SITE = "stelcount";

// 공개 Site key이며 Secret key는 서버에서만 관리한다.
export const FEEDBACK_SITE_KEY = import.meta.env.DEV
	? "1x00000000000000000000AA"
	: "0x4AAAAAAFoUNwzwadqrYY5S";

export const feedbackCategories = {
	bug: "버그 신고",
	suggestion: "개선 제안",
	missing: "데이터 누락/오기",
	other: "기타",
};

export const feedbackSources = {
	stelcount: "StelCount",
	hamkubby: "햄쿠비 노래책",
	unknown: "알 수 없음",
};

export const feedbackNotifications = {
	pending: "알림 대기",
	sending: "전송 중",
	sent: "전송 완료",
	failed: "전송 실패",
};

export interface FeedbackData {
	id: string;
	category: keyof typeof feedbackCategories;
	sourceSite: keyof typeof feedbackSources;
	message: string;
	createdAt: string;
	notificationStatus: keyof typeof feedbackNotifications;
	isProcessed: boolean;
}

export interface FeedbackListResponse extends DefaultResponseData<FeedbackData[]> {
	total: number;
	page: number;
	limit: number;
}
