import { ChakraProvider } from "@chakra-ui/react";
import { RecoilRoot } from "recoil";
import theme from "./theme";
import { PropsWithChildren, Suspense } from "react";
import { Loading } from "../components/Loading";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext, useAuthController } from "./hooks/useAuth";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			refetchOnWindowFocus: false,
			staleTime: 1000 * 10,
		},
	},
});

function AuthProvider({ children }: PropsWithChildren) {
	const auth = useAuthController();
	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function MainProvider({ children }) {
	return (
		<QueryClientProvider client={queryClient}>
			<ChakraProvider
				theme={theme}
				toastOptions={{ defaultOptions: { position: "bottom", duration: 3000, isClosable: true } }}
			>
				<RecoilRoot>
					<AuthProvider>
						<Suspense fallback={<Loading options={{ mode: "fullscreen" }} />}>{children}</Suspense>
					</AuthProvider>
				</RecoilRoot>
			</ChakraProvider>
		</QueryClientProvider>
	);
}
