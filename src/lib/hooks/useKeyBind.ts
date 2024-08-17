import { useEffect } from "react";
window;
export function useKeyDown(keyConfig: KeyConfig, ref: HTMLElement = document.body) {
	const handleKey = (e: KeyboardEvent) => {
		if (e.defaultPrevented) {
			return;
		}
		Object.entries(keyConfig).forEach(([key, func]) => {
			if (e.key === key) func();
		});
	};

	useEffect(() => {
		if (ref) ref.addEventListener("keydown", handleKey);
		else window.addEventListener("keydown", handleKey);
		return () => {
			if (ref) ref.removeEventListener("keydown", handleKey);
			else window.removeEventListener("keydown", handleKey);
		};
	}, []);
}

export function useKeyUp(keyConfig: KeyConfig, ref: HTMLElement = document.body) {
	const handleKey = (e: KeyboardEvent) => {
		if (e.defaultPrevented) {
			return;
		}
		Object.entries(keyConfig).forEach(([key, func]) => {
			if (e.key === key) func();
		});
	};

	useEffect(() => {
		if (ref) ref.addEventListener("keyup", handleKey);
		else window.addEventListener("keyup", handleKey);
		return () => {
			if (ref) ref.removeEventListener("keyup", handleKey);
			else window.removeEventListener("keyup", handleKey);
		};
	}, []);
}

export function useKeyPress(keyConfig: KeyConfig, ref: HTMLElement = document.body) {
	const handleKey = (e: KeyboardEvent) => {
		if (e.defaultPrevented) {
			return;
		}
		Object.entries(keyConfig).forEach(([key, func]) => {
			if (e.key === key) func();
		});
	};

	useEffect(() => {
		if (ref) ref.addEventListener("keypress", handleKey);
		else window.addEventListener("keypress", handleKey);
		return () => {
			if (ref) ref.removeEventListener("keypress", handleKey);
			else window.removeEventListener("keypress", handleKey);
		};
	}, []);
}

interface KeyConfig {
	[key: string]: () => void;
}

// export function useKeyBind(key: string, func: () => void, ref: HTMLElement = document.body) {
// 	const handleKey = (e: KeyboardEvent) => {
// 		if (e.key === key) {
// 			func();
// 		}
// 	};

// 	useEffect(() => {
// 		ref.addEventListener("keydown", handleKey);
// 		return () => {
// 			ref.removeEventListener("keydown", handleKey);
// 		};
// 	}, []);
// }
