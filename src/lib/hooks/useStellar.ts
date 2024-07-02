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
} from "../Atom";
import { useEffect } from "react";
import { fetchServer } from "../functions/fetch";
import { useToast } from "@chakra-ui/react";
import isMobile from "is-mobile";
import { getLocale } from "../functions/etc";

export function useStellar() {
	const toast = useToast();
	const [data, setData] = useRecoilState(stellarState);
	const [, setLiveStatus] = useRecoilState(liveStatusState);
	const [, setServerError] = useRecoilState(serverErrorState);
	const [, setIsLoading] = useRecoilState(isLoadingState);
	const [, setIsStellarLoading] = useRecoilState(isStellarLoadingState);
	const [, setIsLiveLoading] = useRecoilState(isLiveLoadingState);
	const [, setIsLiveFetching] = useRecoilState(isLiveFetchingState);
	const [, setIsLiveDetailFetching] = useRecoilState(isLiveDetailFetchingState);
	const [, setFetchInfo] = useRecoilState(fetchInfoState);

	const getLiveDetail = () => {
		setIsLiveDetailFetching(true);
		fetchServer("/live-detail", "v1")
			.then((res) => {
				if (res.status === 200) {
					const data = res.data as LiveStatusState[];
					setLiveStatus(data);
					setFetchInfo((prev) => {
						const obj = { ...prev };
						obj["liveDetail"] = { date: getLocale() };
						return obj;
					});
				}
			})
			.finally(() => setIsLiveDetailFetching(false));
	};

	const getLiveStatus = () => {
		setIsLiveFetching(true);
		fetchServer("/live-status", "v1")
			.then((res) => {
				if (res.status === 200) {
					const data = res.data as LiveStatusState[];
					setLiveStatus((prev) => {
						if (prev.length === 0) return data;
						const arr = [...prev];
						for (let item of arr) {
							const liveStatus = data.find((l) => l.uuid === item.uuid)?.liveStatus;
							const curIdx = arr.findIndex((a) => a.uuid === item.uuid);
							arr[curIdx] = { ...arr[curIdx], liveStatus };
						}
						return arr;
					});
					setFetchInfo((prev) => {
						const obj = { ...prev };
						obj["liveStatus"] = { date: getLocale() };
						return obj;
					});
					getLiveDetail();
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
						setData(res.data.current || []);
						isTimer &&
							toast({
								description: "데이터를 새로 불러왔습니다.",
								status: "info",
								duration: isMobile() ? 1500 : 3000,
								isClosable: true,
							});
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
		const i = setInterval(() => {
			let second = new Date().getSeconds();
			if (second === 0 && import.meta.env.PROD) f(true);
		}, 1000);
		return () => {
			clearInterval(i);
		};
	}, []);

	return { data, setData, refetch: f };
}
