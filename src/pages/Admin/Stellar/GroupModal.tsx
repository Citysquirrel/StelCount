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
} from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";
import { StellarGroup } from "../Stellar";

interface GroupModalProps {
	isModalOpen: boolean;
	setIsModalOpen: Dispatch<SetStateAction<boolean>>;
	data: DefaultResponseData<StellarGroup[]> | undefined;
}

export default function GroupModal({ isModalOpen, setIsModalOpen, data }: GroupModalProps) {
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
