import {
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalCloseButton,
	ModalProps,
	ModalContentProps,
	ModalHeaderProps,
	ModalCloseButtonProps,
	ModalBodyProps,
	ModalFooterProps,
	ModalOverlayProps,
} from "@chakra-ui/react";

export function CustomModal({ isOpen, onClose, properties, customProps }: CustomModalProps) {
	return (
		<Modal isOpen={isOpen} onClose={onClose} {...customProps?.Modal}>
			<ModalOverlay backdropFilter="blur(2px) hue-rotate(45deg)" {...customProps?.ModalOverlay} />
			<ModalContent {...customProps?.ModalContent}>
				<ModalHeader {...customProps?.ModalHeader}>{properties.title}</ModalHeader>
				<ModalCloseButton {...customProps?.ModalCloseButton} />
				<ModalBody {...customProps?.ModalBody}>{properties.body}</ModalBody>
				{properties && properties.footer ? (
					<ModalFooter {...customProps?.ModalFooter}>{properties.footer}</ModalFooter>
				) : null}
			</ModalContent>
		</Modal>
	);
}

interface CustomModalProps {
	isOpen: boolean;
	onClose: () => void;
	properties: CustomModalProperties;
	customProps?: CustomModalCustomProps;
}

interface CustomModalProperties {
	title: string;
	body: React.ReactNode;
	footer?: React.ReactNode;
}

interface CustomModalCustomProps {
	Modal?: Omit<ModalProps, "children" | "isOpen" | "onClose">;
	ModalOverlay?: ModalOverlayProps;
	ModalContent?: Omit<ModalContentProps, "children">;
	ModalHeader?: Omit<ModalHeaderProps, "children">;
	ModalCloseButton?: ModalCloseButtonProps;
	ModalBody?: Omit<ModalBodyProps, "children">;
	ModalFooter?: Omit<ModalFooterProps, "children">;
}
