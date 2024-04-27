import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { MainProvider } from "./lib/Provider.tsx";
import { router } from "./_router.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
	<MainProvider>
		<RouterProvider router={router} />
	</MainProvider>
);

