import { useCallback, useState } from 'react';
import { TOAST_MESSAGES } from '../constants/messages.constants';
import { reportService } from '../services/reportService';
import { isApiError, toApiError } from '../utils/apiError';
import { useToast } from '../components/ui/Toast';

/**
 * Create, update and delete, with the surrounding concerns handled once:
 * submit state, toasts, and routing 400 field errors back to the form instead
 * of into a toast the user cannot act on.
 *
 * Each mutation resolves to a `Result` (`{ ok, data }` / `{ ok, error }`)
 * rather than throwing, so pages read as a sequence of decisions instead of a
 * nest of try/catch.
 */
export const useReportMutations = () => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState(null);

  const clearFieldErrors = useCallback(() => setFieldErrors(null), []);

  const run = useCallback(
    async (operation, successMessage) => {
      setIsSubmitting(true);
      setFieldErrors(null);

      try {
        const data = await operation();
        if (successMessage) toast.success(successMessage);
        return { ok: true, data };
      } catch (caught) {
        const error = toApiError(caught);

        // A validation failure belongs next to the field that caused it.
        if (isApiError(error) && error.hasFieldErrors) {
          setFieldErrors(error.fieldErrors);
        } else {
          toast.error(error.message);
        }

        return { ok: false, error };
      } finally {
        setIsSubmitting(false);
      }
    },
    [toast],
  );

  const createReport = useCallback(
    (values) => run(() => reportService.createReport(values), TOAST_MESSAGES.createSuccess),
    [run],
  );

  const updateReport = useCallback(
    (id, values, original) =>
      run(() => reportService.updateReport(id, values, original), TOAST_MESSAGES.updateSuccess),
    [run],
  );

  /**
   * Deletion is optimistic at the call site, so the toast fires there on
   * success — this only reports the failure that triggers a rollback.
   */
  const deleteReport = useCallback(
    async (id) => {
      try {
        await reportService.deleteReport(id);
        return { ok: true, data: id };
      } catch (caught) {
        const error = toApiError(caught);
        toast.error(TOAST_MESSAGES.deleteFailed, { description: error.message });
        return { ok: false, error };
      }
    },
    [toast],
  );

  return { createReport, updateReport, deleteReport, isSubmitting, fieldErrors, clearFieldErrors };
};
