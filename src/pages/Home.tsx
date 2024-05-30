import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// TODO: 여기서는
export function Home() {
	const navigate = useNavigate();

	useEffect(() => {
		// 첫방문시 About으로 redirect
		navigate("/about");
	}, []);
	return <></>;
}
