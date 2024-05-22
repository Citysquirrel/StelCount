import { useRecoilState } from "recoil";
import { isAdminState, isLoginState } from "../Atom";
import { useEffect, useState } from "react";
import { fetchServer, fetch_ } from "../functions/fetch";

export function useAuth() {
	const [isLogin, setIsLogin] = useRecoilState(isLoginState);
	const [isAdmin, setIsAdmin] = useRecoilState(isAdminState);
	const [isLoading, setIsLoading] = useState(true);
	const query = () => fetchServer("/user/me", "v1");

	useEffect(() => {
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
			.catch((err) => {
				setIsLogin(false);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);
	return { isLoading, isLogin, isAdmin, query };
}
