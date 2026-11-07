import { useMemo } from "react";
import { Badge, Box, Flex, Heading, SimpleGrid, Skeleton, Stack, Text } from "@chakra-ui/react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FiActivity, FiRefreshCw, FiUsers, FiYoutube } from "react-icons/fi";
import { IconType } from "react-icons";
import { ObservatoryButton } from "@/components/layout/Observatory";
import { DefaultResponseData } from "@/lib/functions/fetch";
import { useServerQuery } from "@/lib/hooks/useServerApi";

const metrics = {
	visit_counter: { label: "스텔카운트", color: "#c1a4ef", unit: "명" },
	hamkubby_visit_counter: { label: "햄쿠비 노래책", color: "#f4accc", unit: "명" },
	multiview_call_count: { label: "멀티뷰 호출", color: "#80d5c5", unit: "회" },
	api_quota_video_list: { label: "비디오 API", color: "#edbc83", unit: "회" },
	api_quota_playlist_items: { label: "재생목록 API", color: "#8fbaf3", unit: "회" },
} as const;

type MetricKey = keyof typeof metrics;
type DailyMetrics = { date: string } & Record<MetricKey, number | null>;
interface LogData {
	date?: string | null;
	key: string | null;
	value?: string | null;
	counter?: string | null;
}

const numberFormat = new Intl.NumberFormat("ko-KR");
const compactFormat = new Intl.NumberFormat("ko-KR", { notation: "compact" });
const dayFormat = new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "UTC" });
const dateLabel = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))} (${dayFormat.format(new Date(`${date}T00:00:00Z`))})`;

function metricValue(log: LogData, key: MetricKey): number | null {
	const raw = log.value ?? log.counter;
	if (raw == null || raw.trim() === "") return null;
	try {
		const parsed: unknown = JSON.parse(raw);
		if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
			// 두 서비스 모두 IP별 하루 한 번 집계한다. 호출량은 IP별 횟수를 합산한다.
			if (key === "visit_counter" || key === "hamkubby_visit_counter") return Object.keys(parsed).length;
			const values = Object.values(parsed).map(Number);
			return values.every((value) => Number.isFinite(value) && value >= 0)
				? values.reduce((sum, value) => sum + value, 0)
				: null;
		}
		if (typeof parsed !== "number" && typeof parsed !== "string") return null;
		const value = Number(parsed);
		return Number.isFinite(value) && value >= 0 ? value : null;
	} catch {
		const value = Number(raw);
		return Number.isFinite(value) && value >= 0 ? value : null;
	}
}

function selectWeeklyData(response: DefaultResponseData<LogData[]>): DailyMetrics[] {
	if (!Array.isArray(response?.data)) throw new Error("대시보드 응답 형식이 올바르지 않습니다.");
	const grouped = new Map<string, DailyMetrics>();
	for (const log of response.data) {
		if (!log || !log.key || !Object.prototype.hasOwnProperty.call(metrics, log.key)) continue;
		const rawDate = log.date?.trim();
		const isoDate = rawDate?.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:T|$)/);
		// 서버의 기본 로캘에 따라 M/D/YYYY 형태로 저장된 로그도 처리한다.
		const localeDate = rawDate?.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
		if (!isoDate && !localeDate) continue;
		const [year, month, day] = isoDate ? isoDate.slice(1, 4) : [localeDate![3], localeDate![1], localeDate![2]];
		const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
		const timestamp = new Date(`${date}T00:00:00Z`);
		if (!Number.isFinite(timestamp.getTime()) || timestamp.toISOString().slice(0, 10) !== date) continue;
		const row = grouped.get(date) ?? emptyDay(date);
		const key = log.key as MetricKey;
		row[key] = metricValue(log, key);
		grouped.set(date, row);
	}
	const firstDate = [...grouped.keys()].sort()[0];
	if (!firstDate && response.data.length) throw new Error("통계 기록의 날짜 또는 지표 형식을 확인할 수 없습니다.");
	if (!firstDate) return [];
	// 서버가 선택한 주를 기준으로 채워 클라이언트 시간대에 따라 주가 바뀌지 않게 한다.
	const monday = new Date(`${firstDate}T00:00:00Z`);
	monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
	return Array.from({ length: 7 }, (_, index) => {
		const day = new Date(monday);
		day.setUTCDate(day.getUTCDate() + index);
		const date = day.toISOString().slice(0, 10);
		return grouped.get(date) ?? emptyDay(date);
	});
}

function emptyDay(date: string): DailyMetrics {
	return { date, visit_counter: null, hamkubby_visit_counter: null, multiview_call_count: null, api_quota_video_list: null, api_quota_playlist_items: null };
}

export function Dashboard() {
	const query = useServerQuery<DefaultResponseData<LogData[]>, "admin", DailyMetrics[]>({
		version: "admin",
		api: "/dashboard",
		queryOptions: { select: selectWeeklyData },
	});
	const data = query.data ?? [];

	return (
		<Box maxW="1440px" mx="auto">
			<Flex align="flex-start" justify="space-between" gap={4} wrap="wrap" mb={7}>
				<Box>
					<Text fontSize="11px" letterSpacing=".16em" color="var(--obs-accent)">WEEKLY OVERVIEW</Text>
					<Heading as="h1" fontSize={{ base: "26px", md: "32px" }} mt={2} mb={3}>한 주의 서비스 흐름</Heading>
					<Flex align="center" gap={3} wrap="wrap" fontSize="sm" color="var(--obs-muted)">
						<Badge bg="#c1a4ef1a" color="var(--obs-accent)" borderRadius="full" px={3} py={1}>이번 주</Badge>
						<Text>{data.length ? `${dateLabel(data[0].date)} – ${dateLabel(data[6].date)}` : "월요일부터 일요일까지"}</Text>
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
					{query.data && <Text fontSize="sm" mt={1}>이전에 불러온 통계를 표시하고 있습니다.</Text>}
				</Box>
			)}
			{query.isPending ? (
				<Stack spacing={5} role="status" aria-label="대시보드 데이터를 불러오는 중">
					{[360, 300].map((height) => <Skeleton key={height} h={`${height}px`} borderRadius="2xl" startColor="#211b30" endColor="#302641" />)}
				</Stack>
			) : (!query.isError || query.data) && (
				<Stack spacing={5}>
					<MetricSection title="서비스 방문자" eyebrow="AUDIENCE" icon={FiUsers} data={data}
						keys={["visit_counter", "hamkubby_visit_counter"]}
						description="서비스별 일일 방문자 비교 · IP별 하루 한 번 집계합니다."
						footnote="주간 수치는 일별 방문자의 합계입니다. 같은 사람이 여러 날 방문하면 각 날짜에 포함됩니다." />
					<SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5}>
						<MetricSection title="멀티뷰 이용" eyebrow="MULTIVIEW" icon={FiActivity} data={data} keys={["multiview_call_count"]}
							description="일별 멀티뷰 호출 횟수" kind="bar" footnote="방문자 수와 별개로 반복 호출도 포함합니다." />
						<MetricSection title="YouTube API" eyebrow="API USAGE" icon={FiYoutube} data={data}
							keys={["api_quota_video_list", "api_quota_playlist_items"]}
							description="비디오 · 재생목록 API 일별 사용량" kind="bar" footnote="API 종류별 기록된 사용량을 비교합니다." />
					</SimpleGrid>
					<Text fontSize="xs" color="var(--obs-muted)">기록이 없는 날짜는 비워 둡니다. 오늘 수치는 집계 중이며 방문·호출 기록은 저장 주기에 따라 늦게 반영될 수 있습니다.</Text>
				</Stack>
			)}
		</Box>
	);
}

function MetricSection({ title, eyebrow, icon: Icon, data, keys, description, footnote, kind = "line" }: {
	title: string;
	eyebrow: string;
	icon: IconType;
	data: DailyMetrics[];
	keys: MetricKey[];
	description: string;
	footnote: string;
	kind?: "line" | "bar";
}) {
	const totals = useMemo(() => keys.map((key) => {
		const values = data.map((row) => row[key]).filter((value): value is number => value !== null);
		return { key, total: values.length ? values.reduce((sum, value) => sum + value, 0) : null };
	}), [data, keys]);
	const hasData = totals.some(({ total }) => total !== null);
	return (
		<Box as="section" aria-label={title} minW={0} p={{ base: 4, md: 6 }} border="1px solid #c1a4ef29" borderRadius="20px" bg="#1b1629" overflow="hidden">
			<Flex align="center" justify="space-between" gap={3} mb={2}>
				<Text fontSize="10px" letterSpacing=".16em" color="var(--obs-muted)">{eyebrow}</Text>
				<Box as={Icon} color="var(--obs-accent)" size="18px" aria-hidden />
			</Flex>
			<Heading as="h2" fontSize="20px">{title}</Heading>
			<Text fontSize="sm" color="var(--obs-muted)" mt={2}>{description}</Text>
			<SimpleGrid columns={{ base: 1, sm: keys.length }} gap={4} mt={6} mb={5}>
				{totals.map(({ key, total }) => (
					<Box key={key} borderLeft={`2px solid ${metrics[key].color}`} pl={4}>
						<Flex align="center" gap={2} wrap="wrap"><Text fontSize="sm" color={metrics[key].color}>{metrics[key].label}</Text><Text fontSize="11px" color="var(--obs-muted)">주간 합계</Text></Flex>
						<Text mt={1} fontSize={{ base: "26px", md: "30px" }} fontWeight="bold" sx={{ fontVariantNumeric: "tabular-nums" }}>
							{total === null ? "—" : numberFormat.format(total)}
							<Text as="span" ml={2} fontSize="xs" fontWeight="normal" color="var(--obs-muted)">{total === null ? "기록 없음" : metrics[key].unit}</Text>
						</Text>
					</Box>
				))}
			</SimpleGrid>
			{hasData ? (
				<Box h="240px" minW={0} aria-label={`${title} 일별 추이`}>
					<ResponsiveContainer width="100%" height="100%" minWidth={0}>
						<ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 4, left: -16 }} accessibilityLayer>
							<CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#3a3351" />
							<XAxis dataKey="date" tickFormatter={(date: string) => dayFormat.format(new Date(`${date}T00:00:00Z`))} tick={{ fill: "#b4aacb", fontSize: 12 }} tickLine={false} axisLine={false} tickMargin={12} interval={0} />
							<YAxis domain={[0, "auto"]} allowDecimals={false} tickFormatter={(value: number) => compactFormat.format(value)} tick={{ fill: "#b4aacb", fontSize: 11 }} tickLine={false} axisLine={false} />
							<Tooltip labelFormatter={(label) => dateLabel(String(label))}
								formatter={(value, name) => [`${numberFormat.format(Number(value))} ${metrics[keys[0]].unit}`, name]}
								contentStyle={{ backgroundColor: "#211a30", border: "1px solid #645078", borderRadius: 12, color: "#f1edf8", fontSize: 12 }}
								cursor={kind === "bar" ? { fill: "#c1a4ef0d" } : { stroke: "#645078" }} />
							{keys.map((key) => kind === "bar" ? (
								<Bar key={key} dataKey={key} name={metrics[key].label} fill={metrics[key].color} radius={[4, 4, 0, 0]} maxBarSize={24} isAnimationActive={false} />
							) : (
								<Line key={key} dataKey={key} name={metrics[key].label} stroke={metrics[key].color} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls={false} isAnimationActive={false} />
							))}
						</ComposedChart>
					</ResponsiveContainer>
				</Box>
			) : (
				<Flex h="240px" align="center" justify="center" border="1px dashed #3a3351" borderRadius="xl"><Text fontSize="sm" color="var(--obs-muted)">이번 주에 기록된 데이터가 없습니다.</Text></Flex>
			)}
			<Text mt={5} fontSize="xs" color="var(--obs-muted)" borderTop="1px solid #3a3351" pt={4}>{footnote}</Text>
		</Box>
	);
}
