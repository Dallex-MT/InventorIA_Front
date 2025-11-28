import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "sonner";

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
	subtitle,
}: {
	title: string;
	fileName: string;
	columns: ExportColumn[];
	data: ExportData[];
	subtitle?: string;
}) {
	try {
		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const margin = 14;

		// Título
		doc.setFontSize(18);
		doc.text(title, margin, 20);

		// Subtítulo si existe
		if (subtitle) {
			doc.setFontSize(12);
			doc.setTextColor(100, 100, 100);
			doc.text(subtitle, margin, 30);
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
		doc.text(`Generado el: ${dateStr}`, pageWidth - margin, 20, { align: "right" });
		doc.setTextColor(0, 0, 0);

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
			startY: subtitle ? 35 : 30,
			margin: { left: margin, right: margin },
			styles: {
				fontSize: 9,
				cellPadding: 3,
			},
			headStyles: {
				fillColor: [66, 139, 202],
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
}: {
	sheetName: string;
	fileName: string;
	data: ExportData[];
	columns: ExportColumn[];
}) {
	try {
		// Preparar datos
		const worksheetData = [
			// Headers
			columns.map((col) => col.title),
			// Rows
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
}: {
	fileName: string;
	data: ExportData[];
	columns: ExportColumn[];
}) {
	try {
		// Preparar datos
		const csvRows = [
			// Headers
			columns
				.map((col) => col.title)
				.join(","),
			// Rows
			...data.map((record) =>
				columns
					.map((col) => {
						const value = record[col.dataIndex];
						const cellValue = col.render ? col.render(value, record) : (value ?? "");
						// Escapar comillas y envolver en comillas si contiene comas
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
