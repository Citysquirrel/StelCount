import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import { RecoilRoot } from "recoil";
import theme from "./theme";

export function MainProvider({ children }) {
	return (
		<React.StrictMode>
			<ChakraProvider theme={theme}>
				<RecoilRoot>{children}</RecoilRoot>
			</ChakraProvider>
		</React.StrictMode>
	);
}
