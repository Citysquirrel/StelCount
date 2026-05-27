interface ServerAPIMap {
	// 기존에 있던 'none' 버전 (인증 등 버전이 없는 공통 API용. 불필요하시면 비워두셔도 됩니다)
	none: "";

	// 📌 제공해주신 v1 API 전체 매핑
	v1:
		| "/debug-sentry"
		| "/user/me"
		| "/naver"
		| "/login"
		| "/signup"
		| "/logout"
		| "/yid"
		| "/ypid"
		| "/stellars"
		| "/stellar" // POST /stellar 용도
		| "/videos/sorted-by-published"
		| "/renew"
		| "/tags"
		| "/tag" // POST /tag 용도
		| "/current"
		| "/live-status"
		| "/live-detail"
		| "/multiview"
		| "/search-streamer"
		| "/video-info"
		// 🔗 동적 파라미터 (Dynamic Routes) 지원
		| `/stellar/${number}` // GET, PATCH, DELETE /stellar/:id
		| `/y/${string}` // POST /y/:videoId
		| `/ypat/${string}` // GET /ypat/:videoId
		| `/tag/${number}`; // GET, PATCH, DELETE /tag/:id

	// 📌 제공해주신 v2 API 매핑
	v2: "/settings"; // GET, POST /settings
}

type Version = keyof ServerAPIMap;
type AllAPIs = ServerAPIMap[Version];

export interface FetchOptions extends RequestInit {
	method?: "GET" | "POST" | "DELETE" | "PATCH" | "PUT" | (string & {});
	timeout?: number;
}

interface FetchResponse<T = any> {
	data?: T;
	headers?: Headers;
	status: number;
	statusText: string;
}

export async function fetch_<T = any>(input: RequestInfo | URL, options?: FetchOptions): Promise<FetchResponse> {
	const timeout = options?.timeout ?? 20000;
	const controller = new AbortController();
	const id = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : undefined;
	try {
		const res = await fetch(input, {
			...options,
			signal: controller.signal,
		});

		const response: FetchResponse<T> = {
			data: await res.json().catch(() => undefined),
			headers: res.headers,
			status: res.status,
			statusText: res.statusText,
		};

		return response;
	} catch (err: any) {
		// 에러 관련
		const errorMessage = err instanceof Error ? err.message : String(err);
		return {
			data: undefined,
			status: err.name === "AbortError" ? 408 : 500, // 타임아웃 시 408 Request Timeout 센스
			statusText: errorMessage,
			headers: undefined,
		};
	} finally {
		if (id) clearTimeout(id);
	}
}

interface FetchServerOption<B = any> extends Omit<FetchOptions, "body"> {
	body?: B;
	isNotAPI?: boolean;
}

export async function fetchServer<V extends Version, TData = any, TBody = any>(
	version: V,
	api: ServerAPIMap[V] | (string & {}),
	options?: FetchServerOption<TBody>,
): Promise<FetchResponse<TData>> {
	const baseUrl = (import.meta.env.VITE_SERVER_URL ?? "").replace(/\/$/, "");
	const apiSegment = options?.isNotAPI ? "" : "api";
	const versionSegment = version === "none" ? "" : version;
	const cleanApi = api.startsWith("/") ? api : `/${api}`;

	const urlPath = [apiSegment, versionSegment].filter(Boolean).join("/");
	const fullUrl = `${baseUrl}/${urlPath}${cleanApi}`.replace(/\/+/g, "/").replace(":/", "://");

	// ✅ 수정된 부분: serializedBody의 타입을 명시적으로 BodyInit | undefined로 지정합니다.
	let serializedBody: BodyInit | undefined = options?.body as unknown as BodyInit;

	// 객체이면서 FormData가 아닐 때만 JSON 문자열로 직렬화 (string은 BodyInit에 포함되므로 에러 통과)
	if (options?.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
		serializedBody = JSON.stringify(options.body);
	}

	return await fetch_<TData>(fullUrl, {
		...options,
		body: serializedBody, // ✅ 에러 없이 안전하게 주입됨
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "no-cache, no-store, must-revalidate",
			Pragma: "no-cache",
			Expires: "0",
			...options?.headers,
		},
		credentials: "include",
	});
}

// export async function fetchServer(api: ServerAPI, version: Version, options?: FetchServerOption) {
// 	return await fetch_(
// 		`${import.meta.env.VITE_SERVER_URL}/${options?.isNotAPI === true ? "" : "api/"}${
// 			version === "none" ? "" : version + ""
// 		}${api}`,
// 		{
// 			body: options?.body,
// 			headers: {
// 				"Content-Type": "application/json",
// 				"Cache-Control": "no-cache, no-store, must-revalidate",
// 				Pragma: "no-cache",
// 				Expires: "0",
// 				...options?.headers,
// 			},
// 			credentials: "include",
// 			// credentials: import.meta.env.DEV ? "include" : "same-origin",
// 			...options,
// 		},
// 	);
// }
