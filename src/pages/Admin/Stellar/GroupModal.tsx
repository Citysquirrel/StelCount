import { DefaultResponseData } from "@/lib/functions/fetch";
import { useServerMutation, useServerQuery } from "@/lib/hooks/useServerApi";
import {
	Modal,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	ModalCloseButton,
	ModalBody,
	ModalFooter,
	Text,
	Button,
	Flex,
	Box,
	HStack,
	Heading,
	VStack,
	IconButton,
	Divider,
	Input,
	FormControl,
	FormLabel,
	FormHelperText,
	Checkbox,
	useToast,
} from "@chakra-ui/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { StellarGroup } from "../Stellar";
import { MdAdd, MdArrowBack, MdDelete, MdEdit } from "react-icons/md";
import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";

type ViewMode = "list" | "add" | "edit";

interface GroupModalProps {
	isModalOpen: boolean;
	setIsModalOpen: Dispatch<SetStateAction<boolean>>;
	data: StellarGroup[] | undefined;
	refetch: (options?: RefetchOptions) => Promise<QueryObserverResult<DefaultResponseData<StellarGroup[]>, Error>>;
}

export default function GroupModal({ isModalOpen, setIsModalOpen, data, refetch }: GroupModalProps) {
	const toast = useToast();
	// api 관리
	const createGroup = useServerMutation<DefaultResponseData<StellarGroup>, StellarGroup, "admin">({
		version: "admin",
		api: "/group",
		method: "POST",
	});
	const editGroup = useServerMutation<void, { id: number }, "admin">({
		version: "admin",
		api: "/group/:id",
		method: "PATCH",
	});
	const deleteGroup = useServerMutation<void, { id: number }, "admin">({
		version: "admin",
		api: "/group/:id",
		method: "DELETE",
	});

	// 상태관리
	const [groups, setGroups] = useState<StellarGroup[]>(data || []);
	const [viewMode, setViewMode] = useState<ViewMode>("list");
	const [selectedGroup, setSelectedGroup] = useState<StellarGroup | null>(null);
	const [inputValue, setInputValue] = useState<StellarGroup>({
		name: "",
		engName: "",
		numbering: "",
		description: "",
		isActive: true,
		sortOrder: 0,
	});

	// 핸들러: 새 그룹 추가 시작
	const handleAddStart = () => {
		setSelectedGroup(null);
		setInputValue({ name: "", engName: "", numbering: "", description: "", isActive: true, sortOrder: 0 });
		setViewMode("add");
	};

	// 핸들러: 그룹 편집 시작
	const handleEditStart = (group: StellarGroup) => {
		setSelectedGroup(group);
		setInputValue(group);
		setViewMode("edit");
	};

	// 핸들러: 저장 (추가/편집 통합)
	const handleSave = () => {
		if (!inputValue.name.trim()) return;

		if (viewMode === "add") {
			createGroup.mutate(inputValue, {
				onSuccess: () => {
					setViewMode("list");
					setInputValue({ name: "", engName: "", numbering: "", description: "", isActive: true, sortOrder: 0 });
					setSelectedGroup(null);
					refetch();
				},
				onError: () => {
					toast({ description: "그룹 추가 중 서버 에러 발생" });
				},
			});
		} else if (viewMode === "edit" && selectedGroup) {
			editGroup.mutate(inputValue as Required<StellarGroup>, {
				onSuccess: () => {
					setViewMode("list");
					setInputValue({ name: "", engName: "", numbering: "", description: "", isActive: true, sortOrder: 0 });
					setSelectedGroup(null);
					refetch();
				},
				onError: () => {
					toast({ description: "그룹 편집 중 서버 에러 발생" });
				},
			});
		}
	};

	// 핸들러: 삭제
	const handleDelete = (id: number) => {
		deleteGroup.mutate(
			{ id },
			{
				onSuccess: () => {
					refetch();
				},
				onError: () => {
					toast({ description: "그룹 삭제 중 서버 에러 발생" });
				},
			},
		);
	};

	// 동기화
	useEffect(() => {
		if (data) {
			setGroups(data);
		}
	}, [data]);

	return (
		<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>
					스텔라 그룹 관리
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
									<Heading size="md">그룹 목록</Heading>
									<Button size="sm" leftIcon={<MdAdd />} colorScheme="blue" onClick={handleAddStart}>
										추가
									</Button>
								</HStack>
								<Divider mb={4} />

								<VStack align="stretch" spacing={2} maxH="300px" overflowY="auto">
									{groups.map((group) => (
										<HStack
											key={group.id}
											p={3}
											borderWidth="1px"
											borderRadius="md"
											justify="space-between"
											_hover={{ bg: "gray.50" }}
										>
											<HStack spacing={1}>
												<Text fontWeight="medium">{group.name}</Text>
												{group.engName && <Text fontWeight="medium">{`(${group.engName})`}</Text>}
												{group.numbering && (
													<Text fontSize="sm" color={"gray"}>
														{group.numbering}
													</Text>
												)}
											</HStack>
											<HStack spacing={1}>
												<IconButton
													aria-label="Edit group"
													icon={<MdEdit />}
													size="sm"
													variant="ghost"
													onClick={() => handleEditStart(group)}
												/>
												<IconButton
													aria-label="Delete group"
													icon={<MdDelete />}
													size="sm"
													variant="ghost"
													colorScheme="red"
													onClick={() => handleDelete(group.id!)}
												/>
											</HStack>
										</HStack>
									))}
									{groups.length === 0 && (
										<Text color="gray.500" textAlign="center" py={8}>
											등록된 그룹이 없습니다.
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
									<Heading size="md">{viewMode === "add" ? "새 그룹 추가" : "그룹 편집"}</Heading>
								</HStack>
								<Divider mb={4} />
								{/* name: string;
	engName: string;
	numbering: string;
	description: string;
	isActive: boolean;
	sortOrder?: number; */}
								<VStack align="stretch" spacing={2}>
									<FormControl>
										<FormLabel fontSize="md">이름</FormLabel>
										<Input
											size={"sm"}
											placeholder="표시될 그룹 한글 이름입니다"
											value={inputValue.name}
											onChange={(e) => setInputValue((prev) => ({ ...prev, name: e.target.value }))}
											autoFocus
										/>
									</FormControl>
									<FormControl>
										<FormLabel fontSize="md">영문 이름</FormLabel>
										<Input
											size={"sm"}
											placeholder="표시될 그룹 영문 이름입니다"
											value={inputValue.engName}
											onChange={(e) => setInputValue((prev) => ({ ...prev, engName: e.target.value }))}
										/>
									</FormControl>
									<FormControl>
										<FormLabel fontSize="md">기수번호</FormLabel>
										<Input
											size={"sm"}
											placeholder="표시될 그룹 기수 번호입니다(예: 1기, 2기)"
											value={inputValue.numbering}
											onChange={(e) => setInputValue((prev) => ({ ...prev, numbering: e.target.value }))}
										/>
									</FormControl>
									<FormControl>
										<FormLabel fontSize="md">설명</FormLabel>
										<Input
											size={"sm"}
											placeholder="내부적으로 확인할 설명란입니다"
											value={inputValue.description}
											onChange={(e) => setInputValue((prev) => ({ ...prev, description: e.target.value }))}
										/>
									</FormControl>
									<Checkbox
										isChecked={inputValue.isActive}
										onChange={(e) => setInputValue((prev) => ({ ...prev, isActive: e.target.checked }))}
										alignSelf={"flex-end"}
									>
										활성화
									</Checkbox>

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
