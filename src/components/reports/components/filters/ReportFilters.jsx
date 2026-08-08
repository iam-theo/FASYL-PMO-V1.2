import { useState } from 'react';
import PropTypes from 'prop-types';
import { Check, SlidersHorizontal } from 'lucide-react';
import {
  REPORT_FORMAT_OPTIONS,
  REPORT_TYPE_OPTIONS,
} from '../../constants/report.constants';
import { DEFAULT_REPORT_FILTERS } from '../../constants/query.constants';
import { countActiveFilters } from '../../utils/reportQuery';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Popover } from '../ui/Popover';
import { DateRangePicker } from './DateRangePicker';

/**
 * Filter panel.
 *
 * Fully controlled: it renders `filters` and emits the next value. It holds no
 * copy of the state, so the URL can be the source of truth without this
 * component and the address bar ever disagreeing.
 *
 * Multi-select uses checkbox semantics rather than a listbox — the options are
 * few and known, and checkboxes make "several at once" obvious without needing
 * a modifier key.
 */

const ToggleChip = ({ isSelected, onToggle, children }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={isSelected}
    onClick={onToggle}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
      isSelected
        ? 'border-blue-200 bg-blue-50 text-blue-700'
        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
    )}
  >
    {isSelected && <Check aria-hidden="true" className="size-3" />}
    {children}
  </button>
);

ToggleChip.propTypes = {
  isSelected: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  children: PropTypes.node,
};

const FilterSection = ({ title, children }) => (
  <fieldset className="border-t border-slate-100 px-4 py-3.5 first:border-t-0">
    <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {title}
    </legend>
    {children}
  </fieldset>
);

FilterSection.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node };

export const ReportFilters = ({ filters, onChange, projects = [], stages = [], isLoadingStages = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  const patch = (partial) => onChange({ ...filters, ...partial });

  const toggleInList = (key, value) => {
    const current = filters[key] ?? [];
    patch({
      [key]: current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value],
    });
  };

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      ariaLabel="Filter reports"
      panelClassName="sm:w-80"
      trigger={(triggerProps) => (
        <Button
          {...triggerProps}
          variant="secondary"
          leadingIcon={SlidersHorizontal}
          className={cn(activeCount > 0 && 'border-blue-200 ring-blue-200')}
        >
          Filters
          {activeCount > 0 && (
            <span className="ml-0.5 inline-flex size-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </Button>
      )}
    >
      {() => (
        <div>
          <div className="flex items-center justify-between px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Filters</h3>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => onChange({ ...DEFAULT_REPORT_FILTERS, search: filters.search })}
                className="rounded text-xs font-medium text-blue-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                Clear all
              </button>
            )}
          </div>

          <FilterSection title="Project">
            <select
              value={filters.projectId ?? ''}
              onChange={(event) =>
                // Changing project invalidates any stage picked under the old one.
                patch({ projectId: event.target.value || null, stageId: null })
              }
              aria-label="Filter by project"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.clientName
                    ? `${project.name.trim()} — ${project.clientName}`
                    : project.name.trim()}
                </option>
              ))}
            </select>

            {filters.projectId && (
              <select
                value={filters.stageId ?? ''}
                disabled={isLoadingStages || stages.length === 0}
                onChange={(event) =>
                  patch({ stageId: event.target.value ? Number(event.target.value) : null })
                }
                aria-label="Filter by stage"
                className="mt-2 h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {isLoadingStages
                    ? 'Loading stages…'
                    : stages.length === 0
                      ? 'No stages in this project'
                      : 'All stages'}
                </option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            )}
          </FilterSection>

          <FilterSection title="Type">
            <div className="flex flex-wrap gap-1.5">
              {REPORT_TYPE_OPTIONS.map((option) => (
                <ToggleChip
                  key={option.value}
                  isSelected={filters.types?.includes(option.value)}
                  onToggle={() => toggleInList('types', option.value)}
                >
                  {option.label}
                </ToggleChip>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Format">
            <div className="flex flex-wrap gap-1.5">
              {REPORT_FORMAT_OPTIONS.map((option) => (
                <ToggleChip
                  key={option.value}
                  isSelected={filters.formats?.includes(option.value)}
                  onToggle={() => toggleInList('formats', option.value)}
                >
                  {option.label}
                </ToggleChip>
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Generated between">
            <DateRangePicker
              from={filters.generatedFrom}
              to={filters.generatedTo}
              onChange={({ from, to }) => patch({ generatedFrom: from, generatedTo: to })}
            />
          </FilterSection>

          <div className="border-t border-slate-100 p-3 sm:hidden">
            <Button variant="primary" className="w-full" onClick={() => setIsOpen(false)}>
              Show results
            </Button>
          </div>
        </div>
      )}
    </Popover>
  );
};

ReportFilters.propTypes = {
  filters: PropTypes.shape({
    search: PropTypes.string,
    projectId: PropTypes.string,
    stageId: PropTypes.number,
    types: PropTypes.arrayOf(PropTypes.string),
    formats: PropTypes.arrayOf(PropTypes.string),
    generatedFrom: PropTypes.string,
    generatedTo: PropTypes.string,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  projects: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired }),
  ),
  stages: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.number.isRequired, name: PropTypes.string.isRequired }),
  ),
  isLoadingStages: PropTypes.bool,
};
