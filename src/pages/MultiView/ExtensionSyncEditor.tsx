import React, { useState, useEffect } from "react";
import { VStack, HStack, Flex, Text, Checkbox, Avatar, Badge, Button, Box, Divider, Spacer } from "@chakra-ui/react";
import { v4 } from "uuid"; // 💡 v4() 사용을 위한 임포트
import { MultiViewData } from "../../lib/types";
import { ChannelData } from "../MultiView";

interface ExtensionSyncEditorProps {
	data: MultiViewData[];
	customStreams: MultiViewData[];
	setCustomStreams: React.Dispatch<React.SetStateAction<MultiViewData[]>>;
	channelDataFromExtension: ChannelData[];
	setChannelDataFromExtension: React.Dispatch<React.SetStateAction<ChannelData[]>>;
	onClose: () => void;
}

export function ExtensionSyncEditor({
	data,
	customStreams,
	setCustomStreams,
	channelDataFromExtension,
	setChannelDataFromExtension,
	onClose,
}: ExtensionSyncEditorProps) {
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	const stellarIds = new Set(data.map((member) => member.chzzkId));
	const combinedStreamsMap = new Map();

	// 기존 데이터 세팅
	customStreams.forEach((stream) => {
		if (stellarIds.has(stream.chzzkId)) return;

		combinedStreamsMap.set(stream.chzzkId, {
			streamId: stream.chzzkId,
			name: stream.channelName,
			channelImageUrl: stream.channelImageUrl,
			liveTitle: stream.liveTitle,
			openLive: stream.openLive,
			liveCategoryValue: stream.liveCategoryValue,
			isAlreadyExist: true,
			originalData: stream,
		});
	});

	// 확프 데이터 덮어쓰기
	channelDataFromExtension.forEach((stream) => {
		if (stellarIds.has(stream.streamId)) return;

		if (combinedStreamsMap.has(stream.streamId)) {
			const existing = combinedStreamsMap.get(stream.streamId);
			combinedStreamsMap.set(stream.streamId, {
				...existing,
				liveTitle: stream.liveTitle,
				openLive: stream.openLive,
				liveCategoryValue: stream.liveCategoryValue,
			});
		} else {
			combinedStreamsMap.set(stream.streamId, {
				...stream,
				isAlreadyExist: false,
			});
		}
	});

	const allAvailableStreams = Array.from(combinedStreamsMap.values());

	useEffect(() => {
		if (allAvailableStreams.length > 0 && selectedIds.length === 0) {
			setSelectedIds(allAvailableStreams.map((ch) => ch.streamId));
		}
	}, [channelDataFromExtension]);

	// 본 컴포넌트가 언마운트 될때 내부 state를 초기화
	useEffect(() => {
		return () => {
			setSelectedIds([]);
		};
	}, []);

	const handleToggleCheck = (streamId: string) => {
		setSelectedIds((prev) => (prev.includes(streamId) ? prev.filter((id) => id !== streamId) : [...prev, streamId]));
	};

	const handleToggleAll = () => {
		if (selectedIds.length === allAvailableStreams.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(allAvailableStreams.map((ch) => ch.streamId));
		}
	};

	const openLiveSort = <T extends { openLive?: boolean }>(a: T, b: T): number => {
		if (a.openLive === b.openLive) return 0;
		return a.openLive ? -1 : 1;
	};

	const handleSave = () => {
		const newCustomStreams: MultiViewData[] = selectedIds
			.map((id) => {
				const streamData = combinedStreamsMap.get(id);

				if (streamData.originalData) {
					return streamData.originalData;
				}

				return {
					name: streamData.name,
					channelName: streamData.name,
					channelImageUrl: streamData.channelImageUrl,
					chzzkId: streamData.streamId,
					uuid: v4(),
					liveTitle: streamData.liveTitle || "오프라인",
					liveImageUrl: null,
					liveCategoryValue: streamData.liveCategoryValue,
					openLive: streamData.openLive,
					openDate: undefined,
					isCustom: true,
					party: null,
				};
			})
			.sort(openLiveSort);

		setCustomStreams(newCustomStreams);
		onClose();
	};

	const newStreams = allAvailableStreams.filter((stream) => !stream.isAlreadyExist);
	const existingStreams = allAvailableStreams.filter((stream) => stream.isAlreadyExist);

	existingStreams.sort(openLiveSort);

	const displayStreams = [...newStreams, ...existingStreams];

	return (
		<VStack spacing={2} align="stretch" w="full">
			{/* 상단 컨트롤 툴바 */}
			<HStack w="full" py={1}>
				<Checkbox
					isChecked={allAvailableStreams.length > 0 && selectedIds.length === allAvailableStreams.length}
					isIndeterminate={selectedIds.length > 0 && selectedIds.length < allAvailableStreams.length}
					onChange={handleToggleAll}
				>
					<Text fontSize="sm" fontWeight="bold">
						전체 선택 ({selectedIds.length}/{allAvailableStreams.length})
					</Text>
				</Checkbox>
				<Spacer />
			</HStack>

			{/* 스트리머 리스트 에디터 영역 */}
			<VStack spacing={3} align="stretch" maxH="350px" overflowY="auto" px={1} py={1}>
				{displayStreams.length === 0 ? (
					<Flex justify="center" align="center" py={10} direction="column">
						<Text color="gray.500" fontSize="sm">
							가져온 동기화 데이터가 없습니다.
						</Text>
					</Flex>
				) : (
					displayStreams.map((stream) => {
						const isChecked = selectedIds.includes(stream.streamId);

						return (
							<Flex
								key={stream.streamId}
								p={3}
								bg="rgba(255,255,255,0.05)"
								borderRadius="md"
								align="center"
								border="1px solid"
								borderColor={isChecked ? "whiteAlpha.500" : "transparent"}
								_hover={{ bg: "rgba(255,255,255,0.08)" }}
								cursor="pointer"
								onClick={() => handleToggleCheck(stream.streamId)}
							>
								{/* 체크박스 */}
								<Checkbox
									isChecked={isChecked}
									// 클릭 이벤트는 부모 Flex가 처리하도록 위임하고 꼬임 방지
									pointerEvents="none"
									onChange={() => {}}
									mr={3}
								/>

								{/* 프로필 이미지 */}
								<Avatar src={`${stream.channelImageUrl}?type=f40_40_na`} name={stream.name} size="sm" mr={3} />

								{/* 채널 정보 */}
								<Box flex={1} overflow="hidden">
									<HStack spacing={2}>
										<Text fontWeight="semibold" fontSize="sm" isTruncated>
											{stream.name}
										</Text>
										{/* 기존 등록 데이터 배지 */}
										{stream.isAlreadyExist && (
											<Badge colorScheme="teal" variant="solid" fontSize="10px">
												기존 등록됨
											</Badge>
										)}
										{stream.openLive && (
											<Badge colorScheme="red" fontSize="10px">
												LIVE
											</Badge>
										)}
									</HStack>
									<Text fontSize="xs" color="gray.400" isTruncated>
										{stream.liveTitle || "오프라인"} {/* 💡 피드백 4: 카테고리 뺌 */}
									</Text>
								</Box>
							</Flex>
						);
					})
				)}
			</VStack>

			<HStack w="full" justify="flex-end" pt={1} pb={1} spacing={2}>
				<Button
					size="sm"
					variant="outline"
					colorScheme="red"
					onClick={() => {
						setChannelDataFromExtension([]);
						onClose();
					}}
				>
					취소
				</Button>
				<Button size="sm" colorScheme="blue" onClick={handleSave} isDisabled={selectedIds.length === 0}>
					등록
				</Button>
			</HStack>
		</VStack>
	);
}
