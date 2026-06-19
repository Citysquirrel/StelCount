import { useEffect, useRef, useState } from "react";
import { fetchServer } from "../../lib/functions/fetch";
import {
	Badge,
	Box,
	Flex,
	HStack,
	Heading,
	IconButton,
	Modal,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	ModalCloseButton,
	ModalBody,
	ModalFooter,
	Stack,
	Text,
	VStack,
	FormControl,
	FormLabel,
	Input,
	Select,
	Textarea,
	Divider,
	Button,
	Checkbox,
} from "@chakra-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import useColor from "../../lib/hooks/useColor";

interface StellarInputValue {
	name: string;
	nameShort: string;
	group: string;
	groups: StellarGroups;
	formerGroups: string[];
	youtubeId: string;
	chzzkId: string;
	xId: string;
	colorCode: string;
	playlistIdForMusic: string;
	justLive: boolean;
	debut: string;
	graduation: string;
}

interface StellarData extends StellarInputValue {
	id: number;
	uuid: string;
	youtubeCustomUrl: string;
}

interface StellarGroups {
	id: number;
	name: string;
	numbering: string;
	description: string;
	isActive: boolean;
	stellar_id: number;
}

export function Stellar() {
	const [stellarData, setStellarData] = useState<StellarData[]>([]);

	// 모달 (에디터) 상태
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingStellar, setEditingStellar] = useState<StellarData | null>(null);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [searchYoutubeId, setSearchYoutubeId] = useState("");

	const { bgCard, borderColor, headerBg, greenColor, redColor, blueColor, grayColor, yellowColor, fieldHoverBgColor } =
		useColor();

	const parentRef = useRef<HTMLDivElement>(null);

	// 행 클릭 시 상세 모달 열기
	const handleRowClick = (index: number) => {
		setEditingStellar({ ...stellarData[index] });
		setEditingIndex(index);
		setIsModalOpen(true);
	};

	// 모달 내 저장 버튼
	const handleSaveEdit = () => {
		if (!editingStellar) return;

		// if (editingIndex === -1) {
		// 	// 신규 추가
		// 	setSongs((prev) => [editingStellar, ...prev]);
		// } else {
		// 	// 기존 데이터 수정
		// 	const targetOriginalSong = filteredSongs[editingIndex!];
		// 	setSongs((prev) =>
		// 		prev.map((s) => {
		// 			if (s === targetOriginalSong) {
		// 				const raw = rawSongRef.current.find((rs) => rs.syncId === s.syncId);

		// 				const newStatus: SyncStatus = !raw
		// 					? "NEW"
		// 					: isEqual(omit(raw, ["syncStatus"]), omit(editingStellar, ["syncStatus"]))
		// 						? "UNCHANGED"
		// 						: "MODIFIED";

		// 				return { ...editingStellar, syncStatus: newStatus };
		// 			}
		// 			return s;
		// 		}),
		// 	);
		// }
		setIsModalOpen(false);
	};

	const handleGetYoutubeId = (e?: React.MouseEvent<HTMLButtonElement>) => {
		e?.preventDefault();
		if (searchYoutubeId === "") {
			alert("빈값");
			return;
		}
		fetchServer("v1", `/yid?username=${searchYoutubeId}`).then((res) => {
			if (res && res.data.items && editingStellar) {
				if (editingStellar.youtubeId.length === 0) {
					setEditingStellar(() => ({ ...editingStellar, youtubeId: res.data.items[0].id }));
				} else {
					setEditingStellar(() => ({
						...editingStellar,
						youtubeId: editingStellar.youtubeId + "," + res.data.items[0].id,
					}));
				}
			} else {
				// toast({ description: "올바르지 않은 채널명입니다", status: "error" });
			}
		});
	};

	useEffect(() => {
		fetchServer("admin", "/stellars").then((res) => {
			setStellarData(res.data.data);
		});
		// fetchServer("v1", "/tags").then(() => {});
	}, []);
	// --- [가상화 스크롤 설정] ---
	const rowVirtualizer = useVirtualizer({
		count: stellarData.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 48,
		overscan: 10,
	});
	return (
		<Box>
			<Box mb={8}>
				<Heading size="lg" mb={2}>
					스텔라 데이터 관리
				</Heading>
				<Text color="gray.500" fontSize="sm">
					스텔라들의 상세 데이터를 관리합니다.
				</Text>
			</Box>
			<Stack>
				<Box bg={bgCard} rounded="xl" shadow="sm" border={`1px solid ${borderColor}`} overflow="hidden">
					{/* 테이블 헤더 */}
					<Flex bg={headerBg} borderBottom={`1px solid ${borderColor}`} px={4} py={3} fontWeight="bold" fontSize="sm">
						<Box w="60px">ID</Box>
						<Box w="140px">이름</Box>
						<Box w="140px" textAlign="center">
							그룹
						</Box>
						<Box w="120px" textAlign="center">
							활동일
						</Box>
						<Box flex={1}>소스</Box>
					</Flex>

					{/* 가상화 컨테이너 */}
					<Box ref={parentRef} h="384px" overflowY="auto">
						<Box position="relative" h={`${rowVirtualizer.getTotalSize()}px`} w="100%">
							{/* 가상화된 행 렌더링 */}
							{rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
								const stellar = stellarData[virtualRow.index];
								// const isFaded = song.actionStatus === "DELETED" || song.actionStatus === "DISABLED";
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
										bg={index % 2 ? "gray.50" : undefined}
										align="center"
										// bg={bgColor}
										borderBottom={`1px solid ${borderColor}`}
										// outline={song.actionStatus === "ACTIVE" ? undefined : "1px solid"}
										// outlineColor={borderColorMap[song.actionStatus] || undefined}
										cursor="pointer"
										_hover={{ bg: fieldHoverBgColor }}
										onClick={() => handleRowClick(virtualRow.index)}
									>
										<Box w="60px">{stellar.id}</Box>
										{/* <Stack w="100px" alignItems={"flex-start"}>
											<Badge
												colorScheme={
													stellar.syncStatus === "NEW" ? "green" : stellar.syncStatus === "MODIFIED" ? "yellow" : "gray"
												}
											>
												{stellar.syncStatus}
											</Badge>
											<Badge
												colorScheme={
													stellar.actionStatus === "ACTIVE"
														? "blue"
														: stellar.actionStatus === "DELETED"
															? "red"
															: stellar.actionStatus === "DISABLED"
																? "orange"
																: "gray"
												}
											>
												{stellar.actionStatus}
											</Badge>
										</Stack> */}
										<Box w="140px" textAlign="center">
											{stellar.name}
											{stellar.nameShort && `(${stellar.nameShort})`}
										</Box>
										<Box w="140px" textAlign="center">
											{stellar.group}
										</Box>
										<Box w="120px" textAlign="center">
											1234
										</Box>
										<Box flex={1}></Box>

										{/* 조작 버튼 구역 */}
										{/* <Box w="100px" textAlign="center">
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
										</Box> */}
									</Flex>
								);
							})}
						</Box>
					</Box>
					<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="4xl">
						<ModalOverlay />
						<ModalContent>
							<ModalHeader>
								{editingIndex === -1 ? "새 스텔라 추가" : "스텔라 상세 정보 수정"}
								<Text fontSize="xs" color="gray" fontWeight="400">
									{editingStellar?.uuid || ""}
								</Text>
							</ModalHeader>

							<ModalCloseButton />

							{editingStellar && (
								<ModalBody>
									<HStack flexDirection={["column", "column", "row"]} align={"stretch"}>
										<VStack spacing={4} align="stretch" flex={1} width={["100%", "100%", "auto"]}>
											<Flex gap={4}>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">이름</FormLabel>
													<Input
														size="sm"
														value={editingStellar.name}
														onChange={(e) => setEditingStellar({ ...editingStellar, name: e.target.value })}
													/>
												</FormControl>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">짧은 이름</FormLabel>
													<Input
														size="sm"
														value={editingStellar.nameShort}
														onChange={(e) => setEditingStellar({ ...editingStellar, nameShort: e.target.value })}
													/>
												</FormControl>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">그룹</FormLabel>
													{/* <Input
														size="sm"
														value={editingStellar.groups}
														onChange={(e) => setEditingStellar({ ...editingStellar, nameShort: e.target.value })}
													/> */}
												</FormControl>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">그룹(deprecated)</FormLabel>
													<Text>{editingStellar.group}</Text>
												</FormControl>
											</Flex>

											<Flex gap={4}>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">데뷔일</FormLabel>
													<Input
														size="sm"
														fontSize="xs"
														value={editingStellar.debut}
														onChange={(e) => setEditingStellar({ ...editingStellar, debut: e.target.value })}
														type="datetime-local"
													/>
												</FormControl>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">졸업일</FormLabel>
													<Input
														size="sm"
														fontSize="xs"
														value={editingStellar.graduation}
														onChange={(e) => setEditingStellar({ ...editingStellar, graduation: e.target.value })}
														type="datetime-local"
													/>
												</FormControl>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">
														색상코드
														<Box
															display="inline-block"
															bg={`#${editingStellar.colorCode}`}
															borderRadius={"full"}
															border="1px solid black"
															boxSize="14px"
															transform="translate(2px, 2px)"
														/>
													</FormLabel>
													<Input
														size="sm"
														value={editingStellar.colorCode}
														onChange={(e) => setEditingStellar({ ...editingStellar, colorCode: e.target.value })}
													/>
												</FormControl>
												<Box flex={1}></Box>
											</Flex>
											<Divider />
											<Flex gap={4}>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">치지직 ID</FormLabel>
													<Input
														size="sm"
														value={editingStellar.chzzkId}
														onChange={(e) => setEditingStellar({ ...editingStellar, chzzkId: e.target.value })}
													/>
												</FormControl>
												<Box flex={1}></Box>
												<Box flex={1}></Box>
												<Box flex={1}></Box>
											</Flex>
											<Flex gap={4}>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">유튜브 ID</FormLabel>
													<Input
														size="sm"
														value={editingStellar.youtubeId}
														onChange={(e) => setEditingStellar({ ...editingStellar, youtubeId: e.target.value })}
													/>
												</FormControl>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">유튜브 별칭주소</FormLabel>
													<Input
														size="sm"
														value={editingStellar.youtubeCustomUrl}
														onChange={(e) => setEditingStellar({ ...editingStellar, youtubeCustomUrl: e.target.value })}
													/>
												</FormControl>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">플레이리스트 ID</FormLabel>
													<Input
														size="sm"
														value={editingStellar.playlistIdForMusic}
														onChange={(e) =>
															setEditingStellar({ ...editingStellar, playlistIdForMusic: e.target.value })
														}
													/>
												</FormControl>
												<Box flex={1}></Box>
											</Flex>
											<Flex gap={2} alignItems={"flex-end"}>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">유튜브 ID 검색</FormLabel>
													<Input
														size="sm"
														value={searchYoutubeId}
														onChange={(e) => setSearchYoutubeId(e.target.value)}
														onKeyUp={(e) => {
															if (e.key === "Enter") {
																handleGetYoutubeId();
															}
														}}
														placeholder="별칭을 입력해 ID 찾기"
													/>
												</FormControl>
												<Box flex={1}>
													<Button width="72px" size={"sm"} onClick={handleGetYoutubeId}>
														검색
													</Button>
												</Box>
												<Box flex={1}></Box>
												<Box flex={1}></Box>
											</Flex>
											<Divider />
											<Checkbox
												isChecked={editingStellar.justLive}
												onChange={(e) => setEditingStellar({ ...editingStellar, justLive: e.target.checked })}
											>
												카운터 데이터를 제외하고 라이브만 표시합니다.
											</Checkbox>
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
			</Stack>
		</Box>
	);
}
