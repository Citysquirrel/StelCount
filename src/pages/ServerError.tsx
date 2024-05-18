import { Heading, Stack } from "@chakra-ui/react";

export function ServerErrorPage() {
	return (
		<Stack sx={{ alignItems: "center", justifyContent: "center" }}>
			<Heading>Internal Server Error</Heading>
		</Stack>
	);
}
