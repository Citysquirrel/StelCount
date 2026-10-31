import { Badge, Box, Button, Collapse, Flex, Icon, IconButton, Portal, Progress, SimpleGrid, Spinner, Text, useColorModeValue } from "@chakra-ui/react";
import { useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiChevronDown, FiChevronUp, FiMusic, FiX, FiXCircle } from "react-icons/fi";
import { PlaylistRenewalProgress, usePlaylistRenewal } from "../lib/hooks/usePlaylistRenewal";

const stages: Record<PlaylistRenewalProgress["stage"], string> = {
	idle: "실행 이력 없음",
	starting: "갱신 준비 중",
	fetch_playlists: "재생목록 수집 중",
	save_videos: "영상 저장 중",
	save_playlist: "재생목록 저장 중",
	completed: "갱신 완료",
};
const count = (value: number) => value.toLocaleString("ko-KR");
const fraction = (done: number, total: number | null) => `${count(done)} / ${total === null ? "미정" : count(total)}`;
const date = (value: string | null) => value ? new Date(value).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "—";

export function PlaylistRenewalPopup() {
	const { progress, error, isStarting, isChecking, refresh } = usePlaylistRenewal();
	const [expanded, setExpanded] = useState(false);
	const [dismissedJob, setDismissedJob] = useState<string | null>(null);
	const bg = useColorModeValue("white", "gray.800");
	const border = useColorModeValue("gray.200", "gray.600");
	const muted = useColorModeValue("gray.600", "gray.300");
	const running = progress?.status === "running";
	const visible = isStarting || error || (progress && progress.status !== "idle" && (running || dismissedJob !== progress.jobId));
	if (!visible) return null;
	const failed = progress?.status === "failed";
	const warning = progress?.status === "completed_with_warnings";
	const color = error || warning ? "orange" : failed ? "red" : running || isStarting ? "blue" : "green";
	const label = isStarting ? "갱신 시작 중" : error ? "상태 확인 필요" : failed ? "갱신 실패" : warning ? "경고와 함께 완료" : progress ? stages[progress.stage] : "상태 확인 중";
	const done = progress?.stage === "fetch_playlists" ? progress.playlistsCompleted : progress?.itemsSaved ?? 0;
	const total = progress?.stage === "fetch_playlists" ? progress.playlistsTotal : progress?.stage === "save_videos" ? progress.itemsTotal : null;
	const percent = total !== null && total > 0 ? Math.min(100, Math.floor(done / total * 100)) : null;
	return (
		<Portal>
			<Box as="section" aria-label="재생목록 갱신 진행 상황" position="fixed" right={{ base: 3, md: 6 }}
				bottom="calc(16px + env(safe-area-inset-bottom, 0px))" w="360px" maxW="calc(100vw - 24px)"
				zIndex="banner" bg={bg} borderWidth="1px" borderColor={border} rounded="xl" shadow="xl" overflow="hidden">
				<Flex align="center" gap={3} px={4} pt={3} pb={2}>
					<Icon as={FiMusic} color={`${color}.500`} />
					<Text flex={1} fontWeight="bold" fontSize="sm">재생목록 갱신</Text>
					<IconButton size="sm" variant="ghost" aria-label={expanded ? "갱신 상세 접기" : "갱신 상세 펼치기"}
						aria-expanded={expanded} aria-controls="playlist-renewal-details" icon={expanded ? <FiChevronDown /> : <FiChevronUp />}
						onClick={() => setExpanded(!expanded)} />
					{!running && !isStarting && !error && <IconButton size="sm" variant="ghost" aria-label="갱신 결과 닫기" icon={<FiX />}
						onClick={() => { setDismissedJob(progress?.jobId ?? null); setExpanded(false); }} />}
				</Flex>
				<Box px={4} pb={4}>
					<Flex align="center" gap={2} mb={2} role="status" aria-live="polite">
						{(running || isStarting) && !error ? <Spinner size="xs" color={`${color}.500`} />
							: <Icon as={error || warning ? FiAlertTriangle : failed ? FiXCircle : FiCheckCircle} color={`${color}.500`} />}
						<Text fontSize="sm" fontWeight="medium">{label}</Text>
						{progress && progress.warningCount > 0 && <Badge ml="auto" colorScheme="orange">경고 {count(progress.warningCount)}</Badge>}
					</Flex>
					{running && !isStarting && !error && <>
						<Progress aria-label={`${label} 단계 진행률`} value={percent ?? undefined} isIndeterminate={percent === null} size="xs" rounded="full" colorScheme={color} />
						{total !== null && <Text mt={2} fontSize="xs" color={muted}>{fraction(done, total)}{percent !== null ? ` · ${percent}%` : ""} · 현재 단계</Text>}
					</>}
					{error && <Text fontSize="xs" color={muted}>{error}</Text>}
					{!error && failed && <Text fontSize="xs" color={muted}>{progress?.error || "갱신 중 오류가 발생했습니다."}</Text>}
					{!error && warning && <Text fontSize="xs" color={muted}>일부 목록을 수집하지 못했을 수 있습니다.</Text>}
					<Collapse in={expanded} animateOpacity>
						<Box id="playlist-renewal-details" pt={4} mt={3} borderTopWidth="1px" borderColor={border} maxH="50vh" overflowY="auto">
							{progress && <>
								<SimpleGrid columns={2} gap={3} fontSize="xs">
									{[
										["목록 수집 시도", fraction(progress.playlistsCompleted, progress.playlistsTotal)],
										["조회 페이지", count(progress.pagesFetched)],
										["수집 항목", count(progress.itemsCollected)],
										["저장 항목", fraction(progress.itemsSaved, progress.itemsTotal)],
										["경고", count(progress.warningCount)],
										["처리 단계", stages[progress.stage]],
									].map(([title, value]) => <Box key={title}><Text color={muted}>{title}</Text><Text mt={1} fontWeight="semibold">{value}</Text></Box>)}
								</SimpleGrid>
								<Text mt={3} fontSize="xs" color={muted}>시작 · {date(progress.startedAt)}</Text>
								{progress.finishedAt && <Text mt={1} fontSize="xs" color={muted}>종료 · {date(progress.finishedAt)}</Text>}
								{progress.source === "main" && <Text mt={2} fontSize="xs" color={muted}>서버 대체 수집 경로를 사용합니다. 전환 시 수집 건수가 초기화될 수 있습니다.</Text>}
								<Text mt={2} fontSize="xs" color={muted}>항목 수에는 중복 영상이 포함됩니다. 저장 100% 이후에도 목록 저장이 남아 있을 수 있습니다.</Text>
							</>}
							<Button mt={3} size="xs" variant="outline" onClick={refresh} isLoading={isChecking} isDisabled={isStarting}>상태 다시 확인</Button>
						</Box>
					</Collapse>
				</Box>
			</Box>
		</Portal>
	);
}
