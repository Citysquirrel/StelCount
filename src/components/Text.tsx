import { Box, BoxProps, Text, TextProps } from "@chakra-ui/react";

export function ColorText({ value, children, ...props }: ColorTextProps) {
	return (
		<Box as="span" color={value} {...props}>
			{children}
		</Box>
	);
}

export function MarqueeText({ isMouseOver, children, ...props }: MarqueeTextProps) {
	return (
		<Text whiteSpace={"nowrap"} textOverflow={"ellipsis"} overflow="hidden" {...props}>
			{children}
		</Text>
	);
}

interface ColorTextProps extends BoxProps {
	value?: string;
}

interface MarqueeTextProps extends TextProps {
	isMouseOver?: boolean;
}
