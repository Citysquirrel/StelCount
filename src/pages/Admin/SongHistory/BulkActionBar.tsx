import { ActionBar } from "@/components/ActionBar";
import { Button, SlideFade } from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";

interface BulkActionBarProps {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	selectedIds: number[];
	onCloseBar?: () => void;
	onEdit?: () => void;
}

export default function BulkActionBar({ isOpen, setIsOpen, selectedIds, onCloseBar, onEdit }: BulkActionBarProps) {
	const handleClose = () => {
		setIsOpen(false);
		onCloseBar && onCloseBar();
	};

	return (
		<SlideFade in={isOpen} offsetY="20px">
			<ActionBar.Root
				open={isOpen}
				onClose={handleClose}
				placement="bottom" // 'bottom' | 'bottom-start' | 'bottom-end' 지원
				closeOnEscape
			>
				<ActionBar.Positioner>
					<ActionBar.Content>
						<ActionBar.SelectionTrigger>{selectedIds.length}개 선택됨</ActionBar.SelectionTrigger>

						<ActionBar.Separator />

						<Button
							size="sm"
							colorScheme="red"
							variant="subtle"
							onClick={() => {
								alert(`선택된 ${selectedIds.length}개 항목 삭제`);
								onEdit && onEdit();
							}}
						>
							편집
						</Button>

						<ActionBar.CloseTrigger />
					</ActionBar.Content>
				</ActionBar.Positioner>
			</ActionBar.Root>
		</SlideFade>
	);
}
