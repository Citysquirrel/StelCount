import { ChakraProvider } from "@chakra-ui/react";
import React from "react";
import { RecoilRoot } from "recoil";
import theme from "./theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fetch_ } from "./functions/fetch";

//! fetch를 활용하면서 어떤식으로 작동하는지, 어떤것들이 개선되면 좋은지를 체험
// const queryClient = new QueryClient({
// 	defaultOptions:{
// 		queries:{
// 			queryFn:async ({queryKey}) => {
// 				await fetch_()
// 			},
// 			refetchOnWindowFocus: false,
// 			retry: 3,
// 		}
// 	}
// })

export function MainProvider({ children }) {
	return (
		// <React.StrictMode>
		<ChakraProvider theme={theme}>
			{/* <QueryClientProvider client={queryClient}> */}
			<RecoilRoot>{children}</RecoilRoot>
			{/* </QueryClientProvider> */}
		</ChakraProvider>
		// </React.StrictMode>
	);
}
