import { Box } from "@chakra-ui/react";
import { HeaderV2 } from "@component/Header";
import { Navigate, Outlet } from "react-router-dom";
import { SpaceBackground } from "@layout/space/SpaceBackground";
import { MainContainerV2 } from "@component/Container";
import { useAuth } from "./lib/hooks/useAuth";

export default function AppV2() {
	const { isLoading, isAdmin, isLogin } = useAuth();

	if (isLoading) return <div>loading..</div>;
	if (!isAdmin || !isLogin) return <Navigate to="/" replace />;

	return (
		<Box position="relative" w="100vw" minH="100vh" bg="#0F0C20" color="white" overflowX="hidden">
			<SpaceBackground />
			<HeaderV2 />
			<MainContainerV2>
				<Outlet />
			</MainContainerV2>
		</Box>
	);
}
