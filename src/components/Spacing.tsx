import { Flex } from "@chakra-ui/react";
import { HTMLAttributes, memo } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
	children?: never;
	direction?: "horizontal" | "vertical";
	size: number;
}

export const Spacing = memo(function Spacing({ direction = "vertical", size, ...props }: Props) {
	return (
		<Flex
			sx={{
				flex: "none",
				width: direction === "horizontal" ? `${size}px` : undefined,
				height: direction === "vertical" ? `${size}px` : undefined,
			}}
			{...props}
		/>
	);
});
