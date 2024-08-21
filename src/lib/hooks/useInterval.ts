import { useEffect, useRef } from "react";
import { ImprovedIntervalOptions } from "../types";

export function useImprovedInterval(
	callback: () => void,
	timeout: number | null | undefined,
	options?: ImprovedIntervalOptions
) {
	const savedCallback = useRef<Function>(() => {});
	const lastExecutionTime = useRef<number>(new Date().getTime());
	const intervalId = useRef<number>();
	const mergedOptions: Required<ImprovedIntervalOptions> = { executeCallbackWhenWindowFocused: false, ...options };

	const executeCallback = () => {
		savedCallback.current();
		lastExecutionTime.current = new Date().getTime();
	};

	useEffect(() => {
		savedCallback.current = callback;
	}, [callback]);

	useEffect(() => {
		if (!timeout) return;

		intervalId.current = setInterval(executeCallback, timeout);

		const blur = () => {
			clearInterval(intervalId.current);
		};

		const focus = () => {
			intervalId.current = setInterval(executeCallback, timeout);

			if (mergedOptions.executeCallbackWhenWindowFocused) {
				const currentTime = new Date().getTime();
				console.log(currentTime, lastExecutionTime.current);
				if (currentTime - lastExecutionTime.current > timeout) {
					executeCallback();
				}
			}
		};

		window && window.addEventListener("blur", blur);
		window && window.addEventListener("focus", focus);
		return () => {
			clearInterval(intervalId.current);
			window && window.removeEventListener("blur", blur);
			window && window.removeEventListener("focus", focus);
		};
	}, [timeout]);

	return { lastExecutionTime };
}
