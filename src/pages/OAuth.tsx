import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchServer } from "../lib/functions/fetch";
import { useToast } from "@chakra-ui/react";
import { Loading } from "../components/Loading";

export function OAuth() {
	const toast = useToast();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	useEffect(() => {
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		if (!code) {
			const error = searchParams.get("error");
			const errorDesc = searchParams.get("error_description");
			toast({ title: `${error}`, description: `${errorDesc}`, status: "error" });

			if (window.opener) {
				window.opener.postMessage({ type: "AUTH_FAILED" }, window.location.origin);
				window.close();
			} else {
				navigate("/");
			}
		} else {
			fetchServer("v1", `/naver?code=${code}&state=${state}`)
				.then((res) => {
					if (window.opener) {
						window.opener.postMessage({ type: "AUTH_COMPLETED" }, window.location.origin);
						window.close();
					} else {
						if (res.data && res.data.state) {
							navigate(res.data.state);
						} else {
							navigate("/");
						}
					}
				})
				.catch((err) => {
					toast({ title: "인증 실패", description: "서버 처리 중 오류가 발생했습니다.", status: "error" });

					if (window.opener) {
						window.opener.postMessage({ type: "AUTH_FAILED" }, window.location.origin);
						window.close();
					} else {
						navigate("/");
					}
				});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return <Loading options={{ mode: "fullscreen" }} />;
}
