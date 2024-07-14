import {
	Box,
	Button,
	Collapse,
	HStack,
	Heading,
	IconButton,
	Input,
	InputGroup,
	InputLeftAddon,
	Link,
	Skeleton,
	SkeletonText,
	Stack,
	Text,
	Tooltip,
	useClipboard,
	useToast,
} from "@chakra-ui/react";
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import useBackgroundColor from "../lib/hooks/useBackgroundColor";
import { useRecoilState } from "recoil";
import {
	LiveStatusState,
	isLiveDetailFetchingState,
	isLiveFetchingState,
	isLiveLoadingState,
	liveStatusState,
	nowState,
	stellarState,
} from "../lib/Atom";
import { UserSettingStorage, YoutubeMusicData } from "../lib/types";
import { LoadingCircle, LoadingThreeDot } from "../components/Loading";
import {
	elapsedTimeTextForCard,
	getLocale,
	getThumbnails,
	numberToLocaleString,
	remainingTimeText,
	sortStatsByUnit,
	sortStatsByUnitForBigNews,
} from "../lib/functions/etc";
import { Image } from "../components/Image";
import { naver, youtube } from "../lib/functions/platforms";
import { FaEye } from "react-icons/fa6";
import isMobile from "is-mobile";
import { MdClear, MdContentCopy, MdOpenInNew } from "react-icons/md";
import { FaArrowAltCircleDown } from "react-icons/fa";
import { Spacing } from "../components/Spacing";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import update from "immutability-helper";
import { MIN_DATE, USER_SETTING_STORAGE } from "../lib/constant";
import { useConsoleAdmin } from "../lib/hooks/useConsole";
import { useResponsive } from "../lib/hooks/useResponsive";
import { useLocalStorage } from "usehooks-ts";

export default function Home() {
	useBackgroundColor("white");
	const [stellar] = useRecoilState(stellarState);
	const [liveStatus] = useRecoilState(liveStatusState);
	const [isLiveLoading] = useRecoilState(isLiveLoadingState);
	const [isLiveFetching] = useRecoilState(isLiveFetchingState);
	const [now] = useRecoilState(nowState);

	const [isNewsLoading, setIsNewsLoading] = useState(true);
	const [data, setData] = useState<Data>({
		upcoming: [],
		mostPopular: [],
		mostPopularMusic: [],
		recent: [],
		approach: [],
		approachForNews: [],
		mostViews: [],
		isUpdated: false,
	});
	const [liveData, setLiveData] = useState<LiveData[]>([]);

	const isDataLoading = !data.isUpdated;

	//! 이것도 삭제될 예정
	const arr =
		data.upcoming.length > 0
			? data.upcoming
			: data.mostPopular.length > 0
			? data.mostPopular
			: data.recent.length > 0
			? data.recent
			: data.approach.length > 0
			? data.approach
			: data.mostViews;

	//! 이것도 미사용
	const condition =
		data.upcoming.length > 0
			? -1
			: data.mostPopular.length > 0
			? 0
			: data.recent.length > 0
			? 1
			: data.approach.length > 0
			? 2
			: 3;

	//! firstMusic is DEPRECATED
	const firstMusic: YoutubeMusicData = !isNewsLoading
		? arr[0]
		: {
				title: "",
				titleAlias: "",
				channelId: "",
				thumbnail: "",
				thumbnails: "",
				videoId: "",
				mostPopular: -1,
				mostPopularMusic: -1,
				details: [],
				statistics: [],
		  };

	useEffect(() => {
		if (arr[0]) setIsNewsLoading(false);
	}, [arr]);

	useEffect(() => {
		// 인급음 > 최근 게시영상 > 최근 이벤트 달성 > 최다 조회수
		const videos = stellar.map((s) => s.youtubeMusic).flat();

		setData((prev) => {
			const obj = { ...prev };

			const approachTemp = videos.reduce(
				(a, c) =>
					c.details.length > 0
						? [
								...a,
								c,
								...c.details.map((d) => ({
									...d,
									title: c.title,
									titleAlias: c.titleAlias,
									channelId: c.channelId,
									thumbnail: c.thumbnail,
									thumbnails: c.thumbnails,
									mostPopular: c.mostPopular,
									mostPopularMusic: c.mostPopularMusic,
									liveBroadcastContent: c.liveBroadcastContent,
									details: [],
								})),
						  ]
						: [...a, c],
				[] as YoutubeMusicData[]
			);

			obj.upcoming = videos
				.filter((v) => v.liveBroadcastContent === "upcoming" || v.liveBroadcastContent === "live")
				.sort(
					(a, b) =>
						new Date(a.scheduledStartTime || MIN_DATE).getTime() - new Date(b.scheduledStartTime || MIN_DATE).getTime()
				);
			obj.mostPopular = videos.filter((v) => v.mostPopular !== -1).sort((a, b) => a.mostPopular - b.mostPopular);
			obj.mostPopularMusic = videos
				.filter((v) => v.mostPopularMusic !== -1)
				.sort((a, b) => a.mostPopularMusic - b.mostPopularMusic);
			obj.recent = videos
				.filter(
					(v) =>
						v.liveBroadcastContent === "none" &&
						new Date(getLocale()).getTime() - new Date(v.publishedAt || MIN_DATE).getTime() < 5184000000 // 2 months
				)
				.sort(
					(a, b) =>
						(b.publishedAt ? new Date(b.publishedAt).getTime() : 0) -
						(a.publishedAt ? new Date(a.publishedAt).getTime() : 0)
				);
			obj.mostViews = videos
				.sort((a, b) => {
					const A =
						parseInt(a.viewCount || "0") +
						a.statistics.reduce((a, c) => (a + c.type === "viewCount" ? parseInt(c.value) : 0), 0);
					const B =
						parseInt(b.viewCount || "0") +
						b.statistics.reduce((a, c) => (a + c.type === "viewCount" ? parseInt(c.value) : 0), 0);
					return B - A;
				})
				.slice(0, 30);
			obj.approach = approachTemp
				.map((v) => ({ ...v, statistics: v.statistics.filter((s) => sortStatsByUnit(s.unit)) }))
				.filter(
					(v) =>
						v.liveBroadcastContent === "none" &&
						v.statistics.filter(
							(s) => new Date(getLocale()).getTime() - new Date(s.updatedAt || MIN_DATE).getTime() < 86400000 * 5 // 5 days
						).length > 0
				)
				.sort((a, b) => {
					return (
						new Date(b.statistics.at(-1)?.updatedAt || new Date(getLocale())).getTime() -
						new Date(a.statistics.at(-1)?.updatedAt || new Date(getLocale())).getTime()
					);
				})
				.slice(0, 100);
			obj.approachForNews = approachTemp
				.map((v) => ({ ...v, statistics: v.statistics.filter((s) => sortStatsByUnitForBigNews(s.unit)) }))
				.filter(
					(v) =>
						v.liveBroadcastContent === "none" &&
						v.statistics.filter(
							(s) => new Date(getLocale()).getTime() - new Date(s.updatedAt || MIN_DATE).getTime() < 86400000 * 5 // 5 days
						).length > 0
				)
				.sort((a, b) => {
					return (
						new Date(b.statistics.at(-1)?.updatedAt || new Date(getLocale())).getTime() -
						new Date(a.statistics.at(-1)?.updatedAt || new Date(getLocale())).getTime()
					);
				})
				.slice(0, 3);
			obj.isUpdated = true;
			return obj;
		});
	}, [stellar]);

	useConsoleAdmin(data.approach, "Approached");
	useConsoleAdmin(data, "Whole Data");

	useEffect(() => {
		const arr = liveStatus.map((l) => ({
			...l,
			profileImage: stellar.find((s) => s.uuid === l.uuid)?.profileImage || "",
			name: stellar.find((s) => s.uuid === l.uuid)?.name || "",
			gap: l.liveStatus
				? elapsedTimeTextForCard(new Date(l.openDate!), new Date(getLocale()))
				: elapsedTimeTextForCard(new Date(l.closeDate!), new Date(getLocale())),
		}));
		const openArr = arr.filter((a) => a.liveStatus).sort((a, b) => a.gap[0] - b.gap[0]);
		const closeArr = arr.filter((a) => !a.liveStatus).sort((a, b) => a.gap[0] - b.gap[0]);
		setLiveData([...openArr, ...closeArr]);
	}, [liveStatus]);

	useEffect(() => {
		setLiveData((prev) => {
			const arr = [...prev];
			for (let v of arr) {
				v.profileImage = stellar.find((s) => s.uuid === v.uuid)?.profileImage || "";
				v.name = stellar.find((s) => s.uuid === v.uuid)?.name || "";
				v.gap = v.liveStatus
					? elapsedTimeTextForCard(new Date(v.openDate!), new Date(getLocale()))
					: elapsedTimeTextForCard(new Date(v.closeDate!), new Date(getLocale()));
			}
			const openArr = arr.filter((a) => a.liveStatus).sort((a, b) => a.gap[0] - b.gap[0]);
			const closeArr = arr.filter((a) => !a.liveStatus).sort((a, b) => a.gap[0] - b.gap[0]);
			return [...openArr, ...closeArr];
		});
	}, [stellar]);

	return (
		<Stack minHeight="calc(100vh - 125px)" alignItems={"center"}>
			<Stack
				width={["100%", "100%", "100%", "768px", "1024px"]}
				padding={["12px", "12px", "12px", null, null]}
				paddingTop={["32px", "32px", "32px", "32px", "32px"]}
				gap={"8px"}
			>
				{/* 최상단에 최근 이벤트 크게 렌더 */}
				<RecentNews
					data={firstMusic}
					isLoading={isNewsLoading}
					condition={condition}
					isDataLoading={isDataLoading}
					now={now}
					recent={data.recent}
					mostPopular={data.mostPopular}
					mostPopularMusic={data.mostPopularMusic}
					upcoming={data.upcoming}
					approach={data.approachForNews}
					mostViews={data.mostViews}
				/>
				{data.approach.length > 0 ? (
					<CarouselList
						heading={"최근 조회수 달성"}
						musics={data.approach}
						type={"approach"}
						isDataLoading={isDataLoading}
					/>
				) : null}
				<CarouselList
					heading={"치지직 라이브 현황"}
					lives={liveData}
					isDataLoading={isLiveLoading}
					isLiveFetching={isLiveFetching}
				/>
				{data.recent.length > 0 ? (
					<CarouselList heading={"최근 게시된 영상"} musics={data.recent} type="recent" isDataLoading={isDataLoading} />
				) : null}

				<Spacing size={8} />
			</Stack>
		</Stack>
	);
}

function RecentNews({
	data,
	isLoading,
	condition,
	isDataLoading,
	now,
	recent,
	mostPopular,
	mostPopularMusic,
	upcoming,
	approach,
	mostViews,
}: RecentNewsProps) {
	const { windowWidth } = useResponsive();
	const [userSetting, setUserSetting] = useLocalStorage<UserSettingStorage>(USER_SETTING_STORAGE, {});
	const intervalRef = useRef<number>();
	const [currentPageIdx, setCurrentPageIdx] = useState(0);
	const [isAutoScrollOn, setIsAutoScrollOn] = useState(true);
	// 최초공개 > 인급음 > 최근 게시영상 > 최근 이벤트 달성 > 최다 조회수  순서로
	// 최근 게시 영상은 3일 이내일 경우 최상단(최초공개 다음)으로 이동
	function createHeadingText(data: YoutubeMusicData, condition: number, isLive: boolean) {
		// 인급음 > 최근 게시영상 > 최근 이벤트 달성 > 최다 조회수
		const publishedDate = new Date(data.publishedAt || MIN_DATE);
		const [, elapsedDateText] = elapsedTimeTextForCard(publishedDate, now);
		const scheduledStartTimeDate = new Date(data.scheduledStartTime || MIN_DATE);
		const [startTimeGap, remainingDateText] = remainingTimeText(scheduledStartTimeDate, now);

		if (condition === -1) {
			return `최초 공개 ${isLive ? "진행중" : startTimeGap <= 0 ? "곧 시작" : remainingDateText}`;
		} else if (condition === 0) {
			return `인기 급상승 동영상 #${data.mostPopular}`;
		} else if (condition === 1) {
			return `${elapsedDateText} 게시된 새 영상`;
		} else if (condition === 2) {
			return `최근 ${data.statistics.at(-1)?.unit + " " || ""}조회수 달성`;
		} else if (condition === 3) {
			return `인기 급상승 음악 #${data.mostPopularMusic}`;
		} else {
			return `최다 조회수: ${numberToLocaleString(data.viewCount)}`;
		}
	}

	const autoPagingTime = 6500;

	const handlePage = (pageIdx: number) => () => {
		setCurrentPageIdx(pageIdx);
		if (isAutoScrollOn) {
			clearInterval(intervalRef.current);
			intervalRef.current = setInterval(autoPaging, autoPagingTime);
		}
	};

	const autoPaging = () => {
		setCurrentPageIdx((prev) => {
			if (prev + 1 > reOgData.length - 1) return 0;
			return prev + 1;
		});
	};

	const handleAutoPaging = () => {
		setIsAutoScrollOn((prev) => {
			if (prev) {
				clearInterval(intervalRef.current);
			} else {
				intervalRef.current = setInterval(autoPaging, autoPagingTime);
			}
			setUserSetting((prevUS) => ({ ...prevUS, isAutoScrollOn: !prev }));
			return !prev;
		});
	};

	const conditionDict = {
		"-1": "upcoming",
		"0": "mostPopular",
		"1": "recent",
		"2": "approach",
		"3": "mostPopularMusic",
	};

	const reOgData: ({ condition: number } & YoutubeMusicData)[] = [
		...upcoming.map((v) => ({ ...v, condition: -1 })),
		...recent
			.filter(
				(v) => new Date(getLocale()).getTime() - new Date(v.publishedAt || MIN_DATE).getTime() < 86400000 * 7 // 1 weeks
			)
			.map((v) => ({ ...v, condition: 1 })),
		...mostPopularMusic.map((v) => ({ ...v, condition: 3 })),
		...mostPopular.map((v) => ({ ...v, condition: 0 })),
		...approach.slice(0, 3).map((v) => ({ ...v, condition: 2 })),
	];

	const isUnder720 = windowWidth < 720;

	useEffect(() => {
		if (userSetting.isAutoScrollOn === true) setIsAutoScrollOn(true);
		else if (userSetting.isAutoScrollOn === false) setIsAutoScrollOn(false);
		if (!isLoading && (userSetting.isAutoScrollOn === true || userSetting.isAutoScrollOn === undefined))
			intervalRef.current = setInterval(autoPaging, autoPagingTime);
		return () => {
			clearInterval(intervalRef.current);
		};
	}, [isLoading]);

	return (
		<Stack
			position="relative"
			direction={["row", "row", "row", "row", "row"]}
			alignItems={["center", "center", "flex-end", "flex-end", "flex-end"]}
			borderColor="gray.300"
			borderRadius={"1rem"}
			backgroundColor={"blue.300"}
			overflow="hidden"
			_hover={{
				".paging-arrow": {
					opacity: 1,
				},
			}}
		>
			{/* 캐로셀 페이징 부분 */}
			{reOgData.length > 1 && !isLoading ? (
				<HStack
					position="absolute"
					top={isUnder720 ? undefined : "8px"}
					right={isUnder720 ? 0 : "8px"}
					bottom={isUnder720 ? "4px" : undefined}
					width={isUnder720 ? "100%" : undefined}
					justifyContent={isUnder720 ? "center" : undefined}
					gap="2px"
					zIndex={1}
				>
					<Tooltip label={`자동 스크롤 ${isAutoScrollOn ? "켜짐" : "꺼짐"}`} bg={"rgb(0,0,0,0.35)"}>
						<Stack
							boxSize="16px"
							alignItems={"center"}
							justifyContent={"center"}
							cursor={"pointer"}
							marginRight="2px"
							onClick={handleAutoPaging}
						>
							<Box
								boxSize="8px"
								borderRadius={"100%"}
								backgroundColor={isAutoScrollOn ? "green.700" : "red.700"}
								cursor={"pointer"}
								transition="background-color .3s"
							/>
						</Stack>
					</Tooltip>
					{reOgData.map((_, i) => (
						<Stack
							key={i}
							boxSize="16px"
							alignItems={"center"}
							justifyContent={"center"}
							cursor={"pointer"}
							onClick={handlePage(i)}
						>
							<Box
								boxSize="8px"
								borderRadius={"100%"}
								backgroundColor={currentPageIdx === i ? "gray.600" : "gray.300"}
								cursor={"pointer"}
								transition="background-color .3s"
							/>
						</Stack>
					))}
				</HStack>
			) : null}
			{isLoading ? (
				<Stack direction={["column", "column", "row", "row", "row"]} padding="16px">
					<Skeleton
						width={["300px", "432px", "360px", "360px", "360px"]}
						height={["150px", "216px", "180px", "180px", "180px"]}
						minWidth={["300px", "360px", "360px", "360px", "360px"]}
					/>
					<Stack width="100%" minWidth="100%" alignSelf={"flex-end"}>
						<Box>
							<SkeletonText width="100%" noOfLines={3} spacing={"4"} skeletonHeight={"2"} />
						</Box>
					</Stack>
				</Stack>
			) : (
				<HStack
					minWidth="100%"
					alignItems={["center", "center", "flex-end", "flex-end", "flex-end"]}
					padding="16px"
					gap="32px"
					transform={`translateX(-${100 * currentPageIdx}%)`}
					transition="all .3s"
				>
					{reOgData.map((v, idx) => {
						const isUpcoming = v.liveBroadcastContent === "upcoming";
						const isLive = v.liveBroadcastContent === "live";
						const headingText = createHeadingText(v, v.condition, isLive);
						const timeTextDate = isLive ? v.scheduledStartTime || MIN_DATE : v.publishedAt || MIN_DATE;
						const timeText = createTimeText(v, conditionDict[v.condition]);
						return (
							<Stack key={`${idx}-${v.videoId}`} direction={["column", "column", "row", "row", "row"]} minWidth="100%">
								<Stack flex={1} direction={["column", "column", "row", "row", "row"]} alignItems={"center"} gap="12px">
									<Link
										href={isLoading ? undefined : youtube.videoUrl(v.videoId)}
										isExternal
										transition="all .3s"
										_hover={{
											"> .news-thumbnail": {
												filter: "grayscale(0.5)",
												borderRadius: 0,
												boxShadow: "2px 4px 6px black",
											},
										}}
									>
										<Image
											className="news-thumbnail"
											src={v.thumbnail}
											alt="thumbnail"
											width={["300px", "432px", "360px", "360px", "360px"]}
											height={["150px", "216px", "180px", "180px", "180px"]}
											minWidth={["300px", "360px", "360px", "360px", "360px"]}
											objectFit={"cover"}
											transition="all .3s"
											borderRadius={[
												".5rem .5rem 0 0",
												".5rem .5rem 0 0",
												".5rem .5rem 0 .5rem",
												".5rem .5rem 0 .5rem",
												".5rem .5rem 0 .5rem",
											]}
											outline="1px solid"
											outlineColor="blue.50"
											animation={`fadeIn 0.3s ease-in-out 0.1s 1 normal both`}
										/>
									</Link>
									<Stack
										gap="4px"
										width={[null, null, null, "100%", "100%"]}
										alignSelf={[null, null, "flex-end", "flex-end", "flex-end"]}
									>
										<Heading
											fontSize={v.condition === -1 ? "3xl" : "lg"}
											animation={`fadeIn 0.3s ease-in-out 0s 1 normal both`}
										>
											{headingText}
										</Heading>
										<Text
											as={Link}
											href={isLoading ? undefined : youtube.videoUrl(v.videoId)}
											isExternal
											overflow="hidden"
											textOverflow={"ellipsis"}
											whiteSpace={"normal"}
											lineHeight="1.5rem"
											maxHeight="3rem"
											animation={`fadeIn 0.3s ease-in-out 0.2s 1 normal both`}
										>
											{v.titleAlias || v.title}
										</Text>
										{v.details.length > 0 ? (
											<HStack paddingLeft="8px" animation={`fadeIn 0.3s ease-in-out 0.2s 1 normal both`}>
												<Text fontSize="xs">부가 영상</Text>
												{v.details.map((detail) => {
													const { id, type, videoId } = detail;
													return (
														<Text
															as={Link}
															href={youtube.videoUrl(videoId)}
															key={`${id}_${videoId}`}
															color="blue.800"
															fontSize="sm"
															isExternal
														>
															{type}
														</Text>
													);
												})}
											</HStack>
										) : null}
										<HStack
											alignItems={"center"}
											justifyContent={"space-between"}
											animation={`fadeIn 0.3s ease-in-out 0.3s 1 normal both`}
										>
											{isUpcoming ? null : (
												<HStack animation={`fadeIn 0.3s ease-in-out 0.4s 1 normal both`}>
													<FaEye />
													<Text fontWeight={"bold"}>{numberToLocaleString(v.viewCount)}</Text>
												</HStack>
											)}
											{isUpcoming || timeText.value ? null : (
												<Text fontSize={"sm"} color="gray.700" animation={`fadeIn 0.3s ease-in-out 0.5s 1 normal both`}>
													{elapsedTimeTextForCard(new Date(new Date(timeTextDate)), new Date(getLocale()))[1]}
												</Text>
											)}
											{timeText.value ? (
												<Text fontSize={"sm"} color="gray.700" animation={`fadeIn 0.3s ease-in-out 0.5s 1 normal both`}>
													{timeText.value} 달성
												</Text>
											) : null}
										</HStack>
									</Stack>
								</Stack>
							</Stack>
						);
					})}
				</HStack>
			)}
		</Stack>
	);
}

function CarouselList({ heading, musics, type, lives, isDataLoading, isLiveFetching }: CarouselListProps) {
	const [isMultiViewMode, setIsMultiViewMode] = useState(false);
	const [multiViewList, setMultiViewList] = useState<IMultiViewItem[]>([]);
	const [isLiveDetailFetching] = useRecoilState(isLiveDetailFetchingState);

	const handleAddMulView = (live: LiveData) => () => {
		setMultiViewList((prev) => {
			const id = prev.length === 0 ? 1 : Math.max(...prev.map((p) => p.id)) + 1;
			return [
				...prev,
				{ id, uuid: live.uuid, type: "chzzk", streamId: live.chzzkId, profileImage: live.profileImage || "" },
			];
		});
	};

	return (
		<Stack marginTop="8px" gap={0}>
			<HStack>
				<Heading size="md">{heading}</Heading>

				{lives ? (
					<>
						<Button
							colorScheme={isMultiViewMode ? "red" : "teal"}
							size="xs"
							onClick={() => {
								setIsMultiViewMode((prev) => !prev);
							}}
						>
							{isMultiViewMode ? "설정중" : "멀티뷰"}
						</Button>
						{isMultiViewMode ? (
							<Text fontSize="xs" color="gray.600">
								하단 스텔라들의 얼굴을 클릭해보세요!
							</Text>
						) : null}
					</>
				) : null}
				{lives && (
					<>
						<Collapse in={isLiveFetching}>
							<LoadingCircle sx={{ boxSize: "16px", ">svg": { boxSize: "16px" } }} />
						</Collapse>
						<Collapse in={isLiveDetailFetching}>
							<LoadingCircle sx={{ boxSize: "16px", ">svg": { boxSize: "16px" } }} />
						</Collapse>
					</>
				)}
			</HStack>
			<Spacing size={8} />
			<HStack
				border="1px solid"
				borderRadius={".25rem"}
				borderColor="gray.300"
				minHeight="125.6px"
				overflowX={"scroll"}
				padding="8px"
				gap="12px"
			>
				{musics && isDataLoading
					? [1, 2, 3].map((_, i) => <Skeleton key={i} height="100px" width="100px" borderRadius={"8px"} />)
					: musics &&
					  musics.map((c, idx) => {
							const timeText = createTimeText(c, type);
							return (
								<Stack
									as={Link}
									href={youtube.videoUrl(c.videoId)}
									isExternal
									key={c.videoId}
									sx={{
										position: "relative",
										minWidth: "100px",
										maxHeight: "100px",
										borderRadius: "8px",
										overflow: "hidden",
										cursor: "pointer",
										transition: "all .3s",
										animation: `fadeIn 0.3s ease-in-out ${idx * 0.05}s 1 normal both`,
										"> img": { transition: "all .3s", opacity: isMobile() ? 0.35 : 1 },
										"> .music-information": { opacity: isMobile() ? 1 : 0 },
										_hover: {
											"> img": { opacity: 0.2 },
											"> .music-information": { opacity: 1 },
										},
									}}
								>
									<Image
										boxSize="100px"
										src={getThumbnails(c.thumbnails).medium.url || ""}
										alt="thumbnail"
										objectFit={"cover"}
										transform={"scale(1.35)"}
									/>
									<Stack
										className="music-information"
										position="absolute"
										boxSize="100px"
										alignItems={"center"}
										justifyContent={"center"}
										userSelect={"none"}
										transition="all .3s"
										gap="0"
									>
										{c.type !== "music" ? (
											<Text fontSize="2xs" color="blue.600">
												{c.type}
											</Text>
										) : null}
										<FaEye />
										<Text fontWeight={"bold"}>{numberToLocaleString(c.viewCount)}</Text>
										<Text fontSize="sm">{timeText.value}</Text>
										{timeText.unit ? <Text fontSize={"2xs"}>{numberToLocaleString(timeText.unit)} 달성</Text> : null}
									</Stack>
								</Stack>
							);
					  })}
				{lives && isDataLoading
					? [1, 2, 3].map((_, i) => <Skeleton key={i} height="100px" width="100px" borderRadius={"32px"} />)
					: isMultiViewMode
					? lives &&
					  lives.map((live) => {
							// 멀티뷰 ON
							return live.chzzkId ? (
								<Stack
									as={Link}
									key={live.uuid}
									onClick={handleAddMulView(live)}
									sx={{
										position: "relative",
										minWidth: "100px",
										maxHeight: "100px",
										borderRadius: "32px",
										overflow: "hidden",
										cursor: "pointer",
										transition: "all .3s",
										outline: "2px solid transparent",
										outlineColor: live.liveStatus ? "green.400" : "red.400",
										"> img": { transition: "all .3s", opacity: isMobile() ? 0.35 : 1 },
										"> .music-information": { opacity: isMobile() ? 1 : 0 },
										_hover: {
											"> img": { opacity: 0.2 },
											"> .music-information": { opacity: 1 },
										},
									}}
								>
									{live.liveCategoryValue ? (
										<Stack position="absolute" top={"4px"} left="0" zIndex={1} alignItems={"center"} width="100%">
											<Text
												fontSize={"0.675rem"}
												backgroundColor="rgb(255,255,255,.66)"
												padding="1px 6px"
												borderRadius={"4px"}
												textAlign={"center"}
												maxWidth="84px"
												wordBreak="keep-all"
												lineHeight={1.25}
											>
												{live.liveCategoryValue}
											</Text>
										</Stack>
									) : null}
									<Stack position="absolute" bottom={"4px"} left="0" zIndex={1} alignItems={"center"} width="100%">
										{isNaN(live.gap[0]) ? (
											<LoadingThreeDot
												backgroundColor="rgb(255,255,255,.66)"
												borderRadius={"4px"}
												sx={{ height: "20px", ">svg": { boxSize: "20px", transform: "translateY(2px)" } }}
											/>
										) : (
											<Text
												fontSize="0.75rem"
												backgroundColor="rgb(255,255,255,.66)"
												padding="1px 6px"
												borderRadius={"4px"}
											>
												{live.gap[1]}
											</Text>
										)}
									</Stack>
									<Image
										boxSize="100px"
										src={`${live.profileImage}?type=f120_120_na`}
										alt="thumbnail"
										objectFit={"cover"}
										transform={"scale(1.35)"}
										filter={!live.liveStatus ? "grayscale(1)" : undefined}
									/>
									<Stack
										className="music-information"
										position="absolute"
										boxSize="100px"
										alignItems={"center"}
										justifyContent={"center"}
										userSelect={"none"}
										transition="all .3s"
										gap="0"
										sx={{ "> svg": { boxSize: "32px" } }}
									>
										<FaArrowAltCircleDown />
									</Stack>
								</Stack>
							) : null;
					  })
					: lives &&
					  lives.map((live, idx) => {
							// 멀티뷰 OFF
							return live.chzzkId ? (
								<Stack
									as={Link}
									href={naver.chzzk.liveUrl(live.chzzkId)}
									isExternal
									key={live.uuid}
									sx={{
										position: "relative",
										minWidth: "100px",
										maxHeight: "100px",
										borderRadius: "32px",
										overflow: "hidden",
										cursor: "pointer",
										transition: "all .3s",
										outline: "2px solid transparent",
										outlineColor: live.liveStatus ? "green.400" : "red.400",
										animation: `fadeIn 0.3s ease-in-out ${idx * 0.05}s 1 normal both`,
										"> img": { transition: "all .3s", opacity: isMobile() ? 0.35 : 1 },
										"> .music-information": { opacity: isMobile() ? 1 : 0 },
										_hover: {
											"> img": { opacity: 0.2 },
											"> .music-information": { opacity: 1 },
										},
									}}
								>
									{live.liveCategoryValue ? (
										<Stack position="absolute" top={"4px"} left="0" zIndex={1} alignItems={"center"} width="100%">
											<Text
												fontSize="0.675rem"
												backgroundColor="rgb(255,255,255,.66)"
												padding="1px 6px"
												borderRadius={"4px"}
												textAlign={"center"}
												maxWidth="84px"
												wordBreak="keep-all"
												lineHeight={1.25}
											>
												{live.liveCategoryValue}
											</Text>
										</Stack>
									) : null}

									<Stack position="absolute" bottom={"4px"} left="0" zIndex={1} alignItems={"center"} width="100%">
										{isNaN(live.gap[0]) ? (
											<LoadingThreeDot
												backgroundColor="rgb(255,255,255,.66)"
												borderRadius={"4px"}
												sx={{ height: "20px", ">svg": { boxSize: "20px", transform: "translateY(2px)" } }}
											/>
										) : (
											<Text
												fontSize="0.75rem"
												backgroundColor="rgb(255,255,255,.66)"
												padding="1px 6px"
												borderRadius={"4px"}
											>
												{live.gap[1]}
											</Text>
										)}
									</Stack>
									<Image
										boxSize="100px"
										src={`${live.profileImage}?type=f120_120_na`}
										alt="thumbnail"
										objectFit={"cover"}
										transform={"scale(1.35)"}
										filter={!live.liveStatus ? "grayscale(1)" : undefined}
									/>
									<Stack
										className="music-information"
										position="absolute"
										boxSize="100px"
										alignItems={"center"}
										justifyContent={"center"}
										userSelect={"none"}
										transition="all .3s"
										gap="0"
										sx={{ "> svg": { boxSize: "32px" } }}
									>
										<MdOpenInNew />
									</Stack>
								</Stack>
							) : null;
					  })}
			</HStack>
			<Collapse in={isMultiViewMode} animateOpacity>
				<Spacing size={8} />
				<MultiView list={multiViewList} setList={setMultiViewList} />
			</Collapse>
		</Stack>
	);
}

function MultiView({ list, setList }: MultiViewProps) {
	const urlPrefix = "https://mul.live/";
	const [mulLiveUrl, setMulLiveUrl] = useState("");
	const [isOtherOn, setIsOtherOn] = useState(false);
	const link = `${urlPrefix}${mulLiveUrl}`;
	const { onCopy } = useClipboard(link);
	const toast = useToast();

	const handleOpen = () => {
		window.open(link, "_blank");
	};

	const handleCopy = () => {
		onCopy();
		toast({ title: "클립보드에 주소를 복사했습니다.", status: "info", duration: 3000, isClosable: true });
	};

	const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
		setList((prev) =>
			update(prev, {
				$splice: [
					[dragIndex, 1],
					[hoverIndex, 0, prev[dragIndex]],
				],
			})
		);
	}, []);
	const renderItem = useCallback((item: IMultiViewItem, index: number) => {
		return (
			<MultiViewItem
				key={item.id}
				id={item.id}
				uuid={item.uuid}
				index={index}
				moveItem={moveItem}
				profileImage={item.profileImage}
				streamId={item.streamId}
				type={item.type}
				setList={setList}
			/>
		);
	}, []);

	useEffect(() => {
		const arr = list.reduce((a, c) => {
			let value = c.streamId;
			if (c.type === "afreeca") {
				value = `a:${c.streamId}`;
			} else if (c.type === "youtube") {
				value = `y:${c.streamId}`;
			}
			return [...a, value];
		}, [] as string[]);
		setMulLiveUrl(arr.join("/"));
	}, [list]);

	return (
		<DndProvider backend={HTML5Backend}>
			<Stack border="1px solid" borderColor="blue.500" borderRadius={".5rem"} padding="12px">
				<HStack padding="2px" overflowX={"auto"}>
					{list.map((item, i) => renderItem(item, i))}
					{/* <Tooltip label="다른 방송도 볼래요" hasArrow>
						<Button
							boxSize="50px"
							minWidth="50px"
							borderRadius={"full"}
							overflow="hidden"
							cursor="pointer"
							alignItems={"center"}
							justifyContent={"center"}
							onClick={() => {
								setIsOtherOn(true);
							}}
						>
							<MdAdd />
						</Button>
					</Tooltip> */}
				</HStack>
				<InputGroup size="sm">
					<InputLeftAddon>{urlPrefix}</InputLeftAddon>
					<Input value={mulLiveUrl} isDisabled />
				</InputGroup>
				<HStack>
					<Button colorScheme="teal" size="sm" leftIcon={<MdContentCopy />} aria-label="copy-url" onClick={handleCopy}>
						주소복사
					</Button>
					<Button colorScheme="teal" size="sm" leftIcon={<MdOpenInNew />} aria-label="open-url" onClick={handleOpen}>
						새창으로 열기
					</Button>
				</HStack>
				<Collapse in={isOtherOn} animateOpacity></Collapse>
			</Stack>
		</DndProvider>
	);
}

function MultiViewItem({ id, index, moveItem, profileImage, setList }: MultiViewItemProps) {
	// const [throttle, setThrottle] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	// const handleThrottle = () => {
	// 	setThrottle(true);
	// 	setTimeout(() => {
	// 		setThrottle(false);
	// 	}, 66);
	// };

	const handleClickItem = (id: number) => () => {};
	const handleDeleteItem = (id: number) => () => {
		setList((prev) => {
			const arr = [...prev];
			const idx = prev.findIndex((item) => item.id === id);
			arr.splice(idx, 1);
			return arr;
		});
	};

	const [{ handlerId }, drop] = useDrop({
		accept: "multiViewItem",
		collect(monitor) {
			return {
				handlerId: monitor.getHandlerId(),
			};
		},
		hover: (item: any, monitor) => {
			if (!ref.current) {
				return;
			}
			// if (throttle) return;

			const dragIndex = item.index;
			const hoverIndex = index;
			if (dragIndex === hoverIndex) {
				return;
			}
			const hoverBoundingRect = ref.current?.getBoundingClientRect();
			const hoverMiddleX = (hoverBoundingRect.left - hoverBoundingRect.right) / 2;
			const clientOffset = monitor.getClientOffset();
			const hoverClientX = (clientOffset?.x || 0) - hoverBoundingRect.right;
			const hoverOffset = 1;

			if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX - hoverOffset) {
				// handleThrottle();
				return;
			}
			if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX + hoverOffset) {
				// handleThrottle();
				return;
			}
			moveItem(dragIndex, hoverIndex);
			item.index = hoverIndex;
		},
	});
	const [{ isDragging }, drag] = useDrag({
		type: "multiViewItem",
		item: () => {
			return { id, index };
		},
		collect: (monitor) => ({
			isDragging: monitor.isDragging(),
		}),
	});
	const opacity = isDragging ? 0 : 1;
	drag(drop(ref));

	return (
		<Stack position="relative">
			<IconButton
				icon={<MdClear />}
				variant={"solid"}
				top={0}
				right={0}
				position="absolute"
				borderRadius={"full"}
				backgroundColor="black"
				color="white"
				size="2xs"
				fontSize="sm"
				onClick={handleDeleteItem(id)}
				aria-label="close-button"
				opacity={opacity}
				transitionProperty={"background-color, border-color, color, fill, stroke, box-shadow, transform"}
				transitionDuration={"0.2s"}
			/>
			<Stack
				ref={ref}
				boxSize="50px"
				minWidth="50px"
				borderRadius={"full"}
				overflow="hidden"
				opacity={opacity}
				cursor="move"
				onClick={handleClickItem(id)}
				border={"2px dashed"}
				borderColor={"gray.600"}
			>
				<Image boxSize="50px" src={`${profileImage}?type=f120_120_na`} alt="profile-image" />
			</Stack>
		</Stack>
	);
}

// Functions

function createTimeText(data: YoutubeMusicData, type?: CarouselListType) {
	if (type === "recent") {
		return {
			value: elapsedTimeTextForCard(new Date(new Date(data.publishedAt || MIN_DATE)), new Date(getLocale()))[1],
		};
	} else if (type === "approach") {
		return {
			value: elapsedTimeTextForCard(
				new Date(new Date(data.statistics.at(-1)?.updatedAt || MIN_DATE)),
				new Date(getLocale())
			)[1],
			unit: data.statistics.at(-1)?.unit,
		};
	} else return { value: "" };
}
interface Data {
	upcoming: YoutubeMusicData[];
	mostPopular: YoutubeMusicData[];
	mostPopularMusic: YoutubeMusicData[];
	recent: YoutubeMusicData[];
	approach: YoutubeMusicData[];
	approachForNews: YoutubeMusicData[];
	mostViews: YoutubeMusicData[];
	isUpdated: boolean;
}

interface LiveData extends LiveStatusState {
	profileImage?: string;
	name?: string;
	gap: [number, string];
}

interface RecentNewsProps {
	data: YoutubeMusicData;
	isLoading: boolean;
	isDataLoading: boolean;
	condition: number;
	now: Date;

	recent: YoutubeMusicData[];
	mostPopular: YoutubeMusicData[];
	mostPopularMusic: YoutubeMusicData[];
	upcoming: YoutubeMusicData[];
	approach: YoutubeMusicData[];
	mostViews: YoutubeMusicData[];
}

type CarouselListType = "recent" | "approach" | (string & {});
interface CarouselListProps {
	type?: CarouselListType;
	heading: string;
	musics?: YoutubeMusicData[];
	lives?: LiveData[];
	isDataLoading: boolean;
	isLiveFetching?: boolean;
}

interface MultiViewProps {
	list: IMultiViewItem[];
	setList: Dispatch<SetStateAction<IMultiViewItem[]>>;
}

interface IMultiViewItem {
	id: number;
	uuid: string;
	type: "chzzk" | "afreeca" | "twitch" | "youtube";
	streamId: string;
	profileImage: string;
}

interface MultiViewItemProps extends IMultiViewItem {
	index: number;
	moveItem: (dragIndex: number, hoverIndex: number) => void;
	setList: Dispatch<SetStateAction<IMultiViewItem[]>>;
}
