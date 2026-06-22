import { useRecoilState } from "recoil";
import { useResponsive } from "../lib/hooks/useResponsive";
import { headerOffsetState } from "../lib/Atom";
import { Stack } from "@chakra-ui/react";
import useColorModeValues from "../lib/hooks/useColorModeValues";
import { Box, Flex, HStack, Button, IconButton, useBreakpointValue, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";

export function HeaderV2() {
	const isMobile = useBreakpointValue({ base: true, md: false });

	return (
		<Box
			as="header"
			position="fixed"
			top={0}
			w="100%"
			zIndex={100}
			bg="transparent" // TODO: 추후 스크롤에 따라 배경색 변경 로직 추가
			px={{ base: 4, md: 8 }}
			py={4}
		>
			<Flex justify="space-between" align="center" maxW="1200px" mx="auto">
				{/* 로고 영역 */}
				<Text fontSize="xl" fontWeight="bold" color="white">
					STELLIVE
				</Text>

				{/* 네비게이션 영역 */}
				<HStack spacing={6}>
					{!isMobile && (
						<HStack spacing={6} color="whiteAlpha.800">
							<Box as="button" _hover={{ color: "purple.300" }}>
								메인화면
							</Box>
							<Box as="button" _hover={{ color: "purple.300" }}>
								카운터
							</Box>
							<Box as="button" _hover={{ color: "purple.300" }}>
								멀티뷰 ↗
							</Box>
						</HStack>
					)}

					{/* 축하 글쓰기 (CTA 버튼) - 모바일/PC 공통 우측 고정 */}
					<Button
						as={motion.button}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						variant="outline"
						color="purple.300"
						borderColor="purple.300"
						borderRadius="full"
						_hover={{ bg: "purple.300", color: "gray.900" }}
					>
						{isMobile ? "✍️" : "축하 글쓰기"}
					</Button>

					{/* 모바일 햄버거 메뉴 */}
					{isMobile && <IconButton aria-label="Menu" icon={<div>☰</div>} variant="ghost" color="white" />}
				</HStack>
			</Flex>
		</Box>
	);
}

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
				position: "sticky",
				top: 0,
				left: 0,
				width: "calc(100%)",
				alignItems: "center",
				backgroundColor: colorValues.bgOpacity,
				boxShadow: "0 1px 0px 0px var(--chakra-colors-gray-200)",
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
