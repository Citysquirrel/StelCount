import React, { useState, useEffect, useMemo, useRef } from "react";
import {
	Box,
	Heading,
	Text,
	Button,
	useColorModeValue,
	Flex,
	useToast,
	Badge,
	HStack,
	IconButton,
	Tooltip,
	Spinner,
	Center,
	Icon,
	Input,
	Select,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalCloseButton,
	ModalBody,
	ModalFooter,
	FormControl,
	FormLabel,
	Textarea,
	Checkbox,
	VStack,
	Divider,
} from "@chakra-ui/react";
import { FiRefreshCw, FiSave, FiTrash2, FiEyeOff, FiRotateCcw, FiCheckCircle, FiPlus, FiX } from "react-icons/fi";
import { useVirtualizer } from "@tanstack/react-virtual";
import { fetchServer } from "../../lib/functions/fetch";
import { normalizeKeyword } from "../../lib/functions/normalized";

// --- [타입 정의] ---
export type SyncStatus = "UNCHANGED" | "NEW" | "MODIFIED" | "DELETED" | "DISABLED";
export type Cheese = "잘몰라" | "일반곡" | "피토곡" | "우엑곡" | "숙제곡" | (string & {});
export type Genre = "K-POP" | "J-POP" | "POP" | (string & {});

export interface SongData {
	id?: number;
	columnData?: string;
	title: string;
	artist: string;
	genre: Genre;
	synonyms: string[];
	lyric: string;
	notes: string;
	cheese: Cheese;
	isOfficial: boolean;
	status: SyncStatus;
}

export function Songbook() {
	// --- [상태 관리] ---
	const [songs, setSongs] = useState<SongData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSyncing, setIsSyncing] = useState(false);

	// 검색 및 필터 상태
	const [searchQuery, setSearchQuery] = useState("");
	const [filterGenre, setFilterGenre] = useState("");
	const [filterOfficial, setFilterOfficial] = useState("");
	const [filterStatus, setFilterStatus] = useState("");

	// 모달 (에디터) 상태
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSong, setEditingSong] = useState<SongData | null>(null);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);

	const toast = useToast();
	const parentRef = useRef<HTMLDivElement>(null);
	const TABLE_HEADER_HEIGHT = 44;

	// 테마 색상
	const bgCard = useColorModeValue("white", "gray.700");
	const borderColor = useColorModeValue("gray.200", "gray.600");
	const headerBg = useColorModeValue("gray.50", "gray.800");
	const greenColor = useColorModeValue("green.50", "rgba(72, 187, 120, 0.1)");
	const redColor = useColorModeValue("red.50", "rgba(245, 101, 101, 0.1)");
	const grayColor = useColorModeValue("gray.100", "rgba(160, 174, 192, 0.2)");
	const yellowColor = useColorModeValue("yellow.50", "rgba(236, 201, 75, 0.1)");
	const fieldHoverBgColor = useColorModeValue("blue.50", "blue.600");

	useEffect(() => {
		setIsLoading(true);
		fetchServer("v2", "/songbook")
			.then((res) => {
				if (res.data) {
					setSongs(res.data.data);
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
		// setTimeout(() => {
		// 	const mockData: SongData[] = Array.from({ length: 150 }).map((_, i) => ({
		// 		id: i + 1,
		// 		columnData: "1-1",
		// 		title: i % 5 === 0 ? `밤양갱 ${i}` : `테스트 곡 ${i}`,
		// 		artist: i % 2 === 0 ? "비비" : "아이유",
		// 		genre: i % 3 === 0 ? "K-POP" : i % 3 === 1 ? "J-POP" : "POP",
		// 		synonyms: i % 4 === 0 ? ["별칭1", "별칭2"] : [],
		// 		lyric: "가사 시작 부분입니다...\n줄바꿈 테스트",
		// 		notes: i % 10 === 0 ? "어려움" : "",
		// 		cheese: "일반곡",
		// 		isOfficial: i % 5 !== 0,
		// 		status: i === 1 ? "DELETED" : i === 2 ? "DISABLED" : "UNCHANGED",
		// 	}));
		// 	setSongs(mockData);
		// 	setIsLoading(false);
		// }, 800);
	}, []);

	// --- [검색 및 필터링 적용 (파생 상태)] ---
	const filteredSongs = useMemo(() => {
		return songs.filter((song) => {
			const normalizedQuery = normalizeKeyword(searchQuery);
			const matchSearch =
				normalizeKeyword(song.title).includes(normalizedQuery) ||
				normalizeKeyword(song.artist).includes(normalizedQuery);
			const matchGenre = filterGenre ? song.genre === filterGenre : true;
			const matchOfficial = filterOfficial !== "" ? song.isOfficial === (filterOfficial === "true") : true;
			const matchStatus = filterStatus ? song.status === filterStatus : true;

			return matchSearch && matchGenre && matchOfficial && matchStatus;
		});
	}, [songs, searchQuery, filterGenre, filterOfficial, filterStatus]);

	// --- [가상화 스크롤 설정] ---
	const rowVirtualizer = useVirtualizer({
		count: filteredSongs.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 64, // 행의 대략적인 높이(px)
		overscan: 10, // 보이지 않는 영역에 미리 렌더링할 개수 (부드러운 스크롤링)
	});

	// --- [핸들러 함수] ---
	const toggleStatus = (e: React.MouseEvent, index: number, newStatus: SyncStatus) => {
		e.stopPropagation(); // 행 클릭(모달 열기) 이벤트 방지

		// filteredSongs의 index를 통해 원본 songs 배열의 실제 index를 찾아 업데이트
		const targetSong = filteredSongs[index];
		setSongs((prev) => prev.map((s) => (s === targetSong ? { ...s, status: newStatus } : s)));
	};

	// 시트 동기화
	const handleSyncSheet = async () => {
		setIsSyncing(true);
		fetchServer("v2", "/songbook/import")
			.then((res) => {
				if (res.data) {
					console.log(res.data);
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
				setIsSyncing(false);
			});
		try {
			// TODO: 서버의 POST /songbook/sync API 호출
			// await new Promise((resolve) => setTimeout(resolve, 1500));

			// [Mock] 서버에서 시트를 파싱하고 기존 DB와 비교한 결과를 보내줬다고 가정
			// const mockSyncedData: SongData[] = [
			// 	...songs, // 기존에 있던 150개 데이터 유지
			// 	{
			// 		id: 999,
			// 		columnData: "",
			// 		title: "Supernova",
			// 		artist: "aespa",
			// 		genre: "K-POP",
			// 		synonyms: ["에스파"],
			// 		lyric: "Su su su Supernova...",
			// 		notes: "시트에서 방금 긁어옴",
			// 		cheese: "일반곡",
			// 		isOfficial: true,
			// 		status: "NEW",
			// 	},
			// ];

			// setSongs(mockSyncedData);
			toast({ title: "시트 동기화 완료", description: "시트의 최신 변경사항이 반영되었습니다.", status: "info" });
		} catch (error) {
			toast({ title: "동기화 실패", status: "error" });
		} finally {
			setIsSyncing(false);
		}
	};

	// 수동 추가 버튼
	const handleAddNewSong = () => {
		const newSong: SongData = {
			title: "",
			artist: "",
			genre: "K-POP",
			synonyms: [],
			lyric: "",
			notes: "",
			cheese: "잘몰라",
			isOfficial: false,
			status: "NEW",
		};
		setEditingSong(newSong);
		setEditingIndex(-1); // -1은 신규 추가를 의미
		setIsModalOpen(true);
	};

	// 행 클릭 시 상세 모달 열기
	const handleRowClick = (index: number) => {
		setEditingSong({ ...filteredSongs[index] });
		setEditingIndex(index);
		setIsModalOpen(true);
	};

	// 모달 내 저장 버튼
	const handleSaveEdit = () => {
		if (!editingSong) return;

		if (editingIndex === -1) {
			// 신규 추가
			setSongs((prev) => [editingSong, ...prev]);
		} else {
			// 기존 데이터 수정
			const targetOriginalSong = filteredSongs[editingIndex!];
			setSongs((prev) =>
				prev.map((s) => {
					if (s === targetOriginalSong) {
						// 상태가 UNCHANGED 였다면 MODIFIED로 변경 (NEW, DELETED 등은 유지)
						const newStatus = s.status === "UNCHANGED" ? "MODIFIED" : s.status;
						return { ...editingSong, status: newStatus };
					}
					return s;
				}),
			);
		}
		setIsModalOpen(false);
	};

	// 별칭 입력 핸들러
	const handleAddSynonym = () => setEditingSong((p) => (p ? { ...p, synonyms: [...p.synonyms, ""] } : null));
	const handleRemoveSynonym = (idx: number) =>
		setEditingSong((p) => (p ? { ...p, synonyms: p.synonyms.filter((_, i) => i !== idx) } : null));
	const handleSynonymChange = (idx: number, val: string) =>
		setEditingSong((p) => {
			if (!p) return null;
			const newSynonyms = [...p.synonyms];
			newSynonyms[idx] = val;
			return { ...p, synonyms: newSynonyms };
		});

	return (
		<Box>
			{isLoading && (
				<Center w="100%" h="100%" top={0} left={0} position="absolute" zIndex={123} bg="rgba(255,255,255,0.7)">
					<Spinner size="xl" />
				</Center>
			)}
			<Heading size="lg" mb={6}>
				노래책 관리 에디터
			</Heading>

			{/* 검색 및 필터 컨트롤 바 */}
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
				<Input
					placeholder="제목 또는 가수 부분 검색"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					w="300px"
				/>
				<Select placeholder="모든 장르" value={filterGenre} onChange={(e) => setFilterGenre(e.target.value)} w="150px">
					<option value="K-POP">K-POP</option>
					<option value="J-POP">J-POP</option>
					<option value="POP">POP</option>
				</Select>
				<Select
					placeholder="공식 여부"
					value={filterOfficial}
					onChange={(e) => setFilterOfficial(e.target.value)}
					w="150px"
				>
					<option value="true">공식 곡만</option>
					<option value="false">수동 추가 곡만</option>
				</Select>
				<Select
					placeholder="모든 상태"
					value={filterStatus}
					onChange={(e) => setFilterStatus(e.target.value)}
					w="150px"
				>
					<option value="UNCHANGED">유지됨</option>
					<option value="NEW">신규 추가</option>
					<option value="MODIFIED">수정됨</option>
					<option value="DELETED">삭제 대기</option>
					<option value="DISABLED">비활성</option>
				</Select>
				<Button
					colorScheme="orange"
					onClick={() => {
						setSearchQuery("");
						setFilterGenre("");
						setFilterOfficial("");
						setFilterStatus("");
					}}
				>
					초기화
				</Button>

				<Flex flex={1} justify="flex-end" gap={2}>
					<Button
						leftIcon={<FiRefreshCw />}
						colorScheme="teal"
						variant="outline"
						onClick={handleSyncSheet}
						isLoading={isSyncing}
						loadingText="동기화 중"
					>
						시트 동기화
					</Button>
					<Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNewSong}>
						직접 추가
					</Button>
					<Button leftIcon={<FiSave />} colorScheme="blue">
						DB에 최종 저장
					</Button>
				</Flex>
			</Flex>

			<Text mb={2} color="gray.500" fontSize="sm">
				검색 결과: {filteredSongs.length} 건
			</Text>

			{/* 💡 [수정됨] 가상화 테이블 영역 (구조 분리 적용) */}
			{/* 1. 전체를 감싸는 최상위 껍데기 Box: 기존에 스크롤 영역에 있던 배경색, 테두리, 그림자를 밖으로 끌어올렸습니다. */}
			<Box
				bg={bgCard}
				rounded="xl"
				shadow="sm"
				border={`1px solid ${borderColor}`}
				overflow="hidden" // 헤더나 아이템의 배경색이 둥근 모서리를 삐져나가지 않게 막아줍니다.
			>
				{/* 💡 2. 테이블 헤더 (스크롤 컨테이너 바깥으로 완전 분리) */}
				{/* 더 이상 스크롤 안에 있지 않으므로 position="sticky", top={0}, zIndex 속성이 필요 없어 삭제했습니다. */}
				<Flex bg={headerBg} borderBottom={`1px solid ${borderColor}`} px={4} py={3} fontWeight="bold" fontSize="sm">
					<Box w="60px">행</Box>
					<Box w="100px">상태</Box>
					<Box w="60px" textAlign="center">
						공식
					</Box>
					<Box flex={1}>곡 제목 / 아티스트</Box>
					<Box w="100px" textAlign="center">
						조작
					</Box>
				</Flex>

				{/* 💡 3. 실제 스크롤이 발생하는 가상화 컨테이너 */}
				{/* 헤더 바로 아래에 배치되며, ref={parentRef}가 여기에 들어옵니다. */}
				<Box ref={parentRef} h="600px" overflowY="auto">
					<Box position="relative" h={`${rowVirtualizer.getTotalSize()}px`} w="100%">
						{/* 가상화된 행 렌더링 */}
						{rowVirtualizer.getVirtualItems().map((virtualRow) => {
							const song = filteredSongs[virtualRow.index];
							const isFaded = song.status === "DELETED" || song.status === "DISABLED";
							const rowColorMap = {
								NEW: greenColor,
								DELETED: redColor,
								DISABLED: grayColor,
								MODIFIED: yellowColor,
								UNCHANGED: "transparent",
							};

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
									align="center"
									bg={rowColorMap[song.status]}
									borderBottom={`1px solid ${borderColor}`}
									cursor="pointer"
									_hover={{ bg: fieldHoverBgColor }}
									onClick={() => handleRowClick(virtualRow.index)} // 행 클릭 시 수정 모달 오픈
								>
									<Box w="60px">{song.id}</Box>
									<Box w="100px">
										<Badge
											colorScheme={
												song.status === "NEW"
													? "green"
													: song.status === "DELETED"
														? "red"
														: song.status === "MODIFIED"
															? "yellow"
															: song.status === "DISABLED"
																? "orange"
																: "gray"
											}
										>
											{song.status}
										</Badge>
									</Box>
									<Box w="60px" textAlign="center">
										{song.isOfficial && <Icon as={FiCheckCircle} color="blue.500" boxSize={5} />}
									</Box>
									<Box
										flex={1}
										opacity={isFaded ? 0.5 : 1}
										textDecoration={song.status === "DELETED" ? "line-through" : "none"}
									>
										<Text fontWeight="bold">
											{song.title}{" "}
											<Badge
												ml={1}
												colorScheme={song.genre === "K-POP" ? "green" : song.genre === "J-POP" ? "blue" : "yellow"}
											>
												{song.genre}
											</Badge>
										</Text>
										<Text fontSize="sm" color="gray.500">
											{song.artist}
										</Text>
									</Box>

									{/* 조작 버튼 구역 */}
									<Box w="100px" textAlign="center">
										<HStack spacing={1} justify="center">
											{isFaded ? (
												<IconButton
													aria-label="Undo"
													icon={<FiRotateCcw />}
													size="md"
													variant="ghost"
													onClick={(e) => toggleStatus(e, virtualRow.index, "UNCHANGED")}
												/>
											) : (
												<>
													<IconButton
														aria-label="Disable"
														icon={<FiEyeOff />}
														size="md"
														variant="ghost"
														colorScheme="orange"
														onClick={(e) => toggleStatus(e, virtualRow.index, "DISABLED")}
													/>
													<IconButton
														aria-label="Delete"
														icon={<FiTrash2 />}
														size="md"
														variant="ghost"
														colorScheme="red"
														onClick={(e) => toggleStatus(e, virtualRow.index, "DELETED")}
													/>
												</>
											)}
										</HStack>
									</Box>
								</Flex>
							);
						})}
					</Box>
				</Box>
			</Box>

			{/* --- [수정/추가 다이얼로그 (모달)] --- */}
			<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="xl">
				<ModalOverlay />
				<ModalContent>
					<ModalHeader>{editingIndex === -1 ? "새 곡 직접 추가" : "노래 상세 정보 수정"}</ModalHeader>
					<ModalCloseButton />

					{editingSong && (
						<ModalBody>
							<VStack spacing={4} align="stretch">
								<Flex gap={4}>
									<FormControl flex={2}>
										<FormLabel>곡 제목</FormLabel>
										<Input
											value={editingSong.title}
											onChange={(e) => setEditingSong({ ...editingSong, title: e.target.value })}
										/>
									</FormControl>
									<FormControl flex={1}>
										<FormLabel>아티스트</FormLabel>
										<Input
											value={editingSong.artist}
											onChange={(e) => setEditingSong({ ...editingSong, artist: e.target.value })}
										/>
									</FormControl>
								</Flex>

								<Flex gap={4}>
									<FormControl>
										<FormLabel>장르</FormLabel>
										<Select
											value={editingSong.genre}
											onChange={(e) => setEditingSong({ ...editingSong, genre: e.target.value as Genre })}
										>
											<option value="K-POP">K-POP</option>
											<option value="J-POP">J-POP</option>
											<option value="POP">POP</option>
										</Select>
									</FormControl>
									<FormControl>
										<FormLabel>치즈 (난이도/성향)</FormLabel>
										<Select
											value={editingSong.cheese}
											onChange={(e) => setEditingSong({ ...editingSong, cheese: e.target.value as Cheese })}
										>
											<option value="잘몰라">잘몰라</option>
											<option value="일반곡">일반곡</option>
											<option value="피토곡">피토곡</option>
											<option value="우엑곡">우엑곡</option>
											<option value="숙제곡">숙제곡</option>
										</Select>
									</FormControl>
								</Flex>

								<FormControl>
									<FormLabel>가사</FormLabel>
									{/* 여러 줄 입력 가능한 Textarea */}
									<Textarea
										rows={5}
										value={editingSong.lyric}
										onChange={(e) => setEditingSong({ ...editingSong, lyric: e.target.value })}
									/>
								</FormControl>

								<Divider />

								<FormControl>
									<Flex justify="space-between" align="center" mb={2}>
										<FormLabel m={0}>별칭 (동의어)</FormLabel>
										<Button size="xs" leftIcon={<FiPlus />} onClick={handleAddSynonym}>
											별칭 추가
										</Button>
									</Flex>
									<VStack spacing={2}>
										{editingSong.synonyms.map((syn, idx) => (
											<Flex key={idx} w="100%" gap={2}>
												<Input size="sm" value={syn} onChange={(e) => handleSynonymChange(idx, e.target.value)} />
												<IconButton
													aria-label="remove"
													icon={<FiX />}
													size="sm"
													colorScheme="red"
													onClick={() => handleRemoveSynonym(idx)}
												/>
											</Flex>
										))}
										{editingSong.synonyms.length === 0 && (
											<Text fontSize="sm" color="gray.500">
												등록된 별칭이 없습니다.
											</Text>
										)}
									</VStack>
								</FormControl>

								<FormControl>
									<FormLabel>메모 (Notes)</FormLabel>
									<Input
										value={editingSong.notes}
										onChange={(e) => setEditingSong({ ...editingSong, notes: e.target.value })}
									/>
								</FormControl>

								<FormControl display="flex" alignItems="center" mt={2}>
									<FormLabel mb="0">공식 곡 여부 (시트 동기화)</FormLabel>
									<Checkbox
										isChecked={editingSong.isOfficial}
										onChange={(e) => setEditingSong({ ...editingSong, isOfficial: e.target.checked })}
									/>
								</FormControl>
							</VStack>
						</ModalBody>
					)}

					<ModalFooter>
						<Button variant="ghost" mr={3} onClick={() => setIsModalOpen(false)}>
							취소
						</Button>
						<Button colorScheme="blue" onClick={handleSaveEdit}>
							적용하기
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</Box>
	);
}
