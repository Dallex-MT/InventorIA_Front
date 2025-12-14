import type { NavItemDataProps } from "@/components/nav/types";
import { useUserPermissions } from "@/store/userStore";
import { useMemo } from "react";
import { frontendNavData } from "./nav-data-frontend";

const { VITE_APP_ROUTER_MODE: ROUTER_MODE } = import.meta.env;
const navData = ROUTER_MODE === "backend" ? frontendNavData : frontendNavData;

/**
 * 递归处理导航数据，过滤掉没有权限的项目
 * @param items 导航项目数组
 * @param permissions 权限列表
 * @returns 过滤后的导航项目数组
 */
const hasAccess = (auth: Array<string | number> | undefined, permissions: Array<string | number>) => {
	if (!auth || auth.length === 0) return true;
	if (!permissions || permissions.length === 0) return false;
	const permsAreNumbers = typeof permissions[0] === "number";
	if (permsAreNumbers) {
		const permNums = permissions.map((p) => (typeof p === "number" ? p : Number(p))).filter((n) => !Number.isNaN(n));
		const authNums = auth.map((a) => (typeof a === "number" ? a : Number(a))).filter((n) => !Number.isNaN(n));
		return authNums.some((n) => permNums.includes(n));
	}
	const permStrings = permissions.map((p) => String(p));
	const authStrings = auth.map((a) => String(a));
	return authStrings.some((a) => permStrings.includes(a));
};

const filterItems = (items: NavItemDataProps[], permissions: Array<string | number>) => {
	return items.filter((item) => {
		const allowed = hasAccess(item.auth, permissions);
		if (item.children?.length) {
			const filteredChildren = filterItems(item.children, permissions);
			if (filteredChildren.length === 0 && !allowed) {
				return false;
			}
			item.children = filteredChildren;
		}
		return allowed;
	});
};

/**
 * 根据权限过滤导航数据
 * @param permissions 权限列表
 * @returns 过滤后的导航数据
 */
const filterNavData = (permissions: Array<string | number>) => {
	return navData
		.map((group) => {
			// 过滤组内的项目
			const filteredItems = filterItems(group.items, permissions);

			// 如果组内没有项目了，返回 null
			if (filteredItems.length === 0) {
				return null;
			}

			// 返回过滤后的组
			return {
				...group,
				items: filteredItems,
			};
		})
		.filter((group): group is NonNullable<typeof group> => group !== null); // 过滤掉空组
};

/**
 * Hook to get filtered navigation data based on user permissions
 * @returns Filtered navigation data
 */
export const useFilteredNavData = () => {
	const permissions = useUserPermissions() as Array<number>;
	const filteredNavData = useMemo(() => {
		return filterNavData(permissions);
	}, [permissions]);
	return filteredNavData;
};
