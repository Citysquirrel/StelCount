/* eslint-disable react-refresh/only-export-components */
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { MainProvider } from "./lib/Provider";
import { router } from "./_router";
import { useHotkeys } from "react-hotkeys-hook";
import { useMessage } from "./lib/hooks/useMessage";

function GlobalAuthEvents() {
	useMessage();
	useHotkeys("ctrl+shift+l", (event) => {
		if (event.repeat) return;
		const width = 500;
		const height = 600;
		const left = window.innerWidth / 2 - width / 2;
		const top = window.innerHeight / 2 - height / 2;
		window.open("/login", "LoginPopup", `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`)?.focus();
	}, { preventDefault: true, enableOnFormTags: true, enableOnContentEditable: true });
	return null;
}

const DevComponents = import.meta.env.DEV
	? React.lazy(() =>
			import("./lib/DevDock").then((module) => ({
				default: () => (
					<>
						<module.ConsoleDock />
						<module.NetworkDock />
					</>
				),
			})),
		)
	: null;

ReactDOM.createRoot(document.getElementById("root")!).render(
	<MainProvider>
		<GlobalAuthEvents />
		{DevComponents && (
			<Suspense fallback={null}>
				<DevComponents />
			</Suspense>
		)}
		{/* <MaintenanceComponent /> */}
		<RouterProvider router={router} future={{ v7_startTransition: true }} />
	</MainProvider>,
);

// function MaintenanceComponent({}) {
// 	useMaintenance();
// 	return <></>;
// }
