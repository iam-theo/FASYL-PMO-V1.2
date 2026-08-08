import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, RefreshCw, CirclePlusIcon } from "lucide-react";
import { EMPTY_STATES, TOAST_MESSAGES } from "../constants/messages.constants";
import { REPORTS_ROUTES } from "../constants/routes.constants";
import {
  useDocumentTitle,
  useProjectStages,
  useProjects,
  useReportMutations,
  useReportPrefetch,
  useReportQueryState,
  useReports,
} from "../hooks";
import { applyReportQuery, hasActiveFilters } from "../utils/reportQuery";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { TableSkeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { DeleteReportDialog } from "../components/dialogs/DeleteReportDialog";
import { ReportFilters } from "../components/filters/ReportFilters";
import { ReportSearch } from "../components/filters/ReportSearch";
import { ReportTable } from "../components/tables/ReportTable";

/**
 * Reports list.
 *
 * The page's job is orchestration and interpretation: it decides what an empty
 * result means, what happens when a delete fails, and where each action leads.
 * It computes nothing — filtering and paging come from the pure query engine,
 * fetching from hooks, and rendering from presentational components.
 */
export const ReportsListPage = () => {
  useDocumentTitle("Reports");

  const navigate = useNavigate();
  const toast = useToast();

  const { query, setFilters, setSort, setPage, setPageSize, resetFilters } =
    useReportQueryState();
  const { reports, error, isLoading, refetch, removeLocal, restoreLocal } =
    useReports();
  const { projects, isLoading: isLoadingProjects } = useProjects();
  const { stages, isLoading: isLoadingStages } = useProjectStages(
    query.filters.projectId,
  );
  const { deleteReport } = useReportMutations();
  const prefetchReport = useReportPrefetch();

  const [pendingDelete, setPendingDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Focus lands here when a delete removes the row that opened the dialog.
  const resultsRef = useRef(null);

  const page = useMemo(
    () => applyReportQuery(reports, query),
    [reports, query],
  );
  const isFiltered = hasActiveFilters(query.filters);

  // Every report is scoped to a project. With nothing visible, "Create report"
  // is a dead end — hide it instead of sending a user to a form they cannot use.
  const canCreateReports = !isLoadingProjects && projects.length > 0;

  // Stable identities keep the memoised table rows from re-rendering on every
  // keystroke in the search box.
  const goToDetails = useCallback(
    (report) => navigate(REPORTS_ROUTES.details(report.id)),
    [navigate],
  );
  const goToEdit = useCallback(
    (report) => navigate(REPORTS_ROUTES.edit(report.id)),
    [navigate],
  );
  const requestDelete = useCallback((report) => setPendingDelete(report), []);

  /**
   * Optimistic delete: the row leaves immediately, and comes back if the server
   * refuses. Waiting on the round trip to remove a row the user just confirmed
   * makes the whole table feel slow for the sake of a rare failure.
   */
  const confirmDelete = async () => {
    const report = pendingDelete;
    setIsDeleting(true);

    removeLocal(report.id);
    setPendingDelete(null);

    const result = await deleteReport(report.id);
    setIsDeleting(false);

    if (result.ok) {
      toast.success(TOAST_MESSAGES.deleteSuccess);
    } else {
      restoreLocal(report);
    }
  };

  const renderBody = () => {
    if (isLoading && reports.length === 0) return <TableSkeleton rows={8} />;

    if (error && reports.length === 0) {
      return <ErrorState error={error} onRetry={refetch} />;
    }

    if (page.items.length === 0) {
      if (isFiltered) {
        return (
          <EmptyState
            title={EMPTY_STATES.noResults.title}
            description={EMPTY_STATES.noResults.body}
            action={{
              label: EMPTY_STATES.noResults.action,
              onClick: resetFilters,
            }}
          />
        );
      }

      // No visible projects — "Create report" would lead to a form that cannot
      // be submitted, so point the user somewhere useful instead.
      if (!canCreateReports) {
        return (
          <EmptyState
            title={EMPTY_STATES.noProjects.title}
            description={EMPTY_STATES.noProjects.body}
            secondaryAction={{ label: "Check again", onClick: refetch }}
          />
        );
      }

      return (
        <EmptyState
          title={EMPTY_STATES.noReports.title}
          description={EMPTY_STATES.noReports.body}
          action={{
            label: EMPTY_STATES.noReports.action,
            icon: Plus,
            onClick: () => navigate(REPORTS_ROUTES.create()),
          }}
        />
      );
    }

    return (
      <>
        <p className="sr-only" role="status">
          {page.total.toLocaleString()}{" "}
          {page.total === 1 ? "report" : "reports"}
          {isFiltered ? " match the current filters" : ""}
        </p>
        <ReportTable
          reports={page.items}
          sort={query.sort}
          onSortChange={setSort}
          onView={goToDetails}
          onEdit={goToEdit}
          onDelete={requestDelete}
          onPrefetch={prefetchReport}
        />
        <Pagination
          page={page.page}
          pageCount={page.pageCount}
          pageSize={page.pageSize}
          total={page.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Reports"
        description="Generated project analytics across every project and stage."
        breadcrumbs={[{ label: "Dashboard", to: "/app" }, { label: "Reports" }]}
        actions={
          <>
            <Button
              variant="secondary"
              leadingIcon={RefreshCw}
              onClick={refetch}
              isLoading={isLoading && reports.length > 0}
            >
              Refresh
            </Button>
            {canCreateReports && (
              <Button
                style={{ backgroundColor: "#1B3C4A" }}
                variant="primary"
                className="bg-[#1B3C4A] text-white hover:bg-[#01080b] hover:text-white cursor-pointer"
                leadingIcon={CirclePlusIcon}
                onClick={() => navigate(REPORTS_ROUTES.create())}
              >
                Create report
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <ReportSearch
          value={query.filters.search}
          onChange={(search) => setFilters({ ...query.filters, search })}
          className="sm:max-w-sm sm:flex-1"
        />
        <ReportFilters
          filters={query.filters}
          onChange={setFilters}
          projects={projects}
          stages={stages}
          isLoadingStages={isLoadingStages}
        />
      </div>

      {/* tabIndex -1 so focus can be moved here programmatically, never by Tab. */}
      <div
        ref={resultsRef}
        tabIndex={-1}
        className="flex flex-col gap-5 outline-none"
      >
        {renderBody()}
      </div>

      <DeleteReportDialog
        isOpen={Boolean(pendingDelete)}
        report={pendingDelete}
        isDeleting={isDeleting}
        returnFocusRef={resultsRef}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};
