import userService, { type UpdateUserProfileReq, type UpdateUserProfileRes } from "@/api/services/userService";
import { useLoginStateContext } from "@/pages/sys/login/providers/login-provider";
import { useRouter } from "@/routes/hooks";
import { useUserActions, useUserInfo } from "@/store/userStore";
import { Button } from "@/ui/button";
import { Card, CardContent, CardFooter } from "@/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/ui/form";
import { Input } from "@/ui/input";
import { decryptCedulaAES, validateEmail } from "@/utils/crypto-utils";
import { getItem, setItem } from "@/utils/storage";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { UserInfo } from "#/entity";
import { StorageEnum } from "#/enum";

export default function GeneralTab() {
	const { t } = useTranslation();
	const router = useRouter();
	const userInfo = useUserInfo();
	const { setUserInfo, clearUserInfoAndToken } = useUserActions();
	const { backToLogin } = useLoginStateContext();
	const [error, setError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	const form = useForm<UserInfo>({
		defaultValues: {
			nombre_usuario: userInfo.nombre_usuario || "",
			correo: userInfo.correo || "",
			cedula: userInfo.cedula || "",
		},
	});

	// Detectar cambios en el formulario para optimizar actualizaciones
	const watchedNombre = form.watch("nombre_usuario");
	const watchedCorreo = form.watch("correo");
	useEffect(() => {
		const nombreBase = userInfo.nombre_usuario || "";
		const correoBase = userInfo.correo || "";
		const changed = (watchedNombre ?? "") !== nombreBase || (watchedCorreo ?? "") !== correoBase;
		setHasChanges(changed);
	}, [watchedNombre, watchedCorreo, userInfo.nombre_usuario, userInfo.correo]);

	// Mapea la respuesta del backend al esquema UserInfo del frontend
	const mapResponseUserToUserInfo = (u: UpdateUserProfileRes["user"]): UserInfo => ({
		id: Number(u.id),
		cedula: String(u.cedula),
		nombre_usuario: String(u.nombre_usuario),
		correo: String(u.correo),
		rol_id: Number(u.rol_id),
		activo: Number(u.activo) === 1 || (u.activo as unknown as boolean) === true,
		fecha_creacion: u.fecha_creacion,
		ultima_sesion: u.ultimo_acceso,
	});

	// Actualiza localStorage de forma segura y evitando escrituras redundantes
	const safeUpdateLocalStorageUserInfo = (newUser: UserInfo) => {
		try {
			if (typeof window === "undefined" || !window.localStorage) {
				throw new Error("localStorage no disponible");
			}
			const existing = getItem<UserInfo>(StorageEnum.UserInfo);
			const isSame =
				existing &&
				existing.cedula === newUser.cedula &&
				existing.nombre_usuario === newUser.nombre_usuario &&
				existing.correo === newUser.correo &&
				existing.activo === newUser.activo;
			if (isSame) return;
			setItem(StorageEnum.UserInfo, newUser);
		} catch (err) {
			console.warn("No se pudo actualizar localStorage:", err);
			setError("No se pudo sincronizar el perfil en localStorage. Los cambios siguen activos en la sesión.");
		}
	};

	const handleSubmit = async (data: UserInfo) => {
		try {
			setIsLoading(true);
			setError(null);

			// Validación de campos requeridos
			if (!data.nombre_usuario) {
				setError("El nombre de usuario es obligatorio");
				return;
			}

			// Validación de formato de email
			const emailValidation = validateEmail(data.correo);
			if (!emailValidation.valid) {
				setError(emailValidation.message);
				return;
			}

			// Preparar datos en el formato requerido
			const updateData: UpdateUserProfileReq = {
				cedula: userInfo.cedula || data.cedula,
				nombre_usuario: data.nombre_usuario,
				correo: data.correo,
				estado: true,
			};

			// Llamada al servicio
			const response = await userService.updateUserProfile(updateData);

			if (response.success) {
				toast.success(response.message || "Perfil actualizado exitosamente");
				const mapped = mapResponseUserToUserInfo(response.user);
				const isSameStore =
					(userInfo?.cedula || "") === mapped.cedula &&
					(userInfo?.nombre_usuario || "") === mapped.nombre_usuario &&
					(userInfo?.correo || "") === mapped.correo &&
					Boolean(userInfo?.activo) === mapped.activo;
				if (!isSameStore) {
					setUserInfo(mapped);
					safeUpdateLocalStorageUserInfo(mapped);
					form.reset({
						nombre_usuario: mapped.nombre_usuario,
						correo: mapped.correo,
						cedula: mapped.cedula,
					});
				}
				setHasChanges(false);
			} else {
				setError(response.message || "Error al actualizar el perfil");
			}
		} catch (error: any) {
			console.error("Error updating profile:", error);
			setError(error?.response?.data?.message || error?.message || "Error inesperado al actualizar el perfil");
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteUser = async () => {
		if (!userInfo?.id) {
			setError("No se puede eliminar el usuario: ID no disponible");
			return;
		}

		try {
			setIsDeleting(true);
			setError(null);

			const response = await userService.deleteUser(userInfo.id);

			if (response.success) {
				toast.success(response.message || "Usuario desactivado exitosamente");

				// Iniciar proceso de logout
				try {
					await userService.logout();
					clearUserInfoAndToken();
					backToLogin();
					router.replace("/auth/login");
				} catch (logoutError) {
					console.error("Error durante logout:", logoutError);
					// Si falla el logout, forzar limpieza y redirección
					clearUserInfoAndToken();
					router.replace("/auth/login");
				}
			} else {
				setError(response.message || "Error al desactivar el usuario");
			}
		} catch (error: any) {
			console.error("Error deleting user:", error);

			// Manejo de errores estructurados del servicio
			if (error && typeof error === "object" && "success" in error && "message" in error) {
				setError(error.message);
			} else {
				setError(error?.message || "Error inesperado al desactivar el usuario");
			}
		} finally {
			setIsDeleting(false);
			setIsDeleteDialogOpen(false);
		}
	};

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<div className="flex-1">
				<Card className="px-6! pb-10! pt-20!">
					<img src="/src/assets/images/avatar.webp" className="h-16 w-16 rounded-full md:h-32 md:w-32 mx-auto mb-10 mt-[-1rem]" alt="" />

					<Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={isDeleting}>
						{isDeleting ? "Desactivando..." : t("sys.nav.user.delete")}
					</Button>

					<Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Confirmar eliminación de cuenta</DialogTitle>
								<DialogDescription>
									Esta acción desactivará permanentemente tu cuenta y cerrarás sesión inmediatamente. Esta operación no se puede deshacer.
								</DialogDescription>
							</DialogHeader>

							{error && (
								<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
									<p className="text-red-600 text-sm">{error}</p>
								</div>
							)}

							<DialogFooter className="gap-2 sm:gap-0">
								<Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
									Cancelar
								</Button>
								<Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
									{isDeleting ? <>Desactivando...</> : <>Eliminar cuenta</>}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</Card>
			</div>
			<div className="flex-2">
				<Card>
					<CardContent>
						{error && (
							<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
								<p className="text-red-600 text-sm">{error}</p>
							</div>
						)}
						<Form {...form}>
							<form onSubmit={form.handleSubmit(handleSubmit)}>
								<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
									<FormField
										control={form.control}
										name="cedula"
										disabled
										render={({ field }) => {
											const decryptedCedula = decryptCedulaAES(field.value);
											return (
												<FormItem>
													<FormLabel>Cédula</FormLabel>
													<FormControl>
														<Input {...field} value={decryptedCedula.value} />
													</FormControl>
												</FormItem>
											);
										}}
									/>
									<FormField
										control={form.control}
										name="correo"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("sys.nav.user.email")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="nombre_usuario"
										render={({ field }) => (
											<FormItem>
												<FormLabel>{t("sys.nav.user.username")}</FormLabel>
												<FormControl>
													<Input {...field} />
												</FormControl>
											</FormItem>
										)}
									/>
								</div>
							</form>
						</Form>
					</CardContent>
					<CardFooter>
						<Button type="submit" onClick={form.handleSubmit(handleSubmit)} disabled={isLoading || !hasChanges}>
							{isLoading ? "Guardando..." : t("sys.nav.user.save")}
						</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
