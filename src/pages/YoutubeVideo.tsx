import { Card, CardBody, SimpleGrid } from "@chakra-ui/react";
import { useRecoilState } from "recoil";
import { VideoDataDetail, stellarState } from "../lib/Atom";
import { NAME_TABI } from "../lib/constant";
import { Image } from "../components/Image";

export function YoutubeVideo() {
	const [stellar, setStellar] = useRecoilState(stellarState);
	// data[0].youtube?.videos[0].?
	const tabi = stellar.filter((s) => s.name === NAME_TABI);
	return (
		<div>
			<SimpleGrid as="section" columns={[2, 3, 4]} spacing="12px">
				{tabi[0].youtube?.videos?.map((video) => (
					<VideoCard video={video} />
				))}
			</SimpleGrid>
		</div>
	);
}

export function VideoCard({ video }: VideoCardProps) {
	return (
		<Card overflow="hidden">
			<Image src={video.thumbnail} objectFit={"cover"} alt="thumbnail" />
			<CardBody>ㅎㅇ</CardBody>
		</Card>
	);
}

interface VideoCardProps {
	video: VideoDataDetail;
}
