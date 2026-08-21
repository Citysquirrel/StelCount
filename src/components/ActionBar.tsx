/* eslint-disable @typescript-eslint/no-explicit-any */
// -------------------------------------------------------------
// V3 버전의 ActionBar 컴포넌트 채용
// -------------------------------------------------------------
import React, { createContext, useContext, useEffect } from "react";
import {
	Portal,
	HStack,
	StackProps,
	Divider,
	CloseButton,
	useColorModeValue,
	Tag,
	TagProps,
	DividerProps,
	CloseButtonProps,
	BoxProps,
} from "@chakra-ui/react";
import { AnimatePresence, motion } from "framer-motion";

// -------------------------------------------------------------
// 1. Context 설정
// -------------------------------------------------------------
type Placement = "bottom" | "bottom-start" | "bottom-end";

interface ActionBarContextType {
	open: boolean;
	onClose?: () => void;
	placement: Placement;
}

const ActionBarContext = createContext<ActionBarContextType | null>(null);

const useActionBar = () => {
	const context = useContext(ActionBarContext);
	if (!context) {
		throw new Error("ActionBar compound components must be used within ActionBar.Root");
	}
	return context;
};

// -------------------------------------------------------------
// 2. ActionBar.Root
// -------------------------------------------------------------
export interface ActionBarRootProps {
	children: React.ReactNode;
	open: boolean;
	onClose?: () => void;
	placement?: Placement;
	portalled?: boolean;
	closeOnEscape?: boolean;
}

const Root: React.FC<ActionBarRootProps> = ({
	children,
	open,
	onClose,
	placement = "bottom",
	portalled = true,
	closeOnEscape = true,
}) => {
	// ESC 키를 눌렀을 때 닫기 처리
	useEffect(() => {
		if (!closeOnEscape || !open || !onClose) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [closeOnEscape, open, onClose]);

	const content = (
		<ActionBarContext.Provider value={{ open, onClose, placement }}>{children}</ActionBarContext.Provider>
	);

	return portalled ? <Portal>{content}</Portal> : content;
};

// -------------------------------------------------------------
// 3. ActionBar.Positioner
// -------------------------------------------------------------
export interface ActionBarPositionerProps extends BoxProps {
	children: React.ReactNode;
}

const getPlacementStyles = (placement: Placement) => {
	switch (placement) {
		case "bottom-start":
			return {
				bottom: "24px",
				left: "24px",
				initial: { opacity: 0, y: 30, x: 0 },
				animate: { opacity: 1, y: 0, x: 0 },
				exit: { opacity: 0, y: 30, x: 0 },
			};
		case "bottom-end":
			return {
				bottom: "24px",
				right: "24px",
				initial: { opacity: 0, y: 30, x: 0 },
				animate: { opacity: 1, y: 0, x: 0 },
				exit: { opacity: 0, y: 30, x: 0 },
			};
		case "bottom":
		default:
			return {
				bottom: "24px",
				left: "50%",
				initial: { opacity: 0, y: 30, x: "-50%" },
				animate: { opacity: 1, y: 0, x: "-50%" },
				exit: { opacity: 0, y: 30, x: "-50%" },
			};
	}
};

const Positioner: React.FC<ActionBarPositionerProps> = ({ children, ...props }) => {
	const { open, placement } = useActionBar();
	const placementStyle = getPlacementStyles(placement);

	return (
		<AnimatePresence>
			{open && (
				<motion.div
					initial={placementStyle.initial}
					animate={placementStyle.animate}
					exit={placementStyle.exit}
					transition={{ duration: 0.2, ease: "easeOut" }}
					style={{
						position: "fixed",
						bottom: placementStyle.bottom,
						left: placementStyle.left,
						right: placementStyle.right,
						zIndex: 1400, // modal/toast 레벨 z-index
						pointerEvents: "box-none",
					}}
					{...(props as any)}
				>
					{children}
				</motion.div>
			)}
		</AnimatePresence>
	);
};

// -------------------------------------------------------------
// 4. ActionBar.Content
// -------------------------------------------------------------
export interface ActionBarContentProps extends StackProps {}

const Content: React.FC<ActionBarContentProps> = ({ children, ...props }) => {
	const bg = useColorModeValue("white", "gray.800");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	const color = useColorModeValue("gray.800", "gray.100");

	return (
		<HStack
			bg={bg}
			color={color}
			px={4}
			py={2.5}
			spacing={3}
			borderRadius="xl"
			borderWidth="1px"
			borderColor={borderColor}
			boxShadow="2xl"
			alignItems="center"
			pointerEvents="auto"
			{...props}
		>
			{children}
		</HStack>
	);
};

// -------------------------------------------------------------
// 5. ActionBar.SelectionTrigger (선택 개수 뱃지 등)
// -------------------------------------------------------------
export interface ActionBarSelectionTriggerProps extends TagProps {}

const SelectionTrigger: React.FC<ActionBarSelectionTriggerProps> = ({ children, colorScheme = "blue", ...props }) => {
	return (
		<Tag size="md" variant="subtle" colorScheme={colorScheme} borderRadius="md" {...props}>
			{children}
		</Tag>
	);
};

// -------------------------------------------------------------
// 6. ActionBar.Separator
// -------------------------------------------------------------
const Separator: React.FC<DividerProps> = (props) => {
	const borderColor = useColorModeValue("gray.300", "gray.600");
	return <Divider orientation="vertical" h="18px" borderColor={borderColor} {...props} />;
};

// -------------------------------------------------------------
// 7. ActionBar.CloseTrigger
// -------------------------------------------------------------
const CloseTrigger: React.FC<CloseButtonProps> = (props) => {
	const { onClose } = useActionBar();
	return <CloseButton size="sm" onClick={onClose} aria-label="선택 해제" {...props} />;
};

// -------------------------------------------------------------
// Composite Export
// -------------------------------------------------------------
export const ActionBar = Object.assign(Root, {
	Root,
	Positioner,
	Content,
	SelectionTrigger,
	Separator,
	CloseTrigger,
});
