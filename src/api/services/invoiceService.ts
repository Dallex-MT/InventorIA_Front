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

export enum InvoiceApi {
	Invoices = "/facturas-internas",
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

export default {
	getInvoices,
};
