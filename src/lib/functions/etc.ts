import { Thumbnails } from "../types";

export function stringNullCheck(str: string | null | undefined) {
	if (str === null || str === undefined) {
		return "";
	} else return str;
}

export function objectNullCheck(obj: Object): Object {
	const result = {};
	for (let [key, value] of Object.entries(obj)) {
		result[key] = stringNullCheck(value);
	}
	return result;
}

export function objectBoolCheck(obj: Object): Object {
	const result = {};
	for (const [key, value] of Object.entries(obj)) {
		result[key] = !!value;
	}

	return result;
}

export function numberToLocaleString(num: number | string | undefined) {
	if (typeof num === "number") return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	return num ? num.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";
}

export function remainingFromNum(num: number, unit: number, reverse?: boolean) {
	return reverse ? num % unit : unit - (num % unit);
}

export function remainingCount(num: number) {
	const condition = [10_000_000, 1_000_000, 100_000, 10_000];
	if (num >= condition[0]) {
		return assistCount(remainingFromNum(num, condition[1]), condition[1]);
	} else if (num >= condition[1]) {
		return assistCount(remainingFromNum(num, condition[2]), condition[2]);
	} else return assistCount(remainingFromNum(num, condition[3]), condition[3]);
}

function assistCount(num: number, unit: number) {
	const a = unit - num;
	const s = num * 0.2;
	return a > s ? [num, 1] : [a, -1];
}

export function musicDefaultSortValue(num: number): number {
	const condition = [10_000_000, 1_000_000, 100_000, 10_000];
	if (num >= condition[0]) {
		return assistSort(remainingFromNum(num, condition[1]), condition[1]);
	} else if (num >= condition[1]) {
		return assistSort(remainingFromNum(num, condition[2]), condition[2]);
	} else return assistSort(remainingFromNum(num, condition[3]), condition[3]);
}

function assistSort(num: number, unit: number) {
	const a = unit - num;
	const s = num * 0.2;
	return a > s ? num : a;
}

export function elapsedTimeTextForCard(date: Date, now: Date): [number, string] {
	const gap = (now.getTime() - date.getTime()) / 1000;
	let text = "";
	if (gap > 31536000000) return [gap, ""];
	if (gap < 60) {
		text = "1분 미만";
	} else if (gap < 3600) {
		text = `${Math.floor(gap / 60)}분 전`;
	} else if (gap < 86400) {
		text = `${Math.floor(gap / 3600)}시간 전`;
	} else text = `${Math.floor(gap / 86400)}일 전`;

	return [gap, text];
}

export function elapsedTimeText(date: Date, now: Date): [number, string] {
	const gap = (now.getTime() - date.getTime()) / 1000;
	let text = "";
	if (gap > 31536000000) return [gap, ""];
	if (gap < 60) {
		text = `${gap}초 전`;
	} else if (gap < 3600) {
		text = `${Math.floor(gap / 60)}분 전`;
	} else if (gap < 86400) {
		text = `${Math.floor(gap / 3600)}시간 전`;
	} else text = `${Math.floor(gap / 86400)}일 전`;

	return [gap, text];
}

export function remainingTimeText(date: Date, now: Date): [number, string] {
	const gap = (date.getTime() - now.getTime()) / 1000;
	let text = "";
	let s = Math.floor(gap % 60)
		.toString()
		.padStart(2, "0");
	let m = Math.floor((gap / 60) % 60)
		.toString()
		.padStart(2, "0");
	let h = Math.floor(gap / 3600)
		.toString()
		.padStart(2, "0");
	if (gap > 31536000000) return [gap, ""];
	if (gap < 60) {
		text = `${s}`;
	} else if (gap < 3600) {
		text = `${m}:${s}`;
	} else if (gap < 86400) {
		text = `${h}:${m}:${s}`;
		// } else text = `${Math.floor(gap / 86400)}일 전`;
	} else text = `${h}:${m}:${s}`;

	return [gap, text];
}

export function getLocale() {
	return new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" });
}

export function minus9Hs(input?: string | Date) {
	try {
		if (!input) {
			return new Date();
		}
		console.log(input);
		const date = new Date(input);
		date.setHours(date.getHours() - 9);
		return date;
	} catch (err) {
		return new Date();
	}
}

export function serverTZSync() {
	const timeZoneUpdatedAt = "2024-07-04 11:30:08";
}

export function getThumbnails(thumbnails: string): Thumbnails {
	try {
		return JSON.parse(thumbnails);
	} catch (err) {
		return { maxres: {}, standard: {}, high: {}, medium: {}, default: {} };
	}
}

export function sortStatsByUnit(unit: string): boolean {
	const list = [
		50000, 100000, 150000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 550000, 600000, 650000, 700000,
		750000, 800000, 850000, 900000, 950000, 1000000, 1100000, 1200000, 1300000, 1400000, 1500000, 1600000, 1700000,
		1800000, 1900000, 2000000, 2100000, 2200000, 2300000, 2400000, 2500000, 2600000, 2700000, 2800000, 2900000, 3000000,
		3100000, 3200000, 3300000, 3400000, 3500000, 3600000, 3700000, 3800000, 3900000, 4000000, 4100000, 4200000, 4300000,
		4400000, 4500000, 4600000, 4700000, 4800000, 4900000, 5000000, 5100000, 5200000, 5300000, 5400000, 5500000, 5600000,
		5700000, 5800000, 5900000, 6000000, 6100000, 6200000, 6300000, 6400000, 6500000, 6600000, 6700000, 6800000, 6900000,
		7000000, 7100000, 7200000, 7300000, 7400000, 7500000, 7600000, 7700000, 7800000, 7900000, 8000000, 8100000, 8200000,
		8300000, 8400000, 8500000, 8600000, 8700000, 8800000, 8900000, 9000000, 9100000, 9200000, 9300000, 9400000, 9500000,
		9600000, 9700000, 9800000, 9900000, 10000000,
	];
	const int = parseInt(unit);
	return unit !== "0" && (list.includes(int) || int % 1000000 === 0);
}

export function sortStatsByUnitForBigNews(unit: string): boolean {
	const list = [
		100000, 200000, 300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000, 1100000, 1200000, 1300000, 1400000,
		1500000, 1600000, 1700000, 1800000, 1900000, 2000000, 2100000, 2200000, 2300000, 2400000, 2500000, 2600000, 2700000,
		2800000, 2900000, 3000000, 3100000, 3200000, 3300000, 3400000, 3500000, 3600000, 3700000, 3800000, 3900000, 4000000,
		4100000, 4200000, 4300000, 4400000, 4500000, 4600000, 4700000, 4800000, 4900000, 5000000, 5100000, 5200000, 5300000,
		5400000, 5500000, 5600000, 5700000, 5800000, 5900000, 6000000, 6100000, 6200000, 6300000, 6400000, 6500000, 6600000,
		6700000, 6800000, 6900000, 7000000, 7100000, 7200000, 7300000, 7400000, 7500000, 7600000, 7700000, 7800000, 7900000,
		8000000, 8100000, 8200000, 8300000, 8400000, 8500000, 8600000, 8700000, 8800000, 8900000, 9000000, 9100000, 9200000,
		9300000, 9400000, 9500000, 9600000, 9700000, 9800000, 9900000, 10000000,
	];
	const int = parseInt(unit);
	return unit !== "0" && (list.includes(int) || int % 1000000 === 0);
}

export function lightenColor(hex: string, percent: number) {
	if (!hex) return "";
	hex = hex.replace("#", "");

	let r = parseInt(hex.substring(0, 2), 16);
	let g = parseInt(hex.substring(2, 4), 16);
	let b = parseInt(hex.substring(4, 6), 16);

	r = Math.min(255, Math.floor(r + ((255 - r) * percent) / 100));
	g = Math.min(255, Math.floor(g + ((255 - g) * percent) / 100));
	b = Math.min(255, Math.floor(b + ((255 - b) * percent) / 100));

	let result =
		"#" + r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0");

	return result;
}

export function confirmOnExit() {
	const handleBeforeUnload = (event: any) => {
		event.preventDefault();
		event.returnValue = "";
	};

	const activeBeforeUnload = () => {
		window.addEventListener("beforeunload", handleBeforeUnload);
	};
	const disableBeforeUnload = () => {
		window.removeEventListener("beforeunload", handleBeforeUnload);
	};

	return { activeBeforeUnload, disableBeforeUnload };
}

export function getBrowserInfo() {
	const userAgent = navigator.userAgent.toLowerCase();

	if (userAgent.includes("chrome") && !userAgent.includes("edge") && !userAgent.includes("opr")) {
		return "Chrome";
	} else if (userAgent.includes("firefox")) {
		return "Firefox";
	} else if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
		return "Safari";
	} else if (userAgent.includes("edge")) {
		return "Edge";
	} else if (userAgent.includes("msie") || userAgent.includes("trident")) {
		return "Internet Explorer";
	}
	return "Unknown";
}
