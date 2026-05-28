export const normalizeKeyword = (str: string) => {
	return str.replace(/\s+/g, "").toLowerCase().trim();
};
