import { type KeyboardEvent } from "react";
import { CustomLink } from "@/components/Link";
import { displayPriority } from "@/lib/functions/display";
import { createHistoryId, formatDateToYYYYMMDD, formatTime, parseTimeToSeconds } from "@/lib/functions/etc";
import { normalizeKeyword } from "@/lib/functions/normalized";
import { youtube } from "@/lib/functions/platforms";
import { useServerMutation, useServerQuery } from "@/lib/hooks/useServerApi";
import { type SongHistory as SongHistoryType } from "@/lib/types";
import {
	Badge,
	Box,
	Button,
	Checkbox,
	CloseButton,
	Divider,
	Flex,
	FormControl,
	FormLabel,
	Grid,
	HStack,
	Heading,
	Icon,
	IconButton,
	Input,
	InputGroup,
	InputRightElement,
	List,
	ListItem,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	NumberDecrementStepper,
	NumberIncrementStepper,
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	Spacer,
	Stack,
	Switch,
	Text,
	VStack,
	useToast,
} from "@chakra-ui/react";
import { Token } from "@chakra-ui/styled-system/dist/types/utils/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import * as CSS from "csstype";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiPlus } from "react-icons/fi";
import { MdDelete, MdKeyboardArrowDown, MdKeyboardArrowUp, MdOpenInNew } from "react-icons/md";
import { VscWarning } from "react-icons/vsc";
import { DefaultResponseData } from "../../lib/functions/fetch";
import useColor from "../../lib/hooks/useColor";
import { Genre } from "./Songbook";

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

	const [isTimeFormat, setIsTimeFormat] = useState<boolean>(true);
	const [timeStrStart, setTimeStrStart] = useState<string>("");
	const [timeStrEnd, setTimeStrEnd] = useState<string>("");

	const [songbookSelectorValue, setSongbookSelectorValue] = useState("");
	const [songbookSelectorObject, setSongbookSelectorObject] = useState<{ i: number; tl: string; a: string }>({
		i: -1,
		tl: "",
		a: "",
	});
	const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
	const [highlightedIndex, setHighlightedIndex] = useState(0);

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

	const getSongbookDataWithHistory = useMemo<MinifiedSongData | undefined>(() => {
		if (!editingHistory) return undefined;
		return songbookMap.get(editingHistory.hamkubby_id || -1);
	}, [editingHistory, songbookMap]);

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

		setTimeStrStart(isTimeFormat ? formatTime(currentVideoData.start) || "00:00" : String(currentVideoData.start || 0));
		setTimeStrEnd(
			isTimeFormat
				? formatTime(currentVideoData.end)
				: currentVideoData.end !== undefined && currentVideoData.end !== null
					? String(currentVideoData.end)
					: "",
		);

		setEditingHistory({
			...currentVideoData,

			id: id,
			sungAt: formatDateToYYYYMMDD(currentVideoData.sungAt || ""),
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
	const handleAddNewHistory = () => {
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
		setTimeStrStart("00:00");
		setTimeStrEnd("");
		setIsModalOpen(true);
	};

	// 모달 내 저장 버튼
	const handleSaveEdit = () => {
		if (!editingHistory) return toast({ description: "정상적인 접근이 아닙니다. 처음부터 다시 시도해주세요." });

		if (editingHistory.sungAt === "") return toast({ description: "날짜가 입력되지 않았습니다." });

		// 로컬 텍스트 상태(timeStr)를 파싱하여 modalData의 실제 start, end(숫자)로 변환
		let finalStart = 0;
		let finalEnd: number | null = null;

		if (isTimeFormat) {
			finalStart = parseTimeToSeconds(timeStrStart) ?? 0;
			finalEnd = parseTimeToSeconds(timeStrEnd);
		} else {
			finalStart = Number(timeStrStart) || 0;
			finalEnd = timeStrEnd.trim() !== "" ? Number(timeStrEnd) : null;
		}

		const historyToSave = {
			...editingHistory,
			start: finalStart,
			end: finalEnd,
		};

		if (editingIndex === -1) {
			// 신규 추가
			createHistory.mutate(historyToSave, {
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
			editHistory.mutate(historyToSave as Required<SongHistory>, {
				onSuccess: () => {
					const targetOriginalHistory = filteredData[editingIndex!];
					setHistoryData((prev) =>
						prev.map((s) => {
							if (s === targetOriginalHistory) {
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

	// MARK: - time text handler
	const handleChangeTimeText =
		(setState: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
			const rawValue = e.target.value;

			// 한글 입력에 의한 글자 씹힘 방지
			if ((e.nativeEvent as any).isComposing) {
				setState(rawValue);
				return;
			}

			// 조합이 끝난 문자열에서 순수 숫자만 추출
			const nums = rawValue.replace(/[^0-9]/g, "");
			let finalValue = "";

			if (!isTimeFormat) {
				finalValue = nums;
				// setIsError(finalValue !== "" && !SEC_REGEX.test(finalValue));
			} else {
				const limitedNums = nums.slice(0, 6);
				const len = limitedNums.length;

				// 00:00:00 포맷팅
				if (len <= 2) {
					finalValue = limitedNums; // 예: 12
				} else if (len <= 4) {
					// 예: 123 -> 1:23 / 1234 -> 12:34
					finalValue = `${limitedNums.slice(0, len - 2)}:${limitedNums.slice(len - 2)}`;
				} else {
					// 예: 12345 -> 1:23:45 / 123456 -> 12:34:56
					finalValue = `${limitedNums.slice(0, len - 4)}:${limitedNums.slice(len - 4, len - 2)}:${limitedNums.slice(len - 2)}`;
				}

				// 특정 자리에서만 콜론 입력을 제한
				if (rawValue.endsWith(":") && (len === 2 || len === 4)) {
					finalValue += ":";
				}

				// 에러 검증
				// if (finalValue === "" || finalValue.length < 8) {
				// 	setIsError(false);
				// } else {
				// 	setIsError(!TIME_REGEX.test(finalValue));
				// }
			}

			setState(finalValue);
		};

	const handleToggleFormat = (checked: boolean) => {
		setIsTimeFormat(checked);

		// 현재 입력되어 있는 값을 기반으로 즉시 포맷팅 스왑
		const currentStartSec = isTimeFormat ? parseTimeToSeconds(timeStrStart) : Number(timeStrStart);
		const currentEndSec = isTimeFormat ? parseTimeToSeconds(timeStrEnd) : timeStrEnd ? Number(timeStrEnd) : undefined;

		if (checked) {
			// 초 -> MM:SS 전환
			setTimeStrStart(formatTime(currentStartSec) || "00:00");
			setTimeStrEnd(formatTime(currentEndSec));
		} else {
			// MM:SS -> 초 전환
			setTimeStrStart(String(currentStartSec || 0));
			setTimeStrEnd(currentEndSec !== undefined ? String(currentEndSec) : "");
		}
	};

	// Mark: - custom selector handler
	const availableOptions = useMemo(
		() =>
			getAllSongbookData.data?.data.filter(
				(item) => item.tl.toLowerCase().includes(songbookSelectorObject.tl.toLowerCase()),
				// &&
				// !selectedTags.some((selected) => selected.id === item.id),
			) || [],
		[getAllSongbookData.data?.data, songbookSelectorObject],
	);

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (!isSelectorOpen && songbookSelectorObject) setIsSelectorOpen(true);

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setHighlightedIndex((prev) => Math.min(prev + 1, availableOptions.length - 1));
				break;
			case "ArrowUp":
				e.preventDefault();
				setHighlightedIndex((prev) => Math.max(prev - 1, 0));
				break;
			case "Enter": {
				e.preventDefault();
				const available = availableOptions.find((o) => o.i === highlightedIndex);
				if (isSelectorOpen && available) {
					setSongbookSelectorObject(available);
				}
				break;
			}
			// case "Backspace":
			// 	// 입력창이 비어있을 때 백스페이스 누르면 맨 마지막 태그 삭제
			// 	if (!songbookSelectorValue && selectedTags.length > 0) {
			// 		const nextTags = [...selectedTags];
			// 		nextTags.pop();
			// 		setSelectedTags(nextTags);
			// 		onChangeTags?.(nextTags);
			// 	}
			// 	break;
			case "Escape":
				setIsSelectorOpen(false);
				break;
			default:
				break;
		}
	};

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
					<Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNewHistory}>
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
													<Text w="240px" color={"gray.500"} fontSize="sm">
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
					<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="2xl">
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
									{editingHistory?.id || ""} - {editingHistory?.historyId || ""}
								</Text>
							</ModalHeader>

							<ModalCloseButton />

							{editingHistory && (
								<ModalBody>
									<HStack flexDirection={["column", "column", "row"]} align={"stretch"}>
										<VStack spacing={2} align="stretch" flex={1} width={["100%", "100%", "auto"]}>
											{/* 상단: 노래 정보 */}
											{getSongbookDataWithHistory && (
												<>
													<VStack gap={1}>
														<HStack w="100%">
															<Text noOfLines={1} fontWeight={"bold"}>
																{getSongbookDataWithHistory.tl}
															</Text>
														</HStack>
														<HStack w="100%">
															<Badge
																ml={1}
																colorScheme={
																	getSongbookDataWithHistory.g === "K-POP"
																		? "green"
																		: getSongbookDataWithHistory.g === "J-POP"
																			? "blue"
																			: "yellow"
																}
															>
																{getSongbookDataWithHistory.g}
															</Badge>
															<Text color={"gray.500"} fontSize="sm">
																{getSongbookDataWithHistory.a}
															</Text>
														</HStack>
													</VStack>
													<Box position="relative" padding={2}>
														<Divider />
													</Box>
												</>
											)}

											{/* 하단: 이외 수정 가능한 데이터 */}
											{editingHistory && (
												<Flex gap={3} flexDir={"column"}>
													<FormControl flex={1}>
														<FormLabel fontSize="sm">노래책 연결</FormLabel>
														{/* 
														//? 가짜 input 준비여부? => X
														//? input 뒤쪽에 Badge형태로 등록 (badge가 떠있으면 연결된 것으로) => X
														//? 상단에 마련된 노래 정보에 가시화. 카드 형태로 변경
														//? 여기서는 메인 input이 살아있도록 간단히 구성.
														*/}
														{/* <Input
															ref={inputRef}
															size={"sm"}
															variant="unstyled"
															placeholder={selectedTags.length === 0 ? "노래 검색하기..." : ""}
															value={songbookSelectorValue}
															onChange={handleInputChange}
															onKeyDown={handleKeyDown}
															onFocus={() => setIsOpen(true)}
															minW="120px"
															flex="1"
															autoComplete="off"
															spellCheck="false"
														/> */}
														<List
															position="absolute"
															top="100%"
															left={0}
															right={0}
															mt={2}
															bg="white"
															boxShadow="md"
															borderRadius="md"
															maxH="200px"
															overflowY="auto"
															zIndex={10}
															border="1px solid"
															borderColor="gray.200"
														>
															{getAllSongbookData.data && getAllSongbookData.data.data.length > 0 ? (
																getAllSongbookData.data.data
																	.filter((sb) => sb.ia)
																	.map((sb) => (
																		<ListItem
																			key={sb.i}
																			p={3}
																			cursor="pointer"
																			// bg={index === highlightedIndex ? "blue.50" : "transparent"}
																			_hover={{ bg: "blue.50" }}
																		>{`${sb.i}) ${sb.tl} - ${sb.a}`}</ListItem>
																	))
															) : (
																<option>데이터 없음</option>
															)}
														</List>
														{/* <Select
															size="sm"
															placeholder="노래를 선택해주세요"
															onChange={(e) =>
																setEditingHistory({ ...editingHistory, hamkubby_id: Number(e.target.value) || -1 })
															}
															value={(editingHistory.hamkubby_id && editingHistory.hamkubby_id) || ""}
															isDisabled={getAllSongbookData.data?.data.length === 0}
														>
															{getAllSongbookData.data && getAllSongbookData.data.data.length > 0 ? (
																getAllSongbookData.data.data.map((sb) => (
																	<option key={sb.i} value={sb.i}>
																		{`${sb.i}) ${sb.tl} - ${sb.a}`}
																	</option>
																))
															) : (
																<option>그룹 데이터 없음</option>
															)}
														</Select> */}
													</FormControl>
													<HStack flex={1}>
														<FormControl flex={1}>
															<FormLabel fontSize="sm">날짜</FormLabel>
															<Input
																size="sm"
																type="date"
																value={editingHistory.sungAt || ""}
																onChange={(e) => setEditingHistory({ ...editingHistory, sungAt: e.target.value })}
															/>
														</FormControl>
														<FormControl flex={1}>
															<FormLabel fontSize="sm">유튜브 Video ID</FormLabel>
															<Input
																size="sm"
																value={editingHistory.youtubeVideoId || ""}
																onChange={(e) =>
																	setEditingHistory({ ...editingHistory, youtubeVideoId: e.target.value })
																}
															/>
														</FormControl>
													</HStack>

													<Box p={3} borderWidth="1px" borderRadius="md" bg="gray.50">
														<Flex alignItems="center" mb={3}>
															<Text fontSize="sm" fontWeight="bold">
																재생 구간
															</Text>
															<Spacer />
															<Flex alignItems="center" gap={2}>
																<Text fontSize="xs" color="gray.500">
																	{isTimeFormat ? "시간 포맷" : "초 단위"}
																</Text>
																<Switch
																	size="sm"
																	colorScheme="teal"
																	isChecked={isTimeFormat}
																	onChange={(e) => handleToggleFormat(e.target.checked)}
																/>
															</Flex>
														</Flex>

														<Grid templateColumns="1fr 1fr" gap={2}>
															<FormControl>
																<FormLabel fontSize="xs" mb={1}>
																	시작
																</FormLabel>
																<Input
																	size="sm"
																	type={isTimeFormat ? "text" : "number"}
																	placeholder={isTimeFormat ? "예) 01:25" : "예) 85"}
																	value={timeStrStart || ""}
																	onChange={handleChangeTimeText(setTimeStrStart)}
																/>
															</FormControl>
															<FormControl>
																<FormLabel fontSize="xs" mb={1}>
																	종료 (선택)
																</FormLabel>
																<Input
																	size="sm"
																	type={isTimeFormat ? "text" : "number"}
																	placeholder={isTimeFormat ? "예) 04:25" : "예) 265"}
																	value={timeStrEnd || ""}
																	onChange={handleChangeTimeText(setTimeStrEnd)}
																/>
															</FormControl>
														</Grid>
													</Box>

													<HStack flex={1}>
														<FormControl flex={1}>
															<FormLabel fontSize="sm">메모</FormLabel>
															<Input
																size="sm"
																value={editingHistory.memo || ""}
																onChange={(e) => setEditingHistory({ ...editingHistory, memo: e.target.value })}
															/>
														</FormControl>
													</HStack>

													<Flex>
														<FormControl>
															<FormLabel fontSize="sm" mb={1}>
																중요도
															</FormLabel>
															<NumberInput
																value={editingHistory.priority || 0}
																defaultValue={0}
																min={0}
																max={255}
																size="sm"
																maxW={32}
																onChange={(_, number) => setEditingHistory({ ...editingHistory, priority: number })}
															>
																<NumberInputField />
																<NumberInputStepper>
																	<NumberIncrementStepper />
																	<NumberDecrementStepper />
																</NumberInputStepper>
															</NumberInput>
															<Text fontSize="xs" color="gray.500">
																(높을수록 중요, 7로 설정시 ⭐표시)
															</Text>
														</FormControl>
														<Checkbox
															flexBasis={"100px"}
															alignSelf={"flex-end"}
															isChecked={editingHistory.isActive}
															onChange={(e) => {
																setEditingHistory({ ...editingHistory, isActive: e.target.checked });
															}}
														>
															활성화
														</Checkbox>
													</Flex>
												</Flex>
											)}
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
