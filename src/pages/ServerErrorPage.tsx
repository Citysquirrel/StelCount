import { Heading, Link, Stack, Text } from "@chakra-ui/react";
import { useRecoilState } from "recoil";
import { serverErrorState } from "../lib/Atom";
import { useLocation } from "react-router-dom";

export function ServerErrorPage({ isErrorComponent }: { isErrorComponent?: boolean }) {
	const [serverError] = useRecoilState(serverErrorState);
	const { pathname } = useLocation();
	const errorMsg = {
		400: { title: "Bad Request", description: "잘못된 요청입니다. 요청 내용을 확인해주세요." },
		401: { title: "Unauthorized", description: "권한이 없습니다. 로그인 후 다시 시도해주세요." },
		403: { title: "Forbidden", description: "접근이 금지되었습니다. 권한을 확인해주세요." },
		404: { title: "Not Found", description: "요청하신 페이지를 찾을 수 없습니다. URL을 확인해주세요." },
		405: { title: "Method Not Allowed", description: "허용되지 않는 요청 방식입니다. 요청 방식을 확인해주세요." },
		408: { title: "Request Timeout", description: "요청 시간이 초과되었습니다. 다시 시도해주세요." },
		429: { title: "Too Many Requests", description: "요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요." },
		500: {
			title: "Internal Server Error",
			description: "내부 서버 에러입니다. 지속 발생 시 개발자에게 문의 바랍니다.",
		},
		502: { title: "Bad Gateway", description: "잘못된 게이트웨이입니다. 서버 문제를 확인해주세요." },
		503: { title: "Service Unavailable", description: "서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요." },
		504: { title: "Gateway Timeout", description: "게이트웨이 타임아웃입니다. 다시 시도해주세요." },
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
