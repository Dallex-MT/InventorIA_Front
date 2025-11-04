import { Icon } from "@/components/icon";
import useLocale from "@/locales/use-locale";
import { usePathname, useRouter } from "@/routes/hooks";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import productService, { type QueryParams } from "@/api/services/productService";
import type { ProductInfo } from "#/entity";
import { useEffect, useState } from "react";

export default function ProductPage() {
	const { t } = useLocale();
	const { push } = useRouter();
	const pathname = usePathname();

	const [products, setProducts] = useState<ProductInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
	});
	const [activoFilter, setActivoFilter] = useState<boolean | undefined>(undefined);

	const fetchProducts = async (params: QueryParams) => {
		setLoading(true);
		setError(null);
		try {
			const response = await productService.getProducts(params);
			if (response?.data?.products && Array.isArray(response.data.products)) {
				setProducts(response.data.products);
				setPagination({
					current: response.data.page || params.page,
					pageSize: params.limit,
					total: response.data.total || 0,
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
		fetchProducts({ page: 1, limit: 10, active: activoFilter });
	}, [activoFilter]);

	const handleTableChange = (newPagination: TablePaginationConfig) => {
		fetchProducts({
			page: newPagination.current || 1,
			limit: newPagination.pageSize || pagination.pageSize,
			active: activoFilter,
		});
	};

	const columns: ColumnsType<ProductInfo> = [
		{
			title: t("sys.nav.inventory.product.name"),
			dataIndex: "nombre",
			width: 200,
		},
		{
			title: t("sys.nav.inventory.product.description"),
			dataIndex: "descripcion",
			width: 200,
			ellipsis: true,
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
							push(`${pathname}/${record.id}`);
						}}
					>
						<Icon icon="mdi:card-account-details" size={18} />
					</Button>
					<Button variant="ghost" size="icon" onClick={() => {}}>
						<Icon icon="solar:pen-bold-duotone" size={18} />
					</Button>
					<Button variant="ghost" size="icon">
						<Icon icon="mingcute:delete-2-fill" size={18} className="text-error!" />
					</Button>
				</div>
			),
		},
	];

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
				unidad_medida: String(p.unidad_medida),
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
					<div className="flex items-center gap-4">
						<Select
							value={activoFilter === undefined ? "todos" : activoFilter.toString()}
							onValueChange={(value) => {
								setActivoFilter(value === "todos" ? undefined : value === "true");
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
						<Button onClick={() => {}}>{t("sys.nav.inventory.product.new")}</Button>
						{error && (
							<div className="flex items-center gap-2">
								<Badge variant="error">Error: {error}</Badge>
								<Button
									variant="outline"
									size="sm"
									onClick={() => fetchProducts({ page: pagination.current, limit: pagination.pageSize, active: activoFilter })}
								>
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
			</CardContent>
		</Card>
	);
}
