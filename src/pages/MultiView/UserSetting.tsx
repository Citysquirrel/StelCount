import { CustomModal } from "../../components/Modal";

export function UserSettingModal({ isOpen, onClose, body }: UserSettingModalProps) {
	return (
		<CustomModal
			isOpen={isOpen}
			onClose={onClose}
			properties={{
				title: "사용자 개인 설정",
				body,
			}}
			customProps={{ ModalContent: { backgroundColor: "gray.900", color: "white" } }}
		/>
	);
}

interface UserSettingModalProps {
	isOpen: boolean;
	onClose: () => void;
	body: React.ReactNode;
}
