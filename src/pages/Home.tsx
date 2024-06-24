import { Checkbox, HStack, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBackgroundColor from "../lib/hooks/useBackgroundColor";
import { useRecoilState } from "recoil";
import { LiveStatusState, liveStatusState, stellarState } from "../lib/Atom";
import { YoutubeMusicData } from "../lib/types";
import { useConsole } from "../lib/hooks/useConsole";
import { useAuth } from "../lib/hooks/useAuth";
import { NotExist } from "./NotExist";
import { Loading } from "../components/Loading";
import { elapsedTimeText, getLocale, getThumbnails, numberToLocaleString } from "../lib/functions/etc";
import { Image } from "../components/Image";
import { naver, youtube } from "../lib/functions/platforms";
import { FaEye } from "react-icons/fa6";
import isMobile from "is-mobile";
import { MdOpenInNew } from "react-icons/md";

// TODO: 여기서는 현재 활성중이거나 곧 다가오는 기념일 목록을 보여줍니다.
// Card or List 형태?
export default function Home() {
	useBackgroundColor("white");
	const nav = useNavigate();
	// const [isLoading, setIsLoading] = useState(true);
	const [stellar] = useRecoilState(stellarState);
	const [liveStatus] = useRecoilState(liveStatusState);

	const [isNewsLoading, setIsNewsLoading] = useState(true);
	const [data, setData] = useState<Data>({
		mostPopular: [],
		recent: [],
		approach: [],
		mostViews: [],
		isUpdated: false,
	});
	const [liveData, setLiveData] = useState<LiveData[]>([]);

	const { isLoading: isAuthLoading, isLogin, isAdmin } = useAuth();

	const isDataLoading = data.isUpdated;

	const arr =
		data.mostPopular.length > 0
			? data.mostPopular
			: data.recent.length > 0
			? data.recent
			: data.approach.length > 0
			? data.approach
			: data.mostViews;

	const condition = data.mostPopular.length > 0 ? 0 : data.recent.length > 0 ? 1 : data.approach.length > 0 ? 2 : 3;
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
			obj.mostPopular = videos.filter((v) => v.mostPopular !== -1).sort((a, b) => a.mostPopular - b.mostPopular);
			obj.recent = videos
				.filter(
					(v) =>
						new Date(getLocale()).getTime() - new Date(v.publishedAt || "1000-01-01T09:00:00.000Z").getTime() <
						5184000000 // 2 months
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
			obj.approach = videos
				.filter(
					(v) =>
						v.statistics.filter((s) => new Date(getLocale()).getTime() - new Date(s.annie_at).getTime() < 259200000) // 3 days
							.length > 0
				)
				.sort((a, b) => {
					return (
						new Date(b.statistics.at(-1)?.annie_at || new Date(getLocale())).getTime() -
						new Date(a.statistics.at(-1)?.annie_at || new Date(getLocale())).getTime()
					);
				})
				.slice(0, 30);
			obj.isUpdated = true;
			return obj;
		});
	}, [stellar]);

	useEffect(() => {
		setLiveData(
			liveStatus
				.map((l) => ({
					...l,
					profileImage: stellar.find((s) => s.uuid === l.uuid)?.profileImage || "",
					name: stellar.find((s) => s.uuid === l.uuid)?.name || "",
				}))
				.sort((a) => (a.liveStatus ? -1 : 1))
		);
	}, [liveStatus]);

	useEffect(() => {
		setLiveData((prev) => {
			const arr = [...prev];
			for (let v of arr) {
				v.profileImage = stellar.find((s) => s.uuid === v.uuid)?.profileImage || "";
				v.name = stellar.find((s) => s.uuid === v.uuid)?.name || "";
			}
			arr.sort((a) => (a.liveStatus ? -1 : 1));
			return arr;
		});
	}, [stellar]);

	useConsole(data, "data");
	useConsole(liveData);

	useLayoutEffect(() => {
		import.meta.env.PROD && nav("/counter");
	}, []);
	useEffect(() => {
		import.meta.env.PROD && nav("/counter");
	});

	if (isAuthLoading) return <Loading options={{ mode: "fullscreen" }} />;
	if (!isLogin) return <NotExist />;
	if (!isAdmin) return <NotExist />;
	return (
		<Stack minHeight="calc(100vh - 125px)" alignItems={"center"}>
			<Stack
				width={["100%", "100%", "100%", "768px", "1024px"]}
				padding={["12px", "12px", "12px", null, null]}
				paddingTop={["32px", "32px", "32px", "32px", "32px"]}
				gap={"8px"}
			>
				{/* 최상단에 최근 이벤트 크게 렌더 */}
				<RecentNews data={firstMusic} isLoading={isNewsLoading} condition={condition} />
				{data.recent.length > 0 ? (
					<CarouselList heading={"최근 게시된 영상"} musics={data.recent} type="recent" />
				) : null}
				{data.approach.length > 0 ? (
					<CarouselList heading={"최근 조회수 달성"} musics={data.approach} type={"approach"} />
				) : null}
				<CarouselList heading={"치지직 라이브 현황"} lives={liveData} />
			</Stack>
		</Stack>
	);
}

function RecentNews({ data, isLoading, condition }: RecentNewsProps) {
	// 인급음 > 최근 게시영상 > 최근 이벤트 달성 > 최다 조회수  순ㅇ서로

	const headingText = createHeadingText(data, condition);
	return (
		<Stack
			direction={["column", "column", "row", "row", "row"]}
			alignItems={["center", "center", "flex-end", "flex-end", "flex-end"]}
			borderColor="gray.300"
			borderRadius={"1rem"}
			padding="16px"
			backgroundColor={"blue.300"}
			gap="12px"
		>
			<Link
				href={isLoading ? undefined : youtube.videoUrl(data.videoId)}
				_hover={{ "> .news-thumbnail": { opacity: 0.75 }, borderRadius: 0 }}
			>
				<Image
					className="news-thumbnail"
					src={data.thumbnail}
					alt="thumbnail"
					width={["432px", "432px", "360px", "360px", "360px"]} // 432 216
					height={["216px", "216px", "180px", "180px", "180px"]}
					minWidth="360px"
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
				/>
			</Link>
			<Stack gap="4px" width={[null, null, null, "100%", "100%"]}>
				<Heading fontSize="lg">{headingText}</Heading>
				<Text overflow="hidden" textOverflow={"ellipsis"} whiteSpace={"normal"} lineHeight="1.5rem" maxHeight="3rem">
					{data.titleAlias || data.title}
				</Text>
				<HStack alignItems={"center"} justifyContent={"space-between"}>
					<HStack>
						<FaEye />
						<Text fontWeight={"bold"}>{numberToLocaleString(data.viewCount)}</Text>
					</HStack>
					<Text fontSize={"sm"} color="gray.700">
						{
							elapsedTimeText(
								new Date(new Date(data.publishedAt || "1000-01-01T09:00:00.000Z")),
								new Date(getLocale())
							)[1]
						}
					</Text>
				</HStack>
			</Stack>
		</Stack>
	);
}

function createHeadingText(data: YoutubeMusicData, condition: number) {
	// 인급음 > 최근 게시영상 > 최근 이벤트 달성 > 최다 조회수
	const now = new Date(getLocale());
	const publishedDate = new Date(data.publishedAt || "1000-01-01T09:00:00.000Z");
	const [, elapsedDateText] = elapsedTimeText(publishedDate, now);
	if (condition === 0) {
		return `인기 급상승 음악 #${data.mostPopular}`;
	} else if (condition === 1) {
		return `${elapsedDateText} 게시된 새 영상`;
	} else if (condition === 2) {
		return `최근 ${data.statistics.at(-1)?.unit + " " || ""}조회수 달성`;
	} else {
		return `최다 조회수: ${numberToLocaleString(data.viewCount)}`;
	}
}

function CarouselList({ heading, musics, type, lives }: CarouselListProps) {
	const [isMultiViewMode, setIsMultiViewMode] = useState(false);
	return (
		<Stack marginTop="8px">
			<HStack>
				<Heading size="xs">{heading}</Heading>
			</HStack>
			<HStack
				border="1px solid"
				borderRadius={".25rem"}
				borderColor="gray.300"
				minHeight="125.6px"
				overflowX={"scroll"}
				padding="8px"
				gap="12px"
			>
				{musics &&
					musics.map((c) => {
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
									// opacity={0}
									gap="0"
								>
									<FaEye />
									<Text fontWeight={"bold"}>{numberToLocaleString(c.viewCount)}</Text>
									<Text fontSize="sm">{timeText.value}</Text>
									{timeText.unit ? <Text fontSize={"2xs"}>{numberToLocaleString(timeText.unit)} 달성</Text> : null}
								</Stack>
							</Stack>
						);
					})}
				{isMultiViewMode
					? null
					: lives &&
					  lives.map((live) => {
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
										outline: "2px solid",
										outlineColor: live.liveStatus ? "green.400" : "red.400",

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
										// opacity={0}
										gap="0"
										sx={{ "> svg": { boxSize: "32px" } }}
									>
										{isMultiViewMode ? null : <MdOpenInNew />}
										{/* <Text fontWeight={"bold"}>{numberToLocaleString(c.viewCount)}</Text> */}
										{/* <Text fontSize="sm">{timeText.value}</Text>
							{timeText.unit ? <Text fontSize={"2xs"}>{numberToLocaleString(timeText.unit)} 달성</Text> : null} */}
									</Stack>
								</Stack>
							) : null;
					  })}
			</HStack>
		</Stack>
	);
}

function createTimeText(data: YoutubeMusicData, type?: CarouselListType) {
	if (type === "recent") {
		return {
			value: elapsedTimeText(
				new Date(new Date(data.publishedAt || "1000-01-01T09:00:00.000Z")),
				new Date(getLocale())
			)[1],
		};
	} else if (type === "approach") {
		return {
			value: elapsedTimeText(
				new Date(new Date(data.statistics.at(-1)?.annie_at || "1000-01-01T09:00:00.000Z")),
				new Date(getLocale())
			)[1],
			unit: data.statistics.at(-1)?.unit,
		};
	} else return { value: "" };
}
// 인급음 > 최근 게시영상 > 최근 이벤트 달성 > 최다 조회수
interface Data {
	mostPopular: YoutubeMusicData[];
	recent: YoutubeMusicData[];
	approach: YoutubeMusicData[];
	mostViews: YoutubeMusicData[];
	isUpdated: boolean;
}

interface LiveData extends LiveStatusState {
	profileImage?: string;
	name?: string;
}

interface RecentNewsProps {
	data: YoutubeMusicData;
	isLoading: boolean;
	condition: number;
}

type CarouselListType = "recent" | "approach" | (string & {});
interface CarouselListProps {
	type?: CarouselListType;
	heading: string;
	musics?: YoutubeMusicData[];
	lives?: LiveData[];
}
