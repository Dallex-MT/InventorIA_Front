import invoiceService, { type QueryParams } from "@/api/services/invoiceService";
import { Icon } from "@/components/icon";
import useLocale from "@/locales/use-locale";
import { usePathname, useRouter } from "@/routes/hooks";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useState } from "react";
import type { InvoiceInfo } from "#/entity";

export default function InvoicePage() {
	const { t } = useLocale();
	const { push } = useRouter();
	const pathname = usePathname();

	const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
	});
	const [estadoFilter, setEstadoFilter] = useState<InvoiceInfo["estado"] | undefined>(undefined);

	const fetchInvoices = async (params: QueryParams) => {
		setLoading(true);
		setError(null);
		try {
			const response = await invoiceService.getInvoices(params);
			if (response?.data?.invoices && Array.isArray(response.data.invoices)) {
				setInvoices(response.data.invoices);
				setPagination({
					current: response.data.page || params.page,
					pageSize: params.limit,
					total: response.data.total || 0,
				});
			} else {
				console.error("Estructura de respuesta inválida:", response);
				setError("La respuesta del servidor no tiene el formato esperado");
				setInvoices([]);
				setPagination({ current: params.page, pageSize: params.limit, total: 0 });
			}
		} catch (e) {
			console.error("Error al obtener facturas:", e);
			setError(e instanceof Error ? e.message : "Error al cargar facturas");
			setInvoices([]);
			setPagination({ current: params.page, pageSize: params.limit, total: 0 });
		} finally {
			setLoading(false);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: carga inicial y cambios de filtro
	useEffect(() => {
		fetchInvoices({ page: 1, limit: 10, estado: estadoFilter });
	}, [estadoFilter]);

	const handleTableChange = (newPagination: TablePaginationConfig) => {
		fetchInvoices({
			page: newPagination.current || 1,
			limit: newPagination.pageSize || pagination.pageSize,
			estado: estadoFilter,
		});
	};

	const columns: ColumnsType<InvoiceInfo> = [
		{
			title: t("sys.nav.inventory.invoice.code"),
			dataIndex: "codigo_interno",
			width: 150,
		},
		{
			title: t("sys.nav.inventory.invoice.concept"),
			dataIndex: "concepto",
			width: 200,
			ellipsis: true,
		},
		{
			title: t("sys.nav.inventory.invoice.movement_date"),
			dataIndex: "fecha_movimiento",
			width: 120,
			align: "center",
			render: (fecha) => new Date(fecha).toLocaleDateString(),
		},
		{
			title: t("sys.nav.inventory.invoice.total"),
			dataIndex: "total",
			width: 120,
			align: "right",
			render: (total) => total.toFixed(2),
		},
		{
			title: t("sys.nav.inventory.invoice.status.index"),
			dataIndex: "estado",
			width: 120,
			align: "center",
			render: (estado) => (
				<Badge variant={estado === "CONFIRMADA" ? "success" : estado === "ANULADA" ? "error" : "warning"}>
					{t(`sys.nav.inventory.invoice.status.${estado.toLowerCase()}`)}
				</Badge>
			),
		},
		{
			title: t("sys.nav.inventory.invoice.actions"),
			key: "operation",
			width: 120,
			align: "center",
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
					<Button variant="ghost" size="icon" onClick={() => {}} disabled={record.estado !== "BORRADOR"}>
						<Icon icon="solar:pen-bold-duotone" size={18} />
					</Button>
					<Button variant="ghost" size="icon" disabled={record.estado !== "BORRADOR"}>
						<Icon icon="mingcute:delete-2-fill" size={18} className="text-error!" />
					</Button>
				</div>
			),
		},
	];

	// Validar y normalizar datos recibidos del backend
	const validatedInvoices = invoices
		.map((inv) => {
			if (!inv || typeof inv !== "object") return null;

			if (
				inv.id === undefined ||
				inv.codigo_interno === undefined ||
				inv.tipo_movimiento_id === undefined ||
				inv.concepto === undefined ||
				inv.usuario_responsable_id === undefined ||
				inv.fecha_movimiento === undefined ||
				inv.total === undefined ||
				inv.estado === undefined
			) {
				console.warn("Factura con datos incompletos:", inv);
				return null;
			}

			const clean: InvoiceInfo = {
				id: Number(inv.id),
				codigo_interno: String(inv.codigo_interno),
				tipo_movimiento_id: Number(inv.tipo_movimiento_id),
				concepto: String(inv.concepto ?? ""),
				usuario_responsable_id: Number(inv.usuario_responsable_id),
				fecha_movimiento: String(inv.fecha_movimiento ?? ""),
				total: Number(inv.total),
				observaciones: String(inv.observaciones ?? ""),
				estado: inv.estado as InvoiceInfo["estado"],
				fecha_creacion: String(inv.fecha_creacion ?? ""),
				fecha_actualizacion: String(inv.fecha_actualizacion ?? ""),
			};

			if (Number.isNaN(clean.id) || Number.isNaN(clean.tipo_movimiento_id) || Number.isNaN(clean.usuario_responsable_id) || Number.isNaN(clean.total)) {
				console.warn("Factura con valores numéricos inválidos:", inv);
				return null;
			}

			return clean;
		})
		.filter((x): x is InvoiceInfo => x !== null);

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>{t("sys.nav.inventory.invoice.index")}</div>
					<div className="flex gap-2 items-center">
						<Select
							value={estadoFilter ?? "todos"}
							onValueChange={(value) => {
								setEstadoFilter(value === "todos" ? undefined : (value as InvoiceInfo["estado"]));
							}}
						>
							<SelectTrigger className="w-56">
								<SelectValue placeholder={t("sys.nav.inventory.invoice.status.index") as string} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todos</SelectItem>
								<SelectItem value="BORRADOR">{t("sys.nav.inventory.invoice.status.borrador")}</SelectItem>
								<SelectItem value="CONFIRMADA">{t("sys.nav.inventory.invoice.status.confirmada")}</SelectItem>
								<SelectItem value="ANULADA">{t("sys.nav.inventory.invoice.status.anulada")}</SelectItem>
							</SelectContent>
						</Select>
						<Button variant="outline" onClick={() => push(`${pathname}/movement_types`)}>
							{t("sys.nav.inventory.invoice.movement_type")}
						</Button>
						<Dialog>
							<DialogTrigger asChild>
								<Button>
									<Icon icon="solar:scan-bold-duotone" className="mr-2" />
									{t("sys.nav.inventory.invoice.scan")}
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>{t("sys.nav.inventory.invoice.scan")}</DialogTitle>
								</DialogHeader>
								<div className="flex flex-col gap-4">
									<div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
										{/* TODO: Implementar vista de cámara */}
										<Icon icon="solar:camera-bold-duotone" className="w-12 h-12 text-muted-foreground" />
									</div>
									<div className="flex flex-col gap-2">
										<Button variant="outline" className="w-full">
											<Icon icon="solar:upload-bold-duotone" className="mr-2" />
											{t("sys.nav.inventory.invoice.upload")}
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
						{error && (
							<div className="flex items-center gap-2 ml-2">
								<Badge variant="error">Error: {error}</Badge>
								<Button
									variant="outline"
									size="sm"
									onClick={() => fetchInvoices({ page: pagination.current, limit: pagination.pageSize, estado: estadoFilter })}
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
					locale={{ emptyText: error ? "Error al cargar datos" : "No hay facturas disponibles" }}
					size="small"
					scroll={{ x: "max-content" }}
					columns={columns}
					dataSource={validatedInvoices}
					pagination={{
						...pagination,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (total) => `Total ${total} facturas`,
					}}
					onChange={handleTableChange}
				/>
			</CardContent>
		</Card>
	);
}
