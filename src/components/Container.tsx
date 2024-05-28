import { HTMLAttributes } from "react";
import { Stack } from "@chakra-ui/react";
import useColorModeValues from "../lib/hooks/useColorModeValues";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {}

export function Container({ children, ...props }: ContainerProps) {
	const colorValues = useColorModeValues();
	return (
		<Stack
			sx={{
				position: "relative",
				maxWidth: "100%",
				height: `calc(100dvh)`,
				padding: 0,
				backgroundColor: colorValues.background,
			}}
			{...props}
		>
			{children}
		</Stack>
	);
}
