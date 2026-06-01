import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
	Stack,
} from "@chakra-ui/react";
import { FiRefreshCw, FiSave, FiTrash2, FiEyeOff, FiCheckCircle, FiPlus, FiX } from "react-icons/fi";
import { useVirtualizer } from "@tanstack/react-virtual";
import { fetchServer } from "../../lib/functions/fetch";
import { normalizeKeyword } from "../../lib/functions/normalized";
import { SiGooglesheets } from "react-icons/si";
import { isEqual } from "lodash";

// --- [타입 정의] ---
export type SyncStatus = "UNCHANGED" | "NEW" | "MODIFIED";
export type ActionStatus = "ACTIVE" | "DELETED" | "DISABLED";
export type Cheese = "잘몰라" | "일반곡" | "피토곡" | "우엑곡" | "숙제곡" | (string & {});
export type Genre = "K-POP" | "J-POP" | "POP" | (string & {});

export interface SongData {
	id?: number;
	columnData?: string;
	syncId: string;
	title: string;
	artist: string;
	genre: Genre;
	synonyms: string[];
	lyric: string;
	notes: string;
	cheese: Cheese;
	isOfficial: boolean;
	syncStatus: SyncStatus;
	actionStatus: ActionStatus;
}

interface SyncDataData {
	id: string;
	syncId: string;
	genre: "J-POP" | "K-POP" | "POP";
	artist: string;
	title: string;
	notes: string;
	cheese: "일반" | "잘몰라" | "피토" | "우엑";
}

interface SyncData {
	msg: string;
	data: SyncDataData[];
}

type RawSongData = Omit<SongData, "synonyms" | "actionStatus" | "syncStatus"> & {
	synonyms: string;
	isActive: boolean;
	searchBase: string;
	searchChosung: string;
	searchJamo: string;
	createdAt?: string | null;
	updatedAt?: string | null;
	deletedAt?: string | null;
};
//?: 백엔드에서의 버킷팅 순서
//?: 1. UNCHAGED일 경우는 무조건 건너뛴다
//?: 2. DELETED일 경우 삭제처리로 넘긴다
//?: 3. 나머지 데이터(ACTIVE, DISABLED) 수집한다
//?: 4. 한꺼번에 bulkCreate로 upsert 한다
//TODO: 그러므로 프론트엔드에서는 정보가 변하거나 actionStatus(중요)가 변하는 경우 무조건 MODIFIED 표시되어야 한다.
//!: 아래부터 이번 TODO에 대한 의사코드 작성
// # DB에서 불러온 첫 rawData로부터 비교 실행. 고유키인 syncId를 기준으로 비교할 것.
// 1. 기존에 없던 데이터를 NEW 처리
//		>> 수정되더라도 NEW를 유지해야함. DELETE시 테이블에서 DROP하고 휴지통에 넣는다. 휴지통은 계정과 관계없이 로컬에 저장된다.
// 2. actionStatus가 포함된 모든 데이터를 비교하여 하나라도 변경점이 있을 경우 MODIFIED 표시되어야 한다.
//		>> 기존 DB에서 불러온 데이터에 한정됨
// 2-a. 파생. 편집 모달로 들어가면 어디서 데이터가 변경된 것인지 표시되어야 함
// 3. 나머지는 UNCHANGED 표시한다.
//		>> 값을 바꾸었다가 원복했을 경우 다시 UNCHANGED로 표시되어야 함

// * 예외사항: 이미 있던 곡이 들어왔을 경우 actionStatus는 변하지 말아야함. (csv 기준이기 때문에 hiddenrows를 직접 따져야함)

// "UNCHANGED" | "NEW" | "MODIFIED";
// "ACTIVE" | "DELETED" | "DISABLED";

//TODO: 신규 데이터 직접 생성 시 NEW, syncId 할당
/////TODO: NEW 상태인 데이터를 삭제할 때의 최적화
/////TODO: 	>> 관리자가 직접 새곡 추가를 했다가 마음이 바뀌어 삭제버튼을 누르는 경우. 아예 그자리에서 DROP하는 형태로..
/////TODO:	>> 이건 대신 UNDO를 못하는 대신 확인창 한번 띄워주면 좋을듯
//TODO: DB에 저장 동기화 API 호출 성공 후 로컬 상태 초기화 해주기
//TODO:	>> DELETED 항목은 제거
//TODO:	>> NEW, MODIFIED 항목은 UNCHANGED로 리셋

export function Songbook() {
	// --- [상태 관리] ---
	const [songs, setSongs] = useState<SongData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSyncing, setIsSyncing] = useState(false);
	const [isDBSaving, setIsDBSaving] = useState(false);

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
	const rawSongRef = useRef<SongData[]>([]);
	const sheetUrlRef = useRef<string>("");
	const TABLE_HEADER_HEIGHT = 44;

	// 테마 색상
	const bgCard = useColorModeValue("white", "gray.700");
	const borderColor = useColorModeValue("gray.200", "gray.600");
	const headerBg = useColorModeValue("gray.50", "gray.800");
	const greenColor = useColorModeValue("green.50", "rgba(72, 187, 120, 0.1)");
	const redColor = useColorModeValue("red.50", "rgba(245, 101, 101, 0.1)");
	const blueColor = useColorModeValue("blue.50", "rgb(101, 101, 245,0.1)");
	const grayColor = useColorModeValue("gray.100", "rgba(160, 174, 192, 0.2)");
	const yellowColor = useColorModeValue("yellow.50", "rgba(236, 201, 75, 0.1)");
	const fieldHoverBgColor = useColorModeValue("blue.50", "blue.600");

	const parseRawData = (rawData: RawSongData[]): SongData[] => {
		return rawData.map((song) => {
			const { updatedAt, deletedAt, createdAt, isActive, ...restSong } = song;
			const [syncType, rawSyncValue] = restSong.syncId.split("::");

			const columnData =
				song.columnData || (syncType === "SHEET" && rawSyncValue?.includes("-"))
					? String(Number(rawSyncValue.split("-")[1]) + 6)
					: "";

			//TODO: searchBase searchChosung searchJamo 설정
			return {
				...restSong,
				columnData,
				synonyms: restSong.synonyms ? JSON.parse(restSong.synonyms) : [],
				actionStatus: isActive ? "ACTIVE" : "DISABLED",
				syncStatus: "UNCHANGED",
			};
		});
	};

	useEffect(() => {
		setIsLoading(true);
		fetchServer("admin", "/songbook")
			.then((res) => {
				if (res.data) {
					const data: RawSongData[] = res.data.data;
					sheetUrlRef.current = res.data.sheetUrl;

					const parsed = parseRawData(data);

					// const parsed: SongData[] = data.map((song) => {
					// 	const { updatedAt, deletedAt, createdAt, isActive, ...restSong } = song;
					// 	const [syncType, rawSyncValue] = restSong.syncId.split("::");

					// 	const columnData =
					// 		syncType === "SHEET" && rawSyncValue?.includes("-") ? String(Number(rawSyncValue.split("-")[1]) + 6) : "";

					// 	//TODO: searchBase searchChosung searchJamo 설정
					// 	return {
					// 		...restSong,
					// 		columnData,
					// 		synonyms: restSong.synonyms ? JSON.parse(restSong.synonyms) : [],
					// 		actionStatus: isActive ? "ACTIVE" : "DISABLED",
					// 		syncStatus: "UNCHANGED",
					// 	};
					// });
					setSongs(parsed);

					// 비교를 위한 원본 저장
					rawSongRef.current = structuredClone(parsed);
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
					duration: 3000,
					isClosable: true,
					position: "top-right",
				});
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	// --- [검색 및 필터링 적용 (파생 상태)] ---

	//TODO 필터를 드롭다운 + 체크박스 형태로 변경하기
	const filteredSongs = useMemo(() => {
		return songs.filter((song) => {
			const normalizedQuery = normalizeKeyword(searchQuery);
			const matchSearch =
				normalizeKeyword(song.title).includes(normalizedQuery) ||
				normalizeKeyword(song.artist).includes(normalizedQuery);
			const matchGenre = filterGenre ? song.genre === filterGenre : true;
			const matchOfficial = filterOfficial !== "" ? song.isOfficial === (filterOfficial === "true") : true;
			const matchStatus = filterStatus ? song.syncStatus === filterStatus : true;

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
	const toggleStatus = (e: React.MouseEvent, syncId: string, newStatus: ActionStatus) => {
		e.stopPropagation(); // 행 클릭(모달 열기) 이벤트 방지

		// filteredSongs의 index를 통해 원본 songs 배열의 실제 index를 찾아 업데이트
		const r = rawSongRef.current.find((rs) => rs.syncId === syncId);
		if (!r) {
			toast({
				title: "데이터 변경 실패",
				description: "raw data에 해당 데이터가 없습니다. 코드에 문제가 있는 경우입니다.",
				status: "error",
				duration: 3000,
				isClosable: true,
				position: "top-right",
			});
			return;
		}
		const syncStatus: SyncStatus = r.actionStatus === newStatus ? "UNCHANGED" : "MODIFIED";
		setSongs((prev) => prev.map((s) => (s.syncId === syncId ? { ...s, syncStatus, actionStatus: newStatus } : s)));
	};

	const parseSheetData = useCallback(
		function (syncData: SyncDataData[], existingSongs: SongData[]): SongData[] {
			const mapping = {
				cheese: {
					일반: "일반곡",
					잘몰라: "잘몰라",
					피토: "피토곡",
					우엑: "우엑곡",
				},
			} as const;

			// 1. 저장된 songs 배열 상태 가져와서 대조해보기.
			// 2. sync 배열을 돌며 title과 artist 두 개가 모두 같은 객체가 있는지 검증
			// 3. 검증 후 두개가 같으면 나머지 값들을 마저 검증하여 다른 값이 있을 경우 덮어씌운 후 MODIFIED로 기록
			// 4. 검증 후 하나라도 다르면 새 곡으로 push 하고 NEW로 기록
			// (5. NEW와 MODIFIED가 위로 오도록 정렬)

			// 2. 기존 곡들을 Map으로 변환 (검색 속도 최적화)
			const oldSongsMap = new Map<string, SongData>();
			existingSongs.forEach((song) => {
				oldSongsMap.set(song.syncId, song);
			});

			const updatedSongs: SongData[] = [];
			// 처리된 곡의 Key를 기록해둘 Set (Map에서 delete하지 않기 위함)
			const processedKeys = new Set<string>();

			// 3. syncData를 순회하며 검증 및 병합
			syncData.forEach((syncItem) => {
				const key = syncItem.syncId;
				processedKeys.add(key); // 처리됨을 기록

				const oldSong = oldSongsMap.get(key);

				// mapping 객체를 통해 안전하게 타입 변환
				// const mappedGenre = mapping.genre[syncItem.genre] as Genre;
				const mappedCheese = mapping.cheese[syncItem.cheese] as Cheese;

				if (oldSong) {
					// [기존에 존재하는 곡]
					// 비교할 핵심 필드들이 변경되었는지 확인
					const isModified =
						oldSong.genre !== syncItem.genre || oldSong.cheese !== mappedCheese || oldSong.notes !== syncItem.notes;

					if (isModified) {
						// 값이 다르면 MODIFIED
						updatedSongs.push({
							...oldSong,
							genre: syncItem.genre,
							cheese: mappedCheese,
							notes: syncItem.notes,
							syncStatus: "MODIFIED",
						});
					} else {
						// 완전히 같으면 UNCHANGED
						updatedSongs.push({
							...oldSong,
							syncStatus: "UNCHANGED",
						});
					}
				} else {
					// [완전히 새로운 곡]

					// 행 계산식
					const START_COLUMN = 6;
					const id = syncItem.id;
					const dashIndex = id.indexOf("-");
					const num = +id.substring(dashIndex + 1);
					const columnData = String(num + START_COLUMN);
					//
					updatedSongs.push({
						columnData,
						syncId: syncItem.syncId,
						title: syncItem.title,
						artist: syncItem.artist,
						genre: syncItem.genre,
						notes: syncItem.notes,
						cheese: mappedCheese,
						synonyms: [],
						lyric: "",
						isOfficial: true,
						syncStatus: "NEW",
						actionStatus: "ACTIVE",
					});
				}
			});

			// 삭제된 곡(DELETED) 판별 로직
			// 기존 배열을 순회하며 processedKeys Set에 없는 녀석들만 골라냄
			existingSongs.forEach((oldSong) => {
				const key = oldSong.syncId;
				if (!processedKeys.has(key)) {
					updatedSongs.push({
						...oldSong,
						actionStatus: "DELETED",
					});
				}
			});

			return updatedSongs;
		},
		[songs],
	);

	// 시트 동기화
	const handleSyncSheet = async () => {
		setIsSyncing(true);
		fetchServer("admin", "/songbook/import")
			.then((res) => {
				const syncData: SyncData = res.data;
				if (syncData) {
					const parsed = parseSheetData(syncData.data, songs);
					setSongs(parsed);
					toast({
						title: "데이터 불러오기 성공",
						description: syncData.msg,
						status: "success",
						duration: 3000,
						isClosable: true,
						position: "top-right",
					});
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
					duration: 3000,
					isClosable: true,
					position: "top-right",
				});
			})
			.finally(() => {
				setIsSyncing(false);
			});
	};

	// 수동 추가 버튼
	const handleAddNewSong = () => {
		const syncId = `MANUAL::${Date.now()}::${crypto.randomUUID()}`;
		const newSong: SongData = {
			syncId,
			title: "",
			artist: "",
			genre: "K-POP",
			synonyms: [],
			lyric: "",
			notes: "",
			cheese: "잘몰라",
			isOfficial: false,
			syncStatus: "NEW",
			actionStatus: "ACTIVE",
		};
		setEditingSong(newSong);
		setEditingIndex(-1); // -1은 신규 추가를 의미
		setIsModalOpen(true);
	};

	// DB 최종 저장 핸들러
	const handleSaveDB = () => {
		setIsDBSaving(true);
		fetchServer("admin", "/songbook", { method: "POST", body: songs })
			.then((res) => {
				if (res.status >= 200 && res.status < 300) {
					if (res.data) {
						const upsertedMsg = res.data.stats ? `\n업로드 ${res.data.stats.upserted}건` : "";
						const deletedMsg = res.data.stats ? `\n삭제 ${res.data.stats.deleted}건` : "";
						toast({
							title: "데이터 동기화 성공",
							description: `${res.data.msg}${upsertedMsg}${deletedMsg}`,
							status: "success",
							duration: 3000,
							isClosable: true,
							position: "top-right",
						});

						const upsertedData = parseRawData(res.data.upsertedData);
						const deletedSyncIds: string[] = res.data.deletedSyncIds;

						const clone = structuredClone(songs);

						const parsed = clone
							.filter((song) => !deletedSyncIds.includes(song.syncId))
							.map((song) => {
								const upserted = upsertedData.find((up) => up.syncId === song.syncId);
								if (upserted) return upserted;
								return song;
							});

						setSongs(parsed);
						rawSongRef.current = parsed;
					} else {
						throw new Error("데이터 형식이 올바르지 않거나 비어있습니다.");
					}
				} else {
					toast({
						title: "데이터 동기화 실패",
						description: `${res.status}: ${res.statusText}`,
						status: "error",
						duration: 3000,
						isClosable: true,
						position: "top-right",
					});
				}
			})
			.catch((error) => {
				console.error("대시보드 데이터 로드 실패:", error);

				toast({
					title: "데이터 동기화 실패",
					description: error instanceof Error ? error.message : "서버와 통신하는 중 문제가 발생했습니다.",
					status: "error",
					duration: 3000,
					isClosable: true,
					position: "top-right",
				});
			})
			.finally(() => {
				setIsDBSaving(false);
			});
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
						const r = rawSongRef.current.find((rs) => rs.syncId === s.syncId);

						// r과 s를 비교해 달라진 것이 있다면 MODIFIED로 지정함.
						const newStatus: SyncStatus = !r ? "NEW" : isEqual(r, s) ? "MODIFIED" : "UNCHANGED";
						return { ...editingSong, syncStatus: newStatus };
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
			<Heading size="lg" mb={2}>
				노래책 관리 에디터{" "}
				{sheetUrlRef.current.length > 0 ? (
					<IconButton
						aria-label="sheetUrl"
						icon={<SiGooglesheets />}
						size="md"
						variant={"ghost"}
						onClick={() => {
							window.open(sheetUrlRef.current, "_blank");
						}}
					/>
				) : null}
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
					<Button
						leftIcon={<FiSave />}
						colorScheme="blue"
						onClick={handleSaveDB}
						isLoading={isDBSaving}
						loadingText="저장 중"
					>
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
							const isFaded = song.actionStatus === "DELETED" || song.actionStatus === "DISABLED";
							const rowColorMap = {
								NEW: greenColor,
								MODIFIED: yellowColor,
								UNCHANGED: "transparent",
							};
							const borderColorMap = {
								ACTIVE: blueColor,
								DELETED: redColor,
								DISABLED: grayColor,
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
									bg={rowColorMap[song.syncStatus]}
									borderBottom={`1px solid ${borderColor}`}
									// outline={song.actionStatus === "ACTIVE" ? undefined : "1px solid"}
									// outlineColor={borderColorMap[song.actionStatus] || undefined}
									cursor="pointer"
									_hover={{ bg: fieldHoverBgColor }}
									onClick={() => handleRowClick(virtualRow.index)} // 행 클릭 시 수정 모달 오픈
								>
									<Box w="60px">{song.columnData}</Box>
									<Stack w="100px" alignItems={"flex-start"}>
										<Badge
											colorScheme={
												song.syncStatus === "NEW" ? "green" : song.syncStatus === "MODIFIED" ? "yellow" : "gray"
											}
										>
											{song.syncStatus}
										</Badge>
										<Badge
											colorScheme={
												song.actionStatus === "ACTIVE"
													? "blue"
													: song.actionStatus === "DELETED"
														? "red"
														: song.actionStatus === "DISABLED"
															? "orange"
															: "gray"
											}
										>
											{song.actionStatus}
										</Badge>
									</Stack>
									<Box w="60px" textAlign="center">
										{song.isOfficial && <Icon as={FiCheckCircle} color="blue.500" boxSize={5} />}
									</Box>
									<Box
										flex={1}
										opacity={isFaded ? 0.5 : 1}
										textDecoration={song.actionStatus === "DELETED" ? "line-through" : "none"}
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
											{song.actionStatus === "ACTIVE" ? null : (
												<IconButton
													aria-label="Active"
													icon={<FiCheckCircle />}
													size="md"
													variant="ghost"
													colorScheme="green"
													onClick={(e) => toggleStatus(e, song.syncId, "ACTIVE")}
												/>
											)}
											<>
												{song.actionStatus === "DISABLED" ? null : (
													<IconButton
														aria-label="Disable"
														icon={<FiEyeOff />}
														size="md"
														variant="ghost"
														colorScheme="orange"
														onClick={(e) => toggleStatus(e, song.syncId, "DISABLED")}
													/>
												)}
												{song.actionStatus === "DELETED" ? null : (
													<IconButton
														aria-label="Delete"
														icon={<FiTrash2 />}
														size="md"
														variant="ghost"
														colorScheme="red"
														onClick={(e) => toggleStatus(e, song.syncId, "DELETED")}
													/>
												)}
											</>
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
					<ModalHeader>
						{editingIndex === -1 ? "새 곡 직접 추가" : "노래 상세 정보 수정"}
						<Text fontSize="xs" color="gray" fontWeight="400">
							{editingSong?.syncId || ""}
						</Text>
					</ModalHeader>

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
									<FormLabel>
										가사{" "}
										<IconButton
											aria-label="open-lyric-search"
											onClick={() => {
												const query = `${editingSong.artist} ${editingSong.title} 가사`;
												window.open(
													`https://www.google.com/search?q=${encodeURIComponent(query)}&udm=14`,
													"lyrics",
													"noopener,width=540,height=600",
												);
											}}
										></IconButton>
									</FormLabel>
									{/* 여러 줄 입력 가능한 Textarea */}
									<Textarea
										className="textarea-resizing"
										rows={12}
										value={editingSong.lyric}
										onChange={(e) => setEditingSong({ ...editingSong, lyric: e.target.value })}
									/>
								</FormControl>

								<Divider />

								<FormControl>
									<Flex justify="space-between" align="center" mb={2}>
										<FormLabel m={0}>별칭 (검색어)</FormLabel>
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
									<FormLabel mb="0">공식 등록 곡</FormLabel>
									<Checkbox
										isChecked={editingSong.isOfficial}
										onChange={(e) => setEditingSong({ ...editingSong, isOfficial: e.target.checked })}
									/>
								</FormControl>
								<Flex gap={4}>
									<FormControl flex={1}>
										<FormLabel>활성 상태</FormLabel>
										<Select
											value={editingSong.actionStatus}
											onChange={(e) => setEditingSong({ ...editingSong, actionStatus: e.target.value as ActionStatus })}
										>
											<option value="ACTIVE">활성</option>
											<option value="DISABLED">비활성</option>
											<option value="DELETED">삭제 대기</option>
										</Select>
									</FormControl>
									<Box flex={2}></Box>
								</Flex>
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

interface Mapping {
	genre: { [key: string]: Genre };
	cheese: { [key: string]: Cheese };
}
