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
	//? 기존 fetchServer(fetch_) 형태로 바로 return 들어가면
	//? react-query 측에서는 success로 간주하기 때문에 throw로 명시해주어야함
	if (response.status >= 400 || response.status === 0) {
		throw new Error(response.statusText || "API Request Failed");
	}

	return response.data as TData;
};

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
	// ✨ 문자열 패턴("/stellar/:id")을 쉽게 쓸 수 있도록 (string & {}) 유지
	api: ServerAPIMap[V] | (string & {}) | ((variables: TVariables) => ServerAPIMap[V] | (string & {}));
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
		mutationFn: (variables: TVariables) => {
			let resolvedApi = "";
			let finalBody = variables as any;

			if (typeof api === "function") {
				// 1. 콜백 함수 형태인 경우
				resolvedApi = api(variables);
			} else if (typeof api === "string") {
				// 2. 문자열 형태인 경우
				resolvedApi = api;

				// "/stellar/:id" 같은 패턴이 있고, variables가 일반 객체일 때
				const isPlainObject =
					variables !== null &&
					typeof variables === "object" &&
					!Array.isArray(variables) &&
					!(variables instanceof FormData);

				if (api.includes(":") && isPlainObject) {
					finalBody = { ...variables }; // 원본 오염 방지를 위해 얕은 복사

					// 정규식으로 ":id", ":stellarId" 같은 파라미터 추출
					const pathParams = api.match(/:[a-zA-Z0-9_]+/g);

					if (pathParams) {
						pathParams.forEach((param) => {
							const key = param.substring(1); // 앞에 붙은 ":" 제거

							if (key in finalBody) {
								// ① URL 완성: ":id" 부분을 실제 값(예: 1)으로 치환
								resolvedApi = resolvedApi.replace(param, encodeURIComponent(String(finalBody[key])));

								// ② Body 최적화: URL로 빠진 데이터는 서버 Body에서 깔끔하게 삭제!
								delete finalBody[key];
							}
						});
					}
				}
			}

			return fetchServerAdaptor<TData, V>(version, resolvedApi, {
				method,
				body: finalBody,
			});
		},
		...mutationOptions,
	});
}
