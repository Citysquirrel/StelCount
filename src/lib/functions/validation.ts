const VALIDATION = {
	hexCode: (str: string) => {
		const reg = /^#[0-9A-F]{6}$/i;
		return reg.test(str);
	},
};

export default VALIDATION;
