import userService from "@/api/services/userService";
import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/ui/form";
import { Input } from "@/ui/input";
import { type ValidationResult, encryptPasswordHMAC, validatePasswordStrength } from "@/utils/crypto-utils";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type FieldType = {
	oldPassword: string;
	newPassword: string;
	confirmPassword: string;
};

export default function SecurityTab() {
	const { t } = useTranslation();
	const form = useForm<FieldType>({
		defaultValues: {
			oldPassword: "",
			newPassword: "",
			confirmPassword: "",
		},
	});

	// Estado para controlar visibilidad de contraseñas (ocultas por defecto)
	const [passwordVisibility, setPasswordVisibility] = useState({
		old: false,
		new: false,
		confirm: false,
	});

	// Función para alternar visibilidad de cada campo de contraseña
	const togglePasswordVisibility = (field: "old" | "new" | "confirm") => {
		setPasswordVisibility((prev) => ({
			...prev,
			[field]: !prev[field],
		}));
	};

	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		// Validar fortaleza de nueva contraseña
		const pwdCheck: ValidationResult = validatePasswordStrength(form.getValues("newPassword"));
		if (!pwdCheck.valid) {
			toast.error(pwdCheck.message);
			return;
		}

		// Confirmar coincidencia de contraseñas
		const newPwd = form.getValues("newPassword");
		const confirmPwd = form.getValues("confirmPassword");
		if (newPwd !== confirmPwd) {
			toast.error(t("sys.nav.user.confirm_password_placeholder"));
			return;
		}

		// Validar que la nueva contraseña sea diferente a la anterior
		const oldPwd = form.getValues("oldPassword");
		if (oldPwd === newPwd) {
			toast.error("La nueva contraseña debe ser diferente a la anterior");
			return;
		}

		try {
			setLoading(true);
			// Encriptar contraseñas antes de enviar
			const payload = {
				oldPassword: encryptPasswordHMAC(oldPwd),
				newPassword: encryptPasswordHMAC(newPwd),
			};
			const res = await userService.updatePassword(payload);
			toast.success(res?.message || "Contraseña actualizada correctamente");
			form.reset({ oldPassword: "", newPassword: "", confirmPassword: "" });
		} catch (err: any) {
			const serverMsg = typeof err === "object" && err && "message" in err ? (err as any).message : undefined;
			toast.error(serverMsg || "No se pudo actualizar la contraseña");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="oldPassword"
							rules={{ required: t("sys.nav.user.old_password_placeholder") }}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("sys.nav.user.old_password")}</FormLabel>
									<FormControl className="relative">
										<div className="flex items-center w-full">
											<Input
												type={passwordVisibility.old ? "text" : "password"}
												{...field}
												placeholder={t("sys.nav.user.old_password_placeholder")}
												className="flex-grow"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => togglePasswordVisibility("old")}
												className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
											>
												<Icon icon={passwordVisibility.old ? "mdi:eye-off" : "mdi:eye"} size={16} />
											</Button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="newPassword"
							rules={{
								required: t("sys.nav.user.new_password_placeholder"),
								validate: (value) => {
									const res = validatePasswordStrength(value);
									return res.valid || res.message;
								},
							}}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("sys.nav.user.new_password")}</FormLabel>
									<FormControl className="relative">
										<div className="flex items-center w-full">
											<Input
												type={passwordVisibility.new ? "text" : "password"}
												{...field}
												placeholder={t("sys.nav.user.new_password_placeholder")}
												className="flex-grow"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => togglePasswordVisibility("new")}
												className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
											>
												<Icon icon={passwordVisibility.new ? "mdi:eye-off" : "mdi:eye"} size={16} />
											</Button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="confirmPassword"
							rules={{
								required: t("sys.nav.user.confirm_password_placeholder"),
								validate: (value) => value === form.getValues("newPassword") || "Passwords do not match",
							}}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{t("sys.nav.user.confirm_password")}</FormLabel>
									<FormControl className="relative">
										<div className="flex items-center w-full">
											<Input
												type={passwordVisibility.confirm ? "text" : "password"}
												{...field}
												placeholder={t("sys.nav.user.confirm_password_placeholder")}
												className="flex-grow"
											/>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
												onClick={() => togglePasswordVisibility("confirm")}
											>
												<Icon icon={passwordVisibility.confirm ? "mdi:eye-off" : "mdi:eye"} size={16} />
											</Button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="flex w-full justify-end">
							<Button type="submit" disabled={loading} aria-busy={loading}>
								{loading ? t("sys.nav.user.saving") : t("sys.nav.user.save")}
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
