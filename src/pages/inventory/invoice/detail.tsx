import invoiceService from "@/api/services/invoiceService";
import useLocale from "@/locales/use-locale";
import { useParams } from "@/routes/hooks";
import { useInvoiceState } from "@/store/invoiceStore";
import { Badge } from "@/ui/badge";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import type { InvoiceInfo } from "#/entity";

type NormalizedInvoiceDetail = {
	id: number;
	factura_id: number;
	producto_id: number;
	producto_nombre: string;
	producto_unidad_medida?: string;
	cantidad: number;
	precio_unitario: number;
	subtotal: number;
};

export default function InvoiceDetail() {
	const { t } = useLocale();
	const { id } = useParams();
	const { selectedInvoiceId } = useInvoiceState();

	const invoiceId = useMemo(() => {
		const byParam = Number(id);
		if (!Number.isNaN(byParam) && byParam > 0) return byParam;
		return selectedInvoiceId ?? 0;
	}, [id, selectedInvoiceId]);

	const [details, setDetails] = useState<NormalizedInvoiceDetail[]>([]);
	const [invoice, setInvoice] = useState<InvoiceInfo | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const fetchAll = async () => {
			if (!invoiceId || invoiceId <= 0) {
				setError("ID de factura inválido o no proporcionado");
				setDetails([]);
				setInvoice(null);
				return;
			}
			setLoading(true);
			setError(null);
			try {
				const [resDetails, resInvoice] = await Promise.all([invoiceService.getInvoiceDetails(invoiceId), invoiceService.getInvoiceById(invoiceId)]);

				if (resDetails.success && Array.isArray(resDetails.data)) {
					const normalized: NormalizedInvoiceDetail[] = resDetails.data
						.map((d) => ({
							id: Number(d.id),
							factura_id: Number(d.factura_id),
							producto_id: Number(d.producto_id),
							producto_nombre: String(d.producto_nombre ?? ""),
							producto_unidad_medida: String(d.producto_unidad_medida ?? ""),
							cantidad: Number(d.cantidad),
							precio_unitario: Number(d.precio_unitario),
							subtotal: Number(d.subtotal),
						}))
						.filter(
							(x) =>
								!(
									Number.isNaN(x.id) ||
									Number.isNaN(x.factura_id) ||
									Number.isNaN(x.producto_id) ||
									Number.isNaN(x.cantidad) ||
									Number.isNaN(x.precio_unitario) ||
									Number.isNaN(x.subtotal)
								),
						);
					setDetails(normalized);
				} else {
					setDetails([]);
				}

				if (resInvoice.success && resInvoice.data) {
					const inv = resInvoice.data;
					const required = [inv.id, inv.codigo_interno, inv.concepto, inv.fecha_movimiento, inv.total, inv.estado];
					const allPresent = required.every((v) => v !== undefined && v !== null);
					setInvoice(allPresent ? inv : null);
					if (!allPresent && !error) setError("Datos de factura incompletos");
				} else {
					setInvoice(null);
				}
			} catch (e) {
				setError(e instanceof Error ? e.message : "Error al obtener datos de la factura");
				setDetails([]);
				setInvoice(null);
			} finally {
				setLoading(false);
			}
		};

		fetchAll();
	}, [invoiceId]);

	const columns: ColumnsType<NormalizedInvoiceDetail> = [
		{
			title: t("sys.nav.inventory.invoice.detail.product"),
			dataIndex: "producto_nombre",
			width: 160,
		},
		{
			title: t("sys.nav.inventory.product.unit"),
			dataIndex: "producto_unidad_medida",
			width: 120,
			render: (u: string) => u || "-",
		},
		{
			title: t("sys.nav.inventory.invoice.detail.quantity"),
			dataIndex: "cantidad",
			width: 120,
			align: "right",
			render: (cantidad: number) => cantidad.toFixed(4),
		},
		{
			title: t("sys.nav.inventory.invoice.detail.unit_price"),
			dataIndex: "precio_unitario",
			width: 120,
			align: "right",
			render: (precio: number) => precio.toFixed(2),
		},
		{
			title: t("sys.nav.inventory.invoice.detail.subtotal"),
			dataIndex: "subtotal",
			width: 120,
			align: "right",
			render: (subtotal: number) => subtotal.toFixed(2),
		},
	];

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="text-lg font-semibold">
								{t("sys.nav.inventory.invoice.detail.index")} - #{invoiceId || "—"}
							</div>
							{error && <Badge variant="error">Error: {error}</Badge>}
						</div>
						{/* <div className="flex gap-2">
							{canWrite && (
								<>
									<Button variant="outline">
										<Icon icon="solar:pen-bold-duotone" className="mr-2" />
										{t("sys.nav.inventory.invoice.detail.edit")}
									</Button>
									<Button variant="default">
										<Icon icon="solar:check-circle-bold-duotone" className="mr-2" />
										{t("sys.nav.inventory.invoice.detail.confirm")}
									</Button>
								</>
							)}
						</div> */}
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 mb-4">
						<div>
							<div className="text-sm text-muted-foreground">{t("sys.nav.inventory.invoice.code")}</div>
							<div>{invoice?.codigo_interno || "—"}</div>
						</div>
						<div>
							<div className="text-sm text-muted-foreground">{t("sys.nav.inventory.invoice.concept")}</div>
							<div>{invoice?.concepto || "—"}</div>
						</div>
						<div>
							<div className="text-sm text-muted-foreground">{t("sys.nav.inventory.invoice.movement_date")}</div>
							<div>{invoice?.fecha_movimiento ? new Date(invoice.fecha_movimiento).toLocaleDateString() : "—"}</div>
						</div>

						<div className="col-span-2">
							<div className="text-sm text-muted-foreground">{t("sys.nav.inventory.invoice.status.index")}</div>
							<div>
								{invoice?.estado ? (
									<Badge variant={invoice.estado === "CONFIRMADA" ? "success" : invoice.estado === "ANULADA" ? "error" : "warning"}>
										{t(`sys.nav.inventory.invoice.status.${invoice.estado.toLowerCase()}`)}
									</Badge>
								) : (
									"—"
								)}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t("sys.nav.inventory.invoice.detail.product")}</div>
						{/* {canWrite && (
							<Button>
								<Icon icon="solar:add-circle-bold-duotone" className="mr-2" />
								{t("sys.nav.inventory.invoice.detail.add_product")}
							</Button>
						)} */}
					</div>
				</CardHeader>
				<CardContent>
					<Table
						rowKey="id"
						size="small"
						scroll={{ x: "max-content" }}
						pagination={false}
						loading={loading}
						locale={{ emptyText: error ? error : (t("sys.nav.inventory.invoice.index") as string) }}
						columns={columns}
						dataSource={details}
						summary={(data) => {
							const total = data.reduce((sum, row) => sum + row.subtotal, 0);
							return (
								<Table.Summary fixed="bottom">
									<Table.Summary.Row>
										<Table.Summary.Cell index={0} colSpan={4} align="right">
											<strong>{t("sys.nav.inventory.invoice.total")}</strong>
										</Table.Summary.Cell>
										<Table.Summary.Cell index={1} align="right">
											<strong>{total.toFixed(2)}</strong>
										</Table.Summary.Cell>
									</Table.Summary.Row>
								</Table.Summary>
							);
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
