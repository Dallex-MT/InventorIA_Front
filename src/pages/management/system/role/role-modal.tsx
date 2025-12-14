import { Icon } from "@/components/icon";
import { Form, Input, Modal, Select, Switch, Tag, Tooltip } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PermissionInfo, Role } from "#/entity";

export interface RoleModalProps {
	formValue: Role;
	title: string;
	show: boolean;
	permissionsOptions: PermissionInfo[];
	isEdit?: boolean;
	loading?: boolean;
	onSubmit: (values: { nombre: string; descripcion: string; activo: boolean; permisos: number[] }) => void;
	onCancel: () => void;
}

export function RoleModal({ formValue, title, show, permissionsOptions, isEdit, loading, onSubmit, onCancel }: RoleModalProps) {
	const [form] = Form.useForm();
	const { t } = useTranslation();

	const adminId = useMemo(() => permissionsOptions.find((p) => p.nombre.toLowerCase() === "admin")?.id, [permissionsOptions]);
	const lecturaId = useMemo(() => permissionsOptions.find((p) => p.nombre.toLowerCase() === "lectura")?.id, [permissionsOptions]);
	const escrituraId = useMemo(() => permissionsOptions.find((p) => p.nombre.toLowerCase() === "escritura")?.id, [permissionsOptions]);

	const [selectedPermisos, setSelectedPermisos] = useState<number[]>([]);
	const [lockLectura, setLockLectura] = useState<boolean>(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		const base = (formValue?.permisos || []).map((p) => p.id);
		const hasEscritura = escrituraId !== undefined && base.includes(escrituraId);
		const mustIncludeLectura = hasEscritura && lecturaId !== undefined && !base.includes(lecturaId);
		const next = mustIncludeLectura && lecturaId !== undefined ? [...base, lecturaId] : base;
		setSelectedPermisos(next);
		setLockLectura(Boolean(hasEscritura));
		form.setFieldsValue({
			nombre: formValue?.nombre,
			descripcion: formValue?.descripcion,
			activo: formValue?.activo,
			permisos: next,
		});
	}, [formValue, form, lecturaId, escrituraId, show]);

	return (
		<Modal
			title={title}
			open={show}
			onOk={() => {
				form.validateFields().then((values) => {
					const seleccion: number[] = Array.isArray(values.permisos) ? values.permisos : [];
					const hasEscritura = escrituraId !== undefined && seleccion.includes(escrituraId);
					const includeLectura = hasEscritura && lecturaId !== undefined && !seleccion.includes(lecturaId);
					const finalSel = includeLectura && lecturaId !== undefined ? [...seleccion, lecturaId] : seleccion;
					onSubmit({
						nombre: String(values.nombre ?? "").trim(),
						descripcion: String(values.descripcion ?? "").trim(),
						activo: Boolean(values.activo),
						permisos: finalSel,
					});
				});
			}}
			onCancel={onCancel}
			destroyOnClose
			confirmLoading={Boolean(loading)}
		>
			<Form form={form} layout="vertical">
				<Form.Item name="nombre" label={t("sys.nav.system.role.name")} rules={[{ required: true, message: t("sys.nav.system.role.name_required") }]}>
					<Input maxLength={50} showCount />
				</Form.Item>
				<Form.Item name="descripcion" label={t("sys.nav.system.role.description")}>
					<Input.TextArea rows={4} maxLength={500} showCount />
				</Form.Item>
				<Form.Item name="activo" label={t("sys.nav.system.role.status")} valuePropName="checked">
					<Switch checkedChildren={t("sys.nav.system.role.active")} unCheckedChildren={t("sys.nav.system.role.inactive")} />
				</Form.Item>
				<Form.Item name="permisos" label={"Permisos"} rules={[{ required: true, message: "Seleccione al menos un permiso" }]}>
					<Select
						mode="multiple"
						options={permissionsOptions.map((p) => ({ label: p.nombre, value: p.id, disabled: lockLectura && lecturaId !== undefined && p.id === lecturaId }))}
						disabled={Boolean(isEdit) && (formValue?.permisos || []).some((p) => p.nombre.toLowerCase() === "admin")}
						value={selectedPermisos}
						tagRender={(props) => {
							const locked = lockLectura && lecturaId !== undefined && props.value === lecturaId;
							const closable = !locked && props.closable;
							const onClose = locked ? (e: any) => e.preventDefault() : props.onClose;
							const node = (
								<Tag closable={closable} onClose={onClose} style={{ marginInlineEnd: 4 }}>
									{props.label}
									{locked && <Icon icon="material-symbols:lock" size={14} className="ml-1" />}
								</Tag>
							);
							return locked ? <Tooltip title={"Lectura está bloqueado mientras Escritura esté seleccionado"}>{node}</Tooltip> : node;
						}}
						onChange={(values: number[]) => {
							if (adminId !== undefined && values.includes(adminId) && values.length > 1) {
								setSelectedPermisos([adminId]);
								setLockLectura(false);
								form.setFieldsValue({ permisos: [adminId] });
								return;
							}
							const hasEscritura = escrituraId !== undefined && values.includes(escrituraId);
							const mustIncludeLectura = hasEscritura && lecturaId !== undefined && !values.includes(lecturaId);
							const next = mustIncludeLectura && lecturaId !== undefined ? [...values, lecturaId] : values;
							setSelectedPermisos(next);
							setLockLectura(Boolean(hasEscritura));
							form.setFieldsValue({ permisos: next });
						}}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
}
