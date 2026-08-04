import { ImageV2 } from "@/components/Image";
import { Link } from "@/components/Link";
import { stellarV2State } from "@/lib/Atom";
import { formatUtcToKst } from "@/lib/functions/date";
import { getThumbnails, numberToLocaleString } from "@/lib/functions/etc";
import { normalizeKeyword } from "@/lib/functions/normalized";
import { youtube } from "@/lib/functions/platforms";
import { useServerMutation, useServerQuery } from "@/lib/hooks/useServerApi";
import { Statistics, Tag as TagType, VideoDetail, YoutubeMusicData } from "@/lib/types";
import {
	Box,
	Button,
	Card,
	CardBody,
	Checkbox,
	CloseButton,
	Divider,
	Flex,
	FormControl,
	FormLabel,
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
	Tag,
	Text,
	VStack,
	useToast,
} from "@chakra-ui/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { AiFillLike } from "react-icons/ai";
import { FaEye } from "react-icons/fa6";
import { FiCheckCircle, FiFolder, FiPlus } from "react-icons/fi";
import { IoRefreshCircle } from "react-icons/io5";
import { MdDelete, MdKeyboardArrowDown, MdKeyboardArrowUp, MdPublish } from "react-icons/md";
import { VscWarning } from "react-icons/vsc";
import { useRecoilState } from "recoil";
import { DefaultResponseData } from "../../lib/functions/fetch";
import useColor from "../../lib/hooks/useColor";
import DetailsEditor, { AdditionalInputValue } from "./Video/Details";
import FilterPanel from "./Video/FilterPanel";
import TagInputAutocomplete from "./Video/TagInput";
import TagModal from "./Video/TagModal";

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
	isInheritChannelId: boolean;
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

//TODO: 부가영상을 앞쪽으로 옮기거나 상세에 붙이는 것이 나을듯
//TODO: 업로드 날짜를 테이블에 입력
export function Video() {
	const [videoData, setVideoData] = useState<VideoData[]>([]);
	const [stellarData] = useRecoilState(stellarV2State);

	const stellarYoutubeChannelIds = stellarData.map((s) => s.yi.split(",")).flat();

	// 필터 상태
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStellar, setFilterStellar] = useState<string[]>([]);
	const [filterTag, setFilterTag] = useState<string[]>([]);

	// 모달 (에디터) 상태
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingVideo, setEditingVideo] = useState<VideoData | null>(null);
	const [editingIndex, setEditingIndex] = useState<number | null>(null);

	const [isTagOpen, setIsTagOpen] = useState(false);

	const filteredData = useMemo(() => {
		return videoData
			.filter((video) => {
				const normalizedQuery = normalizeKeyword(searchQuery);
				const matchSearch =
					normalizeKeyword(video.title).includes(normalizedQuery) ||
					normalizeKeyword(video.titleAlias || "").includes(normalizedQuery);
				const matchStellar = filterStellar.length > 0 ? filterStellar.includes(video.ownerId || "") : true;
				const matchTag =
					filterTag.length > 0
						? filterTag.includes("none")
							? video.tags?.length === 0
							: filterTag.some((filterId) => video.tags?.some((t) => String(t.id) === filterId))
						: true;
				return matchSearch && matchStellar && matchTag;
			})
			.sort((a, b) => (b.id as number) - (a.id as number));
	}, [videoData, searchQuery, filterStellar, filterTag]);

	// Hooks
	const toast = useToast();
	const { bgCard, borderColor, headerBg, fieldHoverBgColor } = useColor();
	const getAllVideos = useServerQuery<DefaultResponseData<VideoData[]>>({
		version: "admin",
		api: "/videos",
	});
	const getAllTags = useServerQuery<DefaultResponseData<TagType[]>>({
		version: "admin",
		api: "/tags",
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
	const handleRowClick = (index: number, videoId: number | undefined) => {
		if (!videoId) {
			toast({ status: "error", description: "ID가 존재하지 않습니다! 코드 또는 데이터에 이상이 있는 경우입니다!" });
			return;
		}
		const currentVideoData = filteredData[index];

		setEditingVideo({
			...currentVideoData,
			id: videoId,
			isInheritChannelId: !!currentVideoData.inheritChannelId,
			inheritChannelId: stellarData.find((s) => s.plm === currentVideoData.ownerId)?.yi || "",
		});
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
						toast({ description: "영상 데이터 편집 중 서버 에러 발생" });
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
		setEditingVideo({ ...prev, id: prev.id });
	};
	const handleModalPageDown = () => {
		if (editingIndex === null || isPageEnd) return;
		const nextIndex = editingIndex + 1;
		setEditingIndex(nextIndex);
		const prev = filteredData[nextIndex];
		setEditingVideo({ ...prev, id: prev.id });
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
			isInheritChannelId: false,
			tags: [],
		};
		setEditingVideo(newSong);
		setEditingIndex(-1); // -1은 신규 추가를 의미
		setIsModalOpen(true);
	};
	const handleTagSetting = () => {
		setIsTagOpen(true);
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
					getAllVideos.refetch();
				},
				onError: () => {
					toast({ description: "영상 추가 중 서버 에러 발생" });
				},
			});
		} else {
			// 기존 데이터 수정
			editVideo.mutate(editingVideo as Required<VideoData>, {
				onSuccess: () => {
					const targetOriginalStellar = filteredData[editingIndex!];
					setVideoData((prev) =>
						prev.map((s) => {
							if (s === targetOriginalStellar) {
								return { ...editingVideo };
							}
							return s;
						}),
					);
					setIsModalOpen(false);
					getAllVideos.refetch();
				},
				onError: () => {
					toast({ description: "영상 편집 중 서버 에러 발생" });
				},
			});
		}
	};

	// 태그 변화 핸들러
	const onChangeTags = (tags: TagType[]) => {
		setEditingVideo((prev) => {
			if (!prev) return prev;
			return { ...prev, tags };
		});
	};

	// Details 변화 핸들러
	const onChangeDetails = (details: AdditionalInputValue[]) => {
		if (!editingVideo || editingIndex === null) return;
		setEditingVideo({
			...editingVideo,
			details: details.map((dt) => ({
				...dt,
				id: filteredData[editingIndex].id,
				viewCount: "",
				likeCount: "",
				countUpdatedAt: "",
				statistics: [],
				youtube_video_detail_id: null,
				youtube_video_id: null,
			})) as VideoDetail[],
		});
	};

	// 필터 핸들러
	const onChangeStellarsFilter = (playlistIds: (string | number)[]) => {
		setFilterStellar(playlistIds.map(String));
	};
	const onChangeTagsFilter = (tagIds: (string | number)[]) => {
		setFilterTag(tagIds.map(String));
	};

	useEffect(() => {
		if (getAllVideos.data?.data) setVideoData(getAllVideos.data.data);
	}, [getAllVideos.data?.data]);
	// --- [가상화 스크롤 설정] ---
	const rowVirtualizer = useVirtualizer({
		count: filteredData.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 60,
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
			<Flex gap={2}>
				<InputGroup w="240px" size="sm">
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
							<CloseButton size="sm" onClick={() => setSearchQuery("")} />
						</InputRightElement>
					) : null}
				</InputGroup>
				<FilterPanel
					tags={getAllTags.data?.data}
					onChangeStellars={onChangeStellarsFilter}
					onChangeTags={onChangeTagsFilter}
				/>
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
					<Button size="sm" leftIcon={<FiPlus />} colorScheme="teal" onClick={handleAddNewVideo} isDisabled>
						추가
					</Button>
					<Button size="sm" leftIcon={<FiFolder />} colorScheme="gray" onClick={handleTagSetting} variant={"outline"}>
						태그 관리
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
						<Box w="40px">ID</Box>
						<Box w="54px" textAlign={"center"}>
							상속
						</Box>
						<Box w="100px" textAlign={"center"}>
							썸네일
						</Box>
						<Box flex={1} ml={2}>
							상세
						</Box>
						<Box w="120px" textAlign={"center"}>
							부가 영상
						</Box>
						<Box w="60px" textAlign={"center"}>
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
								const video = filteredData[virtualRow.index];
								const isFaded = !video.isActive;

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
										bg={isFaded ? "red.50" : index % 2 ? "gray.50" : undefined}
										align="center"
										borderBottom={`1px solid ${borderColor}`}
										cursor="pointer"
										_hover={{ bg: fieldHoverBgColor }}
										onClick={() => handleRowClick(virtualRow.index, video.id)}
									>
										{/* ID */}
										<Box w="40px">{video.id}</Box>
										{/* 상속 */}
										<Box w="54px" textAlign="center">
											{video.inheritChannelId ? (
												<Icon as={FiCheckCircle} color="blue.500" boxSize={5} />
											) : !stellarYoutubeChannelIds.includes(video.channelId) ? (
												<Icon as={VscWarning} color="orange.500" boxSize={5} />
											) : null}
										</Box>
										{/* 썸네일 */}
										<Flex w="100px" textAlign="center" align={"center"} justify={"center"}>
											<ImageV2
												src={getThumbnails(video.thumbnails).default?.url || ""}
												display="block"
												borderRadius={"4px"}
												mx="auto"
												w="92px"
												maxH="54px"
												objectPosition="center"
											/>
										</Flex>
										{/* 상세 */}
										<Box flex={1} fontSize="2xs" ml={2} opacity={isFaded ? 0.5 : 1}>
											<Text fontSize="16px" fontWeight={"bold"}>
												{video.titleAlias ? `${video.titleAlias}` : video.title}
												{video.titleAlias && (
													<Text as="span" display="inline-block" fontSize="12px" color="gray" fontWeight="400">
														(수정됨)
													</Text>
												)}
											</Text>
											<Text>
												{video.tags &&
													video.tags.map((tag) => (
														<Tag key={tag.id} colorScheme={tag.colorCode ? tag.colorCode : "gray"} mr={1}>
															{tag.name}
														</Tag>
													))}
											</Text>
										</Box>
										{/* 부가 영상 */}
										<VStack w="120px" gap={0}>
											{video.details && video.details.length > 0
												? video.details.map((dt) => (
														<Link
															key={dt.videoId}
															href={youtube.videoUrl(dt.videoId) || ""}
															isExternal
															fontSize="10px"
															onClick={(e) => {
																e.stopPropagation();
															}}
														>
															{dt.type}
														</Link>
													))
												: null}
										</VStack>
										{/* 조작 */}
										<Flex w="60px" justify={"center"}>
											<IconButton
												aria-label="Delete video"
												size="sm"
												variant={"ghost"}
												onClick={(e) => {
													e.stopPropagation();
													handleRowDelete(video.id);
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
					{/* 태그 편집 모달 */}
					<TagModal
						isModalOpen={isTagOpen}
						setIsModalOpen={setIsTagOpen}
						data={getAllTags.data?.data}
						refetch={getAllTags.refetch}
					/>

					{/* 비디오 편집 모달 */}
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
									{editingVideo?.id || ""}
								</Text>
							</ModalHeader>

							<ModalCloseButton />

							{editingVideo && (
								<ModalBody>
									<HStack flexDirection={["column", "column", "row"]} align={"stretch"}>
										<VStack spacing={2} align="stretch" flex={1} width={["100%", "100%", "auto"]}>
											{/* 상단: 제목 및 썸네일, 태그 */}
											<Flex gap={4}>
												<VStack flex={1}>
													<FormControl>
														<FormLabel fontSize="sm">제목</FormLabel>
														<Input size="sm" value={editingVideo.title || ""} isDisabled />
													</FormControl>
													<FormControl>
														<FormLabel fontSize="sm">대체 제목</FormLabel>
														<Input
															size="sm"
															value={editingVideo.titleAlias || ""}
															onChange={(e) => setEditingVideo({ ...editingVideo, titleAlias: e.target.value })}
														/>
													</FormControl>
													<FormControl>
														<TagInputAutocomplete
															data={editingVideo.tags}
															tagData={getAllTags.data?.data}
															size="sm"
															wrapperProps={{ maxW: "512px" }}
															onChangeTags={onChangeTags}
														/>
													</FormControl>
												</VStack>
												<Link href={youtube.videoUrl(editingVideo.videoId) || ""} isExternal>
													<ImageV2
														src={
															getThumbnails(editingVideo.thumbnails).maxres?.url ||
															getThumbnails(editingVideo.thumbnails).standard?.url ||
															getThumbnails(editingVideo.thumbnails).high?.url ||
															getThumbnails(editingVideo.thumbnails).medium?.url ||
															""
														}
														display="block"
														borderRadius={"4px"}
														mx="auto"
														w="320px"
														maxH="240px"
														objectPosition="center"
													/>
												</Link>
											</Flex>

											{/* 하단: Details 이외 체크박스, 기록 칸 */}
											<Flex gap={3}>
												<VStack flex={3}>
													<Card variant={"outline"} height="fit-content" width="100%">
														<CardBody display="flex" p={3} flexDirection="row">
															<DetailsEditor data={editingVideo.details} onChangeDetails={onChangeDetails} />
														</CardBody>
													</Card>
													<Card variant={"outline"} height="fit-content" width="100%">
														<CardBody display="flex" p={3} flexDirection="row">
															<VStack flex={1} align={"flex-start"}>
																<Checkbox
																	size="sm"
																	isChecked={editingVideo.isInheritChannelId}
																	onChange={(e) =>
																		setEditingVideo({ ...editingVideo, isInheritChannelId: e.target.checked })
																	}
																>
																	채널 ID 상속(다른 채널에 업로드 된 경우 사용합니다)
																</Checkbox>
																<Checkbox
																	size="sm"
																	isChecked={editingVideo.isActive}
																	onChange={(e) => setEditingVideo({ ...editingVideo, isActive: e.target.checked })}
																>
																	활성화
																</Checkbox>
															</VStack>
														</CardBody>
													</Card>
												</VStack>
												{/* 기록 */}
												<Card flex={2} variant={"outline"} height="fit-content">
													<CardBody display="flex" p={3} flexDirection="row">
														<Box flex={1}>
															<Heading fontSize="md" fontWeight={"600"}>
																기록
															</Heading>
															<Divider marginBlock={2} />
															<Flex align={"center"} gap={2}>
																<Icon boxSize="14px" as={FaEye} />
																<Text display="inline-block" fontSize="xs">
																	{numberToLocaleString(editingVideo.viewCount)}
																</Text>
															</Flex>
															<Flex align={"center"} gap={2}>
																<Icon boxSize="14px" as={AiFillLike} />
																<Text display="inline-block" fontSize="xs">
																	{numberToLocaleString(editingVideo.likeCount)}
																</Text>
															</Flex>
															{editingVideo.countUpdatedAt && (
																<Flex align={"center"} gap={2}>
																	<Icon boxSize="14px" as={IoRefreshCircle} />
																	<Text display="inline-block" fontSize="xs">
																		{formatUtcToKst(editingVideo.countUpdatedAt) || ""}
																	</Text>
																</Flex>
															)}
															<Flex align={"center"} gap={2} pt={1}>
																<Icon boxSize="14px" as={MdPublish} />
																<Text display="inline-block" fontSize="xs">
																	{formatUtcToKst(editingVideo.publishedAt) || ""}
																</Text>
															</Flex>
														</Box>
													</CardBody>
												</Card>
											</Flex>

											{/* 
											details
											
											scheduledStartTime
											liveBroadcastContent
											
											*/}
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
									disabled={editVideo.isPending || createVideo.isPending}
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
