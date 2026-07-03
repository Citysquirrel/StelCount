import { useEffect } from "react";

/**
 *
 * @param state 인증 완료 후 리다이랙트할 라우트 입력
 */
export function useOAuth(state: string) {
	useEffect(() => {
		const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${
			import.meta.env.VITE_NAVER_CLIENT_ID
		}&redirect_uri=${import.meta.env.VITE_REDIRECT_URL}&state=${state}`;
		window.location.href = naverAuthUrl;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
}
