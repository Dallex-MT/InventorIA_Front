import { Form, Input, Modal, Switch } from "antd";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface CategoryEditFormValues {
	nombre: string;
	descripcion: string;
	activo: boolean;
}

export interface CategoryEditModalProps {
	open: boolean;
	title?: string;
	initialValue: CategoryEditFormValues;
	// Indicador de modo creación. Si es true, el modal funciona para crear.
	isCreate?: boolean;
	loading?: boolean;
	error?: string | null;
	onSubmit: (values: CategoryEditFormValues) => void;
	onCancel: () => void;
}

// Modal reutilizable para edición y creación de categorías.
// Mantiene la misma UI y aplica lógica condicional según el modo.
export function CategoryEditModal({ open, title, initialValue, isCreate = false, loading, error, onSubmit, onCancel }: CategoryEditModalProps) {
	const [form] = Form.useForm<CategoryEditFormValues>();
	const { t } = useTranslation();

	// Normalizar valores iniciales, asegurando "activo" por defecto en true.
	const normalizedInitial: CategoryEditFormValues = useMemo(() => {
		return {
			nombre: String(initialValue?.nombre ?? ""),
			descripcion: String(initialValue?.descripcion ?? ""),
			activo: initialValue?.activo !== undefined ? Boolean(initialValue.activo) : true,
		};
	}, [initialValue]);

	// Al abrir el modal, establecer los valores iniciales.
	// En modo creación, opcionalmente resetear para limpiar campos.
	useEffect(() => {
		if (open) {
			if (isCreate) {
				form.resetFields();
			}
			form.setFieldsValue(normalizedInitial);
		}
	}, [open, isCreate, normalizedInitial, form]);

	const nombre = Form.useWatch("nombre", form);
	const canSubmit = useMemo(() => Boolean(String(nombre ?? "").trim()), [nombre]);

	const handleOk = () => {
		form
			.validateFields()
			.then((values) => {
				onSubmit({
					nombre: String(values.nombre ?? "").trim(),
					descripcion: String(values.descripcion ?? "").trim(),
					activo: Boolean(values.activo),
				});
			})
			.catch(() => {
				// Errores de validación se muestran en el formulario
			});
	};

	return (
		<Modal
			title={title ?? t("sys.nav.inventory.category.edit")}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			confirmLoading={loading}
			okButtonProps={{ disabled: Boolean(loading) || !canSubmit }}
			destroyOnClose
		>
			{error && <div style={{ color: "#ef4444", marginBottom: 8 }}>Error: {error}</div>}
			<Form<CategoryEditFormValues> form={form} layout="vertical" initialValues={normalizedInitial}>
				<Form.Item
					name="nombre"
					label={t("sys.nav.inventory.category.name") as string}
					rules={[{ required: true, message: `${t("sys.nav.inventory.category.name")} es requerido` }]}
				>
					<Input placeholder={t("sys.nav.inventory.category.name") as string} maxLength={100} />
				</Form.Item>

				<Form.Item
					name="descripcion"
					label={t("sys.nav.inventory.category.description") as string}
					// Campo opcional en modo creación/edición
					rules={[{ required: false }]}
				>
					<Input.TextArea rows={4} maxLength={500} showCount placeholder={t("sys.nav.inventory.category.description") as string} />
				</Form.Item>

				<Form.Item name="activo" label={t("sys.nav.inventory.category.status.index") as string} valuePropName="checked">
					<Switch
						checkedChildren={t("sys.nav.inventory.category.status.active") as string}
						unCheckedChildren={t("sys.nav.inventory.category.status.inactive") as string}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
}
