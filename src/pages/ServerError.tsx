import { Heading, Link, Stack, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export function ServerErrorPage() {
	const nav = useNavigate();
	return (
		<Stack sx={{ height: "100vh", alignItems: "center", justifyContent: "center" }}>
			<Heading>Internal Server Error</Heading>
			<Link href="/">재시도</Link>
		</Stack>
	);
}
