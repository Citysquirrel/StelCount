import { useRecoilState } from "recoil";
import { PlatformInfosDetail, stellarState } from "../lib/Atom";
import { Card, CardBody, CardHeader, HStack, SimpleGrid, Skeleton, Stack, Text, VStack, theme } from "@chakra-ui/react";
import { Spacing } from "../components/Spacing";
import { Image } from "../components/Image";
import symbolTabi from "../assets/symbol/symbol_tabi.png";
import symbolMashiro from "../assets/symbol/symbol_mashiro.png";
import symbolHina from "../assets/symbol/symbol_hina.png";
import symbolLize from "../assets/symbol/symbol_lize.png";
import symbolKanna from "../assets/symbol/symbol_kanna.png";
import symbolYuni from "../assets/symbol/symbol_yuni.png";

export function Counter() {
	const [data, setData] = useRecoilState(stellarState);

	return (
		<div>
			<section>
				<SimpleGrid columns={[2, 3, 4]} spacing="12px">
					{data.map((stellar) => {
						return (
							<StellarCard key={stellar.uuid} name={stellar.name} chzzk={stellar.chzzk} youtube={stellar.youtube} />
						);
					})}
				</SimpleGrid>
			</section>
		</div>
	);
}

const stellarColors = {
	"아이리 칸나": "#373584",
	"아야츠노 유니": "#b77de4",
	"아라하시 타비": "#71C5E8",
	"네네코 마시로": "#25282A",
	"시라유키 히나": "#E4002B",
	"아카네 리제": "#971B2F",
};

const stellarSymbols = {
	"아이리 칸나": symbolKanna,
	"아야츠노 유니": symbolYuni,
	"아라하시 타비": symbolTabi,
	"네네코 마시로": symbolMashiro,
	"시라유키 히나": symbolHina,
	"아카네 리제": symbolLize,
};

function StellarCard({ name, profileImage, youtube, chzzk }: StellarCardProps) {
	// const { followerCount: ytfcnt, subscriberCount: ytscnt } = youtube;
	// const { followerCount: czfcnt, subscriberCount: czscnt } = chzzk;
	const thisColor = stellarColors[name];
	const thisSymbol = stellarSymbols[name];
	return (
		<Card
			sx={{
				position: "relative",
				isolation: "isolate",
				// boxShadow: theme.shadows.md,
				bgGradient: `linear(to-br,  ${thisColor}33,${thisColor})`,
				transition: "all .3s",
				":after": {
					content: "''",
					position: "absolute",
					backgroundImage: thisSymbol,
					backgroundRepeat: "no-repeat",
					backgroundPosition: "center",
					backgroundPositionY: "center",
					backgroundSize: "30%",
					zIndex: -1,
					inset: 0,
					opacity: 0.4,
				},
				":hover": {
					boxShadow: theme.shadows.md,
					borderRadius: 0,
				},
			}}
		>
			<CardHeader padding="12px">
				<HStack>
					<Image boxSize="40px" borderRadius={"full"} src={chzzk?.profileImage || undefined} alt={`image-${name}`} />
					<Spacing size={4} />
					<Text fontSize="1.25rem" fontWeight={"bold"}>
						{name}
					</Text>
				</HStack>
			</CardHeader>
			<CardBody padding="12px">
				<Stack alignItems={"center"}></Stack>
			</CardBody>
		</Card>
	);
}

interface StellarCardProps {
	name: string;
	profileImage?: string;
	youtube?: PlatformInfosDetail;
	chzzk?: PlatformInfosDetail;
}

// 심볼, 오시마크, 치지직 프로필, 구독자수, 팔로워수
