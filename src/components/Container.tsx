import { HTMLAttributes } from "react";
import { Stack } from "@chakra-ui/react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {}

import { Box } from "@chakra-ui/react";
import { ReactNode } from "react";

interface MainContainerProps {
	children: ReactNode;
}

export function MainContainerV2({ children }: MainContainerProps) {
	return (
		<Box
			as="main"
			position="relative"
			zIndex={10} // StarryBackground 보다 높게
			w="100%"
			minH="100vh"
			display="flex"
			flexDirection="column"
		>
			{children}
		</Box>
	);
}

export function Container({ children, ...props }: ContainerProps) {
	return (
		<Stack
			sx={{
				position: "relative",
				maxWidth: "100%",
				padding: 0,
			}}
			{...props}
		>
			{children}
		</Stack>
	);
}
