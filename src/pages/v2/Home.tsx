import { Box } from "@chakra-ui/react";
import { HomeVideoData } from "@type";

// 임시 목업 데이터
const MOCK_VIDEOS: HomeVideoData[] = [
	{ id: "1", title: "스텔라이브 첫 단체 커버", thumbnailUrl: "/thumb1.jpg", videoUrl: "...", viewCount: 1500000 },
	{ id: "2", title: "유니버스 신곡", thumbnailUrl: "/thumb2.jpg", videoUrl: "...", viewCount: 800000 },
	{ id: "3", title: "클리셰 라이브 하이라이트", thumbnailUrl: "/thumb3.jpg", videoUrl: "...", viewCount: 450000 },
	{ id: "4", title: "멤버 A 생일 기념 방송", thumbnailUrl: "/thumb4.jpg", videoUrl: "...", viewCount: 200000 },
	{ id: "5", title: "멤버 B 게임 실황", thumbnailUrl: "/thumb5.jpg", videoUrl: "...", viewCount: 150000 },
];

export default function Home() {
	return (
		<Box w="100%">
			<Box>{/* 히어로 캐로셀 /> */}</Box>

			<Box
				position="relative"
				w="100%"
				maxW="1200px"
				mx="auto"
				pt={{ base: 10, md: 20 }} // 모바일/PC 여백 다르게
				pb={40}
				px={{ base: 4, md: 8 }}
			></Box>
		</Box>
	);
}
