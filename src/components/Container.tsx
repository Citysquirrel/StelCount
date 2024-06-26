import { HTMLAttributes } from "react";
import { Stack } from "@chakra-ui/react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {}

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
