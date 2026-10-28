import { useEffect, useState } from "react";
import {
	Alert, AlertIcon, Badge, Box, Button, Flex, FormControl, FormLabel,
	Select, Spinner, Stack, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr,
} from "@chakra-ui/react";
import { FiRefreshCw } from "react-icons/fi";
import { feedbackCategories, feedbackNotifications, FeedbackListResponse } from "@/lib/feedback";
import { formatUtcToKst } from "@/lib/functions/date";
import { useServerQuery } from "@/lib/hooks/useServerApi";
import useColor from "@/lib/hooks/useColor";
import Details from "./Feedback/Details";

export function Feedback() {
	const [category, setCategory] = useState("");
	const [processed, setProcessed] = useState("");
	const [page, setPage] = useState(1);
	const [limit, setLimit] = useState(20);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const { borderColor, headerBg, fieldHoverBgColor } = useColor();
	const params = new URLSearchParams({ page: String(page), limit: String(limit) });
	if (category) params.set("category", category);
	if (processed) params.set("isProcessed", processed);
	const feedbacks = useServerQuery<FeedbackListResponse>({
		version: "admin",
		api: `/feedbacks?${params}`,
		options: { cache: "no-store" },
		queryOptions: { retry: false, gcTime: 0 },
	});
	const total = feedbacks.data?.total;
	const pageCount = Math.min(10000, Math.max(1, Math.ceil((total ?? 0) / limit)));

	useEffect(() => {
		if (total !== undefined && page > pageCount) setPage(pageCount);
	}, [total, page, pageCount]);

	return (
		<Stack spacing={5}>
			<Flex gap={3} align="center" justify="space-between" wrap="wrap">
				<Text color="gray.500">접수된 피드백을 확인하고 처리 상태를 관리합니다.</Text>
				<Button size="sm" leftIcon={<FiRefreshCw />} onClick={() => void feedbacks.refetch()} isLoading={feedbacks.isFetching}>
					새로고침
				</Button>
			</Flex>
			<Flex gap={3} wrap="wrap" align="end">
				<FormControl w={{ base: "full", sm: "180px" }}>
					<FormLabel htmlFor="feedback-category" fontSize="sm">유형</FormLabel>
					<Select id="feedback-category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>
						<option value="">전체 유형</option>
						{Object.entries(feedbackCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
					</Select>
				</FormControl>
				<FormControl w={{ base: "full", sm: "180px" }}>
					<FormLabel htmlFor="feedback-processed" fontSize="sm">처리 상태</FormLabel>
					<Select id="feedback-processed" value={processed} onChange={(event) => { setProcessed(event.target.value); setPage(1); }}>
						<option value="">전체 상태</option>
						<option value="false">미처리</option>
						<option value="true">처리 완료</option>
					</Select>
				</FormControl>
				<FormControl w={{ base: "full", sm: "140px" }}>
					<FormLabel htmlFor="feedback-limit" fontSize="sm">페이지당 개수</FormLabel>
					<Select id="feedback-limit" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }}>
						{[20, 50, 100].map((value) => <option key={value} value={value}>{value}개</option>)}
					</Select>
				</FormControl>
			</Flex>
			{feedbacks.isError && (
				<Alert status="error" borderRadius="md">
					<AlertIcon />
					<Box flex={1}>
						<Text>{feedbacks.error.message}</Text>
						{feedbacks.data && <Text fontSize="sm">이전에 불러온 목록입니다. 새로고침해 주세요.</Text>}
					</Box>
					<Button size="sm" ml={3} onClick={() => void feedbacks.refetch()} isLoading={feedbacks.isFetching}>다시 시도</Button>
				</Alert>
			)}
			{feedbacks.isPending ? (
				<Flex py={12} gap={3} justify="center" role="status"><Spinner /><Text>피드백을 불러오는 중입니다.</Text></Flex>
			) : feedbacks.data && (
				<>
					<Text fontSize="sm" role="status">총 {total?.toLocaleString()}건 · 최신 접수순</Text>
					{feedbacks.data.data.length === 0 ? (
						<Text py={12} textAlign="center" color="gray.500">조회 조건에 해당하는 피드백이 없습니다.</Text>
					) : (
						<TableContainer borderWidth="1px" borderColor={borderColor} borderRadius="md">
							<Table size="sm" aria-label="접수된 피드백 목록">
								<Thead bg={headerBg}>
									<Tr><Th>접수 시각 (KST)</Th><Th>유형</Th><Th>내용</Th><Th>처리 상태</Th><Th>Discord 알림</Th><Th>관리</Th></Tr>
								</Thead>
								<Tbody>
									{feedbacks.data.data.map((feedback) => (
										<Tr key={feedback.id} _hover={{ bg: fieldHoverBgColor }}>
											<Td>{formatUtcToKst(feedback.createdAt)}</Td>
											<Td>{feedbackCategories[feedback.category] ?? feedback.category}</Td>
											<Td minW="200px" maxW="420px" py={4}>
												<Text noOfLines={2} whiteSpace="pre-wrap" overflowWrap="anywhere">{feedback.message}</Text>
											</Td>
											<Td><Badge colorScheme={feedback.isProcessed ? "green" : "orange"}>{feedback.isProcessed ? "처리 완료" : "미처리"}</Badge></Td>
											<Td>{feedbackNotifications[feedback.notificationStatus] ?? feedback.notificationStatus}</Td>
											<Td><Button size="sm" variant="outline" aria-label={`${feedback.id} 피드백 상세 보기`} onClick={() => setSelectedId(feedback.id)}>상세 보기</Button></Td>
										</Tr>
									))}
								</Tbody>
							</Table>
						</TableContainer>
					)}
					<Flex gap={3} align="center" justify="center" wrap="wrap">
						<Button size="sm" onClick={() => setPage((value) => value - 1)} isDisabled={page <= 1 || feedbacks.isFetching}>이전</Button>
						<Text fontSize="sm">{page} / {pageCount} 페이지</Text>
						<Button size="sm" onClick={() => setPage((value) => value + 1)} isDisabled={page >= pageCount || feedbacks.isFetching}>다음</Button>
					</Flex>
				</>
			)}
			{selectedId && <Details key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} />}
		</Stack>
	);
}
