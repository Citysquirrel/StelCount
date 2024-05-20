import { RouteObject, createBrowserRouter } from "react-router-dom";
import App from "./App";
import { Home } from "./pages/Home";
import { Counter } from "./pages/Counter";
import { Admin, AdminEdit } from "./pages/Admin";
import { OAuth } from "./pages/OAuth";
import { Login } from "./pages/Login";
import { NotExist } from "./pages/NotExist";
import { YoutubeVideo } from "./pages/YoutubeVideo";

const devRoutes: RouteObject[] = import.meta.env.DEV ? [{ path: "/video", element: <YoutubeVideo /> }] : [];

export const routeObj: RouteObject[] = [
	{
		path: "/",
		element: <App />,
		children: [
			{ path: "/", element: <Home /> },
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
