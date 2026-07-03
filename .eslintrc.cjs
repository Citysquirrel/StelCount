module.exports = {
	root: true,
	env: { browser: true, es2020: true },
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:react-hooks/recommended",
		"plugin:react/recommended",
	],
	ignorePatterns: ["dist", ".eslintrc.cjs"],
	parser: "@typescript-eslint/parser",
	plugins: ["react-refresh", "react"],
	rules: {
		"react/react-in-jsx-scope": "off",
		"react/prop-types": "off",
		"prefer-const": "warn",
		"no-empty": "warn",
		"@typescript-eslint/no-unused-vars": "warn",
		"@typescript-eslint/no-explicit-any": "warn",
		"react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
		"react/forbid-elements": [
			"warn",
			{
				forbid: [
					{
						element: "a",
						message: "순수 <a> 태그 대신 @/components/Link를 사용",
					},
				],
			},
		],
		"no-restricted-imports": [
			"warn",
			{
				paths: [
					{
						name: "react-router-dom",
						importNames: ["Link", "NavLink"],
						message: "React Router의 기본 링크 대신 @/components/Link를 사용을 권고",
					},
					{
						name: "@chakra-ui/react",
						importNames: ["Link"],
						message: "Chakra UI의 Link 대신 @/components/Link를 사용을 권고",
					},
				],
			},
		],
	},
};
