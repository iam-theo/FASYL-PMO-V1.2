import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { cn } from "../../utils/cn";

/**
 * Page title, breadcrumb trail and primary actions. Every page in the module
 * opens with one, so the header height and action placement never shift
 * between routes.
 */
export const PageHeader = ({
  title,
  description = null,
  breadcrumbs = [],
  actions = null,
  className,
}) => (
  <header className={cn("flex flex-col gap-4", className)}>
    {breadcrumbs.length > 0 && (
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <li key={crumb.label} className="flex items-center gap-1">
                {index > 0 && `/`}
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="rounded transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    aria-current={isLast ? "page" : undefined}
                    className={cn(isLast && "text-slate-700")}
                  >
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    )}

    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-lg">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  </header>
);

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
    }),
  ),
  actions: PropTypes.node,
  className: PropTypes.string,
};
