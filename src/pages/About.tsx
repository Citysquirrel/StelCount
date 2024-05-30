import { Box, Heading, Stack, Text, Link } from "@chakra-ui/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function About() {
	return (
		<Stack>
			<Section heading="ABOUT">
				<Text>우리들의 별들을 위해 커버곡 기념일을 축하해주세요!</Text>
				<Text>
					StelCount는 스텔라이브 멤버들의 구독자수, 조회수를 쉽게 확인하고 축하할 수 있도록 도와주기 위한 스텔라이브
					팬사이트입니다.
				</Text>
			</Section>
			<Section heading="CONTACT">
				<Text>웹사이트의 오류나 건의사항이 있으실 경우</Text>
				<Text>웹사이트 하단의 이메일로 연락주시면 감사하겠습니다!</Text>
			</Section>
			<Section heading="NOTICE">
				<Text>본 웹사이트는 스텔라이브가 운영하는 공식 웹사이트가 아닌 팬사이트입니다.</Text>
				<Text>스텔라이브 측의 요청이 있을 경우 사이트가 폐쇄될 수 있습니다.</Text>
			</Section>
		</Stack>
	);
}

function Section({ heading, children }: SectionProps) {
	return (
		<Box as="section" textAlign={"center"}>
			<Heading>{heading}</Heading>
			{children}
		</Box>
	);
}

interface SectionProps {
	heading?: string;
	children: React.ReactNode;
}
