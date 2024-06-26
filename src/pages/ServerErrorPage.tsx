import { Heading, Link, Stack, Text } from "@chakra-ui/react";
import { useRecoilState } from "recoil";
import { serverErrorState } from "../lib/Atom";
import { useLocation } from "react-router-dom";

export function ServerErrorPage({ isErrorComponent }: { isErrorComponent?: boolean }) {
	const [serverError] = useRecoilState(serverErrorState);
	const { pathname } = useLocation();
	const errorMsg = {
		429: { title: "Too Many Requests", description: "요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요." },
		500: {
			title: "Internal Server Error",
			description: "내부 서버 에러입니다. 지속 발생 시 개발자에게 문의 바랍니다.",
		},
	};
	if (isErrorComponent)
		return (
			<Stack sx={{ height: "100vh", alignItems: "center", justifyContent: "center" }}>
				<Heading>This Page Is Invalid</Heading>
				<Text>페이지가 망가졌습니다. 개발자에게 문의 바랍니다.</Text>
				<Link href={`.${pathname}`}>재시도</Link>
			</Stack>
		);
	return (
		<Stack sx={{ height: "100vh", alignItems: "center", justifyContent: "center" }}>
			<Heading>
				{errorMsg[serverError.statusCode] ? errorMsg[serverError.statusCode].title : errorMsg[500].title}
			</Heading>
			<Text>
				{errorMsg[serverError.statusCode] ? errorMsg[serverError.statusCode].description : errorMsg[429].description}
			</Text>
			<Link href={`.${pathname}`}>재시도</Link>
		</Stack>
	);
}
