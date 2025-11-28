import roleService, { type QueryParams } from "@/api/services/roleService";
import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Role, Role_Old } from "#/entity";
import { RoleModal, type RoleModalProps } from "./role-modal";

// Datos se cargan desde el servicio; se elimina el mock local

const DEFAULT_ROLE_VALUE: Role = {
	id: 0,
	nombre: "",
	descripcion: "",
	activo: true,
	fecha_creacion: new Date().toISOString(),
	fecha_actualizacion: new Date().toISOString(),
};
export default function RolePage() {
	const { t } = useTranslation();
	const [roles, setRoles] = useState<Role[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
	});
	const [activoFilter, setActivoFilter] = useState<boolean | undefined>(undefined);
	const [roleModalProps, setRoleModalProps] = useState<RoleModalProps>({
		formValue: { ...DEFAULT_ROLE_VALUE },
		title: "Nuevo",
		show: false,
		onOk: () => {
			setRoleModalProps((prev) => ({ ...prev, show: false }));
		},
		onCancel: () => {
			setRoleModalProps((prev) => ({ ...prev, show: false }));
		},
	});

	const fetchRoles = async (params: QueryParams) => {
		setLoading(true);
		setError(null);
		try {
			const response = await roleService.getRoles(params);
			if (response?.data?.roles && Array.isArray(response.data.roles)) {
				setRoles(response.data.roles);
				setPagination({
					current: response.data.page || params.page,
					pageSize: params.limit,
					total: response.data.total || 0,
				});
			} else {
				console.error("Estructura de respuesta inválida:", response);
				setError("La respuesta del servidor no tiene el formato esperado");
				setRoles([]);
				setPagination({ current: params.page, pageSize: params.limit, total: 0 });
			}
		} catch (e) {
			console.error("Error al obtener roles:", e);
			setError(e instanceof Error ? e.message : "Error al cargar roles");
			setRoles([]);
			setPagination({ current: params.page, pageSize: params.limit, total: 0 });
		} finally {
			setLoading(false);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: carga inicial y cambios de filtro
	useEffect(() => {
		fetchRoles({ page: 1, limit: 10, active: activoFilter });
	}, [activoFilter]);

	const handleTableChange = (newPagination: TablePaginationConfig) => {
		fetchRoles({
			page: newPagination.current || 1,
			limit: newPagination.pageSize || pagination.pageSize,
			active: activoFilter,
		});
	};
	const columns: ColumnsType<Role> = [
		{
			title: t("sys.nav.system.role.name"),
			dataIndex: "nombre",
			width: 120,
		},
		{
			title: t("sys.nav.system.role.description"),
			dataIndex: "descripcion",
			ellipsis: true,
		},
		{
			title: t("sys.nav.system.role.status"),
			dataIndex: "activo",
			align: "center",
			width: 95,
			render: (activo) => <Badge variant={activo ? "success" : "error"}>{activo ? t("sys.nav.system.role.active") : t("sys.nav.system.role.inactive")}</Badge>,
		},
		{
			title: t("sys.nav.system.role.created_at"),
			dataIndex: "fecha_creacion",
			width: 165,
			render: (fecha) => new Date(fecha).toLocaleString(),
		},
		{
			title: t("sys.nav.system.role.updated_at"),
			dataIndex: "fecha_actualizacion",
			width: 165,
			render: (fecha) => new Date(fecha).toLocaleString(),
		},
		{
			title: t("sys.nav.system.role.actions"),
			key: "operation",
			align: "center",
			width: 100,
			render: (_, record) => (
				<div className="flex w-full justify-center text-gray">
					<Button variant="ghost" size="icon" onClick={() => onEdit(record)}>
						<Icon icon="solar:pen-bold-duotone" size={18} />
					</Button>
				</div>
			),
		},
	];

	// Validar y normalizar datos de roles
	const validatedRoles = roles
		.map((role) => {
			if (!role || typeof role !== "object") return null;

			const cleanRole: Role = {
				id: Number(role.id),
				nombre: String(role.nombre ?? ""),
				descripcion: String(role.descripcion ?? ""),
				activo: Boolean(role.activo),
				fecha_creacion: String(role.fecha_creacion ?? new Date().toISOString()),
				fecha_actualizacion: String(role.fecha_actualizacion ?? role.fecha_creacion ?? new Date().toISOString()),
			};

			if (Number.isNaN(cleanRole.id)) return null;
			return cleanRole;
		})
		.filter((r): r is Role => r !== null);

	const onCreate = () => {
		setRoleModalProps((prev) => ({
			...prev,
			show: true,
			title: t("sys.nav.system.role.create_new_role"),
			formValue: {
				...prev.formValue,
				...DEFAULT_ROLE_VALUE,
			},
		}));
	};

	const onEdit = (formValue: Role_Old) => {
		setRoleModalProps((prev) => ({
			...prev,
			show: true,
			title: t("sys.nav.system.role.edit_role"),
			formValue,
		}));
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>{t("sys.nav.system.role.list")}</div>
					<div className="flex items-center gap-4">
						<Select
							value={activoFilter === undefined ? "todos" : activoFilter.toString()}
							onValueChange={(value) => {
								setActivoFilter(value === "todos" ? undefined : value === "true");
							}}
						>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Filtrar por estado" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todos</SelectItem>
								<SelectItem value="true">Activos</SelectItem>
								<SelectItem value="false">Inactivos</SelectItem>
							</SelectContent>
						</Select>
						<Button onClick={onCreate}>{t("sys.nav.system.role.create_new_role")}</Button>
						{error && (
							<div className="flex items-center gap-2">
								<Badge variant="error">Error: {error}</Badge>
								<Button variant="outline" size="sm" onClick={() => fetchRoles({ page: pagination.current, limit: pagination.pageSize, active: activoFilter })}>
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
					size="small"
					scroll={{ x: "max-content" }}
					loading={loading}
					locale={{ emptyText: error ? "Error al cargar datos" : "No hay roles disponibles" }}
					pagination={{
						...pagination,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (total) => `Total ${total} roles`,
					}}
					onChange={handleTableChange}
					columns={columns}
					dataSource={validatedRoles}
				/>
			</CardContent>
			<RoleModal {...roleModalProps} />
		</Card>
	);
}
