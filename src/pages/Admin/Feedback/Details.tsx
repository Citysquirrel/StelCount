import { useState } from "react";
import {
	Alert, AlertIcon, Badge, Box, Button, FormControl, FormLabel, Modal, ModalBody,
	ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Select,
	Spinner, Stack, Text, useToast,
} from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { feedbackCategories, FeedbackData, feedbackNotifications, feedbackSources } from "@/lib/feedback";
import { formatUtcToKst } from "@/lib/functions/date";
import { DefaultResponseData } from "@/lib/functions/fetch";
import { useServerMutation, useServerQuery } from "@/lib/hooks/useServerApi";
import useColor from "@/lib/hooks/useColor";

export default function Details({ id, onClose }: { id: string; onClose: () => void }) {
	const [processed, setProcessed] = useState<boolean | null>(null);
	const queryClient = useQueryClient();
	const toast = useToast();
	const { borderColor } = useColor();
	const api = `/feedback/${encodeURIComponent(id)}`;
	const detail = useServerQuery<DefaultResponseData<FeedbackData>>({
		version: "admin",
		api,
		options: { cache: "no-store" },
		queryOptions: { retry: false, gcTime: 0, refetchOnWindowFocus: false, refetchOnReconnect: false },
	});
	const editFeedback = useServerMutation<DefaultResponseData<FeedbackData>, { id: string; isProcessed: boolean }, "admin">({
		version: "admin",
		api: "/feedback/:id",
		method: "PATCH",
		mutationOptions: {
			retry: false,
			gcTime: 0,
			onSuccess: (response) => {
				queryClient.setQueryData(["admin", api, undefined], response);
				setProcessed(null);
				void queryClient.invalidateQueries({
					predicate: ({ queryKey }) => queryKey[0] === "admin" && typeof queryKey[1] === "string" && queryKey[1].startsWith("/feedbacks?"),
				});
				toast({ status: "success", description: "피드백 처리 상태를 저장했습니다.", duration: 3000, isClosable: true });
			},
		},
	});
	const feedback = detail.data?.data;
	const isProcessed = processed ?? feedback?.isProcessed ?? false;
	const close = () => {
		if (editFeedback.isPending) return;
		if (feedback && isProcessed !== feedback.isProcessed && !window.confirm("저장하지 않은 처리 상태 변경을 취소할까요?")) return;
		onClose();
	};

	return (
		<Modal isOpen onClose={close} size="xl" scrollBehavior="inside" closeOnOverlayClick={!editFeedback.isPending} closeOnEsc={!editFeedback.isPending}>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>피드백 상세</ModalHeader>
				<ModalCloseButton isDisabled={editFeedback.isPending} />
				<ModalBody>
					<Stack spacing={4}>
						{detail.isPending && <Text role="status"><Spinner size="sm" mr={2} />피드백을 불러오는 중입니다.</Text>}
						{detail.isError && (
							<Alert status="error"><AlertIcon /><Box flex={1}>{detail.error.message}</Box><Button size="sm" ml={2} isLoading={detail.isFetching} onClick={() => void detail.refetch()}>다시 시도</Button></Alert>
						)}
						{feedback && (
							<>
								<Box>
									<Badge mr={2}>{feedbackCategories[feedback.category] ?? feedback.category}</Badge>
									<Badge colorScheme={feedback.isProcessed ? "green" : "orange"}>{feedback.isProcessed ? "처리 완료" : "미처리"}</Badge>
									<Text mt={2} fontSize="sm">접수 시각: {formatUtcToKst(feedback.createdAt)} (KST)</Text>
									<Text fontSize="sm">출처 사이트: {feedbackSources[feedback.sourceSite] ?? feedbackSources.unknown}</Text>
									<Text fontSize="xs" color="gray.500" overflowWrap="anywhere">ID: {feedback.id}</Text>
								</Box>
								<Box borderWidth="1px" borderColor={borderColor} borderRadius="md" p={4}>
									<Text whiteSpace="pre-wrap" overflowWrap="anywhere">{feedback.message}</Text>
								</Box>
								<FormControl isDisabled={editFeedback.isPending || detail.isFetching || detail.isError}>
									<FormLabel htmlFor="feedback-detail-processed">처리 상태</FormLabel>
									<Select id="feedback-detail-processed" value={String(isProcessed)} onChange={(event) => { setProcessed(event.target.value === "true"); editFeedback.reset(); }}>
										<option value="false">미처리</option><option value="true">처리 완료</option>
									</Select>
								</FormControl>
								<Text fontSize="sm">Discord 알림: {feedbackNotifications[feedback.notificationStatus] ?? feedback.notificationStatus}</Text>
								<Text fontSize="sm" color="gray.500">처리 상태를 바꿔도 알림 전송에는 영향을 주지 않습니다.</Text>
							</>
						)}
						{editFeedback.isError && <Alert status="error"><AlertIcon /><Box>{editFeedback.error.message} 저장 여부가 불확실하면 목록을 새로고침해 확인해 주세요.</Box></Alert>}
					</Stack>
				</ModalBody>
				<ModalFooter gap={3}>
					<Button onClick={close} isDisabled={editFeedback.isPending}>닫기</Button>
					<Button colorScheme="blue" isLoading={editFeedback.isPending} loadingText="저장 중"
						isDisabled={!feedback || detail.isError || detail.isFetching || isProcessed === feedback.isProcessed}
						onClick={() => { if (feedback && !editFeedback.isPending) editFeedback.mutate({ id, isProcessed }); }}>
						저장
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
