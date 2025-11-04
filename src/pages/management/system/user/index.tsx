import userService, { type QueryParams, type UpdateUserProfileReq } from "@/api/services/userService";
import { Icon } from "@/components/icon";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader } from "@/ui/card";
import { Input } from "@/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/select";
import { decryptCedulaAES, encryptCedulaAES, encryptPasswordHMAC, validateEcuadorianID, validateEmail, validatePasswordStrength } from "@/utils/crypto-utils";
import { Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { UserInfo } from "#/entity";
import { type UserCreateFormValues, UserCreateModal, type UserEditFormValues, UserEditModal } from "./user-modal";

export default function UserPage() {
	const { t } = useTranslation();
	const [users, setUsers] = useState<UserInfo[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchText, setSearchText] = useState("");
	const [pagination, setPagination] = useState({
		current: 1,
		pageSize: 5,
		total: 0,
	});
	const [activoFilter, setActivoFilter] = useState<boolean | undefined>(undefined);

	// Estados para el modal de edición (AntD Modal)
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editingUser, setEditingUser] = useState<UserInfo | null>(null);
	const [editLoading, setEditLoading] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);

	// Estados para el modal de registro (AntD Modal)
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const roles = [
		{ id: 1, label: "Administrador" },
		{ id: 2, label: "Editor" },
		{ id: 3, label: "Usuario" },
	];
	const [registerLoading, setRegisterLoading] = useState(false);
	const [registerError, setRegisterError] = useState<string | null>(null);

	// Cifrados y validaciones ahora se realizan dentro de los modales extraídos

	const fetchUsers = async (params: QueryParams) => {
		setLoading(true);
		setError(null);
		try {
			const response = await userService.getUsers(params);

			// Validar la estructura de la respuesta
			if (response?.data.users && Array.isArray(response.data.users)) {
				setUsers(response.data.users);
				setPagination({
					current: response.data.page || params.page,
					pageSize: params.limit,
					total: response.data.total || 0,
				});
			} else {
				console.error("Estructura de respuesta inválida:", response);
				setError("La respuesta del servidor no tiene el formato esperado");
				setUsers([]);
				setPagination({
					current: params.page,
					pageSize: params.limit,
					total: 0,
				});
			}
		} catch (error) {
			console.error("Error al obtener usuarios:", error);
			setError(error instanceof Error ? error.message : "Error al cargar usuarios");
			setUsers([]);
			setPagination({
				current: params.page,
				pageSize: params.limit,
				total: 0,
			});
		} finally {
			setLoading(false);
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		fetchUsers({
			page: 1,
			limit: 10,
			active: activoFilter,
		});
	}, [activoFilter]);

	const handleTableChange = (newPagination: TablePaginationConfig) => {
		fetchUsers({
			page: newPagination.current || 1,
			limit: newPagination.pageSize || 10,
			active: activoFilter,
		});
	};

	// Funciones para el modal de edición
	const openEditModal = (user: UserInfo) => {
		setEditingUser(user);
		setEditError(null);
		setIsEditModalOpen(true);
	};

	const closeEditModal = () => {
		setIsEditModalOpen(false);
		setEditingUser(null);
		setEditError(null);
	};

	const handleEditModalSubmit = async (values: UserEditFormValues) => {
		if (!editingUser) return;

		// Validaciones
		const cedulaCheck = validateEcuadorianID(values.cedula);
		if (!cedulaCheck.valid) {
			setEditError(cedulaCheck.message);
			return;
		}

		if (!values.nombre_usuario.trim()) {
			setEditError("El nombre de usuario es requerido");
			return;
		}

		const emailCheck = validateEmail(values.correo);
		if (!emailCheck.valid) {
			setEditError(emailCheck.message);
			return;
		}

		setEditLoading(true);
		setEditError(null);

		try {
			const updateData: UpdateUserProfileReq = {
				userId: editingUser.id,
				cedula: encryptCedulaAES(values.cedula.trim()),
				nombre_usuario: values.nombre_usuario.trim(),
				correo: values.correo.trim(),
				estado: values.estado,
			};

			const response = await userService.updateUserProfile(updateData);

			if (response.success) {
				await fetchUsers({ page: pagination.current, limit: pagination.pageSize, active: activoFilter });
				closeEditModal();
			} else {
				setEditError(response.message || "Error al actualizar el usuario");
			}
		} catch (error) {
			console.error("Error al actualizar usuario:", error);
			setEditError(error instanceof Error ? error.message : "Error al actualizar el usuario");
		} finally {
			setEditLoading(false);
		}
	};

	const handleCreateModalSubmit = async (values: UserCreateFormValues) => {
		setRegisterError(null);

		// Validaciones previas
		const cedulaOk = validateEcuadorianID(values.cedula);
		const emailOk = validateEmail(values.correo);
		const pwdOk = validatePasswordStrength(values.password);
		if (!cedulaOk.valid) return setRegisterError(cedulaOk.message);
		if (!values.nombre_usuario.trim()) return setRegisterError("El nombre de usuario es requerido");
		if (!emailOk.valid) return setRegisterError(emailOk.message);
		if (!pwdOk.valid) return setRegisterError(pwdOk.message);

		setRegisterLoading(true);
		try {
			const payload = {
				cedula: encryptCedulaAES(values.cedula.trim()),
				nombre_usuario: values.nombre_usuario.trim(),
				correo: values.correo.trim(),
				password: encryptPasswordHMAC(values.password),
				rol_id: Number(values.rol_id),
			};

			const res = await userService.register(payload);
			if (res.success) {
				toast.success(res.message || "Usuario registrado exitosamente");
				setIsCreateModalOpen(false);
				await fetchUsers({ page: pagination.current, limit: pagination.pageSize, active: activoFilter });
			} else {
				setRegisterError(res.message || "Error al registrar usuario");
			}
		} catch (e: any) {
			console.error(e);
			setRegisterError(e?.message || "Error al registrar usuario");
		} finally {
			setRegisterLoading(false);
		}
	};

	// Validar y limpiar datos de usuarios
	const validatedUsers = users
		.map((user) => {
			if (!user || typeof user !== "object") return null;

			// Validar campos requeridos
			if (!user.id || !user.nombre_usuario || !user.correo || !user.cedula) {
				console.warn("Usuario con datos incompletos:", user);
				return null;
			}

			// Convertir tipos de datos si es necesario
			const cleanUser: UserInfo = {
				id: Number(user.id),
				cedula: String(user.cedula),
				nombre_usuario: String(user.nombre_usuario),
				correo: String(user.correo),
				rol_id: Number(user.rol_id),
				activo: Boolean(user.activo),
			};

			// Intentar desencriptar cédula si viene cifrada
			const { value: maybeCedula } = decryptCedulaAES(cleanUser.cedula);
			if (/^\d{10}$/.test(maybeCedula)) {
				cleanUser.cedula = maybeCedula;
			}

			// Validar que la conversión haya sido exitosa
			if (Number.isNaN(cleanUser.id) || Number.isNaN(cleanUser.rol_id)) {
				console.warn("Usuario con IDs inválidos:", user);
				return null;
			}

			return cleanUser;
		})
		.filter((user): user is UserInfo => user !== null);

	const filteredUsers = validatedUsers.filter(
		(user) =>
			user.nombre_usuario.toLowerCase().includes(searchText.toLowerCase()) ||
			user.correo.toLowerCase().includes(searchText.toLowerCase()) ||
			user.cedula.toLowerCase().includes(searchText.toLowerCase()),
	);

	const columns: ColumnsType<UserInfo> = [
		{
			title: "Nombre de Usuario",
			dataIndex: "nombre_usuario",
			sorter: (a, b) => a.nombre_usuario.localeCompare(b.nombre_usuario),
			width: 200,
		},
		{
			title: "Correo",
			dataIndex: "correo",
			sorter: (a, b) => a.correo.localeCompare(b.correo),
			width: 250,
		},
		{
			title: "Cédula",
			dataIndex: "cedula",
			sorter: (a, b) => a.cedula.localeCompare(b.cedula),
			width: 150,
		},
		{
			title: "Estado",
			dataIndex: "activo",
			align: "center",
			width: 120,
			render: (activo: boolean) => <Badge variant={activo ? "success" : "error"}>{activo ? "Activo" : "Inactivo"}</Badge>,
			sorter: (a, b) => Number(a.activo) - Number(b.activo),
		},
		{
			title: "Acciones",
			key: "operation",
			align: "center",
			width: 150,
			fixed: "right",
			render: (_, record) => (
				<div className="flex w-full justify-center gap-2">
					<Button variant="ghost" size="icon" onClick={() => openEditModal(record)}>
						<Icon icon="solar:pen-bold-duotone" size={20} />
					</Button>
				</div>
			),
		},
	];

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>{t("sys.nav.user.index")}</div>
					<div className="flex gap-4">
						<Input placeholder="Buscar por nombre, correo o cédula" value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-80" />
						<Select
							value={activoFilter === undefined ? "todos" : activoFilter.toString()}
							onValueChange={(value) => {
								setActivoFilter(value === "todos" ? undefined : value === "true");
							}}
						>
							<SelectTrigger className="w-40">
								<SelectValue placeholder="Filtrar por estado" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todos</SelectItem>
								<SelectItem value="true">Activos</SelectItem>
								<SelectItem value="false">Inactivos</SelectItem>
							</SelectContent>
						</Select>
						<Button onClick={() => setIsCreateModalOpen(true)}>{t("sys.nav.user.new_user")}</Button>
						{error && (
							<div className="flex items-center gap-2 ml-4">
								<Badge variant="error">Error: {error}</Badge>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										fetchUsers({
											page: pagination.current,
											limit: pagination.pageSize,
											active: activoFilter,
										})
									}
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
					locale={{
						emptyText: error ? "Error al cargar datos" : "No hay usuarios disponibles",
					}}
					size="small"
					scroll={{ x: "max-content" }}
					pagination={{
						...pagination,
						showSizeChanger: true,
						showQuickJumper: true,
						showTotal: (total) => `Total ${total} usuarios`,
					}}
					onChange={handleTableChange}
					columns={columns}
					dataSource={filteredUsers}
				/>
			</CardContent>

			{/* Modal de edición (Ant Design) */}
			<UserEditModal
				open={isEditModalOpen}
				title="Editar Usuario"
				initialValue={{
					cedula: editingUser?.cedula ?? "",
					nombre_usuario: editingUser?.nombre_usuario ?? "",
					correo: editingUser?.correo ?? "",
					estado: editingUser?.activo ?? true,
				}}
				loading={editLoading}
				error={editError}
				onCancel={closeEditModal}
				onSubmit={handleEditModalSubmit}
			/>

			{/* Modal de registro (Ant Design) */}
			<UserCreateModal
				open={isCreateModalOpen}
				title="Nuevo Usuario"
				initialValue={{ cedula: "", nombre_usuario: "", correo: "", password: "", rol_id: 1 }}
				roles={roles}
				loading={registerLoading}
				error={registerError}
				onCancel={() => setIsCreateModalOpen(false)}
				onSubmit={handleCreateModalSubmit}
			/>
		</Card>
	);
}
