import { Box, BoxProps, Heading, Stack, Text } from "@chakra-ui/react";
import { Spacing } from "../components/Spacing";
import useBackgroundColor from "../lib/hooks/useBackgroundColor";

export function About() {
	useBackgroundColor("blue.50");
	return (
		<Stack padding="12px" minHeight="100%">
			<Spacing size={32} />
			<Section heading="ABOUT" fontSize="large" fontWeight={"500"}>
				<Text>우리들의 별들을 위해 조회수 달성을 축하해주세요!</Text>
				<br />
				<Text>StelCount는 스텔라이브 멤버들의 구독자수, 조회수를 쉽게 확인하고</Text>
				<Text>축하할 수 있도록 도와주기 위한 스텔라이브 팬사이트입니다.</Text>
			</Section>
			<Spacing size={48} />
			<Section heading="NOTICE">
				<Text>
					본 웹사이트는 스텔라이브가 운영하는 공식 웹사이트가 아닌 <b>팬사이트</b>입니다.
				</Text>
				<Text>스텔라이브 측의 요청이 있을 경우 사이트가 폐쇄될 수 있습니다.</Text>
			</Section>
			<Spacing size={48} />
			<Section heading="CONTACT">
				<Text>웹사이트의 오류나 건의사항이 있으실 경우</Text>
				<Text>사이트 하단의 개발자 이메일로 연락주세요</Text>
			</Section>
			<Spacing size={48} />
		</Stack>
	);
}

function Section({ heading, children, ...props }: SectionProps) {
	return (
		<Box as="section" textAlign={"center"} {...props}>
			<Heading size="lg" marginBottom={"16px"}>
				{heading}
			</Heading>
			{children}
		</Box>
	);
}

interface SectionProps extends BoxProps {
	heading?: string;
	children: React.ReactNode;
}
