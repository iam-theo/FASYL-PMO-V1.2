import PropTypes from 'prop-types';
import { REPORT_SORT_FIELDS } from '../../constants/query.constants';
import { ReportCard } from '../cards/ReportCard';
import { SortableColumnHeader } from './SortableColumnHeader';
import { ReportTableRow } from './ReportTableRow';

/**
 * The reports table.
 *
 * Below `md` it swaps to a stacked card list rather than a horizontally
 * scrolling table — a seven-column table on a phone is technically responsive
 * and practically unusable. Same data, same actions, different shape.
 *
 * Presentational: it receives rows and emits intent. Loading, empty and error
 * states are the page's decision, because only the page knows whether "no
 * rows" means "no reports yet" or "no matches for these filters".
 */
export const ReportTable = ({
  reports,
  sort,
  onSortChange,
  onView,
  onEdit,
  onDelete,
  onPrefetch = null,
  caption = 'Reports',
}) => (
  <>
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <caption className="sr-only">{caption}</caption>

          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr>
              <SortableColumnHeader
                field="title"
                label={REPORT_SORT_FIELDS.title}
                sort={sort}
                onSortChange={onSortChange}
                className="w-[28%]"
              />
              <SortableColumnHeader
                field="projectId"
                label={REPORT_SORT_FIELDS.projectId}
                sort={sort}
                onSortChange={onSortChange}
                className="w-[18%]"
              />
              <SortableColumnHeader
                field="type"
                label={REPORT_SORT_FIELDS.type}
                sort={sort}
                onSortChange={onSortChange}
              />
              <SortableColumnHeader
                field="format"
                label={REPORT_SORT_FIELDS.format}
                sort={sort}
                onSortChange={onSortChange}
              />
              <SortableColumnHeader
                field="periodStart"
                label="Period"
                sort={sort}
                onSortChange={onSortChange}
              />
              <SortableColumnHeader
                field="generatedAt"
                label={REPORT_SORT_FIELDS.generatedAt}
                sort={sort}
                onSortChange={onSortChange}
              />
              <th scope="col" className="w-12 px-2 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => (
              <ReportTableRow
                key={report.id}
                report={report}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                onPrefetch={onPrefetch}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <ul className="flex flex-col gap-3 md:hidden">
      {reports.map((report) => (
        <li key={report.id}>
          <ReportCard
            report={report}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onPrefetch={onPrefetch}
          />
        </li>
      ))}
    </ul>
  </>
);

ReportTable.propTypes = {
  reports: PropTypes.arrayOf(PropTypes.object).isRequired,
  sort: PropTypes.shape({
    field: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(['asc', 'desc']).isRequired,
  }).isRequired,
  onSortChange: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  /** Called on row hover/focus to warm the detail cache. */
  onPrefetch: PropTypes.func,
  caption: PropTypes.string,
};
