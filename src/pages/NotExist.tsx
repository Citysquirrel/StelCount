import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function NotExist() {
	const nav = useNavigate();
	useEffect(() => {
		nav("/home");
	}, []);
	return <></>;
}
