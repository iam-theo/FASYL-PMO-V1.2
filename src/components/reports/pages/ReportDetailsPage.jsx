import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarRange,
  Clock,
  Download,
  FileText,
  FolderOpen,
  Layers,
  Link,
  Pencil,
  Tag,
  Trash2,
} from 'lucide-react';
import { ERROR_MESSAGES, TOAST_MESSAGES } from '../constants/messages.constants';
import { REPORTS_ROUTES } from '../constants/routes.constants';
import { getReportFormatMeta } from '../constants/report.constants';
import {
  useDocumentTitle,
  useProject,
  useReport,
  useReportDownload,
  useReportMutations,
} from '../hooks';
import { formatDateRange, formatDateTime, formatRelativeTime } from '../utils/date';
import { buildShareUrl, copyToClipboard } from '../utils/download';
import { getDownloadLabel } from '../utils/reportFile';
import { Button } from '../components/ui/Button';
import { FormatBadge, ReportTypeBadge } from '../components/ui/Badge';
import { ErrorState } from '../components/ui/ErrorState';
import { PageHeader } from '../components/ui/PageHeader';
import { DetailSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import { InfoCard } from '../components/cards/InfoCard';
import { DeleteReportDialog } from '../components/dialogs/DeleteReportDialog';

/**
 * Report detail.
 *
 * Ordered by what someone opening a report actually wants: what it is, then
 * what it says, then where the file lives. Metadata is a definition list so
 * the label/value pairing survives being read aloud.
 */
export const ReportDetailsPage = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { report, isLoading, error, isInvalidId, refetch } = useReport(reportId);
  const { project } = useProject(report?.projectId);
  const { deleteReport } = useReportMutations();
  const download = useReportDownload();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const headingRef = useRef(null);

  useDocumentTitle(report?.title);

  const stage = project?.stages?.find((entry) => entry.id === report?.stageId) ?? null;

  const handleCopyLink = async () => {
    const copied = await copyToClipboard(buildShareUrl(REPORTS_ROUTES.details(report.id)));
    if (copied) toast.success(TOAST_MESSAGES.copySuccess);
    else toast.error('The link could not be copied. Copy it from the address bar instead.');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteReport(report.id);
    setIsDeleting(false);
    setIsDialogOpen(false);

    // No optimistic path here: the record being viewed is the whole page, so
    // there is nothing to show while the request is in flight.
    if (result.ok) {
      toast.success(TOAST_MESSAGES.deleteSuccess);
      navigate(REPORTS_ROUTES.list(), { replace: true });
    }
  };

  const backToList = {
    label: 'Back to reports',
    icon: ArrowLeft,
    onClick: () => navigate(REPORTS_ROUTES.list()),
  };

  if (isInvalidId) {
    return (
      <ErrorState
        error={{ message: ERROR_MESSAGES.notFound }}
        title="Report not found"
        action={backToList}
      />
    );
  }
  if (error) return <ErrorState error={error} onRetry={refetch} action={backToList} />;
  if (isLoading || !report) return <DetailSkeleton />;

  return (
    <div ref={headingRef} tabIndex={-1} className="flex flex-col gap-6 outline-none">
      <PageHeader
        title={report.title}
        description={report.description ?? undefined}
        breadcrumbs={[{ label: 'Reports', to: REPORTS_ROUTES.list() }, { label: report.title }]}
        actions={
          <>
            <Button variant="secondary" leadingIcon={Download} onClick={() => download(report)}>
              {getDownloadLabel(report)}
            </Button>
            <Button variant="ghost" leadingIcon={Link} onClick={handleCopyLink}>
              Copy link
            </Button>
            <Button
              variant="secondary"
              leadingIcon={Pencil}
              onClick={() => navigate(REPORTS_ROUTES.edit(report.id))}
            >
              Edit
            </Button>
            <Button variant="danger" leadingIcon={Trash2} onClick={() => setIsDialogOpen(true)}>
              Delete
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <ReportTypeBadge type={report.type} />
        <FormatBadge format={report.format} />
        <span className="text-xs text-slate-500">
          Generated <time dateTime={report.generatedAt}>{formatRelativeTime(report.generatedAt)}</time>
        </span>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard
          icon={FolderOpen}
          label="Project"
          value={project?.name ?? report.projectId}
        />
        <InfoCard
          icon={Layers}
          label="Stage"
          value={stage?.name ?? (report.stageId ? `Stage ${report.stageId}` : 'Whole project')}
        />
        <InfoCard icon={Tag} label="Type" value={<ReportTypeBadge type={report.type} />} />
        <InfoCard
          icon={CalendarRange}
          label="Reporting period"
          value={formatDateRange(report.periodStart, report.periodEnd)}
        />
        <InfoCard icon={Clock} label="Generated" value={formatDateTime(report.generatedAt)} />
        <InfoCard
          icon={FileText}
          label="Format"
          value={getReportFormatMeta(report.format).label}
        />
      </dl>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">Report content</h2>
        </header>
        <div className="px-5 py-4">
          {report.content ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {report.content}
            </p>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-slate-500">
                {report.fileUrl
                  ? 'This report has no inline content — everything is in the attached file.'
                  : 'This report has no content yet. Add some, or download the metadata sheet.'}
              </p>
              {!report.fileUrl && (
                <Button
                  variant="secondary"
                  leadingIcon={Pencil}
                  onClick={() => navigate(REPORTS_ROUTES.edit(report.id))}
                >
                  Add content
                </Button>
              )}
            </div>
          )}
        </div>
      </section>

      {report.fileUrl && (
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">Attached file</h2>
          </header>
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {report.fileName ?? 'Generated file'}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {report.fileType ?? (getReportFormatMeta(report.format).mimeType || 'Unknown type')}
              </p>
              <p className="mt-1 truncate font-mono text-xs text-slate-400">{report.fileUrl}</p>
            </div>
            <Button
              as="a"
              href={report.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              leadingIcon={Download}
              className="shrink-0"
            >
              Open file
            </Button>
          </div>
        </section>
      )}

      <DeleteReportDialog
        isOpen={isDialogOpen}
        report={report}
        isDeleting={isDeleting}
        returnFocusRef={headingRef}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};
