import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import { fetchServer, FetchOptions, Version, ServerAPIMap } from "../../lib/functions/fetch";

// fetchServer 어댑터 함수
//? 기존 fetchServer와 fetch_가 꽤 괜찮게 자리잡았다고 판단되어 원본을 해치지 않고 react-query와 연동할 수 있도록 구성하기 위함
const fetchServerAdaptor = async <TData = any, V extends Version = Version>(
	version: V,
	api: ServerAPIMap[V] | (string & {}),
	options?: FetchOptions,
): Promise<TData> => {
	const response = await fetchServer<TData, V>(version, api, options);

	// React Query가 에러를 감지할 수 있도록 HTTP 에러 상태일 때 강제로 throw
	//? 기존 fetchServer 형태로 바로 들어가면 react-query 측에서는 success로 간주하기 때문
	if (response.status >= 400 || response.status === 0) {
		throw new Error(response.statusText || "API Request Failed");
	}

	// 성공 시 React Query의 data 객체로 곧바로 들어갈 수 있게 data만 추출
	if (response.data === undefined) {
		throw new Error("No data returned from server");
	}

	return response.data;
};

// -----------------------------------------------------
// 2. GET 요청을 위한 Custom useQuery 훅
// -----------------------------------------------------
interface UseServerQueryProps<TData, V extends Version> {
	version: V;
	api: ServerAPIMap[V] | (string & {});
	options?: FetchOptions;
	queryOptions?: Omit<UseQueryOptions<TData, Error>, "queryKey" | "queryFn">;
}

// GET
export function useServerQuery<TData = any, V extends Version = Version>({
	version,
	api,
	options,
	queryOptions,
}: UseServerQueryProps<TData, V>) {
	return useQuery<TData, Error>({
		// 캐싱 키를 자동으로 생성 (엔드포인트와 파라미터를 배열로 구성)
		queryKey: [version, api, options?.body],
		queryFn: () => fetchServerAdaptor<TData, V>(version, api, options),
		...queryOptions,
	});
}

// Mutations
interface UseServerMutationProps<TData, TVariables, V extends Version> {
	version: V;
	api: ServerAPIMap[V] | (string & {});
	method?: "POST" | "PATCH" | "PUT" | "DELETE";
	mutationOptions?: UseMutationOptions<TData, Error, TVariables>;
}

export function useServerMutation<TData = any, TVariables = any, V extends Version = Version>({
	version,
	api,
	method = "POST",
	mutationOptions,
}: UseServerMutationProps<TData, TVariables, V>) {
	return useMutation<TData, Error, TVariables>({
		mutationFn: (variables: TVariables) =>
			fetchServerAdaptor<TData, V>(version, api, { method, body: variables as any }),
		...mutationOptions,
	});
}
