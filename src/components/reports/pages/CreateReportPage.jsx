import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import { EMPTY_STATES } from "../constants/messages.constants";
import {
  QUERY_PARAM_KEYS,
  REPORTS_ROUTES,
} from "../constants/routes.constants";
import { REPORT_FORM_DEFAULT_VALUES } from "../schemas/report.schema";
import {
  useDocumentTitle,
  useProjectStages,
  useProjects,
  useReportMutations,
} from "../hooks";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/ui/PageHeader";
import { FormSkeleton } from "../components/ui/Skeleton";
import { ReportForm } from "../components/forms/ReportForm";

/**
 * Create report.
 *
 * The selected project is page state rather than form state, because two
 * separate things need it: the form (as a field value) and the stages request.
 * The form reports the change upward through `onProjectChange`; the page turns
 * that into a fetch.
 *
 * `?project=PROJ-001` pre-selects a project, so a "Create report" button on a
 * project dashboard can deep-link straight into a scoped form.
 */
export const CreateReportPage = () => {
  useDocumentTitle("Create report");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetProjectId = searchParams.get(QUERY_PARAM_KEYS.projectId) ?? "";

  const [selectedProjectId, setSelectedProjectId] = useState(
    presetProjectId || null,
  );

  const {
    projects,
    isLoading: isLoadingProjects,
    error: projectsError,
    refetch,
  } = useProjects();
  const { stages, isLoading: isLoadingStages } =
    useProjectStages(selectedProjectId);
  const { createReport, isSubmitting, fieldErrors } = useReportMutations();

  // Stable identity: ReportForm resets whenever this object changes.
  const defaultValues = useMemo(
    () => ({ ...REPORT_FORM_DEFAULT_VALUES, projectId: presetProjectId }),
    [presetProjectId],
  );

  const handleSubmit = async (values) => {
    const result = await createReport(values);
    if (!result.ok) return;

    // Land on the thing that was just made, not back in a list to hunt for it —
    // unless the server's response carried no id, in which case the list is the
    // only honest destination.
    const created = result.data;
    navigate(
      created?.id === null || created?.id === undefined
        ? REPORTS_ROUTES.list()
        : REPORTS_ROUTES.details(created.id),
      { replace: true },
    );
  };

  return (
    <div
      style={{
        overflowY: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      className="no-scrollbar mx-auto flex w-full max-w-5xl flex-col gap-6"
    >
      <PageHeader
        title="Create report"
        description="Generate a project analytics report and attach its output."
        breadcrumbs={[
          { label: "Reports", to: REPORTS_ROUTES.list() },
          { label: "Create" },
        ]}
      />

      {projectsError && projects.length === 0 ? (
        <ErrorState
          error={projectsError}
          onRetry={refetch}
          title="Projects could not be loaded"
        />
      ) : isLoadingProjects ? (
        <FormSkeleton fields={8} />
      ) : projects.length === 0 ? (
        // Every report is scoped to a project, so an empty project list is a
        // dead end. Say so plainly instead of rendering a form that cannot be
        // submitted.
        <EmptyState
          icon={FolderOpen}
          title={EMPTY_STATES.noProjects.title}
          description={EMPTY_STATES.noProjects.body}
          action={{
            label: "Back to reports",
            onClick: () => navigate(REPORTS_ROUTES.list()),
          }}
          secondaryAction={{ label: "Check again", onClick: refetch }}
        />
      ) : (
        <ReportForm
          defaultValues={defaultValues}
          projects={projects}
          stages={stages}
          isLoadingStages={isLoadingStages}
          isSubmitting={isSubmitting}
          serverErrors={fieldErrors}
          submitLabel="Create report"
          onProjectChange={setSelectedProjectId}
          onSubmit={handleSubmit}
          onCancel={() => navigate(REPORTS_ROUTES.list())}
        />
      )}
    </div>
  );
};
