import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchServer } from "../lib/functions/fetch";

export function OAuth() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	useEffect(() => {
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		fetchServer(`/naver?code=${code}&state=${state}`, "v1").then((res) => console.log(res));
	}, []);
	return <></>;
}
