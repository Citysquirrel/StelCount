export interface FetchOptions extends RequestInit {
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
type ServerAPI = "" | "/login" | "/logout" | "/signup";

interface FetchServerOption extends FetchOptions {
	isNotAPI?: boolean;
}

export async function fetchServer(api: ServerAPI, version: Version, options?: FetchServerOption) {
	return await fetch_(
		`${import.meta.env.VITE_SERVER_URL}/${options?.isNotAPI === true ? "" : "api/"}${
			version === "none" ? "" : version + "/"
		}${api}`,
		options
	);
}
