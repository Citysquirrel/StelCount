/**
 * @deprecated search.ts의 메서드를 대신 사용합니다. 기능 최소화 된 함수를 이용하고 싶을때만 본 함수를 재사용 하세요.
 */
export const normalizeKeyword = (str: string) => {
	return str.replace(/\s+/g, "").toLowerCase().trim();
};
