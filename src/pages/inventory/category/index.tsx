import categoryService, { type QueryParams } from "@/api/services/categoryService";
import { Icon } from "@/components/icon";
import useLocale from "@/locales/use-locale";
import { usePathname, useRouter } from "@/routes/hooks";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useState } from "react";
import type { CategoryInfo } from "#/entity";

export default function CategoryPage() {
	const { t } = useLocale();
	const { push } = useRouter();
	const pathname = usePathname();

	const [categories, setCategories] = useState<CategoryInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
	});
	const [activoFilter, setActivoFilter] = useState<boolean | undefined>(undefined);

	const fetchCategories = async (params: QueryParams) => {
		setLoading(true);
		setError(null);
		try {
			const response = await categoryService.getCategories(params);
			if (response?.data?.categories && Array.isArray(response.data.categories)) {
				setCategories(response.data.categories);
				setPagination({
					current: response.data.page || params.page,
					pageSize: params.limit,
					total: response.data.total || 0,
				});
			} else {
				console.error("Estructura de respuesta inválida:", response);
				setError("La respuesta del servidor no tiene el formato esperado");
				setCategories([]);
				setPagination({ current: params.page, pageSize: params.limit, total: 0 });
			}
		} catch (e) {
			console.error("Error al obtener categorías:", e);
			setError(e instanceof Error ? e.message : "Error al cargar categorías");
			setCategories([]);
			setPagination({ current: params.page, pageSize: params.limit, total: 0 });
		} finally {
			setLoading(false);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: carga inicial y cambios de filtro
	useEffect(() => {
		fetchCategories({ page: 1, limit: 10, active: activoFilter });
	}, [activoFilter]);

	const handleTableChange = (newPagination: TablePaginationConfig) => {
		fetchCategories({
			page: newPagination.current || 1,
			limit: newPagination.pageSize || pagination.pageSize,
			active: activoFilter,
		});
	};

	const columns: ColumnsType<CategoryInfo> = [
		{
			title: t("sys.nav.inventory.category.name"),
			dataIndex: "nombre",
			width: 200,
		},
		{
			title: t("sys.nav.inventory.category.description"),
			dataIndex: "descripcion",
			width: 300,
			ellipsis: true,
		},
		{
			title: t("sys.nav.inventory.category.status.index"),
			dataIndex: "activo",
			align: "center",
			width: 120,
			render: (activo) => (
				<Badge variant={activo ? "success" : "error"}>
					{activo ? t("sys.nav.inventory.category.status.active") : t("sys.nav.inventory.category.status.inactive")}
				</Badge>
			),
		},
		{
			title: t("sys.nav.inventory.category.created_at"),
			dataIndex: "fecha_creacion",
			align: "center",
			width: 150,
			render: (fecha) => new Date(fecha).toLocaleDateString(),
		},
		{
			title: t("sys.nav.inventory.category.actions"),
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
	const validatedCategories = categories
		.map((c) => {
			if (!c || typeof c !== "object") return null;

			if (c.id === undefined || c.nombre === undefined || c.descripcion === undefined || c.activo === undefined) {
				console.warn("Categoría con datos incompletos:", c);
				return null;
			}

			const clean: CategoryInfo = {
				id: Number(c.id),
				nombre: String(c.nombre),
				descripcion: String(c.descripcion ?? ""),
				activo: Boolean(c.activo),
				fecha_creacion: String(c.fecha_creacion ?? ""),
				fecha_actualizacion: String((c as any).fecha_actualizacion ?? ""),
			} as CategoryInfo;

			if (Number.isNaN(clean.id)) {
				console.warn("Categoría con valores numéricos inválidos:", c);
				return null;
			}

			return clean;
		})
		.filter((x): x is CategoryInfo => x !== null);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>{t("sys.nav.inventory.category.title")}</div>
					<div className="flex items-center gap-4">
						<Select
							value={activoFilter === undefined ? "todos" : activoFilter.toString()}
							onValueChange={(value) => {
								setActivoFilter(value === "todos" ? undefined : value === "true");
							}}
						>
							<SelectTrigger className="w-40">
								<SelectValue placeholder={t("sys.nav.inventory.category.status.index") as string} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todos</SelectItem>
								<SelectItem value="true">{t("sys.nav.inventory.category.status.active")}</SelectItem>
								<SelectItem value="false">{t("sys.nav.inventory.category.status.inactive")}</SelectItem>
							</SelectContent>
						</Select>
						<Button onClick={() => {}}>{t("sys.nav.inventory.category.new")}</Button>
						{error && (
							<div className="flex items-center gap-2">
								<Badge variant="error">Error: {error}</Badge>
								<Button
									variant="outline"
									size="sm"
									onClick={() => fetchCategories({ page: pagination.current, limit: pagination.pageSize, active: activoFilter })}
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
					locale={{ emptyText: error ? "Error al cargar datos" : "No hay categorías disponibles" }}
					size="small"
					scroll={{ x: "max-content" }}
					pagination={{
						...pagination,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (total) => `Total ${total} categorías`,
					}}
					onChange={handleTableChange}
					columns={columns}
					dataSource={validatedCategories}
				/>
			</CardContent>
		</Card>
	);
}
