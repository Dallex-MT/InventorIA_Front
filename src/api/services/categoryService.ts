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

export interface UpdateCategoryReq {
	categoryId: number;
	nombre: string;
	descripcion: string;
	activo: boolean;
}

export interface UpdateCategoryRes {
	success: boolean;
	message: string;
	data?: {
		id: number;
		nombre: string;
		descripcion: string;
		activo: number | boolean;
		fecha_creacion: string;
	};
}

const updateCategory = (req: UpdateCategoryReq) => {
	return apiClient.put<UpdateCategoryRes>({
		url: `${CategoryApi.Categories}/${req.categoryId}`,
		data: {
			nombre: req.nombre,
			descripcion: req.descripcion,
			activo: req.activo,
		},
	});
};

// Crear una nueva categoría (POST /categorias)
export interface CreateCategoryReq {
	nombre: string;
	descripcion: string;
	activo: boolean;
}

export interface CreateCategoryRes {
	success: boolean;
	message: string;
	data?: CategoryInfo;
}

const createCategory = (req: CreateCategoryReq) => {
	// Validar parámetros mínimos antes de enviar
	const payload = {
		nombre: String(req.nombre),
		descripcion: String(req.descripcion ?? ""),
		activo: Boolean(req.activo),
	};

	return apiClient.post<CreateCategoryRes>({
		url: CategoryApi.Categories,
		data: payload,
	});
};

export default {
	getCategories,
	updateCategory,
	createCategory,
};
