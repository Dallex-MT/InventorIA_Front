import { Icon } from "@/components/icon";
import type { NavProps } from "@/components/nav";
import { Badge } from "@/ui/badge";

export const frontendNavData: NavProps["data"] = [
	{
		name: "sys.nav.dashboard",
		items: [
			{
				title: "sys.nav.workbench",
				path: "/workbench",
				icon: <Icon icon="local:ic-workbench" size="24" />,
			},
		],
	},
	{
		name: "sys.nav.admin",
		items: [
			// management
			{
				title: "sys.nav.management",
				path: "/management",
				icon: <Icon icon="local:ic-management" size="24" />,
				auth: [1],
				children: [
					{
						title: "sys.nav.system.role.index",
						path: "/management/system/role",
						auth: [1],
					},
					{
						title: "sys.nav.user.index",
						path: "/management/system/user",
						auth: [1],
					},
				],
			},
		],
	},
	{
		name: "sys.nav.inventory.index",
		items: [
			{
				title: "sys.nav.inventory.category.index",
				icon: <Icon icon="solar:folder-bold-duotone" size="24" />,
				path: "/inventory/category",
			},
			{
				title: "sys.nav.inventory.product.index",
				icon: <Icon icon="solar:box-bold-duotone" size="24" />,
				path: "/inventory/product",
			},
			{
				title: "sys.nav.inventory.invoice.index",
				icon: <Icon icon="solar:bill-list-bold-duotone" size="24" />,
				path: "/inventory/invoice",
			},
		],
	},
	{
		name: "sys.nav.others",
		items: [
			{
				title: "sys.nav.reports",
				path: "/reports",
				icon: <Icon icon="solar:chart-bold-duotone" size="24" />,
			},
			{
				title: "sys.nav.calendar",
				path: "/calendar",
				icon: <Icon icon="solar:calendar-bold-duotone" size="24" />,
				info: (
					<Badge variant="info">
						<Icon icon="solar:bell-bing-bold-duotone" size={14} />
						Preview
					</Badge>
				),
			},
		],
	},
];
