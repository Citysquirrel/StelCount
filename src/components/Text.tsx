import { Box, BoxProps, Text, TextProps } from "@chakra-ui/react";

export function ColorText({ value, children, ...props }: ColorTextProps) {
	return (
		<Box as="span" color={value} {...props}>
			{children}
		</Box>
	);
}

export function MarqueeText({
	isMouseOver,
	enableMarqueeOnMouseOver,
	enableMarquee,
	children,
	...props
}: MarqueeTextProps) {
	const marqueeAni: TextProps = { animation: "marquee 5s linear infinite", textOverflow: "clip" };
	const marqueeAniOnOver: TextProps = { _hover: { animation: "marquee 5s linear infinite", textOverflow: "clip" } };
	return (
		<Text
			whiteSpace={"nowrap"}
			textOverflow={"ellipsis"}
			overflow="hidden"
			{...(enableMarqueeOnMouseOver ? marqueeAniOnOver : {})}
			{...(isMouseOver || enableMarquee ? marqueeAni : {})}
			{...props}
		>
			{children}
		</Text>
	);
}

interface ColorTextProps extends BoxProps {
	value?: string;
}

interface MarqueeTextProps extends TextProps {
	isMouseOver?: boolean;
	enableMarqueeOnMouseOver?: boolean;
	enableMarquee?: boolean;
}
