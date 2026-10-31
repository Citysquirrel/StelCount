import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { fetchServer } from "../functions/fetch";
import { useAuth } from "./useAuth";

export interface PlaylistRenewalProgress {
	jobId: string | null;
	status: "idle" | "running" | "completed" | "completed_with_warnings" | "failed";
	stage: "idle" | "starting" | "fetch_playlists" | "save_videos" | "save_playlist" | "completed";
	source: "worker" | "main" | null;
	startedAt: string | null;
	finishedAt: string | null;
	playlistsCompleted: number;
	playlistsTotal: number | null;
	pagesFetched: number;
	itemsCollected: number;
	itemsSaved: number;
	itemsTotal: number | null;
	warningCount: number;
	error: string | null;
}

interface RenewalResponse {
	msg?: string;
	progress?: PlaylistRenewalProgress;
}

export const PlaylistRenewalContext = createContext<ReturnType<typeof usePlaylistRenewalController> | null>(null);

export function usePlaylistRenewal() {
	const context = useContext(PlaylistRenewalContext);
	if (!context) throw new Error("usePlaylistRenewal must be used within PlaylistRenewalContext");
	return context;
}

export function usePlaylistRenewalController() {
	const { isAdmin } = useAuth();
	const [request, setRequest] = useState<{ action: "status" | "start" } | null>(null);
	const [progress, setProgress] = useState<PlaylistRenewalProgress | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isStarting, setIsStarting] = useState(false);
	const [isChecking, setIsChecking] = useState(false);
	const starting = useRef(false);

	const refresh = useCallback(() => {
		if (!starting.current) setRequest({ action: "status" });
	}, []);
	const start = () => {
		if (!isAdmin || starting.current || isChecking || error || progress?.status === "running") return;
		starting.current = true;
		setIsStarting(true);
		setError(null);
		setRequest({ action: "start" });
	};

	useEffect(() => {
		if (!isAdmin) {
			setRequest(null);
			setProgress(null);
			setError(null);
			setIsStarting(false);
			setIsChecking(false);
			starting.current = false;
			return;
		}
		if (!request) return;
		const controller = new AbortController();
		let timer: ReturnType<typeof setTimeout> | undefined;
		let cancelled = false;
		const run = async (action: "status" | "start") => {
			setIsChecking(true);
			const res = await fetchServer<RenewalResponse>("admin", action === "start" ? "/renew/playlist" : "/renew/playlist/status", {
				method: action === "start" ? "POST" : "GET",
				cache: "no-store",
				signal: controller.signal,
			});
			if (cancelled) return;
			setIsChecking(false);
			if (action === "start") {
				starting.current = false;
				setIsStarting(false);
			}
			const accepted = action === "start" ? res.status === 202 || res.status === 409 : res.status === 200;
			if (accepted && res.data?.progress) {
				setProgress(res.data.progress);
				setError(null);
				if (res.data.progress.status === "running") timer = setTimeout(() => void run("status"), 1500);
				return;
			}
			if (res.status === 401 || res.status === 403) {
				setProgress(null);
				setError("관리자 인증을 확인해 주세요. 다시 로그인한 뒤 상태를 확인할 수 있습니다.");
				return;
			}
			setError(action === "start"
				? "갱신 시작 여부를 확인하지 못했습니다. 서버 상태를 다시 확인합니다."
				: "진행 상태를 불러오지 못했습니다. 자동으로 다시 확인합니다.");
			// 시작 응답이 유실되어도 POST를 반복하지 않고 상태부터 확인한다.
			if (action === "start") void run("status");
			else timer = setTimeout(() => void run("status"), 1500);
		};
		void run(request.action);
		return () => {
			cancelled = true;
			controller.abort();
			clearTimeout(timer);
		};
	}, [isAdmin, request]);

	return {
		progress: isAdmin ? progress : null,
		error: isAdmin ? error : null,
		isStarting,
		isChecking,
		canStart: isAdmin && !!request && !!progress && !isStarting && !isChecking && !error && progress.status !== "running",
		start,
		refresh,
	};
}
