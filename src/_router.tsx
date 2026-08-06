/* eslint-disable react-refresh/only-export-components */
import HomeV2 from "@page/v2/Home";
import { lazy } from "react";
import { Navigate, RouteObject, createBrowserRouter } from "react-router-dom";
import App from "./App";
import AppV2 from "./AppV2";
import { Counter } from "./pages/Counter";
import Home from "./pages/Home";
import { Login } from "./pages/Login";
import { MultiView } from "./pages/MultiView";
import { NotExist } from "./pages/NotExist";
import { OAuth } from "./pages/OAuth";
import { ServerErrorPage } from "./pages/ServerErrorPage";
import { SongHistoryComponent } from "./pages/Admin/SongHistory";

const Admin = lazy(() => import("./pages/Admin").then((m) => ({ default: m.Admin })));
const AdminEdit = lazy(() => import("./pages/Admin").then((m) => ({ default: m.AdminEdit })));
const NewAdmin = lazy(() => import("./pages/Admin/Main").then((m) => ({ default: m.NewAdmin })));
const Dashboard = lazy(() => import("./pages/Admin/Dashboard").then((m) => ({ default: m.Dashboard })));
const Stellar = lazy(() => import("./pages/Admin/Stellar").then((m) => ({ default: m.Stellar })));
const Video = lazy(() => import("./pages/Admin/Video").then((m) => ({ default: m.Video })));
const Songbook = lazy(() => import("./pages/Admin/Songbook").then((m) => ({ default: m.Songbook })));
const Setting = lazy(() => import("./pages/Admin/Setting").then((m) => ({ default: m.Setting })));

const devRoutes: RouteObject[] = import.meta.env.DEV ? [] : [];

export const routeObj: RouteObject[] = [
	{
		path: "/",
		element: <App />,
		errorElement: <ServerErrorPage isErrorComponent />,
		children: [
			{ path: "/home", element: <Home /> },
			{ path: "/counter", element: <Counter /> },
			{
				path: "/old-admin",
				element: <Admin />,
			},
			{ path: "/old-admin/:id", element: <AdminEdit /> },
			{
				path: "/admin",
				element: <NewAdmin />,
				children: [
					{ element: <Navigate to="/admin/dashboard" replace />, index: true },
					{
						path: "dashboard",
						element: <Dashboard />,
					},
					{
						path: "stellar",
						element: <Stellar />,
					},
					{
						path: "video",
						element: <Video />,
					},
					{
						path: "songbook",
						element: <Songbook />,
					},
					{
						path: "song-history",
						element: <SongHistoryComponent />,
					},
					{
						path: "setting",
						element: <Setting />,
					},
				],
			},
			...devRoutes,
			{ path: "/", element: <NotExist /> },
		],
	},
	{ path: "/v2", element: <AppV2 />, children: [{ element: <HomeV2 />, index: true }] },
	{ path: "/multiview", element: <MultiView />, errorElement: <ServerErrorPage isErrorComponent /> },
	{ path: "/login", element: <Login />, errorElement: <ServerErrorPage isErrorComponent /> },
	{ path: "/oauth", element: <OAuth />, errorElement: <ServerErrorPage isErrorComponent /> },
	{ path: "*", element: <NotExist />, errorElement: <ServerErrorPage isErrorComponent /> },
];

export const router = createBrowserRouter(routeObj);
