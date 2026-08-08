import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { REPORT_FORMAT, getReportFormatMeta } from '../constants/report.constants';
import { formatDateRange, formatDateTime } from './date';
import { openFile } from './download';

/**
 * Turning a report into a file the user can keep.
 *
 * WHY THIS EXISTS: `format` used to be a label and nothing more. A report with
 * content but no `fileUrl` offered no download at all, so choosing "PDF" on the
 * form promised something the app never delivered.
 *
 * WHAT EACH FORMAT DOES NOW:
 *   - CSV, HTML and Markdown are produced exactly, from a Blob.
 *   - PDF is a real PDF generated with jsPDF + jspdf-autotable (metadata table
 *     first, then the prose content wrapped across pages).
 *   - Excel (.xlsx) is a genuine OOXML workbook generated with SheetJS.
 *   - Word keeps the old HTML-in-a-.doc route (both Office apps open it), but it
 *     is NOT true OOXML.
 *
 * A report that already has `fileUrl` always wins: that is the real artefact,
 * and anything generated here would be a lesser copy of it.
 */

const EXTENSIONS = {
  [REPORT_FORMAT.PDF]: 'pdf',
  [REPORT_FORMAT.DOCX]: 'doc',
  [REPORT_FORMAT.XLSX]: 'xlsx',
  [REPORT_FORMAT.CSV]: 'csv',
  [REPORT_FORMAT.HTML]: 'html',
  [REPORT_FORMAT.MARKDOWN]: 'md',
};

const MIME_TYPES = {
  [REPORT_FORMAT.PDF]: 'application/pdf',
  [REPORT_FORMAT.DOCX]: 'application/msword',
  [REPORT_FORMAT.XLSX]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  [REPORT_FORMAT.CSV]: 'text/csv;charset=utf-8',
  [REPORT_FORMAT.HTML]: 'text/html;charset=utf-8',
  [REPORT_FORMAT.MARKDOWN]: 'text/markdown;charset=utf-8',
};

const slugify = (value) =>
  String(value ?? 'report')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'report';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Label/value pairs that head every generated format.
 *
 * `includeDescription` exists because the rich formats (HTML, Word, PDF) show
 * the description as a lead paragraph under the title, where it reads properly.
 * The tabular formats have nowhere to put a lead paragraph, so it becomes a row
 * — otherwise a CSV export silently loses it.
 */
const metadataRows = (report, { includeDescription = false } = {}) => [
  ['Title', report.title],
  ...(includeDescription ? [['Description', report.description ?? '—']] : []),
  ['Project', report.projectName ?? report.projectId],
  ['Stage', report.stageName ?? (report.stageId ? `Stage ${report.stageId}` : 'Whole project')],
  ['Type', report.type],
  ['Format', getReportFormatMeta(report.format).label],
  ['Reporting period', formatDateRange(report.periodStart, report.periodEnd)],
  ['Generated', formatDateTime(report.generatedAt)],
];

const buildHtml = (report) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(report.title)}</title>
<style>
  body { font-family: ui-sans-serif, system-ui, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 40px; line-height: 1.6; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .06em; color: #64748b; margin: 0 0 8px; }
  p.lead { color: #475569; margin: 0 0 24px; }
  table { border-collapse: collapse; margin-bottom: 28px; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 12px; text-align: left; font-size: 13px; vertical-align: top; }
  th { background: #f8fafc; color: #475569; font-weight: 600; white-space: nowrap; }
  pre { white-space: pre-wrap; font-family: inherit; font-size: 14px; margin: 0; }
  @page { margin: 18mm; }
</style>
</head>
<body>
<h1>${escapeHtml(report.title)}</h1>
${report.description ? `<p class="lead">${escapeHtml(report.description)}</p>` : ''}
<table>
${metadataRows(report)
  .map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`)
  .join('\n')}
</table>
<h2>Report content</h2>
<pre>${escapeHtml(report.content ?? 'This report has no inline content.')}</pre>
</body>
</html>`;

const buildMarkdown = (report) =>
  [
    `# ${report.title}`,
    report.description ? `\n_${report.description}_` : '',
    '',
    ...metadataRows(report).map(([label, value]) => `- **${label}:** ${value}`),
    '',
    '---',
    '',
    '## Report content',
    '',
    report.content ?? '_This report has no inline content._',
    '',
  ].join('\n');

/** RFC 4180 quoting — content is prose and will contain commas and newlines. */
const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const buildCsv = (report) =>
  [
    ['Field', 'Value'].map(csvCell).join(','),
    ...metadataRows(report, { includeDescription: true }).map((row) =>
      row.map(csvCell).join(','),
    ),
    ['Content', report.content ?? ''].map(csvCell).join(','),
  ].join('\r\n');

/**
 * Real .xlsx bytes (SheetJS), laid out as Field/Value rows plus a wrapped
 * Content row. Column widths and wrap-text keep the prose readable in Excel.
 */
const buildXlsx = (report) => {
  const rows = [
    ['Field', 'Value'],
    ...metadataRows(report, { includeDescription: true }),
    ['Content', report.content ?? ''],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 20 }, { wch: 80 }];

  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let r = 0; r <= range.e.r; r += 1) {
    const cell = worksheet[XLSX.utils.encode_cell({ r, c: 1 })];
    if (cell) {
      cell.t = 's';
      cell.s = { alignment: { wrapText: true, vertical: 'top' } };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
};

/** Real PDF bytes (jsPDF + autotable): metadata table, then wrapped content. */
const buildPdf = (report) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(report.title, margin, 18);

  let startY = 24;
  if (report.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(doc.splitTextToSize(report.description, maxWidth), margin, startY);
    startY += 8;
  }

  autoTable(doc, {
    head: [['Field', 'Value']],
    body: metadataRows(report).map(([label, value]) => [label, value]),
    startY,
    margin: { left: margin, right: margin, top: margin, bottom: margin },
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [27, 60, 74], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 249, 251] },
  });

  let y = doc.lastAutoTable.finalY + 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Report content', margin, y);
  y += 6;

  const content = report.content ?? 'This report has no inline content.';
  const lines = doc.splitTextToSize(content, maxWidth);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  for (const line of lines) {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 5;
  }

  return doc.output('blob');
};

/**
 * @param {import('../types').Report} report
 * @returns {{ blob: Blob, filename: string }}
 */
export const buildReportBlob = (report) => {
  const format = report.format?.toUpperCase();
  const extension = EXTENSIONS[format] ?? 'txt';
  const filename = `${slugify(report.title)}.${extension}`;

  const body =
    format === REPORT_FORMAT.MARKDOWN
      ? buildMarkdown(report)
      : format === REPORT_FORMAT.CSV
        ? buildCsv(report)
        : format === REPORT_FORMAT.XLSX
          ? buildXlsx(report)
          : format === REPORT_FORMAT.PDF
            ? buildPdf(report)
            : buildHtml(report);

  return {
    filename,
    blob: new Blob([body], { type: MIME_TYPES[format] ?? 'text/plain;charset=utf-8' }),
  };
};

/** Saves a Blob under a chosen name and releases the object URL afterwards. */
export const saveBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoking immediately can cancel the download in Safari.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * The one entry point the UI calls.
 * @returns {{ ok: boolean }}
 */
export const downloadReport = (report) => {
  if (!report) return { ok: false };

  // A real uploaded artefact always beats a generated stand-in.
  if (report.fileUrl) {
    openFile(report.fileUrl);
    return { ok: true };
  }

  const file = buildReportBlob(report);
  saveBlob(file.blob, file.filename);
  return { ok: true };
};

/** Menu/button wording, so the action names what it will actually produce. */
export const getDownloadLabel = (report) => {
  if (report?.fileUrl) return 'Download file';
  return `Download ${getReportFormatMeta(report?.format).label}`;
};
