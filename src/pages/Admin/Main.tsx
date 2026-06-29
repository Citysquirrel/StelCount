import { useEffect, useState } from "react";
import { fetchServer } from "../../lib/functions/fetch";
import { Box, HStack, Stack, useColorModeValue, Text, Flex, IconButton, VStack, useMediaQuery } from "@chakra-ui/react";
import { FiHome, FiSettings, FiUsers, FiMenu, FiBook, FiYoutube } from "react-icons/fi";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/hooks/useAuth";
import { NotExist } from "../NotExist";

const ROUTE_NAME = "/new-admin";
const PAGE_TITLES: Record<string, string> = {
	"/": "대시보드",
	"/dashboard": "대시보드",
	"/stellar": "스텔라 관리",
	"/video": "영상 관리",
	"/songbook": "노래책 관리",
	"/settings": "시스템 설정",
};

export function NewAdmin() {
	const location = useLocation();
	const [isExpanded, setIsExpanded] = useState(true);
	const [isMobile] = useMediaQuery("(max-width: 1280px)");
	const { isLoading: isAuthLoading, isLogin, isAdmin } = useAuth();

	const subPath = location.pathname.replace(ROUTE_NAME, "") || "/";
	const currentTitle = PAGE_TITLES[subPath] || "어드민 페이지";

	// 다크모드 대응 컬러
	const bg = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	useEffect(() => {
		const footer = document.getElementById("footer");

		const originalDisplay = footer ? footer.style.display : "";
		if (footer) footer.style.display = "none";
		return () => {
			if (footer) {
				footer.style.display = originalDisplay;
			}
		};
	}, []); // 사이드바 확장 여부 상태 관리

	// 화면 크기가 변할 때마다 사이드바 상태 강제 업데이트
	useEffect(() => {
		if (isMobile) {
			// 화면이 좁아지면 무조건 접기
			setIsExpanded(false);
		} else {
			// 화면이 넓어지면 다시 펴기 (사용성 개선을 위한 선택 사항)
			setIsExpanded(true);
		}
	}, [isMobile]);

	// 사이드바 메뉴 아이템 컴포넌트
	const NavItem = ({ icon, label, to, isExpanded }) => (
		<HStack
			as={NavLink}
			to={to}
			w="full"
			p={3}
			borderRadius="md"
			_hover={{ bg: "gray.100", textDecoration: "none", color: "blue.500", cursor: "pointer" }}
			spacing={4}
			justify={isExpanded ? "flex-start" : "center"}
			transition="all 0.2s"
			color="gray.600"
			_activeLink={{
				bg: "blue.50",
				color: "blue.600",
				fontWeight: "bold",
			}}
		>
			<Box as={icon} boxSize="20px" />
			{/* 사이드바가 펴져 있을 때만 텍스트 렌더링 */}
			{isExpanded && (
				<Text fontWeight="medium" whiteSpace="nowrap">
					{label}
				</Text>
			)}
		</HStack>
	);
	if (isAuthLoading) return <></>;
	if (!isLogin) return <NotExist />;
	if (!isAdmin) return <NotExist />;
	return (
		<Flex h="calc(100vh - 64px)" w="100%" bg="gray.50" overflow="hidden">
			{/* 1. 사이드바 영역 */}
			<Flex
				direction="column"
				w={isExpanded ? "240px" : "72px"} // 상태에 따른 너비 변경
				bg={bg}
				borderRight="1px solid"
				borderColor={borderColor}
				transition="width 0.3s ease" // 부드러운 펼침/접힘 애니메이션
				overflow="hidden"
			>
				{/* 상단 로고 및 토글 버튼 */}
				{!isMobile && (
					<Flex h="16" align="center" justify={isExpanded ? "space-between" : "center"} px={isExpanded ? 4 : 0}>
						{isExpanded && (
							<Text fontSize="xl" fontWeight="bold" whiteSpace="nowrap">
								관리자
							</Text>
						)}
						<IconButton
							aria-label="Toggle Sidebar"
							icon={<FiMenu />}
							onClick={() => setIsExpanded(!isExpanded)}
							variant="ghost"
							size="md"
						/>
					</Flex>
				)}

				{/* 네비게이션 메뉴 목록 */}
				<VStack spacing={2} align="stretch" mt={4} px={isExpanded ? 4 : 2}>
					<NavItem icon={FiHome} label="대시보드" to={`${ROUTE_NAME}/dashboard`} isExpanded={isExpanded} />
					<NavItem icon={FiUsers} label="스텔라 관리" to={`${ROUTE_NAME}/stellar`} isExpanded={isExpanded} />
					<NavItem icon={FiYoutube} label="영상 관리" to={`${ROUTE_NAME}/video`} isExpanded={isExpanded} />
					<NavItem icon={FiBook} label="노래책 관리" to={`${ROUTE_NAME}/songbook`} isExpanded={isExpanded} />
					<NavItem icon={FiSettings} label="설정" to={`${ROUTE_NAME}/setting`} isExpanded={isExpanded} />
				</VStack>
			</Flex>

			{/* 2. 메인 콘텐츠 영역 */}
			<Flex flex={1} direction="column" overflow="hidden">
				{/* 상단 헤더 */}
				<Flex h="16" bg={bg} borderBottom="1px solid" borderColor={borderColor} align="center" px={8}>
					<Text fontSize="lg" fontWeight="semibold">
						{currentTitle}
					</Text>
				</Flex>

				{/* 실제 내용이 들어갈 부분 */}
				<Box p={2} overflowY="auto" h="full" position="relative">
					<Box bg="white" p={4} borderRadius="lg" shadow="sm" h="full" overflowY="auto">
						<Outlet />
					</Box>
				</Box>
			</Flex>
		</Flex>
	);
}
