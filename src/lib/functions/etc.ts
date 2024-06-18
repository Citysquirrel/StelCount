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

export function numberToLocaleString(num: string | undefined) {
	return num ? num.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";
}

export function remainingFromNum(num: number, unit: number, reverse?: boolean) {
	return reverse ? num % unit : unit - (num % unit);
}

export function remainingCount(num: number) {
	const con = [10_000_000, 1_000_000, 100_000, 10_000];
	if (num >= con[0]) {
		return assistCount(remainingFromNum(num, con[1]), con[1]);
	} else if (num >= con[1]) {
		return assistCount(remainingFromNum(num, con[2]), con[2]);
	} else return assistCount(remainingFromNum(num, con[3]), con[3]);
}

function assistCount(num: number, unit: number) {
	const a = unit - num;
	const s = num * 0.2;
	return a > s ? [num, 1] : [a, -1];
}

export function musicDefaultSortValue(num: number): number {
	const condition = { a: 10000000, b: 1000000, c: 100000, d: 10000 };
	if (num >= condition.a) {
		return assistSort(remainingFromNum(num, condition.b), condition.b);
	} else if (num >= condition.b) {
		return assistSort(remainingFromNum(num, condition.c), condition.c);
	} else return assistSort(remainingFromNum(num, condition.d), condition.d);
}

function assistSort(num: number, unit: number) {
	const a = unit - num;
	const s = num * 0.2;
	return a > s ? num : a;
}
