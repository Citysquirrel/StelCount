import { ReactNode } from "react";
import { Badge, Box, Flex, Heading, Progress, SimpleGrid, Skeleton, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FiRefreshCw, FiUsers, FiYoutube } from "react-icons/fi";
import { IconType } from "react-icons";
import { ObservatoryButton } from "@/components/layout/Observatory";
import { DashboardMetrics, DashboardResponse, selectDashboardMetrics, YouTubeMethodUsage } from "@/lib/dashboard";
import { useServerQuery } from "@/lib/hooks/useServerApi";

const visitSites = {
	visit_counter: { label: "스텔카운트", color: "#c1a4ef" },
	hamkubby_visit_counter: { label: "햄쿠비 노래책", color: "#f4accc" },
	multiview_visit_counter: { label: "멀티뷰", color: "#80d5c5" },
} as const;
const methodStyles: Record<YouTubeMethodUsage["key"], { label: string; color: string }> = {
	video_list: { label: "videos.list", color: "#edbc83" },
	playlist_items: { label: "playlistItems.list", color: "#8fbaf3" },
	channel_list: { label: "channels.list", color: "#80d5c5" },
	playlist_list: { label: "playlists.list", color: "#c1a4ef" },
};
const methodKeys = Object.keys(methodStyles) as YouTubeMethodUsage["key"][];
const visitDualAxisRatio = 5;
const numberFormat = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 });
const compactFormat = new Intl.NumberFormat("ko-KR", { notation: "compact" });
const dayFormat = new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "UTC" });
const dateLabel = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))} (${dayFormat.format(new Date(`${date}T00:00:00Z`))})`;
const periodLabel = (period: { startDate: string; endDate: string }) => `${period.startDate} – ${period.endDate}`;
const tooltipStyle = { backgroundColor: "#211a30", border: "1px solid #645078", borderRadius: 12, color: "#f1edf8", fontSize: 12 };

export function Dashboard() {
	const query = useServerQuery<DashboardResponse, "admin", DashboardMetrics>({
		version: "admin",
		api: "/dashboard",
		queryOptions: { select: selectDashboardMetrics, refetchInterval: 300_000 },
	});
	const metrics = query.data;

	return (
		<Box maxW="1440px" mx="auto">
			<Flex align="flex-start" justify="space-between" gap={4} wrap="wrap" mb={7}>
				<Box>
					<Text fontSize="11px" letterSpacing=".16em" color="var(--obs-accent)">WEEKLY OVERVIEW</Text>
					<Heading as="h1" fontSize={{ base: "26px", md: "32px" }} mt={2} mb={3}>한 주의 서비스 흐름</Heading>
					<Flex align="center" gap={3} wrap="wrap" fontSize="sm" color="var(--obs-muted)">
						<Badge bg="#c1a4ef1a" color="var(--obs-accent)" borderRadius="full" px={3} py={1}>이번 주</Badge>
						<Text>방문은 한국 시간 · YouTube 할당량은 미국 태평양 시간</Text>
					</Flex>
				</Box>
				<ObservatoryButton leftIcon={<FiRefreshCw />} onClick={() => void query.refetch()} isLoading={query.isFetching} loadingText="불러오는 중">
					통계 새로고침
				</ObservatoryButton>
			</Flex>

			{query.isError && (
				<Box role="alert" mb={5} p={4} border="1px solid #f4accc55" bg="#f4accc0d" borderRadius="xl">
					<Text fontWeight="semibold">통계를 불러오지 못했습니다.</Text>
					<Text fontSize="sm" color="var(--obs-muted)" mt={1}>{query.error.message}</Text>
					{metrics && <Text fontSize="sm" mt={1}>이전에 불러온 통계를 표시하고 있습니다.</Text>}
				</Box>
			)}
			{query.isPending ? (
				<Stack spacing={5} role="status" aria-label="대시보드 데이터를 불러오는 중">
					{[360, 300].map((height) => <Skeleton key={height} h={`${height}px`} borderRadius="2xl" startColor="#211b30" endColor="#302641" />)}
				</Stack>
			) : metrics && (
				<Stack spacing={5}>
					<Box>
						<Heading as="h2" fontSize="20px">사이트별 방문 호출</Heading>
						<Text fontSize="sm" color="var(--obs-muted)" mt={2}>{periodLabel(metrics.visits)} · 한국 시간 기준 ({metrics.visits.timeZone})</Text>
					</Box>
					<SimpleGrid columns={{ base: 1, xl: 3 }} spacing={5}>
						{(Object.keys(visitSites) as (keyof typeof visitSites)[]).map((key) => (
							<VisitSection key={key} siteKey={key} series={metrics.visits.series.find((series) => series.key === key)} />
						))}
					</SimpleGrid>
					<YouTubeSection usage={metrics.youtubeApi} />
					<Text fontSize="xs" color="var(--obs-muted)">
						저장 완료 데이터는 {numberFormat.format(metrics.persistenceIntervalSeconds / 60)}분 주기로 반영되며, 화면도 5분마다 갱신합니다. 저장 오류 시 더 늦어질 수 있습니다.
					</Text>
				</Stack>
			)}
		</Box>
	);
}

function VisitSection({ siteKey, series }: {
	siteKey: keyof typeof visitSites;
	series?: DashboardMetrics["visits"]["series"][number];
}) {
	const site = visitSites[siteKey];
	const days = series?.days ?? [];
	const total = days.reduce((sum, day) => sum + day.requests, 0);
	const maxRequests = Math.max(0, ...days.map((day) => day.requests));
	const maxUniqueIps = Math.max(0, ...days.map((day) => day.uniqueIps));
	const useDualAxis = maxUniqueIps > 0 && maxRequests / maxUniqueIps >= visitDualAxisRatio;
	return (
		<MetricSection title={site.label} eyebrow="VISIT CALLS" icon={FiUsers}
			description="일별 호출 수 · 일별 고유 IP"
			footnote={siteKey === "multiview_visit_counter"
				? "멀티뷰 POST 호출 기준입니다. 폴링·설정 변경·실패 요청도 포함하며, 세션 수나 실제 페이지뷰가 아닙니다."
				: "방문 관련 API 호출 기준입니다. 같은 IP의 반복 호출을 포함하며, 고유 IP는 날짜별로만 집계합니다."}>
			<Box mt={5} mb={4} borderLeft={`2px solid ${site.color}`} pl={4}>
				<Text fontSize="sm" color={site.color}>주간 호출 수</Text>
				<Text fontSize="30px" fontWeight="bold">{days.length ? `${numberFormat.format(total)}회` : "기록 없음"}</Text>
			</Box>
			{days.length ? <>
				{useDualAxis && <Flex justify="space-between" gap={2} mb={2} fontSize="xs">
					<Text color={site.color}>왼쪽 · 호출 수 (회)</Text>
					<Text color="#f1edf8">오른쪽 · 고유 IP (개)</Text>
				</Flex>}
				<UsageChart label={`${site.label} 일별 호출 수와 고유 IP`} data={days}
					leftAxisColor={useDualAxis ? site.color : undefined}
					rightAxis={useDualAxis ? { id: "uniqueIps", color: "#f1edf8" } : undefined}>
					<Bar dataKey="requests" name="호출 수 (회)" fill={site.color} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
					<Line dataKey="uniqueIps" yAxisId={useDualAxis ? "uniqueIps" : 0} name="고유 IP (개)" stroke="#f1edf8" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
				</UsageChart>
				{useDualAxis && <Text mt={2} fontSize="xs" color="var(--obs-muted)">두 지표는 서로 다른 눈금을 사용합니다.</Text>}
				<TableContainer mt={4}>
					<Table size="sm" variant="unstyled" aria-label={`${site.label} 일별 방문 집계`}>
						<Thead color="var(--obs-muted)"><Tr><Th px={2}>한국 날짜</Th><Th px={2} isNumeric>호출 수</Th><Th px={2} isNumeric>고유 IP</Th></Tr></Thead>
						<Tbody>{days.map((day) => <Tr key={day.date}>
							<Td px={2}>{dateLabel(day.date)}</Td><Td px={2} isNumeric>{numberFormat.format(day.requests)}회</Td><Td px={2} isNumeric>{numberFormat.format(day.uniqueIps)}개</Td>
						</Tr>)}</Tbody>
					</Table>
				</TableContainer>
				{total === 0 && <Text mt={3} fontSize="xs" color="var(--obs-muted)">집계된 호출이 없습니다. 기록이 없는 날짜도 0으로 제공됩니다.</Text>}
			</> : <EmptyChart />}
		</MetricSection>
	);
}

function YouTubeSection({ usage }: { usage: DashboardMetrics["youtubeApi"] }) {
	const today = usage.today;
	const hasRecords = usage.days.some((day) => day.hasRecords);
	const chartData = usage.days.map((day) => ({
		date: day.date,
		...Object.fromEntries(methodKeys.map((key) => [key, day.hasRecords ? day.methods.find((method) => method.key === key)?.estimatedQuotaUnits ?? 0 : null])),
	}));
	return (
		<MetricSection title="YouTube API 추정 사용량" eyebrow="API USAGE" icon={FiYoutube}
			description={`${periodLabel(usage)} · 태평양 시간 기준 (${usage.timeZone})`}
			footnote="같은 Google 프로젝트를 사용하는 squirrel-server·hamkubby-server·squirrel-webhook의 합계입니다. 실패·재시도를 포함한 전송 시도 기준 추정치이며, Cloud Console 확정 사용량은 아닙니다. 그 외 서비스와 배포 전 누락분은 포함하지 않으며, 기록이 있어도 하루 전체 집계를 보장하지 않습니다.">
			<Flex gap={3} wrap="wrap" align="center" mt={5}>
				<Text fontWeight="semibold">오늘 · {today.date} (태평양 시간)</Text>
				{!today.hasRecords && <Badge colorScheme="gray">기록 없음</Badge>}
			</Flex>
			<SimpleGrid columns={{ base: 1, sm: 3 }} spacing={4} my={5}>
				{[
					{ label: "오늘 추정 할당량", value: `${numberFormat.format(today.estimatedQuotaUnits)} units` },
					{ label: "오늘 사용률", value: `${numberFormat.format(today.usagePercent)}%` },
					{ label: "오늘 추정 잔여량", value: `${numberFormat.format(today.remainingUnits)} units` },
				].map(({ label, value }) => <Box key={label} borderLeft="2px solid #edbc83" pl={4}>
					<Text color="var(--obs-muted)" fontSize="sm">{label}</Text>
					<Text fontSize={{ base: "24px", md: "28px" }} fontWeight="bold" mt={1}>{today.hasRecords ? value : "—"}</Text>
				</Box>)}
			</SimpleGrid>
			{today.hasRecords ? (
				<Progress value={Math.min(100, Math.max(0, today.usagePercent))} colorScheme={today.usagePercent >= 100 ? "red" : "purple"} bg="#302641" borderRadius="full" aria-label="오늘 추정 할당량 사용률" aria-valuetext={`${numberFormat.format(today.usagePercent)}%`} />
			) : <Text fontSize="sm" color="var(--obs-muted)">오늘 기록이 없어 사용률과 잔여량을 확인할 수 없습니다.</Text>}
			<Text mt={3} fontSize="xs" color="var(--obs-muted)">일일 한도 {numberFormat.format(usage.dailyLimit)} units ({usage.dailyLimitSource === "environment" ? "서버 설정" : "기본값"}) · 태평양 자정 초기화 (서머타임 적용)</Text>
			<Box mt={6}>
				<Heading as="h3" fontSize="sm" mb={3}>오늘 서버별 사용량</Heading>
				{today.sources?.length ? <TableContainer>
					<Table size="sm" variant="unstyled" aria-label="오늘 서버별 YouTube API 사용량">
						<Thead color="var(--obs-muted)"><Tr><Th px={2}>서버 / API별 호출</Th><Th px={2} isNumeric>호출 수</Th><Th px={2} isNumeric>추정 units</Th></Tr></Thead>
						<Tbody>{today.sources.map(source => <Tr key={source.source}>
							<Td px={2}><Text>{source.source}</Text><Text fontSize="xs" color="var(--obs-muted)" whiteSpace="normal">
								{source.hasRecords ? source.methods.filter(method => method.requests > 0).map(method => `${method.method} ${numberFormat.format(method.requests)}회`).join(" · ") : "기록 없음"}
							</Text></Td>
							<Td px={2} isNumeric>{source.hasRecords ? `${numberFormat.format(source.requests)}회` : "—"}</Td>
							<Td px={2} isNumeric>{source.hasRecords ? numberFormat.format(source.estimatedQuotaUnits) : "—"}</Td>
						</Tr>)}</Tbody>
					</Table>
				</TableContainer> : <Text fontSize="sm" color="var(--obs-muted)">서버별 내역은 백엔드 반영 후 제공됩니다.</Text>}
			</Box>
			<SimpleGrid columns={{ base: 1, xl: 2 }} spacing={6} mt={6}>
				<Box minW={0}>
					<Heading as="h3" fontSize="sm" mb={3}>오늘 API별 호출·추정 할당량</Heading>
					<TableContainer>
						<Table size="sm" variant="unstyled" aria-label="오늘 YouTube API별 사용량">
							<Thead color="var(--obs-muted)"><Tr><Th px={2}>API</Th><Th px={2} isNumeric>호출 수</Th><Th px={2} isNumeric>추정 units</Th></Tr></Thead>
							<Tbody>{today.methods.map((method) => <Tr key={method.key}>
								<Td px={2}><Text color={methodStyles[method.key]?.color ?? "var(--obs-accent)"}>{method.method}</Text><Text fontSize="xs" color="var(--obs-muted)">요청당 {method.unitsPerRequest} unit</Text></Td>
								<Td px={2} isNumeric>{today.hasRecords ? `${numberFormat.format(method.requests)}회` : "기록 없음"}</Td>
								<Td px={2} isNumeric>{today.hasRecords ? numberFormat.format(method.estimatedQuotaUnits) : "—"}</Td>
							</Tr>)}</Tbody>
						</Table>
					</TableContainer>
				</Box>
				<Box minW={0}>
					<Heading as="h3" fontSize="sm" mb={3}>주간 추정 할당량 · API별 누적 (units)</Heading>
					{hasRecords ? <UsageChart label="YouTube API별 주간 추정 할당량" data={chartData}>
						{methodKeys.map((key) => <Bar key={key} dataKey={key} name={methodStyles[key].label} fill={methodStyles[key].color} stackId="quota" maxBarSize={32} isAnimationActive={false} />)}
					</UsageChart> : <EmptyChart />}
				</Box>
			</SimpleGrid>
			<TableContainer mt={5}>
				<Table size="sm" variant="unstyled" aria-label="YouTube API 일별 기록 상태">
					<Thead color="var(--obs-muted)"><Tr><Th>태평양 날짜</Th><Th>기록 상태</Th><Th isNumeric>호출 수</Th><Th isNumeric>추정 units</Th></Tr></Thead>
					<Tbody>{usage.days.map((day) => <Tr key={day.date}>
						<Td>{dateLabel(day.date)}</Td><Td>{day.hasRecords ? "기록 있음" : "기록 없음"}</Td>
						<Td isNumeric>{day.hasRecords ? `${numberFormat.format(day.requests)}회` : "—"}</Td>
						<Td isNumeric>{day.hasRecords ? numberFormat.format(day.estimatedQuotaUnits) : "—"}</Td>
					</Tr>)}</Tbody>
				</Table>
			</TableContainer>
			<Text mt={3} fontSize="xs" color="var(--obs-muted)">기록 없는 날짜의 차트는 비워 둡니다. 기록 없음은 실제 사용량 0을 의미하지 않습니다.</Text>
		</MetricSection>
	);
}

function MetricSection({ title, eyebrow, icon: Icon, description, footnote, children }: {
	title: string;
	eyebrow: string;
	icon: IconType;
	description: string;
	footnote: string;
	children: ReactNode;
}) {
	return (
		<Box as="section" aria-label={title} minW={0} p={{ base: 4, md: 6 }} border="1px solid #c1a4ef29" borderRadius="20px" bg="#1b1629" overflow="hidden">
			<Flex align="center" justify="space-between" gap={3} mb={2}>
				<Text fontSize="10px" letterSpacing=".16em" color="var(--obs-muted)">{eyebrow}</Text>
				<Box as={Icon} color="var(--obs-accent)" size="18px" aria-hidden />
			</Flex>
			<Heading as="h2" fontSize="20px">{title}</Heading>
			<Text fontSize="sm" color="var(--obs-muted)" mt={2}>{description}</Text>
			{children}
			<Text mt={5} fontSize="xs" color="var(--obs-muted)" borderTop="1px solid #3a3351" pt={4}>{footnote}</Text>
		</Box>
	);
}

function UsageChart({ label, data, children, leftAxisColor = "#b4aacb", rightAxis }: {
	label: string;
	data: { date: string }[];
	children: ReactNode;
	leftAxisColor?: string;
	rightAxis?: { id: string; color: string };
}) {
	return (
		<Box h="240px" minW={0} aria-label={label}>
			<ResponsiveContainer width="100%" height="100%" minWidth={0}>
				<ComposedChart data={data} margin={{ top: 10, right: rightAxis ? 0 : 10, bottom: 4, left: rightAxis ? 0 : -16 }} accessibilityLayer>
					<CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#3a3351" />
					<XAxis dataKey="date" tickFormatter={(date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`} tick={{ fill: "#b4aacb", fontSize: 11 }} tickLine={false} axisLine={false} tickMargin={12} />
					<YAxis yAxisId={0} width={rightAxis ? 44 : 60} domain={[0, "auto"]} allowDecimals={false} tickFormatter={(value: number) => compactFormat.format(value)} tick={{ fill: leftAxisColor, fontSize: 11 }} tickLine={false} axisLine={false} />
					{rightAxis && <YAxis yAxisId={rightAxis.id} orientation="right" width={44} domain={[0, "auto"]} allowDecimals={false}
						tickFormatter={(value: number) => compactFormat.format(value)} tick={{ fill: rightAxis.color, fontSize: 11 }} tickLine={false} axisLine={false} />}
					<Tooltip labelFormatter={(date) => dateLabel(String(date))} formatter={(value, name) => [numberFormat.format(Number(value)), name]} contentStyle={tooltipStyle} cursor={{ stroke: "#645078" }} />
					<Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
					{children}
				</ComposedChart>
			</ResponsiveContainer>
		</Box>
	);
}

function EmptyChart() {
	return <Flex h="240px" align="center" justify="center" border="1px dashed #3a3351" borderRadius="xl"><Text fontSize="sm" color="var(--obs-muted)">이번 주 기록 없음</Text></Flex>;
}
