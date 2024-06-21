import { RouteObject, createBrowserRouter } from "react-router-dom";
import App from "./App";
import { OAuth } from "./pages/OAuth";
import { Login } from "./pages/Login";
import { NotExist } from "./pages/NotExist";
import { YoutubeVideo } from "./pages/YoutubeVideo";
import { lazy } from "react";
import Home from "./pages/Home";
import { About } from "./pages/About";
import { Counter } from "./pages/Counter";

const Admin = lazy(() => import("./pages/Admin").then((m) => ({ default: m.Admin })));
const AdminEdit = lazy(() => import("./pages/Admin").then((m) => ({ default: m.AdminEdit })));

const devRoutes: RouteObject[] = import.meta.env.DEV ? [{ path: "/video", element: <YoutubeVideo /> }] : [];

export const routeObj: RouteObject[] = [
	{
		path: "/",
		element: <App />,
		children: [
			{ path: "/", element: <NotExist /> },
			{ path: "/home", element: <Home /> },
			{ path: "/about", element: <About /> },
			{ path: "/counter", element: <Counter /> },
			{ path: "/admin", element: <Admin /> },
			{ path: "/admin/:id", element: <AdminEdit /> },
			...devRoutes,
		],
	},
	{ path: "/login", element: <Login /> },
	{ path: "/oauth", element: <OAuth /> },
	{ path: "*", element: <NotExist /> },
];

export const router = createBrowserRouter(routeObj);
