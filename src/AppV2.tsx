import { Box } from "@chakra-ui/react";
import { Navigate, Outlet } from "react-router-dom";
import { ObservatoryBackground, ObservatoryFooter, ObservatoryHeader, ObservatoryShell } from "./components/layout/Observatory";
import { useAuth } from "./lib/hooks/useAuth";
import { useObservatoryData } from "./lib/hooks/useObservatoryData";

export default function AppV2() {
	const { isLoading, isAdmin, isLogin } = useAuth();

	if (isLoading) return <Box minH="100svh" bg="#12101f" color="#f1edf8" p={8} role="status">로그인 정보를 확인하고 있어요.</Box>;
	if (!isAdmin || !isLogin) return <Navigate to="/" replace />;
	return <ObservatoryApp />;
}

function ObservatoryApp() {
	const data = useObservatoryData();
	return (
		<ObservatoryShell>
			<ObservatoryBackground />
			<ObservatoryHeader refreshing={data.videos.isFetching || data.live.isFetching} onRefresh={() => {
				void data.videos.refetch();
				void data.live.refetch();
			}} />
			<Box as="main" position="relative" minH="65svh" id="obs-main" tabIndex={-1}>
				<Outlet context={data} />
			</Box>
			<ObservatoryFooter />
		</ObservatoryShell>
	);
}
