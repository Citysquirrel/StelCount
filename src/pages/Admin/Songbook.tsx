import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
	Box,
	Heading,
	Text,
	Button,
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
	Menu,
	MenuButton,
	MenuList,
	MenuItem,
	useDisclosure,
	Grid,
	Spacer,
	Switch,
	NumberInput,
	NumberInputField,
	NumberInputStepper,
	NumberIncrementStepper,
	NumberDecrementStepper,
	useMediaQuery,
} from "@chakra-ui/react";
import { FiRefreshCw, FiSave, FiTrash2, FiEyeOff, FiCheckCircle, FiPlus, FiX } from "react-icons/fi";
import { useVirtualizer } from "@tanstack/react-virtual";
import { fetchServer } from "../../lib/functions/fetch";
import { normalizeKeyword } from "../../lib/functions/normalized";
import { SiGooglesheets } from "react-icons/si";
import { isEqual, omit } from "lodash";
import { MdAdd, MdClose, MdOpenInNew, MdSearch } from "react-icons/md";
import { IoIosArrowDown } from "react-icons/io";
import { formatDateToYYYYMMDD, formatTime, parseTimeToSeconds } from "../../lib/functions/etc";
import useColor from "../../lib/hooks/useColor";

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

	song_histories: SongHistory[];
}

interface SongHistory {
	id?: number;
	historyId: string;
	sungAt: string;
	youtubeVideoId: string;
	start: number;
	end: number | null;
	memo: string;
	priority: number | null;
	isActive: boolean;
	hamkubby_id?: number;
	createdAt?: string | null;
	updatedAt?: string | null;
	deletedAt?: string | null;
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
	const [filterGenre, setFilterGenre] = useState<Genre[]>([]);
	const [filterOfficial, setFilterOfficial] = useState("");
	const [filterLyric, setFilterLyric] = useState("");
	const [filterStatus, setFilterStatus] = useState<(ActionStatus | SyncStatus)[]>([]);

	// 모달 (에디터) 상태
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingSong, setEditingSong] = useState<SongData | null>(null);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);

	// 훅
	const toast = useToast();
	const [isTablet] = useMediaQuery("(max-width: 768px)");
	const [isMobile] = useMediaQuery("(max-width: 580px)");

	// ref
	const parentRef = useRef<HTMLDivElement>(null);
	const rawSongRef = useRef<SongData[]>([]);
	const sheetUrlRef = useRef<string>("");
	const TABLE_HEADER_HEIGHT = 44;

	const genres: Genre[] = ["K-POP", "J-POP", "POP"];
	const statuses: (ActionStatus | SyncStatus)[] = ["ACTIVE", "DELETED", "DISABLED", "MODIFIED", "NEW", "UNCHANGED"];

	// 테마 색상
	const { bgCard, borderColor, headerBg, greenColor, redColor, blueColor, grayColor, yellowColor, fieldHoverBgColor } =
		useColor();

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
			const matchGenre = filterGenre.length > 0 ? filterGenre.includes(song.genre) : true;
			const matchOfficial = filterOfficial !== "" ? song.isOfficial === (filterOfficial === "true") : true;
			const matchLyric = filterLyric !== "" ? !!song.lyric === (filterLyric === "true") : true;
			const matchSyncStatus = filterStatus.length > 0 ? filterStatus.includes(song.syncStatus) : true;
			const matchActionStatus = filterStatus.length > 0 ? filterStatus.includes(song.actionStatus) : true;

			return matchSearch && matchGenre && matchOfficial && matchLyric && (matchSyncStatus || matchActionStatus);
		});
	}, [songs, searchQuery, filterGenre, filterOfficial, filterStatus, filterLyric]);

	// --- [가상화 스크롤 설정] ---
	const rowVirtualizer = useVirtualizer({
		count: filteredSongs.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => (isMobile ? 120 : 64),
		overscan: 10,
	});

	useEffect(() => {
		rowVirtualizer.measure();
	}, [rowVirtualizer, isMobile]);

	// --- [핸들러 함수] ---
	const toggleStatus = (e: React.MouseEvent, syncId: string, newStatus: ActionStatus) => {
		e.stopPropagation();

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
						song_histories: [],
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
			song_histories: [],
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
						const raw = rawSongRef.current.find((rs) => rs.syncId === s.syncId);

						const newStatus: SyncStatus = !raw
							? "NEW"
							: isEqual(omit(raw, ["syncStatus"]), omit(editingSong, ["syncStatus"]))
								? "UNCHANGED"
								: "MODIFIED";

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

	// const handleAddHistory = () =>
	// 	setEditingSong((p) =>
	// 		p
	// 			? {
	// 					...p,
	// 					song_histories: [...p.song_histories, { sungAt: "", youtubeVideoId: "", start: 0, end: 0, memo: "" }],
	// 				}
	// 			: null,
	// 	);
	// const handleRemoveHistory = (idx: number) =>
	// 	setEditingSong((p) => (p ? { ...p, song_histories: p.song_histories.filter((_, i) => i !== idx) } : null));

	const handleCheckboxChange = (value, type: "genre" | "status") => {
		if (type === "genre")
			setFilterGenre((prev) => (prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]));
		else if (type === "status")
			setFilterStatus((prev) => (prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]));
	};

	// 수정 여부 검사
	useEffect(() => {
		const hasModifiedSongs = songs.some((song) => song.syncStatus === "MODIFIED");

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (hasModifiedSongs) {
				event.preventDefault();

				event.returnValue = "";
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [songs]);

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
				<Menu closeOnSelect={false}>
					<MenuButton as={Button} rightIcon={<IoIosArrowDown />} w="150px">
						{filterGenre.length > 0 ? `${filterGenre.length}개 선택됨` : "모든 장르"}
					</MenuButton>
					<MenuList minW="150px">
						{genres.map((genre) => (
							<MenuItem key={genre} as="label">
								<Checkbox
									isChecked={filterGenre.includes(genre)}
									onChange={() => handleCheckboxChange(genre, "genre")}
									w="100%"
								>
									{genre}
								</Checkbox>
							</MenuItem>
						))}
					</MenuList>
				</Menu>
				<Select
					placeholder="공식 여부"
					value={filterOfficial}
					onChange={(e) => setFilterOfficial(e.target.value)}
					w="150px"
				>
					<option value="true">공식 곡만</option>
					<option value="false">수동 추가 곡만</option>
				</Select>
				<Select placeholder="가사 여부" value={filterLyric} onChange={(e) => setFilterLyric(e.target.value)} w="150px">
					<option value="true">가사 있음</option>
					<option value="false">가사 없음</option>
				</Select>
				<Menu closeOnSelect={false}>
					<MenuButton as={Button} rightIcon={<IoIosArrowDown />} w="150px">
						{filterStatus.length > 0 ? `${filterStatus.length}개 선택됨` : "모든 상태"}
					</MenuButton>
					<MenuList minW="150px">
						{statuses.map((status) => (
							<MenuItem key={status} as="label">
								<Checkbox
									isChecked={filterStatus.includes(status)}
									onChange={() => handleCheckboxChange(status, "status")}
									w="100%"
								>
									{status}
								</Checkbox>
							</MenuItem>
						))}
					</MenuList>
				</Menu>

				<Button
					colorScheme="orange"
					onClick={() => {
						setSearchQuery("");
						setFilterGenre([]);
						setFilterOfficial("");
						setFilterStatus([]);
						setFilterLyric("");
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
						{!isMobile && "시트 동기화"}
					</Button>
					<Button leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNewSong}>
						{!isMobile && "직접 추가"}
					</Button>
					<Button
						leftIcon={<FiSave />}
						colorScheme="blue"
						onClick={handleSaveDB}
						isLoading={isDBSaving}
						loadingText="저장 중"
					>
						{!isMobile && "DB에 최종 저장"}
					</Button>
				</Flex>
			</Flex>

			<Text mb={2} color="gray.500" fontSize="sm">
				검색 결과: {filteredSongs.length} 건
			</Text>

			{/* 가상화 테이블 영역 */}
			<Box bg={bgCard} rounded="xl" shadow="sm" border={`1px solid ${borderColor}`} overflow="hidden">
				{/* 테이블 헤더 */}
				<Flex bg={headerBg} borderBottom={`1px solid ${borderColor}`} px={4} py={3} fontWeight="bold" fontSize="sm">
					{!isTablet && <Box w="60px">행</Box>}
					<Box w="100px">상태</Box>
					{!isTablet && (
						<>
							<Box w="60px" textAlign="center">
								공식
							</Box>
							<Box w="60px" textAlign="center">
								가사
							</Box>
						</>
					)}
					<Box flex={1}>곡 제목 / 아티스트</Box>
					<Box w="100px" textAlign="center">
						조작
					</Box>
				</Flex>

				{/* 가상화 컨테이너 */}
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
									cursor="pointer"
									_hover={{ bg: fieldHoverBgColor }}
									onClick={() => handleRowClick(virtualRow.index)}
								>
									{!isTablet && <Box w="60px">{song.columnData}</Box>}
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
									{!isTablet && (
										<>
											<Box w="60px" textAlign="center">
												{song.isOfficial && <Icon as={FiCheckCircle} color="blue.500" boxSize={5} />}
											</Box>
											<Box w="60px" textAlign="center">
												{!!song.lyric && <Icon as={FiCheckCircle} color="blue.500" boxSize={5} />}
											</Box>
										</>
									)}

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
										<HStack spacing={1} justify="center" flexDirection={isMobile ? "column" : undefined}>
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
			<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="4xl">
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
							<HStack flexDirection={["column", "column", "row"]} align={"stretch"}>
								<VStack spacing={4} align="stretch" flex={1} width={["100%", "100%", "auto"]}>
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
												size="sm"
												aria-label="open-lyric-search"
												onClick={() => {
													const query = `${editingSong.artist} ${editingSong.title} 가사`;
													window.open(
														`https://www.google.com/search?q=${encodeURIComponent(query)}&udm=14`,
														"lyrics",
														"noopener,width=540,height=600",
													);
												}}
											>
												<MdSearch />
											</IconButton>
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
												onChange={(e) =>
													setEditingSong({ ...editingSong, actionStatus: e.target.value as ActionStatus })
												}
											>
												<option value="ACTIVE">활성</option>
												<option value="DISABLED">비활성</option>
												<option value="DELETED">삭제 대기</option>
											</Select>
										</FormControl>
										<Box flex={2}></Box>
									</Flex>
								</VStack>
								<VStack width={["100%", "100%", "280px"]} align="stretch" p={"12px 4px"}>
									<VStack
										border="1px solid"
										borderColor="#c5c5c5"
										borderRadius={"12px"}
										p={2}
										height="100%"
										maxHeight="540px"
										overflow="auto"
									>
										<FormControl>
											{/* 가창 기록 구역 */}
											<Flex justify="space-between" align="center" mb={2}>
												<FormLabel m={0}>가창 기록</FormLabel>
											</Flex>
											<VStack spacing={2}>
												<SongHistoryEditor editingSong={editingSong} setEditingSong={setEditingSong} />
											</VStack>
										</FormControl>
									</VStack>
								</VStack>
							</HStack>
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

interface SongHistoryEditorProps {
	editingSong: SongData | null;
	setEditingSong: React.Dispatch<React.SetStateAction<SongData | null>>;
}

export default function SongHistoryEditor({ editingSong, setEditingSong }: SongHistoryEditorProps) {
	const { isOpen, onOpen, onClose } = useDisclosure();

	// 상태 관리
	const [editIndex, setEditIndex] = useState<number | null>(null);
	const [modalData, setModalData] = useState<SongHistory | null>(null);

	// 시간 포맷(MM:SS)과 초(Seconds) 단위 토글
	const [isTimeFormat, setIsTimeFormat] = useState<boolean>(true);

	// 타이핑 중 커서가 튀는 현상을 막기 위해, 시간 입력값은 모달 내 로컬 string 상태로 관리
	const [timeStrStart, setTimeStrStart] = useState<string>("");
	const [timeStrEnd, setTimeStrEnd] = useState<string>("");

	// editingSong이 null일 경우 렌더링 방어 (Early Return)
	if (!editingSong) {
		return (
			<Flex w="280px" p={4} justify="center" align="center" borderWidth="1px" borderRadius="md" bg="gray.50">
				<Text fontSize="sm" color="gray.500">
					선택된 곡이 없습니다.
				</Text>
			</Flex>
		);
	}

	// --- 핸들러: 기록 추가 ---
	const handleAddHistory = () => {
		const newHistory: SongHistory = {
			sungAt: formatDateToYYYYMMDD(new Date().toDateString()),
			historyId: `HISTORY::${Date.now()}::${crypto.randomUUID()}`,
			youtubeVideoId: "",
			start: 0,
			end: null,
			memo: "",
			priority: 0,
			isActive: true,
		};
		setModalData(newHistory);
		setTimeStrStart("00:00");
		setTimeStrEnd("");
		setEditIndex(-1); // -1은 '새로 추가'를 의미
		onOpen();
	};

	// --- 핸들러: 카드 클릭 (수정) ---
	const handleClickCard = (history: SongHistory, index: number) => {
		setModalData({ ...history, sungAt: formatDateToYYYYMMDD(history.sungAt) });
		setTimeStrStart(isTimeFormat ? formatTime(history.start) || "00:00" : String(history.start || 0));
		setTimeStrEnd(
			isTimeFormat
				? formatTime(history.end)
				: history.end !== undefined && history.end !== null
					? String(history.end)
					: "",
		);
		setEditIndex(index);
		onOpen();
	};

	// --- 핸들러: 기록 삭제 ---
	const handleRemoveHistory = (e: React.MouseEvent, indexToRemove: number) => {
		e.stopPropagation();
		setEditingSong((prev) => {
			if (!prev) return prev;
			return {
				...prev,
				song_histories: prev.song_histories.filter((_, idx) => idx !== indexToRemove),
			};
		});
	};

	// --- 핸들러: 모달 저장 ---
	const handleSaveHistory = () => {
		if (!modalData) return;
		const { sungAt, youtubeVideoId, start, end, memo } = modalData;
		if (sungAt === "") return;

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
			...modalData,
			start: finalStart,
			end: finalEnd,
		};

		setEditingSong((prev) => {
			if (!prev) return prev;
			const newHistories = [...prev.song_histories];

			if (editIndex === -1) {
				newHistories.push(historyToSave);
			} else if (editIndex !== null) {
				newHistories[editIndex] = historyToSave;
			}

			return { ...prev, song_histories: newHistories };
		});

		onClose();
	};

	// 포맷 토글 시 로컬 스트링 상태도 맞춰서 변환
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

	const youtubeLink = (youtubeVideoId: string, start: number) =>
		`https://www.youtube.com/watch?v=${youtubeVideoId}&t=${start}s`;

	return (
		<>
			{/* 가창 기록 리스트 */}
			{editingSong.song_histories.map((his, idx) => (
				<Box
					key={idx}
					w="100%"
					p={2}
					borderWidth="1px"
					borderRadius="md"
					cursor="pointer"
					bg={his.isActive ? undefined : "red.100"}
					textDecoration={his.isActive ? undefined : "line-through"}
					_hover={{ bg: his.isActive ? "gray.100" : "red.200" }}
					onClick={() => handleClickCard(his, idx)}
				>
					<Flex direction="column" gap={1} overflow="hidden">
						{/* 1행 */}
						<Grid templateColumns="auto 1fr auto" gap={2} alignItems="center">
							<Text fontSize="xs" fontWeight="bold" whiteSpace="nowrap">
								{formatDateToYYYYMMDD(his.sungAt) || "날짜 미상"}
							</Text>
							<Text fontSize="xs" color="gray.500" isTruncated>
								{his.youtubeVideoId || "ID 없음"}
							</Text>
							<HStack gap={0}>
								<IconButton
									aria-label="Open youtube link"
									icon={<MdOpenInNew />}
									size="xs"
									variant="ghost"
									colorScheme="blue"
									onClick={(e) => {
										e.stopPropagation();
										window.open(youtubeLink(his.youtubeVideoId, his.start), "_blank");
									}}
								/>
								<IconButton
									aria-label="Remove history"
									icon={<MdClose />}
									size="xs"
									variant="ghost"
									colorScheme="red"
									onClick={(e) => handleRemoveHistory(e, idx)}
								/>
							</HStack>
						</Grid>

						{/* 2행 */}
						<Grid templateColumns="auto 1fr auto" gap={2} alignItems="center">
							<Text fontSize="xs" color="blue.500" whiteSpace="nowrap">
								{formatTime(his.start) || "00:00"}
								{his.end !== null ? ` ~ ${formatTime(his.end)}` : ""}
							</Text>
							<Text fontSize="xs" isTruncated>
								{his.memo || "메모 없음"}
							</Text>
							<Text fontSize="xs" isTruncated>
								중요도 {his.priority === 7 ? "⭐" : his.priority}
							</Text>
						</Grid>
					</Flex>
				</Box>
			))}

			{/* ➕ 추가 버튼 */}
			<Button leftIcon={<MdAdd />} size="sm" w="100%" colorScheme="teal" variant="outline" onClick={handleAddHistory}>
				새 가창 기록 추가
			</Button>

			{/* 🛠️ 수정/추가 모달 */}
			<Modal isOpen={isOpen} onClose={onClose} isCentered size="sm">
				<ModalOverlay />
				<ModalContent mx={4}>
					<ModalHeader fontSize="md">{editIndex === -1 ? "가창 기록 추가" : "가창 기록 수정"}</ModalHeader>
					<ModalCloseButton />

					<ModalBody>
						{modalData && (
							<Flex direction="column" gap={3}>
								<FormControl isInvalid={modalData.sungAt === ""}>
									<FormLabel fontSize="sm" mb={1} color={modalData.sungAt === "" ? "red.500" : undefined}>
										날짜 (sungAt)
									</FormLabel>
									<Input
										size="sm"
										type="date"
										value={modalData.sungAt || ""}
										onChange={(e) => setModalData({ ...modalData, sungAt: e.target.value })}
									/>
								</FormControl>

								<FormControl>
									<FormLabel fontSize="sm" mb={1}>
										유튜브 Video ID
										<IconButton
											aria-label="Open youtube link"
											icon={<MdOpenInNew />}
											size="xs"
											variant="ghost"
											colorScheme="blue"
											onClick={(e) => {
												e.stopPropagation();
												window.open(youtubeLink(modalData.youtubeVideoId, modalData.start), "_blank");
											}}
										/>
									</FormLabel>
									<Input
										size="sm"
										value={modalData.youtubeVideoId || ""}
										onChange={(e) => setModalData({ ...modalData, youtubeVideoId: e.target.value })}
									/>
								</FormControl>

								{/* ⏱️ 시간 입력 영역 */}
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
												placeholder={isTimeFormat ? "예: 01:25" : "예: 85"}
												value={timeStrStart || ""}
												onChange={(e) => setTimeStrStart(e.target.value)}
											/>
										</FormControl>
										<FormControl>
											<FormLabel fontSize="xs" mb={1}>
												종료 (선택)
											</FormLabel>
											<Input
												size="sm"
												type={isTimeFormat ? "text" : "number"}
												placeholder="없음"
												value={timeStrEnd || ""}
												onChange={(e) => setTimeStrEnd(e.target.value)}
											/>
										</FormControl>
									</Grid>
								</Box>

								<FormControl>
									<FormLabel fontSize="sm" mb={1}>
										메모
									</FormLabel>
									<Input
										size="sm"
										value={modalData.memo || ""}
										onChange={(e) => setModalData({ ...modalData, memo: e.target.value })}
									/>
								</FormControl>
								<Flex>
									<FormControl>
										<FormLabel fontSize="sm" mb={1}>
											중요도
										</FormLabel>
										<NumberInput
											value={modalData.priority || 0}
											defaultValue={0}
											min={0}
											max={255}
											size="sm"
											maxW={32}
											onChange={(_, number) => setModalData({ ...modalData, priority: number })}
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
										isChecked={modalData.isActive}
										onChange={(e) => {
											setModalData({ ...modalData, isActive: e.target.checked });
										}}
									>
										활성화
									</Checkbox>
								</Flex>
							</Flex>
						)}
					</ModalBody>

					<ModalFooter>
						<Button variant="ghost" mr={2} onClick={onClose} size="sm">
							취소
						</Button>
						<Button colorScheme="blue" onClick={handleSaveHistory} size="sm" isDisabled={modalData?.sungAt === ""}>
							저장
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}
