import { RouteObject, createBrowserRouter } from "react-router-dom";
import App from "./App";
import { OAuth } from "./pages/OAuth";
import { Login } from "./pages/Login";
import { NotExist } from "./pages/NotExist";
import { lazy } from "react";
import Home from "./pages/Home";
import { Counter } from "./pages/Counter";
import { ServerErrorPage } from "./pages/ServerErrorPage";
import { MultiView } from "./pages/MultiView";

const Admin = lazy(() => import("./pages/Admin").then((m) => ({ default: m.Admin })));
const AdminEdit = lazy(() => import("./pages/Admin").then((m) => ({ default: m.AdminEdit })));

const devRoutes: RouteObject[] = import.meta.env.DEV ? [] : [];

export const routeObj: RouteObject[] = [
	{
		path: "/",
		element: <App />,
		errorElement: <ServerErrorPage isErrorComponent />,
		children: [
			{ path: "/home", element: <Home /> },
			// { path: "/about", element: <About /> },
			{ path: "/counter", element: <Counter /> },
			{
				path: "/admin",
				element: <Admin />,
				children: [
					{
						path: "sub",
						element: <></>,
					},
				],
			},
			{ path: "/admin/:id", element: <AdminEdit /> },
			...devRoutes,
			{ path: "/", element: <NotExist /> },
		],
	},
	{ path: "/multiview", element: <MultiView />, errorElement: <ServerErrorPage isErrorComponent /> },
	{ path: "/login", element: <Login />, errorElement: <ServerErrorPage isErrorComponent /> },
	{ path: "/oauth", element: <OAuth />, errorElement: <ServerErrorPage isErrorComponent /> },
	{ path: "*", element: <NotExist />, errorElement: <ServerErrorPage isErrorComponent /> },
];

export const router = createBrowserRouter(routeObj);
