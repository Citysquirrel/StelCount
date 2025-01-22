import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalCloseButton,
} from "@chakra-ui/react";

export function CustomModal({ isOpen, onClose, properties }: CustomModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalOverlay />
			<ModalContent>
				<ModalHeader>{properties.title}</ModalHeader>
				<ModalCloseButton />
				<ModalBody>{properties.body}</ModalBody>
				{properties && properties.footer ? <ModalFooter>{properties.footer}</ModalFooter> : null}
			</ModalContent>
		</Modal>
	);
}

interface CustomModalProps {
	isOpen: boolean;
	onClose: () => void;
	properties: CustomModalProperties;
}

interface CustomModalProperties {
	title: string;
	body: React.ReactNode;
	footer?: React.ReactNode;
}
