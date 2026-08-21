import { ActionBar } from "@/components/ActionBar";
import { Button, SlideFade } from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";
import { FiEdit } from "react-icons/fi";

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
						<ActionBar.SelectionTrigger
							paddingBlock={2}
							paddingInline={4}
							bg={"transparent"}
							border={"1px dashed"}
							borderColor="gray.500"
						>
							{selectedIds.length}개 선택됨
						</ActionBar.SelectionTrigger>

						<ActionBar.Separator />

						<Button
							leftIcon={<FiEdit />}
							size="sm"
							colorScheme="blue"
							variant="outline"
							onClick={() => {
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
