interface TurnstileOptions {
	sitekey: string;
	action: "feedback";
	language: "ko";
	size: "flexible" | "compact";
	theme: "light" | "dark";
	callback: (token: string) => void;
	"error-callback": () => boolean;
	"expired-callback": () => void;
	"timeout-callback": () => void;
}

export interface Turnstile {
	ready: (callback: () => void) => void;
	render: (container: HTMLElement, options: TurnstileOptions) => string | undefined;
	remove: (id: string) => void;
}

declare global {
	interface Window {
		turnstile?: Turnstile;
	}
}

let loading: Promise<Turnstile> | undefined;

export function loadTurnstile(): Promise<Turnstile> {
	if (loading) return loading;
	loading = new Promise<Turnstile>((resolve, reject) => {
		const script = document.createElement("script");
		const fail = () => {
			clearTimeout(timer);
			script.onload = null;
			script.onerror = null;
			script.remove();
			reject(new Error("Turnstile could not be loaded"));
		};
		const timer = setTimeout(fail, 15000);
		const ready = () => {
			const api = window.turnstile;
			if (!api) { fail(); return; }
			api.ready(() => {
				clearTimeout(timer);
				resolve(api);
			});
		};
		if (window.turnstile) { ready(); return; }
		script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
		script.async = true;
		script.onload = ready;
		script.onerror = fail;
		document.head.append(script);
	}).catch((error: unknown) => {
		loading = undefined;
		throw error;
	});
	return loading;
}
