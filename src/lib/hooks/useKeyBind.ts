import { useEffect } from "react";

export function useKeyBind(keyConfig: KeyConfig, ref: HTMLElement = document.body) {
	const handleKey = (e: KeyboardEvent) => {
		if (e.defaultPrevented) {
			return;
		}
		Object.entries(keyConfig).forEach(([key, func]) => {
			if (e.key === key) func();
		});
	};

	useEffect(() => {
		ref.addEventListener("keydown", handleKey);
		return () => {
			ref.removeEventListener("keydown", handleKey);
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
