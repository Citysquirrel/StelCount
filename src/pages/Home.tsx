import { Card, CardBody, HStack, Heading, Stack } from "@chakra-ui/react";
import { useEffect, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import useBackgroundColor from "../lib/hooks/useBackgroundColor";

// TODO: 여기서는 현재 활성중이거나 곧 다가오는 기념일 목록을 보여줍니다.
// Card or List 형태?
export default function Home() {
	const nav = useNavigate();
	useBackgroundColor("blue.50");
	useLayoutEffect(() => {
		import.meta.env.PROD && nav("/counter");
	}, []);
	useEffect(() => {
		import.meta.env.PROD && nav("/counter");
	});
	return (
		<Stack minHeight="calc(100vh - 124px)" alignItems={"center"}>
			<Stack
				width={["100%", "100%", "100%", "768px", "1024px"]}
				padding={["12px", "12px", "12px", null, null]}
				gap={"8px"}
			>
				{/* 최상단에 최근 이벤트 크게 렌더 */}
				<RecentNews />
				<CarouselList heading={"주목할 음악 영상"} contents={[]} />
				<CarouselList heading={"주목할 음악 영상"} contents={[]} />
				<CarouselList heading={"치지직 라이브 현황"} contents={[]} />
			</Stack>
		</Stack>
	);
}

function RecentNews() {
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

interface HomeDictionary {
	id: number;
	key: string;
	heading: string;
	contents: unknown[];
}

interface CarouselListProps {
	heading: string;
	contents: unknown[];
}
