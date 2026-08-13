import { jsPDF, GState } from 'jspdf';
import * as XLSX from 'xlsx';
import { REPORT_FORMAT, getReportFormatMeta, getReportTypeMeta } from '../constants/report.constants';
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
 *   - PDF is a real PDF generated with jsPDF — a branded gradient cover band,
 *     a styled metadata card and wrapped content with page footers.
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
  // Name first, id after — "ORACLE — PROJ-554839" / "Planning — Stage 4" — so
  // the human-readable label always leads and the id stays for traceability.
  ['Project', [report.projectName, report.projectId].filter(Boolean).join(' — ')],
  [
    'Stage',
    [report.stageName, report.stageId ? `Stage ${report.stageId}` : null]
      .filter(Boolean)
      .join(' — ') || 'Whole project',
  ],
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

/* ------------------------- PDF styling helpers ------------------------- */

/** Palette shared by the PDF cover band, metadata card and footers. */
const RGB = {
  navy: [27, 60, 74],
  teal: [46, 107, 124],
  amber: [245, 158, 11],
  bandMuted: [214, 227, 232],
  text: [30, 41, 59],
  muted: [100, 116, 139],
  panel: [248, 250, 252],
  border: [226, 232, 240],
  white: [255, 255, 255],
};

/** Icon-tile colours, one per metadata item (cycled). */
const TILE_COLORS = [
  [27, 60, 74], // navy
  [14, 165, 233], // sky
  [139, 92, 246], // violet
  [245, 158, 11], // amber
  [16, 185, 129], // emerald
  [244, 63, 94], // rose
];

/** jsPDF has no native gradients — fake one with thin interpolated stripes. */
const drawGradientBand = (doc, x, y, width, height, from, to) => {
  const stripes = 56;
  const step = height / stripes;
  for (let i = 0; i < stripes; i += 1) {
    const t = i / (stripes - 1);
    const rgb = from.map((channel, index) =>
      Math.round(channel + (to[index] - channel) * t),
    );
    doc.setFillColor(...rgb);
    doc.rect(x, y + i * step, width, step + 0.25, 'F');
  }
};

/** Branded footer on every page: rule, mark, title, page numbers. */
const drawPdfFooter = (doc, report, pageWidth, margin) => {
  const total = doc.getNumberOfPages();
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page);
    const y = 285;

    doc.setDrawColor(...RGB.border);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);

    doc.setFillColor(...RGB.navy);
    doc.circle(margin + 1, y + 3.2, 1, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...RGB.navy);
    doc.text('FASYL PMO', margin + 4, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...RGB.muted);
    doc.text(String(report.title ?? '').slice(0, 60), margin + 26, y + 5);

    doc.text(`Page ${page} of ${total}`, pageWidth - margin, y + 5, {
      align: 'right',
    });
  }
};

/**
 * Real PDF bytes (jsPDF): branded gradient cover band, styled metadata card
 * and wrapped content, with footers on every page.
 */
const buildPdf = (report) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const maxWidth = pageWidth - margin * 2;

  // --- Cover band ------------------------------------------------------
  const titleLines = doc.splitTextToSize(report.title, maxWidth);
  const descLines = report.description
    ? doc.splitTextToSize(report.description, maxWidth)
    : [];
  const bandHeight = 27 + titleLines.length * 7.2 + descLines.length * 4.8 + 10;

  drawGradientBand(doc, 0, 0, pageWidth, bandHeight, RGB.navy, RGB.teal);

  // Brand mark + wordmark
  doc.setFillColor(...RGB.white);
  doc.roundedRect(margin, 7, 6.5, 6.5, 1.8, 1.8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...RGB.navy);
  doc.text('F', margin + 3.25, 7 + 4.6, { align: 'center' });

  doc.setTextColor(...RGB.white);
  doc.text('FASYL PMO', margin + 9, 7 + 4.6);

  // Report-type badge (top right, glassy)
  const typeLabel = getReportTypeMeta(report.type).label;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const badgeW = doc.getTextWidth(typeLabel) + 8;
  const badgeH = 6;
  const badgeX = pageWidth - margin - badgeW;
  doc.saveGraphicsState();
  doc.setGState(new GState({ opacity: 0.18 }));
  doc.setFillColor(...RGB.white);
  doc.roundedRect(badgeX, 7.25, badgeW, badgeH, 3, 3, 'F');
  doc.restoreGraphicsState();
  doc.setTextColor(...RGB.white);
  doc.text(typeLabel, badgeX + badgeW / 2, 7.25 + 4.2, { align: 'center' });

  // Eyebrow + title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...RGB.amber);
  doc.text('R E P O R T', margin, 19.5);

  doc.setFontSize(20);
  doc.setTextColor(...RGB.white);
  doc.text(titleLines, margin, 27);

  if (descLines.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...RGB.bandMuted);
    doc.text(descLines, margin, 27 + titleLines.length * 7.2 + 5);
  }

  // Amber accent strip at the foot of the band
  doc.setFillColor(...RGB.amber);
  doc.rect(0, bandHeight - 1.5, pageWidth, 1.5, 'F');

  // --- Metadata card -----------------------------------------------------
  const items = metadataRows(report)
    .filter(([label]) => label !== 'Title' && label !== 'Description')
    .map(([label, value], index) => ({
      label,
      value,
      color: TILE_COLORS[index % TILE_COLORS.length],
    }));

  const cardX = margin;
  const cardW = pageWidth - margin * 2;
  const padding = 10;
  const columns = 2;
  const colGap = 10;
  const cellW = (cardW - padding * 2 - colGap) / columns;
  const rows = Math.ceil(items.length / columns);
  const rowH = 17;
  const cardH = 16 + rows * rowH + 10;
  const cardY = bandHeight + 10;

  doc.setFillColor(...RGB.panel);
  doc.setDrawColor(...RGB.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX, cardY, cardW, cardH, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...RGB.muted);
  doc.text('R E P O R T   D E T A I L S', cardX + padding, cardY + 8);

  items.forEach((item, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = cardX + padding + col * (cellW + colGap);
    const y = cardY + 16 + row * rowH;

    // Colour tile with the value's initial
    doc.setFillColor(...item.color);
    doc.roundedRect(x, y, 6.5, 6.5, 1.8, 1.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...RGB.white);
    doc.text(
      String(item.value).trim().charAt(0).toUpperCase() || '•',
      x + 3.25,
      y + 4.6,
      { align: 'center' },
    );

    // Label + value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...RGB.muted);
    doc.text(item.label.toUpperCase(), x + 10, y + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...RGB.text);
    const valueLines = doc.splitTextToSize(String(item.value), cellW - 10);
    doc.text(valueLines.slice(0, 2), x + 10, y + 8);
  });

  // --- Report content -----------------------------------------------------
  let y = cardY + cardH + 16;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...RGB.navy);
  doc.text('Report content', margin, y);
  doc.setDrawColor(...RGB.amber);
  doc.setLineWidth(0.8);
  doc.line(margin, y + 2.2, margin + 30, y + 2.2);
  y += 9;

  const content = report.content ?? 'This report has no inline content.';
  const lines = doc.splitTextToSize(content, maxWidth);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...RGB.text);

  for (const line of lines) {
    if (y > pageHeight - margin - 8) {
      doc.addPage();
      y = margin + 4;
    }
    doc.text(line, margin, y);
    y += 5.2;
  }

  // Footer on every page
  drawPdfFooter(doc, report, pageWidth, margin);

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
