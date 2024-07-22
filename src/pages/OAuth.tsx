import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchServer } from "../lib/functions/fetch";
import { useToast } from "@chakra-ui/react";

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
		} else {
			fetchServer(`/naver?code=${code}&state=${state}`, "v1").then((res) => {
				if (res.data.state) {
					navigate(res.data.state);
				} else navigate("/");
			});
		}
	}, []);
	return <></>;
}
