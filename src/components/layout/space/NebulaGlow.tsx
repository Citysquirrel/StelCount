import { Box } from "@chakra-ui/react";

const BLOBS = [
	{ left: "8%", top: "8%", size: "46vmax", color: "#7C5CFF", opacity: 0.16 },
	{ left: "70%", top: "24%", size: "38vmax", color: "#8FD8FF", opacity: 0.1 },
	{ left: "40%", top: "70%", size: "50vmax", color: "#C586FF", opacity: 0.12 },
];

/**
 * 옅은 성운(Nebula) 빛 번짐 레이어.
 * 4개 배경 레이어 중 가장 먼 곳에 위치하며, 패럴럭스 레이어 중 가장 느리게 움직입니다.
 */
export function NebulaGlow() {
	return (
		<Box position="absolute" inset={0} filter="blur(60px)">
			{BLOBS.map((blob, i) => (
				<Box
					key={i}
					position="absolute"
					left={blob.left}
					top={blob.top}
					w={blob.size}
					h={blob.size}
					borderRadius="full"
					transform="translate(-50%, -50%)"
					bg={`radial-gradient(circle, ${blob.color} 0%, transparent 70%)`}
					opacity={blob.opacity}
				/>
			))}
		</Box>
	);
}
