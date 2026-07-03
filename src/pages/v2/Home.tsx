import { Box } from "@chakra-ui/react";

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
