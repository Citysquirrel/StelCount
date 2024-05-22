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
