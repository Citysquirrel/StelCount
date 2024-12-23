import { useEffect } from "react";

export function useConfirmOnExit() {
	const handleBeforeUnload = (event: any) => {
		event.preventDefault();
		event.returnValue = "";
	};
	useEffect(() => {
		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, []);

	return {
		disableConfirmOnExit: () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		},
	};
}
