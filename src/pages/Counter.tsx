import { useRecoilState } from "recoil";
import { PlatformInfosDetail, headerOffsetState, isLoadingState, stellarState } from "../lib/Atom";
import {
	Avatar,
	AvatarBadge,
	Box,
	BoxProps,
	Button,
	Card,
	CardBody,
	CardHeader,
	Divider,
	HStack,
	Link,
	SimpleGrid,
	Skeleton,
	SkeletonCircle,
	Stack,
	StackDivider,
	Text,
	Tooltip,
	theme,
	useColorMode,
} from "@chakra-ui/react";
import { Spacing } from "../components/Spacing";
import { Image } from "../components/Image";
import symbolTabi from "../assets/symbol/symbol_tabi.png";
import symbolMashiro from "../assets/symbol/symbol_mashiro.png";
import symbolHina from "../assets/symbol/symbol_hina.png";
import symbolLize from "../assets/symbol/symbol_lize.png";
import symbolKanna from "../assets/symbol/symbol_kanna.png";
import symbolYuni from "../assets/symbol/symbol_yuni.png";
import chzzkIcon from "../assets/i_chzzk_1.png";
import youtubeIcon from "../assets/i_youtube_1.png";
import SQ from "../assets/logo.png";
import { useEffect, useState } from "react";
import { useConsole } from "../lib/hooks/useConsole";
import { numberToLocaleString } from "../lib/functions/etc";
import { naver, youtube as youtubeAPI } from "../lib/functions/platforms";
import { useResponsive } from "../lib/hooks/useResponsive";

const stellarColors = {
	"아이리 칸나": "#373584",
	"아야츠노 유니": "#b77de4",
	"아라하시 타비": "#71C5E8",
	"네네코 마시로": "#25282A",
	"시라유키 히나": "#E4002B",
	"아카네 리제": "#971B2F",
};

const stellarSymbols = {
	"아이리 칸나": symbolKanna,
	"아야츠노 유니": symbolYuni,
	"아라하시 타비": symbolTabi,
	"네네코 마시로": symbolMashiro,
	"시라유키 히나": symbolHina,
	"아카네 리제": symbolLize,
};

//TODO: 카운트 페이지로 합치고, 홈페이지도 그냥 삭제해버리기
//TODO: 사이드바에서 멤버별로 카테고리 구분하고, 각자 페이지 상단에서 구독자수 등 표기하고
//TODO: 나머지 커버곡 조회수 및 추출을 스크롤 페이지에 배치

export function Counter() {
	const { colorMode } = useColorMode();
	const { windowWidth } = useResponsive();
	const [data, setData] = useRecoilState(stellarState);
	const [offsetY] = useRecoilState(headerOffsetState);
	const [isLoading] = useRecoilState(isLoadingState);
	const [currentUuid, setCurrentUuid] = useState("");

	const currentStellar = data.find((s) => s.uuid === currentUuid);
	const chzzk = currentStellar && currentStellar.chzzk;
	const youtube = currentStellar && currentStellar.youtube;
	const videos = currentStellar && currentStellar.videos;
	const currentColorCode = (currentStellar && "#" + currentStellar.colorCode) || undefined;
	const isUnder720 = windowWidth < 720;

	const handleClickStellar = (uuid: string) => () => {
		setCurrentUuid(uuid);
	};

	useEffect(() => {
		if (data.length > 0 && currentUuid === "") setCurrentUuid(data[0].uuid);
	}, [data]);
	useConsole(currentStellar);

	return (
		<Stack
			direction={"row"}
			paddingTop={`${offsetY}px`}
			backgroundColor={`${currentColorCode}aa`}
			transition=".3s background-color"
			backgroundImage={`url(${stellarSymbols[currentStellar?.name || ""]})`}
			backgroundRepeat={"no-repeat"}
			backgroundPosition={"bottom 72px right 24px"}
			backgroundSize={"128px"}
		>
			<SideListContainer
				position="sticky"
				top={`${offsetY}px`}
				left={0}
				minWidth={isUnder720 ? "64px" : "200px"}
				width={isUnder720 ? "64px" : "200px"}
				height={`calc(100vh - ${offsetY}px - 48px)`}
			>
				<SideList>
					{isLoading
						? Array.from({ length: 4 }, () => true).map((_, idx) => (
								<Skeleton key={idx} height="40px" borderRadius={"0.375rem"} />
						  ))
						: data.map((stellar) => (
								<Tooltip key={stellar.uuid} label={isUnder720 ? stellar.name : undefined} placement="right" hasArrow>
									<Button
										variant={"outline"}
										leftIcon={<Image boxSize="24px" src={stellar.chzzk?.profileImage} borderRadius={"full"} />}
										colorScheme={currentUuid === stellar.uuid ? "" : "blue"}
										backgroundColor="ButtonFace"
										onClick={handleClickStellar(stellar.uuid)}
										cursor={currentUuid === stellar.uuid ? "auto" : "pointer"}
										iconSpacing={isUnder720 ? 0 : undefined}
									>
										{isUnder720 ? null : <Text>{stellar.name}</Text>}
									</Button>
								</Tooltip>
						  ))}
				</SideList>
			</SideListContainer>
			<Box width="100%">
				<Stack margin="12px" marginTop="24px" divider={<StackDivider />} spacing={"4"}>
					<Stack direction={"row"} alignItems={"center"} spacing={"4"} flexWrap={"wrap"}>
						<Link href={chzzk && naver.chzzk.liveUrl(chzzk.channelId)} isExternal>
							{isLoading ? (
								<SkeletonCircle boxSize="72px" />
							) : (
								<Avatar boxSize="72px" src={(chzzk && chzzk.profileImage) || SQ}>
									<AvatarBadge boxSize="28px" bg={chzzk && chzzk?.liveStatus ? "green.400" : "red.400"} />
								</Avatar>
							)}
						</Link>
						<Divider orientation="vertical" height={windowWidth <= 840 ? "128px" : "64px"} />
						<Stack direction={windowWidth <= 840 ? "column" : "row"}>
							{youtube && youtube.length > 0 && youtube[0].subscriberCount ? (
								<Link href={youtubeAPI.channelUrl(youtube[0].channelId)} isExternal _hover={{ textDecoration: "none" }}>
									<Card
										width="240px"
										variant={"outline"}
										cursor="pointer"
										transition=".3s all"
										_hover={{ borderColor: currentColorCode }}
									>
										<HStack divider={<StackDivider />} spacing={"4"} padding="8px" justifyContent={"space-evenly"}>
											<HStack padding="4px">
												<Image boxSize={"20px"} src={youtubeIcon} />
												<Text fontSize={"1.25rem"}>구독자 {numberToLocaleString(youtube[0].subscriberCount)}</Text>
											</HStack>
										</HStack>
									</Card>
								</Link>
							) : null}
							{chzzk && chzzk.followerCount ? (
								<Link href={naver.chzzk.channelUrl(chzzk.channelId)} isExternal _hover={{ textDecoration: "none" }}>
									<Card
										width="240px"
										variant={"outline"}
										cursor="pointer"
										transition=".3s all"
										_hover={{ borderColor: currentColorCode }}
									>
										<HStack divider={<StackDivider />} spacing={"4"} padding="8px" justifyContent={"space-evenly"}>
											<HStack padding="4px">
												<Image boxSize={"20px"} src={chzzkIcon} />
												<Text fontSize={"1.25rem"}>팔로워 {numberToLocaleString(chzzk.followerCount)}</Text>
											</HStack>
										</HStack>
									</Card>
								</Link>
							) : null}
						</Stack>
					</Stack>
					<Stack>
						{!isLoading
							? Array.from({ length: 8 }, (_) => 1).map((_, idx) => (
									<Skeleton key={idx} height="120px" borderRadius={"0.375rem"} />
							  ))
							: null}
						{videos?.map((video) => (
							<>{video.id}</>
						))}
						{/* {data.map((stellar) => {
						return (
							<StellarCard key={stellar.uuid} name={stellar.name} chzzk={stellar.chzzk} youtube={stellar.youtube} />
						);
					})} */}
					</Stack>
				</Stack>
			</Box>
		</Stack>
	);
}

function SideListContainer({ children, ...props }: SideListContainerProps) {
	return (
		<Box minWidth="200px" {...props}>
			{children}
		</Box>
	);
}

function SideList({ children, ...props }: SideListProps) {
	return (
		<Stack margin="12px" marginTop="36px" {...props}>
			{children}
		</Stack>
	);
}

function StellarCard({ name, profileImage, youtube, chzzk }: StellarCardProps) {
	// const { followerCount: ytfcnt, subscriberCount: ytscnt } = youtube;
	// const { followerCount: czfcnt, subscriberCount: czscnt } = chzzk;
	const thisColor = stellarColors[name];
	const thisSymbol = stellarSymbols[name];
	return (
		<Card
			sx={{
				position: "relative",
				isolation: "isolate",
				// boxShadow: theme.shadows.md,
				bgGradient: `linear(to-br,  ${thisColor}33,${thisColor})`,
				transition: "all .3s",
				":after": {
					content: "''",
					position: "absolute",
					backgroundImage: thisSymbol,
					backgroundRepeat: "no-repeat",
					backgroundPosition: "center",
					backgroundPositionY: "center",
					backgroundSize: "30%",
					zIndex: -1,
					inset: 0,
					opacity: 0.4,
				},
				":hover": {
					boxShadow: theme.shadows.md,
					borderRadius: 0,
				},
			}}
		>
			<CardHeader padding="12px">
				<HStack>
					<Image boxSize="40px" borderRadius={"full"} src={chzzk?.profileImage || undefined} alt={`image-${name}`} />
					<Spacing size={4} />
					<Text fontSize="1.25rem" fontWeight={"bold"}>
						{name}
					</Text>
				</HStack>
			</CardHeader>
			<CardBody padding="12px">
				<Stack alignItems={"center"}></Stack>
			</CardBody>
		</Card>
	);
}

interface SideListContainerProps extends BoxProps {}
interface SideListProps extends BoxProps {}

interface StellarCardProps {
	name: string;
	profileImage?: string;
	youtube?: PlatformInfosDetail[];
	chzzk?: PlatformInfosDetail;
}

// 심볼, 오시마크, 치지직 프로필, 구독자수, 팔로워수
