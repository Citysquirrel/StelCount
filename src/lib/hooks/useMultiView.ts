import { useEffect, useRef, useState } from "react";
import { fetchServer } from "../functions/fetch";
import { MultiViewData } from "../types";

export function useMultiView() {
	const intervalRef = useRef<number>();
	const [data, setData] = useState<MultiViewData[]>([]);

	const refetch = () => {
		fetchServer("/multiview", "v1").then((res) => {
			if (res.status === 200) {
				setData(res.data);
			}
		});
	};

	useEffect(() => {
		refetch();
		intervalRef.current = setInterval(() => {
			let second = new Date().getSeconds();
			if (second === 0 && import.meta.env.PROD) refetch();
		}, 1000);
		return () => {
			clearInterval(intervalRef.current);
		};
	}, []);

	return { data, setData, refetch, intervalRef };
}
