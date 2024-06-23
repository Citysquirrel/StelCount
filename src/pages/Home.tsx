import { Card, CardBody, HStack, Heading, Stack } from "@chakra-ui/react";
import { useEffect, useLayoutEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useBackgroundColor from "../lib/hooks/useBackgroundColor";
import { useRecoilState } from "recoil";
import { LiveStatusState, MostPopularState, liveStatusState, mostPopularState, stellarState } from "../lib/Atom";
import { YoutubeMusicData } from "../lib/types";
import { useConsole } from "../lib/hooks/useConsole";
import { useAuth } from "../lib/hooks/useAuth";
import { NotExist } from "./NotExist";
import { Loading } from "../components/Loading";

// TODO: 여기서는 현재 활성중이거나 곧 다가오는 기념일 목록을 보여줍니다.
// Card or List 형태?
export default function Home() {
	useBackgroundColor("blue.50");
	const nav = useNavigate();
	const [isLoading, setIsLoading] = useState(true);
	const [stellar] = useRecoilState(stellarState);
	const [mostPopular] = useRecoilState(mostPopularState);
	const [liveStatus] = useRecoilState(liveStatusState);

	const [data, setData] = useState<Data>({ mostPopular: [], recent: [], approach: [], mostViews: [] });
	const [liveData, setLiveData] = useState<LiveData>();

	const { isLoading: isAuthLoading, isLogin, isAdmin } = useAuth();

	useEffect(() => {
		// 인급음 > 최근 게시영상 > 최근 이벤트 달성 > 최다 조회수
		const mostPopularVideoIds = Object.keys(mostPopular);
		const videos = stellar.map((s) => s.youtubeMusic).flat();
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
			return obj;
		});
	}, []);

	useConsole(data);

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
				gap={"8px"}
			>
				{/* 최상단에 최근 이벤트 크게 렌더 */}
				<RecentNews mostPopular={mostPopular} />
				<CarouselList heading={"주목할 음악 영상"} contents={[]} />
				<CarouselList heading={"주목할 음악 영상"} contents={[]} />
				<CarouselList heading={"치지직 라이브 현황"} contents={[]} />
			</Stack>
		</Stack>
	);
}

function RecentNews({ mostPopular }: RecentNewsProps) {
	// 인급음 > 최근 게시영상 > 최근 이벤트 달성 > 최다 조회수  순ㅇ서로

	return (
		<Card>
			<CardBody></CardBody>
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
}

interface LiveData extends LiveStatusState {
	profileImage: string;
}

interface RecentNewsProps {
	mostPopular: MostPopularState;
}

interface CarouselListProps {
	heading: string;
	contents: unknown[];
}
