import { useEffect, useCallback, useState } from "react";

export function useConfirmOnExit(initialDisableOnRender = false) {
	// 훅 내부에서 활성화 상태를 관리하도록 변경
	const [isEnabled, setIsEnabled] = useState(!initialDisableOnRender);

	const handleBeforeUnload = useCallback((event: BeforeUnloadEvent) => {
		event.preventDefault();
		event.returnValue = "";
	}, []);

	useEffect(() => {
		if (!isEnabled) return;

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [isEnabled, handleBeforeUnload]);

	return {
		disableConfirmOnExit: () => setIsEnabled(false),
		enableConfirmOnExit: () => setIsEnabled(true),
	};
}
