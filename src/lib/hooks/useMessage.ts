import { useEffect } from "react";
import { useAuth } from "./useAuth";

export function useMessage() {
	const { query, setIsLoading } = useAuth();
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;
			if (event.data?.type === "AUTH_COMPLETED") {
				setIsLoading(true);
				void query();
			}
		};
		window.addEventListener("message", handleMessage);
		return () => window.removeEventListener("message", handleMessage);
	}, [query, setIsLoading]);
}
