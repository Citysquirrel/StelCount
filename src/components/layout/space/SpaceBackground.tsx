import { Box } from "@chakra-ui/react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { ORBIT_GROUPS, NORTH_STAR } from "./space.data";
import { NebulaGlow } from "./NebulaGlow";
import { OrbitField } from "./OrbitField";
import { NorthStar } from "./NorthStar";
import { TwinkleField } from "./TwinkleField";

/**
 * 히어로 섹션 배경 (우주 컨셉)
 *
 * 4개 레이어로 구성됩니다.
 *  - 성운(Nebula): 가장 멀리, 가장 느리게
 *  - 궤도 + 멤버 별 / 졸업멤버(북극성): 중간 거리
 *  - 랜덤 트윙클 별: 가장 가깝게, 가장 빠르게
 *
 * 별의 공전(spin) · 반짝임(twinkle) · 펄스(pulse)는 순수 CSS 애니메이션으로 구현해
 * 매 프레임 JS 연산 비용을 없앴고, "스크롤에 따라 레이어별로 다른 속도로 미세하게
 * 따라 움직이는" 부분만 Framer Motion의 useScroll/useTransform/useSpring으로 처리합니다.
 *
 * Next.js App Router 등에서 사용한다면 파일 최상단에 'use client'를 추가해주세요.
 */

// const KEYFRAMES = `
//   @keyframes ss-spin {
//     from { transform: rotate(0deg); }
//     to { transform: rotate(360deg); }
//   }
//   @keyframes ss-twinkle {
//     0%, 100% { opacity: .15; transform: scale(.7); }
//     50% { opacity: 1; transform: scale(1.15); }
//   }
//   @keyframes ss-pulse {
//     0%, 100% { opacity: .8; transform: scale(1); filter: brightness(1); }
//     50% { opacity: 1; transform: scale(1.22); filter: brightness(1.3); }
//   }
// `;

// 레이어별 스크롤 민감도(클수록 더 빠르게 따라움) — 원경/중경/근경의 깊이감을 표현
const PARALLAX_SPEED = {
	nebula: 0.015,
	orbit: 0.045,
	dust: 0.085,
};

function useParallaxY(scrollY: MotionValue<number>, speed: number, reduceMotion: boolean) {
	const raw = useTransform(scrollY, (v) => (reduceMotion ? 0 : v * speed));
	return useSpring(raw, { stiffness: 45, damping: 20, mass: 0.6 });
}

export function SpaceBackground() {
	const prefersReducedMotion = !!useReducedMotion();
	const { scrollY } = useScroll();

	const nebulaY = useParallaxY(scrollY, PARALLAX_SPEED.nebula, prefersReducedMotion);
	const orbitY = useParallaxY(scrollY, PARALLAX_SPEED.orbit, prefersReducedMotion);
	const dustY = useParallaxY(scrollY, PARALLAX_SPEED.dust, prefersReducedMotion);

	return (
		<Box
			position="absolute"
			inset={0}
			overflow="hidden"
			pointerEvents="none"
			zIndex={0}
			bgGradient="radial(120% 90% at 50% -10%, #271B45 0%, #150F2A 45%, #07060D 100%)"
			aria-hidden
		>
			<motion.div style={{ position: "absolute", inset: 0, y: nebulaY }}>
				<NebulaGlow />
			</motion.div>

			<motion.div style={{ position: "absolute", inset: 0, y: orbitY }}>
				<OrbitField groups={ORBIT_GROUPS} reduceMotion={prefersReducedMotion} />
				<NorthStar data={NORTH_STAR} reduceMotion={prefersReducedMotion} />
			</motion.div>

			<motion.div style={{ position: "absolute", inset: 0, y: dustY }}>
				<TwinkleField count={90} reduceMotion={prefersReducedMotion} />
			</motion.div>
		</Box>
	);
}
