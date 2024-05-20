import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function Home() {
	const navigate = useNavigate();

	useEffect(() => {
		navigate("/counter");
	}, []);
	return (
		<div>
			<section></section>
		</div>
	);
}
