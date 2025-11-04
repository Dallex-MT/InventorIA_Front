import { useMutation } from "@tanstack/react-query";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import userService, { type SignInReq } from "@/api/services/userService";

import { toast } from "sonner";
import type { UserInfo } from "#/entity";
import { StorageEnum } from "#/enum";

type UserStore = {
	userInfo: Partial<UserInfo>;

	actions: {
		setUserInfo: (userInfo: UserInfo) => void;
		clearUserInfoAndToken: () => void;
	};
};

const useUserStore = create<UserStore>()(
	persist(
		(set) => ({
			userInfo: {},
			actions: {
				setUserInfo: (userInfo) => {
					set({ userInfo });
				},
				clearUserInfoAndToken() {
					set({ userInfo: {} });
				},
			},
		}),
		{
			name: "userStore", // name of the item in the storage (must be unique)
			storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
			partialize: (state) => ({
				[StorageEnum.UserInfo]: state.userInfo,
			}),
		},
	),
);

export const useUserInfo = () => useUserStore((state) => state.userInfo);
export const useUserPermissions = () => [] as { code: string }[];
export const useUserRoles = () => [] as any[];
export const useUserActions = () => useUserStore((state) => state.actions);

export const useSignIn = () => {
	const { setUserInfo } = useUserActions();

	const signInMutation = useMutation({
		mutationFn: userService.signin,
	});

	const signIn = async (data: SignInReq) => {
		const res = await signInMutation.mutateAsync(data);
		if (res?.success) {
			setUserInfo(res.user);
			if (res.message) {
				toast.success(res.message, { position: "top-center" });
			}
			return res.user;
		}

		// Si no es success, mostrar mensaje si existe
		if (res?.message) {
			toast.error(res.message, { position: "top-center" });
		}
		throw new Error(res?.message || "Error en inicio de sesión");
	};

	return signIn;
};

export default useUserStore;
