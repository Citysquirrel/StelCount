import ReactDOM from "react-dom/client";
import "./index.css";
import { RouterProvider } from "react-router-dom";
import { MainProvider } from "./lib/Provider";
import { router } from "./_router";

ReactDOM.createRoot(document.getElementById("root")!).render(
	<MainProvider>
		<RouterProvider router={router} />
	</MainProvider>
);

