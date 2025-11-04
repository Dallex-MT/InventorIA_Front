import apiClient from "../apiClient";

import type { Role } from "#/entity";

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

export enum RoleApi {
	Roles = "/roles",
}

const getRoles = (params?: QueryParams) => {
	const queryParams = params ? new URLSearchParams() : undefined;
	if (params) {
		queryParams?.append("page", params.page.toString());
		queryParams?.append("limit", params.limit.toString());
		if (params.active !== undefined) {
			queryParams?.append("active", params.active.toString());
		}
	}

	return apiClient.get<PaginatedRolesRes>({
		url: RoleApi.Roles,
		params: queryParams,
	});
};

export default {
	getRoles,
};
