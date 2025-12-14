import type { InvoiceImageProcessData, InvoiceImageProcessProduct } from "@/api/services/invoiceService";
import { Button } from "@/ui/button";
import { AutoComplete, Form, Input, InputNumber, Modal, Select, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useRef, useState } from "react";
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

import categoryService from "@/api/services/categoryService";
import productService, { type UnitMeasureInfo } from "@/api/services/productService";
import { type ProductEditFormValues, ProductEditModal } from "@/pages/inventory/product/product-modal";

export function InvoiceProcessModal({ open, title, initialData, loading, error, onSubmit, onCancel }: InvoiceProcessEditModalProps) {
	const [form] = Form.useForm<ProcessedInvoiceFormValues>();
	const { t } = useTranslation();

	const [unitOptions, setUnitOptions] = useState<{ value: string; label: string }[]>([]);
	const [unitMeasures, setUnitMeasures] = useState<UnitMeasureInfo[]>([]);
	const [categories, setCategories] = useState<{ id: number; label: string }[]>([]);
	const [categoriesLoading, setCategoriesLoading] = useState(false);
	const [productModalOpen, setProductModalOpen] = useState(false);
	const [productModalLoading, setProductModalLoading] = useState(false);
	const [productModalError, setProductModalError] = useState<string | null>(null);
	const [currentMissingIndex, setCurrentMissingIndex] = useState<number | null>(null);
	const [progress, setProgress] = useState({ done: 0, total: 0 });
	const [autoAssignFlow, setAutoAssignFlow] = useState(false);
	const [reviewOpen, setReviewOpen] = useState(false);
	const [reviewComputedTotal, setReviewComputedTotal] = useState(0);
	const [reviewEnteredTotal, setReviewEnteredTotal] = useState(0);
	const [reviewMissingIds, setReviewMissingIds] = useState<number[]>([]);
	const [reviewMissingFields, setReviewMissingFields] = useState<string[]>([]);
	const [reviewHasDiscrepancy, setReviewHasDiscrepancy] = useState(false);

	useEffect(() => {
		let mounted = true;
		const loadUnits = async () => {
			try {
				const res = await productService.getUnitMeasures();
				if (mounted && res.success) {
					setUnitMeasures(res.data);
					const next = res.data.map((u) => ({ value: u.abreviatura || u.nombre, label: `${u.nombre} (${u.abreviatura})` }));
					setUnitOptions((prev) => {
						const same = prev.length === next.length && prev.every((p, i) => p.value === next[i].value && p.label === next[i].label);
						if (!same) {
							if (import.meta.env.DEV) console.debug("InvoiceProcessModal: unidades actualizadas", next.length);
							return next;
						}
						return prev;
					});
				} else if (mounted) {
					const next = [
						{ value: "kg", label: "Kilogramo (kg)" },
						{ value: "lb", label: "Libra (lb)" },
						{ value: "und", label: "Unidad (und)" },
					];
					setUnitOptions((prev) => {
						const same = prev.length === next.length && prev.every((p, i) => p.value === next[i].value && p.label === next[i].label);
						return same ? prev : next;
					});
				}
			} catch {
				if (mounted) {
					const next = [
						{ value: "kg", label: "Kilogramo (kg)" },
						{ value: "lb", label: "Libra (lb)" },
						{ value: "und", label: "Unidad (und)" },
					];
					setUnitOptions((prev) => {
						const same = prev.length === next.length && prev.every((p, i) => p.value === next[i].value && p.label === next[i].label);
						return same ? prev : next;
					});
				}
			}
		};
		loadUnits();
		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		let mounted = true;
		const loadCategories = async () => {
			try {
				setCategoriesLoading(true);
				const res = await categoryService.getCategories({ page: 1, limit: 100, active: true });
				const list = Array.isArray(res.data?.categories) ? res.data?.categories : [];
				const next = list.map((c) => ({ id: Number(c.id), label: String(c.nombre) }));
				if (mounted) setCategories(next);
			} catch {
				if (mounted) setCategories([]);
			} finally {
				if (mounted) setCategoriesLoading(false);
			}
		};
		if (open) loadCategories();
		return () => {
			mounted = false;
		};
	}, [open]);

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const missing = products.map((p, i) => (p.id_producto ? null : i)).filter((x): x is number => x !== null);
		setProgress((prev) => ({ done: Math.min(prev.done, missing.length), total: missing.length }));
		if (autoAssignFlow && missing.length > 0 && !productModalOpen) {
			setCurrentMissingIndex(missing[0]);
			setProductModalError(null);
			if (import.meta.env.DEV) console.debug("InvoiceProcessModal:openProductModal", missing[0]);
			setProductModalOpen(true);
		}
		if (missing.length === 0) {
			setCurrentMissingIndex(null);
			if (import.meta.env.DEV) console.debug("InvoiceProcessModal:allProductsAssigned");
			setProductModalOpen(false);
			if (autoAssignFlow) setAutoAssignFlow(false);
		}
	}, [products, autoAssignFlow]);

	void form;

	const resolveUnitId = (label: string) => {
		const x = String(label || "")
			.trim()
			.toLowerCase();
		const found = unitMeasures.find((u) => u.abreviatura.toLowerCase() === x || u.nombre.toLowerCase() === x);
		return found ? Number(found.id) : 0;
	};

	const currentProductInitial: ProductEditFormValues | null = (() => {
		if (currentMissingIndex === null) return null;
		const p = products[currentMissingIndex];
		const unitId = resolveUnitId(p.unidad_medida);
		const desc = p.nombre ? `Producto ${p.nombre}` : "";
		return {
			nombre: p.nombre || "",
			descripcion: desc,
			categoria_id: 0,
			unidad_medida_id: unitId,
			stock_actual: 0,
			stock_minimo: 0,
			precio_referencia: Number(p.precio_unitario || 0),
			activo: true,
		};
	})();

	const handleOk = () => {
		form
			.validateFields()
			.then((values) => {
				const enteredTotal = Number(values.total ?? 0);
				const computedTotal = products.reduce((acc, p) => acc + Number(p.cantidad ?? 0) * Number(p.precio_unitario ?? 0), 0);
				const missingIds = products.map((p, i) => (p.id_producto && p.id_producto > 0 ? null : i)).filter((x): x is number => x !== null);
				const missingFields: string[] = [];
				if (!String(values.codigo_interno ?? "").trim()) missingFields.push("Código interno");
				if (!String(values.concepto ?? "").trim()) missingFields.push("Concepto");
				if (!/^\d{4}-\d{2}-\d{2}$/.test(String(values.fecha_movimiento ?? ""))) missingFields.push("Fecha de movimiento");
				if (!Number.isFinite(enteredTotal)) missingFields.push("Total");
				const hasDiscrepancy = Math.abs(enteredTotal - computedTotal) > 0.01;

				setReviewEnteredTotal(enteredTotal);
				setReviewComputedTotal(computedTotal);
				setReviewMissingIds(missingIds);
				setReviewMissingFields(missingFields);
				setReviewHasDiscrepancy(hasDiscrepancy);
				setReviewOpen(true);
			})
			.catch(() => {});
	};

	const finalizeSubmit = () => {
		const v = form.getFieldsValue();
		const payload: ProcessedInvoiceFormValues = {
			codigo_interno: String(v.codigo_interno ?? "").trim(),
			concepto: String(v.concepto ?? "").trim(),
			fecha_movimiento: String(v.fecha_movimiento ?? "").trim(),
			total: Number(v.total ?? 0),
			observaciones: String(v.observaciones ?? ""),
			productos: products.map((p) => ({
				id_producto: p.id_producto,
				nombre: String(p.nombre ?? "").trim(),
				unidad_medida: String(p.unidad_medida ?? "").trim(),
				cantidad: Number(p.cantidad ?? 0),
				precio_unitario: Number(p.precio_unitario ?? 0),
			})),
		};
		onSubmit(payload);
	};

	const handleConfirmReview = () => {
		if (reviewMissingFields.length > 0) {
			setReviewOpen(false);
			return; // el usuario debe corregir en el formulario
		}
		if (reviewMissingIds.length > 0) {
			setAutoAssignFlow(true);
			return; // iniciará el flujo de IDs y luego podrá confirmar de nuevo
		}
		// permitir enviar con discrepancia si el usuario confirma
		finalizeSubmit();
	};

	const columns: ColumnsType<ProcessedProductEdit> = [
		{
			title: t("sys.nav.inventory.invoice.detail.product"),
			dataIndex: "nombre",
			width: 200,
			render: (text: string, record, index) => (
				<ProductNameAutoComplete
					value={text}
					placeholder={t("sys.nav.inventory.invoice.detail.product") as string}
					onChange={(val) => {
						const next = [...products];
						next[index] = { ...record, nombre: String(val ?? "") };
						setProducts(next);
					}}
					onSelectProduct={(p) => {
						const next = [...products];
						next[index] = {
							...record,
							nombre: String(p?.nombre ?? record.nombre),
							id_producto: Number(p?.id ?? record.id_producto ?? 0) || undefined,
							unidad_medida: String(p?.unidad_medida?.abreviatura ?? p?.unidad_medida?.nombre ?? record.unidad_medida ?? ""),
						};
						setProducts(next);
					}}
				/>
			),
		},
		{
			title: t("sys.nav.inventory.product.unit"),
			dataIndex: "unidad_medida",
			width: 140,
			render: (text: string, record, index) => (
				<Select
					value={text || undefined}
					showSearch
					allowClear
					style={{ width: "100%" }}
					options={unitOptions}
					optionFilterProp="label"
					filterOption={(input, option) => ((option?.label as string) || "").toLowerCase().includes(input.toLowerCase())}
					onChange={(val) => {
						const next = [...products];
						next[index] = { ...record, unidad_medida: String(val ?? "") };
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
			okButtonProps={{ disabled: Boolean(loading) || products.length === 0 }}
			maskClosable={!productModalOpen && !(progress.total > 0 && progress.done < progress.total)}
			keyboard={!productModalOpen && !(progress.total > 0 && progress.done < progress.total)}
			closable={!productModalOpen && !(progress.total > 0 && progress.done < progress.total)}
			width={960}
			destroyOnClose
		>
			{error && <div style={{ color: "#ef4444", marginBottom: 8 }}>Error: {error}</div>}
			{progress.total > 0 && <div style={{ marginBottom: 8, fontSize: 12 }}>{`Progreso: ${progress.done} de ${progress.total} productos completados`}</div>}
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
					<ProductNameAutoComplete
						value={newProduct.nombre}
						placeholder={t("sys.nav.inventory.invoice.detail.product") as string}
						onChange={(val) => setNewProduct((p) => ({ ...p, nombre: String(val ?? "") }))}
						onSelectProduct={(p) =>
							setNewProduct((np) => ({
								...np,
								nombre: String(p?.nombre ?? np.nombre),
								unidad_medida: String(p?.unidad_medida?.abreviatura ?? p?.unidad_medida?.nombre ?? np.unidad_medida ?? ""),
							}))
						}
					/>
					<Select
						placeholder={t("sys.nav.inventory.product.unit") as string}
						value={newProduct.unidad_medida || undefined}
						showSearch
						allowClear
						options={unitOptions}
						optionFilterProp="label"
						filterOption={(input, option) => ((option?.label as string) || "").toLowerCase().includes(input.toLowerCase())}
						onChange={(val) => setNewProduct((p) => ({ ...p, unidad_medida: String(val ?? "") }))}
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
					<Modal
						title={"Revisión de factura"}
						open={reviewOpen}
						onOk={handleConfirmReview}
						onCancel={() => setReviewOpen(false)}
						okText={"Confirmar y enviar"}
						cancelText={"Corregir"}
						width={800}
						destroyOnClose
					>
						<div className="mb-2 text-sm">Resumen de la factura</div>
						<div className="grid grid-cols-2 gap-3 mb-3">
							<div>
								<div className="text-xs text-muted-foreground">Código interno</div>
								<div>{form.getFieldValue("codigo_interno") || "—"}</div>
							</div>
							<div>
								<div className="text-xs text-muted-foreground">Concepto</div>
								<div>{form.getFieldValue("concepto") || "—"}</div>
							</div>
							<div>
								<div className="text-xs text-muted-foreground">Fecha de movimiento</div>
								<div>{form.getFieldValue("fecha_movimiento") || "—"}</div>
							</div>
							<div>
								<div className="text-xs text-muted-foreground">Información del cliente</div>
								<div>{"No disponible"}</div>
							</div>
						</div>
						<Table
							rowKey={(row) => `${row.nombre}-${row.unidad_medida}-${row.id_producto ?? "x"}-${Math.random()}`}
							size="small"
							pagination={false}
							columns={[
								{ title: "Producto", dataIndex: "nombre", width: 200 },
								{ title: "Unidad", dataIndex: "unidad_medida", width: 120 },
								{ title: "Cantidad", dataIndex: "cantidad", width: 120, align: "right", render: (v: number) => Number(v).toFixed(4) },
								{ title: "Precio", dataIndex: "precio_unitario", width: 120, align: "right", render: (v: number) => Number(v).toFixed(4) },
								{
									title: "Subtotal",
									dataIndex: "subtotal",
									width: 120,
									align: "right",
									render: (_: any, r: any) => (Number(r.cantidad) * Number(r.precio_unitario)).toFixed(2),
								},
								{
									title: "ID",
									dataIndex: "id_producto",
									width: 100,
									align: "center",
									render: (id: number | undefined) => (id && id > 0 ? id : "—"),
								},
							]}
							dataSource={products}
							summary={(data) => {
								const sum = data.reduce((acc, r) => acc + Number(r.cantidad) * Number(r.precio_unitario), 0);
								return (
									<Table.Summary fixed="bottom">
										<Table.Summary.Row>
											<Table.Summary.Cell index={0} colSpan={4} align="right">
												<strong>Total calculado</strong>
											</Table.Summary.Cell>
											<Table.Summary.Cell index={1} align="right">
												<strong>{sum.toFixed(2)}</strong>
											</Table.Summary.Cell>
										</Table.Summary.Row>
									</Table.Summary>
								);
							}}
						/>

						<div className="mt-3 text-sm">
							<div>Total ingresado: {reviewEnteredTotal.toFixed(2)}</div>
							<div>Total calculado: {reviewComputedTotal.toFixed(2)}</div>
							{reviewHasDiscrepancy && <div className="text-amber-600">Advertencia: discrepancia entre el total ingresado y el calculado.</div>}
							{reviewMissingIds.length > 0 && <div className="text-red-600 mt-1">Hay productos sin ID. Puedes completar IDs antes de enviar.</div>}
							{reviewMissingFields.length > 0 && <div className="text-red-600 mt-1">Faltan datos requeridos: {reviewMissingFields.join(", ")}</div>}
						</div>
					</Modal>
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
			{currentProductInitial && (
				<ProductEditModal
					open={productModalOpen}
					title={t("sys.nav.inventory.product.new") as string}
					initialValue={currentProductInitial}
					categorias={categories}
					categoriesLoading={categoriesLoading}
					isCreate
					freezeStockActual
					disableClose
					loading={productModalLoading}
					error={productModalError}
					onSubmit={async (values) => {
						setProductModalLoading(true);
						setProductModalError(null);
						try {
							const createRes = await productService.createProduct({
								nombre: values.nombre,
								descripcion: values.descripcion,
								categoria_id: values.categoria_id,
								unidad_medida_id: values.unidad_medida_id,
								stock_actual: 0,
								stock_minimo: values.stock_minimo,
								precio_referencia: values.precio_referencia,
								activo: values.activo,
							});
							if (!createRes.success) {
								setProductModalError(createRes.message || "Error al crear producto");
								if (import.meta.env.DEV) console.error("InvoiceProcessModal:createProduct:error", createRes);
								return;
							}
							if (import.meta.env.DEV) console.debug("InvoiceProcessModal:createProduct:ok", createRes.data?.id);
							const createdId = Number(createRes.data?.id ?? 0);
							const searchRes = await productService.getProducts({ page: 1, limit: 1, search: values.nombre });
							const found = Array.isArray(searchRes.data?.products) ? searchRes.data?.products[0] : undefined;
							if (import.meta.env.DEV) console.debug("InvoiceProcessModal:searchProduct", found?.id);
							const resolvedId = createdId || Number(found?.id ?? 0);
							if (!resolvedId) {
								setProductModalError("No se pudo resolver el ID del producto creado");
								if (import.meta.env.DEV) console.error("InvoiceProcessModal:resolveId:error", { createdId, found });
								return;
							}
							const nextProducts = (() => {
								if (currentMissingIndex === null) return products;
								const next = [...products];
								const uLabel = found?.unidad_medida?.abreviatura || found?.unidad_medida?.nombre || next[currentMissingIndex].unidad_medida;
								next[currentMissingIndex] = {
									...next[currentMissingIndex],
									id_producto: resolvedId,
									unidad_medida: String(uLabel || next[currentMissingIndex].unidad_medida),
								};
								return next;
							})();
							setProducts(nextProducts);
							setProgress((p) => ({ done: p.done + 1, total: p.total }));
							const miss = nextProducts.map((pr, i) => (pr.id_producto ? null : i)).filter((x): x is number => x !== null);
							const nextIdx = miss.find((i) => i > (currentMissingIndex ?? -1)) ?? miss[0] ?? null;
							if (nextIdx !== null && miss.length > 0) {
								setCurrentMissingIndex(nextIdx);
								setProductModalError(null);
								setProductModalOpen(true);
							} else {
								setCurrentMissingIndex(null);
								setProductModalOpen(false);
								setAutoAssignFlow(false);
								setReviewMissingIds([]);
								setReviewOpen(true);
							}
						} catch (e: any) {
							setProductModalError(e?.message || "Error de red al crear producto");
						} finally {
							setProductModalLoading(false);
						}
					}}
					onCancel={() => {}}
				/>
			)}
		</Modal>
	);
}
const ProductNameAutoComplete = ({
	value,
	onChange,
	onSelectProduct,
	placeholder,
	autoFocus,
}: {
	value: string;
	onChange: (val: string) => void;
	onSelectProduct?: (p: any) => void;
	placeholder?: string;
	autoFocus?: boolean;
}) => {
	const [options, setOptions] = useState<{ value: string; label: string; data?: any }[]>([]);
	const [loadingSearch, setLoadingSearch] = useState(false);
	const [errorSearch, setErrorSearch] = useState<string | null>(null);
	const debounceRef = useRef<number | null>(null);
	const reqRef = useRef(0);
	const handleSearch = (q: string) => {
		onChange(q);
		setErrorSearch(null);
		if (debounceRef.current) window.clearTimeout(debounceRef.current);
		const normalized = String(q || "").trim();
		const validLen = normalized.replace(/\s+/g, "").length;
		if (validLen < 3) {
			setOptions([]);
			setLoadingSearch(false);
			return;
		}
		debounceRef.current = window.setTimeout(async () => {
			const id = ++reqRef.current;
			setLoadingSearch(true);
			try {
				const res = await productService.getProducts({ page: 1, limit: 10, search: normalized });
				if (id !== reqRef.current) return;
				const list = Array.isArray(res.data?.products) ? res.data?.products : [];
				const lower = normalized.toLowerCase();
				const sorted = [...list].sort((a, b) => {
					const an = String(a.nombre || "").toLowerCase();
					const bn = String(b.nombre || "").toLowerCase();
					const as = an.startsWith(lower);
					const bs = bn.startsWith(lower);
					if (as && !bs) return -1;
					if (!as && bs) return 1;
					const ai = an.includes(lower);
					const bi = bn.includes(lower);
					if (ai && !bi) return -1;
					if (!ai && bi) return 1;
					return an.localeCompare(bn);
				});
				setOptions(
					sorted.map((p) => ({
						value: String(p.nombre ?? ""),
						label: String(p.nombre ?? ""),
						data: p,
					})),
				);
			} catch (e: any) {
				if (id !== reqRef.current) return;
				setOptions([]);
				setErrorSearch(e?.message || "Error al buscar");
			} finally {
				if (id === reqRef.current) setLoadingSearch(false);
			}
		}, 300);
	};
	return (
		<AutoComplete
			value={value}
			options={options}
			onSearch={handleSearch}
			onChange={(val) => onChange(String(val ?? ""))}
			onSelect={(_, option) => {
				const data = (option as any)?.data;
				if (data && onSelectProduct) onSelectProduct(data);
			}}
			placeholder={placeholder}
			filterOption={false}
			autoFocus={autoFocus}
			notFoundContent={loadingSearch ? <Spin size="small" /> : errorSearch ? <div style={{ color: "#ef4444" }}>{errorSearch}</div> : "Sin coincidencias"}
			style={{ width: "100%" }}
		/>
	);
};
