import { useRecoilState } from "recoil";
import {
	isLoadingState,
	serverErrorState,
	isStellarLoadingState,
	stellarState,
	LiveStatusState,
	liveStatusState,
	isLiveLoadingState,
	isLiveFetchingState,
	fetchInfoState,
	isLiveDetailFetchingState,
	StellarState,
} from "../Atom";
import { useEffect, useRef } from "react";
import { fetchServer } from "../functions/fetch";
import { useToast } from "@chakra-ui/react";
import isMobile from "is-mobile";
import { getLocale } from "../functions/etc";
import { useImprovedInterval } from "./useInterval";
import { MultiViewData, MultiViewDataData } from "../types";

export function useStellar() {
	const fbImages = [
		{
			name: "아이리 칸나",
			profileImage: "images/fb/airi_kanna.png",
		},
	];
	const toast = useToast();
	const intervalRef = useRef<number>();
	const [data, setData] = useRecoilState(stellarState);
	const [, setLiveStatus] = useRecoilState(liveStatusState);
	const [, setServerError] = useRecoilState(serverErrorState);
	const [, setIsLoading] = useRecoilState(isLoadingState);
	const [, setIsStellarLoading] = useRecoilState(isStellarLoadingState);
	const [, setIsLiveLoading] = useRecoilState(isLiveLoadingState);
	const [, setIsLiveFetching] = useRecoilState(isLiveFetchingState);
	const [, setIsLiveDetailFetching] = useRecoilState(isLiveDetailFetchingState);
	const [, setFetchInfo] = useRecoilState(fetchInfoState);

	const getLiveStatus = () => {
		setIsLiveFetching(true);

		fetchServer("/multiview", "v1")
			.then((res) => {
				if (res.status === 200) {
					const { data, upcoming } = res.data as MultiViewDataData; //? 우선 upcoming은 본 기능에서 사용되지 않음
					setLiveStatus(data);
					setFetchInfo((prev) => {
						const obj = { ...prev };
						obj["liveStatus"] = { date: getLocale() };
						return obj;
					});
				}
			})
			.finally(() => {
				setIsLiveLoading(false);
				setIsLiveFetching(false);
			});
	};

	const f = (isTimer?: boolean) => {
		if (isTimer) {
			setIsStellarLoading(true);
		}
		fetchServer("/current", "v1")
			.then((res) => {
				if (res) {
					if (res.status === 200) {
						const data: StellarState[] = res.data.current;

						const fbImageMap = fbImages.reduce((acc, cur) => {
							acc[cur.name] = cur.profileImage;
							return acc;
						}, {} as Record<string, string>);

						const mod = data.map((s) => ({
							...s,
							profileImage:
								(!s.profileImage || s.profileImage.trim() === "") && fbImageMap[s.name]
									? fbImageMap[s.name]
									: s.profileImage,
						}));

						setData(mod || []);
						// isTimer &&
						// 	toast({
						// 		description: "데이터를 새로 불러왔습니다.",
						// 		status: "info",
						// 		duration: isMobile() ? 1500 : 3000,
						// 		isClosable: true,
						// 	});
						setFetchInfo((prev) => {
							const obj = { ...prev };
							obj["stellar"] = { date: getLocale() };
							return obj;
						});
						getLiveStatus();
					}
					if (res.status === 429) {
						setServerError({ isError: true, statusCode: res.status });
						toast({ description: "분당 요청 횟수를 초과했습니다.", status: "warning" });
					}
					if (res.status === 500) {
						setServerError({ isError: true, statusCode: res.status });
						isTimer &&
							toast({
								description: "데이터 로드에 실패했습니다. 지속 발생 시 개발자에게 문의하세요.",
								status: "error",
								duration: 3000,
								isClosable: true,
							});
					}
				}
			})
			.finally(() => {
				setIsLoading(false);
				setIsStellarLoading(false);
			});
	};

	useEffect(() => {
		f();
		// intervalRef.current = setInterval(() => {
		// 	let second = new Date().getSeconds();
		// 	if (second === 0 && import.meta.env.PROD) f(true);
		// }, 1000);
		// return () => {
		// 	clearInterval(intervalRef.current);
		// };
	}, []);

	const { intervalId } = useImprovedInterval(
		() => {
			f(true);
		},
		60000,
		{ executeCallbackWhenWindowFocused: true }
	);

	return { data, setData, refetch: f, intervalRef: intervalId };
}
