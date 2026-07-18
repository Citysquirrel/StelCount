import { useEffect } from "react";
import { useAuth } from "./useAuth";

export function useMessage() {
	const { query } = useAuth();
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			if (event.data.type === "AUTH_COMPLETED") {
				query();
			}
		};

		// 이벤트 리스너 등록
		window.addEventListener("message", handleMessage);

		// 컴포넌트 언마운트 시 클린업
		return () => {
			window.removeEventListener("message", handleMessage);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}
