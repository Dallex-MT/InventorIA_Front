import categoryService from "@/api/services/categoryService";
import reportService, { type ReportFilters } from "@/api/services/reportService";
import { Chart, useChart } from "@/components/chart";
import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Calendar } from "@/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Label } from "@/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/tabs";
import { cn } from "@/utils";
import { type ExportColumn, exportToCSV, exportToExcel, exportToPDF } from "@/utils/export-utils";
import { fCurrency } from "@/utils/format-number";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { CalendarIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { CategoryInfo, ProductInfo } from "#/entity";

/**
 * Módulo completo de reportería de inventario
 * Incluye:
 * - Visualización de inventario actual
 * - Reporte histórico de consumo
 * - Análisis financiero
 * - Indicadores de rotación
 * - Valoración de inventario
 */
export default function ReportsPage() {
	// Estados de filtros
	const [startDate, setStartDate] = useState<Date | undefined>(() => {
		const date = new Date();
		date.setMonth(date.getMonth() - 1);
		return date;
	});
	const [endDate, setEndDate] = useState<Date | undefined>(new Date());
	const [categoriaFilter, setCategoriaFilter] = useState<number | undefined>(undefined);
	const [estadoFilter, setEstadoFilter] = useState<"BORRADOR" | "CONFIRMADA" | "ANULADA" | undefined>(undefined);

	// Estados de datos
	const [inventoryData, setInventoryData] = useState<{
		products: ProductInfo[];
		totalValue: number;
		totalProducts: number;
		lowStockCount: number;
		criticalStockCount: number;
	} | null>(null);
	const [consumptionData, setConsumptionData] = useState<{
		period: string;
		totalConsumed: number;
		products: Array<{
			product_id: number;
			product_name: string;
			quantity_consumed: number;
			unit: string;
		}>;
	} | null>(null);
	const [financialData, setFinancialData] = useState<{
		period: string;
		totalSpent: number;
		byCategory: Array<{ category_id: number; category_name: string; total: number }>;
		monthlyComparison?: Array<{ month: string; total: number }>;
	} | null>(null);
	const [rotationData, setRotationData] = useState<{
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
	} | null>(null);
	const [valuationData, setValuationData] = useState<{
		currentValue: number;
		historicalValues: Array<{ date: string; value: number }>;
		projectedValue?: number;
		trend: "up" | "down" | "stable";
	} | null>(null);

	// Estados de carga y errores
	const [loading, setLoading] = useState({
		inventory: false,
		consumption: false,
		financial: false,
		rotation: false,
		valuation: false,
	});
	const [error, setError] = useState<string | null>(null);
	const [categories, setCategories] = useState<CategoryInfo[]>([]);

	// Cargar categorías al montar
	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const res = await categoryService.getCategories({ page: 1, limit: 100 });
				if (res.success && res.data.categories) {
					setCategories(res.data.categories);
				}
			} catch (e) {
				console.error("Error al cargar categorías:", e);
			}
		};
		fetchCategories();
	}, []);

	// Preparar filtros
	const filters: ReportFilters = useMemo(
		() => ({
			startDate: startDate ? dayjs(startDate).format("YYYY-MM-DD") : undefined,
			endDate: endDate ? dayjs(endDate).format("YYYY-MM-DD") : undefined,
			categoria_id: categoriaFilter,
			estado: estadoFilter,
		}),
		[startDate, endDate, categoriaFilter, estadoFilter],
	);

	// Función para cargar todos los reportes
	const loadAllReports = useCallback(async () => {
		setError(null);
		setLoading({
			inventory: true,
			consumption: true,
			financial: true,
			rotation: true,
			valuation: true,
		});

		try {
			const [inventory, consumption, financial, rotation, valuation] = await Promise.all([
				reportService.getInventoryReport(filters).catch((e) => {
					console.error("Error en inventario:", e);
					return null;
				}),
				reportService.getConsumptionReport(filters).catch((e) => {
					console.error("Error en consumo:", e);
					return null;
				}),
				reportService.getFinancialReport(filters).catch((e) => {
					console.error("Error en financiero:", e);
					return null;
				}),
				reportService.getRotationReport(filters).catch((e) => {
					console.error("Error en rotación:", e);
					return null;
				}),
				reportService.getValuationReport(filters).catch((e) => {
					console.error("Error en valoración:", e);
					return null;
				}),
			]);

			if (inventory) setInventoryData(inventory);
			if (consumption) setConsumptionData(consumption);
			if (financial) setFinancialData(financial);
			if (rotation) setRotationData(rotation);
			if (valuation) setValuationData(valuation);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error al cargar reportes");
			toast.error("Error al cargar reportes");
		} finally {
			setLoading({
				inventory: false,
				consumption: false,
				financial: false,
				rotation: false,
				valuation: false,
			});
		}
	}, [filters]);

	// Cargar reportes al cambiar filtros
	useEffect(() => {
		loadAllReports();
	}, [loadAllReports]);

	// Funciones de exportación
	const handleExportInventory = (format: "pdf" | "excel" | "csv") => {
		if (!inventoryData) {
			toast.error("No hay datos para exportar");
			return;
		}

		const columns: ExportColumn[] = [
			{ title: "ID", dataIndex: "id" },
			{ title: "Nombre", dataIndex: "nombre" },
			{ title: "Categoría", dataIndex: "categoria_id" },
			{ title: "Stock Actual", dataIndex: "stock_actual" },
			{ title: "Stock Mínimo", dataIndex: "stock_minimo" },
			{ title: "Unidad", dataIndex: "unidad_medida" },
			{ title: "Precio Referencia", dataIndex: "precio_referencia", render: (v) => fCurrency(v) },
			{
				title: "Valor Total",
				dataIndex: "valor_total",
				render: (_, record) => fCurrency(record.stock_actual * record.precio_referencia),
			},
			{
				title: "Estado",
				dataIndex: "estado",
				render: (_, record) => {
					if (record.stock_actual <= record.stock_minimo * 0.5) return "Crítico";
					if (record.stock_actual <= record.stock_minimo) return "Bajo";
					return "Normal";
				},
			},
		];

		const data = inventoryData.products.map((p) => ({
			...p,
			valor_total: p.stock_actual * p.precio_referencia,
		}));

		if (format === "pdf") {
			exportToPDF({
				title: "Reporte de Inventario Actual",
				fileName: "inventario_actual",
				columns,
				data,
				subtitle: `Total: ${inventoryData.totalProducts} productos | Valor Total: ${fCurrency(inventoryData.totalValue)}`,
			});
		} else if (format === "excel") {
			exportToExcel({
				sheetName: "Inventario",
				fileName: "inventario_actual",
				data,
				columns,
			});
		} else {
			exportToCSV({
				fileName: "inventario_actual",
				data,
				columns,
			});
		}
	};

	const handleExportConsumption = (format: "pdf" | "excel" | "csv") => {
		if (!consumptionData) {
			toast.error("No hay datos para exportar");
			return;
		}

		const columns: ExportColumn[] = [
			{ title: "ID Producto", dataIndex: "product_id" },
			{ title: "Nombre", dataIndex: "product_name" },
			{ title: "Cantidad Consumida", dataIndex: "quantity_consumed" },
			{ title: "Unidad", dataIndex: "unit" },
		];

		if (format === "pdf") {
			exportToPDF({
				title: "Reporte Histórico de Consumo",
				fileName: "consumo_historico",
				columns,
				data: consumptionData.products,
				subtitle: `Período: ${consumptionData.period} | Total: ${consumptionData.totalConsumed.toFixed(2)}`,
			});
		} else if (format === "excel") {
			exportToExcel({
				sheetName: "Consumo",
				fileName: "consumo_historico",
				data: consumptionData.products,
				columns,
			});
		} else {
			exportToCSV({
				fileName: "consumo_historico",
				data: consumptionData.products,
				columns,
			});
		}
	};

	// Preparar datos para gráficos
	const consumptionChartData = useMemo(() => {
		if (!consumptionData) return null;
		const top10 = [...consumptionData.products].sort((a, b) => b.quantity_consumed - a.quantity_consumed).slice(0, 10);
		return {
			categories: top10.map((p) => p.product_name),
			series: top10.map((p) => p.quantity_consumed),
		};
	}, [consumptionData]);

	const financialChartData = useMemo(() => {
		if (!financialData?.monthlyComparison) return null;
		return {
			categories: financialData.monthlyComparison.map((m) => m.month),
			series: financialData.monthlyComparison.map((m) => m.total),
		};
	}, [financialData]);

	const valuationChartData = useMemo(() => {
		if (!valuationData) return null;
		return {
			categories: valuationData.historicalValues.map((v) => v.date),
			series: valuationData.historicalValues.map((v) => v.value),
		};
	}, [valuationData]);

	// Columnas de tablas
	const inventoryColumns: ColumnsType<ProductInfo & { valor_total: number; estado: string }> = [
		{ title: "ID", dataIndex: "id", width: 80 },
		{ title: "Nombre", dataIndex: "nombre", width: 200, ellipsis: true },
		{ title: "Stock Actual", dataIndex: "stock_actual", width: 120, align: "right" },
		{ title: "Stock Mínimo", dataIndex: "stock_minimo", width: 120, align: "right" },
		{ title: "Unidad", dataIndex: "unidad_medida", width: 100 },
		{
			title: "Precio Ref.",
			dataIndex: "precio_referencia",
			width: 120,
			align: "right",
			render: (v) => fCurrency(v),
		},
		{
			title: "Valor Total",
			dataIndex: "valor_total",
			width: 120,
			align: "right",
			render: (v) => fCurrency(v),
		},
		{
			title: "Estado",
			dataIndex: "estado",
			width: 100,
			align: "center",
			render: (estado) => {
				const variant = estado === "Crítico" ? "error" : estado === "Bajo" ? "warning" : "success";
				return <Badge variant={variant}>{estado}</Badge>;
			},
		},
	];

	return (
		<div className="space-y-6">
			{/* Filtros unificados */}
			<Card>
				<CardHeader>
					<CardTitle>Filtros de Reportes</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						{/* Rango de fechas - Inicio */}
						<div className="space-y-2">
							<Label>Fecha Inicio</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{startDate ? dayjs(startDate).format("DD/MM/YYYY") : "Seleccionar fecha"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
								</PopoverContent>
							</Popover>
						</div>

						{/* Rango de fechas - Fin */}
						<div className="space-y-2">
							<Label>Fecha Fin</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{endDate ? dayjs(endDate).format("DD/MM/YYYY") : "Seleccionar fecha"}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
								</PopoverContent>
							</Popover>
						</div>

						{/* Filtro por categoría */}
						<div className="space-y-2">
							<Label>Categoría</Label>
							<Select
								value={categoriaFilter === undefined ? "todos" : categoriaFilter.toString()}
								onValueChange={(value) => {
									setCategoriaFilter(value === "todos" ? undefined : Number(value));
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Todas las categorías" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todas las categorías</SelectItem>
									{categories.map((cat) => (
										<SelectItem key={cat.id} value={cat.id.toString()}>
											{cat.nombre}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Filtro por estado */}
						<div className="space-y-2">
							<Label>Estado Factura</Label>
							<Select
								value={estadoFilter === undefined ? "todos" : estadoFilter}
								onValueChange={(value) => {
									setEstadoFilter(value === "todos" ? undefined : (value as "BORRADOR" | "CONFIRMADA" | "ANULADA"));
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Todos los estados" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos los estados</SelectItem>
									<SelectItem value="CONFIRMADA">Confirmada</SelectItem>
									<SelectItem value="BORRADOR">Borrador</SelectItem>
									<SelectItem value="ANULADA">Anulada</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{error && (
						<div className="mt-4">
							<Badge variant="error">Error: {error}</Badge>
							<Button variant="outline" size="sm" className="ml-2" onClick={loadAllReports}>
								Reintentar
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Tabs con diferentes reportes */}
			<Tabs defaultValue="inventory" className="space-y-4">
				<TabsList className="grid w-full grid-cols-5">
					<TabsTrigger value="inventory">Inventario</TabsTrigger>
					<TabsTrigger value="consumption">Consumo</TabsTrigger>
					<TabsTrigger value="financial">Financiero</TabsTrigger>
					<TabsTrigger value="rotation">Rotación</TabsTrigger>
					<TabsTrigger value="valuation">Valoración</TabsTrigger>
				</TabsList>

				{/* Tab: Inventario Actual */}
				<TabsContent value="inventory" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Inventario Actual</CardTitle>
								<div className="flex gap-2">
									<Button variant="outline" size="sm" onClick={() => handleExportInventory("pdf")}>
										<Icon icon="mdi:file-pdf-box" className="mr-2" />
										PDF
									</Button>
									<Button variant="outline" size="sm" onClick={() => handleExportInventory("excel")}>
										<Icon icon="mdi:file-excel" className="mr-2" />
										Excel
									</Button>
									<Button variant="outline" size="sm" onClick={() => handleExportInventory("csv")}>
										<Icon icon="mdi:file-delimited" className="mr-2" />
										CSV
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{loading.inventory ? (
								<div className="text-center py-8">Cargando...</div>
							) : inventoryData ? (
								<>
									{/* Métricas de resumen */}
									<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
										<Card>
											<CardContent className="pt-6">
												<div className="text-2xl font-bold">{inventoryData.totalProducts}</div>
												<p className="text-xs text-muted-foreground">Total Productos</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className="pt-6">
												<div className="text-2xl font-bold">{fCurrency(inventoryData.totalValue)}</div>
												<p className="text-xs text-muted-foreground">Valor Total</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className="pt-6">
												<div className="text-2xl font-bold text-warning">{inventoryData.lowStockCount}</div>
												<p className="text-xs text-muted-foreground">Stock Bajo</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className="pt-6">
												<div className="text-2xl font-bold text-destructive">{inventoryData.criticalStockCount}</div>
												<p className="text-xs text-muted-foreground">Stock Crítico</p>
											</CardContent>
										</Card>
									</div>

									{/* Tabla de productos */}
									<Table
										rowKey="id"
										loading={loading.inventory}
										size="small"
										scroll={{ x: "max-content" }}
										columns={inventoryColumns}
										dataSource={inventoryData.products.map((p) => ({
											...p,
											valor_total: p.stock_actual * p.precio_referencia,
											estado: p.stock_actual <= p.stock_minimo * 0.5 ? "Crítico" : p.stock_actual <= p.stock_minimo ? "Bajo" : "Normal",
										}))}
										pagination={{ pageSize: 10, showSizeChanger: true }}
									/>
								</>
							) : (
								<div className="text-center py-8 text-muted-foreground">No hay datos disponibles</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab: Consumo Histórico */}
				<TabsContent value="consumption" className="space-y-4">
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle>Reporte Histórico de Consumo</CardTitle>
								<div className="flex gap-2">
									<Button variant="outline" size="sm" onClick={() => handleExportConsumption("pdf")}>
										<Icon icon="mdi:file-pdf-box" className="mr-2" />
										PDF
									</Button>
									<Button variant="outline" size="sm" onClick={() => handleExportConsumption("excel")}>
										<Icon icon="mdi:file-excel" className="mr-2" />
										Excel
									</Button>
									<Button variant="outline" size="sm" onClick={() => handleExportConsumption("csv")}>
										<Icon icon="mdi:file-delimited" className="mr-2" />
										CSV
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							{loading.consumption ? (
								<div className="text-center py-8">Cargando...</div>
							) : consumptionData ? (
								<>
									<div className="mb-6">
										<p className="text-sm text-muted-foreground">Período: {consumptionData.period}</p>
										<p className="text-lg font-semibold">Total Consumido: {consumptionData.totalConsumed.toFixed(2)}</p>
									</div>

									{/* Gráfico de tendencia */}
									{consumptionChartData && (
										<Card className="mb-6">
											<CardHeader>
												<CardTitle>Top 10 Productos Más Consumidos</CardTitle>
											</CardHeader>
											<CardContent>
												<ConsumptionChart categories={consumptionChartData.categories} series={consumptionChartData.series} />
											</CardContent>
										</Card>
									)}

									{/* Tabla de consumo */}
									<Table
										rowKey="product_id"
										loading={loading.consumption}
										size="small"
										scroll={{ x: "max-content" }}
										columns={[
											{ title: "ID", dataIndex: "product_id", width: 100 },
											{ title: "Producto", dataIndex: "product_name", width: 200 },
											{
												title: "Cantidad Consumida",
												dataIndex: "quantity_consumed",
												width: 150,
												align: "right",
												render: (v) => v.toFixed(2),
											},
											{ title: "Unidad", dataIndex: "unit", width: 100 },
										]}
										dataSource={consumptionData.products}
										pagination={{ pageSize: 10, showSizeChanger: true }}
									/>
								</>
							) : (
								<div className="text-center py-8 text-muted-foreground">No hay datos disponibles</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab: Análisis Financiero */}
				<TabsContent value="financial" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Análisis Financiero</CardTitle>
						</CardHeader>
						<CardContent>
							{loading.financial ? (
								<div className="text-center py-8">Cargando...</div>
							) : financialData ? (
								<>
									<div className="mb-6">
										<p className="text-sm text-muted-foreground">Período: {financialData.period}</p>
										<p className="text-2xl font-bold">{fCurrency(financialData.totalSpent)}</p>
										<p className="text-sm text-muted-foreground">Gasto Total</p>
									</div>

									{/* Gráfico comparativo mensual */}
									{financialChartData && (
										<Card className="mb-6">
											<CardHeader>
												<CardTitle>Comparativo Mensual</CardTitle>
											</CardHeader>
											<CardContent>
												<FinancialChart categories={financialChartData.categories} series={financialChartData.series} />
											</CardContent>
										</Card>
									)}
								</>
							) : (
								<div className="text-center py-8 text-muted-foreground">No hay datos disponibles</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab: Indicadores de Rotación */}
				<TabsContent value="rotation" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Indicadores de Rotación</CardTitle>
						</CardHeader>
						<CardContent>
							{loading.rotation ? (
								<div className="text-center py-8">Cargando...</div>
							) : rotationData ? (
								<>
									<div className="mb-6">
										<p className="text-sm text-muted-foreground">Tiempo Promedio de Reposición: {rotationData.averageReplenishmentTime} días</p>
									</div>

									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										{/* Top 10 Mayor Rotación */}
										<Card>
											<CardHeader>
												<CardTitle>Top 10 Mayor Rotación</CardTitle>
											</CardHeader>
											<CardContent>
												<Table
													rowKey="product_id"
													size="small"
													columns={[
														{ title: "Producto", dataIndex: "product_name", ellipsis: true },
														{
															title: "Tasa Rotación",
															dataIndex: "rotation_rate",
															align: "right",
															render: (v) => v.toFixed(2),
														},
														{
															title: "Cantidad Movida",
															dataIndex: "quantity_moved",
															align: "right",
															render: (v) => v.toFixed(2),
														},
													]}
													dataSource={rotationData.topHighRotation}
													pagination={false}
												/>
											</CardContent>
										</Card>

										{/* Top 10 Menor Rotación */}
										<Card>
											<CardHeader>
												<CardTitle>Top 10 Menor Rotación</CardTitle>
											</CardHeader>
											<CardContent>
												<Table
													rowKey="product_id"
													size="small"
													columns={[
														{ title: "Producto", dataIndex: "product_name", ellipsis: true },
														{
															title: "Tasa Rotación",
															dataIndex: "rotation_rate",
															align: "right",
															render: (v) => v.toFixed(2),
														},
														{
															title: "Cantidad Movida",
															dataIndex: "quantity_moved",
															align: "right",
															render: (v) => v.toFixed(2),
														},
													]}
													dataSource={rotationData.topLowRotation}
													pagination={false}
												/>
											</CardContent>
										</Card>
									</div>
								</>
							) : (
								<div className="text-center py-8 text-muted-foreground">No hay datos disponibles</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Tab: Valoración de Inventario */}
				<TabsContent value="valuation" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Valoración de Inventario</CardTitle>
						</CardHeader>
						<CardContent>
							{loading.valuation ? (
								<div className="text-center py-8">Cargando...</div>
							) : valuationData ? (
								<>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
										<Card>
											<CardContent className="pt-6">
												<div className="text-2xl font-bold">{fCurrency(valuationData.currentValue)}</div>
												<p className="text-xs text-muted-foreground">Valor Actual</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className="pt-6">
												<div className="text-2xl font-bold">{valuationData.projectedValue ? fCurrency(valuationData.projectedValue) : "N/A"}</div>
												<p className="text-xs text-muted-foreground">Proyección</p>
											</CardContent>
										</Card>
										<Card>
											<CardContent className="pt-6">
												<div className="text-2xl font-bold">
													<Badge variant={valuationData.trend === "up" ? "success" : valuationData.trend === "down" ? "error" : "default"}>
														{valuationData.trend === "up" ? "↑ Subiendo" : valuationData.trend === "down" ? "↓ Bajando" : "→ Estable"}
													</Badge>
												</div>
												<p className="text-xs text-muted-foreground">Tendencia</p>
											</CardContent>
										</Card>
									</div>

									{/* Gráfico de evolución histórica */}
									{valuationChartData && (
										<Card>
											<CardHeader>
												<CardTitle>Evolución Histórica del Valor</CardTitle>
											</CardHeader>
											<CardContent>
												<ValuationChart categories={valuationChartData.categories} series={valuationChartData.series} />
											</CardContent>
										</Card>
									)}
								</>
							) : (
								<div className="text-center py-8 text-muted-foreground">No hay datos disponibles</div>
							)}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}

// Componente de gráfico de consumo
function ConsumptionChart({ categories, series }: { categories: string[]; series: number[] }) {
	const chartOptions = useChart({
		chart: { type: "bar" },
		xaxis: { categories },
		tooltip: {
			y: {
				formatter: (value: number) => `${value.toFixed(2)} unidades`,
			},
		},
		plotOptions: {
			bar: {
				horizontal: true,
				barHeight: "70%",
			},
		},
	});

	return <Chart type="bar" series={[{ name: "Consumo", data: series }]} options={chartOptions} height={400} />;
}

// Componente de gráfico financiero
function FinancialChart({ categories, series }: { categories: string[]; series: number[] }) {
	const chartOptions = useChart({
		chart: { type: "bar" },
		xaxis: { categories },
		tooltip: {
			y: {
				formatter: (value: number) => fCurrency(value),
			},
		},
	});

	return <Chart type="bar" series={[{ name: "Gasto", data: series }]} options={chartOptions} height={320} />;
}

// Componente de gráfico de valoración
function ValuationChart({ categories, series }: { categories: string[]; series: number[] }) {
	const chartOptions = useChart({
		chart: { type: "area" },
		xaxis: { categories },
		tooltip: {
			y: {
				formatter: (value: number) => fCurrency(value),
			},
		},
		stroke: {
			curve: "smooth",
		},
		fill: {
			type: "gradient",
			gradient: {
				shadeIntensity: 1,
				opacityFrom: 0.7,
				opacityTo: 0.3,
			},
		},
	});

	return <Chart type="area" series={[{ name: "Valor", data: series }]} options={chartOptions} height={320} />;
}
