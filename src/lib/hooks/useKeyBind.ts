import { useEffect, useRef } from "react";

export function useKeyBind(keyConfig: KeyConfig, ref: HTMLElement | null = null, eventType?: KeyBindEventType) {
	const keyConfigRef = useRef(keyConfig);
	const activeElement = document.activeElement;

	useEffect(() => {
		keyConfigRef.current = keyConfig;
	}, [keyConfig]);

	const handleKey = (e: KeyboardEvent) => {
		if (e.defaultPrevented) {
			return;
		}

		if (activeElement && (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")) {
			return;
		}

		const func = keyConfigRef.current[e.key];
		if (func) {
			func();
		}
	};

	useEffect(() => {
		const target = ref || window;
		// @ts-ignore
		target.addEventListener(eventType || "keydown", handleKey);

		return () => {
			// @ts-ignore
			target.removeEventListener(eventType || "keydown", handleKey);
		};
	}, [ref]);
}

interface KeyConfig {
	[key: string]: () => void;
}

type KeyBindEventType = "keydown" | "keypress" | "keyup" | (string & {});
