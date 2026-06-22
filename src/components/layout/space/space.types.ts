/**
 * 히어로 배경(우주 컨셉) 관련 타입 정의
 */

export interface StarMemberData {
	/** 고유 id */
	id: string;
	/** 멤버 이름 — TODO: 실제 멤버 이름으로 교체해주세요 */
	name: string;
	/** 멤버 포인트 컬러 (hex) */
	color: string;
	/** 별 지름(px). 기본 6~8 권장 */
	size?: number;
	/** 멤버별 공전 시간 수정치. 클수록 느림 */
	periodModifier?: number;
}

export interface OrbitGroupData {
	/** 고유 id (그룹) */
	id: string;
	/** 그룹명 (예: 에버리스, 유니버스, 클리셰) */
	groupName: string;
	/** 궤도 링 색상 = 그룹 베이스(포인트) 컬러 */
	color: string;
	/** 궤도 중심 x (0~1, 컨테이너 width 비율) */
	cx: number;
	/** 궤도 중심 y (0~1, 컨테이너 height 비율) */
	cy: number;
	/** 궤도 반경 x — 장축, 0~1 비율 (vw 환산 기준) */
	radiusX: number;
	/** 궤도 반경 y — 단축, 0~1 비율 (vw 환산 기준) */
	radiusY: number;
	/** 궤도 기울기(deg). 음수 = 반시계 방향 기울임 */
	tiltDeg: number;
	/** 한 바퀴 공전에 걸리는 기준 시간(초). 클수록 느림 */
	periodSec: number;
	/** 이 궤도에 속한 멤버(별) 목록 */
	members: StarMemberData[];
}

export interface NorthStarData {
	id: string;
	/** 졸업 멤버 이름 — TODO: 실제 이름으로 교체해주세요 */
	name: string;
	color: string;
	/** 고정 위치 x (0~1, 컨테이너 width 비율) */
	x: number;
	/** 고정 위치 y (0~1, 컨테이너 height 비율) */
	y: number;
	/** 별 지름(px) */
	size: number;
}
