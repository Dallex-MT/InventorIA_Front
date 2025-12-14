import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export interface ExportColumn {
	title: string;
	dataIndex: string;
	render?: (value: any, record: any) => string | number;
}

export interface ExportData {
	[key: string]: any;
}

/**
 * Exporta datos a PDF usando jsPDF y jspdf-autotable
 */
export function exportToPDF({
	title,
	fileName,
	columns,
	data,
	subtitleLines,
	themeColor,
	logoDataUrl,
	titleLines,
}: {
	title: string;
	fileName: string;
	columns: ExportColumn[];
	data: ExportData[];
	subtitle?: string;
	subtitleLines?: string[];
	themeColor?: [number, number, number];
	logoDataUrl?: string;
	titleLines?: string[];
}) {
	try {
		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const margin = 14;

		const red = themeColor || [158, 58, 61];
		doc.setFontSize(18);
		doc.setTextColor(red[0], red[1], red[2]);
		doc.text(title, margin, 20);
		if (titleLines && titleLines.length > 0) {
			doc.setFontSize(12);
			doc.setTextColor(0, 0, 0);
			let y = 26;
			for (const line of titleLines) {
				doc.text(line, margin, y);
				y += 6;
			}
		}
		doc.setTextColor(0, 0, 0);

		let currentY = 20; // Start Y position for title

		doc.setFontSize(18);
		doc.setTextColor(red[0], red[1], red[2]);
		doc.text(title, margin, currentY);
		currentY += 6; // Move past the title

		if (titleLines && titleLines.length > 0) {
			doc.setFontSize(12);
			doc.setTextColor(0, 0, 0);
			for (const line of titleLines) {
				doc.text(line, margin, currentY);
				currentY += 6;
			}
		}

		if (subtitleLines && subtitleLines.length > 0) {
			doc.setFontSize(12);
			doc.setTextColor(100, 100, 100);
			for (const line of subtitleLines) {
				doc.text(line, margin, currentY);
				currentY += 6;
			}
			doc.setTextColor(0, 0, 0);
		}

		// Fecha de generación
		doc.setFontSize(10);
		doc.setTextColor(100, 100, 100);
		const dateStr = new Date().toLocaleString("es-ES", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
		const dateText = `Generado el: ${dateStr}`;

		let logoY = 18;
		if (logoDataUrl) {
			try {
				doc.addImage(logoDataUrl, "PNG", pageWidth - margin - 60, logoY, 60, 24);
				logoY += 24; // Adjust Y for date below logo
			} catch {}
		}
		doc.text(dateText, pageWidth - margin, logoY + 6, { align: "right" }); // Position date below logo
		doc.setTextColor(0, 0, 0);

		const tableStartY = Math.max(currentY + 6, logoY + 12); // Ensure table starts after all elements

		// Preparar datos para la tabla
		const tableData = data.map((record) =>
			columns.map((col) => {
				const value = record[col.dataIndex];
				return col.render ? col.render(value, record) : (value ?? "");
			}),
		);

		const tableHeaders = columns.map((col) => col.title);

		// Agregar tabla
		autoTable(doc, {
			head: [tableHeaders],
			body: tableData,
			startY: tableStartY,
			margin: { left: margin, right: margin },
			styles: {
				fontSize: 9,
				cellPadding: 3,
			},
			headStyles: {
				fillColor: red,
				textColor: 255,
				fontStyle: "bold",
			},
			alternateRowStyles: {
				fillColor: [245, 245, 245],
			},
		});

		// Guardar archivo
		doc.save(`${fileName}_${new Date().toISOString().split("T")[0]}.pdf`);
		toast.success("PDF exportado exitosamente");
	} catch (error) {
		console.error("Error al exportar PDF:", error);
		toast.error("Error al exportar PDF");
	}
}

/**
 * Exporta datos a Excel/CSV usando xlsx
 */
export function exportToExcel({
	sheetName,
	fileName,
	data,
	columns,
	titleRows,
}: {
	sheetName: string;
	fileName: string;
	data: ExportData[];
	columns: ExportColumn[];
	titleRows?: string[];
}) {
	try {
		// Preparar datos
		const headerRow = columns.map((col) => col.title);
		const worksheetData = [
			// biome-ignore lint/complexity/useOptionalChain: <explanation>
			...(titleRows && titleRows.length ? titleRows.map((t) => [t]) : []),
			headerRow,
			...data.map((record) =>
				columns.map((col) => {
					const value = record[col.dataIndex];
					return col.render ? col.render(value, record) : (value ?? "");
				}),
			),
		];

		// Crear workbook y worksheet
		const workbook = XLSX.utils.book_new();
		const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

		// Ajustar ancho de columnas
		const colWidths = columns.map(() => ({ wch: 20 }));
		worksheet["!cols"] = colWidths;

		// Agregar worksheet al workbook
		XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

		// Guardar archivo
		XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split("T")[0]}.xlsx`);
		toast.success("Excel exportado exitosamente");
	} catch (error) {
		console.error("Error al exportar Excel:", error);
		toast.error("Error al exportar Excel");
	}
}

/**
 * Exporta datos a CSV
 */
export function exportToCSV({
	fileName,
	data,
	columns,
	titleRows,
}: {
	fileName: string;
	data: ExportData[];
	columns: ExportColumn[];
	titleRows?: string[];
}) {
	try {
		// Preparar datos
		const headerRow = columns.map((col) => col.title).join(",");
		const csvRows = [
			// biome-ignore lint/complexity/useOptionalChain: <explanation>
			...(titleRows && titleRows.length ? titleRows : []),
			headerRow,
			...data.map((record) =>
				columns
					.map((col) => {
						const value = record[col.dataIndex];
						const cellValue = col.render ? col.render(value, record) : (value ?? "");
						const stringValue = String(cellValue).replace(/"/g, '""');
						return stringValue.includes(",") ? `"${stringValue}"` : stringValue;
					})
					.join(","),
			),
		];

		// Crear blob y descargar
		const csvContent = csvRows.join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");
		const url = URL.createObjectURL(blob);

		link.setAttribute("href", url);
		link.setAttribute("download", `${fileName}_${new Date().toISOString().split("T")[0]}.csv`);
		link.style.visibility = "hidden";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		toast.success("CSV exportado exitosamente");
	} catch (error) {
		console.error("Error al exportar CSV:", error);
		toast.error("Error al exportar CSV");
	}
}
