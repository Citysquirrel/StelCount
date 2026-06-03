import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { MainProvider } from "./lib/Provider";
import { router } from "./_router";
import { useMaintenance } from "./lib/hooks/useMaintenance";

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
		{DevComponents && (
			<Suspense fallback={null}>
				<DevComponents />
			</Suspense>
		)}
		{/* <MaintenanceComponent /> */}
		<RouterProvider router={router} />
	</MainProvider>,
);

// function MaintenanceComponent({}) {
// 	useMaintenance();
// 	return <></>;
// }
