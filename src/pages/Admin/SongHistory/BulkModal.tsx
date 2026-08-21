import { Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody } from "@chakra-ui/react";
import { Dispatch, SetStateAction, useState } from "react";

interface BulkUpdateModalProps {
	isModalOpen: boolean;
	setIsModalOpen: Dispatch<SetStateAction<boolean>>;
	bulkIndex: number[];
}

interface Updates {
	sungAt: string;
	youtubeVideoId: string;
	memo: string;
}

export default function BulkUpdateModal({ isModalOpen, setIsModalOpen, bulkIndex }: BulkUpdateModalProps) {
	const [updates, setUpdates] = useState<Updates>({ sungAt: "", youtubeVideoId: "", memo: "" });

	const handleInputValue = (key: keyof Updates) => (e: React.ChangeEvent<HTMLInputElement>) => {
		setUpdates((prev) => ({ ...prev, [key]: e.target.value }));
	};
	return (
		<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>
					묶음 편집
					<Text fontSize="xs" color="gray" fontWeight="400">
						{bulkIndex.join(", ")}
					</Text>
				</ModalHeader>

				<ModalCloseButton />
				<ModalBody></ModalBody>
			</ModalContent>
		</Modal>
	);
}
