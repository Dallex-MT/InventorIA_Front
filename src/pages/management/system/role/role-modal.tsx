import { Form, Input, Modal, Switch } from "antd";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import type { Role } from "#/entity";

export interface RoleModalProps {
	formValue: Role;
	title: string;
	show: boolean;
	onOk: () => void;
	onCancel: () => void;
}

export function RoleModal({ formValue, title, show, onOk, onCancel }: RoleModalProps) {
	const [form] = Form.useForm();
	const { t } = useTranslation();

	useEffect(() => {
		form.setFieldsValue(formValue);
	}, [formValue, form]);

	return (
		<Modal
			title={title}
			open={show}
			onOk={() => {
				form.validateFields().then(() => {
					onOk();
				});
			}}
			onCancel={onCancel}
			destroyOnClose
		>
			<Form form={form} layout="vertical" initialValues={formValue}>
				<Form.Item name="nombre" label={t("sys.nav.system.role.name")} rules={[{ required: true, message: t("sys.nav.system.role.name_required") }]}>
					<Input maxLength={50} showCount />
				</Form.Item>

				<Form.Item name="descripcion" label={t("sys.nav.system.role.description")}>
					<Input.TextArea rows={4} maxLength={500} showCount />
				</Form.Item>

				<Form.Item name="activo" label={t("sys.nav.system.role.status")} valuePropName="checked">
					<Switch checkedChildren={t("sys.nav.system.role.active")} unCheckedChildren={t("sys.nav.system.role.inactive")} />
				</Form.Item>
			</Form>
		</Modal>
	);
}
