import PropTypes from 'prop-types';
import { isoToLocalInput, localInputToIso } from '../../utils/date';
import { cn } from '../../utils/cn';

/**
 * Paired date inputs.
 *
 * Native date inputs, on purpose: they bring a keyboard-accessible calendar,
 * locale-aware ordering and a proper mobile picker that a hand-built calendar
 * grid would have to re-earn.
 *
 * `min`/`max` are cross-bound so the control cannot express an impossible
 * range — you cannot pick an end date before the start you already chose.
 */
export const DateRangePicker = ({
  from,
  to,
  onChange,
  fromLabel = 'From',
  toLabel = 'To',
  className,
  disabled = false,
}) => {
  const toDateOnly = (iso) => (iso ? isoToLocalInput(iso).slice(0, 10) : '');

  const handleChange = (key) => (event) => {
    const { value } = event.target;
    // Widen to the full day so "to: 3 Aug" includes everything generated that day.
    const time = key === 'from' ? 'T00:00' : 'T23:59';
    onChange({ from, to, [key]: value ? localInputToIso(`${value}${time}`) : null });
  };

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">{fromLabel}</span>
        <input
          type="date"
          value={toDateOnly(from)}
          max={toDateOnly(to) || undefined}
          disabled={disabled}
          onChange={handleChange('from')}
          className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">{toLabel}</span>
        <input
          type="date"
          value={toDateOnly(to)}
          min={toDateOnly(from) || undefined}
          disabled={disabled}
          onChange={handleChange('to')}
          className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50"
        />
      </label>
    </div>
  );
};

DateRangePicker.propTypes = {
  from: PropTypes.string,
  to: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  fromLabel: PropTypes.string,
  toLabel: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};
