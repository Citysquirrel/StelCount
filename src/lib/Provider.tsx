import { ChakraProvider } from "@chakra-ui/react";
import { RecoilRoot } from "recoil";
import theme from "./theme";
import { Suspense } from "react";
import { Loading } from "../components/Loading";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
			staleTime: 1000 * 10,
		},
	},
});

export function MainProvider({ children }) {
	return (
		<QueryClientProvider client={queryClient}>
			<ChakraProvider
				theme={theme}
				toastOptions={{ defaultOptions: { position: "bottom", duration: 3000, isClosable: true } }}
			>
				<RecoilRoot>
					<Suspense fallback={<Loading options={{ mode: "fullscreen" }} />}>{children}</Suspense>
				</RecoilRoot>
			</ChakraProvider>
		</QueryClientProvider>
	);
}
