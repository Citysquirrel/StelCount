import { useEffect } from "react";

export function useConfirmOnExit() {
	useEffect(() => {
		const handleBeforeUnload = (event: any) => {
			event.preventDefault();
			event.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, []);
}
