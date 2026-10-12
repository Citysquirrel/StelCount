import { Box } from "@chakra-ui/react";
import { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ObservatoryBackground, ObservatoryBackToTop, ObservatoryFooter, ObservatoryHeader, ObservatoryShell } from "./components/layout/Observatory";
import { useObservatoryData } from "./lib/hooks/useObservatoryData";
import { ObservatoryPremieres } from "./components/layout/ObservatoryPremieres";
import { selectHomeVideos } from "./lib/functions/homeV2";

export default function AppV2() {
	const data = useObservatoryData();
	const premieres = useMemo(() => selectHomeVideos(data.videos.data || []).premiere, [data.videos.data]);
	const { pathname } = useLocation();
	return (
		<ObservatoryShell>
			<ObservatoryBackground />
			<ObservatoryHeader />
			<Box as="main" position="relative" flex="1 0 auto" minH="65svh" id="obs-main" tabIndex={-1} _focus={{ outline: "none" }}>
				<Outlet context={data} />
			</Box>
			<Box pb={{ base: pathname.replace(/\/$/, "") === "/counter" ? "calc(81px + env(safe-area-inset-bottom, 0px))" : 0, lg: 0 }}>
				<ObservatoryFooter />
			</Box>
			<ObservatoryBackToTop />
			{premieres.length > 0 && <ObservatoryPremieres items={premieres} />}
		</ObservatoryShell>
	);
}
