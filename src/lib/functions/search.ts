const doubleConsonantMap: Record<string, string> = {
	ㄳ: "ㄱㅅ",
	ㄵ: "ㄴㅈ",
	ㄶ: "ㄴㅎ",
	ㄺ: "ㄹㄱ",
	ㄻ: "ㄹㅁ",
	ㄼ: "ㄹㅂ",
	ㄽ: "ㄹㅅ",
	ㄾ: "ㄹㅌ",
	ㄿ: "ㄹㅍ",
	ㅀ: "ㄹㅎ",
	ㅄ: "ㅂㅅ",
};

export const normalizeKeyword = (str: string) => {
	let processed = str.normalize("NFC").toLowerCase();
	processed = processed.replace(/[ㄳㄵㄶㄺㄻㄼㄽㄾㄿㅀㅄ]/g, (match) => doubleConsonantMap[match]);
	return processed.replace(/[^가-힣ㄱ-ㅎㅏ-ㅣa-z0-9+\-&]/gi, "");
};

// 겹받침 딕셔너리

export const getChosung = (str: string) => {
	if (!str) return "";
	const cho = [
		"ㄱ",
		"ㄲ",
		"ㄴ",
		"ㄷ",
		"ㄸ",
		"ㄹ",
		"ㅁ",
		"ㅂ",
		"ㅃ",
		"ㅅ",
		"ㅆ",
		"ㅇ",
		"ㅈ",
		"ㅉ",
		"ㅊ",
		"ㅋ",
		"ㅌ",
		"ㅍ",
		"ㅎ",
	];
	let result = "";

	for (let i = 0; i < str.length; i++) {
		const code = str.charCodeAt(i) - 44032;
		if (code > -1 && code < 11172) result += cho[Math.floor(code / 588)];
		else result += str.charAt(i);
	}
	return result;
};
