export function stringNullCheck(str: string | null | undefined) {
	return str || "";
}

export function objectNullCheck(obj: Object) {
	const result = {};
	for (let [key, value] of Object.entries(obj)) {
		result[key] = stringNullCheck(value);
	}
	return result;
}

export function numberToLocaleString(num: string) {
	return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
