import { useMemo } from 'react';
import { Download, Eye, Link, Pencil, Trash2 } from 'lucide-react';
import { REPORTS_ROUTES } from '../constants/routes.constants';
import { TOAST_MESSAGES } from '../constants/messages.constants';
import { getCurrentUserId } from '../services/reportService';
import { buildShareUrl, copyToClipboard } from '../utils/download';
import { getDownloadLabel } from '../utils/reportFile';
import { useToast } from '../components/ui/Toast';
import { useReportDownload } from './useReportDownload';

/**
 * The row-action menu, defined once.
 *
 * The table row and the mobile card offer the same five actions; duplicating
 * the array in both meant a new action had to be added twice and could drift.
 *
 * Download is ALWAYS offered and named after what it will produce — "Download
 * file" for an uploaded artefact, "Download CSV" / "Print / save as PDF" for a
 * report that only has inline content. It used to appear only when `fileUrl`
 * was set, which made the format field on the form purely decorative.
 */
export const useReportActions = (report, { onView, onEdit, onDelete }) => {
  const toast = useToast();
  const download = useReportDownload();

  return useMemo(() => {
    const copyLink = async () => {
      const copied = await copyToClipboard(buildShareUrl(REPORTS_ROUTES.details(report.id)));
      if (copied) toast.success(TOAST_MESSAGES.copySuccess);
      else toast.error('The link could not be copied. Copy it from the address bar instead.');
    };

    // Only the author may edit or delete a report — the server rejects anyone
    // else, so the menu must not offer those actions in the first place.
    const currentUserId = getCurrentUserId();
    const isOwner =
      report?.createdById != null && report.createdById === currentUserId;

    return [
      { label: 'View details', icon: Eye, onClick: () => onView(report) },
      ...(isOwner
        ? [
            { label: 'Edit report', icon: Pencil, onClick: () => onEdit(report) },
            {
              label: 'Delete report',
              icon: Trash2,
              tone: 'danger',
              onClick: () => onDelete(report),
            },
          ]
        : []),
      { label: getDownloadLabel(report), icon: Download, onClick: () => download(report) },
      { label: 'Copy link', icon: Link, onClick: copyLink },
    ];
  }, [report, onView, onEdit, onDelete, toast, download]);
};
