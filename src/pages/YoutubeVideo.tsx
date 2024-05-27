import { Box, BoxProps, Card, CardBody, SimpleGrid, Stack } from "@chakra-ui/react";
import { useRecoilState } from "recoil";
import { VideoDataDetail, stellarState } from "../lib/Atom";
import { NAME_TABI } from "../lib/constant";
import { Image } from "../components/Image";

//! DEPRECATED

export function YoutubeVideo() {
	const [stellar, setStellar] = useRecoilState(stellarState);
	// data[0].youtube?.videos[0].?
	// const isVideoExist = stellar.filter((s) => s.videos);

	return (
		<Stack>
			<SideList></SideList>
			<SimpleGrid as="section" columns={[2, 3, 4]} spacing="12px">
				{/* {tabi[0].youtube?.videos?.map((video) => (
					<VideoCard video={video} />
				))} */}
			</SimpleGrid>
		</Stack>
	);
}

function SideList({ children, ...props }: SideListProps) {
	return (
		<Box width={"240px"} {...props}>
			{children}
		</Box>
	);
}

function VideoCard({ video }: VideoCardProps) {
	return (
		<Card overflow="hidden">
			<Image src={video.thumbnail} objectFit={"cover"} alt="thumbnail" />
			<CardBody>ㅎㅇ</CardBody>
		</Card>
	);
}

interface SideListProps extends BoxProps {}

interface VideoCardProps {
	video: VideoDataDetail;
}
