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
import { forwardRef } from "react";
import useColor from "@/lib/hooks/useColor";

export const AdminModalContent = forwardRef<HTMLDivElement, ModalContentProps>(({ sx, ...props }, ref) => {
	const { bgCard, borderColor, headerBg, alternateRowBg, mutedColor } = useColor();
	return (
		<ModalContent
			ref={ref}
			bg={bgCard}
			color="#f1edf8"
			border="1px solid"
			borderColor={borderColor}
			borderRadius="20px"
			boxShadow="0 24px 80px #09061299"
			sx={{
				colorScheme: "dark",
				"--chakra-colors-chakra-border-color": borderColor,
				".chakra-modal__header": { bg: headerBg, borderTopRadius: "19px", borderBottom: "1px solid", borderColor },
				".chakra-modal__body": { py: 5 },
				".chakra-modal__footer": { borderTop: "1px solid", borderColor },
				".chakra-input, .chakra-select, .chakra-textarea, .chakra-numberinput__field": {
					bg: "#171320",
					color: "#f1edf8",
					borderColor,
					_placeholder: { color: mutedColor },
					_hover: { borderColor: "#796390" },
					_focusVisible: { borderColor: "#c1a4ef", boxShadow: "0 0 0 1px #c1a4ef" },
					_invalid: { borderColor: "#fc8181", boxShadow: "0 0 0 1px #fc8181" },
				},
				"option": { bg: "#171320", color: "#f1edf8" },
				".chakra-form__helper-text": { color: mutedColor },
				".chakra-card": { bg: alternateRowBg, color: "#f1edf8", borderColor },
				".chakra-divider": { borderColor },
				...sx,
			}}
			{...props}
		/>
	);
});

AdminModalContent.displayName = "AdminModalContent";

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
