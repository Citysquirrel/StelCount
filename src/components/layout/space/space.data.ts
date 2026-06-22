import type { OrbitGroupData, NorthStarData } from "./space.types";

export const NORTH_STAR: NorthStarData = {
	id: "graduated-01",
	name: "아이리 칸나",
	color: "#9997c8",
	x: 0.82,
	y: 0.14,
	size: 8,
};

export const ORBIT_GROUPS: OrbitGroupData[] = [
	{
		id: "everys",
		groupName: "에버리스",
		color: "#8FD8FF",
		cx: 0.18,
		cy: 0.66,
		radiusX: 0.32,
		radiusY: 0.112,
		tiltDeg: -16,
		periodSec: 30,
		members: [
			{ id: "ever-1", name: "아야츠노 유니", color: "#b77de4", size: 4, periodModifier: 0.7 },
			{ id: "ever-2", name: "에버리스 멤버2", color: "#b1a3c2", size: 5, periodModifier: 1 },
		],
	},
	{
		id: "universe",
		groupName: "유니버스",
		color: "#66ebff",
		cx: 0.56,
		cy: 0.4,
		radiusX: 0.3 * 0.8 * 1.3,
		radiusY: 0.1 * 0.8 * 1.3,
		tiltDeg: 13,
		periodSec: 27,
		members: [
			{ id: "uni-1", name: "아라하시 타비", color: "#71C5E8", size: 4, periodModifier: 0.7 },
			{ id: "uni-2", name: "시라유키 히나", color: "#E4002B", size: 5, periodModifier: 0.5 },
			{ id: "uni-3", name: "네네코 마시로", color: "#858c91", size: 5, periodModifier: 0.3 },
			{ id: "uni-4", name: "아카네 리제", color: "#971B2F", size: 5, periodModifier: 1 },
		],
	},
	{
		id: "cliche",
		groupName: "클리셰",
		color: "#C586FF",
		cx: 0.56,
		cy: 0.4,
		radiusX: 0.3 * 0.9 * 1.3,
		radiusY: 0.1 * 1.0 * 1.3,
		tiltDeg: 13,
		periodSec: 29,
		members: [
			{ id: "cli-1", name: "텐코 시부키", color: "#c2afe6", size: 4, periodModifier: 0.6 },
			{ id: "cli-2", name: "유즈하 리코", color: "#a6d0a6", size: 5, periodModifier: 0.9 },
			{ id: "cli-3", name: "아오쿠모 린", color: "#2b66c0", size: 5, periodModifier: 0.8 },
			{ id: "cli-4", name: "하나코 나나", color: "#c86a77", size: 4, periodModifier: 1 },
		],
	},
];
