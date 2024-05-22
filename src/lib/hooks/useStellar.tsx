// 사이트에 들어왔을 때, 주기적으로 스텔라들의 데이터를 업데이트.
// 이는 api 콜을 최소화하기 위한 방안.
// 데이터 종류에는 (유튜브, 치지직)구독자수, 각 컨텐츠들의 조회수, 유튜브 재생목록 정보가 포함

import { useRecoilState } from "recoil";
import {
	PlatformInfos,
	StellarInfo,
	StellarState,
	isLoadingState,
	isServerErrorState,
	isStellarLoadingState,
	stellarState,
} from "../Atom";
import { useEffect } from "react";
import { fetchServer } from "../functions/fetch";
import { useToast } from "@chakra-ui/react";

export function useStellar() {
	const toast = useToast();
	const [data, setData] = useRecoilState(stellarState);
	const [, setIsServerError] = useRecoilState(isServerErrorState);
	const [, setIsLoading] = useRecoilState(isLoadingState);
	const [, setIsStellarLoading] = useRecoilState(isStellarLoadingState);

	const f = (isTimer?: boolean) => {
		if (isTimer) {
			setIsStellarLoading(true);
		}
		fetchServer("/current", "v1")
			.then((res) => {
				if (res) {
					if (res.status === 200) {
						// const { data, stellar } = res.data as { data: PlatformInfos; stellar: StellarInfo[] };
						// const integrated: StellarState[] = [];

						// for (let s of stellar) {
						// 	integrated.push({
						// 		name: s.name,
						// 		group: s.group,
						// 		uuid: s.uuid,
						// 		colorCode: s.colorCode,
						// 		youtube: data[s.uuid] ? data[s.uuid].youtube : [],
						// 		chzzk: data[s.uuid] ? data[s.uuid].chzzk : {},
						// 	});
						// }
						// console.log(integrated);
						setData(res.data);
						isTimer &&
							toast({ description: "데이터를 새로 불러왔습니다.", status: "info", duration: 3000, isClosable: true });
					}
					if (res.status === 500) {
						// alert("내부 서버 에러입니다. 지속 발생 시 개발자에게 문의하세요.");
						setIsServerError(true);
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
			f(true);
		}, 60000);
		return () => {
			clearInterval(i);
		};
	}, []);

	return { data, setData, refetch: f };
}

// interface PlatformInfos {
// 	[key: string]: { youtube: PlatformInfosDetail[]; chzzk: PlatformInfosDetail; videos: VideoDataDetail[] };
// }
