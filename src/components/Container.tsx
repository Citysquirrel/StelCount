import { css } from "@emotion/react";
import { HTMLAttributes } from "react";
import { useRecoilState } from "recoil";
import { headerOffsetState } from "../lib/Atom";
import { Box, HStack, Stack } from "@chakra-ui/react";
import useColorModeValues from "../lib/hooks/useColorModeValues";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {}

export function Container({ children, ...props }: ContainerProps) {
	const colorValues = useColorModeValues();
	// const [offsetY] = useRecoilState(headerOffsetState);
	return (
		<Stack
			sx={{
				position: "relative",
				// top: `${offsetY}px`,
				maxWidth: "100%",
				height: `calc(100dvh)`,
				padding: 0,
				backgroundColor: colorValues.background,
				// transform: `translateY(${offsetY}px)`,
			}}
			{...props}
		>
			{children}
		</Stack>
	);
}
