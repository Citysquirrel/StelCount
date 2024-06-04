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
	Divider,
	HStack,
	IconButton,
	Link,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	SimpleGrid,
	Skeleton,
	SkeletonCircle,
	Stack,
	StackDivider,
	Tag,
	TagLabel,
	Text,
	Tooltip,
} from "@chakra-ui/react";
import { Image } from "../components/Image";
import { Fragment, useEffect, useRef, useState } from "react";
import { useConsole } from "../lib/hooks/useConsole";
import { musicDefaultSortValue, numberToLocaleString, remainingCount, remainingFromNum } from "../lib/functions/etc";
import { naver, youtube, youtube as youtubeAPI } from "../lib/functions/platforms";
import { useResponsive } from "../lib/hooks/useResponsive";
import { USER_SETTING_STORAGE, stellarGroupName } from "../lib/constant";
import { MdFilterList, MdHome, MdOpenInNew } from "react-icons/md";
import { GoKebabHorizontal } from "react-icons/go";
import { useLocalStorage } from "usehooks-ts";
import { UserSettingStorage } from "../lib/types";
import { ColorText } from "../components/Text";
import useBackgroundColor from "../lib/hooks/useBackgroundColor";

const stellarSymbols = {
	스텔라이브: "/images/symbol/symbol_stellive.svg",
	"아이리 칸나": "/images/symbol/symbol_kanna.png",
	"아야츠노 유니": "/images/symbol/symbol_yuni.png",
	"아라하시 타비": "/images/symbol/symbol_tabi.png",
	"네네코 마시로": "/images/symbol/symbol_mashiro.png",
	"시라유키 히나": "/images/symbol/symbol_hina.png",
	"아카네 리제": "/images/symbol/symbol_lize.png",
	"텐코 시부키": "",
	"하나코 나나": "",
	"아오쿠모 린": "",
	"유즈하 리코": "",
};

export function Counter() {
	const gridRef = useRef<HTMLDivElement>(null);
	const { windowWidth } = useResponsive();
	const [userSetting, setUserSetting] = useLocalStorage<UserSettingStorage>(USER_SETTING_STORAGE, {});
	const [data] = useRecoilState(stellarState);
	const [offsetY] = useRecoilState(headerOffsetState);
	const [isLoading] = useRecoilState(isLoadingState);
	const [currentUuid, setCurrentUuid] = useState("");
	// const [isFilterOn, setIsFilterOn] = useState(false);

	const currentStellar = data.find((s) => s.uuid === currentUuid);
	const currentYoutubeData = modYoutubeData(
		currentStellar?.youtubeId || "",
		currentStellar?.youtubeSubscriberCount || "",
		currentStellar?.youtubeCustomUrl || ""
	);
	const currentMusic = currentStellar && currentStellar.youtubeMusic;
	const currentColorCode = (currentStellar && "#" + currentStellar.colorCode) || undefined;
	const isUnder720 = windowWidth < 720;

	const stellive = data.filter((s) => s.group === 0);
	const mystic = data.filter((s) => s.group === 1);
	const universe = data.filter((s) => s.group === 2);
	const cliche = data.filter((s) => s.group === 3);
	const unclassified = data.filter((s) => !s.group && s.group !== 0);
	const total = [stellive, mystic, universe, cliche, unclassified];

	const gridWidth = gridRef.current?.clientWidth || 0;

	const handleClickStellar = (uuid: string) => () => {
		setCurrentUuid(uuid);
	};

	const handleSetHome = () => {
		setUserSetting((prev) => ({ ...prev, homeStellar: currentUuid }));
	};

	useEffect(() => {
		if (currentUuid === "")
			if (userSetting.homeStellar) {
				setCurrentUuid(userSetting.homeStellar);
			} else {
				if (data.length > 0) setCurrentUuid(stellive[0].uuid);
			}
	}, [data]);
	useConsole(currentStellar);
	useBackgroundColor(`${currentColorCode}aa`);

	return (
		<Stack
			direction={"row"}
			// paddingTop={`${offsetY}px`}
			// backgroundColor={`${currentColorCode}aa`}
			transition=".3s background-color"
			backgroundImage={`url(${stellarSymbols[currentStellar?.name || ""]})`}
			backgroundRepeat={"no-repeat"}
			backgroundPosition={"bottom 64px right 24px"}
			backgroundSize={"128px"}
		>
			<SideListContainer
				position="sticky"
				top={`${offsetY}px`}
				// paddingRight="12px"
				left={0}
				minWidth={isUnder720 ? "72px" : "200px"}
				width={isUnder720 ? "72px" : "200px"}
				height={`calc(100vh - ${offsetY}px)`}
				overflow="auto"
			>
				<SideList>
					{isLoading
						? Array.from({ length: 4 }, () => true).map((_, idx) => (
								<Skeleton key={idx} height="40px" borderRadius={"0.375rem"} />
						  ))
						: total.map((s, idx) => (
								<Fragment key={idx}>
									{s.length > 0 ? (
										<Tag
											colorScheme="purple"
											fontFamily={"Montserrat"}
											fontSize="md"
											fontWeight={"bold"}
											justifyContent={"center"}
											marginTop="4px"
										>
											{isUnder720 ? idx : typeof s[0].group === "number" ? stellarGroupName[idx][1] : "Unclassified"}
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
													leftIcon={
														<Image
															boxSize="24px"
															src={stellar.name === "스텔라이브" ? stellarSymbols.스텔라이브 : stellar.profileImage}
															borderRadius={"full"}
														/>
													}
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
								</Fragment>
						  ))}
				</SideList>
			</SideListContainer>
			<Box position="relative" width="100%">
				<Menu>
					<MenuButton
						as={IconButton}
						position="absolute"
						top={1}
						left={-1}
						boxSize="32px"
						size="sm"
						variant={"ghost"}
						icon={<GoKebabHorizontal />}
						aria-label="kebab-menu"
						isRound
						_hover={{ backgroundColor: "#ffffff33" }}
						zIndex={1}
					/>
					<MenuList minWidth={"4xs"} paddingBlock={"4px"}>
						<MenuItem height="28px" fontSize="0.875rem" icon={<MdHome size="1.125rem" />} onClick={handleSetHome}>
							방문시 첫화면으로
						</MenuItem>
					</MenuList>
				</Menu>

				<Stack margin="12px" marginTop="24px" marginBottom="64px" divider={<StackDivider />} spacing={"4"}>
					<Stack
						position="relative"
						direction={"row"}
						alignItems={"center"}
						spacing={"4"}
						flexWrap={"wrap"}
						backgroundImage={`url(${stellarSymbols[currentStellar?.name || ""]})`}
						backgroundRepeat={"no-repeat"}
						backgroundPosition={"top 50% right 12px"}
						backgroundSize={
							currentStellar?.name === "스텔라이브"
								? "48px"
								: currentStellar?.name === "아라하시 타비"
								? "70px"
								: "72px"
						}
					>
						<Link href={currentStellar && naver.chzzk.liveUrl(currentStellar.chzzkId)} isExternal>
							{isLoading ? (
								<SkeletonCircle boxSize="72px" />
							) : currentStellar?.chzzkId ? (
								<Avatar boxSize="72px" src={`${currentStellar?.profileImage}?type=f120_120_na` || "/images/logo.png"}>
									<AvatarBadge boxSize="28px" bg={currentStellar?.liveStatus ? "green.400" : "red.400"} />
								</Avatar>
							) : null}
						</Link>
						{currentStellar?.chzzkId ? (
							<Divider orientation="vertical" height={windowWidth <= 840 ? "128px" : "64px"} />
						) : null}
						<Stack
							direction={windowWidth <= 840 ? "column" : "row"}
							maxWidth={windowWidth <= 840 ? undefined : `${windowWidth - 240 - 72 - 80}px`}
							maxHeight="120px"
							overflow="auto"
						>
							{currentYoutubeData.map((y, idx) =>
								y.subscriberCount ? (
									<FollowerCard
										key={y.id}
										href={youtubeAPI.channelUrl(y.customUrl)}
										icon={"/images/i_youtube_1.png"}
										text={`구독자 ${numberToLocaleString(y.subscriberCount)}`}
										currentColorCode={currentColorCode}
										subText={idx === 1 ? "Music Channel" : undefined}
									/>
								) : null
							)}
							{currentStellar?.chzzkFollowerCount ? (
								<FollowerCard
									href={naver.chzzk.channelUrl(currentStellar.chzzkId)}
									icon={"/images/i_chzzk_1.png"}
									text={`팔로워 ${numberToLocaleString(currentStellar.chzzkFollowerCount)}`}
									currentColorCode={currentColorCode}
								/>
							) : null}
						</Stack>
					</Stack>
					<Stack>
						<SimpleGrid ref={gridRef} columns={[1, 1, 2, 2, 3]} spacing={"8px"} placeItems={"center"}>
							{isLoading ? (
								Array.from({ length: 8 }, (_) => 1).map((_, idx) => (
									<Skeleton key={idx} width="auto" height="120px" borderRadius={"0.375rem"} />
								))
							) : currentMusic !== undefined && currentMusic.length > 0 ? (
								currentMusic
									.filter((m) => m.type === "music")
									.sort(musicSort("default", "ASC"))
									.map((m) => (
										<MusicCard key={m.videoId} data={m} currentColorCode={currentColorCode} gridWidth={gridWidth} />
									))
							) : (
								<Stack
									alignItems={"center"}
									justifyContent={"center"}
									width={["100%", "100%", "200%", "200%", "300%"]}
									height="240px"
									userSelect={"none"}
								>
									<Text fontWeight={"bold"}>No Data</Text>
								</Stack>
							)}
						</SimpleGrid>
					</Stack>
				</Stack>
			</Box>
		</Stack>
	);
}

function FollowerCard({ href, icon, text, currentColorCode, subText }: FollowerCardProps) {
	return (
		<Link href={href} isExternal _hover={{ textDecoration: "none" }}>
			<Card
				position="relative"
				width="240px"
				variant={"outline"}
				cursor="pointer"
				transition=".3s all"
				backgroundColor="rgba(255,255,255,.9)"
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
				<Text position="absolute" bottom={0} right="8px" fontSize="0.5rem">
					<i>{subText}</i>
				</Text>
			</Card>
		</Link>
	);
}

function musicSort(type: "publishedAt" | "name" | "default", order: "ASC" | "DESC") {
	return function (a: YoutubeMusicData, b: YoutubeMusicData) {
		if (type === "default") {
			const aInt = parseInt(a.viewCount || "0");
			const bInt = parseInt(b.viewCount || "0");
			const A = musicDefaultSortValue(aInt);
			const B = musicDefaultSortValue(bInt);
			return order === "ASC" ? A - B : B - A;
		} else return order === "ASC" ? a[type] - b[type] : b[type] - a[type];
	};
}

function MusicFilter() {
	return <IconButton boxSize={"24px"} minWidth={"32px"} icon={<MdFilterList />} aria-label="filter" />;
}

function MusicCard({ data, currentColorCode, gridWidth }: MusicCardProps) {
	const {
		type,
		title,
		titleAlias,
		videoId,
		thumbnail,
		viewCount,
		likeCount,
		ownerId,
		isOriginal,
		isCollaborated,
		publishedAt,
	} = data;

	const customTagColorScheme = {
		Cover: "teal",
		Original: "red",
		Gift: "orange",
		other: "blue",
	};

	const titleText = titleAlias || title;
	const viewCountNum = parseInt(viewCount || "0");
	const [calc, dir] = remainingCount(viewCountNum);

	return (
		<Card
			position="relative"
			width={[
				`${gridWidth}px`,
				`${gridWidth}px`,
				`${gridWidth / 2 - 8}px`,
				`${gridWidth / 2 - 8}px`,
				`${gridWidth / 3 - 16}px`,
			]}
			maxWidth={"420px"}
			minHeight={"212px"}
			backgroundColor="rgba(255,255,255,.9)"
			border="1px solid transparent"
			transition="border-color .3s"
			_hover={{ borderColor: currentColorCode }}
		>
			<CardBody as={Stack} divider={<StackDivider />} display="flex" flexDirection={"column"} flexWrap={"nowrap"}>
				<HStack>
					<Stack flex={1} alignItems={"center"} justifyContent={"center"} gap="0">
						<Text fontSize={"2.25rem"} fontWeight={"bold"} lineHeight={1}>
							{numberToLocaleString(viewCount)}
						</Text>
						{calc ? (
							<Text fontSize={"0.875rem"}>
								(
								<ColorText as="span" value={dir === 1 ? "orange.500" : "green.500"}>
									{calc}
								</ColorText>
								회 {dir === 1 ? "남음" : "지남"})
							</Text>
						) : null}
					</Stack>
					<ThumbnailImage src={thumbnail} width={"116px"} height={"108px"} />
				</HStack>
				<Stack position="relative" gap="auto" flexWrap={"nowrap"} flex={1}>
					<Link href={youtube.videoUrl(videoId)} isExternal>
						<Text
							title={titleText}
							fontSize={"1.125rem"}
							whiteSpace={"nowrap"}
							textOverflow={"ellipsis"}
							overflow="hidden"
						>
							{titleText}
						</Text>
					</Link>
					<Box position="absolute" right="2px" bottom={"-4px"} textAlign={"right"}>
						{data.tags?.map((tag) => (
							<Tag key={tag.id} colorScheme={customTagColorScheme[tag.name] || customTagColorScheme.other}>
								<TagLabel>{tag.name}</TagLabel>
							</Tag>
						))}
					</Box>
				</Stack>
			</CardBody>
		</Card>
	);
}

function ThumbnailImage({ src, ...props }: ThumbnailImageProps) {
	return (
		<Stack
			marginLeft={"4px"}
			overflow={"hidden"}
			justifyContent={"center"}
			alignItems={"center"}
			borderRadius={"0.375rem"}
			{...props}
		>
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

interface FollowerCardProps {
	href: string | undefined;
	icon: string;
	text: string;
	currentColorCode: string | undefined;
	subText?: string;
}

interface MusicCardProps {
	data: YoutubeMusicData;
	currentColorCode?: string;
	gridWidth: number;
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

function hasComma(record: string) {
	return record.includes(",");
}

function divideCommaData(record: string) {
	const isCommaExist = record.includes(",");
	return isCommaExist ? record.split(",") : record;
}

function modYoutubeData(id: string, subCnt: string, url: string) {
	const storage: moddedYoutubeData[] = [];
	const idSplit = id.split(",");
	const subSplit = subCnt.split(",");
	const urlSplit = url.split(",");
	for (let idx in idSplit) {
		const temp: moddedYoutubeData = { id: idSplit[idx], subscriberCount: subSplit[idx], customUrl: urlSplit[idx] };
		storage[idx] = temp;
	}
	return storage;
}

interface moddedYoutubeData {
	id: string;
	subscriberCount: string;
	customUrl: string;
}
