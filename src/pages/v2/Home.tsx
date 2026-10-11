import { Avatar, Badge, Box, Flex, Heading, HStack, Image, SimpleGrid, Spinner, Stack, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import { ObservatoryButton, ObservatoryExplore, ObservatoryShelf } from "../../components/layout/Observatory";
import { Link } from "../../components/Link";
import type { LiveStatusState } from "../../lib/Atom";
import { HOME_LIMITS, homeCount, homeDate, selectHomeVideos, type HomeVideo } from "../../lib/functions/homeV2";
import type { useObservatoryData } from "../../lib/hooks/useObservatoryData";
import type { StellarV2State } from "../../lib/types";

export default function Home() {
	const { videos, live } = useOutletContext<ReturnType<typeof useObservatoryData>>();
	const [now, setNow] = useState(Date.now);
	useEffect(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 60000);
		return () => window.clearInterval(timer);
	}, []);
	const data = useMemo(() => selectHomeVideos(videos.data || [], now), [videos.data, now]);
	if (videos.isPending) return <HomeState title="별의 소식을 불러오고 있어요." loading>새로운 영상과 함께 만든 기록을 모으는 중이에요.</HomeState>;
	if (videos.isError && !videos.data) return <HomeState title="영상 정보를 불러오지 못했어요." onRetry={() => void videos.refetch()}>잠시 후 다시 시도해 주세요.</HomeState>;
	return (
		<>
			<ObservatoryExplore hasHero={data.hero.length > 0} />
			{data.hero.length > 0 && <HomeHero items={data.hero} />}
			<Box maxW="1440px" mx="auto" pt={{ base: 3, md: 8 }} pb={{ base: 10, md: 16 }} pl={{ base: 4, md: "30px" }} pr={{ base: 4, md: "110px" }}>
				{!data.hero.length && <Box pt={10} pb={5}>
					<Text fontSize="11px" letterSpacing=".16em" color="var(--obs-accent)">STELLIVE OBSERVATORY</Text>
					<Heading as="h1" fontSize={{ base: "26px", md: "38px" }} my={2}>각자의 별, 이어지는 기록.</Heading>
					<Text color="var(--obs-muted)">새로운 노래부터 함께 만든 기록까지.</Text>
				</Box>}
				{videos.isError && <Text role="status" color="var(--obs-muted)">최신 정보를 갱신하지 못해 이전 정보를 보여드리고 있어요.</Text>}
				<ObservatoryShelf id="recent" title="새로 도착한 영상" eyebrow="NEW RELEASES" description={`최근 ${HOME_LIMITS.recentDays}일`} count={data.recent.length}>
					{data.recent.length ? data.recent.map((item) => <HomeVideoCard key={item.video.vi} item={item} />) : <Text color="var(--obs-muted)">최근 게시된 영상이 없어요.</Text>}
				</ObservatoryShelf>
				<ObservatoryShelf id="milestones" title="함께 만든 기록" eyebrow="MILESTONES" description={`최근 ${HOME_LIMITS.milestoneDays}일`} count={data.milestones.length}>
					{data.milestones.length ? data.milestones.map((item) => <HomeVideoCard key={`${item.video.vi}-${item.milestone?.videoId}`} item={item} showMilestone />) : <Text color="var(--obs-muted)">최근 달성한 기록이 없어요.</Text>}
				</ObservatoryShelf>
				<Box as="section" id="obs-live" py={8} aria-labelledby="obs-live-title">
					<Flex align="center" justify="space-between" gap={4} mb={5}>
						<Box><Text fontSize="11px" letterSpacing=".16em" color="var(--obs-accent)">ON AIR</Text><Heading as="h2" id="obs-live-title" fontSize={{ base: "19px", md: "21px" }} mt={1}>치지직 라이브 현황</Heading></Box>
						<ObservatoryButton href="/multiview" isExternal flexShrink={0}>멀티뷰 구성 ↗</ObservatoryButton>
					</Flex>
					{live.isPending ? <Text role="status" color="var(--obs-muted)">라이브 정보를 불러오고 있어요.</Text> : live.isError && !live.data ? (
						<Box role="alert"><Text mb={3}>라이브 정보를 불러오지 못했어요.</Text><ObservatoryButton onClick={() => void live.refetch()}>다시 불러오기</ObservatoryButton></Box>
					) : <>
						{live.isError && <Text role="status" color="var(--obs-muted)" mb={3}>이전 라이브 정보예요. 최신 상태를 확인하지 못했어요.</Text>}
						<HomeLives items={live.data || []} members={videos.data || []} now={now} />
					</>}
				</Box>
			</Box>
		</>
	);
}

function HomeState({ title, children, loading, onRetry }: { title: string; children: ReactNode; loading?: boolean; onRetry?: () => void }) {
	return (
		<Stack align="center" py={20} px={6} textAlign="center" spacing={4} role={onRetry ? "alert" : "status"} aria-busy={loading}>
			{loading && <Spinner color="var(--obs-accent)" />}
			<Heading as="h1" fontSize="24px">{title}</Heading><Text color="var(--obs-muted)">{children}</Text>
			{onRetry && <ObservatoryButton onClick={onRetry}>다시 불러오기</ObservatoryButton>}
		</Stack>
	);
}

function HomeHero({ items }: { items: HomeVideo[] }) {
	const [selectedId, setSelectedId] = useState(items[0].video.vi);
	const [paused, setPaused] = useState(false);
	const [hovered, setHovered] = useState(false);
	const [focused, setFocused] = useState(false);
	const [inView, setInView] = useState(false);
	const [pageVisible, setPageVisible] = useState(!document.hidden);
	const heroRef = useRef<HTMLDivElement>(null);
	const reduceMotion = useReducedMotion();
	const index = Math.max(0, items.findIndex((item) => item.video.vi === selectedId));
	const item = items[index];
	const { video, member } = item;
	const premiere = video.lbc === "upcoming" || video.lbc === "live";
	const autoPlaying = items.length > 1 && !paused && !reduceMotion && !hovered && !focused && inView && pageVisible;

	useEffect(() => {
		const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= .25), { threshold: .25 });
		if (heroRef.current) observer.observe(heroRef.current);
		const updateVisibility = () => setPageVisible(!document.hidden);
		document.addEventListener("visibilitychange", updateVisibility);
		return () => {
			observer.disconnect();
			document.removeEventListener("visibilitychange", updateVisibility);
		};
	}, []);

	useEffect(() => {
		if (!autoPlaying) return;
		const timeout = window.setTimeout(() => setSelectedId(items[(index + 1) % items.length].video.vi), 8000);
		return () => window.clearTimeout(timeout);
	}, [autoPlaying, index, items]);

	const move = (step: number) => setSelectedId(items[(index + step + items.length) % items.length].video.vi);
	return (
		<Flex as="section" ref={heroRef} id="obs-featured" aria-label="주요 영상" aria-roledescription="캐러셀" position="relative" align="flex-end" overflow="hidden" bg="#171322"
			onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
			onPointerLeave={() => setHovered(false)}
			onFocusCapture={() => setFocused(true)}
			onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
			minH={{ base: "clamp(480px, calc(100svh - 112px), 720px)", md: "clamp(480px, calc(100svh - 80px), 820px)" }}>
			<AnimatePresence initial={false}>
				<Box as={motion.div} key={video.vi} position="absolute" inset={0}
					initial={{ opacity: reduceMotion ? 1 : 0, scale: reduceMotion ? 1 : 1.035 }}
					animate={{ opacity: 1, scale: 1, transition: { duration: reduceMotion ? 0 : .85, ease: "easeOut" } }}
					exit={{ opacity: 0, transition: { duration: reduceMotion ? 0 : .65 } }}>
					<Image src={`https://i.ytimg.com/vi/${encodeURIComponent(video.vi)}/maxresdefault.jpg`} alt="" w="100%" h="100%" objectFit="cover" filter="saturate(.7)"
						onError={(event) => {
							if (!event.currentTarget.src.endsWith("/hqdefault.jpg")) event.currentTarget.src = `https://i.ytimg.com/vi/${encodeURIComponent(video.vi)}/hqdefault.jpg`;
						}} />
				</Box>
			</AnimatePresence>
			<Box position="absolute" inset={0} pointerEvents="none" bg="linear-gradient(0deg, #12101f 0%, #19102cd9 35%, #23133426 100%), linear-gradient(90deg, #130e2566, transparent 80%)" />
			<Box position="relative" w="100%" maxW="1440px" mx="auto" pt={{ base: "60px", md: "80px" }} pb={{ base: "30px", md: "48px" }} pl={{ base: 5, md: "38px" }} pr={{ base: 5, md: "140px" }}>
				<Box aria-live={autoPlaying ? "off" : "polite"} aria-atomic="true">
				<Box as={motion.div} key={video.vi} initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 }}
					animate={{ opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : .45, ease: "easeOut" } }}>
					<Flex wrap="wrap" gap={2}>{item.labels.map((label) => <HomeBadge key={label}>{label}</HomeBadge>)}</Flex>
					<Heading as="h1" fontSize={{ base: "clamp(32px, 8vw, 48px)", md: "clamp(36px, 5vw, 64px)" }} fontWeight="500" lineHeight="1.22" letterSpacing="-.04em" my={4} maxW="920px">{video.ta || video.tl}</Heading>
					<Text fontSize={{ base: "16px", md: "19px" }} color="#e0d3f0" mb={3}>{member.n}</Text>
					<Text fontSize="12px" color="#ded2ed">{homeDate(premiere ? video.sst : video.pa)} · {premiere ? "공개" : "게시"}{video.tg?.some((tag) => tag.icv) ? " · Cover" : ""}</Text>
					{item.milestone && (
						<Box mt={2}>
							<HomeBadge gold>{homeCount(item.milestone.record.u)} 달성</HomeBadge>
							<Text fontSize="12px" color="#ded2ed" mt={1}>{homeDate(item.milestone.record.at)} 달성</Text>
						</Box>
					)}
				</Box>
				</Box>
				<Flex wrap="wrap" gap={2} mt={7}>
					<ObservatoryButton href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.vi)}`} isExternal primary>영상 보러 가기 ↗</ObservatoryButton>
					<ObservatoryButton onClick={() => document.getElementById("obs-recent")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}>새 영상 둘러보기 ↓</ObservatoryButton>
				</Flex>
				<HStack spacing={3} mt={7} fontSize="12px" sx={{ fontVariantNumeric: "tabular-nums" }}>
					<ObservatoryButton aria-label="이전 주요 영상" isDisabled={items.length < 2} onClick={() => move(-1)}>←</ObservatoryButton>
					<Text>{index + 1} / {items.length}</Text>
					<ObservatoryButton aria-label="다음 주요 영상" isDisabled={items.length < 2} onClick={() => move(1)}>→</ObservatoryButton>
					<ObservatoryButton aria-label={paused || reduceMotion ? "주요 영상 자동 넘김 시작" : "주요 영상 자동 넘김 일시정지"}
						isDisabled={items.length < 2 || !!reduceMotion} onClick={() => {
							setPaused((value) => !value);
							setFocused(false);
						}}>
						{paused || reduceMotion ? "자동 넘김" : "일시정지"}
					</ObservatoryButton>
				</HStack>
			</Box>
		</Flex>
	);
}

function HomeBadge({ children, gold }: { children: ReactNode; gold?: boolean }) {
	return <Badge px="6px" py="2px" borderRadius="4px" fontSize="11px" fontWeight="500" textTransform="none" whiteSpace="normal" color={gold ? "#dec19c" : "var(--obs-accent)"} bg={gold ? "#392c30" : "#2b2541"}>{children}</Badge>;
}

function HomeVideoCard({ item, showMilestone }: { item: HomeVideo; showMilestone?: boolean }) {
	const { video, member } = item;
	const milestone = showMilestone ? item.milestone : undefined;
	const videoId = milestone?.videoId || video.vi;
	const url = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
	return (
		<Flex as="article" direction="column" align="stretch" flex={{ base: "0 0 200px", md: "0 0 228px" }} minW={0} gap={2} fontSize="12px" sx={{ scrollSnapAlign: "start" }}>
			<Link href={url} isExternal tabIndex={-1} aria-hidden="true" display="block">
				<Image src={`https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`} alt="" loading="lazy" draggable={false} w="100%" aspectRatio={16 / 9} objectFit="cover" borderRadius="7px" bg="#1b192c" pointerEvents="none" userSelect="none" />
			</Link>
			<Text color="var(--obs-muted)">{member.n}</Text>
			{(video.tg?.some((tag) => tag.icv) || (showMilestone && item.labels.includes("새 영상"))) && (
				<Flex wrap="wrap" gap={1}>
					{video.tg?.some((tag) => tag.icv) && <HomeBadge>Cover</HomeBadge>}
					{showMilestone && item.labels.includes("새 영상") && <HomeBadge>NEW · 새 영상</HomeBadge>}
				</Flex>
			)}
			<Link href={url} isExternal _hover={{ color: "var(--obs-accent)", textDecoration: "none" }}><Heading as="h3" fontSize="15px" fontWeight="600" lineHeight="1.5">{video.ta || video.tl}</Heading></Link>
			{milestone && <Box><HomeBadge gold>{homeCount(milestone.record.u)} 달성</HomeBadge></Box>}
			<Text color="var(--obs-muted)">{homeDate(milestone ? milestone.record.at : video.pa)} {milestone ? "달성" : "게시"}</Text>
			<Text color="var(--obs-muted)">조회수 · {homeCount(milestone ? milestone.views : video.vc)}</Text>
			<ObservatoryButton href={url} isExternal mt="auto">영상 보러 가기 ↗</ObservatoryButton>
		</Flex>
	);
}

function HomeLives({ items, members, now }: { items: LiveStatusState[]; members: StellarV2State[]; now: number }) {
	const list = items.filter((item) => item.openLive || !item.graduation || new Date(item.graduation).getTime() > now)
		.slice().sort((a, b) => Number(!!b.openLive) - Number(!!a.openLive) ||
			(new Date(b.openLive ? b.openDate || 0 : b.closeDate || 0).getTime() || 0) - (new Date(a.openLive ? a.openDate || 0 : a.closeDate || 0).getTime() || 0));
	if (!list.length) return <Text color="var(--obs-muted)">표시할 방송 정보가 없어요.</Text>;
	return (
		<SimpleGrid columns={{ base: 1, md: 2 }} spacing="10px">
			{list.map((item) => {
				const member = members.find((candidate) => candidate.uid === item.uuid);
				const name = member?.n || item.channelName || item.name || "채널";
				const channel = item.chzzkId || member?.czi;
				const timestamp = new Date((item.openLive ? item.openDate : item.closeDate) || "").getTime();
				const minutes = Math.max(0, Math.floor((now - timestamp) / 60000));
				const elapsed = !Number.isFinite(timestamp) ? "시간 정보 없음" : minutes >= 1440 ? `${Math.floor(minutes / 1440)}일` : minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분` : `${minutes}분`;
				return (
					<Link key={item.uuid} href={channel ? `https://chzzk.naver.com/live/${encodeURIComponent(channel)}` : "https://chzzk.naver.com"} isExternal
						display="flex" alignItems="center" minW={0} gap={3} p={{ base: "14px 12px", md: 4 }} borderRadius="8px" bg="#1b182ae6" _hover={{ bg: "#2b2541", textDecoration: "none" }}>
						<Avatar name={name} src={item.channelImageUrl || member?.pi} boxSize="36px" flexShrink={0} bg="#2b2541" color="var(--obs-accent)" />
						<Box flex={1} minW={0}>
							<Heading as="h3" fontSize="14px" fontWeight="600">{name}</Heading>
							<Text isTruncated color="var(--obs-muted)" fontSize="12px">{item.openLive ? item.liveTitle || "방송 중" : "마지막 방송 종료"}{item.openLive && item.liveCategoryValue ? ` · ${item.liveCategoryValue}` : ""}</Text>
							<Text color="var(--obs-muted)" fontSize="12px">{elapsed}{Number.isFinite(timestamp) ? item.openLive ? " 방송 중" : " 전 종료" : ""}</Text>
						</Box>
						<HomeBadge>{item.openLive ? "● LIVE" : "OFFLINE"}</HomeBadge>
					</Link>
				);
			})}
		</SimpleGrid>
	);
}
