import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
	initialColorMode: "light",
	useSystemColorMode: true,
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

const theme = extendTheme({ config, fonts, breakpoints });

export default theme;
