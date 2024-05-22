import { useRecoilState } from "recoil";
import { PlatformInfosDetail, YoutubeMusicData, headerOffsetState, isLoadingState, stellarState } from "../lib/Atom";
import {
	Avatar,
	AvatarBadge,
	Box,
	BoxProps,
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Divider,
	HStack,
	Heading,
	IconButton,
	Link,
	SimpleGrid,
	Skeleton,
	SkeletonCircle,
	Stack,
	StackDivider,
	Tag,
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
import { numberToLocaleString, remainingFromNum } from "../lib/functions/etc";
import { naver, youtube as youtubeAPI } from "../lib/functions/platforms";
import { useResponsive } from "../lib/hooks/useResponsive";
import { stellarGroupName } from "../lib/constant";
import { MdFilter, MdFilterList, MdOpenInNew } from "react-icons/md";

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
	const [isFilterOn, setIsFilterOn] = useState(false);

	const currentStellar = data.find((s) => s.uuid === currentUuid);
	// const chzzk = currentStellar && currentStellar.chzzk;
	// const youtube = currentStellar && currentStellar.youtube;
	// const videos = currentStellar && currentStellar.videos;
	const currentMusic = currentStellar && currentStellar.youtubeMusic;
	const currentColorCode = (currentStellar && "#" + currentStellar.colorCode) || undefined;
	const isUnder720 = windowWidth < 720;

	const mystic = data.filter((s) => s.group === 1);
	const universe = data.filter((s) => s.group === 2);
	const cliche = data.filter((s) => s.group === 3);
	const unclassified = data.filter((s) => !s.group);
	const total = [mystic, universe, cliche, unclassified];

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
			backgroundPosition={"bottom 64px right 24px"}
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
						: total.map((s, idx) => (
								<>
									{s.length > 0 ? (
										<Tag
											colorScheme="purple"
											fontFamily={"Montserrat"}
											fontSize="md"
											fontWeight={"bold"}
											justifyContent={"center"}
											marginTop="4px"
										>
											{isUnder720 ? idx + 1 : s[0].group ? stellarGroupName[idx + 1][1] : "Unclassified"}
										</Tag>
									) : null}
									{s.map((stellar) => {
										return (
											<Tooltip
												key={stellar.uuid}
												label={isUnder720 ? stellar.name : undefined}
												placement="right"
												hasArrow
											>
												<Button
													variant={"outline"}
													leftIcon={<Image boxSize="24px" src={stellar.profileImage} borderRadius={"full"} />}
													colorScheme={currentUuid === stellar.uuid ? "" : "blue"}
													backgroundColor="ButtonFace"
													onClick={handleClickStellar(stellar.uuid)}
													cursor={currentUuid === stellar.uuid ? "auto" : "pointer"}
													iconSpacing={isUnder720 ? 0 : undefined}
												>
													{isUnder720 ? null : <Text>{stellar.name}</Text>}
												</Button>
											</Tooltip>
										);
									})}
								</>
						  ))}
				</SideList>
			</SideListContainer>
			<Box width="100%">
				<Stack margin="12px" marginTop="24px" marginBottom="64px" divider={<StackDivider />} spacing={"4"}>
					<Stack direction={"row"} alignItems={"center"} spacing={"4"} flexWrap={"wrap"}>
						<Link href={currentStellar && naver.chzzk.liveUrl(currentStellar.chzzkId)} isExternal>
							{isLoading ? (
								<SkeletonCircle boxSize="72px" />
							) : (
								<Avatar boxSize="72px" src={currentStellar?.profileImage || SQ}>
									<AvatarBadge boxSize="28px" bg={currentStellar?.liveStatus ? "green.400" : "red.400"} />
								</Avatar>
							)}
						</Link>
						<Divider orientation="vertical" height={windowWidth <= 840 ? "128px" : "64px"} />
						<Stack direction={windowWidth <= 840 ? "column" : "row"}>
							{currentStellar?.youtubeSubscriberCount ? (
								<FollowerCard
									href={youtubeAPI.channelUrl(currentStellar.youtubeCustomUrl)}
									icon={youtubeIcon}
									text={`구독자 ${numberToLocaleString(currentStellar.youtubeSubscriberCount)}`}
									currentColorCode={currentColorCode}
								/>
							) : null}
							{currentStellar?.chzzkFollowerCount ? (
								<FollowerCard
									href={naver.chzzk.channelUrl(currentStellar.chzzkId)}
									icon={chzzkIcon}
									text={`팔로워 ${numberToLocaleString(currentStellar.chzzkFollowerCount)}`}
									currentColorCode={currentColorCode}
								/>
							) : null}
						</Stack>
					</Stack>
					<Stack>
						<SimpleGrid columns={[1, 1, 2, 2, 3]} spacing={"8px"}>
							{isLoading ? (
								Array.from({ length: 8 }, (_) => 1).map((_, idx) => (
									<Skeleton key={idx} height="120px" borderRadius={"0.375rem"} />
								))
							) : currentMusic !== undefined && currentMusic.length > 0 ? (
								currentMusic
									.filter((m) => m.type === "music")
									.sort(musicSort("default", "ASC"))
									.map((m) => <MusicCard data={m} />)
							) : (
								<Stack alignItems={"center"} justifyContent={"center"}>
									<Text>No Data</Text>
								</Stack>
							)}
							{/* {data.map((stellar) => {
						return (
							<StellarCard key={stellar.uuid} name={stellar.name} chzzk={stellar.chzzk} youtube={stellar.youtube} />
						);
					})} */}
						</SimpleGrid>
					</Stack>
				</Stack>
			</Box>
		</Stack>
	);
}

function FollowerCard({ href, icon, text, currentColorCode }: FollowerCardProps) {
	return (
		<Link href={href} isExternal _hover={{ textDecoration: "none" }}>
			<Card
				position="relative"
				width="240px"
				variant={"outline"}
				cursor="pointer"
				transition=".3s all"
				_hover={{ borderColor: currentColorCode, ">div.follower-card--icon": { opacity: 1 } }}
			>
				<Box className="follower-card--icon" position="absolute" top={"4px"} right={"4px"} opacity={0}>
					<MdOpenInNew />
				</Box>
				<HStack divider={<StackDivider />} spacing={"4"} padding="8px" justifyContent={"space-evenly"}>
					<HStack padding="4px">
						<Image boxSize={"20px"} src={icon} />
						<Text fontSize={"1.25rem"}>{text}</Text>
					</HStack>
				</HStack>
			</Card>
		</Link>
	);
}

function musicSort(type: "publishedAt" | "name" | "default", order: "ASC" | "DESC") {
	return function (a: YoutubeMusicData, b: YoutubeMusicData) {
		if (type === "default") {
			const A = remainingFromNum(parseInt(a.viewCount || "0"), 10000);
			const B = remainingFromNum(parseInt(b.viewCount || "0"), 10000);
			return order === "ASC" ? A - B : B - A;
		} else return order === "ASC" ? a[type] - b[type] : b[type] - a[type];
	};
}

function MusicFilter() {
	return <IconButton boxSize={"24px"} minWidth={"32px"} icon={<MdFilterList />} aria-label="filter" />;
}

function MusicCard({ data }: MusicCardProps) {
	const { windowWidth } = useResponsive();
	const { type, title, videoId, thumbnail, viewCount, likeCount, ownerId, isOriginal, isCollaborated, publishedAt } =
		data;

	const sideWidth = (windowWidth < 720 ? 64 : 200) + 4;
	const calcWidth = (count: number) => (windowWidth - sideWidth - 24) / count - count * 2 * 4;
	const width = [calcWidth(1) - 8, calcWidth(1) - 12, calcWidth(2), calcWidth(2), calcWidth(3)];
	const height = width.map((w) => w * 0.5625);
	const thumbnailHeight = height.map((h) => h / 2);
	const thumbnailWidth = thumbnailHeight.map((h) => h * 1.08);
	return (
		<Card position="relative" width={width.map((v) => `${v}px`)} height={height.map((v) => `${v}px`)}>
			<CardBody>
				<ThumbnailImage
					src={thumbnail}
					width={thumbnailWidth.map((v) => `${v}px`)}
					height={thumbnailHeight.map((v) => `${v}px`)}
					float="right"
				/>
				<Text>{title}</Text>
				<Text position="absolute" bottom={"4px"} right={"12px"}>
					{viewCount}
				</Text>
			</CardBody>
		</Card>
	);
}

function ThumbnailImage({ src, ...props }: ThumbnailImageProps) {
	return (
		<Stack overflow={"hidden"} justifyContent={"center"} alignItems={"center"} borderRadius={"0.375rem"} {...props}>
			<Image src={src} objectFit={"cover"} transform="scale(2)" />
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

interface FollowerCardProps {
	href: string | undefined;
	icon: string;
	text: string;
	currentColorCode: string | undefined;
}

interface MusicCardProps {
	data: YoutubeMusicData;
}

interface ThumbnailImageProps extends BoxProps {
	src: string;
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
