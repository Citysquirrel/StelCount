import { Box, HStack } from "@chakra-ui/react";

export function Carousel<T>({ list, SlideComponent, currentPageIdx, timeout }: CarouselProps<T>) {
	return (
		<HStack
			minWidth="100%"
			alignItems={["center", "center", "flex-end", "flex-end", "flex-end"]}
			padding="16px"
			gap="32px"
			transform={`translateX(-${100 * currentPageIdx}%)`}
			transition="all .3s"
		>
			{list.map(SlideComponent)}
		</HStack>
	);
}

interface CarouselProps<T> {
	list: T[];
	SlideComponent: (item: T, idx: number, array: T[]) => JSX.Element;
	currentPageIdx: number;
	timeout?: number;
}
