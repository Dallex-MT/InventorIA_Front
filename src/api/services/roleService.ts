import apiClient from "../apiClient";

import type { PermissionInfo, Role } from "#/entity";

export interface QueryParams {
	page: number;
	limit: number;
	active?: boolean;
}

export interface PaginatedRolesRes {
	success: boolean;
	message: string;
	data: {
		roles: Role[];
		total: number;
		page: number;
		totalPages: number;
	};
}

export interface PermissionsRes {
	success: boolean;
	data: PermissionInfo[];
	message: string;
}

export interface CreateRoleReq {
	nombre: string;
	descripcion: string;
	activo: boolean;
	permisos: number[];
}

export interface UpdateRoleReq {
	roleId: number;
	nombre: string;
	descripcion: string;
	activo: boolean;
	permisos: number[];
}

export interface BasicRes {
	success: boolean;
	message: string;
	data?: any;
}

export enum RoleApi {
	Roles = "/roles",
	Permissions = "/permisos",
}

const validatePermission = (p: any): PermissionInfo | null => {
	const id = Number(p?.id);
	const nombre = String(p?.nombre ?? "");
	if (Number.isNaN(id) || !nombre) return null;
	return { id, nombre };
};

const validateRole = (r: any): Role | null => {
	if (!r || typeof r !== "object") return null;
	const id = Number(r.id);
	const nombre = String(r.nombre ?? "");
	const descripcion = String(r.descripcion ?? "");
	const activo = Boolean(r.activo);
	const fecha_creacion = String(r.fecha_creacion ?? "");
	const fecha_actualizacion = String(r.fecha_actualizacion ?? "");
	const permisosRaw = Array.isArray(r.permisos) ? r.permisos : [];
	const permisos: PermissionInfo[] = permisosRaw.map(validatePermission).filter((x: PermissionInfo | null): x is PermissionInfo => x !== null);
	if (Number.isNaN(id)) return null;
	return { id, nombre, descripcion, activo, fecha_creacion, fecha_actualizacion, permisos } as Role;
};

const getRoles = async (params?: QueryParams): Promise<PaginatedRolesRes> => {
	const queryParams = params ? new URLSearchParams() : undefined;
	if (params) {
		queryParams?.append("page", params.page.toString());
		queryParams?.append("limit", params.limit.toString());
		if (params.active !== undefined) {
			queryParams?.append("active", params.active.toString());
		}
	}

	const raw = await apiClient.get<PaginatedRolesRes>({
		url: RoleApi.Roles,
		params: queryParams,
	});
	if (raw?.data?.roles && Array.isArray(raw.data.roles)) {
		const roles = raw.data.roles.map(validateRole).filter((x): x is Role => x !== null);
		return { ...raw, data: { ...raw.data, roles } };
	}
	return raw;
};

const getPermissions = () => {
	return apiClient.get<PermissionsRes>({
		url: RoleApi.Permissions,
	});
};

const createRole = (payload: CreateRoleReq) => {
	return apiClient.post<BasicRes>({
		url: RoleApi.Roles,
		data: {
			nombre: payload.nombre,
			descripcion: payload.descripcion,
			activo: payload.activo,
			permisos_ids: payload.permisos,
		},
	});
};

const updateRole = (payload: UpdateRoleReq) => {
	console.log(payload);
	return apiClient.put<BasicRes>({
		url: `${RoleApi.Roles}/${payload.roleId}`,
		data: {
			nombre: payload.nombre,
			descripcion: payload.descripcion,
			activo: payload.activo,
			permisos_ids: payload.permisos,
		},
	});
};

export default {
	getRoles,
	getPermissions,
	createRole,
	updateRole,
};
