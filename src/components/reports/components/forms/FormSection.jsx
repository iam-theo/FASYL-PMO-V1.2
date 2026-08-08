import PropTypes from 'prop-types';
import { cn } from '../../utils/cn';

/**
 * A titled group of related fields.
 *
 * `fieldset`/`legend` rather than `section`/`h2`: a screen reader then
 * announces the group name when focus enters any field inside it, so someone
 * tabbing into "File name" hears that it belongs to Content. A heading alone
 * conveys that visually only.
 *
 * The legend is positioned as a block because a floating legend on a bordered
 * card looks like an accident.
 */
export const FormSection = ({ title, description = null, className, children }) => (
  <fieldset className={cn('rounded-xl border border-slate-200 bg-white p-5 shadow-sm', className)}>
    <legend className="float-left w-full p-0">
      <span className="block text-sm font-semibold text-slate-900">{title}</span>
      {description && <span className="mt-0.5 block text-sm text-slate-500">{description}</span>}
    </legend>

    <div className="clear-both flex flex-col gap-5 pt-4">{children}</div>
  </fieldset>
);

FormSection.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node,
};
