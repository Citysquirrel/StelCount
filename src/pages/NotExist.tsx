import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function NotExist() {
	const nav = useNavigate();
	useEffect(() => {
		nav("/home");
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	return <></>;
}
