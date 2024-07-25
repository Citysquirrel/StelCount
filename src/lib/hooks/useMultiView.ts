import { useEffect, useRef, useState } from "react";
import { fetchServer } from "../functions/fetch";
import { MultiViewData } from "../types";
import { useRecoilState } from "recoil";
import { nowState } from "../Atom";

export function useMultiView() {
	const intervalRef = useRef<number>();
	const [data, setData] = useState<MultiViewData[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [, setNow] = useRecoilState(nowState);

	const refetch = (isTimer?: boolean) => {
		isTimer && setIsLoading(true);
		fetchServer(`/multiview`, "v1")
			.then((res) => {
				if (res.status === 200) {
					const applyType: MultiViewData[] = res.data;
					setData([
						...applyType
							.filter((stream) => stream.openLive)
							.sort((a, b) => new Date(b.openDate!).getTime() - new Date(a.openDate!).getTime()),
						...applyType
							.filter((stream) => !stream.openLive)
							.sort((a, b) => new Date(b.closeDate!).getTime() - new Date(a.closeDate!).getTime()),
					]);
					setNow(new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })));
				}
			})
			.finally(() => {
				setIsLoading(false);
			});
	};

	useEffect(() => {
		refetch();
		intervalRef.current = setInterval(() => {
			let second = new Date().getSeconds();
			if (second === 0 || second === 30) refetch(true);
		}, 1000);
		return () => {
			clearInterval(intervalRef.current);
		};
	}, []);

	return { data, setData, isLoading, refetch, intervalRef };
}
