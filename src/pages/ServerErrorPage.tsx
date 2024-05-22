import { Heading, Link, Stack, Text } from "@chakra-ui/react";
import { useRecoilState } from "recoil";
import { serverErrorState } from "../lib/Atom";

export function ServerErrorPage() {
	const [serverError] = useRecoilState(serverErrorState);
	const errorMsg = {
		429: { title: "Too Many Requests", description: "분당 요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요." },
		500: {
			title: "Internal Server Error",
			description: "내부 서버 에러입니다. 지속 발생 시 개발자에게 문의 바랍니다.",
		},
	};
	return (
		<Stack sx={{ height: "100vh", alignItems: "center", justifyContent: "center" }}>
			<Heading>{errorMsg[serverError.statusCode].title}</Heading>
			<Text>{errorMsg[serverError.statusCode].description}</Text>
			<Link href="/">재시도</Link>
		</Stack>
	);
}
