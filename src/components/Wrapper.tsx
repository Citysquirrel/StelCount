import { Stack, StackProps } from "@chakra-ui/react";

export default function Wrapper({ ...props }: WrapperProps) {
	return (
		<Stack
			border={"1px solid"}
			borderColor={"var(--chakra-colors-chakra-border-color)"}
			borderRadius={"0.375rem"}
			padding="8px 12px"
			{...props}
		/>
	);
}

interface WrapperProps extends StackProps {}
