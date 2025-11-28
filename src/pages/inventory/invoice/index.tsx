import invoiceService, { type QueryParams, type InvoiceImageProcessData } from "@/api/services/invoiceService";
import { Icon } from "@/components/icon";
import useLocale from "@/locales/use-locale";
import { usePathname, useRouter } from "@/routes/hooks";
import { useInvoiceActions } from "@/store/invoiceStore";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useState } from "react";
import type { InvoiceInfo } from "#/entity";
import InvoiceCameraModal from "./invoice-camera-modal";
import { InvoiceProcessModal } from "./invoice-modal";
import type { ProcessedInvoiceFormValues } from "./invoice-modal";

export default function InvoicePage() {
	const { t } = useLocale();
	const { push } = useRouter();
	const pathname = usePathname();
	const { setSelectedInvoiceId } = useInvoiceActions();

	const [invoices, setInvoices] = useState<InvoiceInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 10,
		total: 0,
	});
	const [estadoFilter, setEstadoFilter] = useState<InvoiceInfo["estado"] | undefined>(undefined);
	const [cameraOpen, setCameraOpen] = useState(false);
	const [processLoading, setProcessLoading] = useState(false);
	const [processError, setProcessError] = useState<string | null>(null);
	const [processMessage, setProcessMessage] = useState<string | null>(null);
	const [processedData, setProcessedData] = useState<InvoiceImageProcessData | null>(null);
	const [processEditOpen, setProcessEditOpen] = useState(false);
	void processedData;
	void processMessage;

	// Estado para edición utilizando el modal de proceso
	const [selectedInvoice, setSelectedInvoice] = useState<InvoiceInfo | null>(null);
	const [isEditing, setIsEditing] = useState(false);

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

	// Función para abrir edición con detalles cargados en el modal de proceso
	const handleEdit = async (invoice: InvoiceInfo) => {
		setSelectedInvoice(invoice);
		setProcessError(null);
		setIsEditing(true);
		setProcessLoading(true);
		try {
			const res = await invoiceService.getInvoiceDetails(invoice.id);
			if (res.success && Array.isArray(res.data)) {
				const productos = res.data.map((d) => ({
					id_producto: Number(d.producto_id),
					producto_nombre: String(d.producto_nombre ?? ""),
					producto_unidad_medida: String(d.producto_unidad_medida ?? ""),
					cantidad: Number(d.cantidad),
					precio_unitario: Number(d.precio_unitario),
				}));
				const dateStr = (() => {
					const d = new Date(String(invoice.fecha_movimiento ?? ""));
					return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
				})();
				setProcessedData({
					codigo_interno: String(invoice.codigo_interno ?? ""),
					concepto: String(invoice.concepto ?? ""),
					fecha_movimiento: dateStr,
					total: Number(invoice.total ?? 0),
					observaciones: String(invoice.observaciones ?? ""),
					productos: productos as any,
				});
				setProcessEditOpen(true);
			} else {
				setProcessError(res.message || "No se pudieron obtener detalles de la factura");
			}
		} catch (e: any) {
			setProcessError(e?.message || "Error al obtener detalles de la factura");
		} finally {
			setProcessLoading(false);
		}
	};

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
							// Guardar ID seleccionado en store global y navegar
							setSelectedInvoiceId(record.id);
							push(`${pathname}/${record.id}`);
						}}
					>
						<Icon icon="mdi:card-account-details" size={18} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => handleEdit(record)}
						disabled={record.estado !== "BORRADOR"}
						title={record.estado !== "BORRADOR" ? "Solo se pueden editar facturas en estado BORRADOR" : "Editar factura"}
					>
						<Icon icon="solar:pen-bold-duotone" size={18} />
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
				afecta_stock: String(inv.afecta_stock),
			};

			if (Number.isNaN(clean.id) || Number.isNaN(clean.tipo_movimiento_id) || Number.isNaN(clean.usuario_responsable_id) || Number.isNaN(clean.total)) {
				console.warn("Factura con valores numéricos inválidos:", inv);
				return null;
			}

			return clean;
		})
		.filter((x): x is InvoiceInfo => x !== null);

	return (
		<>
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
									<SelectValue placeholder={t("sys.nav.inventory.invoice.status.index")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="todos">{t("sys.nav.inventory.invoice.status.all")}</SelectItem>
									<SelectItem value="BORRADOR">{t("sys.nav.inventory.invoice.status.borrador")}</SelectItem>
									<SelectItem value="CONFIRMADA">{t("sys.nav.inventory.invoice.status.confirmada")}</SelectItem>
									<SelectItem value="ANULADA">{t("sys.nav.inventory.invoice.status.anulada")}</SelectItem>
								</SelectContent>
							</Select>
							<Button
								onClick={() => {
									setProcessError(null);
									setIsEditing(false);
									setProcessedData({
										codigo_interno: "",
										concepto: "",
										fecha_movimiento: "",
										total: 0,
										observaciones: "",
										productos: [],
									});
									setProcessEditOpen(true);
								}}
							>
								<Icon icon="solar:add-circle-bold-duotone" className="mr-2" />
								{t("sys.nav.inventory.invoice.new")}
							</Button>
							<Button onClick={() => setCameraOpen(true)}>
								<Icon icon="solar:scan-bold-duotone" className="mr-2" />
								{t("sys.nav.inventory.invoice.scan")}
							</Button>
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
			<InvoiceCameraModal
				open={cameraOpen}
				title={t("sys.nav.inventory.invoice.scan")}
				loading={processLoading}
				error={processError}
				onCancel={() => setCameraOpen(false)}
				onImageSelected={async (file) => {
					setProcessError(null);
					setProcessMessage(null);
					const isValidType = ["image/jpeg", "image/jpg", "image/png"].includes(file.type);
					const maxSize = 10 * 1024 * 1024;
					if (!isValidType) {
						setProcessError("El archivo debe ser una imagen JPG o PNG");
						return;
					}
					if (file.size > maxSize) {
						setProcessError("El tamaño de la imagen no debe exceder 10MB");
						return;
					}
					setProcessLoading(true);
					try {
						const res = await invoiceService.processInvoiceImage(file);
						if (res.success) {
							setProcessedData(res.data ?? null);
							setProcessMessage(res.message || "Imagen procesada correctamente");
							setIsEditing(false);
							setCameraOpen(false);
							setProcessEditOpen(true);
						} else {
							setProcessError(res.message || "Error al procesar la imagen");
						}
					} catch (e: any) {
						setProcessError(e?.message || "Error de red al procesar la imagen");
					} finally {
						setProcessLoading(false);
					}
				}}
			/>
			{processedData && (
				<InvoiceProcessModal
					open={processEditOpen}
					title={isEditing ? t("sys.nav.inventory.invoice.edit") : t("sys.nav.inventory.invoice.new")}
					initialData={processedData}
					loading={processLoading}
					error={processError}
					onSubmit={async (values: ProcessedInvoiceFormValues) => {
						setProcessLoading(true);
						setProcessError(null);
						try {
							const payload = {
								codigo_interno: values.codigo_interno,
								concepto: values.concepto,
								fecha_movimiento: values.fecha_movimiento,
								total: values.total,
								observaciones: values.observaciones,
								productos: values.productos.map((p) => ({
									id_producto: p.id_producto,
									nombre: p.nombre,
									unidad_medida: p.unidad_medida,
									cantidad: p.cantidad,
									precio_unitario: p.precio_unitario,
								})),
							};
							const res =
								selectedInvoice && isEditing
									? await invoiceService.updateInvoiceFull(selectedInvoice.id, payload)
									: await invoiceService.createInvoiceFromProcess(payload);
							if (res.success) {
								setProcessMessage(res.message || (isEditing ? "Factura actualizada exitosamente" : "Factura creada exitosamente"));
								setProcessEditOpen(false);
								setProcessedData(null);
								setIsEditing(false);
								await fetchInvoices({ page: pagination.current, limit: pagination.pageSize, estado: estadoFilter });
							} else {
								setProcessError(res.message || (isEditing ? "Error al actualizar la factura" : "Error al crear la factura"));
							}
						} catch (e: any) {
							setProcessError(e?.message || (isEditing ? "Error de red al actualizar la factura" : "Error de red al crear la factura"));
						} finally {
							setProcessLoading(false);
						}
					}}
					onCancel={() => {
						setProcessEditOpen(false);
						setIsEditing(false);
					}}
				/>
			)}
		</>
	);
}
