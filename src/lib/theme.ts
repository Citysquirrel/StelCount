import { extendTheme, type ThemeConfig } from "@chakra-ui/react";

const fonts = {
	body: `"Spoqa Han Sans Neo", Consolas, Roboto, sans-serif`,
	heading: `"Spoqa Han Sans Neo", Consolas, Roboto, sans-serif`,
};

const config: ThemeConfig = {
	initialColorMode: "light",
	useSystemColorMode: true,
};

const theme = extendTheme({ config, fonts });

export default theme;
