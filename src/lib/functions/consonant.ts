/**
 * 한글 단어의 끝자리를 분석해 알맞은 조사를 추가해 리턴합니다.
 * @param str 대상 한글 단어
 * @param postPos 주어(s)인지 목적어(o)인지를 지정
 * @returns
 */
export function checkConsonantAtLast(str: string, postPos?: "s" | "o") {
	if (!postPos) postPos = "s";
	if (!str) return "";
	const charCode = str.charCodeAt(str.length - 1);
	const CONSONANT_COUNT = 28;
	const KOREAN_CODE_START = 44032;
	const consonantCode = (charCode - KOREAN_CODE_START) % CONSONANT_COUNT;
	if (consonantCode === 0) {
		return `${str}${postPos === "s" ? "가" : "를"}`;
	}
	return `${str}${postPos === "s" ? "이" : "을"}`;
}
