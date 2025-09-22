import type { RouteObject } from "react-router";
import { Navigate } from "react-router";
import { Component } from "./utils";

export const frontendDashboardRoutes: RouteObject[] = [
	{ path: "workbench", element: Component("/pages/dashboard/workbench") },
	{ path: "analysis", element: Component("/pages/dashboard/analysis") },
	{
		path: "functions",
		children: [
			{ index: true, element: <Navigate to="clipboard" replace /> },
			{ path: "clipboard", element: Component("/pages/functions/clipboard") },
			{ path: "token_expired", element: Component("/pages/functions/token-expired") },
		],
	},
	{
		path: "management",
		children: [
			{ index: true, element: <Navigate to="system" replace /> },
			{
				path: "user",
				children: [
					{ index: true, element: <Navigate to="account" replace /> },
					{ path: "account", element: Component("/pages/management/user/account") },
				],
			},
			{
				path: "system",
				children: [
					{ index: true, element: <Navigate to="permission" replace /> },
					{ path: "permission", element: Component("/pages/management/system/permission") },
					{ path: "role", element: Component("/pages/management/system/role") },
					{ path: "user", element: Component("/pages/management/system/user") },
					{ path: "user/:id", element: Component("/pages/management/system/user/detail") },
				],
			},
		],
	},
	{
		path: "error",
		children: [
			{ index: true, element: <Navigate to="403" replace /> },
			{ path: "403", element: Component("/pages/sys/error/Page403") },
			{ path: "404", element: Component("/pages/sys/error/Page404") },
			{ path: "500", element: Component("/pages/sys/error/Page500") },
		],
	},
	{ path: "calendar", element: Component("/pages/sys/others/calendar") },
	{ path: "kanban", element: Component("/pages/sys/others/kanban") },
];
