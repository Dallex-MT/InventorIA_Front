import apiClient from "../apiClient";

import type { ProductInfo } from "#/entity";

export interface QueryParams {
	page: number;
	limit: number;
	active?: boolean;
	search?: string;
	unidad_medida?: string;
	categoria_id?: number;
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
		if (params.search && params.search.trim().length > 0) {
			queryParams?.append("search", params.search.trim());
		}
		if (params.unidad_medida && params.unidad_medida.trim().length > 0) {
			queryParams?.append("unidad_medida", params.unidad_medida.trim());
		}
		if (params.categoria_id !== undefined && params.categoria_id !== null && !Number.isNaN(Number(params.categoria_id))) {
			queryParams?.append("categoria_id", String(params.categoria_id));
		}
	}

	return apiClient.get<PaginatedProductsRes>({
		url: ProductApi.Products,
		params: queryParams,
	});
};

export interface UpdateProductReq {
	productId: number;
	nombre: string;
	descripcion: string;
	categoria_id: number;
	unidad_medida: string;
	stock_actual: number;
	stock_minimo: number;
	precio_referencia: number;
	activo: boolean;
}

export interface UpdateProductRes {
	success: boolean;
	message?: string;
	data?: {
		id: number;
		nombre: string;
		descripcion: string;
		categoria_id: number;
		unidad_medida: string;
		stock_actual: string; // "100.0000"
		stock_minimo: string; // "5.0000"
		precio_referencia: string; // "5.89"
		activo: number; // 1 | 0
		fecha_creacion: string;
		fecha_actualizacion: string;
	};
}

const updateProduct = (req: UpdateProductReq) => {
	return apiClient.put<UpdateProductRes>({
		url: `${ProductApi.Products}/${req.productId}`,
		data: {
			nombre: req.nombre,
			descripcion: req.descripcion,
			categoria_id: req.categoria_id,
			unidad_medida: req.unidad_medida,
			stock_actual: req.stock_actual,
			stock_minimo: req.stock_minimo,
			precio_referencia: req.precio_referencia,
			activo: req.activo,
		},
	});
};

// Crear un nuevo producto (POST /productos)
export interface CreateProductReq {
	nombre: string;
	descripcion: string;
	categoria_id: number;
	unidad_medida: string;
	stock_actual: number;
	stock_minimo: number;
	precio_referencia: number;
	activo: boolean;
}

export interface CreateProductRes {
	success: boolean;
	message?: string;
	data?: ProductInfo;
}

const createProduct = (req: CreateProductReq) => {
	// Validar y normalizar payload
	const payload: CreateProductReq = {
		nombre: String(req.nombre),
		descripcion: String(req.descripcion),
		categoria_id: Number(req.categoria_id),
		unidad_medida: String(req.unidad_medida),
		stock_actual: Number(req.stock_actual),
		stock_minimo: Number(req.stock_minimo),
		precio_referencia: Number(req.precio_referencia),
		activo: Boolean(req.activo),
	};

	return apiClient.post<CreateProductRes>({
		url: ProductApi.Products,
		data: payload,
	});
};

export default {
	getProducts,
	updateProduct,
	createProduct,
};
