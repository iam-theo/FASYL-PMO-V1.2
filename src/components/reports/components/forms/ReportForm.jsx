import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { getReportFormatMeta } from '../../constants/report.constants';
import { REPORT_FORM_DEFAULT_VALUES, reportFormSchema } from '../../schemas/report.schema';
import { Button } from '../ui/Button';
import { ScopeFieldset } from './ScopeFieldset';
import { DetailsFieldset } from './DetailsFieldset';
import { ContentFieldset } from './ContentFieldset';

/**
 * Create/edit report — one component for both, because the fields, rules and
 * layout are identical and only the labels and submit handler differ.
 *
 * This file now owns only what is genuinely shared: the form instance, the
 * three synchronisation effects, and submission. The fields themselves live in
 * three fieldset components, each of which can be read in one screen.
 *
 * Deliberately dumb: it does not fetch projects, load stages or call the API.
 * It receives options, announces that the project changed, and hands validated
 * values to `onSubmit`. That keeps it usable in a page, a modal or a wizard
 * step without dragging data-fetching along.
 */
export const ReportForm = ({
  defaultValues = REPORT_FORM_DEFAULT_VALUES,
  projects = [],
  stages = [],
  isLoadingStages = false,
  isSubmitting = false,
  serverErrors = null,
  submitLabel = 'Create report',
  requireDirty = false,
  onSubmit,
  onProjectChange = null,
  onCancel = null,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(reportFormSchema),
    defaultValues,
    // Validate on blur, then keep re-validating as they fix it. Validating on
    // every keystroke from the start flags fields the user has not finished.
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const projectId = watch('projectId');
  const format = watch('format');
  const fileUrl = watch('fileUrl');
  const description = watch('description');
  const content = watch('content');

  // Tracks the project the form was last synced to, so a reset that *sets* the
  // project is not mistaken for the user *changing* it.
  const syncedProjectId = useRef(defaultValues.projectId);

  // Edit pages fetch the report after mount, so defaults arrive late.
  // `defaultValues` MUST be memoised by the caller — a fresh object each render
  // would reset the form on every render and loop.
  useEffect(() => {
    reset(defaultValues);
    syncedProjectId.current = defaultValues.projectId;
  }, [defaultValues, reset]);

  // Selecting a project tells the parent to load that project's stages.
  useEffect(() => {
    onProjectChange?.(projectId || null);
  }, [projectId, onProjectChange]);

  // A stage belongs to exactly one project, so changing the project must drop
  // it. Keyed off the project actually changing rather than off the stage list
  // arriving — otherwise the empty list during loading would wipe a stage the
  // edit form had just prepopulated.
  useEffect(() => {
    if (syncedProjectId.current === projectId) return;
    syncedProjectId.current = projectId;
    setValue('stageId', '');
  }, [projectId, setValue]);

  // Validation failures from the API land on the fields that caused them.
  useEffect(() => {
    if (!serverErrors) return;
    Object.entries(serverErrors).forEach(([field, message]) => {
      setError(field, { type: 'server', message });
    });
  }, [serverErrors, setError]);

  /** Fills the file type from the chosen format so it is not typed by hand. */
  const suggestFileType = () => {
    if (!fileUrl || watch('fileType')) return;
    const { mimeType } = getReportFormatMeta(format);
    if (mimeType) setValue('fileType', mimeType, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <ScopeFieldset
        register={register}
        errors={errors}
        projects={projects}
        stages={stages}
        isLoadingStages={isLoadingStages}
        hasProject={Boolean(projectId)}
      />

      <DetailsFieldset register={register} errors={errors} description={description} />

      <ContentFieldset
        register={register}
        errors={errors}
        content={content}
        onFileUrlBlur={suggestFileType}
      />

      <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          leadingIcon={Save}
          isLoading={isSubmitting}
          disabled={requireDirty && !isDirty}
        >
          {submitLabel}
        </Button>
      </footer>
    </form>
  );
};

ReportForm.propTypes = {
  /** Must be memoised — see the reset effect above. */
  defaultValues: PropTypes.object,
  projects: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string.isRequired, name: PropTypes.string.isRequired }),
  ),
  stages: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.number.isRequired, name: PropTypes.string.isRequired }),
  ),
  isLoadingStages: PropTypes.bool,
  isSubmitting: PropTypes.bool,
  /** Field-keyed messages from a 400 response — see `ApiError.fieldErrors`. */
  serverErrors: PropTypes.objectOf(PropTypes.string),
  submitLabel: PropTypes.string,
  /** Edit forms set this: nothing to save until something actually changed. */
  requireDirty: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onProjectChange: PropTypes.func,
  onCancel: PropTypes.func,
};
