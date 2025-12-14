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
		pagination: {
			current: number;
			pageSize: number;
			total: number;
			totalPages: number;
		};
	};
}

export enum ProductApi {
	Products = "/productos",
	UnitMeasures = "/unidad-medida",
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
	unidad_medida_id: number;
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
		unidad_medida: {
			id: number;
			nombre: string;
			abreviatura: string;
			activo: number;
		};
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
			unidad_medida_id: req.unidad_medida_id,
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
	unidad_medida_id: number;
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
		unidad_medida_id: Number(req.unidad_medida_id),
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

// export default moved to end to avoid use-before-declaration

export interface UnitMeasureInfo {
	id: number;
	nombre: string;
	abreviatura: string;
	descripcion: string;
	activo: number;
}

export interface GetUnitMeasuresRes {
	success: boolean;
	data: UnitMeasureInfo[];
	message: string;
}

const validateUnitMeasure = (u: any): u is UnitMeasureInfo => {
	return (
		u &&
		typeof u.id === "number" &&
		typeof u.nombre === "string" &&
		typeof u.abreviatura === "string" &&
		typeof u.descripcion === "string" &&
		(typeof u.activo === "number" || typeof u.activo === "boolean")
	);
};

let unitMeasuresCache: UnitMeasureInfo[] | null = null;
let unitMeasuresError: string | null = null;
let unitMeasuresInFlight: Promise<GetUnitMeasuresRes> | null = null;

type GetUnitMeasuresOptions = { forceRefresh?: boolean };

const getUnitMeasures = async (options?: GetUnitMeasuresOptions): Promise<GetUnitMeasuresRes> => {
	const force = Boolean(options?.forceRefresh);
	if (!force && unitMeasuresCache && unitMeasuresCache.length > 0) {
		if (import.meta.env.DEV) console.debug("productService:getUnitMeasures -> cache hit", unitMeasuresCache.length);
		return Promise.resolve({ success: true, data: unitMeasuresCache, message: "cache" });
	}
	if (!force && unitMeasuresInFlight) {
		if (import.meta.env.DEV) console.debug("productService:getUnitMeasures -> dedup inflight");
		return unitMeasuresInFlight;
	}
	unitMeasuresInFlight = (async () => {
		try {
			const res = await apiClient.get<GetUnitMeasuresRes>({ url: ProductApi.UnitMeasures });
			const data = Array.isArray(res.data) ? res.data : [];
			const normalized: UnitMeasureInfo[] = data
				.filter((u) => validateUnitMeasure(u))
				.map((u) => ({
					id: Number(u.id),
					nombre: String(u.nombre),
					abreviatura: String(u.abreviatura),
					descripcion: String(u.descripcion),
					activo: Number(u.activo),
				}));
			unitMeasuresCache = normalized;
			unitMeasuresError = null;
			if (import.meta.env.DEV) console.debug("productService:getUnitMeasures -> fetched", normalized.length);
			return {
				success: Boolean((res as any).success ?? normalized.length > 0),
				data: normalized,
				message: String((res as any).message ?? "Unidades de medida obtenidas exitosamente"),
			} as GetUnitMeasuresRes;
		} catch (error: any) {
			unitMeasuresError = String(error?.message ?? "Error al obtener unidades de medida");
			if (import.meta.env.DEV) console.debug("productService:getUnitMeasures -> error", unitMeasuresError);
			return {
				success: false,
				data: [],
				message: unitMeasuresError,
			} as GetUnitMeasuresRes;
		} finally {
			unitMeasuresInFlight = null;
		}
	})();
	return unitMeasuresInFlight;
};

const clearUnitMeasuresCache = () => {
	unitMeasuresCache = null;
	unitMeasuresError = null;
	unitMeasuresInFlight = null;
	if (import.meta.env.DEV) console.debug("productService:clearUnitMeasuresCache");
};

export default {
	getProducts,
	updateProduct,
	createProduct,
	getUnitMeasures,
	clearUnitMeasuresCache,
};
