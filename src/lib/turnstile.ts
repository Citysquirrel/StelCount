interface TurnstileOptions {
	sitekey: string;
	action: "feedback";
	language: "ko";
	size: "flexible" | "compact";
	theme: "light" | "dark";
	appearance: "always" | "execute" | "interaction-only";
	callback: (token: string) => void;
	"error-callback": () => boolean;
	"expired-callback": () => void;
	"timeout-callback": () => void;
	"before-interactive-callback": () => void;
	"after-interactive-callback": () => void;
}

export interface Turnstile {
	render: (container: HTMLElement, options: TurnstileOptions) => string | undefined;
	remove: (id: string) => void;
}

declare global {
	interface Window {
		turnstile?: Turnstile;
		onStelCountTurnstileLoad?: () => void;
	}
}

let loading: Promise<Turnstile> | undefined;

export function loadTurnstile(): Promise<Turnstile> {
	if (loading) return loading;
	if (window.turnstile) return Promise.resolve(window.turnstile);
	loading = new Promise<Turnstile>((resolve, reject) => {
		const script = document.createElement("script");
		const cleanup = () => {
			clearTimeout(timer);
			script.onerror = null;
			delete window.onStelCountTurnstileLoad;
		};
		const fail = () => {
			cleanup();
			script.remove();
			reject(new Error("Turnstile could not be loaded"));
		};
		const timer = setTimeout(fail, 15000);
		window.onStelCountTurnstileLoad = () => {
			const api = window.turnstile;
			if (!api) {
				fail();
				return;
			}
			cleanup();
			resolve(api);
		};
		script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onStelCountTurnstileLoad";
		script.async = true;
		script.onerror = fail;
		document.head.append(script);
	}).catch((error: unknown) => {
		loading = undefined;
		throw error;
	});
	return loading;
}
