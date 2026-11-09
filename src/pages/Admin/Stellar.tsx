import { useAdminLoading } from "@/components/AdminLoading";
import { AdminTableHeight, useAdminTableHeight } from "@/components/AdminTableHeight";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { AdminModalContent } from "@/components/Modal";
import { useEffect, useRef, useState } from "react";
import { DefaultResponseData, fetchServer } from "../../lib/functions/fetch";
import {
	Box,
	Flex,
	HStack,
	IconButton,
	Modal,
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
	Divider,
	Button,
	Checkbox,
	useToast,
} from "@chakra-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import useColor from "../../lib/hooks/useColor";
import { v4 } from "uuid";
import { FiFolder, FiPlus } from "react-icons/fi";
import { useServerMutation, useServerQuery } from "@/lib/hooks/useServerApi";
import { CopyText } from "@/components/CopyText";
import GroupModal from "./Stellar/GroupModal";
import { MdDelete } from "react-icons/md";
import { naver, youtube } from "@/lib/functions/platforms";
import { FaYoutube } from "react-icons/fa6";
import { TbPlaylist } from "react-icons/tb";
import { Image } from "@/components/Image";
import { Link } from "@/components/Link";
import { toDateTimeInputValue } from "@/lib/functions/date";

interface StellarInputValue {
	name: string;
	nameShort: string;
	group: string;
	groups: StellarGroup[];
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
	id?: number;
	uuid: string;
	youtubeCustomUrl: string;
}

export interface StellarGroup {
	id?: number;
	name: string;
	engName: string;
	numbering: string;
	description: string;
	isActive: boolean;
	sortOrder: number;
}

export function Stellar() {
	const [tableHeight, setTableHeight] = useAdminTableHeight("stellar");
	const [stellarData, setStellarData] = useState<StellarData[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	useAdminLoading(isLoading, "스텔라 로딩 중");

	// 모달 (에디터) 상태
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingStellar, setEditingStellar] = useState<StellarData | null>(null);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [searchYoutubeId, setSearchYoutubeId] = useState("");
	const [isGroupOpen, setIsGroupOpen] = useState(false);

	// Hooks
	const toast = useToast();
	const { bgCard, borderColor, headerBg, fieldHoverBgColor, alternateRowBg, mutedColor } = useColor();
	const createStellar = useServerMutation<DefaultResponseData<StellarData>, StellarData, "admin">({
		version: "admin",
		api: "/stellar",
		method: "POST",
	});
	const editStellar = useServerMutation<void, { id: number }, "admin">({
		version: "admin",
		api: "/stellar/:id",
		method: "PATCH",
	});
	const deleteStellar = useServerMutation<void, { id: number }, "admin">({
		version: "admin",
		api: "/stellar/:id",
		method: "DELETE",
	});

	//TODO: Group 데이터에 대해 order 적용 (모달 내부까지)
	const getAllGroup = useServerQuery<DefaultResponseData<StellarGroup[]>>({ version: "admin", api: "/groups" });

	const parentRef = useRef<HTMLDivElement>(null);

	// 행 클릭 시 상세 모달 열기
	const handleRowClick = (index: number) => {
		const temp = { ...stellarData[index] };
		temp.debut = toDateTimeInputValue(temp.debut);
		temp.graduation = toDateTimeInputValue(temp.graduation);
		setEditingStellar(temp);
		setEditingIndex(index);
		setIsModalOpen(true);
	};

	const handleRowDelete = (id?: number) => {
		if (!id) return;
		if (confirm(`${id}번 데이터를 정말로 삭제하시겠습니까?`))
			deleteStellar.mutate(
				{ id },
				{
					onSuccess: () => {
						setStellarData((prev) => {
							const idx = prev.findIndex((p) => p.id === id);
							prev.splice(idx, 1);
							return prev;
						});
					},
					onError: () => {
						toast({ description: "그룹 편집 중 서버 에러 발생" });
					},
				},
			);
	};

	// 버튼 핸들러
	const handleAddNewStellar = () => {
		const newSong: StellarData = {
			name: "",
			nameShort: "",
			group: "",
			groups: [],
			formerGroups: [],
			youtubeId: "",
			chzzkId: "",
			xId: "",
			colorCode: "",
			playlistIdForMusic: "",
			justLive: false,
			debut: "",
			graduation: "",
			uuid: v4(),
			youtubeCustomUrl: "",
		};
		setEditingStellar(newSong);
		setEditingIndex(-1); // -1은 신규 추가를 의미
		setIsModalOpen(true);
	};
	const handleGroupSetting = () => {
		setIsGroupOpen(true);
	};

	// 모달 내 저장 버튼
	const handleSaveEdit = () => {
		if (!editingStellar) return;

		if (editingIndex === -1) {
			// 신규 추가
			// editingStellar.debut = toServerIsoString(editingStellar.debut) || "";
			// editingStellar.graduation = toServerIsoString(editingStellar.graduation) || "";
			createStellar.mutate(editingStellar, {
				onSuccess: (data) => {
					setStellarData((prev) => [...prev, data.data]);
					setIsModalOpen(false);
				},
				onError: () => {
					toast({ description: "스텔라 추가 중 서버 에러 발생" });
				},
			});
		} else {
			// 기존 데이터 수정
			// editingStellar.debut = toServerIsoString(editingStellar.debut) || "";
			// editingStellar.graduation = toServerIsoString(editingStellar.graduation) || "";
			editStellar.mutate(editingStellar as Required<StellarData>, {
				onSuccess: () => {
					const targetOriginalStellar = stellarData[editingIndex!];
					setStellarData((prev) =>
						prev.map((s) => {
							if (s === targetOriginalStellar) {
								return { ...editingStellar };
							}
							return s;
						}),
					);
					setIsModalOpen(false);
				},
				onError: () => {
					toast({ description: "스텔라 편집 중 서버 에러 발생" });
				},
			});
		}
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

	const handleGroup = (e: React.ChangeEvent<HTMLSelectElement>) => {
		if (!editingStellar) return;

		const value = Number(e.target.value);

		if (isNaN(value))
			toast({ title: "올바르지 않은 id 입력됨. 코드 점검 요함", status: "error", duration: 3000, isClosable: true });
		e.target.value = "";

		const selectedGroup = getAllGroup.data?.data.find((g) => g.id === value);
		setEditingStellar({ ...editingStellar, groups: selectedGroup ? [selectedGroup] : [] });
	};

	useEffect(() => {
		fetchServer("admin", "/stellars").then((res) => {
			setStellarData(res.data.data);
		}).catch(() => {
			toast({ status: "error", description: "스텔라 데이터를 불러오지 못했습니다." });
		}).finally(() => setIsLoading(false));
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
			<AdminPageHeader title="스텔라 데이터 관리" description="스텔라들의 상세 데이터를 관리합니다."
				actions={<>
					<Button size="sm" leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNewStellar}>
						추가
					</Button>
					<Button size="sm" leftIcon={<FiFolder />} colorScheme="gray" onClick={handleGroupSetting} variant={"outline"}>
						그룹 관리
					</Button>
				</>}>
				<AdminTableHeight value={tableHeight} onChange={setTableHeight} />
			</AdminPageHeader>
			<Stack>
				<Box bg={bgCard} rounded="xl" shadow="sm" border={`1px solid ${borderColor}`} overflowX="auto" sx={{ touchAction: "pan-x pan-y", WebkitOverflowScrolling: "touch" }}>
					<Box minW="850px">
					{/* 테이블 헤더 */}
					<Flex bg={headerBg} borderBottom={`1px solid ${borderColor}`} px={4} py={3} fontWeight="bold" fontSize="sm">
						<Box flexShrink={0} w="60px">ID</Box>
						<Box flexShrink={0} w="140px">이름</Box>
						<Box flexShrink={0} w="120px" textAlign="center">
							그룹
						</Box>
						<Box flexShrink={0} w="80px" textAlign="center">
							색상
						</Box>
						<Box flex={1} minW={0} textAlign="center">
							소스
						</Box>
						<Box flexShrink={0} w="60px" textAlign="center">
							작업
						</Box>
					</Flex>

					{/* 가상화 컨테이너 */}
					<Box ref={parentRef} h={`${tableHeight}px`} overflowY="auto">
						<Box position="relative" h={`${rowVirtualizer.getTotalSize()}px`} w="100%">
							{/* 가상화된 행 렌더링 */}
							{rowVirtualizer.getVirtualItems().map((virtualRow) => {
								const stellar = stellarData[virtualRow.index];
								// youtubeId가 여러개인 경우를 대비
								const youtubeIds = stellar.youtubeId.split(",");

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
										bg={virtualRow.index % 2 ? alternateRowBg : bgCard}
										align="center"
										borderBottom={`1px solid ${borderColor}`}
										cursor="pointer"
										_hover={{ bg: fieldHoverBgColor }}
										onClick={() => handleRowClick(virtualRow.index)}
									>
										<Box flexShrink={0} w="60px">{stellar.id}</Box>

										<Box flexShrink={0} w="140px" textAlign="center">
											{stellar.name}
											{stellar.nameShort && `(${stellar.nameShort})`}
										</Box>
										<Box flexShrink={0} w="120px" textAlign="center">
											{stellar.groups && stellar.groups[0]?.name}
										</Box>
										<Flex flexShrink={0} w="80px" fontSize="2xs" justifyContent={"center"}>
											<CopyText color={`#${stellar.colorCode}`} fontWeight={"bold"}>
												{stellar.colorCode && `#${stellar.colorCode}`}
											</CopyText>
										</Flex>
										<Box flex={1} minW={0}>
											<HStack spacing={2} justify={"center"}>
												{stellar.youtubeId &&
													youtubeIds.map((id) => (
														<Text
															key={id}
															as={Link}
															href={youtube.channelUrlByYoutubeId(id)}
															isExternal
															color="red.500"
															fontSize="xl"
															onClick={(e) => {
																e.stopPropagation();
															}}
														>
															<FaYoutube />
														</Text>
													))}
												{stellar.playlistIdForMusic && (
													<Text
														as={Link}
														href={youtube.playlistUrl(stellar.playlistIdForMusic)}
														isExternal
														color="red.500"
														fontSize="xl"
														onClick={(e) => {
															e.stopPropagation();
														}}
													>
														<TbPlaylist />
													</Text>
												)}
												{stellar.chzzkId && (
													<Text
														as={Link}
														href={naver.chzzk.channelUrl(stellar.chzzkId)}
														isExternal
														fontSize="xl"
														onClick={(e) => {
															e.stopPropagation();
														}}
													>
														<Image src="/images/i_chzzk_1.png" boxSize="20px" />
													</Text>
												)}
											</HStack>
										</Box>
										<Flex flexShrink={0} w="60px" fontSize="2xs" justifyContent={"center"}>
											<IconButton
												aria-label="Delete stellar"
												size="sm"
												variant={"ghost"}
												onClick={(e) => {
													e.stopPropagation();
													handleRowDelete(stellar.id);
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
					{/* 그룹 편집 모달 */}
					<GroupModal
						isModalOpen={isGroupOpen}
						setIsModalOpen={setIsGroupOpen}
						data={getAllGroup.data?.data}
						refetch={getAllGroup.refetch}
					/>

					{/* 스텔라 편집 모달 */}
					<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="4xl" closeOnOverlayClick={false}>
						<ModalOverlay bg="#090612b3" backdropFilter="blur(4px)" />
						<AdminModalContent>
							<ModalHeader>
								{editingIndex === -1 ? "새 스텔라 추가" : "스텔라 상세 정보 수정"}
								<Text fontSize="xs" color={mutedColor} fontWeight="400">
									{editingStellar?.uuid || ""}
								</Text>
							</ModalHeader>

							<ModalCloseButton />

							{editingStellar && (
								<ModalBody>
									<HStack flexDirection={["column", "column", "row"]} align={"stretch"}>
										<VStack spacing={4} align="stretch" flex={1} minW={0} width={["100%", "100%", "auto"]}>
											<Flex gap={4}>
												<FormControl flex={1} minW={0}>
													<FormLabel fontSize="sm">이름</FormLabel>
													<Input
														size="sm"
														value={editingStellar.name || ""}
														onChange={(e) => setEditingStellar({ ...editingStellar, name: e.target.value })}
													/>
												</FormControl>
												<FormControl flex={1} minW={0}>
													<FormLabel fontSize="sm">짧은 이름</FormLabel>
													<Input
														size="sm"
														value={editingStellar.nameShort || ""}
														onChange={(e) => setEditingStellar({ ...editingStellar, nameShort: e.target.value })}
													/>
												</FormControl>
												<FormControl flex={1} minW={0}>
													<FormLabel fontSize="sm">그룹</FormLabel>
													<Select
														size="sm"
														placeholder="그룹을 선택해주세요"
														onChange={handleGroup}
														value={(editingStellar.groups[0] && editingStellar.groups[0].id) || ""}
														isDisabled={getAllGroup.data?.data.length === 0}
													>
														{getAllGroup.data && getAllGroup.data.data.length > 0 ? (
															getAllGroup.data.data.map((g) => (
																<option key={g.id} value={g.id}>
																	{`${g.engName && `${g.numbering} - `}${g.name}${g.engName && `(${g.engName})`}`}
																</option>
															))
														) : (
															<option>그룹 데이터 없음</option>
														)}
													</Select>
												</FormControl>
												<FormControl flex={1} minW={0}>
													<FormLabel fontSize="sm">그룹(deprecated)</FormLabel>
													<Text>{editingStellar.group}</Text>
												</FormControl>
											</Flex>

											<Flex gap={4}>
												<FormControl flex={1} minW={0}>
													<FormLabel fontSize="sm">데뷔일</FormLabel>
													<Input
														size="sm"
														fontSize="xs"
														value={editingStellar.debut || ""}
														onChange={(e) => setEditingStellar({ ...editingStellar, debut: e.target.value })}
														type="datetime-local"
													/>
												</FormControl>
												<FormControl flex={1} minW={0}>
													<FormLabel fontSize="sm">졸업일</FormLabel>
													<Input
														size="sm"
														fontSize="xs"
														value={editingStellar.graduation || ""}
														onChange={(e) => setEditingStellar({ ...editingStellar, graduation: e.target.value })}
														type="datetime-local"
													/>
												</FormControl>
												<FormControl flex={1} minW={0}>
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
														value={editingStellar.colorCode || ""}
														onChange={(e) => setEditingStellar({ ...editingStellar, colorCode: e.target.value })}
													/>
												</FormControl>
												<Box flex={1} minW={0}></Box>
											</Flex>
											<Divider />
											<Flex gap={4}>
												<FormControl flex={1} minW={0}>
													<FormLabel fontSize="sm">치지직 ID</FormLabel>
													<Input
														size="sm"
														value={editingStellar.chzzkId || ""}
														onChange={(e) => setEditingStellar({ ...editingStellar, chzzkId: e.target.value })}
													/>
												</FormControl>
												<Box flex={1} minW={0}></Box>
												<Box flex={1} minW={0}></Box>
												<Box flex={1} minW={0}></Box>
											</Flex>
											<Flex gap={4}>
												<FormControl flex={1} minW={0}>
													<FormLabel fontSize="sm">유튜브 ID</FormLabel>
													<Input
														size="sm"
														value={editingStellar.youtubeId || ""}
														onChange={(e) => setEditingStellar({ ...editingStellar, youtubeId: e.target.value })}
													/>
												</FormControl>
												<FormControl flex={1} minW={0}>
													<FormLabel fontSize="sm">유튜브 별칭주소</FormLabel>
													<Input
														size="sm"
														value={editingStellar.youtubeCustomUrl || ""}
														onChange={(e) => setEditingStellar({ ...editingStellar, youtubeCustomUrl: e.target.value })}
													/>
												</FormControl>
												<FormControl flex={1} minW={0}>
													<FormLabel fontSize="sm">플레이리스트 ID</FormLabel>
													<Input
														size="sm"
														value={editingStellar.playlistIdForMusic || ""}
														onChange={(e) =>
															setEditingStellar({ ...editingStellar, playlistIdForMusic: e.target.value })
														}
													/>
												</FormControl>
												<Box flex={1} minW={0}></Box>
											</Flex>
											<Flex gap={2} alignItems={"flex-end"}>
												<FormControl flex={1} minW={0}>
													<FormLabel fontSize="sm">유튜브 ID 검색</FormLabel>
													<Input
														size="sm"
														value={searchYoutubeId || ""}
														onChange={(e) => setSearchYoutubeId(e.target.value)}
														onKeyUp={(e) => {
															if (e.key === "Enter") {
																handleGetYoutubeId();
															}
														}}
														placeholder="별칭을 입력해 ID 찾기"
													/>
												</FormControl>
												<Box flex={1} minW={0}>
													<Button width="72px" size={"sm"} onClick={handleGetYoutubeId}>
														검색
													</Button>
												</Box>
												<Box flex={1} minW={0}></Box>
												<Box flex={1} minW={0}></Box>
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
								<Button
									colorScheme="purple"
									onClick={handleSaveEdit}
									disabled={editStellar.isPending || createStellar.isPending}
								>
									적용하기
								</Button>
							</ModalFooter>
						</AdminModalContent>
					</Modal>
					</Box>
				</Box>
			</Stack>
		</Box>
	);
}
