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
} from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";

interface Group {
	id?: number;
	name: string;
	numbering: string;
	description: string;
	isActive: boolean;
}

interface GroupModalProps {
	isModalOpen: boolean;
	setIsModalOpen: Dispatch<SetStateAction<boolean>>;
}

export default function GroupModal({ isModalOpen, setIsModalOpen }: GroupModalProps) {
	const { data: groupListData } = useServerQuery<Group[], "admin">({ version: "admin", api: "/stellars" });
	const createGroup = useServerMutation<Group, Group, "admin">({
		version: "admin",
		api: "/stellar",
		method: "POST",
	});
	const editGroup = useServerMutation<void, { id: number }, "admin">({
		version: "admin",
		api: "/group/:id",
		method: "PATCH",
	});

	return (
		<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="4xl">
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>
					{/* {editingIndex === -1 ? "새 곡 직접 추가" : "노래 상세 정보 수정"} */}
					{/* <Text fontSize="xs" color="gray" fontWeight="400">
						{editingSong?.syncId || ""}
					</Text> */}
				</ModalHeader>

				<ModalCloseButton />
				<ModalBody></ModalBody>
				<ModalFooter>
					<Button variant="ghost" mr={3} onClick={() => setIsModalOpen(false)}>
						취소
					</Button>
					<Button colorScheme="blue" onClick={() => {}}>
						적용하기
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}
