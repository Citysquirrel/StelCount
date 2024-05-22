import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchServer } from "../lib/functions/fetch";

export function OAuth() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	useEffect(() => {
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		if (!code) {
			const error = searchParams.get("error");
			const errorDesc = searchParams.get("error_description");
			// console.log(error, errorDesc); //! 에러창으로 대체(모달)
		} else {
			fetchServer(`/naver?code=${code}&state=${state}`, "v1").then((res) => {
				navigate("/");
			});
		}
	}, []);
	return <></>;
}
