import type { LiveStatusState } from "../Atom";
import type { DefaultResponseData } from "../functions/fetch";
import type { StellarV2State } from "../types";
import { useServerQuery } from "./useServerApi";

export function useObservatoryData() {
	const videos = useServerQuery<DefaultResponseData<StellarV2State[]>, "v2", StellarV2State[]>({
		version: "v2",
		api: "/current",
		queryOptions: {
			select: (response) => {
				if (!Array.isArray(response?.data)) throw new Error("영상 정보를 불러오지 못했어요.");
				return response.data;
			},
			staleTime: 30000,
			refetchInterval: 60000,
			retry: 1,
		},
	});
	const live = useServerQuery<DefaultResponseData<LiveStatusState[]>, "v1", LiveStatusState[]>({
		version: "v1",
		api: "/multiview",
		queryOptions: {
			select: (response) => {
				if (!Array.isArray(response?.data)) throw new Error("라이브 정보를 불러오지 못했어요.");
				return response.data;
			},
			staleTime: 30000,
			refetchInterval: 60000,
			retry: 1,
		},
	});
	return { videos, live };
}
