import { useMemo } from "react";
import { Box } from "@chakra-ui/react";

interface TwinkleFieldProps {
	count?: number;
	reduceMotion: boolean;
}

interface TwinkleStar {
	id: number;
	x: number;
	y: number;
	size: number;
	duration: number;
	delay: number;
}

/**
 * 화면 전체에 랜덤으로 흩뿌려진, 주기적으로 반짝이는 잔별들.
 *
 * 주의(SSR 사용 시): useMemo 안의 Math.random()은 클라이언트 마운트 시점에만 평가되도록
 * 의도했지만, Next.js 등 SSR 환경에서는 서버/클라이언트 렌더 결과가 달라 하이드레이션
 * 경고가 발생할 수 있습니다. 이 경우 좌표 생성을 useEffect + state로 옮겨 클라이언트
 * 마운트 후에만 렌더링하거나, seed 기반의 결정적 랜덤 함수를 사용해주세요.
 */
export function TwinkleField({ count = 90, reduceMotion }: TwinkleFieldProps) {
	const stars = useMemo<TwinkleStar[]>(
		() =>
			Array.from({ length: count }, (_, id) => ({
				id,
				x: Math.random() * 100,
				y: Math.random() * 100,
				size: 1 + Math.random() * 2,
				duration: 2.5 + Math.random() * 3.5,
				delay: Math.random() * 6,
			})),
		[count],
	);

	return (
		<>
			{stars.map((star) => (
				<Box
					key={star.id}
					position="absolute"
					left={`${star.x}%`}
					top={`${star.y}%`}
					w={`${star.size}px`}
					h={`${star.size}px`}
					borderRadius="full"
					bg="white"
					boxShadow="0 0 4px rgba(255,255,255,0.8)"
					opacity={reduceMotion ? 0.5 : undefined}
					style={
						reduceMotion
							? undefined
							: { animation: `ss-twinkle ${star.duration}s ease-in-out infinite`, animationDelay: `${star.delay}s` }
					}
				/>
			))}
		</>
	);
}
