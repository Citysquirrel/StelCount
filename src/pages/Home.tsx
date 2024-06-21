import { HStack, Heading, Stack } from "@chakra-ui/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useBackgroundColor from "../lib/hooks/useBackgroundColor";

// TODO: 여기서는 현재 활성중이거나 곧 다가오는 기념일 목록을 보여줍니다.
// Card or List 형태?
export default function Home() {
	useBackgroundColor("blue.50");
	return (
		<Stack minHeight="calc(100vh - 124px)" gap={"8px"}>
			{/* 최상단에 최근 이벤트 크게 렌더 */}
			<CarouselList heading={"주목할 음악 영상"} contents={[]} />
			<CarouselList heading={"주목할 음악 영상"} contents={[]} />
			<CarouselList heading={"치지직 라이브 현황"} contents={[]} />
		</Stack>
	);
}

function CarouselList({ heading, contents }: CarouselListProps) {
	return (
		<Stack>
			<Heading>{heading}</Heading>
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
