export function stringNullCheck(str: string | null | undefined) {
	if (str === null || str === undefined) {
		return "";
	} else return str;
}

export function objectNullCheck(obj: Object): any {
	const result = {};
	for (let [key, value] of Object.entries(obj)) {
		result[key] = stringNullCheck(value);
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

export function elapsedTimeText(date: Date, now: Date): [number, string] {
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
	} else text = `${Math.floor(gap / 86400)}일 전`;

	return [gap, text];
}

export function getLocale() {
	return new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" });
}
