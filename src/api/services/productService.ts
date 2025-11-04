import apiClient from "../apiClient";

import type { ProductInfo } from "#/entity";

export interface QueryParams {
	page: number;
	limit: number;
	active?: boolean;
}

export interface PaginatedProductsRes {
	success: boolean;
	message: string;
	data: {
		products: ProductInfo[];
		total: number;
		page: number;
		totalPages: number;
	};
}

export enum ProductApi {
	Products = "/productos",
}

const getProducts = (params?: QueryParams) => {
	const queryParams = params ? new URLSearchParams() : undefined;
	if (params) {
		queryParams?.append("page", params.page.toString());
		queryParams?.append("limit", params.limit.toString());
		if (params.active !== undefined) {
			queryParams?.append("active", params.active.toString());
		}
	}

	return apiClient.get<PaginatedProductsRes>({
		url: ProductApi.Products,
		params: queryParams,
	});
};

export default {
	getProducts,
};
