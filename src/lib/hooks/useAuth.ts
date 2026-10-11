import { useRecoilState } from "recoil";
import { isAdminState, isLoginState } from "../Atom";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchServer } from "../functions/fetch";

export function useAuth() {
	const [isLogin, setIsLogin] = useRecoilState(isLoginState);
	const [isAdmin, setIsAdmin] = useRecoilState(isAdminState);
	const [isLoading, setIsLoading] = useState(true);
	const requestId = useRef(0);
	const query = useCallback(async () => {
		const id = ++requestId.current;
		try {
			const res = await fetchServer<{ userToken?: { role?: string } }>("v1", "/user/me", { cache: "no-store" });
			if (id === requestId.current) {
				const role = res.status === 200 ? res.data?.userToken?.role : undefined;
				setIsLogin(role === "ADMIN" || role === "USER");
				setIsAdmin(role === "ADMIN");
			}
			return res;
		} catch {
			if (id === requestId.current) {
				setIsLogin(false);
				setIsAdmin(false);
			}
		} finally {
			if (id === requestId.current) setIsLoading(false);
		}
	}, [setIsAdmin, setIsLogin]);

	useEffect(() => {
		if (import.meta.env.DEV) {
			setIsAdmin(true);
			setIsLogin(true);
			setIsLoading(false);
			return;
		}
		void query();
		const revalidate = () => { void query(); };
		const cancelPending = () => { requestId.current++; };
		window.addEventListener("focus", revalidate);
		return () => {
			cancelPending();
			window.removeEventListener("focus", revalidate);
		};
	}, [query, setIsAdmin, setIsLogin]);
	return { isLoading, isLogin, isAdmin, setIsAdmin, setIsLogin, setIsLoading, query };
}
