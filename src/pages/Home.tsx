import { Card, CardBody, HStack, Heading, Link, Skeleton, Stack, Text } from "@chakra-ui/react";
import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBackgroundColor from "../lib/hooks/useBackgroundColor";
import { useRecoilState } from "recoil";
import { LiveStatusState, liveStatusState, stellarState } from "../lib/Atom";
import { YoutubeMusicData } from "../lib/types";
import { useConsole } from "../lib/hooks/useConsole";
import { useAuth } from "../lib/hooks/useAuth";
import { NotExist } from "./NotExist";
import { Loading, LoadingCircle } from "../components/Loading";
import { elapsedTimeText, getLocale, numberToLocaleString } from "../lib/functions/etc";
import { Image } from "../components/Image";
import { youtube } from "../lib/functions/platforms";

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

	const isLoading = data.isUpdated;

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
				.sort(
					(a, b) =>
						(b.publishedAt ? new Date(b.publishedAt).getTime() : 0) -
						(a.publishedAt ? new Date(a.publishedAt).getTime() : 0)
				)
				.slice(0, 10);
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
				.slice(0, 10);
			obj.approach = videos
				.filter(
					(v) =>
						v.statistics.filter((s) => new Date(getLocale()).getTime() - new Date(s.annie_at).getTime() < 259200000)
							.length > 0
				)
				.sort((a, b) => {
					return (
						new Date(b.statistics.at(-1)?.annie_at || new Date(getLocale())).getTime() -
						new Date(a.statistics.at(-1)?.annie_at || new Date(getLocale())).getTime()
					);
				})
				.slice(0, 10);
			obj.isUpdated = true;
			return obj;
		});
	}, [stellar]);

	useEffect(() => {
		setLiveData(
			liveStatus.map((l) => ({ ...l, profileImage: stellar.find((s) => s.uuid === l.uuid)?.profileImage || "" }))
		);
	}, [liveStatus]);

	useEffect(() => {
		setLiveData((prev) => {
			const arr = [...prev];
			for (let v of arr) {
				v.profileImage = stellar.find((s) => s.uuid === v.uuid)?.profileImage || "";
			}
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
				{data.recent.length > 0 ? <CarouselList heading={"최근 게시된 영상"} musics={data.recent} /> : null}
				{data.approach.length > 0 ? <CarouselList heading={"최근 조회수 달성"} musics={data.approach} /> : null}
				<CarouselList heading={"치지직 라이브 현황"} lives={[]} />
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
			border="1px solid"
			borderColor="gray.300"
			borderRadius={".25rem"}
			padding="12px"
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
				/>
			</Link>
			<Stack gap="4px">
				<Heading fontSize="lg">{headingText}</Heading>
				<Text overflow="hidden" textOverflow={"ellipsis"} whiteSpace={"normal"} lineHeight="1.5rem" maxHeight="3rem">
					{data.titleAlias || data.title}
				</Text>
			</Stack>
		</Stack>
	);
}

function createHeadingText(data: YoutubeMusicData, condition: number) {
	// 인급음 > 최근 게시영상 > 최근 이벤트 달성 > 최다 조회수
	const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
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

function CarouselList({ heading, musics }: CarouselListProps) {
	return (
		<Stack>
			<Heading size="xs">{heading}</Heading>
			<HStack border="1px solid" borderRadius={".25rem"} borderColor="gray.300">
				{musics && musics.map((c) => <></>)}
			</HStack>
		</Stack>
	);
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
}

interface RecentNewsProps {
	data: YoutubeMusicData;
	isLoading: boolean;
	condition: number;
}

interface CarouselListProps {
	heading: string;
	musics?: YoutubeMusicData[];
	lives?: unknown[];
}
