import { useRecoilState } from "recoil";
import { useResponsive } from "../lib/hooks/useResponsive";
import { headerOffsetState } from "../lib/Atom";
import { Box, Stack } from "@chakra-ui/react";
import useColorModeValues from "../lib/hooks/useColorModeValues";

interface HeaderProps {
	children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
	const colorValues = useColorModeValues();
	const [offsetY] = useRecoilState(headerOffsetState);
	const { width } = useResponsive();

	return (
		<Stack
			direction="row"
			as="header"
			sx={{
				position: "fixed",
				top: 0,
				left: 0,
				width: "calc(100%)",
				alignItems: "center",
				backgroundColor: colorValues.bgOpacity,
				borderBottom: `1px solid var(--chakra-colors-gray-200)`,
				backdropFilter: "blur(1.5px)",
				zIndex: 999,
			}}
		>
			<Stack sx={{ width: "100%", height: `${offsetY}px`, justifyContent: "center", alignItems: "center" }}>
				<Stack
					direction="row"
					sx={{
						maxWidth: `${width}px`,
						maxHeight: "64px",
						padding: "12px",
						justifyContent: "center",
					}}
				>
					{children}
				</Stack>
			</Stack>
		</Stack>
	);
}
