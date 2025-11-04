import axios, { type AxiosRequestConfig, type AxiosError, type AxiosResponse } from "axios";

import { t } from "@/locales/i18n";
import userStore from "@/store/userStore";

import { toast } from "sonner";

// Crear instancia de axios con manejo de cookies
const axiosInstance = axios.create({
	baseURL: import.meta.env.VITE_APP_BASE_API,
	timeout: 50000,
	headers: { "Content-Type": "application/json;charset=utf-8" },
	withCredentials: true,
});

// Interceptor de solicitud: eliminar cualquier inyección de Authorization
axiosInstance.interceptors.request.use(
	(config) => {
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Interceptor de respuesta: devolver datos crudos y manejar errores por estado HTTP
axiosInstance.interceptors.response.use(
	(res: AxiosResponse) => {
		return res;
	},
	(error: AxiosError) => {
		const { response, message } = error || {};
		const status = response?.status;

		// Mensajes generales
		let errMsg = message || t("sys.api.errorMessage");
		if (status === 401) {
			// Limpiar sesión local si el backend reporta no autorizado
			userStore.getState().actions.clearUserInfoAndToken();
			errMsg = t("sys.api.errMsg401");
		}
		if (status === 400) {
			errMsg = t("sys.api.errMsg400") || "Campos faltantes o formato inválido.";
		}
		if (status === 500) {
			errMsg = t("sys.api.errMsg500") || "Error interno del servidor.";
		}

		toast.error(errMsg, {
			position: "top-center",
		});

		return Promise.reject(error);
	},
);

class APIClient {
	get<T = any>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "GET" });
	}

	post<T = any>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "POST" });
	}

	put<T = any>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "PUT" });
	}

	delete<T = any>(config: AxiosRequestConfig): Promise<T> {
		return this.request<T>({ ...config, method: "DELETE" });
	}

	request<T = any>(config: AxiosRequestConfig): Promise<T> {
		return new Promise((resolve, reject) => {
			axiosInstance
				.request<T>(config)
				.then((res: AxiosResponse<T>) => {
					resolve(res.data);
				})
				.catch((e: Error | AxiosError) => {
					reject(e);
				});
		});
	}
}
export default new APIClient();
