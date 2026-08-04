import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ERROR_MESSAGES } from "../constants/messages.constants";
import { REPORTS_ROUTES } from "../constants/routes.constants";
import {
  useDocumentTitle,
  useProjectStages,
  useProjects,
  useReport,
  useReportMutations,
} from "../hooks";
import { toFormValues } from "../services/report.mapper";
import { ArrowLeft } from "lucide-react";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/ui/PageHeader";
import { FormSkeleton } from "../components/ui/Skeleton";
import { ReportForm } from "../components/forms/ReportForm";

/**
 * Edit report — the same form as Create, prepopulated.
 *
 * The original report is passed to `updateReport` so the service can diff it
 * and PATCH only what changed. That is why the page keeps hold of `report`
 * rather than discarding it once the form has its defaults.
 */
export const EditReportPage = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();

  const { report, isLoading, error, isInvalidId, refetch } =
    useReport(reportId);
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const { updateReport, isSubmitting, fieldErrors } = useReportMutations();

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const { stages, isLoading: isLoadingStages } =
    useProjectStages(selectedProjectId);

  useDocumentTitle(report ? `Edit ${report.title}` : "Edit report");

  // The report arrives after mount, so the first stages request starts here.
  useEffect(() => {
    if (report?.projectId) setSelectedProjectId(report.projectId);
  }, [report?.projectId]);

  // Memoised: a new object each render would retrigger the form's reset effect.
  const defaultValues = useMemo(() => toFormValues(report), [report]);

  const handleSubmit = async (values) => {
    const result = await updateReport(report.id, values, report);
    if (result.ok) navigate(REPORTS_ROUTES.details(report.id));
  };

  const backToList = {
    label: "Back to reports",
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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title={report ? `Edit ${report.title}` : "Edit report"}
        description="Only the fields you change are sent to the server."
        breadcrumbs={[
          { label: "Reports", to: REPORTS_ROUTES.list() },
          ...(report
            ? [{ label: report.title, to: REPORTS_ROUTES.details(report.id) }]
            : []),
          { label: "Edit" },
        ]}
      />

      {error ? (
        <ErrorState error={error} onRetry={refetch} action={backToList} />
      ) : isLoading || isLoadingProjects || !report ? (
        <FormSkeleton fields={8} />
      ) : (
        <ReportForm
          defaultValues={defaultValues}
          projects={projects}
          stages={stages}
          isLoadingStages={isLoadingStages}
          isSubmitting={isSubmitting}
          serverErrors={fieldErrors}
          submitLabel="Save changes"
          requireDirty
          onProjectChange={setSelectedProjectId}
          onSubmit={handleSubmit}
          onCancel={() => navigate(REPORTS_ROUTES.details(report.id))}
        />
      )}
    </div>
  );
};
