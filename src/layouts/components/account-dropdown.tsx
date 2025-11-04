import userService from "@/api/services/userService";
import { useLoginStateContext } from "@/pages/sys/login/providers/login-provider";
import { useRouter } from "@/routes/hooks";
import { useUserActions, useUserInfo } from "@/store/userStore";
import { Button } from "@/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { toast } from "sonner";

/**
 * Account Dropdown
 */
export default function AccountDropdown() {
	const { replace } = useRouter();
	const { nombre_usuario, correo } = useUserInfo();
	const { clearUserInfoAndToken } = useUserActions();
	const { backToLogin } = useLoginStateContext();
	const { t } = useTranslation();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const handleLogout = async () => {
		if (isLoggingOut) return; // Evitar múltiples peticiones simultáneas

		setIsLoggingOut(true);
		try {
			const response = await userService.logout();

			// Si es exitosa (200 OK), limpiar datos del usuario
			if (response.success) {
				clearUserInfoAndToken();
				toast.success(response.message || "Sesión cerrada exitosamente", {
					position: "top-center",
				});
				backToLogin();
				replace("/auth/login");
			}
		} catch (error: any) {
			// Manejo de errores (500 o cualquier otro error)
			const errorMessage = error?.message || "Error al cerrar sesión";
			toast.error(errorMessage, {
				position: "top-center",
			});
			console.error("Error durante logout:", error);
		} finally {
			setIsLoggingOut(false);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="rounded-full">
					<img className="h-6 w-6 rounded-full" src="/src/assets/images/avatar.webp" alt="" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<div className="flex items-center gap-2 p-2">
					<img className="h-10 w-10 rounded-full" src="/src/assets/images/avatar.webp" alt="" />
					<div className="flex flex-col items-start">
						<div className="text-text-primary text-sm font-medium">{nombre_usuario}</div>
						<div className="text-text-secondary text-xs">{correo}</div>
					</div>
				</div>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<NavLink to="/management/user/account">{t("sys.nav.user.account")}</NavLink>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="font-bold text-warning cursor-pointer" onClick={handleLogout} disabled={isLoggingOut}>
					<div className="flex items-center gap-2">
						{isLoggingOut && <Loader2 className="h-4 w-4 animate-spin" />}
						{t("sys.login.logout")}
					</div>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
