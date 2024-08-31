import { useEffect, useRef, useState } from "react";
import { fetchServer } from "../functions/fetch";
import { MultiViewData } from "../types";
import { useRecoilState } from "recoil";
import { nowState } from "../Atom";

export function useMultiView() {
	const intervalRef = useRef<number>();
	const [data, setData] = useState<MultiViewData[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isCustomLoading, setIsCustomLoading] = useState<boolean>(true);
	const [liveInfos, setLiveInfos] = useState<LiveStatusDict>({
		isLoaded: false,
		liveCount: 0,
		justNowLiveList: [],
	});
	const [, setNow] = useRecoilState(nowState);

	const refetch = (activeLoading?: boolean) => {
		activeLoading && setIsLoading(true);
		fetchServer(`/multiview`, "v1")
			.then((res) => {
				if (res.status === 200) {
					const applyType: MultiViewData[] = res.data;
					const opens = applyType.filter((stream) => stream.openLive);
					const closes = applyType.filter((stream) => !stream.openLive);
					setData([
						...opens.sort((a, b) => new Date(b.openDate!).getTime() - new Date(a.openDate!).getTime()),
						...closes.sort((a, b) => new Date(b.closeDate!).getTime() - new Date(a.closeDate!).getTime()),
					]);
					setNow(new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })));
					setLiveInfos({
						isLoaded: true,
						liveCount: opens.length,
						justNowLiveList: opens.map(({ chzzkId, uuid, channelName, openDate }) => ({
							chzzkId,
							uuid,
							channelName,
							openDate,
						})),
					});
				}
			})
			.finally(() => {
				setIsLoading(false);
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

	return { data, setData, isLoading, isCustomLoading, refetch, intervalRef, liveInfos };
}

interface LiveStatusDict {
	liveCount: number;
	isLoaded: boolean;
	justNowLiveList: JustNowLive[];
}

interface JustNowLive {
	chzzkId: string | undefined;
	uuid: string;
	channelName?: string;
	openDate?: string;
}
