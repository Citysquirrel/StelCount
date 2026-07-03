import { useCallback, useEffect, useRef, useState } from "react";
import { fetchServer } from "../functions/fetch";
import { LiteralUnion, MultiViewData, MultiViewDataData } from "../types";
import { useRecoilState } from "recoil";
import { nowState } from "../Atom";
import { getDiffArray, Diff } from "../functions/etc";

export function useMultiView() {
	const intervalRef = useRef<number>();
	const customIntervalRef = useRef<number>();
	const prevDataRef = useRef<MultiViewData[]>([]);
	const diffRef = useRef<(MultiViewData & { diff?: string[] | Diff<MultiViewData>[] })[]>([]);
	const [data, setData] = useState<MultiViewData[]>([]);
	const [customStreams, setCustomStreams] = useState<MultiViewData[]>([]);
	const customStreamsRef = useRef<MultiViewData[]>(customStreams);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isCustomLoading, setIsCustomLoading] = useState<boolean>(false);
	const [statusCode, setStatusCode] = useState<StatusCode>({ main: 200, custom: 200 });

	const [, setNow] = useRecoilState(nowState);

	const refetch = (activeLoading?: boolean) => {
		activeLoading && setIsLoading(true);

		fetchServer("v1", `/multiview`)
			.then((res) => {
				setStatusCode((prev) => ({ ...prev, main: res.status }));
				if (res.status === 200) {
					//TODO: upcoming 등 유튜브 데이터들의 알림 구현
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
					const { data: applyType, upcoming } = res.data as MultiViewDataData;
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
				setIsLoading(false);
			});
	};

	const refetchCustom = useCallback((activeLoading?: boolean) => {
		activeLoading && setIsCustomLoading(true);
		const stellarIds = new Set(data.map((member) => member.chzzkId));

		const latestStreams = customStreamsRef.current.filter((s) => !stellarIds.has(s.chzzkId));
		const requestBody = latestStreams.reduce(
			(acc, data) => {
				if (data.chzzkId) {
					acc[data.uuid] = data.chzzkId;
				}
				return acc;
			},
			{} as Record<string, string>,
		);
		fetchServer("v2", `/multiview`, { method: "POST", body: requestBody })
			.then((res) => {
				setStatusCode((prev) => ({ ...prev, custom: res.status }));
				if (res.status === 200) {
					const data: MultiViewData[] = res.data;
					setCustomStreams(data.sort((a, b) => Number(!!b.openLive) - Number(!!a.openLive)));
				}
			})
			.finally(() => {
				setIsCustomLoading(false);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const hasCustomStreams = customStreams.length > 0;

	useEffect(() => {
		if (hasCustomStreams) {
			customIntervalRef.current = setInterval(() => {
				refetchCustom(true);
			}, 30000);
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
