import { useCallback, useEffect } from "react";

export function useConfirmOnExit(disableOnRender?: boolean) {
	const handleBeforeUnload = useCallback((event: any) => {
		event.preventDefault();
		event.returnValue = "";
	}, []);

	useEffect(() => {
		if (!disableOnRender) {
			window.addEventListener("beforeunload", handleBeforeUnload);
		}

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, []);

	return {
		disableConfirmOnExit: () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		},
		enableConfirmOnExit: () => {
			window.addEventListener("beforeunload", handleBeforeUnload);
		},
	};
}
