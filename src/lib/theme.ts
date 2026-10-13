import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
	initialColorMode: "light",
	useSystemColorMode: false,
};

const fonts = {
	body: `"LINE Seed Sans EN", "LINE Seed Sans JP", "LINE Seed Sans KR", -apple-system, BlinkMacSystemFont, sans-serif`,
	heading: `"LINE Seed Sans EN", "LINE Seed Sans JP", "LINE Seed Sans KR", -apple-system, BlinkMacSystemFont, sans-serif`,
};

const breakpoints = {
	base: "0px",
	sm: "480px",
	md: "720px",
	lg: "900px",
	xl: "1200px",
	"2xl": "1440px",
};

const theme = extendTheme({
	config,
	fonts,
	breakpoints,
	components: {
		Avatar: {
			baseStyle: {
				container: {
					// 실제 이미지가 표시될 때만 fallback 배경을 제거한다.
					"&:has(> .chakra-avatar__img)": { bg: "transparent" },
				},
			},
		},
	},
});

export default theme;
