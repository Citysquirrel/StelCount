import { Box, HStack, Text, useClipboard, useToast } from "@chakra-ui/react";
import { MdContentCopy } from "react-icons/md";

export function CopyText({ children }) {
	children = children || "";
	const { onCopy } = useClipboard(children.toString());
	const toast = useToast();

	const handleClick = () => {
		onCopy();
		toast({ title: "클립보드에 텍스트를 복사했습니다.", status: "info", duration: 3000, isClosable: true });
	};
	return (
		<HStack onClick={handleClick} sx={{ gap: "2px", ":hover": { textDecoration: "underline", cursor: "pointer" } }}>
			{children.toString().length === 0 ? null : (
				<>
					<Text>{children}</Text>
					<MdContentCopy />
				</>
			)}
		</HStack>
	);
}

export function CopyLink({ copy, children }) {
	children = children || "";
	const { onCopy } = useClipboard(copy);
	const toast = useToast();

	const handleClick = () => {
		onCopy();
		toast({ title: "클립보드에 이메일 텍스트를 복사했습니다.", status: "info", duration: 3000, isClosable: true });
	};
	return (
		<Box
			onClick={handleClick}
			sx={{ display: "inline-block", ":hover": { textDecoration: "underline", cursor: "pointer" } }}
		>
			{children.toString().length === 0 ? null : <>{children}</>}
		</Box>
	);
}
