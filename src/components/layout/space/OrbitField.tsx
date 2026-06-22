import { Box } from "@chakra-ui/react";
import type { OrbitGroupData } from "./space.types";

interface OrbitFieldProps {
	groups: OrbitGroupData[];
	reduceMotion: boolean;
}

/**
 * 그룹별 궤도 + 멤버 별.
 *
 * 타원 공전은 JS 애니메이션 없이 순수 CSS로 구현합니다:
 *  1) 정사각형 박스(지름 = radiusX*2)를 만들고
 *  2) scaleY(radiusY/radiusX)로 눌러 타원 비율을 만든 뒤
 *  3) rotate(tiltDeg)로 기울입니다.
 * 멤버 별은 그 안에서 각자 spin 레이어로 분리되어 원운동을 하고,
 * 부모의 scaleY+rotate가 그 원운동을 "기울어진 타원 위의 운동"으로 변환해줍니다.
 * 같은 궤도 위 멤버끼리는 animation-delay를 음수로 주어 위상(각도)을 분산시킵니다.
 *
 * 참고: 반경(radiusX/Y)은 컨테이너 폭 기준 비율이 아니라 vw 단위로 환산해 사용합니다.
 *       히어로 섹션이 거의 풀블리드(전체 폭)인 경우를 가정한 단순화이며,
 *       컨테이너가 뷰포트보다 좁다면 ResizeObserver로 실측 폭을 구해 대체하는 것을 권장합니다.
 */
export function OrbitField({ groups, reduceMotion }: OrbitFieldProps) {
	return (
		<>
			{groups.map((group) => (
				<Orbit key={group.id} data={group} reduceMotion={reduceMotion} />
			))}
		</>
	);
}

function Orbit({ data, reduceMotion }: { data: OrbitGroupData; reduceMotion: boolean }) {
	const { cx, cy, radiusX, radiusY, tiltDeg, color, periodSec, members, groupName } = data;
	const squashRatio = radiusY / radiusX; // 1보다 작을수록 더 눌린(가로로 넓은) 궤도

	return (
		<Box
			position="absolute"
			left={`${cx * 100}%`}
			top={`${cy * 100}%`}
			w={`${radiusX * 200 * 30}px`}
			h={`${radiusX * 200 * 30}px`}
			style={{ transform: `translate(-50%, -50%) rotate(${tiltDeg}deg) scaleY(${squashRatio})` }}
			aria-label={`${groupName} 궤도`}
		>
			{/* 궤도 라인: 옅게, 중앙이 은은하게 발광하는 느낌의 보더 */}
			<Box
				position="absolute"
				inset={0}
				borderRadius="50%"
				border="1px solid"
				borderColor={color}
				opacity={0.15}
				boxShadow={`0 0 80px ${color}26 inset`}
			/>

			{members.map((member, i) => {
				const phaseRatio = i / members.length;
				const period = periodSec * (1 * (member.periodModifier ?? 1));
				const size = member.size ?? 7;

				return (
					<Box
						key={member.id}
						position="absolute"
						inset={0}
						style={
							reduceMotion
								? { transform: `rotate(${phaseRatio * 360}deg)` }
								: {
										animation: `ss-spin ${period}s linear infinite`,
										animationDelay: `-${phaseRatio * period}s`,
									}
						}
					>
						<Box
							position="absolute"
							top="50%"
							left="100%"
							transform="translate(-50%, -50%)"
							w={`${size}px`}
							h={`${size}px`}
							borderRadius="full"
							bg={member.color}
							boxShadow={`0 0 ${size * 2.5}px ${member.color}, 0 0 ${size * 5}px ${member.color}66`}
							title={member.name}
						/>
					</Box>
				);
			})}
		</Box>
	);
}
