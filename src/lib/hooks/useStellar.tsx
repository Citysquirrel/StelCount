// 사이트에 들어왔을 때, 주기적으로 스텔라들의 데이터를 업데이트.
// 이는 api 콜을 최소화하기 위한 방안.
// 데이터 종류에는 (유튜브, 치지직)구독자수, 각 컨텐츠들의 조회수, 유튜브 재생목록 정보가 포함

import { useRecoilState } from "recoil";
import { stellarState } from "../Atom";
import { useEffect } from "react";
import { fetchServer } from "../functions/fetch";

export function useStellar() {
	const [data, setData] = useRecoilState(stellarState);

	useEffect(() => {
		fetchServer("/current", "v1").then((res) => {
			const { data, stellar } = res.data as { data: PlatformInfos; stellar: StellarInfo[] };
			console.log(data, stellar);
			setData((prev) => {
				return data;
			});
		});
	}, []);
}

interface StellarInfo {
	name: string;
	uuid: string;
}

interface PlatformInfos {
	[key: string]: { youtube: PlatformInfosDetail; chzzk: PlatformInfosDetail };
}
interface PlatformInfosDetail {
	viewCount?: string;
	subscriberCount?: string;
	videoCount?: string;
	followerCount?: string;
}
