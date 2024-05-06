import { useRecoilState } from "recoil";
import { PlatformInfosDetail, stellarState } from "../lib/Atom";
import { Card, CardBody, CardHeader, Image, SimpleGrid, Stack } from "@chakra-ui/react";
import { Spacing } from "../components/Spacing";

export function Counter() {
	const [data, setData] = useRecoilState(stellarState);

	return (
		<div>
			<section>
				<SimpleGrid columns={[2, 3, 4]} spacing="12px">
					{data.map((stellar) => (
						<StellarCard
							key={stellar.uuid}
							name={stellar.name}
							profileImage={stellar.profileImage}
							chzzk={stellar.chzzk}
							youtube={stellar.youtube}
						/>
					))}
				</SimpleGrid>
			</section>
		</div>
	);
}

function StellarCard({ name, profileImage, youtube, chzzk }: StellarCardProps) {
	const { followerCount: ytfcnt, subscriberCount: ytscnt } = youtube!;
	const { followerCount: czfcnt, subscriberCount: czscnt } = chzzk!;
	return (
		<Card>
			<CardHeader>{name}</CardHeader>
			<CardBody>
				<Stack>
					<Image src={profileImage} alt={`image-${name}`} />
					<Spacing size={4} />
				</Stack>
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
