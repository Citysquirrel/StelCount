import { useRecoilState } from "recoil";
import {
	isLoadingState,
	serverErrorState,
	isStellarLoadingState,
	stellarState,
	LiveStatusState,
	liveStatusState,
	isLiveLoadingState,
} from "../Atom";
import { useEffect, useState } from "react";
import { fetchServer } from "../functions/fetch";
import { useToast } from "@chakra-ui/react";
import isMobile from "is-mobile";

export function useStellar() {
	const toast = useToast();
	const [data, setData] = useRecoilState(stellarState);
	const [_, setLiveStatus] = useRecoilState(liveStatusState);
	const [, setServerError] = useRecoilState(serverErrorState);
	const [, setIsLoading] = useRecoilState(isLoadingState);
	const [, setIsStellarLoading] = useRecoilState(isStellarLoadingState);
	const [, setIsLiveLoading] = useRecoilState(isLiveLoadingState);

	const getLiveStatus = () => {
		fetchServer("/live-status", "v1")
			.then((res) => {
				if (res.status === 200) {
					const data = res.data as LiveStatusState[];
					setLiveStatus(data);
				}
			})
			.finally(() => {
				setIsLiveLoading(false);
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
						setData(res.data || []);
						isTimer &&
							toast({
								description: "데이터를 새로 불러왔습니다.",
								status: "info",
								duration: isMobile() ? 1500 : 3000,
								isClosable: true,
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
