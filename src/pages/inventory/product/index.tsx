import categoryService from "@/api/services/categoryService";
import productService, { type QueryParams } from "@/api/services/productService";
import { Icon } from "@/components/icon";
import useLocale from "@/locales/use-locale";
import { usePermissionFlags } from "@/store/userStore";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Input, Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ProductInfo } from "#/entity";
import { type ProductEditFormValues, ProductEditModal } from "./product-modal";

export default function ProductPage() {
	const { t } = useLocale();
	const { isReadOnly, canWrite } = usePermissionFlags();

	const [products, setProducts] = useState<ProductInfo[]>([]);
	const [categories, setCategories] = useState<{ id: number; label: string }[]>([]);
	const [loading, setLoading] = useState(false);
	const [categoriesLoading, setCategoriesLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
	});
	const [activoFilter, setActivoFilter] = useState<boolean | undefined>(isReadOnly ? true : undefined);
	const [searchText, setSearchText] = useState("");
	const [unidadMedidaFilter, setUnidadMedidaFilter] = useState<string | undefined>(undefined);
	const [categoriaFilter, setCategoriaFilter] = useState<number | undefined>(undefined);
	const searchTimeoutRef = useRef<number | null>(null);

	const getFilterParams = () => {
		const filters: Partial<QueryParams> = {};
		if (activoFilter !== undefined) {
			filters.active = activoFilter;
		}
		if (searchText.trim().length > 0) {
			filters.search = searchText.trim();
		}
		if (unidadMedidaFilter && unidadMedidaFilter.trim().length > 0) {
			filters.unidad_medida = unidadMedidaFilter.trim();
		}
		if (categoriaFilter !== undefined && categoriaFilter !== null) {
			filters.categoria_id = Number(categoriaFilter);
		}
		return filters;
	};

	const applyFilters = (page = 1, limit = pagination.pageSize) => {
		const filters = getFilterParams();
		fetchProducts({ page, limit, ...filters });
	};

	// Estados para edición de producto
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingProduct, setEditingProduct] = useState<ProductInfo | null>(null);
	const [editLoading, setEditLoading] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);

	const fetchCategories = async () => {
		setCategoriesLoading(true);
		try {
			const res = await categoryService.getCategories({ page: 1, limit: 100 }); // Asumimos hasta 100 categorías
			if (res.success && res.data.categories) {
				setCategories(res.data.categories.map((c) => ({ id: c.id, label: c.nombre })));
			} else {
				toast.error("Error al cargar categorías");
			}
		} catch (e) {
			console.error(e);
			toast.error("Error al cargar categorías");
		} finally {
			setCategoriesLoading(false);
		}
	};

	const fetchProducts = async (params: QueryParams) => {
		setLoading(true);
		setError(null);
		try {
			const response = await productService.getProducts(params);
			if (response?.data?.products && Array.isArray(response.data.products)) {
				setProducts(response.data.products);
				setPagination({
					current: response.data.pagination.current || params.page,
					pageSize: params.limit,
					total: response.data.pagination.total || 0,
				});
			} else {
				console.error("Estructura de respuesta inválida:", response);
				setError("La respuesta del servidor no tiene el formato esperado");
				setProducts([]);
				setPagination({ current: params.page, pageSize: params.limit, total: 0 });
			}
		} catch (e) {
			console.error("Error al obtener productos:", e);
			setError(e instanceof Error ? e.message : "Error al cargar productos");
			setProducts([]);
			setPagination({ current: params.page, pageSize: params.limit, total: 0 });
		} finally {
			setLoading(false);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: carga inicial y cambios de filtro
	useEffect(() => {
		applyFilters(1, 10);
		fetchCategories();
	}, [activoFilter, unidadMedidaFilter, categoriaFilter]);

	const triggerSearch = () => {
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}
		searchTimeoutRef.current = window.setTimeout(() => {
			applyFilters(1, pagination.pageSize);
		}, 300);
	};

	const handleTableChange = (newPagination: TablePaginationConfig) => {
		applyFilters(newPagination.current || 1, newPagination.pageSize || pagination.pageSize);
	};

	const baseColumns: ColumnsType<ProductInfo> = [
		{
			title: t("sys.nav.inventory.product.name"),
			dataIndex: "nombre",
			width: 200,
		},
		{
			title: t("sys.nav.inventory.product.description"),
			dataIndex: "descripcion",
			width: 200,
			render: (text: string) => {
				const maxLength = 75;
				if (text.length > maxLength) {
					return `${text.substring(0, maxLength)}...`;
				}
				return text;
			},
		},
		{
			title: t("sys.nav.inventory.product.stock.current"),
			dataIndex: "stock_actual",
			align: "right",
			width: 120,
			render: (stock) => stock.toFixed(4),
		},
		{
			title: t("sys.nav.inventory.product.stock.minimum"),
			dataIndex: "stock_minimo",
			align: "right",
			width: 120,
			render: (stock) => stock.toFixed(4),
		},
		{
			title: t("sys.nav.inventory.product.ref_price"),
			dataIndex: "precio_referencia",
			align: "right",
			width: 120,
			render: (precio) => precio.toFixed(2),
		},
		{
			title: t("sys.nav.inventory.product.unit"),
			dataIndex: "unidad_medida",
			align: "center",
			width: 100,
			render: (u: ProductInfo["unidad_medida"]) => (u?.abreviatura || u?.nombre || "-").toString(),
		},
		{
			title: t("sys.nav.inventory.product.status.index"),
			dataIndex: "activo",
			align: "center",
			width: 100,
			render: (activo) => (
				<Badge variant={activo ? "success" : "error"}>
					{activo ? t("sys.nav.inventory.product.status.active") : t("sys.nav.inventory.product.status.inactive")}
				</Badge>
			),
		},
	];
	const columns: ColumnsType<ProductInfo> = canWrite
		? [
				...baseColumns,
				{
					title: t("sys.nav.inventory.product.actions"),
					key: "operation",
					align: "center",
					width: 120,
					render: (_, record) => (
						<div className="flex w-full justify-center text-gray-500">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									setEditingProduct(record);
									setEditError(null);
									setIsEditModalOpen(true);
								}}
							>
								<Icon icon="solar:pen-bold-duotone" size={18} />
							</Button>
						</div>
					),
				},
			]
		: baseColumns;

	// Validar y normalizar datos recibidos del backend
	const validatedProducts = products
		.map((p) => {
			if (!p || typeof p !== "object") return null;

			if (
				p.id === undefined ||
				p.nombre === undefined ||
				p.descripcion === undefined ||
				p.categoria_id === undefined ||
				p.unidad_medida === undefined ||
				p.stock_actual === undefined ||
				p.stock_minimo === undefined ||
				p.precio_referencia === undefined ||
				p.activo === undefined
			) {
				console.warn("Producto con datos incompletos:", p);
				return null;
			}

			const clean: ProductInfo = {
				id: Number(p.id),
				nombre: String(p.nombre),
				descripcion: String(p.descripcion ?? ""),
				categoria_id: Number(p.categoria_id),
				unidad_medida: {
					id: Number((p as any).unidad_medida?.id ?? 0),
					nombre: String((p as any).unidad_medida?.nombre ?? ""),
					abreviatura: String((p as any).unidad_medida?.abreviatura ?? ""),
					activo: Number((p as any).unidad_medida?.activo ?? 1),
				},
				stock_actual: Number(p.stock_actual),
				stock_minimo: Number(p.stock_minimo),
				precio_referencia: Number(p.precio_referencia),
				activo: Boolean(p.activo),
				fecha_creacion: String(p.fecha_creacion ?? ""),
				fecha_actualizacion: String(p.fecha_actualizacion ?? ""),
			};

			if (
				Number.isNaN(clean.id) ||
				Number.isNaN(clean.categoria_id) ||
				Number.isNaN(clean.stock_actual) ||
				Number.isNaN(clean.stock_minimo) ||
				Number.isNaN(clean.precio_referencia)
			) {
				console.warn("Producto con valores numéricos inválidos:", p);
				return null;
			}

			return clean;
		})
		.filter((x): x is ProductInfo => x !== null);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>{t("sys.nav.inventory.product.title")}</div>
					<div className="flex flex-wrap items-center gap-4">
						<div className="hidden md:block w-72">
							<Input
								placeholder="Buscar por nombre o descripción"
								value={searchText}
								onChange={(e) => {
									const value = e.target.value;
									setSearchText(value);
									if (value.trim().length === 0) {
										if (searchTimeoutRef.current) {
											clearTimeout(searchTimeoutRef.current);
										}
										applyFilters(1, pagination.pageSize);
									}
								}}
								onPressEnter={triggerSearch}
								aria-label="Buscar por nombre o descripción"
								allowClear
								addonAfter={
									<button
										type="button"
										aria-label="Buscar"
										onClick={triggerSearch}
										tabIndex={0}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												triggerSearch();
											}
										}}
										className="inline-flex items-center px-2 h-full cursor-pointer text-muted-foreground hover:text-primary"
									>
										<Icon icon="solar:rounded-magnifer-bold" />
									</button>
								}
							/>
						</div>

						<div className="flex flex-col gap-1">
							<div className="text-xs font-medium text-muted-foreground">Unidad de medida</div>
							<Select
								value={unidadMedidaFilter ?? "todos"}
								onValueChange={(value) => {
									setUnidadMedidaFilter(value === "todos" ? undefined : value);
									applyFilters(1, pagination.pageSize);
								}}
							>
								<SelectTrigger className="w-44">
									<SelectValue placeholder={"Unidad de medida"} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos</SelectItem>
									<SelectItem value="und">UNIDAD</SelectItem>
									<SelectItem value="kg">KG</SelectItem>
									<SelectItem value="lb">Libra</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="flex flex-col gap-1">
							<div className="text-xs font-medium text-muted-foreground">Categoría</div>
							<Select
								value={categoriaFilter === undefined ? "todos" : String(categoriaFilter)}
								onValueChange={(value) => {
									setCategoriaFilter(value === "todos" ? undefined : Number(value));
									applyFilters(1, pagination.pageSize);
								}}
								disabled={categoriesLoading}
							>
								<SelectTrigger className="w-52">
									<SelectValue placeholder={"Categoría"} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">Todos</SelectItem>
									{categories.map((c) => (
										<SelectItem key={c.id} value={String(c.id)}>
											{c.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						{!isReadOnly && (
							<div className="flex flex-col gap-1">
								<div className="text-xs font-medium text-muted-foreground">Estado</div>
								<Select
									value={activoFilter === undefined ? "todos" : activoFilter.toString()}
									onValueChange={(value) => {
										setActivoFilter(value === "todos" ? undefined : value === "true");
										applyFilters(1, pagination.pageSize);
									}}
								>
									<SelectTrigger className="w-40">
										<SelectValue placeholder={t("sys.nav.inventory.product.status.index") as string} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="todos">Todos</SelectItem>
										<SelectItem value="true">{t("sys.nav.inventory.product.status.active")}</SelectItem>
										<SelectItem value="false">{t("sys.nav.inventory.product.status.inactive")}</SelectItem>
									</SelectContent>
								</Select>
							</div>
						)}
						{!isReadOnly && (
							<Button
								onClick={() => {
									// Abrir modal en modo creación
									setEditingProduct(null);
									setEditError(null);
									setIsEditModalOpen(true);
								}}
							>
								{t("sys.nav.inventory.product.new")}
							</Button>
						)}
						{error && (
							<div className="flex items-center gap-2">
								<Badge variant="error">Error: {error}</Badge>
								<Button variant="outline" size="sm" onClick={() => applyFilters(pagination.current, pagination.pageSize)}>
									Reintentar
								</Button>
							</div>
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<Table
					rowKey="id"
					loading={loading}
					locale={{ emptyText: error ? "Error al cargar datos" : "No hay productos disponibles" }}
					size="small"
					scroll={{ x: "max-content" }}
					pagination={{
						...pagination,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (total) => `Total ${total} productos`,
					}}
					onChange={handleTableChange}
					columns={columns}
					dataSource={validatedProducts}
				/>
				{/* Modal de edición/creación de producto */}
				<ProductEditModal
					open={isEditModalOpen}
					title={(editingProduct ? t("sys.nav.inventory.product.edit") : t("sys.nav.inventory.product.new")) as string}
					categorias={categories}
					categoriesLoading={categoriesLoading}
					initialValue={{
						nombre: editingProduct?.nombre ?? "",
						descripcion: editingProduct?.descripcion ?? "",
						categoria_id: Number(editingProduct?.categoria_id ?? 0),
						unidad_medida_id: Number(editingProduct?.unidad_medida?.id ?? 0),
						stock_actual: Number(editingProduct?.stock_actual ?? 0),
						stock_minimo: Number(editingProduct?.stock_minimo ?? 0),
						precio_referencia: Number(editingProduct?.precio_referencia ?? 0),
						activo: Boolean(editingProduct?.activo ?? true),
					}}
					isCreate={!editingProduct}
					loading={editLoading}
					error={editError}
					onCancel={() => {
						setIsEditModalOpen(false);
						setEditingProduct(null);
						setEditError(null);
					}}
					onSubmit={async (values: ProductEditFormValues) => {
						setEditLoading(true);
						setEditError(null);
						try {
							if (!editingProduct) {
								// Crear nuevo producto
								const res = await productService.createProduct({
									nombre: values.nombre,
									descripcion: values.descripcion,
									categoria_id: values.categoria_id,
									unidad_medida_id: values.unidad_medida_id,
									stock_actual: values.stock_actual,
									stock_minimo: values.stock_minimo,
									precio_referencia: values.precio_referencia,
									activo: values.activo,
								});
								if (res.success) {
									toast.success(res.message || "Producto creado exitosamente");
									setIsEditModalOpen(false);
									setEditingProduct(null);
									await fetchProducts({ page: pagination.current, limit: pagination.pageSize, active: activoFilter });
								} else {
									setEditError(res.message || "Error al crear producto");
									toast.error(res.message || "Error al crear producto");
								}
							} else {
								// Editar producto existente
								const res = await productService.updateProduct({
									productId: Number(editingProduct.id),
									nombre: values.nombre,
									descripcion: values.descripcion,
									categoria_id: values.categoria_id,
									unidad_medida_id: values.unidad_medida_id,
									stock_actual: values.stock_actual,
									stock_minimo: values.stock_minimo,
									precio_referencia: values.precio_referencia,
									activo: values.activo,
								});
								if (res.success) {
									toast.success(res.message || "Producto actualizado exitosamente");
									setIsEditModalOpen(false);
									setEditingProduct(null);
									await fetchProducts({ page: pagination.current, limit: pagination.pageSize, active: activoFilter });
								} else {
									setEditError(res.message || "Error al actualizar producto");
									toast.error(res.message || "Error al actualizar producto");
								}
							}
						} catch (e: any) {
							console.error(e);
							setEditError(e?.message || (editingProduct ? "Error al actualizar producto" : "Error al crear producto"));
							toast.error(e?.message || (editingProduct ? "Error al actualizar producto" : "Error al crear producto"));
						} finally {
							setEditLoading(false);
						}
					}}
				/>
			</CardContent>
		</Card>
	);
}
