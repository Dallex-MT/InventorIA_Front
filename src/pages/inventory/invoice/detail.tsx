import { Icon } from "@/components/icon";
import useLocale from "@/locales/use-locale";
import { useParams } from "@/routes/hooks";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";

interface InvoiceInfo {
	id: number;
	codigo_interno: string;
	tipo_movimiento_id: number;
	concepto: string;
	usuario_responsable_id: number;
	fecha_movimiento: string;
	total: number;
	observaciones: string;
	estado: "BORRADOR" | "CONFIRMADA" | "ANULADA";
	fecha_creacion: string;
	fecha_actualizacion: string;
}

interface InvoiceDetailInfo {
	id: number;
	factura_id: number;
	producto_id: number;
	cantidad: number;
	precio_unitario: number;
	subtotal: number;
	// Campos adicionales para mostrar en la tabla
	producto_nombre: string;
	producto_unidad: string;
}

// TODO: Conectar con la API real
const INVOICES: InvoiceInfo[] = [
	{
		id: 1,
		codigo_interno: "INV-001",
		tipo_movimiento_id: 1,
		concepto: "Venta de productos electrónicos",
		usuario_responsable_id: 101,
		fecha_movimiento: "2023-10-26T10:00:00Z",
		total: 1250.75,
		observaciones: "Entrega a domicilio solicitada.",
		estado: "CONFIRMADA",
		fecha_creacion: "2023-10-25T15:30:00Z",
		fecha_actualizacion: "2023-10-26T11:00:00Z",
	},
	{
		id: 2,
		codigo_interno: "INV-002",
		tipo_movimiento_id: 2,
		concepto: "Compra de insumos de oficina",
		usuario_responsable_id: 102,
		fecha_movimiento: "2023-10-27T14:15:00Z",
		total: 300.0,
		observaciones: "",
		estado: "BORRADOR",
		fecha_creacion: "2023-10-27T10:00:00Z",
		fecha_actualizacion: "2023-10-27T14:15:00Z",
	},
	{
		id: 3,
		codigo_interno: "INV-003",
		tipo_movimiento_id: 1,
		concepto: "Devolución de mercancía",
		usuario_responsable_id: 103,
		fecha_movimiento: "2023-10-28T09:30:00Z",
		total: 50.25,
		observaciones: "Producto defectuoso.",
		estado: "ANULADA",
		fecha_creacion: "2023-10-28T09:00:00Z",
		fecha_actualizacion: "2023-10-28T09:45:00Z",
	},
	{
		id: 4,
		codigo_interno: "INV-004",
		tipo_movimiento_id: 1,
		concepto: "Venta de software",
		usuario_responsable_id: 101,
		fecha_movimiento: "2023-10-29T11:00:00Z",
		total: 800.0,
		observaciones: "Licencia anual.",
		estado: "CONFIRMADA",
		fecha_creacion: "2023-11-29T10:30:00Z",
		fecha_actualizacion: "2023-11-29T11:15:00Z",
	},
	{
		id: 5,
		codigo_interno: "INV-005",
		tipo_movimiento_id: 2,
		concepto: "Mantenimiento de equipos",
		usuario_responsable_id: 104,
		fecha_movimiento: "2023-10-30T16:00:00Z",
		total: 150.0,
		observaciones: "",
		estado: "BORRADOR",
		fecha_creacion: "2023-10-30T15:00:00Z",
		fecha_actualizacion: "2023-10-30T16:00:00Z",
	},
	{
		id: 6,
		codigo_interno: "INV-006",
		tipo_movimiento_id: 1,
		concepto: "Venta de accesorios",
		usuario_responsable_id: 105,
		fecha_movimiento: "2023-10-31T10:00:00Z",
		total: 75.5,
		observaciones: "Pago en efectivo.",
		estado: "CONFIRMADA",
		fecha_creacion: "2023-10-31T09:30:00Z",
		fecha_actualizacion: "2023-10-31T10:10:00Z",
	},
	{
		id: 7,
		codigo_interno: "INV-007",
		tipo_movimiento_id: 2,
		concepto: "Compra de materia prima",
		usuario_responsable_id: 106,
		fecha_movimiento: "2023-11-01T13:00:00Z",
		total: 2500.0,
		observaciones: "Proveedor A.",
		estado: "BORRADOR",
		fecha_creacion: "2023-11-01T12:00:00Z",
		fecha_actualizacion: "2023-11-01T13:00:00Z",
	},
	{
		id: 8,
		codigo_interno: "INV-008",
		tipo_movimiento_id: 1,
		concepto: "Servicio de consultoría",
		usuario_responsable_id: 107,
		fecha_movimiento: "2023-11-02T15:00:00Z",
		total: 1500.0,
		observaciones: "Proyecto X.",
		estado: "CONFIRMADA",
		fecha_creacion: "2023-11-02T14:00:00Z",
		fecha_actualizacion: "2023-11-02T15:30:00Z",
	},
	{
		id: 9,
		codigo_interno: "INV-009",
		tipo_movimiento_id: 2,
		concepto: "Pago de servicios básicos",
		usuario_responsable_id: 108,
		fecha_movimiento: "2023-11-03T09:00:00Z",
		total: 120.0,
		observaciones: "Factura de luz.",
		estado: "ANULADA",
		fecha_creacion: "2023-11-03T08:30:00Z",
		fecha_actualizacion: "2023-11-03T09:10:00Z",
	},
	{
		id: 10,
		codigo_interno: "INV-010",
		tipo_movimiento_id: 1,
		concepto: "Venta de productos de limpieza",
		usuario_responsable_id: 109,
		fecha_movimiento: "2023-11-04T11:00:00Z",
		total: 80.0,
		observaciones: "",
		estado: "CONFIRMADA",
		fecha_creacion: "2023-11-04T10:30:00Z",
		fecha_actualizacion: "2023-11-04T11:00:00Z",
	},
	{
		id: 11,
		codigo_interno: "INV-011",
		tipo_movimiento_id: 2,
		concepto: "Compra de equipos de seguridad",
		usuario_responsable_id: 110,
		fecha_movimiento: "2023-11-05T14:00:00Z",
		total: 700.0,
		observaciones: "Cámaras de vigilancia.",
		estado: "BORRADOR",
		fecha_creacion: "2023-11-05T13:00:00Z",
		fecha_actualizacion: "2023-11-05T14:00:00Z",
	},
	{
		id: 12,
		codigo_interno: "INV-012",
		tipo_movimiento_id: 1,
		concepto: "Venta de material de oficina",
		usuario_responsable_id: 101,
		fecha_movimiento: "2023-11-06T10:00:00Z",
		total: 120.5,
		observaciones: "",
		estado: "CONFIRMADA",
		fecha_creacion: "2023-11-06T09:30:00Z",
		fecha_actualizacion: "2023-11-06T10:15:00Z",
	},
	{
		id: 13,
		codigo_interno: "INV-013",
		tipo_movimiento_id: 2,
		concepto: "Pago de alquiler",
		usuario_responsable_id: 102,
		fecha_movimiento: "2023-11-07T12:00:00Z",
		total: 1000.0,
		observaciones: "Oficina principal.",
		estado: "CONFIRMADA",
		fecha_creacion: "2023-11-07T11:00:00Z",
		fecha_actualizacion: "2023-11-07T12:00:00Z",
	},
	{
		id: 14,
		codigo_interno: "INV-014",
		tipo_movimiento_id: 1,
		concepto: "Venta de servicios de diseño",
		usuario_responsable_id: 103,
		fecha_movimiento: "2023-11-08T16:00:00Z",
		total: 2000.0,
		observaciones: "Diseño de logo.",
		estado: "BORRADOR",
		fecha_creacion: "2023-11-08T15:00:00Z",
		fecha_actualizacion: "2023-11-08T16:00:00Z",
	},
	{
		id: 15,
		codigo_interno: "INV-015",
		tipo_movimiento_id: 2,
		concepto: "Compra de licencias de software",
		usuario_responsable_id: 104,
		fecha_movimiento: "2023-11-09T09:00:00Z",
		total: 500.0,
		observaciones: "Licencias de edición.",
		estado: "CONFIRMADA",
		fecha_creacion: "2023-11-09T08:30:00Z",
		fecha_actualizacion: "2023-11-09T09:15:00Z",
	},
	{
		id: 16,
		codigo_interno: "INV-016",
		tipo_movimiento_id: 1,
		concepto: "Venta de productos personalizados",
		usuario_responsable_id: 105,
		fecha_movimiento: "2023-11-10T11:00:00Z",
		total: 350.0,
		observaciones: "Grabado láser.",
		estado: "CONFIRMADA",
		fecha_creacion: "2023-11-10T10:00:00Z",
		fecha_actualizacion: "2023-11-10T11:00:00Z",
	},
	{
		id: 17,
		codigo_interno: "INV-017",
		tipo_movimiento_id: 2,
		concepto: "Pago de publicidad",
		usuario_responsable_id: 106,
		fecha_movimiento: "2023-11-11T14:00:00Z",
		total: 600.0,
		observaciones: "Campaña digital.",
		estado: "BORRADOR",
		fecha_creacion: "2023-11-11T13:00:00Z",
		fecha_actualizacion: "2023-11-11T14:00:00Z",
	},
	{
		id: 18,
		codigo_interno: "INV-018",
		tipo_movimiento_id: 1,
		concepto: "Venta de equipos de red",
		usuario_responsable_id: 107,
		fecha_movimiento: "2023-11-12T10:00:00Z",
		total: 950.0,
		observaciones: "Routers y switches.",
		estado: "CONFIRMADA",
		fecha_creacion: "2023-11-12T09:00:00Z",
		fecha_actualizacion: "2023-11-12T10:30:00Z",
	},
	{
		id: 19,
		codigo_interno: "INV-019",
		tipo_movimiento_id: 2,
		concepto: "Compra de mobiliario",
		usuario_responsable_id: 108,
		fecha_movimiento: "2023-11-13T15:00:00Z",
		total: 1800.0,
		observaciones: "Sillas de oficina.",
		estado: "BORRADOR",
		fecha_creacion: "2023-11-13T14:00:00Z",
		fecha_actualizacion: "2023-11-13T15:00:00Z",
	},
	{
		id: 20,
		codigo_interno: "INV-020",
		tipo_movimiento_id: 1,
		concepto: "Venta de servicios de soporte",
		usuario_responsable_id: 109,
		fecha_movimiento: "2023-11-14T11:00:00Z",
		total: 400.0,
		observaciones: "Soporte técnico remoto.",
		estado: "CONFIRMADA",
		fecha_creacion: "2023-11-14T10:30:00Z",
		fecha_actualizacion: "2023-11-14T11:10:00Z",
	},
];
const INVOICE_DETAILS: InvoiceDetailInfo[] = [
	// Detalles para INV-001 (id: 1)
	{
		id: 1,
		factura_id: 1,
		producto_id: 101,
		cantidad: 2,
		precio_unitario: 350.5,
		subtotal: 701.0,
		producto_nombre: "Laptop Gamer",
		producto_unidad: "Unidad",
	},
	{
		id: 2,
		factura_id: 1,
		producto_id: 102,
		cantidad: 1,
		precio_unitario: 549.75,
		subtotal: 549.75,
		producto_nombre: 'Monitor Curvo 27"',
		producto_unidad: "Unidad",
	},
	// Detalles para INV-002 (id: 2)
	{
		id: 3,
		factura_id: 2,
		producto_id: 201,
		cantidad: 5,
		precio_unitario: 15.0,
		subtotal: 75.0,
		producto_nombre: "Resmas de Papel A4",
		producto_unidad: "Paquete",
	},
	{
		id: 4,
		factura_id: 2,
		producto_id: 202,
		cantidad: 2,
		precio_unitario: 25.0,
		subtotal: 50.0,
		producto_nombre: "Cartuchos de Tinta",
		producto_unidad: "Unidad",
	},
	{
		id: 5,
		factura_id: 2,
		producto_id: 203,
		cantidad: 1,
		precio_unitario: 175.0,
		subtotal: 175.0,
		producto_nombre: "Teclado Ergonómico",
		producto_unidad: "Unidad",
	},
	// Detalles para INV-003 (id: 3)
	{
		id: 6,
		factura_id: 3,
		producto_id: 103,
		cantidad: 1,
		precio_unitario: 50.25,
		subtotal: 50.25,
		producto_nombre: "Mouse Inalámbrico",
		producto_unidad: "Unidad",
	},
	// Detalles para INV-004 (id: 4)
	{
		id: 7,
		factura_id: 4,
		producto_id: 301,
		cantidad: 1,
		precio_unitario: 800.0,
		subtotal: 800.0,
		producto_nombre: "Software de Diseño Gráfico",
		producto_unidad: "Licencia",
	},
	// Detalles para INV-005 (id: 5)
	{
		id: 8,
		factura_id: 5,
		producto_id: 401,
		cantidad: 1,
		precio_unitario: 150.0,
		subtotal: 150.0,
		producto_nombre: "Servicio de Mantenimiento PC",
		producto_unidad: "Servicio",
	},
	// Detalles para INV-006 (id: 6)
	{
		id: 9,
		factura_id: 6,
		producto_id: 104,
		cantidad: 3,
		precio_unitario: 25.1,
		subtotal: 75.3,
		producto_nombre: "Auriculares Bluetooth",
		producto_unidad: "Unidad",
	},
	// Detalles para INV-007 (id: 7)
	{
		id: 10,
		factura_id: 7,
		producto_id: 501,
		cantidad: 100,
		precio_unitario: 25.0,
		subtotal: 2500.0,
		producto_nombre: "Plástico ABS",
		producto_unidad: "Kg",
	},
	// Detalles para INV-008 (id: 8)
	{
		id: 11,
		factura_id: 8,
		producto_id: 601,
		cantidad: 1,
		precio_unitario: 1500.0,
		subtotal: 1500.0,
		producto_nombre: "Consultoría de Marketing Digital",
		producto_unidad: "Servicio",
	},
	// Detalles para INV-009 (id: 9)
	{
		id: 12,
		factura_id: 9,
		producto_id: 701,
		cantidad: 1,
		precio_unitario: 120.0,
		subtotal: 120.0,
		producto_nombre: "Recibo de Luz",
		producto_unidad: "Factura",
	},
	// Detalles para INV-010 (id: 10)
	{
		id: 13,
		factura_id: 10,
		producto_id: 801,
		cantidad: 4,
		precio_unitario: 20.0,
		subtotal: 80.0,
		producto_nombre: "Detergente Multiusos",
		producto_unidad: "Litro",
	},
	// Detalles para INV-011 (id: 11)
	{
		id: 14,
		factura_id: 11,
		producto_id: 901,
		cantidad: 2,
		precio_unitario: 350.0,
		subtotal: 700.0,
		producto_nombre: "Cámara de Seguridad HD",
		producto_unidad: "Unidad",
	},
	// Detalles para INV-012 (id: 12)
	{
		id: 15,
		factura_id: 12,
		producto_id: 204,
		cantidad: 10,
		precio_unitario: 12.05,
		subtotal: 120.5,
		producto_nombre: "Bolígrafos Azules",
		producto_unidad: "Caja",
	},
	// Detalles para INV-013 (id: 13)
	{
		id: 16,
		factura_id: 13,
		producto_id: 1001,
		cantidad: 1,
		precio_unitario: 1000.0,
		subtotal: 1000.0,
		producto_nombre: "Alquiler de Oficina",
		producto_unidad: "Mes",
	},
	// Detalles para INV-014 (id: 14)
	{
		id: 17,
		factura_id: 14,
		producto_id: 1101,
		cantidad: 1,
		precio_unitario: 2000.0,
		subtotal: 2000.0,
		producto_nombre: "Diseño de Logotipo Premium",
		producto_unidad: "Servicio",
	},
	// Detalles para INV-015 (id: 15)
	{
		id: 18,
		factura_id: 15,
		producto_id: 1201,
		cantidad: 1,
		precio_unitario: 500.0,
		subtotal: 500.0,
		producto_nombre: "Licencia Adobe Creative Suite",
		producto_unidad: "Licencia",
	},
	// Detalles para INV-016 (id: 16)
	{
		id: 19,
		factura_id: 16,
		producto_id: 1301,
		cantidad: 1,
		precio_unitario: 350.0,
		subtotal: 350.0,
		producto_nombre: "Taza Personalizada con Logo",
		producto_unidad: "Unidad",
	},
	// Detalles para INV-017 (id: 17)
	{
		id: 20,
		factura_id: 17,
		producto_id: 1401,
		cantidad: 1,
		precio_unitario: 600.0,
		subtotal: 600.0,
		producto_nombre: "Campaña de Google Ads",
		producto_unidad: "Campaña",
	},
	// Detalles para INV-018 (id: 18)
	{
		id: 21,
		factura_id: 18,
		producto_id: 1501,
		cantidad: 1,
		precio_unitario: 450.0,
		subtotal: 450.0,
		producto_nombre: "Router Wi-Fi 6",
		producto_unidad: "Unidad",
	},
	{
		id: 22,
		factura_id: 18,
		producto_id: 1502,
		cantidad: 2,
		precio_unitario: 250.0,
		subtotal: 500.0,
		producto_nombre: "Switch de Red 8 Puertos",
		producto_unidad: "Unidad",
	},
	// Detalles para INV-019 (id: 19)
	{
		id: 23,
		factura_id: 19,
		producto_id: 1601,
		cantidad: 3,
		precio_unitario: 600.0,
		subtotal: 1800.0,
		producto_nombre: "Silla Ergonómica de Oficina",
		producto_unidad: "Unidad",
	},
	// Detalles para INV-020 (id: 20)
	{
		id: 24,
		factura_id: 20,
		producto_id: 1701,
		cantidad: 1,
		precio_unitario: 400.0,
		subtotal: 400.0,
		producto_nombre: "Soporte Técnico Remoto 1 Año",
		producto_unidad: "Servicio",
	},
];

export default function InvoiceDetail() {
	const { t } = useLocale();
	const { id } = useParams();

	const invoice = INVOICES.find((invoice) => invoice.id === Number(id));
	const details = INVOICE_DETAILS.filter((detail) => detail.factura_id === Number(id));

	const columns: ColumnsType<InvoiceDetailInfo> = [
		{
			title: t("sys.nav.inventory.invoice.detail.product"),
			dataIndex: "producto_nombre",
			width: 200,
		},
		{
			title: t("sys.nav.inventory.invoice.detail.quantity"),
			dataIndex: "cantidad",
			width: 120,
			align: "right",
			render: (cantidad) => cantidad.toFixed(4),
		},
		{
			title: t("sys.nav.inventory.invoice.detail.unit"),
			dataIndex: "producto_unidad",
			width: 100,
			align: "center",
		},
		{
			title: t("sys.nav.inventory.invoice.detail.unit_price"),
			dataIndex: "precio_unitario",
			width: 120,
			align: "right",
			render: (precio) => precio.toFixed(2),
		},
		{
			title: t("sys.nav.inventory.invoice.detail.subtotal"),
			dataIndex: "subtotal",
			width: 120,
			align: "right",
			render: (subtotal) => subtotal.toFixed(2),
		},
	];

	if (!invoice) {
		return null;
	}

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="text-lg font-semibold">
								{t("sys.nav.inventory.invoice.detail.index")} - {invoice.codigo_interno}
							</div>
							<Badge variant={invoice.estado === "CONFIRMADA" ? "success" : invoice.estado === "ANULADA" ? "error" : "warning"}>
								{t(`sys.nav.inventory.invoice.status.${invoice.estado.toLowerCase()}`)}
							</Badge>
						</div>
						{invoice.estado === "BORRADOR" && (
							<div className="flex gap-2">
								<Button variant="outline" onClick={() => {}}>
									<Icon icon="solar:pen-bold-duotone" className="mr-2" />
									{t("sys.nav.inventory.invoice.detail.edit")}
								</Button>
								<Button variant="default" onClick={() => {}}>
									<Icon icon="solar:check-circle-bold-duotone" className="mr-2" />
									{t("sys.nav.inventory.invoice.detail.confirm")}
								</Button>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4 mb-4">
						<div>
							<div className="text-sm text-muted-foreground">{t("sys.nav.inventory.invoice.concept")}</div>
							<div>{invoice.concepto}</div>
						</div>
						<div>
							<div className="text-sm text-muted-foreground">{t("sys.nav.inventory.invoice.movement_date")}</div>
							<div>{new Date(invoice.fecha_movimiento).toLocaleDateString()}</div>
						</div>
						{invoice.observaciones && (
							<div className="col-span-2">
								<div className="text-sm text-muted-foreground">{t("sys.nav.inventory.invoice.observations")}</div>
								<div>{invoice.observaciones}</div>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>{t("sys.nav.inventory.invoice.detail.product")}</div>
						{invoice.estado === "BORRADOR" && (
							<Button onClick={() => {}}>
								<Icon icon="solar:add-circle-bold-duotone" className="mr-2" />
								{t("sys.nav.inventory.invoice.detail.add_product")}
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					<Table
						rowKey="id"
						size="small"
						scroll={{ x: "max-content" }}
						pagination={false}
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
