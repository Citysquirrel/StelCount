import { useEffect } from "react";
import { fetchServer } from "../../lib/functions/fetch";

interface DashboardResponse {
	msg: string;
	data: LogData[];
}

interface LogData {
	id: number;
	date: string;
	counter: string | null;
	key: LogKey;
	value: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

type LogKey = "visit_counter" | "multiview_call_count" | "api_quota_video_list" | "api_quota_playlist_items" | null;

export function Dashboard() {
	useEffect(() => {
		fetchServer<DashboardResponse>("v2", "/dashboard").then((res) => {
			if (res.data) {
				console.log(res.data.data);
			}
		});
	}, []);
	return <></>;
}
