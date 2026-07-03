import { useEffect, useRef } from "react";
import { LiteralUnion } from "../types";

export function useKeyBind(keyConfig: KeyConfig, ref: HTMLElement | null = null, eventType?: KeyBindEventType) {
	const keyConfigRef = useRef(keyConfig);

	useEffect(() => {
		keyConfigRef.current = keyConfig;
	}, [keyConfig]);

	const handleKey = (e: KeyboardEvent) => {
		if (e.defaultPrevented) {
			return;
		}
		const target = e.target as HTMLElement;
		if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
			return;
		}

		const func = keyConfigRef.current[e.key];
		if (func) {
			func();
		}
	};

	useEffect(() => {
		const target = ref || window;
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-expect-error
		target.addEventListener(eventType || "keydown", handleKey);

		return () => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-expect-error
			target.removeEventListener(eventType || "keydown", handleKey);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ref]);
}

interface KeyConfig {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: (event?: any) => void;
}

type KeyBindEventType = LiteralUnion<"keydown" | "keypress" | "keyup">;
