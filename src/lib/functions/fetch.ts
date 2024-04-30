export interface FetchOptions extends RequestInit {
	method?: "POST" | "DELETE" | (string & {});
	timeout?: number;
}

export async function fetch_(input: RequestInfo | URL, options?: FetchOptions) {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), options?.timeout || 5000);
	const res = await fetch(input, {
		...options,
		signal: controller.signal,
	});
	clearTimeout(id);

	const { headers, status, statusText } = res;
	const response = {
		data: await res.json(),
		headers,
		status,
		statusText,
	};

	return response;
}

type Version = "none" | "v1";
type ServerAPI =
	| ""
	| "/login"
	| "/logout"
	| "/signup"
	| "/subs/current"
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
			...options,
			body: JSON.stringify(options?.body),
			headers: { ...options?.headers, "Content-Type": "application/json" },
		}
	);
}
