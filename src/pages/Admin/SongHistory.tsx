import { CustomLink } from "@/components/Link";
import { displayPriority } from "@/lib/functions/display";
import { createHistoryId, formatDateToYYYYMMDD, formatTime } from "@/lib/functions/etc";
import { normalizeKeyword } from "@/lib/functions/normalized";
import { youtube } from "@/lib/functions/platforms";
import { useServerMutation, useServerQuery } from "@/lib/hooks/useServerApi";
import { type SongHistory as SongHistoryType, Tag as TagType } from "@/lib/types";
import {
	Badge,
	Box,
	Button,
	CloseButton,
	Flex,
	HStack,
	Heading,
	Icon,
	IconButton,
	Input,
	InputGroup,
	InputRightElement,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Stack,
	Text,
	VStack,
	useToast,
} from "@chakra-ui/react";
import { Token } from "@chakra-ui/styled-system/dist/types/utils/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import * as CSS from "csstype";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiFolder, FiPlus } from "react-icons/fi";
import { MdDelete, MdKeyboardArrowDown, MdKeyboardArrowUp, MdOpenInNew } from "react-icons/md";
import { VscWarning } from "react-icons/vsc";
import { DefaultResponseData } from "../../lib/functions/fetch";
import useColor from "../../lib/hooks/useColor";
import { Genre } from "./Songbook";
import { AdditionalInputValue } from "./Video/Details";

interface MinifiedSongData {
	i: number;
	tl: string;
	a: string;
	g: Genre;
	iof: boolean;
	ia: boolean;
}
interface SongHistory extends SongHistoryType {
	title?: string;
	artist?: string;
}

//? id, sungAt, youtubeVideoId, start, end, memo, hamkubby_id, historyId, priority, isActive
//TODO: historyId, hamkubby_id는 필수값. 대부분의 값에 대해 필터기능
//TODO: 기본적으로 sungAt 순서에 따라 최신순 정렬, 같은 sungAt 끼리 묶어 리스트업
//TODO: id 정렬 추가
export function SongHistoryComponent() {
	const [historyData, setHistoryData] = useState<SongHistory[]>([]);

	// 필터 상태
	const [searchQuery, setSearchQuery] = useState("");
	const [filterSungAt, setFilterSungAt] = useState<string[]>([]);

	// 모달 (에디터) 상태
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingHistory, setEditingHistory] = useState<SongHistory | null>(null);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);

	// MARK: - Hooks
	const toast = useToast();
	const { bgCard, borderColor, headerBg, fieldHoverBgColor } = useColor();
	const getAllSongbookData = useServerQuery<DefaultResponseData<MinifiedSongData[]>>({
		version: "admin",
		api: "/songbook/minify",
	});

	const getAllHistories = useServerQuery<DefaultResponseData<SongHistory[]>>({
		version: "admin",
		api: "/histories",
	});

	const createHistory = useServerMutation<DefaultResponseData<SongHistory>, SongHistory, "admin">({
		version: "admin",
		api: "/history",
		method: "POST",
	});
	const editHistory = useServerMutation<void, { id: number }, "admin">({
		version: "admin",
		api: "/history/:id",
		method: "PATCH",
	});
	const deleteHistory = useServerMutation<void, { id: number }, "admin">({
		version: "admin",
		api: "/history/:id",
		method: "DELETE",
	});

	const songbookMap = useMemo(() => {
		const data = getAllSongbookData.data?.data || [];
		return new Map(data.map((item) => [item.i, item]));
	}, [getAllSongbookData]);

	// MARK: - filteredData
	const filteredData = useMemo(() => {
		return historyData
			.filter((his) => {
				const songbookData = songbookMap.get(his.hamkubby_id || -1);

				const normalizedQuery = normalizeKeyword(searchQuery);
				const matchSearch =
					normalizeKeyword(songbookData?.tl || "").includes(normalizedQuery) ||
					normalizeKeyword(songbookData?.a || "").includes(normalizedQuery);
				return matchSearch;
			})
			.sort((a, b) => (b.id || 0) - (a.id || 0));
	}, [historyData, searchQuery]);

	// sungAt과 youtubeId가 일치하지 않는 개체가 있는 경우를 위한 set
	const invalidSungAtSet = useMemo(() => {
		const videoIdGroupMap = new Map<string, Set<string | null>>();

		filteredData.forEach((his) => {
			const sungAt = his.sungAt;
			if (!sungAt) return;

			if (!videoIdGroupMap.has(sungAt)) {
				videoIdGroupMap.set(sungAt, new Set());
			}

			const videoId = his.youtubeVideoId || null;
			videoIdGroupMap.get(sungAt)!.add(videoId);
		});

		const invalidSet = new Set<string>();

		videoIdGroupMap.forEach((videoIds, sungAt) => {
			if (videoIds.size > 1) {
				invalidSet.add(sungAt);
			}
		});

		return invalidSet;
	}, [filteredData]);

	const parentRef = useRef<HTMLDivElement>(null);

	// 행 클릭 시 상세 모달 열기
	const handleRowClick = (index: number, id: number | undefined) => {
		if (!id) {
			toast({ status: "error", description: "ID가 존재하지 않습니다! 코드 또는 데이터에 이상이 있는 경우입니다!" });
			return;
		}
		const currentVideoData = filteredData[index];

		setEditingHistory({
			...currentVideoData,
			id: id,
			// isInheritChannelId: !!currentVideoData.inheritChannelId,
			// inheritChannelId: stellarData.find((s) => s.playlistIdForMusic === currentVideoData.ownerId)?.youtubeId || "",
		});
		setEditingIndex(index);
		setIsModalOpen(true);
	};

	const handleRowDelete = (id?: number) => {
		if (!id) return;
		if (confirm(`${id}번 데이터를 정말로 삭제하시겠습니까?`))
			deleteHistory.mutate(
				{ id },
				{
					onSuccess: () => {
						setHistoryData((prev) => {
							const idx = prev.findIndex((p) => p.id === id);
							prev.splice(idx, 1);
							return prev;
						});
					},
					onError: () => {
						toast({ description: "데이터 삭제 중 서버 에러 발생" });
					},
				},
			);
	};

	// 페이지 업/다운 핸들러
	const isPageStart = editingIndex === 0;
	const isPageEnd = editingIndex === filteredData.length - 1;

	const handleModalPageUp = () => {
		if (editingIndex === null || isPageStart) return;
		const nextIndex = editingIndex - 1;
		setEditingIndex(nextIndex);
		const prev = filteredData[nextIndex];
		setEditingHistory({ ...prev, id: prev.id });
	};
	const handleModalPageDown = () => {
		if (editingIndex === null || isPageEnd) return;
		const nextIndex = editingIndex + 1;
		setEditingIndex(nextIndex);
		const prev = filteredData[nextIndex];
		setEditingHistory({ ...prev, id: prev.id });
	};

	// 버튼 핸들러
	const handleAddNewVideo = () => {
		const newSong: SongHistory = {
			sungAt: formatDateToYYYYMMDD(new Date().toDateString()),
			historyId: createHistoryId(),
			youtubeVideoId: "",
			start: 0,
			end: null,
			memo: "",
			priority: 0,
			isActive: true,
		};
		setEditingHistory(newSong);
		setEditingIndex(-1); // -1은 신규 추가를 의미
		setIsModalOpen(true);
	};

	// 모달 내 저장 버튼
	const handleSaveEdit = () => {
		if (!editingHistory) return;

		if (editingIndex === -1) {
			// 신규 추가
			createHistory.mutate(editingHistory, {
				onSuccess: (data) => {
					setHistoryData((prev) => [...prev, data.data]);
					setIsModalOpen(false);
					getAllHistories.refetch();
				},
				onError: () => {
					toast({ description: "영상 추가 중 서버 에러 발생" });
				},
			});
		} else {
			// 기존 데이터 수정
			editHistory.mutate(editingHistory as Required<SongHistory>, {
				onSuccess: () => {
					const targetOriginalStellar = filteredData[editingIndex!];
					setHistoryData((prev) =>
						prev.map((s) => {
							if (s === targetOriginalStellar) {
								return { ...editingHistory };
							}
							return s;
						}),
					);
					setIsModalOpen(false);
					getAllHistories.refetch();
				},
				onError: () => {
					toast({ description: "영상 편집 중 서버 에러 발생" });
				},
			});
		}
	};

	// 태그 변화 핸들러
	const onChangeTags = (tags: TagType[]) => {
		setEditingHistory((prev) => {
			if (!prev) return prev;
			return { ...prev, tags };
		});
	};

	// Details 변화 핸들러
	const onChangeDetails = (details: AdditionalInputValue[]) => {
		if (!editingHistory || editingIndex === null) return;
		setEditingHistory({
			...editingHistory,
			// details: details.map((dt) => ({
			// 	...dt,
			// 	id: filteredData[editingIndex].id,
			// 	viewCount: "",
			// 	likeCount: "",
			// 	countUpdatedAt: "",
			// 	statistics: [],
			// 	youtube_video_detail_id: null,
			// 	youtube_video_id: null,
			// })) as VideoDetail[],
		});
	};

	// 필터 핸들러
	// const onChangeStellarsFilter = (playlistIds: (string | number)[]) => {
	// 	setFilterStellar(playlistIds.map(String));
	// };
	// const onChangeTagsFilter = (tagIds: (string | number)[]) => {
	// 	setFilterTag(tagIds.map(String));
	// };

	useEffect(() => {
		if (getAllHistories.data?.data) setHistoryData(getAllHistories.data.data);
	}, [getAllHistories.data?.data]);
	// --- [가상화 스크롤 설정] ---
	const rowVirtualizer = useVirtualizer({
		count: filteredData.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 64,
		overscan: 10,
	});
	const TABLE_WIDTHS: { [key: string]: Token<CSS.Property.Width | number, "sizes"> } = {
		id: "40px",
		sungAt: "80px",
		videoId: "140px",
		playbackRange: "180px",
		memo: "120px",
		priority: "60px",
		controlPanel: "80px",
	};

	return (
		<Box>
			<Box mb={8}>
				<Heading size="lg" mb={2}>
					영상 데이터 관리
				</Heading>
				<Text color="gray.500" fontSize="sm">
					스텔라들의 영상 데이터를 관리합니다.
				</Text>
			</Box>
			<Flex gap={2}>
				<InputGroup w="240px">
					<Input
						placeholder="제목을 검색하세요.."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
						}}
						onKeyDown={(e) => {
							e.key === "Escape" && setSearchQuery("");
						}}
					/>
					{searchQuery.length !== 0 ? (
						<InputRightElement>
							<CloseButton onClick={() => setSearchQuery("")} />
						</InputRightElement>
					) : null}
				</InputGroup>
				{/* <FilterPanel
					tags={getAllTags.data?.data}
					onChangeStellars={onChangeStellarsFilter}
					onChangeTags={onChangeTagsFilter}
				/> */}
			</Flex>
			<Flex
				gap={4}
				mb={6}
				flexWrap="wrap"
				bg={bgCard}
				p={4}
				rounded="xl"
				shadow="sm"
				border={`1px solid ${borderColor}`}
			>
				<Flex flex={1} justify="flex-end" gap={2}>
					<Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNewVideo} isDisabled>
						추가
					</Button>
				</Flex>
			</Flex>
			<Stack>
				<Box bg={bgCard} rounded="xl" shadow="sm" border={`1px solid ${borderColor}`} overflow="hidden">
					{/* 테이블 헤더 */}
					<Flex
						bg={headerBg}
						borderBottom={`1px solid ${borderColor}`}
						px={4}
						py={3}
						pr={6}
						fontWeight="bold"
						fontSize="sm"
					>
						{/* id, sungAt, youtubeVideoId, start, end, memo, hamkubby_id, historyId, priority, isActive */}
						<Box w={TABLE_WIDTHS.id}>ID</Box>
						<Box w={TABLE_WIDTHS.sungAt} textAlign={"center"}>
							날짜
						</Box>
						<Box w={TABLE_WIDTHS.videoId} textAlign={"center"}>
							유튜브 ID
						</Box>
						<Box flex={1} ml={2}>
							곡 정보 / 메모
						</Box>
						<Box w={TABLE_WIDTHS.playbackRange} textAlign={"center"}>
							재생 구간
						</Box>
						<Box w={TABLE_WIDTHS.priority} textAlign={"center"}>
							중요도
						</Box>
						<Box w={TABLE_WIDTHS.controlPanel} textAlign={"center"}>
							조작
						</Box>
					</Flex>
					{filteredData.length === 0 ? (
						<Flex height="240px" justify="center" align="center">
							<Text color="gray">데이터 없음</Text>
						</Flex>
					) : null}
					{/* 가상화 컨테이너 */}
					<Box ref={parentRef} h="384px" overflowY="scroll">
						<Box position="relative" h={`${rowVirtualizer.getTotalSize()}px`} w="100%">
							{/* 가상화된 행 렌더링 */}
							{rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
								const his = filteredData[virtualRow.index];
								const isFaded = !his.isActive;
								const songbookData = songbookMap.get(his.hamkubby_id || -1);
								const isInvalid = his.sungAt ? invalidSungAtSet.has(his.sungAt) : false;

								return (
									<Flex
										key={virtualRow.key}
										position="absolute"
										top={0}
										left={0}
										w="100%"
										transform={`translateY(${virtualRow.start}px)`}
										h={`${virtualRow.size}px`}
										px={4}
										bg={index % 2 ? "gray.50" : undefined}
										opacity={isFaded ? 0.5 : 1}
										textDecoration={isFaded ? "line-through" : "none"}
										align="center"
										borderBottom={`1px solid ${borderColor}`}
										cursor="pointer"
										_hover={{ bg: fieldHoverBgColor }}
										onClick={() => handleRowClick(virtualRow.index, his.id)}
									>
										{/* ID */}
										<Box w={TABLE_WIDTHS.id}>{his.id}</Box>
										{/* 날짜 */}
										<Box w={TABLE_WIDTHS.sungAt} textAlign="center" fontSize="sm">
											{formatDateToYYYYMMDD(his.sungAt).slice(2) || "날짜 미상"}
										</Box>
										{/* 비디오 ID */}
										<Box w={TABLE_WIDTHS.videoId} textAlign="center" fontSize="sm" position="relative">
											{isInvalid ? (
												<Icon
													as={VscWarning}
													color="orange.500"
													boxSize={5}
													position="absolute"
													top="calc(50% - 10px)"
													left="calc(50% - 10px)"
												/>
											) : null}
											{his.youtubeVideoId}
										</Box>
										{/* 곡 정보 / 메모 */}
										<HStack flex={1} ml={2} align={"center"} justify={"flex-start"} gap={"2px"}>
											<VStack gap={"2px"}>
												<Text w="300px" noOfLines={1} fontWeight={"bold"}>
													{songbookData?.tl}
												</Text>
												<HStack w="100%">
													<Badge
														ml={1}
														colorScheme={
															songbookData?.g === "K-POP" ? "green" : songbookData?.g === "J-POP" ? "blue" : "yellow"
														}
													>
														{songbookData?.g}
													</Badge>
													<Text color={"gray.500"} fontSize="sm">
														{songbookData?.a}
													</Text>
												</HStack>
											</VStack>
											<HStack>
												<Text fontSize="sm">{his.memo ? `📝 ${his.memo}` : ""}</Text>
											</HStack>
										</HStack>
										{/* 재생 구간 */}
										<Box w={TABLE_WIDTHS.playbackRange} fontSize="sm" textAlign="center">
											{`${formatTime(his.start)}${his.end ? " ~ " + formatTime(his.end) : ""}`}
										</Box>
										{/* 중요도 */}
										<Flex w={TABLE_WIDTHS.priority} justify={"center"} fontSize="sm">
											{displayPriority(his.priority)}
										</Flex>
										{/* 조작 */}
										<Flex w={TABLE_WIDTHS.controlPanel} justify={"center"} gap={"2px"}>
											{his.youtubeVideoId ? (
												<IconButton
													as={CustomLink}
													aria-label="Open History"
													size="sm"
													variant={"outline"}
													colorScheme="blackAlpha"
													href={youtube.videoUrl(his.youtubeVideoId, his.start)}
													target="_blank"
													onClick={(e) => {
														e.stopPropagation();
													}}
												>
													<MdOpenInNew />
												</IconButton>
											) : null}

											<IconButton
												aria-label="Delete History"
												size="sm"
												variant={"outline"}
												colorScheme="red"
												onClick={(e) => {
													e.stopPropagation();
													handleRowDelete(his.id);
												}}
											>
												<MdDelete />
											</IconButton>
										</Flex>
									</Flex>
								);
							})}
						</Box>
					</Box>

					{/* 이력 편집 모달 */}
					<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="4xl">
						<ModalOverlay />
						<ModalContent>
							<ModalHeader pb={1}>
								<HStack gap={1}>
									<Text as="span" mr={4}>
										{editingIndex === -1 ? "새 영상 추가" : "영상 상세 정보 수정"}
									</Text>
									<IconButton
										size="sm"
										variant={"outline"}
										aria-label="Prev Video"
										onClick={handleModalPageUp}
										isDisabled={isPageStart}
									>
										<MdKeyboardArrowUp />
									</IconButton>
									<IconButton
										size="sm"
										variant={"outline"}
										aria-label="Prev Video"
										onClick={handleModalPageDown}
										isDisabled={isPageEnd}
									>
										<MdKeyboardArrowDown />
									</IconButton>
								</HStack>
								<Text fontSize="xs" color="gray" fontWeight="400">
									{editingHistory?.id || ""}
								</Text>
							</ModalHeader>

							<ModalCloseButton />

							{editingHistory && (
								<ModalBody>
									<HStack flexDirection={["column", "column", "row"]} align={"stretch"}>
										<VStack spacing={2} align="stretch" flex={1} width={["100%", "100%", "auto"]}>
											{/* 상단: 제목 및 썸네일, 태그 */}
											<Flex gap={4}>
												{/* <VStack flex={1}>
													<FormControl>
														<FormLabel fontSize="sm">제목</FormLabel>
														<Input size="sm" value={editingHistory.title || ""} isDisabled />
													</FormControl>
													<FormControl>
														<FormLabel fontSize="sm">대체 제목</FormLabel>
														<Input
															size="sm"
															value={editingHistory.titleAlias || ""}
															onChange={(e) => setEditingHistory({ ...editingHistory, titleAlias: e.target.value })}
														/>
													</FormControl>
													<FormControl>
														<TagInputAutocomplete
															data={editingHistory.tags}
															tagData={getAllTags.data?.data}
															size="sm"
															wrapperProps={{ maxW: "512px" }}
															onChangeTags={onChangeTags}
														/>
													</FormControl>
												</VStack>
												<Link href={youtube.videoUrl(editingHistory.videoId) || ""} isExternal>
													<ImageV2
														src={
															getThumbnails(editingHistory.thumbnails).maxres?.url ||
															getThumbnails(editingHistory.thumbnails).standard?.url ||
															getThumbnails(editingHistory.thumbnails).high?.url ||
															getThumbnails(editingHistory.thumbnails).medium?.url ||
															""
														}
														display="block"
														borderRadius={"4px"}
														mx="auto"
														w="320px"
														maxH="240px"
														objectPosition="center"
													/>
												</Link> */}
											</Flex>

											{/* 하단: Details 이외 체크박스, 기록 칸 */}
											<Flex gap={3}>
												<VStack flex={3}>
													{/* <Card variant={"outline"} height="fit-content" width="100%">
														<CardBody display="flex" p={3} flexDirection="row">
															<DetailsEditor data={editingHistory.details} onChangeDetails={onChangeDetails} />
														</CardBody>
													</Card>
													<Card variant={"outline"} height="fit-content" width="100%">
														<CardBody display="flex" p={3} flexDirection="row">
															<VStack flex={1} align={"flex-start"}>
																<Checkbox
																	size="sm"
																	isChecked={editingHistory.isInheritChannelId}
																	onChange={(e) =>
																		setEditingHistory({ ...editingHistory, isInheritChannelId: e.target.checked })
																	}
																>
																	채널 ID 상속(다른 채널에 업로드 된 경우 사용합니다)
																</Checkbox>
																<Checkbox
																	size="sm"
																	isChecked={editingHistory.isActive}
																	onChange={(e) => setEditingHistory({ ...editingHistory, isActive: e.target.checked })}
																>
																	활성화
																</Checkbox>
															</VStack>
														</CardBody>
													</Card> */}
												</VStack>
												{/* 기록 */}
												{/* <Card flex={2} variant={"outline"} height="fit-content">
													<CardBody display="flex" p={3} flexDirection="row">
														<Box flex={1}>
															<Heading fontSize="md" fontWeight={"600"}>
																기록
															</Heading>
															<Divider marginBlock={2} />
															<Flex align={"center"} gap={2}>
																<Icon boxSize="14px" as={FaEye} />
																<Text display="inline-block" fontSize="xs">
																	{numberToLocaleString(editingHistory.viewCount)}
																</Text>
															</Flex>
															<Flex align={"center"} gap={2}>
																<Icon boxSize="14px" as={AiFillLike} />
																<Text display="inline-block" fontSize="xs">
																	{numberToLocaleString(editingHistory.likeCount)}
																</Text>
															</Flex>
															{editingHistory.countUpdatedAt && (
																<Flex align={"center"} gap={2}>
																	<Icon boxSize="14px" as={IoRefreshCircle} />
																	<Text display="inline-block" fontSize="xs">
																		{formatUtcToKst(editingHistory.countUpdatedAt) || ""}
																	</Text>
																</Flex>
															)}
															<Flex align={"center"} gap={2} pt={1}>
																<Icon boxSize="14px" as={MdPublish} />
																<Text display="inline-block" fontSize="xs">
																	{formatUtcToKst(editingHistory.publishedAt) || ""}
																</Text>
															</Flex>
														</Box>
													</CardBody>
												</Card> */}
											</Flex>
										</VStack>
									</HStack>
								</ModalBody>
							)}

							<ModalFooter>
								<Button variant="ghost" mr={3} onClick={() => setIsModalOpen(false)}>
									취소
								</Button>
								<Button
									colorScheme="blue"
									onClick={handleSaveEdit}
									disabled={editHistory.isPending || createHistory.isPending}
								>
									적용하기
								</Button>
							</ModalFooter>
						</ModalContent>
					</Modal>
				</Box>
			</Stack>
		</Box>
	);
}
