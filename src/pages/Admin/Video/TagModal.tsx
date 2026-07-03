import { DefaultResponseData } from "@/lib/functions/fetch";
import { useServerMutation } from "@/lib/hooks/useServerApi";
import {
	Box,
	Button,
	Checkbox,
	Divider,
	Flex,
	FormControl,
	FormLabel,
	HStack,
	Heading,
	IconButton,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Select,
	Tag,
	Text,
	VStack,
	chakra,
	useToast,
} from "@chakra-ui/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

import { CHAKRA_COLOR_SCHEME } from "@/lib/constant";
import { Tag as TagType } from "@/lib/types";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { MdAdd, MdArrowBack, MdDelete, MdEdit } from "react-icons/md";

type ViewMode = "list" | "add" | "edit";

interface TagModalProps {
	isModalOpen: boolean;
	setIsModalOpen: Dispatch<SetStateAction<boolean>>;
	data: TagType[] | undefined;
	refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<DefaultResponseData<TagType[]>, Error>>;
}

export default function TagModal({ isModalOpen, setIsModalOpen, data, refetch }: TagModalProps) {
	const toast = useToast();
	// api 관리
	const createTag = useServerMutation<DefaultResponseData<TagType>, TagType, "admin">({
		version: "admin",
		api: "/tag",
		method: "POST",
	});
	const editTag = useServerMutation<void, { id: number }, "admin">({
		version: "admin",
		api: "/tag/:id",
		method: "PATCH",
	});
	const deleteTag = useServerMutation<void, { id: number }, "admin">({
		version: "admin",
		api: "/tag/:id",
		method: "DELETE",
	});

	// 상태관리
	const [types, setTypes] = useState<TagType[]>(data || []);
	const [viewMode, setViewMode] = useState<ViewMode>("list");
	const [selectedType, setSelectedType] = useState<TagType | null>(null);
	const initTag: TagType = { name: "", colorCode: "", isCover: false };
	const [inputValue, setInputValue] = useState<TagType>(initTag);

	// 핸들러: 새 태그 추가 시작
	const handleAddStart = () => {
		setSelectedType(null);
		setInputValue(initTag);
		setViewMode("add");
	};

	// 핸들러: 태그 편집 시작
	const handleEditStart = (type: TagType) => {
		setSelectedType(type);
		setInputValue(type);
		setViewMode("edit");
	};

	// 핸들러: 저장 (추가/편집 통합)
	const handleSave = () => {
		if (!inputValue.name.trim()) return;

		if (viewMode === "add") {
			createTag.mutate(inputValue, {
				onSuccess: () => {
					setViewMode("list");
					setInputValue(initTag);
					setSelectedType(null);
					refetch();
				},
				onError: (err) => {
					toast({ description: err.message || "태그 추가 중 서버 에러 발생" });
				},
			});
		} else if (viewMode === "edit" && selectedType) {
			editTag.mutate(inputValue as Required<TagType>, {
				onSuccess: () => {
					setViewMode("list");
					setInputValue(initTag);
					setSelectedType(null);
					refetch();
				},
				onError: (err) => {
					toast({ description: err.message || "태그 편집 중 서버 에러 발생" });
				},
			});
		}
	};

	// 핸들러: 삭제
	const handleDelete = (id: number) => {
		if (confirm(`${data?.find((t) => t.id === id)?.name || `${id}번`} 항목을 삭제하시겠습니까?`))
			deleteTag.mutate(
				{ id },
				{
					onSuccess: () => {
						refetch();
					},
					onError: (err) => {
						toast({ description: err.message || "태그 삭제 중 서버 에러 발생" });
					},
				},
			);
	};

	// 동기화
	useEffect(() => {
		if (data) {
			setTypes(data);
		}
	}, [data]);

	return (
		<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>
					영상 태그 관리
					{/* {editingIndex === -1 ? "새 곡 직접 추가" : "노래 상세 정보 수정"} */}
					{/* <Text fontSize="xs" color="gray" fontWeight="400">
						{editingSong?.syncId || ""}
					</Text> */}
				</ModalHeader>

				<ModalCloseButton />
				<ModalBody>
					<Box w="100%" minH="350px">
						{viewMode === "list" ? (
							/* --- 리스트 뷰 --- */
							<Box animation="fadeIn 0.2s">
								<HStack justify="space-between" mb={4}>
									<Heading size="md">태그 목록</Heading>
									<Button size="sm" leftIcon={<MdAdd />} colorScheme="blue" onClick={handleAddStart}>
										추가
									</Button>
								</HStack>
								<Divider mb={4} />

								<VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
									{types.map((type) => (
										<HStack
											key={type.id}
											p={"4px 12px"}
											borderWidth="1px"
											borderRadius="md"
											justify="space-between"
											_hover={{ bg: "gray.50" }}
										>
											<HStack spacing={1}>
												{type.isCover && <Text>⭐</Text>}
												<Tag colorScheme={type.colorCode}>{type.name}</Tag>
												{type.count && <Text ml={2}>Ref: {type.count}</Text>}
											</HStack>
											<HStack spacing={1}>
												<IconButton
													aria-label="Edit type"
													icon={<MdEdit />}
													size="sm"
													variant="ghost"
													onClick={() => handleEditStart(type)}
												/>
												<IconButton
													aria-label="Delete type"
													icon={<MdDelete />}
													size="sm"
													variant="ghost"
													colorScheme="red"
													onClick={() => handleDelete(type.id!)}
												/>
											</HStack>
										</HStack>
									))}
									{types.length === 0 && (
										<Text color="gray.500" textAlign="center" py={8}>
											등록된 태그가 없습니다.
										</Text>
									)}
								</VStack>
							</Box>
						) : (
							/* --- 폼 뷰 (추가/편집) --- */
							<Box animation="fadeIn 0.2s">
								<HStack mb={4} spacing={3}>
									<IconButton
										aria-label="Back to list"
										icon={<MdArrowBack />}
										size="sm"
										variant="ghost"
										onClick={() => setViewMode("list")}
									/>
									<Heading size="md">{viewMode === "add" ? "새 태그 추가" : "태그 편집"}</Heading>
								</HStack>

								<Divider mb={4} />

								<VStack align="stretch" spacing={2}>
									<FormControl>
										<FormLabel fontSize="md">이름</FormLabel>
										<Input
											size={"sm"}
											placeholder="표시될 태그 이름입니다"
											value={inputValue.name}
											onChange={(e) => setInputValue((prev) => ({ ...prev, name: e.target.value }))}
											autoFocus
										/>
									</FormControl>
									<FormControl>
										<FormLabel fontSize="md">색상 스킴</FormLabel>
										<Select
											placeholder="색상 선택"
											size="sm"
											onChange={(e) => setInputValue((prev) => ({ ...prev, colorCode: e.target.value }))}
										>
											{CHAKRA_COLOR_SCHEME.map((colorScheme) => (
												<chakra.option key={colorScheme} value={colorScheme}>
													{colorScheme}
												</chakra.option>
											))}
										</Select>
									</FormControl>
									<Flex justify={"space-between"}>
										<Box>
											<Tag colorScheme={inputValue.colorCode || undefined}>{inputValue.name}</Tag>
										</Box>
										<Checkbox
											isChecked={inputValue.isCover}
											onChange={(e) => setInputValue((prev) => ({ ...prev, isCover: e.target.checked }))}
											alignSelf={"flex-end"}
										>
											커버곡임을 명시합니다.
										</Checkbox>
									</Flex>

									<HStack justify="flex-end" pb={1}>
										<Button onClick={() => setViewMode("list")} variant="outline">
											취소
										</Button>
										<Button colorScheme="blue" onClick={handleSave}>
											저장
										</Button>
									</HStack>
								</VStack>
							</Box>
						)}
					</Box>
				</ModalBody>
			</ModalContent>
		</Modal>
	);
}
