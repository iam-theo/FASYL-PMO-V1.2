import { useCallback } from 'react';
import { reportService } from '../services/reportService';
import { projectService } from '../services/projectService';
import { downloadReport } from '../utils/reportFile';
import { useToast } from '../components/ui/Toast';

/**
 * Downloads a report, fetching the full record first when needed.
 *
 * WHY THE EXTRA FETCH: list endpoints commonly trim heavy columns — `content`
 * can be 20,000 characters per row, so returning it for every row of a table
 * nobody has scrolled to is wasteful. That means the report object behind a
 * table row may be a summary, and exporting it produced a file that said "this
 * report has no inline content" even though the report was full of it.
 *
 * So: if the row has no `content` and no `fileUrl`, ask for the real thing
 * before building the file. It is a cached read, and hovering the row has
 * usually already prefetched it, so in practice this costs nothing.
 *
 * The fetched record is spread OVER the row, not under it: the row carries
 * `projectName` and `stageName` resolved from the projects list, which the
 * single-report endpoint does not return.
 *
 * WHY THE NAME LOOKUP: the single-report endpoint and freshly created reports
 * carry only `projectId`/`stageId`, so a PDF downloaded from the details page
 * (or right after creation) would otherwise print bare ids. When the report
 * does not already carry the display names, resolve them from the cached
 * projects list. Names are decoration — if the lookup fails, the export still
 * works with the ids.
 */
export const useReportDownload = () => {
  const toast = useToast();

  return useCallback(
    async (report) => {
      if (!report) return;

      let full = report;

      const isSummary =
        !report.fileUrl && (report.content === null || report.content === undefined);

      if (isSummary && report.id !== null && report.id !== undefined) {
        try {
          const fetched = await reportService.getReportById(report.id);
          full = { ...report, ...fetched };
        } catch {
          // Export what we have rather than failing outright.
        }
      }

      const needsNames =
        full.projectId &&
        [full.projectName, full.stageName].some(
          (name) => name === undefined || name === null,
        );

      if (needsNames) {
        try {
          const projects = await projectService.getProjects();
          const project = projects.find((entry) => entry.id === full.projectId) ?? null;
          if (project) {
            const stage =
              project.stages?.find((entry) => entry.id === full.stageId) ?? null;
            full = {
              ...full,
              projectName: project.name,
              stageName: stage?.name ?? null,
            };
          }
        } catch {
          // Names are decoration — the export still works with the ids.
        }
      }

      const result = downloadReport(full);

      if (!result.ok) {
        toast.error('The report could not be downloaded. Please try again.');
      }
    },
    [toast],
  );
};
