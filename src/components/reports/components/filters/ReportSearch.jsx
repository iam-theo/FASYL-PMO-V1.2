import PropTypes from 'prop-types';
import { SearchInput } from '../ui/SearchInput';

/**
 * Thin wrapper that fixes the search copy for this module. Exists so the list
 * page does not have to know which fields are searchable — that lives in
 * `constants/query.constants.js` and is described here in the placeholder.
 */
export const ReportSearch = ({ value, onChange, className }) => (
  <SearchInput
    value={value}
    onChange={onChange}
    className={className}
    placeholder="Search by title, description or file…"
    aria-label="Search reports"
  />
);

ReportSearch.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
};
