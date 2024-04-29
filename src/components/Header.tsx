import { css } from "@emotion/react";
import { useRecoilState } from "recoil";
import { useResponsive } from "../lib/hooks/useResponsive";
import { headerOffsetState } from "../lib/Atom";
import { Box, Stack } from "@chakra-ui/react";

interface HeaderProps {
	children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
	const [offsetY] = useRecoilState(headerOffsetState);
	const { width } = useResponsive();

	return (
		<Stack
			direction="row"
			as="header"
			css={css`
				position: fixed;
				display: flex;
				top: 0;
				left: 0;
				width: calc(100%);
				align-items: center;
				border-bottom: 1px solid rgba(0, 0, 0, 0.12);
				background-color: rgba(255, 255, 255, 0.5);
				backdrop-filter: blur(1.5px);
				z-index: 999;
			`}
			sx={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "calc(100%)",
				alignItems: "center",
				borderBottom: "1px solid rgba(0,0,0,0.12)",
				backgroundColor: "rgba(255,255,255,.5)",
				backdropFilter: "blur(1.5px)",
				zIndex: 999,
			}}
		>
			<Box sx={{ width: "100%", height: `${offsetY}px` }}>
				<Stack
					direction="row"
					sx={{ maxWidth: `${width}px`, maxHeight: "64px", padding: "12px", marginInline: "auto" }}
				>
					{children}
				</Stack>
			</Box>
		</Stack>
	);
}
