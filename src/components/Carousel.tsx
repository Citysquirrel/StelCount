import { Box, HStack } from "@chakra-ui/react";
import { useRef, useState } from "react";

export function Carousel<T>({ list, SlideComponent, currentPageIdx, timeout }: CarouselProps<T>) {
	const ref = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [startX, setStartX] = useState(0);
	const [currentX, setCurrentX] = useState(0);
	const [deltaX, setDeltaX] = useState(0);
	const [transition, setTransition] = useState("all .3s");
	const [currentIndex, setCurrentIndex] = useState(0);

	const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
		setIsDragging(true);
		setTransition("none");
		setStartX("pageX" in e ? e.pageX : e.touches[0].pageX);
	};
	const handleDragMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		setCurrentX("pageX" in e ? e.pageX : e.touches[0].pageX);
		setDeltaX(currentX - startX);
	};
	const handleDragEnd = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		setDeltaX(currentX - startX);
		setTransition("all .3s");
		if (deltaX > 50 && currentIndex > 0) {
			setCurrentIndex((prev) => prev - 1);
		} else if (deltaX < -50 && currentIndex < list.length - 1) {
			setCurrentIndex((prev) => prev + 1);
		}
		setIsDragging(false);
	};
	return (
		<HStack
			ref={ref}
			minWidth="100%"
			alignItems={["center", "center", "flex-end", "flex-end", "flex-end"]}
			padding="16px"
			gap="32px"
			transform={`translateX(calc(-${100 * currentPageIdx}% + ${deltaX}px))`}
			transition={transition}
			// onMouseDown={handleDragStart}
			// onMouseMove={handleDragMove}
			// onMouseUp={handleDragEnd}
			// onMouseLeave={handleDragEnd}
			// onTouchStart={handleDragStart}
			// onTouchMove={handleDragMove}
			// onTouchEnd={handleDragEnd}
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
