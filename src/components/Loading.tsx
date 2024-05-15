import { Stack, Text } from "@chakra-ui/react";

export function Loading({ options }: LoadingProps) {
	return (
		<Stack
			sx={{
				position: "fixed",
				left: 0,
				top: 0,
				width: "100vw",
				height: "100vh",
				alignItems: "center",
				backgroundColor: `rgb(255,255,255,${options?.mode === "fullscreen" ? "1" : "0.25"})`,
				justifyContent: "center",
				zIndex: 1001,
			}}
		>
			<Text>LOADING</Text>
		</Stack>
	);
}

interface LoadingProps {
	options?: { mode?: "overlay" | "fullscreen" };
}
