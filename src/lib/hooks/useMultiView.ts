import { useCallback, useEffect, useRef, useState } from "react";
import { fetchServer } from "../functions/fetch";
import { LiteralUnion, MultiViewData, MultiViewDataData } from "../types";
import { useRecoilState } from "recoil";
import { nowState } from "../Atom";
import { getDiffArray, Diff } from "../functions/etc";

async function fetchMultiView<V extends "v1" | "v2">(version: V, signal: AbortSignal, body?: Record<string, string>) {
	type Data = V extends "v1" ? MultiViewDataData : MultiViewData[];
	const request = async (timeout: number) => {
		const response = await fetchServer<Data>(version, "/multiview", {
			method: version === "v1" ? "GET" : "POST",
			body,
			signal,
			timeout,
		});
		const streams = version === "v1" ? (response.data as MultiViewDataData | undefined)?.data : response.data;
		if (
			response.status === 200 &&
			(!Array.isArray(streams) || streams.some((stream) => !stream || typeof stream !== "object"))
		) {
			return { ...response, status: 502, statusText: "Invalid multiview response", data: undefined };
		}
		return response;
	};
	const response = await request(3000);
	const shouldRetry = response.status === 408 || response.status >= 500;
	return !signal.aborted && shouldRetry ? request(10000) : response;
}

export function useMultiView() {
	const intervalRef = useRef<number>();
	const customIntervalRef = useRef<number>();
	const requestRef = useRef<AbortController>();
	const customRequestRef = useRef<AbortController>();
	const prevDataRef = useRef<MultiViewData[]>([]);
	const diffRef = useRef<(MultiViewData & { diff?: string[] | Diff<MultiViewData>[] })[]>([]);
	const [data, setData] = useState<MultiViewData[]>([]);
	const dataRef = useRef(data);
	const [customStreams, setCustomStreams] = useState<MultiViewData[]>([]);
	const customStreamsRef = useRef<MultiViewData[]>(customStreams);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isCustomLoading, setIsCustomLoading] = useState<boolean>(false);
	const [statusCode, setStatusCode] = useState<StatusCode>({ main: 200, custom: 200 });

	const [, setNow] = useRecoilState(nowState);

	const refetch = useCallback((activeLoading?: boolean) => {
		if (requestRef.current) return;
		const controller = new AbortController();
		requestRef.current = controller;
		activeLoading && setIsLoading(true);

		fetchMultiView("v1", controller.signal)
			.then((res) => {
				if (controller.signal.aborted) return;
				setStatusCode((prev) => ({ ...prev, main: res.status }));
				if (res.status === 200 && res.data) {
					//TODO: upcoming 등 유튜브 데이터들의 알림 구현
					const { data: applyType } = res.data;
					const opens = applyType.filter((stream) => stream.openLive);
					const closes = applyType.filter((stream) => !stream.openLive);
					const defaultDate = "2000-01-01";

					setData(() => {
						const parsed = [
							...opens.sort(
								(a, b) => new Date(b.openDate || defaultDate).getTime() - new Date(a.openDate || defaultDate).getTime(),
							),
							...closes.sort(
								(a, b) =>
									new Date(b.closeDate || defaultDate).getTime() - new Date(a.closeDate || defaultDate).getTime(),
							),
						];
						// console.log(getDiffArray(prev, parsed, "chzzkId"));
						return parsed || [];
					});
					diffRef.current = getDiffArray(prevDataRef.current, applyType, "uuid");
					prevDataRef.current = applyType;

					setNow(new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })));
				}
			})
			.finally(() => {
				if (requestRef.current === controller) {
					requestRef.current = undefined;
					setIsLoading(false);
				}
			});
	}, [setNow]);

	const refetchCustom = useCallback((activeLoading?: boolean, initialStreams?: MultiViewData[]) => {
		if (customRequestRef.current) return;
		const requestedStreams = initialStreams ?? customStreamsRef.current;
		const stellarIds = new Set(dataRef.current.map((member) => member.chzzkId));
		const latestStreams = requestedStreams.filter((s) => !stellarIds.has(s.chzzkId));
		if (latestStreams.length === 0) {
			setStatusCode((prev) => ({ ...prev, custom: 200 }));
			return;
		}
		const controller = new AbortController();
		customRequestRef.current = controller;
		activeLoading && setIsCustomLoading(true);
		const requestBody = latestStreams.reduce(
			(acc, data) => {
				if (data.chzzkId) {
					acc[data.uuid] = data.chzzkId;
				}
				return acc;
			},
			{} as Record<string, string>,
		);
		fetchMultiView("v2", controller.signal, requestBody)
			.then((res) => {
				if (controller.signal.aborted) return;
				setStatusCode((prev) => ({ ...prev, custom: res.status }));
				if (res.status === 200 && res.data) {
					const streams = res.data;
					setCustomStreams((current) => {
						// 요청 중 목록이 바뀌면 다음 갱신에서 반영한다.
						if (current !== requestedStreams) return current;
						return streams.map((stream) => ({
							...stream,
							isBookmarked: requestedStreams.find((previous) => previous.uuid === stream.uuid)?.isBookmarked,
						})).sort((a, b) => Number(!!b.openLive) - Number(!!a.openLive));
					});
				}
			})
			.finally(() => {
				if (customRequestRef.current === controller) {
					customRequestRef.current = undefined;
					setIsCustomLoading(false);
				}
			});
	}, []);

	useEffect(() => {
		dataRef.current = data;
	}, [data]);

	// customStreams 동기화
	useEffect(() => {
		customStreamsRef.current = customStreams;
	}, [customStreams]);

	useEffect(() => {
		refetch();
		intervalRef.current = setInterval(() => {
			refetch(true);
		}, 30000);
		return () => {
			clearInterval(intervalRef.current);
			requestRef.current?.abort();
			requestRef.current = undefined;
			customRequestRef.current?.abort();
			customRequestRef.current = undefined;
		};
	}, [refetch]);

	const hasCustomStreams = customStreams.length > 0;

	useEffect(() => {
		if (hasCustomStreams) {
			customIntervalRef.current = setInterval(() => {
				refetchCustom(true);
			}, 60000);
		}
		return () => {
			clearInterval(customIntervalRef.current);
		};
	}, [hasCustomStreams, refetchCustom]);

	return {
		data,
		setData,
		customStreams,
		setCustomStreams,
		isLoading,
		isCustomLoading,
		statusCode,
		refetch,
		refetchCustom,
		intervalRef,
		customIntervalRef,
		diffRef,
		prevDataRef,
	};
}

type StatusCodeKey = LiteralUnion<"main" | "custom">;

export type StatusCode = {
	[K in StatusCodeKey]: number;
};
