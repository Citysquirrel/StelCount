import { useEffect } from "react";
import { createSecretKey } from "../lib/functions/createSecretKey";

export function Login() {
	useEffect(() => {
		const state = createSecretKey(18);
		const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${
			import.meta.env.VITE_NAVER_CLIENT_ID
		}&redirect_uri=${import.meta.env.VITE_REDIRECT_URL}&state=${state}`;
		window.location.href = naverAuthUrl;
	}, []);
	return <></>;
}
