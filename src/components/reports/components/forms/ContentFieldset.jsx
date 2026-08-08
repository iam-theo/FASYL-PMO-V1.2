import PropTypes from 'prop-types';
import { Link2 } from 'lucide-react';
import { REPORT_FIELD_LIMITS } from '../../constants/report.constants';
import { TextField, TextareaField } from '../ui/TextField';
import { FormSection } from './FormSection';

/**
 * The report body: written inline, attached as a file, or both. The schema
 * requires at least one of the two — a report with neither carries no
 * information.
 */
export const ContentFieldset = ({ register, errors, content, onFileUrlBlur }) => (
  <FormSection
    title="Content"
    description="Write the report inline, link to a generated file, or do both."
  >
    <TextareaField
      label="Content"
      rows={8}
      value={content}
      maxLength={REPORT_FIELD_LIMITS.content.max}
      placeholder="Summary, findings, recommendations…"
      error={errors.content?.message}
      {...register('content')}
    />

    <TextField
      label="File URL"
      type="url"
      leadingIcon={Link2}
      placeholder="https://storage.example.com/reports/q3.pdf"
      hint="Where the generated file is stored."
      error={errors.fileUrl?.message}
      {...register('fileUrl', { onBlur: onFileUrlBlur })}
    />

    <div className="grid gap-5 sm:grid-cols-2">
      <TextField
        label="File name"
        placeholder="q3-delivery-progress.pdf"
        error={errors.fileName?.message}
        {...register('fileName')}
      />
      <TextField
        label="File type"
        placeholder="application/pdf"
        hint="Filled from the format when you add a URL."
        error={errors.fileType?.message}
        {...register('fileType')}
      />
    </div>
  </FormSection>
);

ContentFieldset.propTypes = {
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  content: PropTypes.string,
  onFileUrlBlur: PropTypes.func,
};
