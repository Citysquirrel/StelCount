export interface FetchOptions extends RequestInit {
	method?: "POST" | "DELETE" | "PATCH" | (string & {});
	timeout?: number;
}

export async function fetch_(input: RequestInfo | URL, options?: FetchOptions) {
	try {
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), options?.timeout || 5000);
		const res = await fetch(input, {
			...options,
			signal: controller.signal,
		});
		clearTimeout(id);
		const { headers, status, statusText } = res;

		const response = {
			data: await res.json().catch((err) => {
				return;
			}),
			headers,
			status,
			statusText,
		};

		return response;
	} catch (err: any) {
		// 에러 관련
		return { data: undefined, status: 500, statusText: err.stack.split("\n")[0] };
	}
}

type Version = "none" | "v1";
type ServerAPI =
	| ""
	| "/user/me"
	| "/login"
	| "/logout"
	| "/signup"
	| "/naver"
	| "/current"
	| "/subs"
	| "/views"
	| "/stellar"
	| "/stellars"
	| "/yid"
	| (string & {});

interface FetchServerOption extends FetchOptions {
	body?: any;
	isNotAPI?: boolean;
}

export async function fetchServer(api: ServerAPI, version: Version, options?: FetchServerOption) {
	return await fetch_(
		`${import.meta.env.VITE_SERVER_URL}/${options?.isNotAPI === true ? "" : "api/"}${
			version === "none" ? "" : version + ""
		}${api}`,
		{
			body: options?.body,
			headers: { "Content-Type": "application/json", ...options?.headers },
			...options,
		}
	);
}
