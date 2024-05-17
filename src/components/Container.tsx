import { css } from "@emotion/react";
import { HTMLAttributes } from "react";
import { useRecoilState } from "recoil";
import { headerOffsetState } from "../lib/Atom";
import { Box, HStack, Stack } from "@chakra-ui/react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {}

export function Container({ children, ...props }: ContainerProps) {
	const [offsetY] = useRecoilState(headerOffsetState);
	return (
		<Stack sx={{ position: "relative", maxWidth: "100%", minHeight: "100dvh", padding: "0 12px" }} {...props}>
			<Box className="space" height={`${offsetY + 24}px`}></Box>
			{children}
		</Stack>
	);
}
