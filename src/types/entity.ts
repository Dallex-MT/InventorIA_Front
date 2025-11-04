import type { BasicStatus, PermissionType } from "./enum";

// Nuevo esquema de usuario proveniente del backend
export interface UserInfo {
	id: number;
	cedula: string;
	nombre_usuario: string;
	correo: string;
	rol_id: number;
	activo: boolean;
	fecha_creacion?: string;
	ultima_sesion?: string;
}

export interface Permission_Old {
	id: string;
	parentId: string;
	name: string;
	label: string;
	type: PermissionType;
	route: string;
	status?: BasicStatus;
	order?: number;
	icon?: string;
	component?: string;
	hide?: boolean;
	hideTab?: boolean;
	frameSrc?: URL;
	newFeature?: boolean;
	children?: Permission_Old[];
}

export interface Role_Old {
	id: number;
	nombre: string;
	descripcion: string;
	activo: boolean;
	fecha_creacion: string;
	fecha_actualizacion: string;
}

export interface CommonOptions {
	status?: BasicStatus;
	desc?: string;
	createdAt?: string;
	updatedAt?: string;
}
export interface User extends CommonOptions {
	id: string; // uuid
	username: string;
	password: string;
	email: string;
	phone?: string;
	avatar?: string;
}

export interface Role extends CommonOptions {
	id: number;
	nombre: string;
	descripcion: string;
	activo: boolean;
	fecha_creacion: string;
	fecha_actualizacion: string;
}

export interface Permission extends CommonOptions {
	id: string; // uuid
	name: string;
	code: string; // resource:action  example: "user-management:read"
}

export interface Menu extends CommonOptions, MenuMetaInfo {
	id: string; // uuid
	parentId: string;
	name: string;
	code: string;
	order?: number;
	type: PermissionType;
}

export type MenuMetaInfo = {
	path?: string; // nav path
	icon?: string; // nav icon
	caption?: string; // nav caption
	info?: string; // nav info
	disabled?: boolean; // nav disabled
	externalLink?: URL;
	auth?: string[];
	hidden?: boolean;

	// type: MENU
	component?: string;
};

export type MenuTree = Menu & {
	children?: MenuTree[];
};

export interface ProductInfo {
	id: number;
	nombre: string;
	descripcion: string;
	categoria_id: number;
	unidad_medida: string;
	stock_actual: number;
	stock_minimo: number;
	precio_referencia: number;
	activo: boolean;
	fecha_creacion: string;
	fecha_actualizacion: string;
}

export interface CategoryInfo {
	id: number;
	nombre: string;
	descripcion: string;
	activo: boolean;
	fecha_creacion: string;
	fecha_actualizacion?: string;
}

export interface InvoiceInfo {
	id: number;
	codigo_interno: string;
	tipo_movimiento_id: number;
	concepto: string;
	usuario_responsable_id: number;
	fecha_movimiento: string;
	total: number;
	observaciones: string;
	estado: "BORRADOR" | "CONFIRMADA" | "ANULADA";
	fecha_creacion: string;
	fecha_actualizacion: string;
}
