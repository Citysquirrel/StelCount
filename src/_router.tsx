import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Home } from "./pages/Home";
import { Counter } from "./pages/Counter";
import { Admin } from "./pages/Admin";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
		children: [
			{ path: "/", element: <Home /> },
			{ path: "/counter", element: <Counter /> },
			{ path: "/admin", element: <Admin /> },
		],
	},
]);
