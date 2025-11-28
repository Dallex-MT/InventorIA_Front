import { Icon } from "@/components/icon";
import { Button } from "@/ui/button";
import { Modal, Spin } from "antd";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export interface InvoiceCameraModalProps {
	open: boolean;
	title?: string;
	loading?: boolean;
	error?: string | null;
	onCancel: () => void;
	onFilesSelected?: (files: FileList) => void;
	onImageSelected?: (file: File) => void;
}

export default function InvoiceCameraModal({ open, title, loading, error, onCancel, onFilesSelected, onImageSelected }: InvoiceCameraModalProps) {
	const { t } = useTranslation();
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [fileError, setFileError] = useState<string | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const startCamera = async () => {
		setCameraError(null);
		try {
			const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
			streamRef.current = s;
			if (videoRef.current) {
				(videoRef.current as any).srcObject = s;
				await videoRef.current.play();
			}
		} catch (e) {
			const msg = e instanceof Error ? e.message : "No se pudo iniciar la cámara";
			setCameraError(msg);
		}
	};

	const stopCamera = () => {
		const s = streamRef.current;
		if (s) {
			for (const t of s.getTracks()) t.stop();
			streamRef.current = null;
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (open) {
			setFileError(null);
			setCameraError(null);
			setPreviewUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return null;
			});
			setPendingFile(null);
			if (fileInputRef.current) fileInputRef.current.value = "";
			startCamera();
		} else {
			stopCamera();
		}
		return () => stopCamera();
	}, [open]);

	const validateFile = (file: File) => {
		const isValidType = ["image/jpeg", "image/jpg", "image/png"].includes(file.type);
		const maxSize = 10 * 1024 * 1024;
		if (!isValidType) {
			setFileError("El archivo debe ser una imagen JPG o PNG");
			return false;
		}
		if (file.size > maxSize) {
			setFileError("El tamaño de la imagen no debe exceder 10MB");
			return false;
		}
		setFileError(null);
		return true;
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files || files.length === 0) return;
		if (onFilesSelected) onFilesSelected(files);
		const file = files[0];
		if (!validateFile(file)) return;
		const url = URL.createObjectURL(file);
		setPreviewUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return url;
		});
		setPendingFile(file);
		stopCamera();
	};

	const capturePhoto = async () => {
		const v = videoRef.current;
		if (!v) return;
		const vw = v.videoWidth || 1260;
		const vh = v.videoHeight || 1680; // prefer portrait default
		const targetAR = 3 / 4; // 3:4 vertical
		let sx = 0;
		let sy = 0;
		let sw = vw;
		let sh = vh;
		const currentAR = vw / vh;
		if (currentAR > targetAR) {
			// too wide: crop width
			sw = Math.round(vh * targetAR);
			sx = Math.round((vw - sw) / 2);
			sy = 0;
			sh = vh;
		} else if (currentAR < targetAR) {
			// too tall: crop height
			sh = Math.round(vw / targetAR);
			sy = Math.round((vh - sh) / 2);
			sx = 0;
			sw = vw;
		}
		const canvas = document.createElement("canvas");
		canvas.width = sw;
		canvas.height = Math.round(sw / targetAR);
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(v, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
		const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
		if (!blob) {
			setFileError("No se pudo capturar la imagen");
			return;
		}
		const file = new File([blob], "invoice-camera.jpg", { type: "image/jpeg" });
		if (!validateFile(file)) return;
		const url = URL.createObjectURL(file);
		setPreviewUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return url;
		});
		setPendingFile(file);
		stopCamera();
	};

	const handleConfirm = () => {
		if (!pendingFile) return;
		if (onImageSelected) onImageSelected(pendingFile);
	};

	const handleCancelPreview = () => {
		setPendingFile(null);
		setPreviewUrl((prev) => {
			if (prev) URL.revokeObjectURL(prev);
			return null;
		});
		if (fileInputRef.current) fileInputRef.current.value = "";
		if (open) startCamera();
	};

	useEffect(() => {
		return () => {
			setPreviewUrl((prev) => {
				if (prev) URL.revokeObjectURL(prev);
				return null;
			});
		};
	}, []);

	return (
		<Modal
			title={title ?? t("sys.nav.inventory.invoice.scan")}
			open={open}
			onCancel={loading ? undefined : onCancel}
			confirmLoading={loading}
			footer={null}
			width={640}
			centered
			bodyStyle={{ height: "80vh", maxHeight: "80vh", overflow: "hidden", paddingTop: 8, paddingBottom: 8 }}
			destroyOnClose
			maskClosable={!loading}
			keyboard={!loading}
			closable={!loading}
		>
			<div className="relative flex flex-col h-[80vh] max-h-[80vh] w-full overflow-hidden">
				{error && <div className="text-red-500 mb-2 text-sm">Error: {error}</div>}
				{fileError && <div className="text-red-500 mb-2 text-sm">{fileError}</div>}
				{cameraError && <div className="text-red-500 mb-2 text-sm">{cameraError}</div>}

				{loading && (
					<div className="absolute inset-0 z-20 bg-black/30 flex items-center justify-center" aria-live="polite" aria-busy="true">
						<div className="bg-background/90 rounded-md px-6 py-4 shadow">
							<div className="flex items-center gap-3">
								<Spin />
								<div className="font-medium">Procesando imagen…</div>
							</div>
							<div className="text-xs text-muted-foreground mt-1">Por favor, espera mientras procesamos tu factura.</div>
						</div>
					</div>
				)}

				<div className={`flex-1 flex flex-col gap-2 ${loading ? "pointer-events-none opacity-60" : ""}`}>
					<div className="flex items-center justify-between px-1">
						<Button onClick={() => fileInputRef.current?.click()} variant="default" size="sm" className="shadow-sm" disabled={loading}>
							<Icon icon="solar:upload-bold-duotone" className="mr-2" />
							{t("sys.nav.inventory.invoice.upload")}
						</Button>
						<div />
						<input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png" className="hidden" onChange={handleFileChange} multiple={false} />
					</div>

					<div className="flex-1 flex items-center justify-center px-2">
						{previewUrl ? (
							<div className="w-full h-full bg-muted rounded-lg overflow-hidden relative" style={{ aspectRatio: "3 / 4", maxHeight: "calc(80vh - 140px)" }}>
								<img src={previewUrl} alt="Vista previa de la factura" className="w-full h-full object-contain" />
							</div>
						) : (
							<div className="w-full h-full bg-muted rounded-lg overflow-hidden relative" style={{ aspectRatio: "3 / 4", maxHeight: "calc(80vh - 140px)" }}>
								<video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
								<div className="absolute bottom-4 left-1/2 -translate-x-1/2">
									<button
										type="button"
										onClick={capturePhoto}
										disabled={loading}
										aria-label="Tomar foto"
										className="relative w-14 h-14 rounded-full bg-white shadow-md border-2 border-gray-300 hover:scale-[1.03] transition-all after:content-[''] after:absolute after:inset-[-8px] after:rounded-full after:border after:border-gray-200"
									/>
								</div>
							</div>
						)}
					</div>

					<div className="flex items-center justify-center pb-1">
						{previewUrl ? (
							<div className="flex gap-3">
								<Button
									onClick={handleConfirm}
									className="h-10 px-6 text-base bg-primary text-primary-foreground hover:shadow-lg hover:-translate-y-[1px] transition-all"
									variant="default"
									size="sm"
									disabled={loading || !pendingFile}
								>
									Confirmar
								</Button>
								<Button
									onClick={handleCancelPreview}
									className="h-10 px-6 text-base hover:shadow-lg transition-all"
									variant="default"
									size="sm"
									disabled={loading}
								>
									Cancelar
								</Button>
							</div>
						) : null}
					</div>
				</div>
			</div>
		</Modal>
	);
}
