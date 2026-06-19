import { CustomModal } from "../../components/Modal";

export function ExtensionDataModal({ isOpen, onClose, body }: ExtensionDataModalProps) {
	return (
		<CustomModal
			isOpen={isOpen}
			onClose={onClose}
			properties={{
				title: "사용자 설정 방송 데이터 동기화",
				body,
			}}
			customProps={{
				ModalContent: {
					backgroundColor: "gray.900",
					color: "white",
					sx: { label: { color: "gray.300" } },
				},
				Modal: {
					closeOnOverlayClick: false,
				},
				ModalBody: {
					padding: "12px 24px",
				},
			}}
		/>
	);
}

interface ExtensionDataModalProps {
	isOpen: boolean;
	onClose: () => void;
	body: React.ReactNode;
}
