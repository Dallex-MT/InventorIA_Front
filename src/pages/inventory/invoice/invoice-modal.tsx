import type { InvoiceImageProcessData, InvoiceImageProcessProduct } from "@/api/services/invoiceService";
import { Button } from "@/ui/button";
import { Form, Input, InputNumber, Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export type ProcessedProductEdit = {
	id_producto?: number;
	nombre: string;
	unidad_medida: string;
	cantidad: number;
	precio_unitario: number;
};

export interface ProcessedInvoiceFormValues {
	codigo_interno: string;
	concepto: string;
	fecha_movimiento: string;
	total: number;
	observaciones: string;
	productos: ProcessedProductEdit[];
}

export interface InvoiceProcessEditModalProps {
	open: boolean;
	title?: string;
	initialData: InvoiceImageProcessData;
	loading?: boolean;
	error?: string | null;
	onSubmit: (values: ProcessedInvoiceFormValues) => void;
	onCancel: () => void;
}

export function InvoiceProcessModal({ open, title, initialData, loading, error, onSubmit, onCancel }: InvoiceProcessEditModalProps) {
	const [form] = Form.useForm<ProcessedInvoiceFormValues>();
	const { t } = useTranslation();

	const normalizeDate = (input: string) => {
		const parts = input.split("-");
		if (parts.length === 3) {
			if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
				const d = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
				return d;
			}
			if (parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
				return input;
			}
		}
		return "";
	};

	const initialProducts: ProcessedProductEdit[] = (initialData?.productos || []).map((p: InvoiceImageProcessProduct) => ({
		id_producto: (p as any).id_producto !== undefined ? Number((p as any).id_producto) : undefined,
		nombre: String((p as any).nombre ?? (p as any).producto_nombre ?? ""),
		unidad_medida: String((p as any).unidad_medida ?? (p as any).producto_unidad_medida ?? ""),
		cantidad: Number(p.cantidad ?? 0),
		precio_unitario: Number(p.precio_unitario ?? 0),
	}));

	const [products, setProducts] = useState<ProcessedProductEdit[]>(initialProducts);
	const [newProduct, setNewProduct] = useState<ProcessedProductEdit>({ nombre: "", unidad_medida: "", cantidad: 0, precio_unitario: 0 });
	const canAddProduct =
		String(newProduct.nombre).trim().length > 0 &&
		String(newProduct.unidad_medida).trim().length > 0 &&
		Number.isFinite(newProduct.cantidad) &&
		newProduct.cantidad >= 0 &&
		Number.isFinite(newProduct.precio_unitario) &&
		newProduct.precio_unitario >= 0;

	const initValues: ProcessedInvoiceFormValues = {
		codigo_interno: String(initialData?.codigo_interno ?? ""),
		concepto: String(initialData?.concepto ?? ""),
		fecha_movimiento: normalizeDate(String(initialData?.fecha_movimiento ?? "")),
		total: Number(initialData?.total ?? 0),
		observaciones: String(initialData?.observaciones ?? ""),
		productos: products,
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setProducts(initialProducts);
		form.setFieldsValue({
			codigo_interno: initValues.codigo_interno,
			concepto: initValues.concepto,
			fecha_movimiento: initValues.fecha_movimiento,
			total: initValues.total,
			observaciones: initValues.observaciones,
			productos: initialProducts,
		});
	}, [initialData]);

	const canSubmit = () => {
		const v = form.getFieldsValue();
		const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(String(v.fecha_movimiento || ""));
		const totalOk = typeof v.total === "number" && Number.isFinite(v.total);
		const baseOk = String(v.codigo_interno || "").trim().length > 0 && String(v.concepto || "").trim().length > 0;
		const productsOk =
			products.length > 0 &&
			products.every(
				(p) =>
					String(p.nombre).trim().length > 0 &&
					String(p.unidad_medida).trim().length > 0 &&
					Number.isFinite(p.cantidad) &&
					p.cantidad >= 0 &&
					Number.isFinite(p.precio_unitario) &&
					p.precio_unitario >= 0,
			);
		return dateOk && totalOk && baseOk && productsOk;
	};

	const handleOk = () => {
		form
			.validateFields()
			.then((values) => {
				const payload: ProcessedInvoiceFormValues = {
					codigo_interno: String(values.codigo_interno ?? "").trim(),
					concepto: String(values.concepto ?? "").trim(),
					fecha_movimiento: String(values.fecha_movimiento ?? "").trim(),
					total: Number(values.total ?? 0),
					observaciones: String(values.observaciones ?? ""),
					productos: products.map((p) => ({
						id_producto: p.id_producto,
						nombre: String(p.nombre ?? "").trim(),
						unidad_medida: String(p.unidad_medida ?? "").trim(),
						cantidad: Number(p.cantidad ?? 0),
						precio_unitario: Number(p.precio_unitario ?? 0),
					})),
				};
				onSubmit(payload);
			})
			.catch(() => {});
	};

	const columns: ColumnsType<ProcessedProductEdit> = [
		{
			title: t("sys.nav.inventory.invoice.detail.product"),
			dataIndex: "nombre",
			width: 200,
			render: (text: string, record, index) => (
				<Input
					value={text}
					onChange={(e) => {
						const next = [...products];
						next[index] = { ...record, nombre: e.target.value };
						setProducts(next);
					}}
				/>
			),
		},
		{
			title: t("sys.nav.inventory.product.unit"),
			dataIndex: "unidad_medida",
			width: 120,
			render: (text: string, record, index) => (
				<Input
					value={text}
					onChange={(e) => {
						const next = [...products];
						next[index] = { ...record, unidad_medida: e.target.value };
						setProducts(next);
					}}
				/>
			),
		},
		{
			title: t("sys.nav.inventory.invoice.detail.quantity"),
			dataIndex: "cantidad",
			width: 120,
			align: "right",
			render: (value: number, record, index) => (
				<InputNumber
					value={value}
					min={0}
					precision={4}
					style={{ width: "100%" }}
					onChange={(val) => {
						const next = [...products];
						next[index] = { ...record, cantidad: Number(val ?? 0) };
						setProducts(next);
					}}
				/>
			),
		},
		{
			title: t("sys.nav.inventory.invoice.detail.unit_price"),
			dataIndex: "precio_unitario",
			width: 120,
			align: "right",
			render: (value: number, record, index) => (
				<InputNumber
					value={value}
					min={0}
					precision={4}
					style={{ width: "100%" }}
					onChange={(val) => {
						const next = [...products];
						next[index] = { ...record, precio_unitario: Number(val ?? 0) };
						setProducts(next);
					}}
				/>
			),
		},
		{
			title: t("sys.nav.inventory.invoice.detail.subtotal"),
			dataIndex: "subtotal",
			width: 120,
			align: "right",
			render: (_, record) => (record.cantidad * record.precio_unitario).toFixed(2),
		},
	];

	return (
		<Modal
			title={title ?? t("sys.nav.inventory.invoice.new")}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			confirmLoading={loading}
			okButtonProps={{ disabled: Boolean(loading) || !canSubmit() }}
			width={960}
			destroyOnClose
		>
			{error && <div style={{ color: "#ef4444", marginBottom: 8 }}>Error: {error}</div>}
			<Form<ProcessedInvoiceFormValues> form={form} layout="vertical" initialValues={initValues}>
				<Form.Item name="codigo_interno" label={t("sys.nav.inventory.invoice.code") as string} rules={[{ required: true }]}>
					<Input maxLength={80} />
				</Form.Item>
				<Form.Item name="concepto" label={t("sys.nav.inventory.invoice.concept") as string} rules={[{ required: true }]}>
					<Input maxLength={200} />
				</Form.Item>
				<Form.Item
					name="fecha_movimiento"
					label={t("sys.nav.inventory.invoice.movement_date") as string}
					rules={[{ required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ }]}
				>
					<Input type="date" />
				</Form.Item>
				<Form.Item name="total" label={t("sys.nav.inventory.invoice.total") as string} rules={[{ required: true }]}>
					<InputNumber min={0} precision={2} style={{ width: "100%" }} />
				</Form.Item>
				<Form.Item name="observaciones" label={"Observaciones"}>
					<Input.TextArea maxLength={500} rows={3} />
				</Form.Item>
			</Form>
			<div style={{ marginTop: 16 }}>
				<div style={{ marginBottom: 8, fontWeight: 600 }}>{t("sys.nav.inventory.invoice.detail.add_product")}</div>
				<div className="grid grid-cols-4 gap-3 mb-3">
					<Input
						placeholder={t("sys.nav.inventory.invoice.detail.product") as string}
						value={newProduct.nombre}
						onChange={(e) => setNewProduct((p) => ({ ...p, nombre: e.target.value }))}
					/>
					<Input
						placeholder={t("sys.nav.inventory.product.unit") as string}
						value={newProduct.unidad_medida}
						onChange={(e) => setNewProduct((p) => ({ ...p, unidad_medida: e.target.value }))}
					/>
					<InputNumber
						min={0}
						precision={4}
						placeholder={t("sys.nav.inventory.invoice.detail.quantity") as string}
						value={newProduct.cantidad}
						onChange={(val) => setNewProduct((p) => ({ ...p, cantidad: Number(val ?? 0) }))}
						style={{ width: "100%" }}
					/>
					<div className="flex gap-2">
						<InputNumber
							min={0}
							precision={4}
							placeholder={t("sys.nav.inventory.invoice.detail.unit_price") as string}
							value={newProduct.precio_unitario}
							onChange={(val) => setNewProduct((p) => ({ ...p, precio_unitario: Number(val ?? 0) }))}
							style={{ width: "100%" }}
						/>
						<Button
							onClick={() => {
								if (!canAddProduct) return;
								setProducts((arr) => [...arr, { ...newProduct }]);
								setNewProduct({ nombre: "", unidad_medida: "", cantidad: 0, precio_unitario: 0 });
							}}
							disabled={!canAddProduct || Boolean(loading)}
						>
							{t("sys.nav.inventory.invoice.detail.add_product")}
						</Button>
					</div>
				</div>
				<div style={{ marginBottom: 8, fontWeight: 600 }}>{t("sys.nav.inventory.invoice.detail.index")}</div>
				<Table
					rowKey={(row) => `${row.nombre}-${row.unidad_medida}-${row.id_producto ?? "x"}-${Math.random()}`}
					size="small"
					scroll={{ x: "max-content" }}
					pagination={false}
					loading={Boolean(loading)}
					columns={columns}
					dataSource={products}
					summary={(data) => {
						const sum = data.reduce((acc, r) => acc + r.cantidad * r.precio_unitario, 0);
						return (
							<Table.Summary fixed="bottom">
								<Table.Summary.Row>
									<Table.Summary.Cell index={0} colSpan={4} align="right">
										<strong>{t("sys.nav.inventory.invoice.total")}</strong>
									</Table.Summary.Cell>
									<Table.Summary.Cell index={1} align="right">
										<strong>{sum.toFixed(2)}</strong>
									</Table.Summary.Cell>
								</Table.Summary.Row>
							</Table.Summary>
						);
					}}
				/>
			</div>
		</Modal>
	);
}
