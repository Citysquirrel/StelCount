import { useEffect, useRef, useState } from "react";
import { fetchServer } from "../functions/fetch";
import { MultiViewData, MultiViewDataData } from "../types";
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
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isCustomLoading, setIsCustomLoading] = useState<boolean>(false);
	const [statusCode, setStatusCode] = useState<StatusCode>({ main: 200, custom: 200 });

	const [, setNow] = useRecoilState(nowState);

	const refetch = (activeLoading?: boolean) => {
		activeLoading && setIsLoading(true);

		fetchServer(`/multiview`, "v1")
			.then((res) => {
				setStatusCode((prev) => ({ ...prev, main: res.status }));
				if (res.status === 200) {
					const { data: applyType, upcoming } = res.data as MultiViewDataData;
					const opens = applyType.filter((stream) => stream.openLive);
					const closes = applyType.filter((stream) => !stream.openLive);
					const defaultDate = "2000-01-01";

					setData((prev) => {
						const parsed = [
							...opens.sort(
								(a, b) => new Date(b.openDate || defaultDate).getTime() - new Date(a.openDate || defaultDate).getTime()
							),
							...closes.sort(
								(a, b) =>
									new Date(b.closeDate || defaultDate).getTime() - new Date(a.closeDate || defaultDate).getTime()
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

	const refetchCustom = (activeLoading?: boolean) => {
		activeLoading && setIsCustomLoading(true);
		fetchServer(`/multiview`, "v1", { method: "POST", body: JSON.stringify({ customStreams }) })
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
	};

	useEffect(() => {
		refetch();
		intervalRef.current = setInterval(() => {
			refetch(true);
		}, 30000);
		return () => {
			clearInterval(intervalRef.current);
		};
	}, []);

	useEffect(() => {
		if (customStreams.length > 0) {
			customIntervalRef.current = setInterval(() => {
				refetchCustom(true);
			}, 60000);
		}
		return () => {
			clearInterval(customIntervalRef.current);
		};
	}, []);

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

type StatusCodeKey = "main" | "custom" | (string & {});

export type StatusCode = {
	[K in StatusCodeKey]: number;
};
