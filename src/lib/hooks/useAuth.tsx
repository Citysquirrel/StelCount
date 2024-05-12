import { useRecoilState } from "recoil";
import { isLoginState } from "../Atom";
import { useEffect, useState } from "react";
import { fetchServer, fetch_ } from "../functions/fetch";

export function useAuth() {
	const [isLogin, setIsLogin] = useRecoilState(isLoginState);
	const [isLoading, setIsLoading] = useState(true);
	const query = fetchServer("/user/me", "v1");

	useEffect(() => {
		query
			.then((res) => {
				setIsLogin(true);
			})
			.catch((err) => {
				setIsLogin(false);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);
	return { isLoading, isLogin, query };
}
