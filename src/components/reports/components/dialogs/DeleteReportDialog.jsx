import PropTypes from 'prop-types';
import { FileText } from 'lucide-react';
import { formatDateTime } from '../../utils/date';
import { ReportTypeBadge } from '../ui/Badge';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Delete confirmation for a specific report.
 *
 * Shows the report being deleted rather than asking "are you sure?" about an
 * abstraction — the row the user clicked and the record about to disappear
 * should be visibly the same thing.
 */
export const DeleteReportDialog = ({
  isOpen,
  report,
  onClose,
  onConfirm,
  isDeleting = false,
  returnFocusRef = null,
}) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    tone="danger"
    isSubmitting={isDeleting}
    returnFocusRef={returnFocusRef}
    confirmLabel={isDeleting ? 'Deleting…' : 'Delete report'}
    title="Delete this report?"
    description="This cannot be undone. Any link shared to this report will stop working."
  >
    {report && (
      <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3.5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-inset ring-slate-200">
          <FileText aria-hidden="true" className="size-4 text-slate-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{report.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {report.projectId} · Generated {formatDateTime(report.generatedAt)}
          </p>
          <ReportTypeBadge type={report.type} className="mt-2" />
        </div>
      </div>
    )}
  </ConfirmDialog>
);

DeleteReportDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  report: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    projectId: PropTypes.string,
    type: PropTypes.string,
    generatedAt: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isDeleting: PropTypes.bool,
  /** Where focus goes when the deleted row no longer exists. */
  returnFocusRef: PropTypes.object,
};
