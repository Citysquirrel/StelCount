import { Stack } from "@chakra-ui/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// TODO: 여기서는 현재 활성중이거나 곧 다가오는 기념일 목록을 보여줍니다.
// Card or List 형태?
export function Home() {
	const navigate = useNavigate();
	useEffect(() => {
		// navigate("/counter");
	}, []);
	return <Stack minHeight="calc(100vh - 64px)"></Stack>;
}
