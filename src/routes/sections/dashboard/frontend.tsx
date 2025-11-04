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
					{ index: true, element: <Navigate to="user" replace /> },
					{ path: "role", element: Component("/pages/management/system/role") },
					{ path: "user", element: Component("/pages/management/system/user") },
					{ path: "user/:id", element: Component("/pages/management/system/user/detail") },
				],
			},
		],
	},
	{
		path: "inventory",
		children: [
			{ path: "product", element: Component("/pages/inventory/product") },
			{ path: "category", element: Component("/pages/inventory/category") },
			{ path: "invoice", element: Component("/pages/inventory/invoice") },
			{ path: "invoice/movement_types", element: Component("/pages/inventory/invoice/movement-types") },
			{ path: "invoice/:id", element: Component("/pages/inventory/invoice/detail") },
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
	{ path: "reports", element: Component("/pages/sys/others/reports") },
];
