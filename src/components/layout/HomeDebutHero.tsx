import { Avatar, Box, Button, Flex, Heading, Stack, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { MdArrowForward, MdAutoAwesome, MdPlayArrow, MdSchedule, MdSensors } from "react-icons/md";
import { debutColor, debutPvSegment, type DebutEvent } from "../../lib/functions/debut";
import { homeDate } from "../../lib/functions/homeV2";
import { formatUtcToKst } from "../../lib/functions/date";
import { generateStandardThumbnail, naver, youtube, youtubeThumbnailImageProps } from "../../lib/functions/platforms";
import { ImageV2 } from "../Image";
import { Link } from "../Link";
import { ObservatoryButton } from "./Observatory";
import { HomeVideoPreview } from "./HomeVideoPreview";

export function HomeDebutHero({ events, now }: { events: DebutEvent[]; now: number }) {
	const [selectedId, setSelectedId] = useState(events[0]?.profile.uuid);
	const heroRef = useRef<HTMLDivElement>(null);
	const [inView, setInView] = useState(false);
	const [pageVisible, setPageVisible] = useState(!document.hidden);
	const reduceMotion = useReducedMotion();
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
	const event = events.find(({ profile }) => profile.uuid === selectedId) || events[0];
	if (!event) return null;
	const { profile, member, video, debutAt } = event;
	const name = profile.name || member?.n || profile.channelName || "새로운 스텔라";
	const pv = debutPvSegment(profile.name, member?.n, profile.channelName);
	const image = profile.channelImageUrl || member?.pi;
	const channel = profile.chzzkId || member?.czi;
	const remainingMinutes = Math.max(0, Math.ceil((debutAt - now) / 60000));
	const beforeDebut = now < debutAt;
	const countdown = remainingMinutes >= 1440 ? `D-${Math.ceil(remainingMinutes / 1440)}` : remainingMinutes >= 60 ? `${Math.floor(remainingMinutes / 60)}시간 ${remainingMinutes % 60}분 후` : `${remainingMinutes}분 후`;
	const videoLive = video?.lbc === "live";
	const videoUpcoming = video?.lbc === "upcoming";
	const accent = debutColor(member?.cc, profile.colorCode) || "#c1a4ef";
	const portrait = <Box className="debut-portrait" position="relative" isolation="isolate" p={5} border={`1px solid ${accent}33`} borderRadius="full" boxShadow={`0 0 80px ${accent}15`} transition="box-shadow .6s ease, border-color .6s ease">
		<Box className="debut-galaxy" position="absolute" inset={{ base: "-65px -90px", md: "-85px -125px" }} opacity={0} transition="opacity .7s ease" pointerEvents="none" aria-hidden="true" zIndex={-1}>
			<Box position="absolute" inset={0} borderRadius="50%" bg={`radial-gradient(ellipse, ${accent}50 0%, ${accent}20 38%, transparent 70%)`} />
			<Box position="absolute" inset="15% -5%" transform="rotate(-28deg)" overflow="hidden" sx={{ maskImage: "radial-gradient(ellipse, #000 15%, transparent 70%)" }}>
				<Box className="debut-flow" position="absolute" inset="-15%" filter="blur(12px)" background={`radial-gradient(ellipse at 30% 52%, ${accent}99, transparent 48%), radial-gradient(ellipse at 70% 45%, #e8ddff66, transparent 42%)`} animation="debut-nebula-flow 9s ease-in-out infinite alternate" sx={{ animationPlayState: "paused" }} />
				<Box className="debut-flow" position="absolute" inset="-45px" backgroundImage={`radial-gradient(circle, #fff 0 1px, transparent 1.6px), radial-gradient(circle, ${accent} 0 1.2px, transparent 2px), radial-gradient(circle, #ffffff99 0 .6px, transparent 1.2px)`} backgroundSize="47px 43px, 71px 67px, 29px 37px" backgroundPosition="0 0, 19px 27px, 11px 9px" animation="debut-stardust-flow 12s linear infinite" sx={{ animationPlayState: "paused" }} />
			</Box>
		</Box>
		<Avatar position="relative" name={name} src={naver.chzzk.profileImageUrl(image || undefined, 240)} boxSize={{ base: "128px", md: "176px" }} bg="#30243e" color="#dfcef6" border="2px solid" borderColor="var(--debut-accent)" />
		<Box position="absolute" top={4} right={5} color="#eadbfc" aria-hidden="true"><MdAutoAwesome size={25} /></Box>
	</Box>;
	return (
		<Box as="section" ref={heroRef} id="obs-featured" aria-label="데뷔 스페셜" position="relative" overflow="hidden" bg="#171322"
			sx={{
				"--debut-accent": accent,
				"@keyframes debut-member-shimmer": {
					"0%, 60%, 100%": { textShadow: "0 0 3px transparent" },
					"78%": { textShadow: "0 0 8px var(--member-glow), 0 0 18px var(--member-glow)" },
				},
				"@keyframes debut-nebula-flow": {
					from: { transform: "translateX(-6%) scale(.95)", opacity: .55 },
					to: { transform: "translateX(6%) scale(1.08)", opacity: .9 },
				},
				"@keyframes debut-stardust-flow": {
					"0%": { transform: "translate(-22px, 8px)", opacity: 0 },
					"20%, 80%": { opacity: .85 },
					"100%": { transform: "translate(22px, -8px)", opacity: 0 },
				},
				"& .debut-portrait:hover, & a:focus-visible .debut-portrait": {
					borderColor: `${accent}aa`, boxShadow: `0 0 45px ${accent}55, 0 0 105px 28px ${accent}33, 0 0 160px 45px ${accent}18`,
					"& .debut-galaxy": { opacity: 1 },
					"& .debut-flow": { animationPlayState: inView && pageVisible && !reduceMotion ? "running" : "paused" },
				},
				"@media (prefers-reduced-motion: reduce)": {
					"& .debut-flow, & .debut-member-name": { animation: "none" },
					"& .debut-portrait, & .debut-galaxy": { transition: "none" },
				},
			}}>
			<Box position="absolute" inset={0} pointerEvents="none" aria-hidden="true" bg="radial-gradient(ellipse at 75% 35%, #8060b533, transparent 60%), linear-gradient(135deg, #231a37, #12101f 80%)" />
			{pv && !reduceMotion && inView && pageVisible && <HomeVideoPreview key={`${profile.uuid}-${pv.start}-${pv.end}`} {...pv} />}
			{pv && <Box position="absolute" inset={0} pointerEvents="none" aria-hidden="true" bg="linear-gradient(0deg, #12101f 0%, #19102c99 40%, #23133426 100%), linear-gradient(90deg, #130e25d9, #130e2533 80%)" />}
			<Box position="absolute" top="-160px" right="-80px" boxSize={{ base: "440px", md: "680px" }} border="1px solid #c1a4ef1c" borderRadius="full" pointerEvents="none" aria-hidden="true"
				_after={{ content: '""', position: "absolute", inset: "55px", border: "1px solid #c1a4ef12", borderRadius: "full" }} />
			<Box position="relative" maxW="1440px" mx="auto" pl={{ base: 5, md: "38px" }} pr={{ base: 5, md: "140px" }} py={{ base: 8, md: 12 }}>
				<Flex align="center" gap={2} color="#d9c2f6" fontSize="11px" letterSpacing=".2em" mb={6}><MdAutoAwesome aria-hidden="true" /><Text>STELLIVE · DEBUT SPECIAL</Text></Flex>
				<Flex direction={{ base: "column", lg: "row" }} gap={{ base: 7, lg: 10 }} align={{ base: "stretch", lg: "center" }}>
					<Box flex={1} minW={0}>
						<Text color="#d0c1e3" fontSize={{ base: "15px", md: "18px" }} mb={3}>{beforeDebut ? "새로운 별을 만날 시간" : "우리의 하늘에 새로운 별이 떴어요"}</Text>
						<Heading as="h1" fontSize={{ base: "38px", md: "56px" }} fontWeight="500" letterSpacing="-.04em" lineHeight="1.2">{name}</Heading>
						<Flex mt={5} gap={3} align="center" wrap="wrap">
							<Text px={3} py={1} borderRadius="full" bg="#c1a4ef1c" border="1px solid #c1a4ef44" fontSize="13px" color="#eadbfc">{beforeDebut ? countdown : "데뷔를 축하해요"}</Text>
							<Text fontSize="13px" color="#c7bbd9">{homeDate(debutAt / 1000)} · {beforeDebut ? "데뷔 예정" : "데뷔"}</Text>
						</Flex>
						<Text mt={5} color="#b4aacb" fontSize="14px" lineHeight="1.9">{beforeDebut ? "처음 만나는 순간부터, 함께 빛날 모든 날까지." : "이제 막 시작된 이야기에 함께해 주세요."}</Text>
						<Flex mt={6} gap={3} wrap="wrap">
							{channel && <ObservatoryButton href={naver.chzzk.channelUrl(channel)} isExternal rightIcon={<MdArrowForward />} primary>치지직 채널 보기</ObservatoryButton>}
						</Flex>
					</Box>
					<Box w={{ base: "100%", lg: "44%" }} flexShrink={0}>
						{video ? <Link href={youtube.videoUrl(video.vi)!} isExternal display="block" borderRadius="20px" overflow="hidden" border="1px solid #c1a4ef44" bg="#221a32" _hover={{ borderColor: "#d9c2f6", textDecoration: "none" }}>
							<Box position="relative">
								<ImageV2 src={generateStandardThumbnail(video.vi)} alt="" ratio={16 / 9} loading="eager" isDarkMode imageProps={youtubeThumbnailImageProps} />
								<Flex position="absolute" inset={0} align="center" justify="center" bg="linear-gradient(0deg, #09061266, transparent 70%)" aria-hidden="true"><Flex boxSize="56px" borderRadius="full" bg="#100a20aa" align="center" justify="center"><MdPlayArrow size={32} /></Flex></Flex>
							</Box>
							<Box p={{ base: 4, md: 5 }}>
								<Flex gap={2} align="center" color={videoLive ? "#ffabba" : "#aedbff"} fontSize="12px">{videoLive ? <MdSensors /> : videoUpcoming ? <MdSchedule /> : <MdAutoAwesome />}<Text>{videoLive ? "첫 노래 · 지금 최초공개 중" : videoUpcoming ? "첫 노래 · 최초공개 예정" : "첫 노래가 도착했어요"}</Text></Flex>
								<Heading as="h2" mt={2} fontSize="19px" fontWeight="500" noOfLines={2}>{video.ta || video.tl}</Heading>
								<Text mt={2} fontSize="12px" color="#b4aacb">{videoUpcoming ? `${homeDate(video.sst)} · YouTube에서 알림 받기` : "YouTube에서 함께 듣기 ↗"}</Text>
							</Box>
						</Link> : <Stack align="center" justify="center" minH={{ base: "220px", lg: "300px" }} spacing={5}>
							{channel ? <Link href={naver.chzzk.channelUrl(channel)!} isExternal aria-label={`${name} 치지직 채널 보기`} display="block" borderRadius="full" _hover={{ textDecoration: "none" }}>{portrait}</Link> : portrait}
							<Text color="#b4aacb" fontSize="13px">{beforeDebut ? "곧, 여기서 만나요." : "새로운 시작을 함께 응원해 주세요."}</Text>
						</Stack>}
					</Box>
				</Flex>
				{events.length > 1 && <Box as="section" aria-label="데뷔 타임라인" mt={8}>
					<Text fontSize="10px" color="#a99abf" mb={2}>데뷔 일정</Text>
					<Box overflowX="auto" mx={-2} px={2} py={2} sx={{ scrollbarWidth: "thin", scrollbarColor: "#67517d transparent" }}>
					<Flex as="ol" aria-label="데뷔 멤버 선택" w="max-content" listStyleType="none" m={0} p={0}>
						{events.map(({ profile: item, member: current, debutAt: scheduledAt }, index) => {
							const selected = item.uuid === profile.uuid;
							const label = item.name || current?.n || item.channelName || "새로운 스텔라";
							const color = debutColor(current?.cc, item.colorCode);
							const date = new Date(scheduledAt).toISOString();
							const schedule = formatUtcToKst(date, "text").slice(5, 16).replace("-", ".");
							return <Box as="li" key={item.uuid} position="relative" flexShrink={0} pr={index < events.length - 1 ? { base: 6, md: 9 } : 0}
								_before={index < events.length - 1 ? { content: '""', position: "absolute", bg: "#c1a4ef26", left: "4px", top: "4px", w: "100%", h: "1px" } : undefined}>
								<Button variant="unstyled" aria-pressed={selected} aria-label={`${label}, ${homeDate(scheduledAt / 1000)} 데뷔`} onClick={() => setSelectedId(item.uuid)} position="relative" display="flex" flexDirection="column" alignItems="flex-start" justifyContent="center" h="auto" minH="60px" minW={0} pt={4} pb={1} px={0} borderRadius="2px" color={color || (selected ? "#f3edf9" : "#a99abf")} fontWeight="400" _hover={{ color: color || "#f3edf9" }}>
									<Box as="span" position="absolute" top="1px" left={0} boxSize="7px" borderRadius="full" bg={selected ? color || "#e3ccff" : color ? `${color}99` : "#675573"} boxShadow={selected ? `0 0 0 3px ${color || "#c1a4ef"}18` : "none"} aria-hidden="true" />
									<Text as="time" dateTime={date} fontSize="10px" color={selected ? color || "#ccb5e7" : "#9788ad"} letterSpacing=".04em" sx={{ fontVariantNumeric: "tabular-nums" }}>{schedule}</Text>
									<Text as="span" className="debut-member-name" fontSize="13px" fontWeight={selected ? "500" : "400"} mt={1} animation={selected && !reduceMotion ? "debut-member-shimmer 4.8s ease-in-out infinite" : "none"} sx={{ "--member-glow": color || "#c1a4ef", animationPlayState: inView && pageVisible ? "running" : "paused" }}>{label}</Text>
								</Button>
							</Box>;
						})}
					</Flex>
					</Box>
				</Box>}
			</Box>
		</Box>
	);
}
