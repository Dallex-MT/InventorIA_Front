import CryptoJS from "crypto-js";

export interface ValidationResult {
	valid: boolean;
	message: string;
}

export interface DecryptionResult {
	value: string;
	isDecrypted: boolean;
	validFormat: boolean;
	error?: string;
}

export interface CryptoConfig {
	secret?: string;
}

function getSecretFromEnv(): string {
	const secret = import.meta.env.VITE_APP_CRYPTO_SECRET as string | undefined;
	if (!secret || typeof secret !== "string" || secret.trim().length === 0) {
		throw new Error("Crypto secret (VITE_APP_CRYPTO_SECRET) no está configurado");
	}
	return secret;
}

export function encryptPasswordHMAC(text: string, config?: CryptoConfig): string {
	if (typeof text !== "string") throw new Error("El texto de contraseña debe ser una cadena");
	const secret = config?.secret ?? getSecretFromEnv();
	const key = CryptoJS.enc.Utf8.parse(secret);
	const hmac = CryptoJS.HmacSHA256(text, key).toString(CryptoJS.enc.Hex);
	return hmac;
}

export function encryptCedulaAES(cedula: string, config?: CryptoConfig): string {
	if (typeof cedula !== "string") throw new Error("La cédula debe ser una cadena");
	const value = cedula.trim();
	if (!value) throw new Error("La cédula no puede estar vacía");
	const secret = config?.secret ?? getSecretFromEnv();
	// Derivar clave de 16 bytes (AES-128) a partir del secreto
	const key = CryptoJS.MD5(secret); // 128-bit WordArray
	const plaintext = CryptoJS.enc.Utf8.parse(value);
	const encrypted = CryptoJS.AES.encrypt(plaintext, key, {
		mode: CryptoJS.mode.ECB,
		padding: CryptoJS.pad.Pkcs7,
	});
	// Devuelve Base64 por defecto
	return encrypted.toString();
}

export function decryptCedulaAES(cipher: string, config?: CryptoConfig): DecryptionResult {
	const secret = config?.secret ?? getSecretFromEnv();
	try {
		const key = CryptoJS.MD5(secret); // 128-bit WordArray
		// Descifrar desde Base64, modo ECB, padding Pkcs7
		const decrypted = CryptoJS.AES.decrypt(cipher, key, {
			mode: CryptoJS.mode.ECB,
			padding: CryptoJS.pad.Pkcs7,
		});
		const raw = decrypted.toString(CryptoJS.enc.Utf8);
		const validFormat = /^\d{10}$/.test(raw);
		if (validFormat) return { value: raw, isDecrypted: true, validFormat: true };
		return { value: cipher, isDecrypted: false, validFormat: false };
	} catch (e: any) {
		return { value: cipher, isDecrypted: false, validFormat: false, error: e?.message || "Error de descifrado" };
	}
}

export function validateEcuadorianID(cedula: string): ValidationResult {
	const clean = String(cedula ?? "").replace(/\D/g, "");
	if (clean.length !== 10) return { valid: false, message: "La cédula debe tener 10 dígitos" };
	const province = Number(clean.substring(0, 2));
	if (Number.isNaN(province) || province < 0 || province > 24) return { valid: false, message: "Provincia inválida (00-24)" };
	const third = Number(clean[2]);
	if (third < 0 || third > 5) return { valid: false, message: "El tercer dígito debe ser entre 0 y 5" };
	if (!/^\d{10}$/.test(clean)) return { valid: false, message: "Los dígitos 4-9 deben ser numéricos" };
	const coefs = [2, 1, 2, 1, 2, 1, 2, 1, 2];
	let sum = 0;
	for (let i = 0; i < 9; i++) {
		let prod = Number(clean[i]) * coefs[i];
		if (prod >= 10) prod -= 9;
		sum += prod;
	}
	const checkDigit = sum % 10 === 0 ? 0 : 10 - (sum % 10);
	if (checkDigit !== Number(clean[9])) return { valid: false, message: "Décimo dígito verificador incorrecto" };
	return { valid: true, message: "Cédula válida" };
}

export function validateEmail(email: string): ValidationResult {
	const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? ""));
	return { valid: ok, message: ok ? "Correo válido" : "Formato de correo inválido" };
}

export function validatePasswordStrength(pwd: string): ValidationResult {
	const value = String(pwd ?? "");
	const lengthOk = value.length >= 8;
	const upperOk = /[A-Z]/.test(value);
	const lowerOk = /[a-z]/.test(value);
	const digitOk = /\d/.test(value);
	const specialOk = /[^A-Za-z0-9]/.test(value);
	const valid = lengthOk && upperOk && lowerOk && digitOk && specialOk;
	let message = "";
	if (!lengthOk) message = "La contraseña debe tener al menos 8 caracteres";
	else if (!upperOk) message = "Debe incluir mayúsculas";
	else if (!lowerOk) message = "Debe incluir minúsculas";
	else if (!digitOk) message = "Debe incluir un número";
	else if (!specialOk) message = "Debe incluir un carácter especial";
	else message = "Contraseña fuerte";
	return { valid, message };
}

export function isTenDigitCedula(value: string): boolean {
	return /^\d{10}$/.test(String(value ?? ""));
}
