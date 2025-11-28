import type { ProductInfo } from "#/entity";
import invoiceService from "./invoiceService";
import productService from "./productService";

export interface ReportFilters {
	startDate?: string;
	endDate?: string;
	categoria_id?: number;
	estado?: "BORRADOR" | "CONFIRMADA" | "ANULADA";
}

export interface InventoryReport {
	products: ProductInfo[];
	totalValue: number;
	totalProducts: number;
	lowStockCount: number;
	criticalStockCount: number;
}

export interface ConsumptionReport {
	period: string;
	totalConsumed: number;
	products: Array<{
		product_id: number;
		product_name: string;
		quantity_consumed: number;
		unit: string;
	}>;
}

export interface FinancialReport {
	period: string;
	totalSpent: number;
	byCategory: Array<{
		category_id: number;
		category_name: string;
		total: number;
	}>;
	monthlyComparison?: Array<{
		month: string;
		total: number;
	}>;
}

export interface RotationReport {
	topHighRotation: Array<{
		product_id: number;
		product_name: string;
		rotation_rate: number;
		quantity_moved: number;
	}>;
	topLowRotation: Array<{
		product_id: number;
		product_name: string;
		rotation_rate: number;
		quantity_moved: number;
	}>;
	averageReplenishmentTime: number;
}

export interface ValuationReport {
	currentValue: number;
	historicalValues: Array<{
		date: string;
		value: number;
	}>;
	projectedValue?: number;
	trend: "up" | "down" | "stable";
}

/**
 * Obtiene el reporte de inventario actual
 */
export async function getInventoryReport(filters?: ReportFilters): Promise<InventoryReport> {
	try {
		const response = await productService.getProducts({
			page: 1,
			limit: 1000, // Obtener todos los productos
			categoria_id: filters?.categoria_id,
		});

		if (!response?.data?.products) {
			return {
				products: [],
				totalValue: 0,
				totalProducts: 0,
				lowStockCount: 0,
				criticalStockCount: 0,
			};
		}

		const products = response.data.products;
		let totalValue = 0;
		let lowStockCount = 0;
		let criticalStockCount = 0;

		for (const product of products) {
			const value = product.stock_actual * product.precio_referencia;
			totalValue += value;

			if (product.stock_actual <= product.stock_minimo * 0.5) {
				criticalStockCount++;
			} else if (product.stock_actual <= product.stock_minimo) {
				lowStockCount++;
			}
		}

		return {
			products,
			totalValue,
			totalProducts: products.length,
			lowStockCount,
			criticalStockCount,
		};
	} catch (error) {
		console.error("Error al obtener reporte de inventario:", error);
		throw error;
	}
}

/**
 * Obtiene el reporte histórico de consumo
 */
export async function getConsumptionReport(filters: ReportFilters): Promise<ConsumptionReport> {
	try {
		// Obtener facturas en el rango de fechas
		const invoicesResponse = await invoiceService.getInvoices({
			page: 1,
			limit: 1000,
			estado: filters.estado || "CONFIRMADA",
		});

		if (!invoicesResponse?.data?.invoices) {
			return {
				period: filters.startDate && filters.endDate ? `${filters.startDate} - ${filters.endDate}` : "Todos",
				totalConsumed: 0,
				products: [],
			};
		}

		// Filtrar por fecha si se proporciona
		let invoices = invoicesResponse.data.invoices;
		if (filters.startDate && filters.endDate) {
			invoices = invoices.filter((inv) => {
				const invDate = new Date(inv.fecha_movimiento);
				const start = new Date(filters.startDate || "");
				const end = new Date(filters.endDate || "");
				return invDate >= start && invDate <= end;
			});
		}

		// Obtener detalles de todas las facturas y calcular consumo
		const consumptionMap = new Map<number, { name: string; quantity: number; unit: string }>();

		for (const invoice of invoices) {
			try {
				const detailsResponse = await invoiceService.getInvoiceDetails(invoice.id);
				if (detailsResponse.success && detailsResponse.data) {
					// biome-ignore lint/complexity/noForEach: <explanation>
					detailsResponse.data.forEach((detail) => {
						const existing = consumptionMap.get(detail.producto_id);
						const quantity = Number.parseFloat(detail.cantidad);
						if (existing) {
							existing.quantity += quantity;
						} else {
							consumptionMap.set(detail.producto_id, {
								name: detail.producto_nombre,
								quantity,
								unit: detail.producto_unidad_medida || "",
							});
						}
					});
				}
			} catch (error) {
				console.error(`Error al obtener detalles de factura ${invoice.id}:`, error);
			}
		}

		const products = Array.from(consumptionMap.entries()).map(([product_id, data]) => ({
			product_id,
			product_name: data.name,
			quantity_consumed: data.quantity,
			unit: data.unit,
		}));

		const totalConsumed = products.reduce((sum, p) => sum + p.quantity_consumed, 0);

		return {
			period: filters.startDate && filters.endDate ? `${filters.startDate} - ${filters.endDate}` : "Todos",
			totalConsumed,
			products,
		};
	} catch (error) {
		console.error("Error al obtener reporte de consumo:", error);
		throw error;
	}
}

/**
 * Obtiene el reporte financiero
 */
export async function getFinancialReport(filters: ReportFilters): Promise<FinancialReport> {
	try {
		const invoicesResponse = await invoiceService.getInvoices({
			page: 1,
			limit: 1000,
			estado: filters.estado || "CONFIRMADA",
		});

		if (!invoicesResponse?.data?.invoices) {
			return {
				period: filters.startDate && filters.endDate ? `${filters.startDate} - ${filters.endDate}` : "Todos",
				totalSpent: 0,
				byCategory: [],
			};
		}

		// Filtrar por fecha
		let invoices = invoicesResponse.data.invoices;
		if (filters.startDate && filters.endDate) {
			invoices = invoices.filter((inv) => {
				const invDate = new Date(inv.fecha_movimiento);
				const start = new Date(filters.startDate || "");
				const end = new Date(filters.endDate || "");
				return invDate >= start && invDate <= end;
			});
		}

		// Calcular total gastado
		const totalSpent = invoices.reduce((sum, inv) => sum + inv.total, 0);

		// Agrupar por categoría (simplificado - en producción debería venir del backend)
		const byCategory: Array<{ category_id: number; category_name: string; total: number }> = [];
		// Nota: Esto es una aproximación. En producción, el backend debería proporcionar esta información

		// Comparación mensual
		const monthlyMap = new Map<string, number>();
		// biome-ignore lint/complexity/noForEach: <explanation>
		invoices.forEach((inv) => {
			const month = new Date(inv.fecha_movimiento).toLocaleDateString("es-ES", {
				year: "numeric",
				month: "short",
			});
			monthlyMap.set(month, (monthlyMap.get(month) || 0) + inv.total);
		});

		const monthlyComparison = Array.from(monthlyMap.entries())
			.map(([month, total]) => ({ month, total }))
			.sort((a, b) => a.month.localeCompare(b.month));

		return {
			period: filters.startDate && filters.endDate ? `${filters.startDate} - ${filters.endDate}` : "Todos",
			totalSpent,
			byCategory,
			monthlyComparison,
		};
	} catch (error) {
		console.error("Error al obtener reporte financiero:", error);
		throw error;
	}
}

/**
 * Obtiene el reporte de rotación
 */
export async function getRotationReport(filters?: ReportFilters): Promise<RotationReport> {
	try {
		// Obtener todas las facturas confirmadas
		const invoicesResponse = await invoiceService.getInvoices({
			page: 1,
			limit: 1000,
			estado: "CONFIRMADA",
		});

		if (!invoicesResponse?.data?.invoices) {
			return {
				topHighRotation: [],
				topLowRotation: [],
				averageReplenishmentTime: 0,
			};
		}

		// Filtrar por fecha si se proporciona
		let invoices = invoicesResponse.data.invoices;
		if (filters?.startDate && filters?.endDate) {
			invoices = invoices.filter((inv) => {
				const invDate = new Date(inv.fecha_movimiento);
				const start = new Date(filters.startDate || "");
				const end = new Date(filters.endDate || "");
				return invDate >= start && invDate <= end;
			});
		}

		// Calcular rotación por producto
		const rotationMap = new Map<number, { name: string; quantity: number; movements: number; lastMovement: Date }>();

		for (const invoice of invoices) {
			try {
				const detailsResponse = await invoiceService.getInvoiceDetails(invoice.id);
				if (detailsResponse.success && detailsResponse.data) {
					for (const detail of detailsResponse.data) {
						const existing = rotationMap.get(detail.producto_id);
						const quantity = Number.parseFloat(detail.cantidad);
						const movementDate = new Date(invoice.fecha_movimiento);

						if (existing) {
							existing.quantity += quantity;
							existing.movements++;
							if (movementDate > existing.lastMovement) {
								existing.lastMovement = movementDate;
							}
						} else {
							rotationMap.set(detail.producto_id, {
								name: detail.producto_nombre,
								quantity,
								movements: 1,
								lastMovement: movementDate,
							});
						}
					}
				}
			} catch (error) {
				console.error(`Error al obtener detalles de factura ${invoice.id}:`, error);
			}
		}

		// Calcular tasa de rotación (simplificada: cantidad movida / número de movimientos)
		const rotations = Array.from(rotationMap.entries()).map(([product_id, data]) => ({
			product_id,
			product_name: data.name,
			rotation_rate: data.quantity / data.movements,
			quantity_moved: data.quantity,
		}));

		// Ordenar y obtener top 10
		const sortedByRotation = [...rotations].sort((a, b) => b.rotation_rate - a.rotation_rate);
		const topHighRotation = sortedByRotation.slice(0, 10);
		const topLowRotation = sortedByRotation.slice(-10).reverse();

		// Calcular tiempo promedio de reposición (simplificado)
		const averageReplenishmentTime = 7; // Días - en producción debería calcularse del backend

		return {
			topHighRotation,
			topLowRotation,
			averageReplenishmentTime,
		};
	} catch (error) {
		console.error("Error al obtener reporte de rotación:", error);
		throw error;
	}
}

/**
 * Obtiene el reporte de valoración
 */
export async function getValuationReport(filters?: ReportFilters): Promise<ValuationReport> {
	try {
		const inventoryReport = await getInventoryReport(filters);
		const currentValue = inventoryReport.totalValue;

		// Obtener histórico de facturas para calcular valores históricos
		const invoicesResponse = await invoiceService.getInvoices({
			page: 1,
			limit: 1000,
			estado: "CONFIRMADA",
		});

		const historicalValues: Array<{ date: string; value: number }> = [];

		if (invoicesResponse?.data?.invoices) {
			// Agrupar por mes y calcular valor aproximado
			const monthlyValues = new Map<string, number>();
			// biome-ignore lint/complexity/noForEach: <explanation>
			invoicesResponse.data.invoices.forEach((inv) => {
				const month = new Date(inv.fecha_movimiento).toISOString().slice(0, 7); // YYYY-MM
				monthlyValues.set(month, (monthlyValues.get(month) || 0) + inv.total);
			});

			// Convertir a array y ordenar
			Array.from(monthlyValues.entries()).sort((a, b) => a[0].localeCompare(b[0]));
			for (const [date, value] of Array.from(monthlyValues.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
				historicalValues.push({ date, value });
			}
		}

		// Calcular tendencia
		let trend: "up" | "down" | "stable" = "stable";
		if (historicalValues.length >= 2) {
			const last = historicalValues[historicalValues.length - 1].value;
			const previous = historicalValues[historicalValues.length - 2].value;
			const diff = ((last - previous) / previous) * 100;
			if (diff > 5) trend = "up";
			else if (diff < -5) trend = "down";
		}

		// Proyección simple (promedio de últimos 3 meses)
		let projectedValue: number | undefined;
		if (historicalValues.length >= 3) {
			const lastThree = historicalValues.slice(-3);
			const avg = lastThree.reduce((sum, v) => sum + v.value, 0) / lastThree.length;
			projectedValue = avg;
		}

		return {
			currentValue,
			historicalValues,
			projectedValue,
			trend,
		};
	} catch (error) {
		console.error("Error al obtener reporte de valoración:", error);
		throw error;
	}
}

export default {
	getInventoryReport,
	getConsumptionReport,
	getFinancialReport,
	getRotationReport,
	getValuationReport,
};
