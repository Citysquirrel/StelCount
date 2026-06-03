import { useEffect, useMemo, useState } from "react";
import { fetchServer } from "../../lib/functions/fetch";
import {
	Box,
	Flex,
	Text,
	Heading,
	SimpleGrid,
	Stat,
	StatLabel,
	StatNumber,
	useColorModeValue,
	useBreakpointValue,
	VStack,
	Icon,
	useToast,
} from "@chakra-ui/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FiUsers, FiTv, FiVideo, FiPlayCircle, FiMenu, FiHome, FiPieChart, FiSettings } from "react-icons/fi";
import { IconType } from "react-icons";

// 1. 주간 메트릭 데이터 구조 정의 (하루 누적 최종치)
interface WeeklyMetricData {
	date: string;
	visit_counter: number;
	multiview_call_count: number;
	api_quota_video_list: number;
	api_quota_playlist_items: number;
}

interface ChartColors {
	visit: string;
	multiview: string;
	videoApi: string;
	playlistApi: string;
}

// 2. 테스트용 주간 더미 데이터 (월~일 하루 누적 최종 수치)
const weeklyData: WeeklyMetricData[] = [
	{
		date: "월",
		visit_counter: 1250,
		multiview_call_count: 420,
		api_quota_video_list: 850,
		api_quota_playlist_items: 310,
	},
	{
		date: "화",
		visit_counter: 1320,
		multiview_call_count: 480,
		api_quota_video_list: 920,
		api_quota_playlist_items: 350,
	},
	{
		date: "수",
		visit_counter: 1100,
		multiview_call_count: 390,
		api_quota_video_list: 780,
		api_quota_playlist_items: 280,
	},
	{
		date: "목",
		visit_counter: 1450,
		multiview_call_count: 510,
		api_quota_video_list: 1050,
		api_quota_playlist_items: 410,
	},
	{
		date: "금",
		visit_counter: 1680,
		multiview_call_count: 620,
		api_quota_video_list: 1200,
		api_quota_playlist_items: 520,
	},
	{
		date: "토",
		visit_counter: 2100,
		multiview_call_count: 850,
		api_quota_video_list: 1550,
		api_quota_playlist_items: 700,
	},
	{
		date: "일",
		visit_counter: 1950,
		multiview_call_count: 790,
		api_quota_video_list: 1420,
		api_quota_playlist_items: 640,
	},
];

interface WeeklyTotals {
	visit: number;
	multiview: number;
	video: number;
	playlist: number;
}
interface DashboardResponse {
	msg: string;
	data: LogData[];
}

interface LogData {
	id: number;
	date: string;
	counter: string | null;
	key: LogKey;
	value: string | null;
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
}

type LogKey = "visit_counter" | "multiview_call_count" | "api_quota_video_list" | "api_quota_playlist_items" | null;

const transformToWeeklyData = (logs: LogData[]): WeeklyMetricData[] => {
	const grouped = logs.reduce(
		(acc, log) => {
			// 날짜 추출 (예: "2026-05-28")
			const dateKey = log.date.split("T")[0];

			// 객체 초기화
			if (!acc[dateKey]) {
				acc[dateKey] = {
					date: dateKey,
					visit_counter: 0,
					multiview_call_count: 0,
					api_quota_video_list: 0,
					api_quota_playlist_items: 0,
				};
			}

			if (log.key) {
				let totalSum = 0;
				const rawValue = log.value ?? log.counter; // value가 없으면 counter 폴백

				if (rawValue) {
					try {
						// 1. JSON 형태 파싱 시도
						const parsed = JSON.parse(rawValue);

						// 2. 파싱된 값이 null이 아닌 순수 '객체(Object)'일 경우 합산 로직 실행
						if (typeof parsed === "object" && parsed !== null) {
							totalSum = Object.values(parsed).reduce((sum: number, val: any) => sum + Number(val), 0);
						}
						// 3. 파싱된 값이 단순 숫자(또는 다른 원시 타입)인 경우
						else {
							totalSum = Number(parsed) || 0;
						}
					} catch (error) {
						// 3. 파싱에 실패했다면(JSON 형식이 아님), 일반 숫자 문자열로 간주
						totalSum = Number(rawValue) || 0;
					}
				}

				// 추출된 총합을 해당 key에 누적
				acc[dateKey][log.key] = totalSum;
			}

			return acc;
		},
		{} as Record<string, WeeklyMetricData>,
	);

	// 날짜 오름차순 정렬 후 반환
	return Object.values(grouped).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export function Dashboard() {
	const [data, setData] = useState<WeeklyMetricData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const toast = useToast();

	const bgCard = useColorModeValue("white", "gray.700");
	const borderColor = useColorModeValue("gray.200", "gray.600");
	const axisColor = useColorModeValue("gray.600", "gray.400");

	const colors: ChartColors = {
		visit: "#3182ce",
		multiview: "#319795",
		videoApi: "#dd6b20",
		playlistApi: "#805ad5",
	};

	const weeklyTotals: WeeklyTotals = useMemo(() => {
		if (!data || data.length === 0) {
			return { visit: 0, multiview: 0, video: 0, playlist: 0 };
		}

		return data.reduce(
			(acc, curr) => ({
				visit: acc.visit + curr.visit_counter,
				multiview: acc.multiview + curr.multiview_call_count,
				video: acc.video + curr.api_quota_video_list,
				playlist: acc.playlist + curr.api_quota_playlist_items,
			}),
			{ visit: 0, multiview: 0, video: 0, playlist: 0 },
		);
	}, [data]);

	useEffect(() => {
		fetchServer<DashboardResponse>("admin", "/dashboard")
			.then((res) => {
				if (res.data) {
					const formattedData = transformToWeeklyData(res.data.data);
					setData(formattedData);
				} else {
					throw new Error("데이터 형식이 올바르지 않거나 비어있습니다.");
				}
			})
			.catch((error) => {
				console.error("대시보드 데이터 로드 실패:", error);

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
	if (isLoading) {
		return <Box p={6}>대시보드 데이터를 불러오는 중...</Box>;
	}
	return (
		<Box p={12}>
			<Box mb={8}>
				<Heading size="lg" mb={2}>
					주간 트렌드 분석
				</Heading>
				<Text color="gray.500" fontSize="sm">
					이번 주 월요일부터 일요일까지 기록된 하루 누적 최종 데이터 추이입니다.
				</Text>
			</Box>

			{/* 상단: 주간 총합 통계 카드 */}
			<SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={5} mb={8}>
				<StatCard
					label="주간 총 방문자 수"
					value={weeklyTotals.visit.toLocaleString()}
					icon={FiUsers}
					iconBg="blue.50"
					iconColor="blue.500"
					bg={bgCard}
					border={`1px solid ${borderColor}`}
				/>
				<StatCard
					label="주간 멀티뷰 총 호출"
					value={weeklyTotals.multiview.toLocaleString()}
					icon={FiTv}
					iconBg="teal.50"
					iconColor="teal.500"
					bg={bgCard}
					border={`1px solid ${borderColor}`}
				/>
				<StatCard
					label="비디오 API 주간 사용량"
					value={weeklyTotals.video.toLocaleString()}
					icon={FiVideo}
					iconBg="orange.50"
					iconColor="orange.500"
					bg={bgCard}
					border={`1px solid ${borderColor}`}
				/>
				<StatCard
					label="재생목록 API 주간 사용량"
					value={weeklyTotals.playlist.toLocaleString()}
					icon={FiPlayCircle}
					iconBg="purple.50"
					iconColor="purple.500"
					bg={bgCard}
					border={`1px solid ${borderColor}`}
				/>
			</SimpleGrid>

			{/* 하단: 주간 추이 라인 차트 */}
			<Box bg={bgCard} p={6} rounded="xl" shadow="sm" border={`1px solid ${borderColor}`}>
				<Heading size="md" mb={6}>
					요일별 누적 데이터 추이
				</Heading>
				<Box h="450px" w="100%" minW="0">
					<LineChart width={"100%"} height={450} data={data} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
						<CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
						<XAxis
							dataKey="date"
							tick={{ fontSize: 13 }}
							stroke={axisColor}
							axisLine={false}
							tickLine={false}
							dy={10}
						/>
						<YAxis tick={{ fontSize: 12 }} stroke={axisColor} axisLine={false} tickLine={false} dx={-10} />
						<Tooltip
							contentStyle={{
								backgroundColor: bgCard,
								borderColor: borderColor,
								borderRadius: "10px",
								boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
							}}
						/>
						<Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ paddingBottom: "20px" }} />

						<Line
							name="방문자 수"
							type="monotone"
							dataKey="visit_counter"
							stroke={colors.visit}
							strokeWidth={3}
							activeDot={{ r: 7, strokeWidth: 0 }}
						/>
						<Line
							name="멀티뷰 호출"
							type="monotone"
							dataKey="multiview_call_count"
							stroke={colors.multiview}
							strokeWidth={3}
							activeDot={{ r: 7, strokeWidth: 0 }}
						/>
						<Line
							name="비디오 API"
							type="monotone"
							dataKey="api_quota_video_list"
							stroke={colors.videoApi}
							strokeWidth={2}
							// strokeDasharray="5 5"
						/>
						<Line
							name="재생목록 API"
							type="monotone"
							dataKey="api_quota_playlist_items"
							stroke={colors.playlistApi}
							strokeWidth={2}
							// strokeDasharray="5 5"
						/>
					</LineChart>
				</Box>
			</Box>
		</Box>
	);
}

// 4. 서브 컴포넌트들
interface StatCardProps {
	label: string;
	value: string;
	icon: IconType;
	iconBg: string;
	iconColor: string;
	bg: string;
	border: string;
}

function StatCard({ label, value, icon: IconComponent, iconBg, iconColor, bg, border }: StatCardProps) {
	return (
		<Box p={6} bg={bg} rounded="xl" shadow="sm" border={border}>
			<Flex align="center" justify="space-between">
				<Stat>
					<StatLabel color="gray.500" fontWeight="semibold" fontSize="sm" mb={2}>
						{label}
					</StatLabel>
					<StatNumber fontSize="3xl" fontWeight="bold">
						{value}
					</StatNumber>
				</Stat>
				<Flex p={3} bg={useColorModeValue(iconBg, "gray.600")} rounded="lg" align="center" justify="center">
					<Icon as={IconComponent} boxSize="28px" color={useColorModeValue(iconColor, "white")} />
				</Flex>
			</Flex>
		</Box>
	);
}

interface SidebarItemProps {
	icon: IconType;
	label: string;
	isExpanded?: boolean;
	active?: boolean;
}

function SidebarItem({ icon, label, isExpanded, active }: SidebarItemProps) {
	const activeBg = useColorModeValue("gray.100", "gray.700");
	const hoverBg = useColorModeValue("gray.50", "gray.700");

	return (
		<Flex
			align="center"
			justify={isExpanded ? "flex-start" : "center"}
			p={3}
			mx={isExpanded ? 2 : 0}
			rounded="lg"
			bg={active ? activeBg : "transparent"}
			color={active ? "blue.500" : "gray.500"}
			cursor="pointer"
			_hover={{ bg: hoverBg, color: "blue.400" }}
			transition="all 0.2s"
		>
			<Icon as={icon} boxSize="20px" />
			{isExpanded && (
				<Text ml={4} fontWeight="medium" whiteSpace="nowrap">
					{label}
				</Text>
			)}
		</Flex>
	);
}
