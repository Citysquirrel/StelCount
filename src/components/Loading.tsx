import { Stack, Text } from "@chakra-ui/react";

export function LoadingOverlay() {
	return (
		<Stack
			sx={{
				position: "fixed",
				left: 0,
				top: 0,
				width: "100vw",
				height: "100vh",
				alignItems: "center",
				backgroundColor: "rgb(255,255,255,.25)",
				justifyContent: "center",
				zIndex: 1001,
			}}
		>
			<Text>LOADING</Text>
		</Stack>
	);
}
