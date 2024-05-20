import { Image, Stack, Text } from "@chakra-ui/react";
import useColorModeValues from "../lib/hooks/useColorModeValues";

export function Loading({ options }: LoadingProps) {
	const values = useColorModeValues();
	return (
		<Stack
			sx={{
				position: "fixed",
				left: 0,
				top: 0,
				width: "100vw",
				height: "100vh",
				alignItems: "center",
				backgroundColor: options?.mode === "fullscreen" ? values.background : values.bgOpacity,
				justifyContent: "center",
				zIndex: 1001,
				"> img": {
					boxSize: "128px",
					animation: "rotate 1s ease infinite",
					transformOrigin: "50% 50%",
				},
			}}
		>
			<Image src={"/load_donut.png"} />
		</Stack>
	);
}

interface LoadingProps {
	options?: { mode?: "overlay" | "fullscreen" };
}
