import apiClient from "../apiClient";

import type { UserInfo } from "#/entity";

export interface SignInReq {
	correo: string;
	password: string;
}

export interface QueryParams {
	page: number;
	limit: number;
	active?: boolean;
}

export interface PaginatedUsersRes {
	success: boolean;
	message: string;
	data: {
		users: UserInfo[];
		total: number;
		page: number;
		totalPages: number;
	};
}

export interface UpdateUserProfileReq {
	userId?: number;
	cedula: string;
	nombre_usuario: string;
	correo: string;
	estado: boolean;
}

export interface UpdateUserProfileRes {
	success: boolean;
	message: string;
	user: {
		id: number;
		cedula: string;
		nombre_usuario: string;
		correo: string;
		rol_id: number;
		activo: number;
		ultimo_acceso: string;
		fecha_creacion: string;
		fecha_actualizacion: string;
	};
	metadata: {
		updatedBy: number;
		updatedUser: number;
		isAdmin: boolean;
	};
}

export interface RegisterReq {
	cedula: string;
	nombre_usuario: string;
	correo: string;
	password: string;
	rol_id: number;
}

export interface RegisterRes {
	success: boolean;
	message: string;
	user: {
		id: number;
		cedula: string;
		nombre_usuario: string;
		correo: string;
		rol_id: number;
		activo: number;
		ultimo_acceso: string | null;
		fecha_creacion: string;
		fecha_actualizacion: string;
	};
}

export type SignInRes = {
	success: boolean;
	message: string;
	user: UserInfo;
};

export type LogoutRes = {
	success: boolean;
	message: string;
};

export type GetUsersRes = {
	success: boolean;
	message: string;
	users: UserInfo[];
};

export enum UserApi {
	SignIn = "/auth/login",
	Logout = "/auth/logout",
	Users = "/users",
	UpdateProfile = "/profile",
	Register = "/register",
	UpdatePassword = "/update-password",
	DeleteUser = "/users",
}

const signin = (data: SignInReq) => apiClient.post<SignInRes>({ url: UserApi.SignIn, data });
const logout = () => apiClient.post<LogoutRes>({ url: UserApi.Logout });

const getUsers = (params?: QueryParams) => {
	const queryParams = params ? new URLSearchParams() : undefined;
	if (params) {
		queryParams?.append("page", params.page.toString());
		queryParams?.append("limit", params.limit.toString());
		if (params.active !== undefined) {
			queryParams?.append("active", params.active.toString());
		}
	}

	return apiClient.get<PaginatedUsersRes>({
		url: UserApi.Users,
		params: queryParams,
	});
};

const updateUserProfile = (data: UpdateUserProfileReq) =>
	apiClient.put<UpdateUserProfileRes>({
		url: UserApi.UpdateProfile,
		data,
	});

const register = (data: RegisterReq) =>
	apiClient.post<RegisterRes>({
		url: UserApi.Register,
		data,
	});

// Interfaz para actualización de contraseña
export interface UpdatePasswordRequest {
	oldPassword: string;
	newPassword: string;
}

export type UpdatePasswordRes = {
	success: boolean;
	message: string;
};

// Interfaz para eliminación de usuario
export interface DeleteUserReq {
	userId: string | number;
}

export interface DeleteUserRes {
	success: boolean;
	message: string;
	user: {
		id: number;
		nombre: string;
		email: string;
		rol_id: number;
		activo: boolean;
		fecha_creacion: string;
		fecha_actualizacion: string;
	};
}

// Servicio para actualizar contraseña con manejo de códigos 200/401/otros
const updatePassword = async (payload: UpdatePasswordRequest): Promise<UpdatePasswordRes> => {
	try {
		const res = await apiClient.put<UpdatePasswordRes>({
			url: UserApi.UpdatePassword,
			data: payload,
			headers: { "Content-Type": "application/json" },
		});
		// Para 200, devolver el objeto de respuesta completo
		return res;
	} catch (err: any) {
		const status = err?.response?.status;
		const msg = err?.response?.data?.message ?? err?.message ?? "Error actualizando la contraseña";
		if (status === 401) {
			// Lanzar estructura requerida con mensaje del servidor
			throw { success: false, message: msg } as UpdatePasswordRes;
		}
		// Otros errores: lanzar error genérico
		throw new Error("Ha ocurrido un error al actualizar la contraseña");
	}
};

// Servicio para eliminar usuario con validación y manejo de errores
const deleteUser = async (userId: string | number): Promise<DeleteUserRes> => {
	const numericUserId = typeof userId === "string" ? Number.parseInt(userId, 10) : userId;
	try {
		const res = await apiClient.delete<DeleteUserRes>({
			url: `${UserApi.DeleteUser}/${numericUserId}`,
			headers: { "Content-Type": "application/json" },
		});
		return res;
	} catch (err: any) {
		throw new Error("Ha ocurrido un error al eliminar el usuario");
	}
};

export default {
	signin,
	logout,
	getUsers,
	updateUserProfile,
	register,
	updatePassword,
	deleteUser,
};
