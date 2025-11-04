import { validateEcuadorianID, validateEmail, validatePasswordStrength } from "@/utils/crypto-utils";
import { Form, Input, Modal, Select, Switch } from "antd";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

export interface UserEditFormValues {
	cedula: string;
	nombre_usuario: string;
	correo: string;
	estado: boolean;
}

export interface UserEditModalProps {
	open: boolean;
	title?: string;
	initialValue: UserEditFormValues;
	loading?: boolean;
	error?: string | null;
	onSubmit: (values: UserEditFormValues) => void;
	onCancel: () => void;
}

export function UserEditModal({ open, title, initialValue, loading, error, onSubmit, onCancel }: UserEditModalProps) {
	const [form] = Form.useForm<UserEditFormValues>();
	const { t } = useTranslation();

	useEffect(() => {
		form.setFieldsValue(initialValue);
	}, [initialValue, form]);

	const cedula = Form.useWatch("cedula", form);
	const nombre = Form.useWatch("nombre_usuario", form);
	const correo = Form.useWatch("correo", form);

	const cedulaStatus = useMemo(() => validateEcuadorianID(String(cedula ?? "")), [cedula]);
	const emailStatus = useMemo(() => validateEmail(String(correo ?? "")), [correo]);
	const canSubmit = cedulaStatus.valid && emailStatus.valid && String(nombre ?? "").trim().length > 0;

	const handleOk = () => {
		form
			.validateFields()
			.then((values) => {
				onSubmit({
					cedula: String(values.cedula ?? "").trim(),
					nombre_usuario: String(values.nombre_usuario ?? "").trim(),
					correo: String(values.correo ?? "").trim(),
					estado: Boolean(values.estado),
				});
			})
			.catch(() => {
				// Antd mostrará los errores de validación en el formulario
			});
	};

	return (
		<Modal
			title={title ?? t("sys.nav.user.edit")}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			confirmLoading={loading}
			okButtonProps={{ disabled: Boolean(loading) || !canSubmit }}
			destroyOnClose
		>
			{error && <div style={{ color: "#ef4444", marginBottom: 8 }}>Error: {error}</div>}
			<Form<UserEditFormValues> form={form} layout="vertical" initialValues={initialValue}>
				<Form.Item
					name="cedula"
					label={"Cédula"}
					validateStatus={cedula ? (cedulaStatus.valid ? "success" : "error") : undefined}
					help={cedula ? cedulaStatus.message : undefined}
					rules={[{ required: true, message: "La cédula es requerida" }]}
				>
					<Input placeholder="Ingrese la cédula" maxLength={10} />
				</Form.Item>

				<Form.Item name="nombre_usuario" label={"Usuario"} rules={[{ required: true, message: "El nombre de usuario es requerido" }]}>
					<Input placeholder="Ingrese el nombre de usuario" maxLength={100} />
				</Form.Item>

				<Form.Item
					name="correo"
					label={"Correo"}
					validateStatus={correo ? (emailStatus.valid ? "success" : "error") : undefined}
					help={correo ? emailStatus.message : undefined}
					rules={[{ required: true, message: "El correo es requerido" }]}
				>
					<Input type="email" placeholder="Ingrese el correo electrónico" maxLength={150} />
				</Form.Item>

				<Form.Item name="estado" label={"Estado"} valuePropName="checked">
					<Switch checkedChildren={"Activo"} unCheckedChildren={"Inactivo"} />
				</Form.Item>
			</Form>
		</Modal>
	);
}

export interface RoleOption {
	id: number;
	label: string;
}
export interface UserCreateFormValues {
	cedula: string;
	nombre_usuario: string;
	correo: string;
	password: string;
	rol_id: number;
}

export interface UserCreateModalProps {
	open: boolean;
	title?: string;
	initialValue: UserCreateFormValues;
	roles: RoleOption[];
	loading?: boolean;
	error?: string | null;
	onSubmit: (values: UserCreateFormValues) => void;
	onCancel: () => void;
}

export function UserCreateModal({ open, title, initialValue, roles, loading, error, onSubmit, onCancel }: UserCreateModalProps) {
	const [form] = Form.useForm<UserCreateFormValues>();
	const { t } = useTranslation();

	useEffect(() => {
		form.setFieldsValue(initialValue);
	}, [initialValue, form]);

	const cedula = Form.useWatch("cedula", form);
	const nombre = Form.useWatch("nombre_usuario", form);
	const correo = Form.useWatch("correo", form);
	const password = Form.useWatch("password", form);
	const rolId = Form.useWatch("rol_id", form);

	const cedulaStatus = useMemo(() => validateEcuadorianID(String(cedula ?? "")), [cedula]);
	const emailStatus = useMemo(() => validateEmail(String(correo ?? "")), [correo]);
	const passwordStatus = useMemo(() => validatePasswordStrength(String(password ?? "")), [password]);

	const canSubmit = cedulaStatus.valid && emailStatus.valid && passwordStatus.valid && String(nombre ?? "").trim().length > 0 && Number(rolId ?? 0) > 0;

	const handleOk = () => {
		form
			.validateFields()
			.then((values) => {
				onSubmit({
					cedula: String(values.cedula ?? "").trim(),
					nombre_usuario: String(values.nombre_usuario ?? "").trim(),
					correo: String(values.correo ?? "").trim(),
					password: String(values.password ?? ""),
					rol_id: Number(values.rol_id),
				});
			})
			.catch(() => {
				// Errores de validación se muestran automáticamente
			});
	};

	return (
		<Modal
			title={title ?? t("sys.nav.user.create")}
			open={open}
			onOk={handleOk}
			onCancel={onCancel}
			confirmLoading={loading}
			okButtonProps={{ disabled: Boolean(loading) || !canSubmit }}
			destroyOnClose
		>
			{error && <div style={{ color: "#ef4444", marginBottom: 8 }}>Error: {error}</div>}
			<Form<UserCreateFormValues> form={form} layout="vertical" initialValues={initialValue}>
				<Form.Item
					name="cedula"
					label={"Cédula"}
					validateStatus={cedula ? (cedulaStatus.valid ? "success" : "error") : undefined}
					help={cedula ? cedulaStatus.message : undefined}
					rules={[{ required: true, message: "La cédula es requerida" }]}
				>
					<Input placeholder="Ingrese la cédula" />
				</Form.Item>

				<Form.Item name="nombre_usuario" label={"Usuario"} rules={[{ required: true, message: "El nombre de usuario es requerido" }]}>
					<Input placeholder="Nombre de usuario" />
				</Form.Item>

				<Form.Item
					name="correo"
					label={"Correo"}
					validateStatus={correo ? (emailStatus.valid ? "success" : "error") : undefined}
					help={correo ? emailStatus.message : undefined}
					rules={[{ required: true, message: "El correo es requerido" }]}
				>
					<Input type="email" placeholder="correo@dominio.com" />
				</Form.Item>

				<Form.Item
					name="password"
					label={"Contraseña"}
					validateStatus={password ? (passwordStatus.valid ? "success" : "error") : undefined}
					help={password ? passwordStatus.message : undefined}
					rules={[{ required: true, message: "La contraseña es requerida" }]}
				>
					<Input.Password placeholder="Contraseña segura" />
				</Form.Item>

				<Form.Item name="rol_id" label={"Rol"} rules={[{ required: true, message: "El rol es requerido" }]}>
					<Select placeholder="Seleccione un rol">
						{roles.map((r) => (
							<Select.Option key={r.id} value={r.id}>
								{r.label}
							</Select.Option>
						))}
					</Select>
				</Form.Item>
			</Form>
		</Modal>
	);
}
