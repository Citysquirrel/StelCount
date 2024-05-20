import { useRecoilState } from "recoil";
import { PlatformInfosDetail, stellarState } from "../lib/Atom";
import {
	Box,
	BoxProps,
	Button,
	Card,
	CardBody,
	CardHeader,
	HStack,
	SimpleGrid,
	Stack,
	Text,
	theme,
	useColorMode,
} from "@chakra-ui/react";
import { Spacing } from "../components/Spacing";
import { Image } from "../components/Image";
import symbolTabi from "../assets/symbol/symbol_tabi.png";
import symbolMashiro from "../assets/symbol/symbol_mashiro.png";
import symbolHina from "../assets/symbol/symbol_hina.png";
import symbolLize from "../assets/symbol/symbol_lize.png";
import symbolKanna from "../assets/symbol/symbol_kanna.png";
import symbolYuni from "../assets/symbol/symbol_yuni.png";
import chzzkIcon from "../assets/i_chzzk_1.png";
import youtubeIcon from "../assets/i_youtube_1.png";
import { useEffect, useState } from "react";
import { useConsole } from "../lib/hooks/useConsole";
import { numberToLocaleString } from "../lib/functions/etc";

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

//TODO: 카운트 페이지로 합치고, 홈페이지도 그냥 삭제해버리기
//TODO: 사이드바에서 멤버별로 카테고리 구분하고, 각자 페이지 상단에서 구독자수 등 표기하고
//TODO: 나머지 커버곡 조회수 및 추출을 스크롤 페이지에 배치

export function Counter() {
	const { colorMode } = useColorMode();
	const [data, setData] = useRecoilState(stellarState);
	const [currentUuid, setCurrentUuid] = useState(data.length > 0 ? data[0].uuid : "");

	const currentStellar = data.find((s) => s.uuid === currentUuid);
	const chzzk = currentStellar && currentStellar.chzzk;
	const youtube = currentStellar && currentStellar.youtube;

	const handleClickStellar = (uuid: string) => () => {
		setCurrentUuid(uuid);
	};

	useConsole(currentStellar);

	return (
		<Stack direction={"row"} height="100%" backgroundColor={`#${currentStellar?.colorCode}44`}>
			<SideListContainer>
				<SideList>
					{data.map((stellar) => (
						<Button colorScheme="blue" onClick={handleClickStellar(stellar.uuid)}>
							{stellar.name}
						</Button>
					))}
				</SideList>
			</SideListContainer>
			<Box width="100%">
				<Stack margin="12px">
					<Stack direction={"row"}>
						<Card width="100%">
							{chzzk && chzzk.followerCount ? (
								<HStack padding="4px">
									<Image boxSize={"20px"} src={chzzkIcon} />
									<Text fontSize={"1.25rem"}>{numberToLocaleString(chzzk.followerCount)}</Text>
								</HStack>
							) : null}
							{youtube && youtube.length > 0 && youtube[0].subscriberCount ? (
								<HStack padding="4px">
									<Image boxSize={"20px"} src={youtubeIcon} />
									<Text fontSize={"1.25rem"}>{numberToLocaleString(youtube[0].subscriberCount)}</Text>
								</HStack>
							) : null}
						</Card>
					</Stack>
					<SimpleGrid columns={[2, 3, 4]} spacing="12px">
						{/* {data.map((stellar) => {
						return (
							<StellarCard key={stellar.uuid} name={stellar.name} chzzk={stellar.chzzk} youtube={stellar.youtube} />
						);
					})} */}
					</SimpleGrid>
				</Stack>
			</Box>
		</Stack>
	);
}

function SideListContainer({ children, ...props }: SideListContainerProps) {
	return (
		<Box width="240px" height="100%" borderRight="1px solid black" {...props}>
			{children}
		</Box>
	);
}

function SideList({ children, ...props }: SideListProps) {
	return (
		<Stack margin="12px" {...props}>
			{children}
		</Stack>
	);
}

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

interface SideListContainerProps extends BoxProps {}
interface SideListProps extends BoxProps {}

interface StellarCardProps {
	name: string;
	profileImage?: string;
	youtube?: PlatformInfosDetail[];
	chzzk?: PlatformInfosDetail;
}

// 심볼, 오시마크, 치지직 프로필, 구독자수, 팔로워수
