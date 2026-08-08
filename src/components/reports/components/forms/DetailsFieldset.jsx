import PropTypes from 'prop-types';
import {
  REPORT_FIELD_LIMITS,
  REPORT_FORMAT_OPTIONS,
  REPORT_TYPE_OPTIONS,
} from '../../constants/report.constants';
import { SelectField } from '../ui/SelectField';
import { TextField, TextareaField } from '../ui/TextField';
import { FormSection } from './FormSection';

/** How the report is identified, classified and dated. */
export const DetailsFieldset = ({ register, errors, description }) => (
  <FormSection title="Details" description="How this report is identified and classified.">
    <TextField
      label="Title"
      required
      placeholder="Q3 delivery progress"
      error={errors.title?.message}
      {...register('title')}
    />

    <TextareaField
      label="Description"
      rows={3}
      value={description}
      maxLength={REPORT_FIELD_LIMITS.description.max}
      placeholder="One or two lines on what this report shows."
      error={errors.description?.message}
      {...register('description')}
    />

    <div className="grid gap-5 sm:grid-cols-2">
      <SelectField
        label="Type"
        required
        options={REPORT_TYPE_OPTIONS}
        error={errors.type?.message}
        {...register('type')}
      />
      <SelectField
        label="Format"
        required
        options={REPORT_FORMAT_OPTIONS}
        error={errors.format?.message}
        {...register('format')}
      />
    </div>

    <div className="grid gap-5 sm:grid-cols-2">
      <TextField
        label="Period start"
        required
        type="datetime-local"
        error={errors.periodStart?.message}
        {...register('periodStart')}
      />
      <TextField
        label="Period end"
        required
        type="datetime-local"
        error={errors.periodEnd?.message}
        {...register('periodEnd')}
      />
    </div>
  </FormSection>
);

DetailsFieldset.propTypes = {
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  description: PropTypes.string,
};
