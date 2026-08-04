import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

/**
 * Client-side export helpers: CSV, real .xlsx (SheetJS) and real .pdf
 * (jsPDF + autotable). Every format accepts the same shape:
 *
 *   exportData(format, { filename, columns, rows, title?, sheetName? })
 *
 * `columns` is an array of { label, value } where value(row) returns a
 * scalar; `rows` is the array of source records.
 */

const cellValue = (value) => (value === null || value === undefined ? "" : String(value));

const csvCell = (value) => `"${cellValue(value).replace(/"/g, '""')}"`;

export const exportAsCsv = ({ filename, columns, rows }) => {
  const lines = [
    columns.map((column) => column.label),
    ...rows.map((row) => columns.map((column) => column.value(row))),
  ];

  const csv = lines
    .map((line) => line.map(csvCell).join(","))
    .join("\r\n");

  // BOM so Excel detects UTF-8 instead of mangling accented characters.
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportAsExcel = ({ filename, columns, rows, sheetName = "Sheet1" }) => {
  const data = [
    columns.map((column) => column.label),
    ...rows.map((row) => columns.map((column) => column.value(row))),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Keep the "as text" cells from being reformatted by Excel.
  worksheet["!cols"] = columns.map(() => ({ wch: 24 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`, { compression: true });
};

export const exportAsPdf = ({ filename, columns, rows, title }) => {
  const doc = new jsPDF({ orientation: "landscape" });

  const head = [columns.map((column) => column.label)];
  const body = rows.map((row) => columns.map((column) => column.value(row)));

  if (title) {
    doc.setFontSize(14);
    doc.setTextColor(27, 60, 74);
    doc.text(title, 14, 14);
  }

  autoTable(doc, {
    head,
    body,
    startY: title ? 20 : 14,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [27, 60, 74], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [247, 249, 251] },
    margin: { top: 14, left: 14, right: 14, bottom: 14 },
  });

  doc.save(`${filename}.pdf`);
};

export const exportData = (format, options) => {
  switch (format) {
    case "csv":
      return exportAsCsv(options);
    case "excel":
      return exportAsExcel(options);
    case "pdf":
      return exportAsPdf(options);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

export default exportData;
