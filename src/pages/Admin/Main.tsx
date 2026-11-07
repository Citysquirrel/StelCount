import { CustomLink } from "@/components/Link";
import { ObservatoryButton } from "@/components/layout/Observatory";
import { Box, Flex, HStack, IconButton, Spinner, Text, Tooltip, VStack, useMediaQuery, useToast } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { FiBook, FiHome, FiMenu, FiMessageSquare, FiMusic, FiRefreshCw, FiSettings, FiUsers, FiVideo, FiYoutube } from "react-icons/fi";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/hooks/useAuth";
import { NotExist } from "../NotExist";
import { IconType } from "react-icons";
import { usePlaylistRenewal } from "../../lib/hooks/usePlaylistRenewal";
import { DefaultResponseData, fetchServer } from "../../lib/functions/fetch";

const navigation = [
	{ path: "dashboard", label: "대시보드", icon: FiHome },
	{ path: "stellar", label: "스텔라 관리", icon: FiUsers },
	{ path: "video", label: "영상 관리", icon: FiYoutube },
	{ path: "songbook", label: "노래책 관리", icon: FiBook },
	{ path: "song-history", label: "가창 기록", icon: FiMusic },
	{ path: "feedback", label: "피드백 관리", icon: FiMessageSquare },
	{ path: "setting", label: "시스템 설정", icon: FiSettings },
];

export function NewAdmin() {
	const location = useLocation();
	const [isExpanded, setIsExpanded] = useState(true);
	const [isCompact] = useMediaQuery("(max-width: 1279px)");
	const { isLoading: isAuthLoading, isLogin, isAdmin } = useAuth();
	const renewal = usePlaylistRenewal();
	const { refresh: refreshPlaylistRenewal } = renewal;
	const [isDetailFetching, setIsDetailFetching] = useState(false);
	const detailFetching = useRef(false);
	const toast = useToast();

	useEffect(() => {
		if (!isAuthLoading && isAdmin) refreshPlaylistRenewal();
	}, [isAuthLoading, isAdmin, refreshPlaylistRenewal]);

	useEffect(() => { setIsExpanded(!isCompact); }, [isCompact]);

	const renewDetails = async () => {
		if (!isAdmin || detailFetching.current) return;
		detailFetching.current = true;
		setIsDetailFetching(true);
		try {
			const res = await fetchServer<DefaultResponseData>("admin", "/renew/detail", { timeout: 0 });
			toast({
				description: res.data?.msg || (res.status === 200 ? "영상 상세 정보 갱신에 성공했습니다." : "영상 상세 정보 갱신 중 오류가 발생했습니다."),
				status: res.status === 200 ? "success" : "error",
			});
		} catch {
			toast({ description: "영상 상세 정보 갱신 중 서버 오류가 발생했습니다.", status: "error" });
		} finally {
			detailFetching.current = false;
			setIsDetailFetching(false);
		}
	};

	if (isAuthLoading) return <Flex justify="center" p={12} role="status" aria-label="관리자 인증 확인 중"><Spinner color="var(--obs-accent)" /></Flex>;
	if (!isLogin || !isAdmin) return <NotExist />;

	const currentTitle = navigation.find(({ path }) => location.pathname === `/admin/${path}`)?.label || "관리자";
	const isPlaylistRunning = renewal.isStarting || renewal.progress?.status === "running";
	return (
		<Flex position="relative" h={{ base: "calc(100dvh - 64px)", md: "calc(100dvh - 80px)" }} minH={0} overflow="hidden">
			<Flex as="aside" aria-label="관리자 사이드바" direction="column" w={isExpanded ? { base: "210px", md: "240px" } : "64px"}
				flexShrink={0} bg="#171320" borderRight="1px solid var(--obs-line)" overflowY="auto"
				position={{ base: isExpanded ? "absolute" : "relative", md: "relative" }} zIndex={isExpanded ? 20 : 1} h="full">
				<Flex minH="72px" align="center" justify={isExpanded ? "space-between" : "center"} px={isExpanded ? 5 : 2}>
					{isExpanded && <Box><Text fontSize="10px" letterSpacing=".16em" color="var(--obs-accent)">WORKSPACE</Text><Text fontWeight="bold" mt={1}>관리자</Text></Box>}
					<IconButton aria-label={isExpanded ? "사이드바 접기" : "사이드바 펼치기"} aria-expanded={isExpanded} aria-controls="admin-sidebar-content"
						icon={<FiMenu />} onClick={() => setIsExpanded(!isExpanded)} variant="ghost" color="var(--obs-muted)" _hover={{ bg: "#c1a4ef1f", color: "#f1edf8" }} />
				</Flex>
				<Flex id="admin-sidebar-content" flex={1} direction="column" px={isExpanded ? 3 : 2} pb={4} gap={6}>
					<VStack as="nav" aria-label="관리자 메뉴" spacing={1} align="stretch">
						{navigation.map(({ path, label, icon }) => <NavItem key={path} icon={icon} label={label} to={`/admin/${path}`} isExpanded={isExpanded} onClick={() => { if (isCompact) setIsExpanded(false); }} />)}
					</VStack>
					<Box mt="auto" pt={5} borderTop="1px solid var(--obs-line)">
						{isExpanded && <Text px={3} mb={3} fontSize="10px" letterSpacing=".12em" color="var(--obs-muted)">데이터 갱신</Text>}
						<VStack align="stretch" spacing={2}>
							<RenewalButton expanded={isExpanded} icon={FiRefreshCw} label="재생목록 데이터 갱신" onClick={renewal.start}
								isDisabled={!renewal.canStart} isLoading={isPlaylistRunning} loadingText={renewal.isStarting ? "갱신 시작 중" : "재생목록 갱신 중"} />
							<RenewalButton expanded={isExpanded} icon={FiVideo} label="영상 상세 정보 갱신" onClick={() => void renewDetails()}
								isDisabled={isDetailFetching} isLoading={isDetailFetching} loadingText="영상 상세 갱신 중" />
						</VStack>
						{isExpanded && <Text role="status" fontSize="11px" color="var(--obs-muted)" mt={3} px={3}>
							{isDetailFetching ? "영상 상세 정보를 갱신하고 있습니다." : isPlaylistRunning ? "재생목록 갱신 진행 상황은 알림에서 확인할 수 있습니다." : renewal.error || "필요할 때 최신 데이터로 갱신합니다."}
						</Text>}
					</Box>
					<NavItem icon={FiSettings} label="구버전 관리자" to="/old-admin" isExpanded={isExpanded} />
				</Flex>
			</Flex>
			{isExpanded && <Box display={{ base: "block", md: "none" }} position="absolute" inset={0} bg="#09061299" zIndex={10} onClick={() => setIsExpanded(false)} aria-hidden />}
			<Flex flex={1} minW={0} direction="column" overflow="hidden">
				<Flex as="header" minH="64px" px={{ base: 4, md: 8 }} align="center" borderBottom="1px solid var(--obs-line)" gap={3}>
					<Text fontSize="xs" color="var(--obs-muted)" display={{ base: "none", sm: "block" }}>관리자 /</Text>
					<Text fontSize="sm" fontWeight="semibold">{currentTitle}</Text>
					<Text ml="auto" color="var(--obs-accent)" fontSize="10px" letterSpacing=".1em">STELCOUNT</Text>
				</Flex>
				<Box as="main" id="obs-main" tabIndex={-1} flex={1} minH={0} overflowY="auto" p={{ base: 4, md: 7, xl: 8 }} _focus={{ outline: "none" }}>
					<Outlet />
				</Box>
			</Flex>
		</Flex>
	);
}

function NavItem({ icon, label, to, isExpanded, onClick }: { icon: IconType; label: string; to: string; isExpanded: boolean; onClick?: () => void }) {
	return (
		<Tooltip label={label} isDisabled={isExpanded} placement="right" hasArrow>
			<HStack as={CustomLink} href={to} aria-label={label} onClick={onClick} w="full" minH="44px" p={3} borderRadius="12px"
				spacing={3} justify={isExpanded ? "flex-start" : "center"} color="var(--obs-muted)"
				_hover={{ bg: "#c1a4ef12", color: "#f1edf8", textDecoration: "none" }}
				_activeLink={{ bg: "#c1a4ef21", color: "#d9bdfb", fontWeight: "bold", boxShadow: "inset 0 0 0 1px #c1a4ef29" }}>
				<Box as={icon} boxSize="18px" flexShrink={0} />
				{isExpanded && <Text fontSize="sm" whiteSpace="nowrap">{label}</Text>}
			</HStack>
		</Tooltip>
	);
}

function RenewalButton({ expanded, icon: Icon, label, ...props }: {
	expanded: boolean;
	icon: IconType;
	label: string;
	onClick: () => void;
	isDisabled: boolean;
	isLoading: boolean;
	loadingText: string;
}) {
	return (
		<Tooltip label={props.isLoading ? props.loadingText : label} isDisabled={expanded} placement="right" hasArrow shouldWrapChildren>
			<ObservatoryButton {...props} aria-label={label} w="full" minW={0} minH="44px" px={expanded ? 3 : 0} borderRadius="12px"
				justifyContent={expanded ? "flex-start" : "center"} leftIcon={expanded ? <Icon /> : undefined} loadingText={expanded ? props.loadingText : undefined}>
				{expanded ? label : <Icon size={18} />}
			</ObservatoryButton>
		</Tooltip>
	);
}
