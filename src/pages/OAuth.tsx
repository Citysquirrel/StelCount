import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function OAuth() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	useEffect(() => {
		console.log(searchParams.get("code"));
	}, []);
	return <></>;
}
