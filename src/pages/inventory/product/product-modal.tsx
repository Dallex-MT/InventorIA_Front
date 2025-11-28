import { Form, Input, InputNumber, Modal, Select, Switch } from "antd";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface ProductEditFormValues {
	nombre: string;
	descripcion: string;
	categoria_id: number;
	unidad_medida: string;
	stock_actual: number;
	stock_minimo: number;
	precio_referencia: number;
	activo: boolean;
}

export interface ProductEditModalProps {
	open: boolean;
	title?: string;
	initialValue: ProductEditFormValues;
	categorias?: { id: number; label: string }[]; // opcional si se desea listar categorías
	unidades?: string[]; // opcional si se desea listar unidades comunes
	categoriesLoading?: boolean;
	loading?: boolean;
	error?: string | null;
	// Modo creación: reutiliza el mismo modal para crear nuevos registros
	isCreate?: boolean;
	onSubmit: (values: ProductEditFormValues) => void;
	onCancel: () => void;
}

export function ProductEditModal({
	open,
	title,
	initialValue,
	categorias = [],
	unidades = [],
	categoriesLoading,
	loading,
	error,
	isCreate = false,
	onSubmit,
	onCancel,
}: ProductEditModalProps) {
	const [form] = Form.useForm<ProductEditFormValues>();
	const { t } = useTranslation();

	// Normalizar valores iniciales para asegurar tipos y defaults coherentes
	const normalizedInitial: ProductEditFormValues = useMemo(() => {
		return {
			nombre: String(initialValue?.nombre ?? ""),
			descripcion: String(initialValue?.descripcion ?? ""),
			categoria_id: Number(initialValue?.categoria_id ?? 0),
			unidad_medida: String(initialValue?.unidad_medida ?? ""),
			stock_actual: Number(initialValue?.stock_actual ?? 0),
			stock_minimo: Number(initialValue?.stock_minimo ?? 0),
			precio_referencia: Number(initialValue?.precio_referencia ?? 0),
			activo: initialValue?.activo !== undefined ? Boolean(initialValue.activo) : true,
		};
	}, [initialValue]);

	// Al abrir, si es creación, resetea; luego aplica initial values normalizados
	useEffect(() => {
		if (open) {
			if (isCreate) {
				form.resetFields();
			}
			form.setFieldsValue(normalizedInitial);
		}
	}, [open, isCreate, normalizedInitial, form]);

	const nombre = Form.useWatch("nombre", form);
	const descripcion = Form.useWatch("descripcion", form);
	const canSubmit = useMemo(() => Boolean(String(nombre ?? "").trim()) && Boolean(String(descripcion ?? "").trim()), [nombre, descripcion]);

	const handleOk = () => {
		form
			.validateFields()
			.then((values) => {
				onSubmit({
					nombre: String(values.nombre ?? "").trim(),
					descripcion: String(values.descripcion ?? "").trim(),
					categoria_id: Number(values.categoria_id),
					unidad_medida: String(values.unidad_medida ?? ""),
					stock_actual: Number(values.stock_actual ?? 0),
					stock_minimo: Number(values.stock_minimo ?? 0),
					precio_referencia: Number(values.precio_referencia ?? 0),
					activo: Boolean(values.activo),
				});
			})
			.catch(() => {
				// Antd mostrará los errores de validación en el formulario
			});
	};

	return (
		<Modal
			// Título condicional acorde al modo
			title={title ?? (isCreate ? t("sys.nav.inventory.product.new") : t("sys.nav.inventory.product.edit"))}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			confirmLoading={loading}
			okButtonProps={{ disabled: Boolean(loading) || !canSubmit }}
			destroyOnClose
		>
			{error && <div style={{ color: "#ef4444", marginBottom: 8 }}>Error: {error}</div>}
			{/* Formulario reutilizable para crear/editar productos */}
			<Form<ProductEditFormValues> form={form} layout="vertical" initialValues={normalizedInitial}>
				<Form.Item
					name="nombre"
					label={t("sys.nav.inventory.product.name") as string}
					rules={[{ required: true, message: `${t("sys.nav.inventory.product.name")} es requerido` }]}
				>
					<Input placeholder={t("sys.nav.inventory.product.name") as string} maxLength={100} />
				</Form.Item>

				<Form.Item
					name="descripcion"
					label={t("sys.nav.inventory.product.description") as string}
					rules={[{ required: true, message: `${t("sys.nav.inventory.product.description")} es requerido` }]}
				>
					<Input.TextArea rows={4} maxLength={500} showCount placeholder={t("sys.nav.inventory.product.description") as string} />
				</Form.Item>

				<Form.Item
					name="categoria_id"
					label={t("sys.nav.inventory.category.index") as string}
					rules={[{ required: true, message: `${t("sys.nav.inventory.category.index")} es requerido` }]}
				>
					<Select placeholder={t("sys.nav.inventory.category.index") as string} allowClear loading={categoriesLoading}>
						{categorias.map((c) => (
							<Select.Option key={c.id} value={c.id}>
								{c.label}
							</Select.Option>
						))}
					</Select>
				</Form.Item>

				<Form.Item
					name="unidad_medida"
					label={t("sys.nav.inventory.product.unit") as string}
					rules={[{ required: true, message: `${t("sys.nav.inventory.product.unit")} es requerido` }]}
				>
					<Select placeholder={t("sys.nav.inventory.product.unit") as string} allowClear>
						{unidades.length > 0 ? (
							unidades.map((u) => (
								<Select.Option key={u} value={u}>
									{u}
								</Select.Option>
							))
						) : (
							<>
								<Select.Option value="kg">kg</Select.Option>
								<Select.Option value="lb">lb</Select.Option>
								<Select.Option value="und">und</Select.Option>
							</>
						)}
					</Select>
				</Form.Item>

				<Form.Item
					name="stock_actual"
					label={t("sys.nav.inventory.product.stock.current") as string}
					rules={[{ required: true, message: `${t("sys.nav.inventory.product.stock.current")} es requerido` }]}
				>
					<InputNumber min={0} step={0.0001} style={{ width: "100%" }} />
				</Form.Item>

				<Form.Item
					name="stock_minimo"
					label={t("sys.nav.inventory.product.stock.minimum") as string}
					rules={[{ required: true, message: `${t("sys.nav.inventory.product.stock.minimum")} es requerido` }]}
				>
					<InputNumber min={0} step={0.0001} style={{ width: "100%" }} />
				</Form.Item>

				<Form.Item
					name="precio_referencia"
					label={t("sys.nav.inventory.product.ref_price") as string}
					rules={[{ required: true, message: `${t("sys.nav.inventory.product.ref_price")} es requerido` }]}
				>
					<InputNumber min={0} step={0.01} style={{ width: "100%" }} />
				</Form.Item>

				<Form.Item name="activo" label={t("sys.nav.inventory.product.status.index") as string} valuePropName="checked">
					<Switch
						checkedChildren={t("sys.nav.inventory.product.status.active") as string}
						unCheckedChildren={t("sys.nav.inventory.product.status.inactive") as string}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
}
