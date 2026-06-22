import { Box } from "@chakra-ui/react";
import type { NorthStarData } from "./space.types";

interface NorthStarProps {
	data: NorthStarData;
	reduceMotion: boolean;
}

/** 졸업 멤버 — 궤도 없이 고정된, 가장 크고 밝은 별 (북극성 느낌) */
export function NorthStar({ data, reduceMotion }: NorthStarProps) {
	const { x, y, size, color, name } = data;

	return (
		<Box
			position="absolute"
			left={`${x * 100}%`}
			top={`${y * 100}%`}
			transform="translate(-50%, -50%)"
			w={`${size}px`}
			h={`${size}px`}
			borderRadius="full"
			background={`radial-gradient(circle, ${color} 35%, ${color}00 70%)`}
			boxShadow={`0 0 ${size * 5}px ${color}, 0 0 ${size * 9}px ${color}80, 0 0 ${size * 15}px ${color}40`}
			style={!reduceMotion ? { animation: "ss-pulse 5s ease-in-out infinite" } : undefined}
			title={name}
		/>
	);
}
