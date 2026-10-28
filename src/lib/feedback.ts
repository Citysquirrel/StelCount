import type { DefaultResponseData } from "./functions/fetch";

export const feedbackCategories = {
	bug: "버그 신고",
	suggestion: "개선 제안",
	other: "기타",
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
