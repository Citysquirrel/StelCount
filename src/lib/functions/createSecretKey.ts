export const createSecretKey = (len: number, includeSpecial?: boolean): string => {
	const specials = ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "+", "-", "=", "[", "]", "{", "}", "|", "'"];
	const char: string[] = [];
	let result = "";
	for (let i = 48; i < 123; i++) {
		char.push(String.fromCharCode(i));
		if (i === 57) i = 64;
		if (i === 90) i = 96;
	}

	for (let i = 0; i < len; i++) {
		const num = Math.floor(Math.random() * char.length);
		let value: string;
		if (includeSpecial) {
			const speNum = Math.floor(Math.random() * specials.length);
			value = Math.floor(Math.random() * 4) === 3 ? specials[speNum] : char[num];
		} else {
			value = char[num];
		}
		result += value;
	}

	return result;
};
