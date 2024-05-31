import { Box, BoxProps } from "@chakra-ui/react";

export function ColorText({ value, children, ...props }: ColorTextProps) {
	return (
		<Box as="span" color={value} {...props}>
			{children}
		</Box>
	);
}

interface ColorTextProps extends BoxProps {
	value?: string;
}
