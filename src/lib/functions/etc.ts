export function stringNullCheck(str: string | null | undefined) {
	return str === null || str === undefined || str;
}

export function objectNullCheck(obj: Object) {
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

export function musicDefaultSortValue(num: number): number {
	if (num >= 10000000) {
		return remainingFromNum(num, 1000000);
	} else if (num >= 1000000) {
		return remainingFromNum(num, 100000);
	} else return remainingFromNum(num, 10000);
}
