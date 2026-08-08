import { useRef } from 'react';
import PropTypes from 'prop-types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

/**
 * Generic confirmation. Presentational only — it never performs the action, it
 * reports that the user agreed to it.
 *
 * Initial focus goes to Cancel for destructive actions: the safe option should
 * be the one an Enter keypress hits.
 */
export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'primary',
  isSubmitting = false,
  returnFocusRef = null,
  children = null,
}) => {
  const cancelRef = useRef(null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title={title}
      description={description}
      size="sm"
      closeOnBackdrop={!isSubmitting}
      initialFocusRef={tone === 'danger' ? cancelRef : null}
      returnFocusRef={returnFocusRef}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} isLoading={isSubmitting}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
};

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  confirmLabel: PropTypes.string,
  cancelLabel: PropTypes.string,
  tone: PropTypes.oneOf(['primary', 'danger']),
  isSubmitting: PropTypes.bool,
  returnFocusRef: PropTypes.object,
  children: PropTypes.node,
};
