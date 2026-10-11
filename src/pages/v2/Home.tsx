import { Avatar, Badge, Box, DarkMode, Flex, Heading, HStack, Image, SimpleGrid, Spinner, Stack, Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MdChevronLeft, MdChevronRight, MdEmojiEvents, MdPause, MdPlayArrow } from "react-icons/md";
import { useLocalStorage } from "usehooks-ts";
import { elapsedTimeText, parseV2Time } from "../../lib/functions/date";
import { useOutletContext } from "react-router-dom";
import { ObservatoryButton, ObservatoryExplore, ObservatoryShelf } from "../../components/layout/Observatory";
import { HomeVideoPreview } from "../../components/layout/HomeVideoPreview";
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
	const [autoEnabled, setAutoEnabled] = useLocalStorage("obs-hero-autoplay", true);
	const [hovered, setHovered] = useState(false);
	const [focused, setFocused] = useState(false);
	const [inView, setInView] = useState(false);
	const [pageVisible, setPageVisible] = useState(!document.hidden);
	const heroRef = useRef<HTMLDivElement>(null);
	const reduceMotion = useReducedMotion();
	const index = Math.max(0, items.findIndex((item) => item.video.vi === selectedId));
	const item = items[index];
	const { video, member } = item;
	const title = video.ta || video.tl;
	const premiere = video.lbc === "upcoming" || video.lbc === "live";
	const autoPlaying = items.length > 1 && autoEnabled && !reduceMotion && !hovered && !focused && inView && pageVisible;
	const autoStatus = reduceMotion ? "동작 줄이기 적용" : !autoEnabled ? "자동 넘김 꺼짐" : items.length < 2 ? "영상 1개" : autoPlaying ? "자동 넘김 중" : "자동 넘김 대기";
	const nextId = items[(index + 1) % items.length].video.vi;

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
		const timeout = window.setTimeout(() => setSelectedId(nextId), 8000);
		return () => window.clearTimeout(timeout);
	}, [autoPlaying, nextId, selectedId]);

	const move = (step: number) => setSelectedId(items[(index + step + items.length) % items.length].video.vi);
	return (
		<Flex as="section" ref={heroRef} id="obs-featured" aria-label="주요 영상" aria-roledescription="캐러셀" position="relative" align="flex-end" overflow="hidden" bg="#171322"
			onPointerEnter={(event) => { if (event.pointerType === "mouse") setHovered(true); }}
			onPointerLeave={() => setHovered(false)}
			onFocusCapture={() => setFocused(true)}
			onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
			h={{ base: "clamp(540px, calc(100svh - 112px), 720px)", md: "clamp(560px, calc(100svh - 80px), 820px)" }}>
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
			{!premiere && !reduceMotion && inView && pageVisible && (
				<HomeVideoPreview key={video.vi} videoId={video.vi} />
			)}
			<Box position="absolute" inset={0} pointerEvents="none" bg="linear-gradient(0deg, #12101f 0%, #19102cd9 35%, #23133426 100%), linear-gradient(90deg, #130e2566, transparent 80%)" />
			<Box position="relative" w="100%" maxW="1440px" mx="auto" pt={{ base: "40px", md: "60px" }} pb={{ base: "30px", md: "48px" }} pl={{ base: 5, md: "38px" }} pr={{ base: 5, md: "140px" }}>
				<Box aria-live={autoPlaying ? "off" : "polite"} aria-atomic="true">
					<Box as={motion.div} key={video.vi} initial={{ opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 }}
						animate={{ opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : .45, ease: "easeOut" } }}>
						<Flex gap={2} h="44px" align="center" overflowX="auto" sx={{ scrollbarWidth: "none" }}>
							{item.milestone && (
								<Badge display="inline-flex" alignItems="center" gap={2} px={3} py="6px" flexShrink={0} maxW="100%"
									fontSize={{ base: "14px", md: "16px" }} fontWeight="700" textTransform="none" borderRadius="full"
									color="#342219" bg="linear-gradient(120deg, #ffe4b8, #eac18b)" border="1px solid #fff0d1"
									boxShadow="0 4px 22px #eac18b26">
									<MdEmojiEvents size={20} aria-hidden="true" />
									<Text isTruncated>{homeCount(item.milestone.record.u)} 달성</Text>
								</Badge>
							)}
							{item.labels.filter((label) => label !== "조회수 달성").map((label) => <HomeBadge key={label}>{label}</HomeBadge>)}
						</Flex>
						<Link href={`https://www.youtube.com/watch?v=${encodeURIComponent(video.vi)}`} isExternal display="block" my={4} maxW="920px" title={title} _hover={{ color: "#e1cffb", textDecoration: "none" }}>
							<Heading as="h1" fontSize={{ base: "clamp(28px, 7vw, 40px)", md: "clamp(36px, 4.5vw, 58px)" }} fontWeight="500" lineHeight="1.22" letterSpacing="-.04em" h="2.44em" noOfLines={2} overflowWrap="anywhere">{title}</Heading>
						</Link>
						<Text fontSize={{ base: "16px", md: "19px" }} color="#e0d3f0" mb={3} isTruncated>{member.n}</Text>
						<Text fontSize="12px" color="#ded2ed" isTruncated>{homeDate(premiere ? video.sst : video.pa)} · {premiere ? "공개" : "게시"}</Text>
						<Flex gap={2} h="28px" mt={2} align="center" overflowX="auto" sx={{ scrollbarWidth: "none" }}>
							{video.tg?.map((tag) => <HomeBadge key={tag.i ?? tag.n} colorScheme={tag.cc}>{tag.n}</HomeBadge>)}
						</Flex>
						<Box h="20px" mt={2} fontSize="12px" color="#dec19c">
							{item.milestone && <HomeElapsedTime timestamp={item.milestone.record.at} />}
						</Box>
					</Box>
				</Box>
				<Flex align="center" wrap="wrap" gap={3} mt={5} fontSize="11px" sx={{ fontVariantNumeric: "tabular-nums" }}>
					<HStack spacing={1}>
						<ObservatoryButton aria-label="이전 주요 영상" boxSize="32px" minH="32px" minW={0} p={0} isDisabled={items.length < 2} onClick={() => move(-1)}><MdChevronLeft size={18} /></ObservatoryButton>
						<Text minW="42px" textAlign="center">{index + 1} / {items.length}</Text>
						<ObservatoryButton aria-label="다음 주요 영상" boxSize="32px" minH="32px" minW={0} p={0} isDisabled={items.length < 2} onClick={() => move(1)}><MdChevronRight size={18} /></ObservatoryButton>
					</HStack>
					<HStack spacing={2}>
						<ObservatoryButton aria-label={autoEnabled ? "주요 영상 자동 넘김 끄기" : "주요 영상 자동 넘김 켜기"} aria-pressed={autoEnabled}
							boxSize="32px" minH="32px" minW={0} p={0} primary={autoEnabled && !reduceMotion} isDisabled={items.length < 2 || !!reduceMotion}
							onClick={() => { setAutoEnabled((value) => !value); setFocused(false); }}>
							{autoEnabled && !reduceMotion ? <MdPause size={18} /> : <MdPlayArrow size={18} />}
						</ObservatoryButton>
						<Box w="108px">
							<HStack spacing={1.5} mb={1} color={autoPlaying ? "#dec9fa" : "var(--obs-muted)"}>
								<Box boxSize="6px" borderRadius="full" bg={autoPlaying ? "#c1a4ef" : "#766785"} boxShadow={autoPlaying ? "0 0 10px #c1a4ef" : "none"} />
								<Text>{autoStatus}</Text>
							</HStack>
							<Box h="3px" bg="#ffffff1a" borderRadius="full" overflow="hidden" aria-hidden="true">
								<Box key={`${video.vi}-${autoPlaying}`} h="100%" bg="#c1a4ef" transform="scaleX(0)" transformOrigin="left"
									animation={autoPlaying ? "obs-autoplay 8s linear forwards" : undefined}
									sx={{ "@keyframes obs-autoplay": { to: { transform: "scaleX(1)" } } }} />
							</Box>
						</Box>
					</HStack>
				</Flex>
			</Box>
		</Flex>
	);
}

function HomeBadge({ children, gold, colorScheme }: { children: ReactNode; gold?: boolean; colorScheme?: string }) {
	return (
		<DarkMode>
			<Badge px="8px" py="3px" border="1px solid" borderRadius="full" fontSize="10px" fontWeight="500"
				textTransform="none" whiteSpace="nowrap" maxW="180px" flexShrink={0} isTruncated
				colorScheme={colorScheme} variant="subtle"
				borderColor={colorScheme ? `${colorScheme}.600` : gold ? "#dec19c33" : "#c1a4ef33"}
				color={colorScheme ? undefined : gold ? "#efcda0" : "#d6c0f4"}
				bg={colorScheme ? undefined : gold ? "#392c30cc" : "#302445cc"}>
				{children}
			</Badge>
		</DarkMode>
	);
}

function HomeElapsedTime({ timestamp }: { timestamp: number }) {
	const [now, setNow] = useState(Date.now);
	useEffect(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 1000);
		return () => window.clearInterval(timer);
	}, []);
	return <Text title={homeDate(timestamp)} aria-live="off">{elapsedTimeText(parseV2Time(timestamp), now)} 달성</Text>;
}

function HomeVideoCard({ item, showMilestone }: { item: HomeVideo; showMilestone?: boolean }) {
	const { video, member } = item;
	const milestone = showMilestone ? item.milestone : undefined;
	const videoId = milestone?.videoId || video.vi;
	const url = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
	const title = video.ta || video.tl;
	return (
		<Flex as="article" role="group" direction="column" align="stretch" flex={{ base: "0 0 200px", md: "0 0 228px" }} minW={0} gap={2} fontSize="12px" sx={{ scrollSnapAlign: "start" }}>
			<Link href={url} isExternal tabIndex={-1} aria-hidden="true" display="block" position="relative" overflow="hidden" borderRadius="12px">
				<Image src={`https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`} alt="" loading="lazy" draggable={false} w="100%" aspectRatio={16 / 9} objectFit="cover" bg="#1b192c" pointerEvents="none" userSelect="none" />
				<Flex position="absolute" inset={0} align="flex-end" p={3} bg="linear-gradient(transparent 30%, #100b1ee6)" opacity={0} transition="opacity .2s" _groupHover={{ opacity: 1 }} _groupFocusWithin={{ opacity: 1 }} pointerEvents="none">
					<Text color="#f1edf8">조회수 · {homeCount(milestone ? milestone.views : video.vc)}</Text>
				</Flex>
			</Link>
			<Text color="var(--obs-muted)" isTruncated>{member.n}</Text>
			<Link href={url} isExternal title={title} _hover={{ color: "var(--obs-accent)", textDecoration: "none" }}>
				<Heading as="h3" fontSize="15px" fontWeight="600" lineHeight="1.5" h="3em" noOfLines={2} overflowWrap="anywhere">{title}</Heading>
			</Link>
			<Flex gap={1} h="28px" align="center" overflowX="auto" sx={{ scrollbarWidth: "none" }}>
				{milestone && <HomeBadge gold>{homeCount(milestone.record.u)} 달성</HomeBadge>}
				{video.tg?.map((tag) => <HomeBadge key={tag.i ?? tag.n} colorScheme={tag.cc}>{tag.n}</HomeBadge>)}
				{showMilestone && item.labels.includes("새 영상") && <HomeBadge>새 영상</HomeBadge>}
			</Flex>
			<Box color="var(--obs-muted)" h="20px" mt="auto">
				{milestone ? <HomeElapsedTime timestamp={milestone.record.at} /> : <Text isTruncated>{homeDate(video.pa)} 게시</Text>}
			</Box>
		</Flex>
	);
}
function HomeLives({ items, members, now }: { items: LiveStatusState[]; members: StellarV2State[]; now: number }) {
	const list = items.filter((item) => item.openLive || !item.graduation || new Date(item.graduation).getTime() > now)
		.slice().sort((a, b) => Number(!!b.openLive) - Number(!!a.openLive) ||
			(new Date(b.openLive ? b.openDate || 0 : b.closeDate || 0).getTime() || 0) - (new Date(a.openLive ? a.openDate || 0 : a.closeDate || 0).getTime() || 0));
	if (!list.length) return <Text color="var(--obs-muted)">표시할 방송 정보가 없어요.</Text>;
	return (
		<SimpleGrid columns={{ base: 1, md: 2 }} spacing="12px">
			{list.map((item) => {
				const member = members.find((candidate) => candidate.uid === item.uuid);
				const name = member?.n || item.channelName || item.name || "채널";
				const channel = item.chzzkId || member?.czi;
				const timestamp = new Date((item.openLive ? item.openDate : item.closeDate) || "").getTime();
				const minutes = Math.max(0, Math.floor((now - timestamp) / 60000));
				const elapsed = !Number.isFinite(timestamp) ? "시간 정보 없음" : minutes >= 1440 ? `${Math.floor(minutes / 1440)}일` : minutes >= 60 ? `${Math.floor(minutes / 60)}시간 ${minutes % 60}분` : `${minutes}분`;
				return (
					<Link key={item.uuid} href={channel ? `https://chzzk.naver.com/live/${encodeURIComponent(channel)}` : "https://chzzk.naver.com"} isExternal
						display="flex" alignItems="center" minW={0} gap={3} p={{ base: "16px 14px", md: 5 }} borderRadius="16px" border="1px solid"
						borderColor={item.openLive ? "#69dfb755" : "#76678526"} borderLeftWidth={item.openLive ? "3px" : "1px"}
						bg={item.openLive ? "linear-gradient(120deg, #20483ee6, #211d35e6)" : "#1b182aa6"}
						boxShadow={item.openLive ? "0 6px 24px #52d6a80d, inset 0 1px 0 #b1ffe80d" : "none"}
						transition="background .2s, border-color .2s, box-shadow .2s"
						_hover={{ bg: item.openLive ? "linear-gradient(120deg, #285548, #29213f)" : "#242031", borderColor: item.openLive ? "#69dfb799" : "#76678566", textDecoration: "none" }}>
						<Avatar name={name} src={item.channelImageUrl || member?.pi} boxSize="42px" flexShrink={0} bg="#2b2541" color="var(--obs-accent)" filter={item.openLive ? "none" : "grayscale(.8)"} opacity={item.openLive ? 1 : .65} />
						<Box flex={1} minW={0}>
							<Flex align="center" gap={2} mb={1}>
								<Heading as="h3" fontSize="14px" fontWeight="600" isTruncated color={item.openLive ? "#f1fff9" : "#b4aacb"}>{name}</Heading>
								<Badge flexShrink={0} borderRadius="full" px={2} fontSize="10px" color={item.openLive ? "#85f3c8" : "#a69db7"} bg={item.openLive ? "#6af3bb1a" : "#a69db70d"}>{item.openLive ? "● LIVE" : "OFFLINE"}</Badge>
							</Flex>
							<Text noOfLines={1} color={item.openLive ? "#d9ede4" : "var(--obs-muted)"} fontSize="12px" title={item.liveTitle || undefined}>{item.openLive ? item.liveTitle || "방송 중" : "마지막 방송 종료"}</Text>
							<Flex align="center" gap={2} mt={2} minW={0}>
								{item.openLive && item.liveCategoryValue && <HomeBadge>{item.liveCategoryValue}</HomeBadge>}
								<Text color="var(--obs-muted)" fontSize="11px" isTruncated>{elapsed}{Number.isFinite(timestamp) ? item.openLive ? " 방송 중" : " 전 종료" : ""}</Text>
							</Flex>
						</Box>
					</Link>
				);
			})}
		</SimpleGrid>
	);
}
