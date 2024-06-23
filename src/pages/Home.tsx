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
import { getLocale, numberToLocaleString } from "../lib/functions/etc";
import { Image } from "../components/Image";
import { youtube } from "../lib/functions/platforms";

// TODO: 여기서는 현재 활성중이거나 곧 다가오는 기념일 목록을 보여줍니다.
// Card or List 형태?
export default function Home() {
	useBackgroundColor("blue.50");
	const nav = useNavigate();
	// const [isLoading, setIsLoading] = useState(true);
	const [stellar] = useRecoilState(stellarState);
	const [liveStatus] = useRecoilState(liveStatusState);

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

	useEffect(() => {
		// 인급음 > 최근 게시영상 > 최근 이벤트 달성 > 최다 조회수
		const videos = stellar.map((s) => s.youtubeMusic).flat();

		// [
		// 	...videos.map((v) => v.statistics).flat(),
		// 	...videos.map((v) => v.details.map((a) => a.statistics)).flat(2),
		// ]
		setData((prev) => {
			const obj = { ...prev };
			obj.mostPopular = videos.filter((v) => v.mostPopular !== -1);
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

	useConsole(data);
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
				<RecentNews data={data} />
				<CarouselList heading={"주목할 음악 영상"} contents={[]} />
				<CarouselList heading={"주목할 음악 영상"} contents={[]} />
				<CarouselList heading={"치지직 라이브 현황"} contents={[]} />
			</Stack>
		</Stack>
	);
}

function RecentNews({ data }: RecentNewsProps) {
	// 인급음 > 최근 게시영상 > 최근 이벤트 달성 > 최다 조회수  순ㅇ서로
	const [isLoading, setIsLoading] = useState(true);
	console.log(data);
	const arr =
		data.mostPopular.length > 0
			? data.mostPopular
			: data.recent.length > 0
			? data.recent
			: data.approach.length > 0
			? data.approach
			: data.mostViews;
	const music: YoutubeMusicData = !isLoading
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
		if (arr[0]) setIsLoading(false);
	}, [arr]);
	return (
		<Card
			as={Link}
			href={isLoading ? undefined : youtube.videoUrl(music.videoId)}
			position="relative"
			borderRadius={"lg"}
			variant={"outline"}
			overflow="hidden"
			direction={"column"}
			width="480px"
			height="336px"
			transition="all .3s"
			cursor={isLoading ? "auto" : "pointer"}
			sx={{ "> .news-thumbnail": { opacity: 0.5 } }}
			_hover={{ "> .news-thumbnail": { opacity: 0.5 }, borderRadius: 0 }}
			isExternal
		>
			{!isLoading ? (
				<>
					<Image
						className="news-thumbnail"
						src={music.thumbnail}
						alt="thumbnail"
						width="480px"
						height="270px"
						objectFit={"cover"}
						transition="all .3s"
					/>
					<Stack position="absolute" width="100%" height="270px" alignItems={"center"} justifyContent={"center"}>
						<Stack transform={"translateY(32px)"}>
							<Text fontSize="6xl" fontWeight={"bold"}>
								{numberToLocaleString(music.viewCount)}
							</Text>
						</Stack>
					</Stack>
					<CardBody padding="8px 12px">
						<Stack>
							<Text overflow="hidden" textOverflow={"ellipsis"} whiteSpace={"nowrap"}>
								{music.titleAlias || music.title}
							</Text>
						</Stack>
						{music.mostPopular !== -1 ? <Text float="right">인기 급상승 음악 #{music.mostPopular}</Text> : null}
					</CardBody>
				</>
			) : (
				<Stack width="100%" height="100%" alignItems="center" justifyContent={"center"}>
					<Skeleton width="100%" height="100%" />
				</Stack>
			)}
		</Card>
	);
}

function CarouselList({ heading, contents }: CarouselListProps) {
	return (
		<Stack>
			<Heading size="sm">{heading}</Heading>
			<HStack>
				{contents.map((c) => (
					<></>
				))}
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
	data: Data;
}

interface CarouselListProps {
	heading: string;
	contents: unknown[];
}
