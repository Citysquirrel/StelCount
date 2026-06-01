import { useEffect, useState } from "react";
import { fetchServer } from "../../lib/functions/fetch";
import {
	Box,
	Heading,
	Text,
	VStack,
	FormControl,
	FormLabel,
	FormHelperText,
	Input,
	Button,
	useColorModeValue,
	Flex,
	useToast,
	Divider,
	Badge,
	Switch,
} from "@chakra-ui/react";

// API 응답 타입 정의
interface SettingResponse {
	msg: string;
	data: Record<string, string>;
	missingKeys: string[];
}

interface ConfigInfo {
	id: number;
	description: string;
}

const CONFIG_INFOS: Record<string, ConfigInfo> = {
	MAINTENANCE_MODE: { description: "시스템 점검 모드 활성화 여부", id: 1 },
	MAINTENANCE_MESSAGE: { description: "점검 중일 때 사용자에게 노출될 안내 메시지", id: 2 },
	CLIENT_BASE_URL: { description: `CORS 추가 도메인 설정 (예: "https://event.com, https://test.com")`, id: 3 },
	MAINTENANCE_MODE_HAMKUBBY: { description: "햄쿠비 노래책 점검 모드 활성화 여부", id: 4 },
	MAINTENANCE_MESSAGE_HAMKUBBY: { description: "노래책 점검 중일 때 사용자에게 노출될 안내 메시지", id: 5 },
	GOOGLE_SHEET_ID: { description: "햄쿠비 노래책 구글 시트 ID", id: 6 },
	GOOGLE_SHEET_JPOP_ID: { description: "J-POP 곡 구글 시트 탭 구글 시트 ID", id: 7 },
	GOOGLE_SHEET_KPOP_ID: { description: "K-POP 곡 구글 시트 탭 ID", id: 8 },
	GOOGLE_SHEET_POP_ID: { description: "POP 곡 구글 시트 탭 구글 시트 ID", id: 9 },
};

export function Setting() {
	const [configs, setConfigs] = useState<Record<string, string>>({});
	const [missingKeysList, setMissingKeysList] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const toast = useToast();
	const bgCard = useColorModeValue("white", "gray.700");
	const borderColor = useColorModeValue("gray.200", "gray.600");
	const inputBgColor = useColorModeValue("white", "gray.800");
	const sectionBgColor = useColorModeValue("gray.50", "gray.800");
	const stickyHeaderBg = useColorModeValue(
		"rgba(255, 255, 255, 0.85)",
		"rgba(26, 32, 44, 0.85)", // 다크모드용 반투명 배경
	);

	useEffect(() => {
		fetchServer<SettingResponse>("admin", "/settings")
			.then((res) => {
				if (res.data) {
					const mergedConfigs: Record<string, string> = { ...res.data.data };
					const fetchedMissingKeys = res.data.missingKeys || [];

					if (fetchedMissingKeys.length > 0) {
						fetchedMissingKeys.forEach((key) => {
							mergedConfigs[key] = key === "MAINTENANCE_MODE" ? "false" : "";
						});
					}

					setConfigs(mergedConfigs);
					setMissingKeysList(fetchedMissingKeys);
				} else {
					throw new Error("데이터 형식이 올바르지 않거나 비어있습니다.");
				}
			})
			.catch((error) => {
				console.error("설정 데이터 로드 실패:", error);

				toast({
					title: "데이터 불러오기 실패",
					description: error instanceof Error ? error.message : "서버와 통신하는 중 문제가 발생했습니다.",
					status: "error",
					duration: 5000,
					isClosable: true,
					position: "top-right",
				});
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);
	// 입력값 변경 핸들러
	const handleInputChange = (key: string, value: string) => {
		setConfigs((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	// 저장 버튼 핸들러
	const handleSave = () => {
		fetchServer("admin", "/settings", { method: "POST", body: configs })
			.then((res) => {
				toast({
					title: "설정 저장 완료",
					description: res.data.msg,
					status: "success",
					duration: 3000,
					isClosable: true,
					position: "top-right",
				});
			})
			.catch((err) => {
				toast({
					title: "설정 저장 실패",
					description: err.stack,
					status: "error",
					duration: 3000,
					isClosable: true,
					position: "top-right",
				});
			});
	};

	// 키를 기준으로 두 그룹으로 분리 (렌더링 용도)
	const sheetKeys = Object.keys(configs)
		.filter((key) => key.startsWith("GOOGLE_SHEET_"))
		.sort((a, b) => CONFIG_INFOS[a].id - CONFIG_INFOS[b].id);
	const generalKeys = Object.keys(configs)
		.filter((key) => !key.startsWith("GOOGLE_SHEET_"))
		.sort((a, b) => CONFIG_INFOS[a].id - CONFIG_INFOS[b].id);

	// 공통 렌더링 함수: 키 배열을 받아서 폼 리스트를 그려줍니다.
	const renderConfigGroup = (keys: string[]) => (
		<VStack spacing={6} align="stretch" divider={<Divider borderColor={borderColor} />}>
			{keys.map((key) => {
				const value = configs[key];
				const isMaintenance = key === "MAINTENANCE_MODE" || key === "MAINTENANCE_MODE_HAMKUBBY";

				const isMissing = missingKeysList.includes(key);
				return (
					<FormControl key={key}>
						<Flex direction={{ base: "column", md: "row" }} gap={4} align={{ base: "stretch", md: "center" }}>
							{/* 왼쪽: 키 이름과 설명 */}
							<Box flex="1">
								<Flex align="center" gap={2} mb={1}>
									<FormLabel fontWeight="bold" fontSize="md" m={0}>
										{key}
									</FormLabel>
									{/* 값이 비어있을 경우 시각적 경고 뱃지 */}
									{isMissing && (
										<Badge colorScheme="red" variant="subtle" fontSize="0.7em">
											Missing
										</Badge>
									)}
								</Flex>
								<FormHelperText mt={0} color="gray.400" fontSize="sm">
									{CONFIG_INFOS[key].description || "설명이 등록되지 않은 설정값입니다."}
								</FormHelperText>
							</Box>

							{/* 오른쪽: 값 입력창 (MAINTENANCE_MODE는 스위치로 분기) */}
							<Box flex="2">
								{isMaintenance ? (
									<Flex align="center" h="100%">
										<Switch
											size="lg"
											colorScheme="red"
											isChecked={value === "true"}
											onChange={(e) => handleInputChange(key, e.target.checked ? "true" : "false")}
										/>
										<Text ml={3} fontWeight="bold" color={value === "true" ? "red.500" : "gray.500"}>
											{value === "true" ? "점검 활성화됨" : "정상 서비스 중"}
										</Text>
									</Flex>
								) : (
									<Input
										value={value}
										onChange={(e) => handleInputChange(key, e.target.value)}
										placeholder={`${key} 값을 입력하세요`}
										bg={inputBgColor}
										focusBorderColor="blue.500"
										size="md"
									/>
								)}
							</Box>
						</Flex>
					</FormControl>
				);
			})}
		</VStack>
	);

	if (isLoading) {
		return <Box p={6}>설정 데이터를 불러오는 중...</Box>;
	}
	return (
		<Box p={{ base: 4, md: 8 }} maxW="1200px" mx="auto">
			<Flex
				justify="space-between"
				align="center"
				position="sticky"
				top="0"
				zIndex={10}
				bg={stickyHeaderBg}
				backdropFilter="blur(4px)" // 스크롤 시 아래 내용이 예쁘게 블러 처리됨
				py={4}
				mb={6}
				mx={{ base: -4, md: -8 }} // 부모 Box의 Padding을 무시하고 꽉 채우기 위함
				px={{ base: 4, md: 8 }} // 꽉 채운 뒤 다시 내부 Padding 설정
				borderBottom={`1px solid ${borderColor}`}
			>
				<Box>
					<Heading size="lg" pb={2}>
						시스템 환경 설정
					</Heading>
					<Text color="gray.500" fontSize="sm">
						서버 및 클라이언트의 핵심 환경 변수를 관리합니다.
					</Text>
				</Box>
				<Button colorScheme="blue" onClick={handleSave} size="md" px={8}>
					변경사항 저장
				</Button>
			</Flex>

			<VStack spacing={8} align="stretch">
				{/* 그룹 1: 일반 시스템 설정 */}
				<Box bg={bgCard} p={6} rounded="xl" shadow="sm" border={`1px solid ${borderColor}`}>
					<Box mb={6} pb={4} borderBottom={`2px solid`} borderColor={sectionBgColor}>
						<Heading size="md">일반 시스템 설정</Heading>
					</Box>
					{renderConfigGroup(generalKeys)}
				</Box>

				{/* 그룹 2: 구글 시트 연동 설정 */}
				<Box bg={bgCard} p={6} rounded="xl" shadow="sm" border={`1px solid ${borderColor}`}>
					<Box mb={6} pb={4} borderBottom={`2px solid`} borderColor={sectionBgColor}>
						<Heading size="md">구글 시트 연동 설정</Heading>
					</Box>
					{renderConfigGroup(sheetKeys)}
				</Box>
			</VStack>
		</Box>
	);
}
