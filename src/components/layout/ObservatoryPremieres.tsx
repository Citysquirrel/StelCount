import { Box, DarkMode, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerHeader, Flex, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import { MdExpandLess, MdPlayArrow, MdSchedule, MdSensors } from "react-icons/md";
import { ObservatoryButton } from "./Observatory";
import { Link } from "../Link";
import { ImageV2 } from "../Image";
import { homeDate, type HomeVideo } from "../../lib/functions/homeV2";
import { generateStandardThumbnail, youtube, youtubeThumbnailImageProps } from "../../lib/functions/platforms";
import { useObservatoryScroll } from "../../lib/hooks/useObservatoryScroll";

export function ObservatoryPremieres({ items }: { items: HomeVideo[] }) {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const { pathname } = useLocation();
	const { footerOffset } = useObservatoryScroll();
	const liveCount = items.filter(({ video }) => video.lbc === "live").length;
	const upcomingCount = items.length - liveCount;
	const summary = [liveCount > 0 && `진행 ${liveCount}`, upcomingCount > 0 && `예정 ${upcomingCount}`].filter(Boolean).join(" · ");
	return <>
		<ObservatoryButton onClick={onOpen} aria-haspopup="dialog" aria-expanded={isOpen} aria-label={`최초공개 소식 열기, ${summary}`}
			position="fixed" zIndex={95} left={{ base: "calc(16px + env(safe-area-inset-left, 0px))", md: "calc(24px + env(safe-area-inset-left, 0px))" }}
			bottom={{ base: `max(${footerOffset}px, calc(${pathname.replace(/\/$/, "") === "/counter" ? 97 : 24}px + env(safe-area-inset-bottom, 0px)))`, lg: `max(${footerOffset}px, calc(24px + env(safe-area-inset-bottom, 0px)))` }}
			maxW="calc(100% - 104px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))"
			minH="44px" bg="#292036f5" borderColor={liveCount ? "#ffabba66" : "#aedbff66"} boxShadow="0 6px 24px #09061266"
			sx={{
				"--premiere-glow": liveCount ? "#ffabba" : "#aedbff",
				"@keyframes obs-premiere-glow": {
					"0%, 65%, 100%": { opacity: 0 },
					"80%": { opacity: .45 },
				},
				"&::after": { content: '""', position: "absolute", inset: 0, borderRadius: "inherit", pointerEvents: "none", boxShadow: "0 0 14px 2px var(--premiere-glow), inset 0 0 8px var(--premiere-glow)", opacity: 0, animation: "obs-premiere-glow 5s ease-in-out infinite" },
				"@media (prefers-reduced-motion: reduce)": { "&::after": { animation: "none" } },
			}}
			leftIcon={liveCount ? <MdSensors color="#ffabba" aria-hidden="true" /> : <MdSchedule color="#aedbff" aria-hidden="true" />} rightIcon={<MdExpandLess aria-hidden="true" />}>
			<Text isTruncated fontSize="12px">최초공개 · {summary}</Text>
		</ObservatoryButton>
		<DarkMode>
			<Drawer isOpen={isOpen} onClose={onClose} placement="bottom">
				<DrawerContent maxW="720px" mx="auto" maxH="80dvh" bg="#171320" color="#f3edf9" border="1px solid #c1a4ef33" borderTopRadius="20px">
					<DrawerCloseButton aria-label="최초공개 소식 닫기" top={3} right={3} />
					<DrawerHeader fontSize="17px" pt={5} pr={14} pb={3}>최초공개 소식<Text fontSize="12px" fontWeight="400" color="#b4aacb" mt={1}>{summary}</Text></DrawerHeader>
					<DrawerBody px={{ base: 4, md: 6 }} pb="calc(24px + env(safe-area-inset-bottom, 0px))" overscrollBehavior="contain">
						<Stack spacing={3}>
							{items.map(({ video, member }) => {
								const isLive = video.lbc === "live";
								const accent = isLive ? "#ffabba" : "#aedbff";
								return <Link key={video.vi} href={youtube.videoUrl(video.vi)!} isExternal onClick={onClose} display="flex" flexDirection={{ base: "column", sm: "row" }} alignItems={{ base: "stretch", sm: "center" }} gap={{ base: 3, md: 4 }}
									p={{ base: 3, md: 4 }} borderRadius="16px" border={`1px solid ${accent}66`} borderLeft={`4px solid ${accent}`}
									bg={`linear-gradient(110deg, ${accent}22, ${accent}06)`} boxShadow={`0 8px 32px ${accent}0d`}
									_hover={{ bg: `${accent}26`, textDecoration: "none" }}>
									<Box position="relative" w={{ base: "100%", sm: "160px", md: "200px" }} flexShrink={0} borderRadius="10px" overflow="hidden">
										<ImageV2 src={generateStandardThumbnail(video.vi)} alt="" w="100%" ratio={16 / 9} objectFit="cover" loading="lazy" bg="#211a31" isDarkMode imageProps={youtubeThumbnailImageProps} />
										<Flex position="absolute" inset={0} align="center" justify="center" bg="linear-gradient(0deg, #09061266, transparent 65%)" aria-hidden="true">
											<Flex boxSize="36px" align="center" justify="center" borderRadius="full" bg="#09061299" color="white"><MdPlayArrow size={24} /></Flex>
										</Flex>
									</Box>
									<Box minW={0} flex={1}>
										<Text color={accent} fontSize={{ base: "16px", md: "20px" }} fontWeight="700">{isLive ? "지금, 함께 보는 최초공개" : "곧 만나요, 최초공개"}</Text>
										<Text mt={1} fontSize={{ base: "13px", md: "15px" }} noOfLines={2}>{member.n} · {video.ta || video.tl}</Text>
										<Text mt={1} fontSize="12px" color={accent}>{isLive ? "현재 상영 중 · YouTube에서 함께 보기" : `${homeDate(video.sst)} · YouTube에서 알림 받기`}</Text>
									</Box>
								</Link>;
							})}
						</Stack>
					</DrawerBody>
				</DrawerContent>
			</Drawer>
		</DarkMode>
	</>;
}

