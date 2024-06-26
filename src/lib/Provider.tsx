import { ChakraProvider } from "@chakra-ui/react";
import { RecoilRoot } from "recoil";
import theme from "./theme";
import { Suspense } from "react";
import { Loading } from "../components/Loading";

//! fetch를 활용하면서 어떤식으로 작동하는지, 어떤것들이 개선되면 좋은지를 경험하기
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
		<ChakraProvider
			theme={theme}
			toastOptions={{ defaultOptions: { position: "bottom", duration: 3000, isClosable: true } }}
		>
			<RecoilRoot>
				<Suspense fallback={<Loading options={{ mode: "fullscreen" }} />}>{children}</Suspense>
			</RecoilRoot>
		</ChakraProvider>
	);
}
