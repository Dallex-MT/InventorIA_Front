import { useUserInfo, useUserPermissions, useUserRoles } from "@/store/userStore";

/**
 * permission/role check hook
 * @param baseOn - check type: 'role' or 'permission'
 *
 * @example
 * // permission check
 * const { check, checkAny, checkAll } = useAuthCheck('permission');
 * check('user.create')
 * checkAny(['user.create', 'user.edit'])
 * checkAll(['user.create', 'user.edit'])
 *
 * @example
 * // role check
 * const { check, checkAny, checkAll } = useAuthCheck('role');
 * check('admin')
 * checkAny(['admin', 'editor'])
 * checkAll(['admin', 'editor'])
 */
export const useAuthCheck = (baseOn: "role" | "permission" = "permission") => {
	const user = useUserInfo();
	const permissions = useUserPermissions();
	const roles = useUserRoles();

	const resourcePool: any[] = baseOn === "role" ? roles : (permissions as any[]);

	const check = (item: string | number): boolean => {
		const isLoggedIn = Boolean(user?.id) || Boolean(user?.correo);
		if (!isLoggedIn) {
			return false;
		}
		if (resourcePool.length === 0) return false;

		const first = resourcePool[0];
		if (typeof first === "number") {
			const target = typeof item === "number" ? item : Number(item);
			if (Number.isNaN(target)) return true; // compat: sin mapeo de códigos, permitir acceso
			return (resourcePool as number[]).includes(target);
		}
		return resourcePool.some((p) => p && typeof p === "object" && "code" in p && p.code === item);
	};

	const checkAny = (items: Array<string | number>) => {
		if (items.length === 0) {
			return true;
		}
		return items.some((item) => check(item));
	};

	const checkAll = (items: Array<string | number>) => {
		if (items.length === 0) {
			return true;
		}
		return items.every((item) => check(item));
	};

	return { check, checkAny, checkAll };
};
