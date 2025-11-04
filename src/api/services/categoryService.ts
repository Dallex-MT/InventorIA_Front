import apiClient from "../apiClient";

import type { CategoryInfo } from "#/entity";

export interface QueryParams {
	page: number;
	limit: number;
	active?: boolean;
}

export interface PaginatedCategoriesRes {
	success: boolean;
	message: string;
	data: {
		categories: CategoryInfo[];
		total: number;
		page: number;
		totalPages: number;
	};
}

export enum CategoryApi {
	Categories = "/categorias",
}

const getCategories = (params?: QueryParams) => {
	const queryParams = params ? new URLSearchParams() : undefined;
	if (params) {
		queryParams?.append("page", params.page.toString());
		queryParams?.append("limit", params.limit.toString());
		if (params.active !== undefined) {
			queryParams?.append("active", params.active.toString());
		}
	}

	return apiClient.get<PaginatedCategoriesRes>({
		url: CategoryApi.Categories,
		params: queryParams,
	});
};

export default {
	getCategories,
};
