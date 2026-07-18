import { useEffect } from "react";
import { useAuth } from "./useAuth";

export function useMessage() {
	const { query, setIsLogin, setIsAdmin, setIsLoading } = useAuth();
	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;

			if (event.data.type === "AUTH_COMPLETED") {
				setIsLoading(true);
				query()
					.then((res) => {
						if (res) {
							if (res.status === 200) {
								setIsLogin(true);
								const { userToken } = res.data;
								if (userToken.role === "ADMIN") {
									setIsAdmin(true);
								}
							}
						}
					})
					.catch(() => {
						setIsLogin(false);
					})
					.finally(() => {
						setIsLoading(false);
					});
			}
		};

		window.addEventListener("message", handleMessage);

		return () => {
			window.removeEventListener("message", handleMessage);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}
