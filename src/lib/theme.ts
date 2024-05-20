import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const config: ThemeConfig = {
	initialColorMode: "light",
	useSystemColorMode: true,
};

const fonts = {
	body: `"Spoqa Han Sans Neo", Consolas, Roboto, sans-serif`,
	heading: `"Spoqa Han Sans Neo", Consolas, Roboto, sans-serif`,
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
