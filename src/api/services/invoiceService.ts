import apiClient from "../apiClient";

import type { InvoiceInfo } from "#/entity";

export interface QueryParams {
	page: number;
	limit: number;
	estado?: "BORRADOR" | "CONFIRMADA" | "ANULADA";
}

export interface PaginatedInvoicesRes {
	success: boolean;
	message: string;
	data: {
		invoices: InvoiceInfo[];
		total: number;
		page: number;
		totalPages: number;
	};
}

// Tipos para detalles de factura (respuesta del endpoint /detalles-factura/factura/{id})
export interface InvoiceDetailItem {
	id: number;
	factura_id: number;
	producto_id: number;
	cantidad: string;
	precio_unitario: string;
	subtotal: string;
	producto_nombre: string;
	producto_unidad_medida?: string;
}

export interface InvoiceDetailsRes {
	success: boolean;
	data?: InvoiceDetailItem[];
	message?: string;
}

export enum InvoiceApi {
	Invoices = "/facturas-internas",
	InvoiceDetailsByInvoice = "/detalles-factura/factura",
	ProcessInvoiceImage = "/images/process",
}

const getInvoices = (params?: QueryParams) => {
	const queryParams = params ? new URLSearchParams() : undefined;
	if (params) {
		queryParams?.append("page", params.page.toString());
		queryParams?.append("limit", params.limit.toString());
		if (params.estado) {
			queryParams?.append("estado", params.estado);
		}
	}

	return apiClient.get<PaginatedInvoicesRes>({
		url: InvoiceApi.Invoices,
		params: queryParams,
	});
};

// Obtener detalles de una factura interna por ID de factura
const getInvoiceDetails = (invoiceId: number) => {
	// Construir URL: /detalles-factura/factura/{id}
	const url = `${InvoiceApi.InvoiceDetailsByInvoice}/${invoiceId}`;
	return apiClient.get<InvoiceDetailsRes>({ url });
};

// Actualizar una factura interna
interface UpdateInvoiceData {
	codigo_interno: string;
	concepto: string;
	fecha_movimiento: string;
	observaciones?: string;
	estado: "BORRADOR" | "CONFIRMADA" | "ANULADA";
}

interface UpdateInvoiceRes {
	success: boolean;
	message: string;
	data?: InvoiceInfo;
}

const updateInvoice = (invoiceId: number, data: UpdateInvoiceData) => {
	const url = `${InvoiceApi.Invoices}/${invoiceId}`;
	return apiClient.put<UpdateInvoiceRes>({ url, data });
};

export interface InvoiceImageProcessProduct {
	id_producto?: number;
	nombre?: string;
	unidad_medida?: string;
	producto_nombre?: string;
	producto_unidad_medida?: string;
	cantidad: number;
	precio_unitario: number;
}

export interface InvoiceImageProcessData {
	codigo_interno: string;
	concepto: string;
	fecha_movimiento: string;
	total: number;
	observaciones: string;
	productos: InvoiceImageProcessProduct[];
}

export interface ProcessInvoiceImageRes {
	success: boolean;
	data?: InvoiceImageProcessData;
	message: string;
}

const processInvoiceImage = (image: File) => {
	const formData = new FormData();
	formData.append("image", image);
	return apiClient.post<ProcessInvoiceImageRes>({
		url: InvoiceApi.ProcessInvoiceImage,
		data: formData,
		headers: { "Content-Type": "multipart/form-data" },
	});
};

export interface CreateInvoiceFromProcessReq extends InvoiceImageProcessData {}

export interface CreateInvoiceFromProcessRes {
	success: boolean;
	message: string;
	data?: InvoiceInfo;
}

const createInvoiceFromProcess = (payload: CreateInvoiceFromProcessReq) => {
	return apiClient.post<CreateInvoiceFromProcessRes>({
		url: InvoiceApi.Invoices,
		data: payload,
		headers: { "Content-Type": "application/json" },
	});
};

export interface UpdateInvoiceFullReq extends InvoiceImageProcessData {}

export interface UpdateInvoiceFullRes {
	success: boolean;
	message: string;
	data?: InvoiceInfo;
}

const updateInvoiceFull = (invoiceId: number, payload: UpdateInvoiceFullReq) => {
	return apiClient.put<UpdateInvoiceFullRes>({
		url: `${InvoiceApi.Invoices}/${invoiceId}`,
		data: payload,
		headers: { "Content-Type": "application/json" },
	});
};

export default {
	getInvoices,
	getInvoiceDetails,
	updateInvoice,
	processInvoiceImage,
	createInvoiceFromProcess,
	updateInvoiceFull,
};
