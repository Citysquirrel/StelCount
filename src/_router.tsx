import { RouteObject, createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Home } from "./pages/Home";
import { Counter } from "./pages/Counter";
import { Admin } from "./pages/Admin";
import { OAuth } from "./pages/OAuth";
import { Login } from "./pages/Login";

export const routeObj: RouteObject[] = [
	{
		path: "/",
		element: <App />,
		children: [
			{ path: "/", element: <Home /> },
			{ path: "/counter", element: <Counter /> },
			{ path: "/admin", element: <Admin /> },
			{ path: "/login", element: <Login /> },
			{ path: "/oauth", element: <OAuth /> },
		],
	},
];

export const router = createBrowserRouter(routeObj);
