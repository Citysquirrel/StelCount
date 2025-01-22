import { CustomModal } from "../../components/Modal";

export function UserSettingModal({ isOpen, onClose }: UserSettingModalProps) {
	return (
		<CustomModal
			isOpen={isOpen}
			onClose={onClose}
			properties={{
				title: "사용자 개인 설정",
				body: <UserSettingModalBody />,
			}}
		></CustomModal>
	);
}

function UserSettingModalBody() {
	return <></>;
}

interface UserSettingModalProps {
	isOpen: boolean;
	onClose: () => void;
}
