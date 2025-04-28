import { useRecoilState } from "recoil";
import {
	headerOffsetState,
	isLiveLoadingState,
	isLoadingState,
	liveStatusState,
	nowState,
	stellarState,
} from "../lib/Atom";
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
	TagProps,
	TagRightIcon,
	Text,
	Tooltip,
} from "@chakra-ui/react";
import { Image } from "../components/Image";
import { Dispatch, Fragment, SetStateAction, useEffect, useRef, useState } from "react";
import {
	musicDefaultSortValue,
	numberToLocaleString,
	remainingCount,
	elapsedTimeTextForCard,
	remainingTimeText,
	getLocale,
	minus9Hs,
	sortStatsByUnit,
} from "../lib/functions/etc";
import { naver, youtube, youtube as youtubeAPI } from "../lib/functions/platforms";
import { useResponsive } from "../lib/hooks/useResponsive";
import { CAFE_WRITE_URL, MIN_DATE, USER_SETTING_STORAGE, stellarGroupName } from "../lib/constant";
import { MdCheck, MdClear, MdFilterList, MdHome, MdImage, MdOpenInNew, MdSettings, MdTag } from "react-icons/md";
import { useLocalStorage } from "usehooks-ts";
import {
	Statistics,
	Tag as TagType,
	Thumbnails,
	UserSettingStorage,
	VideoDetail,
	YoutubeMusicData,
} from "../lib/types";
import { ColorText } from "../components/Text";
import useBackgroundColor from "../lib/hooks/useBackgroundColor";
import isMobile from "is-mobile";
import { Spacing } from "../components/Spacing";
import { FaGraduationCap } from "react-icons/fa6";
import { SiYoutubemusic } from "react-icons/si";

const stellarSymbols = {
	스텔라이브: "/images/symbol/symbol_stellive.svg",
	"아이리 칸나": "/images/symbol/symbol_kanna.png",
	"아야츠노 유니": "/images/symbol/symbol_yuni.png",
	"아라하시 타비": "/images/symbol/symbol_tabi.png",
	"네네코 마시로": "/images/symbol/symbol_mashiro.png",
	"시라유키 히나": "/images/symbol/symbol_hina.png",
	"아카네 리제": "/images/symbol/symbol_lize.png",
	"텐코 시부키": "/images/symbol/symbol_shibuki.svg",
	"하나코 나나": "/images/symbol/symbol_nana.svg",
	"아오쿠모 린": "/images/symbol/symbol_rin.svg",
	"유즈하 리코": "/images/symbol/symbol_riko.svg",
};

const customTagColorScheme = {
	Cover: "teal",
	Original: "red",
	Gift: "orange",
	other: "blue",
};

export function Counter() {
	const gridRef = useRef<HTMLDivElement>(null);
	const { windowWidth } = useResponsive();
	const [userSetting, setUserSetting] = useLocalStorage<UserSettingStorage>(USER_SETTING_STORAGE, {});
	const [data] = useRecoilState(stellarState);
	const [liveStatus] = useRecoilState(liveStatusState);
	const [offsetY] = useRecoilState(headerOffsetState);
	const [isLoading] = useRecoilState(isLoadingState);
	const [isLiveLoading] = useRecoilState(isLiveLoadingState);
	const [now] = useRecoilState(nowState);
	const [currentUuid, setCurrentUuid] = useState("");
	const [filter, setFilter] = useState<Filter>({ tag: [] });
	const [sort, setSort] = useState<Sort>({
		current: [0, 0],
		sortBy: ["default", "viewCount", "publishedAt"],
		sortName: ["기본값", "조회수", "게시일"],
		direction: ["ASC", "DESC"],
	});
	const [isFilterOn, setIsFilterOn] = useState(false);
	const [isFuncLoading, setIsFuncLoading] = useState(true);

	const currentStellar = data.find((s) => s.uuid === currentUuid);
	const currentYoutubeData = modYoutubeData(
		currentStellar?.youtubeId || "",
		currentStellar?.youtubeSubscriberCount || "",
		currentStellar?.youtubeCustomUrl || ""
	);
	const currentMusic = currentStellar && currentStellar.youtubeMusic;
	const currentExistTags = dedupeTagData(currentMusic?.map((m) => m.tags).flat());

	const currentLiveStatus = liveStatus.find((l) => l.uuid === currentStellar?.uuid)?.liveStatus || false;

	const currentColorCode = (currentStellar && "#" + currentStellar.colorCode) || undefined;
	const { backgroundColor } = useBackgroundColor(!currentColorCode ? "white" : `${currentColorCode}aa`);
	const isUnder720 = windowWidth < 720;

	const stellive = data.filter((s) => s.group === 0 && !s.justLive);
	const mystic = data.filter((s) => s.group === 1 && !s.justLive);
	const universe = data.filter((s) => s.group === 2 && !s.justLive);
	const cliche = data.filter((s) => s.group === 3 && !s.justLive);
	const unclassified = data.filter((s) => !s.group && s.group !== 0 && !s.justLive);
	const total = [stellive, mystic, universe, cliche, unclassified];

	const gridWidth = gridRef.current?.clientWidth || 0;
	const imageHeightOffset = 4;
	const cardWidth = [
		`${gridWidth}px`,
		`${gridWidth}px`,
		`${gridWidth / 2 - 8}px`,
		`${gridWidth / 2 - 8}px`,
		`${gridWidth / 3 - 16}px`,
	];
	const thumbWidth = ["108px", "108px", `${(gridWidth / 2 - 8) / imageHeightOffset}px`, "108px", "108px"];

	const handleClickStellar = (uuid: string) => () => {
		setFilter((prev) => {
			const obj = { ...prev };
			obj.tag = [];
			return obj;
		});
		setCurrentUuid(uuid);
	};

	const handleSetHome = () => {
		setUserSetting((prev) => ({ ...prev, homeStellar: currentUuid }));
	};

	const handleTagFilter = (tagId: number) => () => {
		setFilter((prev) => ({
			...prev,
			tag: prev.tag.includes(tagId)
				? prev.tag.filter((id) => id !== tagId) // 태그 제거
				: [...prev.tag, tagId], // 태그 추가
		}));

		// setFilter((prev) => {
		// 	const obj = { ...prev };
		// 	const tags = [...obj.tag];
		// 	if (tags.includes(tagId)) {
		// 		tags.splice(tags.indexOf(tagId), 1);
		// 	} else {
		// 		tags.push(tagId);
		// 	}
		// 	obj.tag = tags;
		// 	return obj;
		// });
	};

	const handleResetFilter = (key: keyof Filter) => () => {
		setFilter((prev) => {
			const obj = { ...prev };
			obj[key] = [];
			return obj;
		});
	};

	const handleSort = (key: "sortBy" | "direction") => () => {
		if (key === "sortBy") {
			setSort((prev) => {
				const obj = { ...prev };
				const cur = obj.current;
				cur[0] = cur[0] + 1 === obj.sortBy.length ? 0 : cur[0] + 1;
				setUserSetting((prevUS) => {
					const objUS = { ...prevUS, sortBy: cur[0] };
					return objUS;
				});
				return obj;
			});
		} else if (key === "direction") {
			setSort((prev) => {
				const obj = { ...prev };
				const cur = obj.current;
				cur[1] = cur[1] + 1 === obj.direction.length ? 0 : cur[1] + 1;
				setUserSetting((prevUS) => {
					const objUS = { ...prevUS, sortDirection: cur[1] };
					return objUS;
				});
				return obj;
			});
		}
	};

	useEffect(() => {
		if (userSetting.isFilterOn) {
			if (userSetting.isFilterOn === "true") setIsFilterOn(true);
			else setIsFilterOn(false);
		}

		setSort((prev) => {
			const obj = { ...prev };
			obj.current = [userSetting.sortBy || 0, userSetting.sortDirection || 0];
			return obj;
		});

		if (currentUuid === "")
			if (userSetting.homeStellar) {
				setCurrentUuid(userSetting.homeStellar);
			} else {
				if (data.length > 0) setCurrentUuid(stellive[0].uuid);
			}
	}, [data]);

	const musics =
		currentMusic
			?.filter((m) => m.type === "music")
			.sort(musicSort(sort.sortBy[sort.current[0]], sort.direction[sort.current[1]]))
			.filter(tagFilterFunc(filter.tag)) || [];

	useEffect(() => {
		setIsFuncLoading(false);
	}, [musics]);

	return (
		<Stack
			direction={isMobile() ? "column-reverse" : "row"}
			transition=".3s background-color"
			backgroundImage={`url(${stellarSymbols[currentStellar?.name || ""]})`}
			backgroundRepeat={"no-repeat"}
			backgroundPosition={"bottom 64px right 24px"}
			backgroundSize={"128px"}
		>
			<SideListContainer
				position="sticky"
				top={isMobile() ? undefined : `${offsetY}px`}
				bottom={isMobile() ? 0 : undefined}
				left={0}
				minWidth={isMobile() ? "100%" : isUnder720 ? "72px" : "200px"}
				width={isMobile() ? "100%" : isUnder720 ? "72px" : "200px"}
				height={isMobile() ? "72px" : `calc(100vh - ${offsetY}px)`}
				overflow="auto"
				backgroundColor={backgroundColor}
				zIndex={97}
				transition={"background-color .3s"}
			>
				<SideList flexDirection={isMobile() ? "row" : "column"}>
					{isLoading
						? Array.from({ length: 4 }, () => true).map((_, idx) => (
								<Skeleton key={idx} height="40px" borderRadius={"0.375rem"} />
						  ))
						: total.map((s, idx) => (
								<Fragment key={idx}>
									{s.length > 0 ? (
										<Tag
											colorScheme="purple"
											fontSize="sm"
											fontWeight={"bold"}
											justifyContent={"center"}
											marginTop="4px"
										>
											{isUnder720 || isMobile()
												? idx
												: typeof s[0].group === "number"
												? stellarGroupName[idx][1]
												: "Unclassified"}
										</Tag>
									) : null}
									{s.map((stellar) => {
										const graduated =
											stellar.graduation && new Date(stellar.graduation.slice(0, -1)).getTime() < now.getTime();
										return (
											<Tooltip
												key={stellar.uuid}
												label={isMobile() ? undefined : isUnder720 ? stellar.name : undefined}
												placement="right"
												hasArrow
											>
												<Button
													position="relative"
													variant={"outline"}
													leftIcon={
														<Image
															boxSize="24px"
															src={stellar.name === "스텔라이브" ? stellarSymbols.스텔라이브 : stellar.profileImage}
															borderRadius={"full"}
														/>
													}
													colorScheme={currentUuid === stellar.uuid ? "" : graduated ? "green" : "blue"}
													backgroundColor="ButtonFace"
													onClick={handleClickStellar(stellar.uuid)}
													cursor={currentUuid === stellar.uuid ? "auto" : "pointer"}
													iconSpacing={isUnder720 || isMobile() ? 0 : undefined}
													boxSize={isMobile() ? "40px" : undefined}
												>
													{graduated ? (
														<Text position="absolute" left={"4px"} top="2px" color="black">
															<FaGraduationCap />
														</Text>
													) : null}

													{isUnder720 || isMobile() ? null : <Text>{stellar.name}</Text>}
												</Button>
											</Tooltip>
										);
									})}
								</Fragment>
						  ))}
					{isMobile() ? <Spacing size={8} direction="horizontal" /> : null}
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
						icon={<MdSettings />}
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
							{isLoading || isFuncLoading ? (
								<SkeletonCircle boxSize="72px" />
							) : currentStellar?.chzzkId ? (
								<Avatar boxSize="72px" src={`${currentStellar?.profileImage}?type=f120_120_na` || "/images/logo.png"}>
									<AvatarBadge
										boxSize="28px"
										bg={isLiveLoading ? "orange.400" : currentLiveStatus ? "green.400" : "red.400"}
									/>
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
							{isLoading || isFuncLoading ? (
								Array.from({ length: 2 }, (_) => 1).map((_, idx) => (
									<Skeleton key={idx} width={"240px"} height="54px" borderRadius={"0.375rem"} />
								))
							) : (
								<>
									{currentYoutubeData.map((y, idx) =>
										y.subscriberCount ? (
											<FollowerCard
												key={y.id}
												href={youtubeAPI.channelUrl(y.customUrl) || youtubeAPI.channelUrlByYoutubeId(y.id)}
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
								</>
							)}
						</Stack>
					</Stack>
					<Stack>
						<HStack alignItems={"flex-start"}>
							{/* 솔팅 컴포넌트 시작 */}
							<HStack>
								{isLoading ? null : (
									<>
										<Tooltip label="정렬 기준">
											<Button onClick={handleSort("sortBy")} height="24px" fontSize={"sm"} padding="0 8px">
												{sort.sortName[sort.current[0]]}
											</Button>
										</Tooltip>
										<Tooltip label="정렬 방향">
											<Button onClick={handleSort("direction")} height="24px" fontSize={"sm"} padding="0 8px">
												{sort.current[1] === 0
													? sort.current[0] === 2
														? "과거"
														: "오름"
													: sort.current[0] === 2
													? "최신"
													: "내림"}
											</Button>
										</Tooltip>
									</>
								)}
							</HStack>
							{/* 필터링 컴포넌트 시작 */}
							{currentExistTags.length > 0 ? (
								<Stack
									bg="rgba(245,245,245)"
									borderRadius={"0.375rem"}
									width={isFilterOn ? "100%" : "24px"}
									height={isFilterOn ? `auto` : "24px"}
									overflow="hidden"
									gap="2px"
								>
									<IconButton
										onClick={() => {
											setIsFilterOn((prev) => {
												setUserSetting((prevSetting) => ({ ...prevSetting, isFilterOn: String(!prev) }));
												return !prev;
											});
										}}
										boxSize="24px"
										minHeight="24px"
										minW={0}
										icon={isFilterOn ? <MdClear /> : <MdFilterList />}
										aria-label="filterButton"
									/>
									<HStack bg="rgba(245,245,245)" padding="4px" borderRadius={"0.375rem"} gap="2px" flexWrap={"wrap"}>
										<IconButton
											colorScheme="blackAlpha"
											variant={filter.tag.length > 0 ? "solid" : "ghost"}
											boxSize="24px"
											minHeight={"24px"}
											icon={filter.tag.length > 0 ? <MdClear /> : <MdTag />}
											minW={0}
											aria-label="clear-tag-filter"
											onClick={handleResetFilter("tag")}
										/>

										<Spacing direction="horizontal" size={4} />
										{currentExistTags.map((t, idx) => (
											<FilterTag
												key={`${t.id}-${idx}`}
												tagId={t.id}
												name={t.name}
												color={t.colorCode}
												tagFilter={filter.tag}
												onClick={handleTagFilter(t.id)}
												minWidth="76px"
												height="24px"
												wordBreak={"keep-all"}
											>
												{t.name}
											</FilterTag>
										))}
									</HStack>
								</Stack>
							) : null}
						</HStack>
						<SimpleGrid
							ref={gridRef}
							columns={(musics !== undefined && musics.length > 0) || isLoading || isFuncLoading ? [1, 1, 2, 2, 3] : 1}
							spacing={"8px"}
							placeItems={"center"}
						>
							{isLoading || isFuncLoading ? (
								Array.from({ length: 3 }, (_) => 1).map((_, idx) => (
									<Skeleton key={idx} width={cardWidth} height="212px" borderRadius={"0.375rem"} />
								))
							) : musics !== undefined && musics.length > 0 ? (
								musics.map((m) => (
									<MusicCard
										key={m.videoId}
										data={m}
										currentColorCode={currentColorCode}
										width={cardWidth}
										thumbWidth={thumbWidth}
										now={now}
									/>
								))
							) : (
								<Stack
									alignItems={"center"}
									justifyContent={"center"}
									width={["100%", "100%", "200%", "200%", "300%"]}
									height="240px"
									userSelect={"none"}
									gap={0}
								>
									<NoDataImage color="#444" />
									<Text fontSize="1.25rem" fontWeight={"bold"} color="#444">
										데이터가 없습니다
									</Text>
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

function musicSort(type: "publishedAt" | "viewCount" | "default", order: "ASC" | "DESC") {
	return function (a: YoutubeMusicData, b: YoutubeMusicData) {
		if (a.liveBroadcastContent === "upcoming") return -1;
		if (type === "default") {
			const aInt = parseInt(a.viewCount || "0");
			const bInt = parseInt(b.viewCount || "0");
			const A = musicDefaultSortValue(aInt);
			const B = musicDefaultSortValue(bInt);
			return order === "ASC" ? A - B : B - A;
		} else if (type === "publishedAt") {
			const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
			const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
			return order === "ASC" ? aDate - bDate : bDate - aDate;
		} else if (type === "viewCount") {
			const aCnt = a.viewCount ? parseInt(a.viewCount) : 0;
			const bCnt = b.viewCount ? parseInt(b.viewCount) : 0;
			return order === "ASC" ? aCnt - bCnt : bCnt - aCnt;
		} else return 0;
	};
}

function FilterTag({ tagId, name, color, tagFilter, children, ...props }: FilterTagProps) {
	const defaultColorScheme = customTagColorScheme[name] || customTagColorScheme.other;
	const isIncluded = tagFilter.includes(tagId);

	return (
		// outline
		<Tag
			variant={!isIncluded ? "outline" : "solid"}
			colorScheme={color || defaultColorScheme}
			cursor="pointer"
			{...props}
		>
			{children}
			{!isIncluded ? <TagRightIcon as={MdClear} color="red.400" /> : <TagRightIcon as={MdCheck} color="green.300" />}
		</Tag>
	);
}

// function MusicFilter() {
// 	return <IconButton boxSize={"24px"} minWidth={"32px"} icon={<MdFilterList />} aria-label="filter" />;
// }

function MusicCard({ data, currentColorCode, width, thumbWidth, now }: MusicCardProps) {
	const [dateHover, setDateHover] = useState(false);
	const {
		type,
		title,
		titleAlias,
		videoId,
		thumbnail,
		thumbnails,
		viewCount,
		likeCount,
		ownerId,
		isOriginal,
		isCollaborated,
		publishedAt,
		liveBroadcastContent,
		scheduledStartTime,
		details,
		mostPopular,
		countUpdatedAt,
		statistics,
	} = data;

	const isLive = liveBroadcastContent === "live";

	const isUpcoming = liveBroadcastContent === "upcoming";
	const scheduledStartTimeDate = new Date(scheduledStartTime || "1000-01-01T09:00:00.000Z");
	const [remainingDateGap, remainingDateText] = remainingTimeText(scheduledStartTimeDate, now);
	const upcomingCardBg = `linear-gradient(217deg, rgba(93, 57, 255, 0.8), rgba(255,0,0,0) 70.71%),
            linear-gradient(127deg, rgba(209, 57, 255, 0.8), rgba(0,255,0,0) 70.71%),
            linear-gradient(336deg, rgba(155, 142, 255, 0.8), rgba(0,0,255,0) 70.71%)`;

	const publishedDate = new Date(publishedAt || "1000-01-01T09:00:00.000Z");
	const [dateGap, elapsedDateText] = elapsedTimeTextForCard(publishedDate, now);
	const isPlzInterest = !isUpcoming && Math.floor(dateGap / 86400) <= 14;

	const titleText = titleAlias || title;
	const viewCountNum = parseInt(viewCount || "0");
	const [calc, dir] = remainingCount(viewCountNum);
	// const parsed: Thumbnails = JSON.parse(thumbnails);
	// const maxresUrl = parsed.maxres.url;

	const handleMouseEnter = () => {};

	const handleMouseLeave = () => {};

	const handleMouseMove = () => {};

	// const handleClickMaxresThumbnail = () => {
	// 	window.open(maxresUrl!, "_blank");
	// };

	return (
		<Card
			position="relative"
			width={width}
			maxWidth={"420px"}
			minHeight={"212px"}
			backgroundColor={
				isUpcoming
					? undefined
					: isPlzInterest
					? "rgba(255,235,235,.9)"
					: dir === 1
					? "rgba(255,255,255,.9)"
					: "rgba(235,255,235,.9)"
			}
			background={isUpcoming ? upcomingCardBg : undefined}
			border="1px solid transparent"
			transition="border-color .3s"
			_hover={{ borderColor: currentColorCode }}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onMouseMove={handleMouseMove}
		>
			{/* {maxresUrl ? (
				<Stack position="absolute" top={"4px"} right={"4px"}>
					<IconButton icon={<MdImage />} aria-label="link-maxres-thumbnail" onClick={handleClickMaxresThumbnail} />
				</Stack>
			) : null} */}

			{false ? (
				<Button
					as={Link}
					variant={"ghost"}
					size="xs"
					position="absolute"
					left={1}
					top={1}
					href={CAFE_WRITE_URL}
					isExternal
				>
					축하 글쓰기
					<MdOpenInNew />
				</Button>
			) : null}
			<Text
				position="absolute"
				top={"6px"}
				right={"6px"}
				as={Link}
				href={youtube.musicUrl(videoId)}
				isExternal
				color="red.500"
			>
				<SiYoutubemusic />
			</Text>
			<HStack position="absolute" top={"4px"} left={"4px"} gap={"4px"} userSelect={"none"} zIndex={1}>
				{isUpcoming ? null : (
					<Tag
						display={elapsedDateText === "" ? "none" : "inline-flex"}
						colorScheme="blackAlpha"
						backgroundColor={dateHover ? "gray.300" : undefined}
						transition="all .3s"
						onMouseEnter={() => {
							setDateHover(true);
						}}
						onMouseLeave={() => {
							setDateHover(false);
						}}
					>
						{dateHover ? publishedDate.toLocaleString() : elapsedDateText}
					</Tag>
				)}

				{isPlzInterest || isUpcoming ? (
					<Tag colorScheme="red" outline="1px solid red">
						많관부!🥰
					</Tag>
				) : null}
			</HStack>
			{mostPopular !== -1 ? (
				<Text position="absolute" color="gray.600" fontSize="xs" right={"8px"} top={"2px"}>
					인기 급상승 음악 #{mostPopular}
				</Text>
			) : null}
			<CardBody
				as={Stack}
				divider={<StackDivider />}
				display="flex"
				flexDirection={"column"}
				flexWrap={"nowrap"}
				paddingBottom={"12px"}
				minHeight="225.6px"
			>
				<HStack flex={1} flexBasis={"117px"}>
					{isLive ? (
						<Stack position="relative" flex="1" alignItems={"center"} gap="0" minHeight="100%" height="100%">
							<Stack flex={1} alignItems={"center"} justifyContent={"center"} height="125.8px" gap="0">
								<ColorText as="span" value={"cyan.400"} fontSize="0.925rem" fontWeight={500}>
									최초공개
								</ColorText>
								<Text fontSize={"2.25rem"} fontWeight={"bold"} lineHeight={1}>
									{remainingDateGap < 0 ? "진행중" : remainingDateText}
								</Text>
							</Stack>
						</Stack>
					) : isUpcoming ? (
						<Stack position="relative" flex="1" alignItems={"center"} gap="0" minHeight="100%" height="100%">
							<Stack flex={1} alignItems={"center"} justifyContent={"center"} height="125.8px" gap="0">
								<ColorText as="span" value={"cyan.400"} fontSize="0.925rem" fontWeight={500}>
									최초공개
								</ColorText>
								<Text fontSize={"2.25rem"} fontWeight={"bold"} lineHeight={1}>
									{remainingDateGap <= 0 ? "곧 시작" : remainingDateText}
								</Text>
							</Stack>
						</Stack>
					) : (
						<ViewCount
							viewCount={viewCount}
							videoId={videoId}
							calc={calc}
							dir={dir}
							details={details}
							statistics={statistics}
						/>
					)}

					<ThumbnailImage
						src={thumbnail}
						width={"116px"}
						height={thumbWidth}
						maxHeight="108px"
						display={width.map((w) => (parseInt(w) < 292 ? "none" : "flex"))}
					/>
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
					<Box textAlign={"right"}>
						{data.tags?.map((tag) => (
							<Tag
								key={tag.id}
								colorScheme={tag.colorCode || customTagColorScheme[tag.name] || customTagColorScheme.other}
								marginLeft="2px"
							>
								<TagLabel>{tag.name}</TagLabel>
							</Tag>
						))}
					</Box>
				</Stack>
			</CardBody>
		</Card>
	);
}

function ViewCount({ viewCount, videoId, calc, dir, details, statistics }: ViewCountProps) {
	const carouselRef = useRef<HTMLDivElement>(null);
	const [currentPage, setCurrentPage] = useState(1);
	const isDetailExist = details.length > 0;
	const data = [
		{
			viewCount,
			videoId,
			calc,
			dir,
			totalCount: details.reduce((a, c) => a + parseInt(c.viewCount), 0) + parseInt(viewCount || "0"),
			type: undefined,
			annieAt: statistics.filter((s) => sortStatsByUnit(s.unit)).at(-1)?.annie_at,
			statistics,
		},
		...details.map((v) => {
			const viewCountNum = parseInt(v.viewCount || "0");
			const [calc, dir] = remainingCount(viewCountNum);

			return {
				viewCount: v.viewCount,
				videoId: v.videoId,
				calc,
				dir,
				totalCount: undefined,
				type: v.type,
				countUpdatedAt: v.countUpdatedAt,
				annieAt: statistics.filter((s) => sortStatsByUnit(s.unit)).at(-1)?.annie_at,
				statistics: v.statistics,
			};
		}),
	];
	const FETCHING_TEXT = "정보 수집중";
	// const carouselTop = (carouselRef.current && carouselRef.current.scrollTop) || 0;
	const carouselHeight = (carouselRef.current && carouselRef.current.clientHeight) || 125.8;
	const carouselScrollByPage = (page: number) => {
		setCurrentPage(page);
		carouselRef.current && carouselRef.current.scrollTo({ behavior: "smooth", top: carouselHeight * (page - 1) });
	};
	// const carouselScroll = (dir: "up" | "down") => {
	// 	const top = dir === "down" ? carouselTop + carouselHeight : carouselTop - carouselHeight;
	// 	carouselRef.current && carouselRef.current.scrollTo({ behavior: "smooth", top });
	// };

	const handlePage = (page: number) => () => {
		carouselScrollByPage(page);
	};

	useEffect(() => {
		if (isDetailExist) carouselScrollByPage(1);
	}, []);

	return isDetailExist ? (
		<Stack position="relative" flex="1" alignItems={"center"} gap="0" minHeight="100%" height="100%">
			{/* {carouselRef.current && carouselRef.current.scrollTop > 10 ? (
				<Stack position="absolute" top={0} left={0} width="100%" alignItems={"center"}>
					<IconButton
						onClick={() => {
							carouselScroll("up");
						}}
						icon={<MdKeyboardDoubleArrowUp />}
						boxSize="32px"
						minWidth="0"
						aria-label="carousel-up"
					/>
				</Stack>
			) : null} */}
			<Stack position="absolute" top={"35%"} left={"-8px"} gap="2px">
				{data.map((_, i) => (
					<Stack
						key={i}
						boxSize="16px"
						alignItems={"center"}
						justifyContent={"center"}
						cursor={"pointer"}
						onClick={handlePage(i + 1)}
					>
						<Box
							boxSize="8px"
							borderRadius={"100%"}
							backgroundColor={currentPage === i + 1 ? "blue.700" : "blue.300"}
							cursor={"pointer"}
							transition="background-color .3s"
						/>
					</Stack>
				))}
			</Stack>

			<Stack ref={carouselRef} overflowY={"hidden"} height="125.8px" minWidth="100%" gap={0}>
				{data.map((c, i) => (
					<Stack key={i} alignItems={"center"} justifyContent={"center"} gap="0" minHeight="100%" minWidth="100%">
						<Text as={Link} href={youtube.videoUrl(c.videoId)} fontSize={"0.75rem"} color="gray.600" isExternal>
							<ColorText as="span" value={"blue.600"}>
								{c.type || "Main"}
							</ColorText>
						</Text>
						<Text fontSize={"2.25rem"} fontWeight={"bold"} lineHeight={1} color={!c.viewCount ? "gray.600" : undefined}>
							{numberToLocaleString(c.viewCount) || FETCHING_TEXT}
						</Text>
						{c.calc ? (
							<Text fontSize={"0.875rem"}>
								(
								{c.dir === 1 ? (
									<>
										<ColorText as="span" value={"orange.500"}>
											{c.calc}
										</ColorText>
										회 남음
									</>
								) : (
									<>
										<ColorText as="span" value="green.500">
											{
												elapsedTimeTextForCard(
													new Date(c.statistics.at(-1)?.createdAt || MIN_DATE),
													new Date(getLocale())
												)[1]
											}
										</ColorText>
										&nbsp;
										<Text as="span" fontSize="0.75rem">
											<ColorText as="span" value="teal.500">
												{numberToLocaleString(c.statistics.at(-1)?.unit)}
											</ColorText>
											&nbsp;달성
										</Text>
									</>
								)}
								)
							</Text>
						) : null}
						{c.totalCount && c.totalCount !== parseInt(c.viewCount || "0") ? (
							<Text fontSize={"0.75rem"} color="gray.600">
								총합&nbsp;
								<ColorText as="span" value={"blue.600"}>
									{numberToLocaleString(String(c.totalCount))}
								</ColorText>
								&nbsp; 회
							</Text>
						) : null}
					</Stack>
				))}
			</Stack>
		</Stack>
	) : (
		<Stack flex={1} alignItems={"center"} justifyContent={"center"} height="125.8px" gap="0">
			<Text fontSize={"2.25rem"} fontWeight={"bold"} lineHeight={1}>
				{viewCount ? numberToLocaleString(viewCount) : FETCHING_TEXT}
			</Text>
			{calc ? (
				<Text fontSize={"0.875rem"}>
					(
					{dir === 1 ? (
						<>
							<ColorText as="span" value={"orange.500"}>
								{calc}
							</ColorText>
							회 남음
						</>
					) : (
						<>
							<ColorText as="span" value="green.500">
								{elapsedTimeTextForCard(new Date(statistics.at(-1)?.createdAt || MIN_DATE), new Date(getLocale()))[1]}
							</ColorText>
							&nbsp;
							<Text as="span" fontSize="0.75rem">
								<ColorText as="span" value="teal.500">
									{numberToLocaleString(statistics.at(-1)?.unit)}
								</ColorText>
								&nbsp;달성
							</Text>
						</>
					)}
					)
				</Text>
			) : null}
		</Stack>
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
		<Stack margin="12px" marginTop={isMobile() ? undefined : "16px"} {...props}>
			{children}
		</Stack>
	);
}

//? local functions

// function hasComma(record: string) {
// 	return record.includes(",");
// }

// function divideCommaData(record: string) {
// 	const isCommaExist = record.includes(",");
// 	return isCommaExist ? record.split(",") : record;
// }

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

function dedupeTagData(tags: (TagType | undefined)[] | undefined) {
	if (!tags) {
		return [];
	}
	return tags.reduce((acc, cur) => {
		if (cur === undefined) return acc;
		if (acc.findIndex(({ id }) => id === cur.id) === -1) {
			acc.push(cur);
		}
		return acc;
	}, [] as TagType[]);
}

function tagFilterFunc(includedTagIds: number[]) {
	// const result: YoutubeMusicData[] = [];
	return function (value: YoutubeMusicData): boolean {
		const tagIds = value.tags?.map((t) => t.id) || [];
		return includedTagIds.length === 0 ? true : tagIds.some((id) => includedTagIds.includes(id));
	};
}

function NoDataImage({ ...props }) {
	return (
		<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
			<rect x="31" y="52" width="138" height="96" rx="10" stroke="currentColor" strokeWidth="4" />
			<path
				d="M74 74L126 126M126 74L74 126"
				stroke="currentColor"
				strokeWidth="8"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

interface moddedYoutubeData {
	id: string;
	subscriberCount: string;
	customUrl: string;
}

interface FilterTagProps extends TagProps {
	tagId: number;
	name: string;
	color?: string;
	tagFilter: number[];
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
	width: string[];
	thumbWidth: string[];
	now: Date;
}

interface ViewCountProps {
	viewCount?: string;
	videoId: string;
	calc: number;
	dir: number;
	details: VideoDetail[];
	statistics: Statistics[];
}

interface ThumbnailImageProps extends BoxProps {
	src: string;
}

interface SideListContainerProps extends BoxProps {}
interface SideListProps extends BoxProps {}

interface Filter {
	tag: number[];
}

interface Sort {
	current: number[];
	sortBy: ("default" | "viewCount" | "publishedAt")[];
	sortName: string[];
	direction: ("ASC" | "DESC")[];
}
