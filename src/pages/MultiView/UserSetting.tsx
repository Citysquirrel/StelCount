import { Button, DarkMode, FormControl, FormLabel, Stack, Switch } from "@chakra-ui/react";
import { Dispatch, SetStateAction, useId } from "react";
import { CustomModal } from "../../components/Modal";
import { UserSettingStorage } from "../../lib/types";
import { multiViewModalProps } from "./modalStyles";

export function UserSettingModal({ isOpen, onClose, body }: UserSettingModalProps) {
	return (
		<DarkMode>
			<CustomModal
				isOpen={isOpen}
				onClose={onClose}
				properties={{
					title: "사용자 개인 설정",
					body,
					footer: (
						<Button size="sm" colorScheme="blue" onClick={onClose}>
							완료
						</Button>
					),
				}}
				customProps={multiViewModalProps}
			/>
		</DarkMode>
	);
}

export function OfflineDisplaySettings({ keepOfflinePinned, compactOffline, setUserSetting }: OfflineDisplaySettingsProps) {
	const id = useId();
	return (
		<Stack spacing={3} p={3} bg="whiteAlpha.50" borderRadius="md">
			<FormControl display="flex" alignItems="center" justifyContent="space-between">
				<FormLabel htmlFor={`${id}-keep-offline-pinned`} mb={0} fontSize="sm">
					상단 표시 방송은 오프라인이어도 위치 유지
				</FormLabel>
				<Switch
					id={`${id}-keep-offline-pinned`}
					flexShrink={0}
					isChecked={keepOfflinePinned}
					onChange={(event) => {
						const checked = event.target.checked;
						setUserSetting((previous) => ({ ...previous, multiViewKeepOfflinePinned: checked }));
					}}
				/>
			</FormControl>
			<FormControl display="flex" alignItems="center" justifyContent="space-between">
				<FormLabel htmlFor={`${id}-compact-offline`} mb={0} fontSize="sm">
					오프라인 방송 간단히 표시
				</FormLabel>
				<Switch
					id={`${id}-compact-offline`}
					flexShrink={0}
					isChecked={compactOffline}
					onChange={(event) => {
						const checked = event.target.checked;
						setUserSetting((previous) => ({ ...previous, multiViewCompactOffline: checked }));
					}}
				/>
			</FormControl>
		</Stack>
	);
}

export interface OfflineDisplaySettingsProps {
	keepOfflinePinned: boolean;
	compactOffline: boolean;
	setUserSetting: Dispatch<SetStateAction<UserSettingStorage>>;
}

interface UserSettingModalProps {
	isOpen: boolean;
	onClose: () => void;
	body: React.ReactNode;
}
