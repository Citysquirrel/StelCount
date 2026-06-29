import { useEffect, useRef, useState } from "react";
import { DefaultResponseData, fetchServer } from "../../lib/functions/fetch";
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
	useToast,
	Link,
	Icon,
} from "@chakra-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import useColor from "../../lib/hooks/useColor";
import { v4 } from "uuid";
import { FiCheckCircle, FiFolder, FiPlus } from "react-icons/fi";
import { useServerMutation, useServerQuery } from "@/lib/hooks/useServerApi";
import { CopyText } from "@/components/CopyText";
import GroupModal from "./Stellar/GroupModal";
import { MdDelete } from "react-icons/md";
import { naver, youtube } from "@/lib/functions/platforms";
import { FaYoutube } from "react-icons/fa6";
import { TbPlaylist } from "react-icons/tb";
import { Image } from "@/components/Image";
import { Statistics, VideoDetail, YoutubeMusicData } from "@/lib/types";
import { getThumbnails } from "@/lib/functions/etc";

interface VideoInputValue {
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

interface VideoData extends Omit<
	YoutubeMusicData,
	"details" | "statistics" | "mostPopular" | "mostPopularMusic" | "thumbnail" | "thumbnails"
> {
	id?: number;
	thumbnail?: string;
	thumbnails?: string;
	mostPopular?: number;
	mostPopularMusic?: number;
	details?: VideoDetail[];
	statistics?: Statistics[];
	inheritChannelId?: string;
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

export function Video() {
	const [videoData, setVideoData] = useState<VideoData[]>([]);

	// 모달 (에디터) 상태
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);
	const [searchYoutubeId, setSearchYoutubeId] = useState("");
	const [isGroupOpen, setIsGroupOpen] = useState(false);

	// Hooks
	const toast = useToast();
	const { bgCard, borderColor, headerBg, greenColor, redColor, blueColor, grayColor, yellowColor, fieldHoverBgColor } =
		useColor();
	const getAllVideos = useServerQuery<DefaultResponseData<VideoData[]>>({
		version: "admin",
		api: "/videos",
	});
	const createVideo = useServerMutation<DefaultResponseData<VideoData>, VideoData, "admin">({
		version: "admin",
		api: "/video",
		method: "POST",
	});
	const editVideo = useServerMutation<void, { id: number }, "admin">({
		version: "admin",
		api: "/video/:id",
		method: "PATCH",
	});
	const deleteVideo = useServerMutation<void, { id: number }, "admin">({
		version: "admin",
		api: "/video/:id",
		method: "DELETE",
	});

	const parentRef = useRef<HTMLDivElement>(null);

	// 행 클릭 시 상세 모달 열기
	const handleRowClick = (index: number) => {
		setEditingVideo({ ...videoData[index] });
		setEditingIndex(index);
		setIsModalOpen(true);
	};

	const handleRowDelete = (id?: number) => {
		if (!id) return;
		if (confirm(`${id}번 데이터를 정말로 삭제하시겠습니까?`))
			deleteVideo.mutate(
				{ id },
				{
					onSuccess: () => {
						setVideoData((prev) => {
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
	const handleAddNewVideo = () => {
		const newSong: VideoData = {
			type: "music",
			title: "",
			titleAlias: "",
			channelId: "",
			videoId: "",
			isActive: true,
			inheritChannelId: "",
			tags: [],
		};
		setEditingVideo(newSong);
		setEditingIndex(-1); // -1은 신규 추가를 의미
		setIsModalOpen(true);
	};
	const handleGroupSetting = () => {
		setIsGroupOpen(true);
	};

	// 모달 내 저장 버튼
	const handleSaveEdit = () => {
		if (!editingVideo) return;

		if (editingIndex === -1) {
			// 신규 추가
			createVideo.mutate(editingVideo, {
				onSuccess: (data) => {
					setVideoData((prev) => [...prev, data.data]);
					setIsModalOpen(false);
				},
				onError: () => {
					toast({ description: "영상 추가 중 서버 에러 발생" });
				},
			});
		} else {
			// 기존 데이터 수정
			editVideo.mutate(editingVideo as Required<VideoData>, {
				onSuccess: () => {
					const targetOriginalStellar = videoData[editingIndex!];
					setVideoData((prev) =>
						prev.map((s) => {
							if (s === targetOriginalStellar) {
								return { ...editingVideo };
							}
							return s;
						}),
					);
					setIsModalOpen(false);
				},
			});
		}
	};

	// const handleGetYoutubeId = (e?: React.MouseEvent<HTMLButtonElement>) => {
	// 	e?.preventDefault();
	// 	if (searchYoutubeId === "") {
	// 		alert("빈값");
	// 		return;
	// 	}
	// 	fetchServer("v1", `/yid?username=${searchYoutubeId}`).then((res) => {
	// 		if (res && res.data.items && editingVideo) {
	// 			if (editingVideo.youtubeId.length === 0) {
	// 				setEditingVideo(() => ({ ...editingVideo, youtubeId: res.data.items[0].id }));
	// 			} else {
	// 				setEditingVideo(() => ({
	// 					...editingVideo,
	// 					youtubeId: editingVideo.youtubeId + "," + res.data.items[0].id,
	// 				}));
	// 			}
	// 		} else {
	// 			// toast({ description: "올바르지 않은 채널명입니다", status: "error" });
	// 		}
	// 	});
	// };

	// const handleGroup = (e: React.ChangeEvent<HTMLSelectElement>) => {
	// 	if (!editingVideo) return;

	// 	const value = Number(e.target.value);

	// 	if (isNaN(value))
	// 		toast({ title: "올바르지 않은 id 입력됨. 코드 점검 요함", status: "error", duration: 3000, isClosable: true });
	// 	e.target.value = "";

	// 	const selectedGroup = getAllGroup.data?.data.find((g) => g.id === value);
	// 	setEditingVideo({ ...editingVideo, groups: selectedGroup ? [selectedGroup] : [] });
	// };

	useEffect(() => {
		if (getAllVideos.data?.data) setVideoData(getAllVideos.data.data);
	}, [getAllVideos.data?.data]);
	// --- [가상화 스크롤 설정] ---
	const rowVirtualizer = useVirtualizer({
		count: videoData.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 48,
		overscan: 10,
	});
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
					<Button leftIcon={<FiFolder />} colorScheme="gray" onClick={handleGroupSetting} variant={"outline"}>
						태그 관리
					</Button>
				</Flex>
			</Flex>
			<Stack>
				<Box bg={bgCard} rounded="xl" shadow="sm" border={`1px solid ${borderColor}`} overflow="hidden">
					{/* 테이블 헤더 */}
					<Flex bg={headerBg} borderBottom={`1px solid ${borderColor}`} px={4} py={3} fontWeight="bold" fontSize="sm">
						<Box w="60px">ID</Box>
						<Box w="60px">상속</Box>
						<Box w="120px">썸네일</Box>
						<Box flex={1}>제목(태그)</Box>
					</Flex>

					{/* 가상화 컨테이너 */}
					<Box ref={parentRef} h="384px" overflowY="auto">
						<Box position="relative" h={`${rowVirtualizer.getTotalSize()}px`} w="100%">
							{/* 가상화된 행 렌더링 */}
							{rowVirtualizer.getVirtualItems().map((virtualRow, index) => {
								const video = videoData[virtualRow.index];
								// ID
								// 타이틀 (대체됨 여부까지)
								// 썸네일
								// videoId
								// 상속
								// 태그뱃지
								//// 2줄로하자

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
										borderBottom={`1px solid ${borderColor}`}
										cursor="pointer"
										_hover={{ bg: fieldHoverBgColor }}
										onClick={() => handleRowClick(virtualRow.index)}
									>
										<Box w="60px">{video.id}</Box>
										<Box w="60px" textAlign="center">
											{video.inheritChannelId && <Icon as={FiCheckCircle} color="blue.500" boxSize={5} />}
										</Box>
										<Box w="120px" textAlign="center">
											<Image src={getThumbnails(video.thumbnails).default?.url || "/images/no_thb.png"} />
										</Box>
										<Flex flex={1} fontSize="2xs" justifyContent={"center"}>
											{video.titleAlias ? `${video.titleAlias}(수정됨)` : video.title}
										</Flex>
									</Flex>
								);
							})}
						</Box>
					</Box>

					{/* 비디오 편집 모달 */}
					<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="4xl" closeOnOverlayClick={false}>
						<ModalOverlay />
						<ModalContent>
							<ModalHeader>
								{editingIndex === -1 ? "새 영상 추가" : "영상 상세 정보 수정"}
								<Text fontSize="xs" color="gray" fontWeight="400">
									{/* {editingVideo?.uuid || ""} */}
								</Text>
							</ModalHeader>

							<ModalCloseButton />

							{editingVideo && (
								<ModalBody>
									<HStack flexDirection={["column", "column", "row"]} align={"stretch"}>
										<VStack spacing={4} align="stretch" flex={1} width={["100%", "100%", "auto"]}>
											<FormControl flex={1}>
												<FormLabel fontSize="sm">제목</FormLabel>
												<Input size="sm" value={editingVideo.title || ""} isDisabled />
											</FormControl>
											<FormControl flex={1}>
												<FormLabel fontSize="sm">대체 제목</FormLabel>
												<Input
													size="sm"
													value={editingVideo.titleAlias || ""}
													onChange={(e) => setEditingVideo({ ...editingVideo, titleAlias: e.target.value })}
												/>
											</FormControl>

											{/* <Flex gap={4}>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">데뷔일</FormLabel>
													<Input
														size="sm"
														fontSize="xs"
														value={editingVideo.debut || ""}
														onChange={(e) => setEditingVideo({ ...editingVideo, debut: e.target.value })}
														type="datetime-local"
													/>
												</FormControl>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">졸업일</FormLabel>
													<Input
														size="sm"
														fontSize="xs"
														value={editingVideo.graduation || ""}
														onChange={(e) => setEditingVideo({ ...editingVideo, graduation: e.target.value })}
														type="datetime-local"
													/>
												</FormControl>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">
														색상코드
														<Box
															display="inline-block"
															bg={`#${editingVideo.colorCode}`}
															borderRadius={"full"}
															border="1px solid black"
															boxSize="14px"
															transform="translate(2px, 2px)"
														/>
													</FormLabel>
													<Input
														size="sm"
														value={editingVideo.colorCode || ""}
														onChange={(e) => setEditingVideo({ ...editingVideo, colorCode: e.target.value })}
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
														value={editingVideo.chzzkId || ""}
														onChange={(e) => setEditingVideo({ ...editingVideo, chzzkId: e.target.value })}
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
														value={editingVideo.youtubeId || ""}
														onChange={(e) => setEditingVideo({ ...editingVideo, youtubeId: e.target.value })}
													/>
												</FormControl>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">유튜브 별칭주소</FormLabel>
													<Input
														size="sm"
														value={editingVideo.youtubeCustomUrl || ""}
														onChange={(e) => setEditingVideo({ ...editingVideo, youtubeCustomUrl: e.target.value })}
													/>
												</FormControl>
												<FormControl flex={1}>
													<FormLabel fontSize="sm">플레이리스트 ID</FormLabel>
													<Input
														size="sm"
														value={editingVideo.playlistIdForMusic || ""}
														onChange={(e) => setEditingVideo({ ...editingVideo, playlistIdForMusic: e.target.value })}
													/>
												</FormControl>
												<Box flex={1}></Box>
											</Flex>
											<Flex gap={2} alignItems={"flex-end"}>
												<FormControl flex={1}>
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
												<Box flex={1}>
													<Button width="72px" size={"sm"} onClick={handleGetYoutubeId}>
														검색
													</Button>
												</Box>
												<Box flex={1}></Box>
												<Box flex={1}></Box>
											</Flex>
											<Divider /> */}
											<Checkbox
												isChecked={editingVideo.isActive}
												onChange={(e) => setEditingVideo({ ...editingVideo, isActive: e.target.checked })}
											>
												활성화
											</Checkbox>
										</VStack>
									</HStack>
								</ModalBody>
							)}

							<ModalFooter>
								<Button variant="ghost" mr={3} onClick={() => setIsModalOpen(false)}>
									취소
								</Button>
								<Button colorScheme="blue" onClick={handleSaveEdit} disabled={createVideo.isPending}>
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
