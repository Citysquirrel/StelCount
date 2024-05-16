import { RouteObject, createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Home } from "./pages/Home";
import { Counter } from "./pages/Counter";
import { Admin } from "./pages/Admin";
import { OAuth } from "./pages/OAuth";
import { Login } from "./pages/Login";
import { NotExist } from "./pages/NotExist";
import { YoutubeVideo } from "./pages/YoutubeVideo";

const devRoutes = import.meta.env.DEV ? [{ path: "/admin", element: <Admin /> }] : [];

export const routeObj: RouteObject[] = [
	{
		path: "/",
		element: <App />,
		children: [
			{ path: "/", element: <Home /> },
			{ path: "/counter", element: <Counter /> },
			{ path: "/video-count", element: <YoutubeVideo /> },
			...devRoutes,
		],
	},
	{ path: "/login", element: <Login /> },
	{ path: "/oauth", element: <OAuth /> },
	{ path: "*", element: <NotExist /> },
];

export const router = createBrowserRouter(routeObj);
