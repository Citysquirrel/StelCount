export interface ServerAPIMap {
	none: "";
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

	v2: "/maintenance" | "/songbook";
	admin:
		| "/settings" // GET, POST /settings
		| "/dashboard"
		| "/songbook"
		| "/songbook/import"
		| "/stellars"
		| "/stellar"
		| "/stellar/:id"
		| "/groups"
		| "/group"
		| "/group/:id";
}

export type Version = keyof ServerAPIMap;

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

// ==========================================
// UI Dock으로 보낼 로그 타입 및 이벤트 함수
// ==========================================
export type NetworkLog = {
	id: string;
	url: string;
	method: string;
	status: "pending" | "success" | "error";
	statusCode?: number;
	reqBody?: any;
	resBody?: any;
	time: string;
	duration?: number;
};

const dispatchNetworkLog = (log: NetworkLog) => {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent("network-log", { detail: log }));
	}
};
// ==========================================

export async function fetch_<T = any>(input: RequestInfo | URL, options?: FetchOptions): Promise<FetchResponse> {
	// 로깅을 위한 고유 ID 및 시간 측정, URL 파싱
	const logId = Math.random().toString(36).substring(7);
	const startTime = performance.now();
	const urlStr = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
	const method = options?.method || "GET";

	// 로그 통신 시작 알림
	dispatchNetworkLog({
		id: logId,
		url: urlStr,
		method,
		status: "pending",
		reqBody: options?.body,
		time: new Date().toLocaleTimeString(),
	});

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

		// 성공(또는 HTTP 에러 응답) 알림
		dispatchNetworkLog({
			id: logId,
			url: urlStr,
			method,
			status: res.ok ? "success" : "error", // 4xx, 5xx 에러 보기 쉽게 분리
			statusCode: res.status,
			resBody: response.data,
			time: new Date().toLocaleTimeString(),
			duration: Math.round(performance.now() - startTime),
		});

		return response;
	} catch (err: any) {
		// 에러 관련
		const errorMessage = err instanceof Error ? err.message : String(err);

		// 네트워크 단절 및 타임아웃 캐치 알림
		dispatchNetworkLog({
			id: logId,
			url: urlStr,
			method,
			status: "error",
			statusCode: err.name === "AbortError" ? 408 : 500,
			resBody: errorMessage,
			time: new Date().toLocaleTimeString(),
			duration: Math.round(performance.now() - startTime),
		});

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

export async function fetchServer<TData = any, V extends Version = Version, TBody = any>(
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

	// serializedBody의 타입을 명시적으로 BodyInit | undefined로 지정
	let serializedBody: BodyInit | undefined = options?.body as unknown as BodyInit;

	// 객체이면서 FormData가 아닐 때만 JSON 문자열로 직렬화 (string은 BodyInit에 포함되므로 에러 통과)
	// +
	// FormData일 때는 브라우저가 boundary를 포함한 Content-Type을 알아서 세팅하도록
	// 우리가 수동으로 "Content-Type"을 덮어쓰면 안 됩니다.
	let isFormData = false;
	if (options?.body && typeof options.body === "object") {
		if (options.body instanceof FormData) {
			isFormData = true;
		} else {
			serializedBody = JSON.stringify(options.body);
		}
	}

	const defaultHeaders: Record<string, string> = {
		// ✨ 핵심: CSRF 방어용 커스텀 헤더 (Axios의 기본 동작과 동일하게 세팅)
		"X-Requested-With": "XMLHttpRequest",

		"Cache-Control": "no-cache, no-store, must-revalidate",
		Pragma: "no-cache",
		Expires: "0",
	};

	// FormData가 아닐 때만 application/json 강제 주입
	if (!isFormData) {
		defaultHeaders["Content-Type"] = "application/json";
	}

	return await fetch_<TData>(fullUrl, {
		...options,
		body: serializedBody, // ✅ 에러 없이 안전하게 주입됨
		headers: {
			...defaultHeaders,
			...options?.headers,
		},
		credentials: "include",
	});
}
