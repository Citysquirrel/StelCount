import { Heading, Link, Stack } from "@chakra-ui/react";
import { useRecoilState } from "recoil";

export function ServerErrorPage() {
	const [serverError] = useRecoilState(serverErrorState);
	return (
		<Stack sx={{ height: "100vh", alignItems: "center", justifyContent: "center" }}>
			<Heading>Internal Server Error</Heading>
			<Link href="/">재시도</Link>
		</Stack>
	);
}
