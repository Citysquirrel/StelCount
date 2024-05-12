import { SimpleGrid } from "@chakra-ui/react";
import { useRecoilState } from "recoil";
import { stellarState } from "../lib/Atom";
import { NAME_TABI } from "../lib/constant";

export function YoutubeVideo() {
	const [stellar, setStellar] = useRecoilState(stellarState);
	// data[0].youtube?.videos[0].?
	const tabi = stellar.filter((s) => s.name === NAME_TABI);
	return (
		<div>
			<SimpleGrid as="section" columns={[2, 3, 4]} spacing="12px"></SimpleGrid>
		</div>
	);
}

export function VideoCard() {
	return <></>;
}
