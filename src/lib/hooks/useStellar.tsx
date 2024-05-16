// 사이트에 들어왔을 때, 주기적으로 스텔라들의 데이터를 업데이트.
// 이는 api 콜을 최소화하기 위한 방안.
// 데이터 종류에는 (유튜브, 치지직)구독자수, 각 컨텐츠들의 조회수, 유튜브 재생목록 정보가 포함

import { useRecoilState } from "recoil";
import { PlatformInfosDetail, StellarInfo, StellarState, stellarState } from "../Atom";
import { useEffect } from "react";
import { fetchServer } from "../functions/fetch";

export function useStellar() {
	const [data, setData] = useRecoilState(stellarState);
	const f = () => {
		fetchServer("/current", "v1").then((res) => {
			if (res) {
				if (res.status === 200) {
					const { data, stellar } = res.data as { data: PlatformInfos; stellar: StellarInfo[] };
					const integrated: StellarState[] = [];
					for (let s of stellar) {
						integrated.push({ name: s.name, uuid: s.uuid, youtube: data[s.uuid].youtube, chzzk: data[s.uuid].chzzk });
					}
					console.log(integrated);
					setData(integrated);
				}
				if (res.status === 500) {
					alert("내부 서버 에러입니다. 지속 발생 시 개발자에게 문의하세요.");
				}
			}
		});
	};
	useEffect(() => {
		f();
		const i = setInterval(() => {
			f();
		}, 60000);
		return () => {
			clearInterval(i);
		};
	}, []);

	return { data, setData };
}

interface PlatformInfos {
	[key: string]: { youtube: PlatformInfosDetail[]; chzzk: PlatformInfosDetail };
}
