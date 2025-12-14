import { useMutation } from "@tanstack/react-query";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import userService, { type SignInReq } from "@/api/services/userService";

import { toast } from "sonner";
import type { UserInfo } from "#/entity";

type UserStore = {
	userInfo: Partial<UserInfo>;
	permissions: number[];

	actions: {
		setUserInfo: (userInfo: UserInfo) => void;
		setPermissions: (permissions: number[]) => void;
		setSession: (userInfo: UserInfo, permissions: number[]) => void;
		clearUserInfoAndToken: () => void;
	};
};

const useUserStore = create<UserStore>()(
	persist(
		(set) => ({
			userInfo: {},
			permissions: [],
			actions: {
				setUserInfo: (userInfo) => {
					set({ userInfo });
				},
				setPermissions: (permissions) => {
					set({ permissions });
				},
				setSession: (userInfo, permissions) => {
					set({ userInfo, permissions });
				},
				clearUserInfoAndToken() {
					set({ userInfo: {}, permissions: [] });
				},
			},
		}),
		{
			name: "userStore",
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				userInfo: state.userInfo,
				permissions: state.permissions,
			}),
		},
	),
);

export const useUserInfo = () => useUserStore((state) => state.userInfo);
export const useUserPermissions = () => useUserStore((state) => state.permissions);
export const useUserRoles = () => [] as any[];
export const useUserActions = () => useUserStore((state) => state.actions);

export const usePermissionFlags = () => {
	const permissions = useUserPermissions();
	const isAdmin = permissions.includes(1);
	const has2 = permissions.includes(2);
	const has3 = permissions.includes(3);
	const isReadOnly = !isAdmin && has2 && !has3 && permissions.every((p) => p === 2);
	const canWrite = isAdmin || (has2 && has3);
	return { isAdmin, isReadOnly, canWrite };
};

export const useSignIn = () => {
	const { setSession } = useUserActions();

	const signInMutation = useMutation({
		mutationFn: userService.signin,
	});

	const signIn = async (data: SignInReq) => {
		const res = await signInMutation.mutateAsync(data);

		if (!res || typeof res !== "object") {
			const msg = "Respuesta de login inválida";
			toast.error(msg, { position: "top-center" });
			throw new Error(msg);
		}

		if (!res.success) {
			const msg = res.message || "Error en inicio de sesión";
			toast.error(msg, { position: "top-center" });
			throw new Error(msg);
		}

		const u = res.user as any;
		const required = ["id", "nombre_usuario", "correo", "rol_id", "activo", "cedula"];
		const missing = required.filter((k) => !(k in u));
		if (missing.length > 0) {
			const msg = `Campos obligatorios faltantes: ${missing.join(", ")}`;
			toast.error(msg, { position: "top-center" });
			throw new Error(msg);
		}

		const normalizedUser: UserInfo = {
			id: Number(u.id),
			cedula: String(u.cedula),
			nombre_usuario: String(u.nombre_usuario),
			correo: String(u.correo),
			rol_id: Number(u.rol_id),
			activo: u.activo === true || Number(u.activo) === 1,
			fecha_creacion: u.fecha_creacion ?? undefined,
			fecha_actualizacion: u.fecha_actualizacion ?? undefined,
			ultimo_acceso: u.ultimo_acceso ?? undefined,
		};

		const permsRaw = Array.isArray(res.permissions) ? res.permissions : [];
		const permissions = permsRaw.filter((p) => typeof p === "number").map((p) => Number(p));

		setSession(normalizedUser, permissions);

		if (res.message) {
			toast.success(res.message, { position: "top-center" });
		}
		return normalizedUser;
	};

	return signIn;
};

export default useUserStore;
