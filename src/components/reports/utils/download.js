import { TOAST_MESSAGES } from '../constants/messages.constants';

/**
 * File and link helpers.
 *
 * `noopener,noreferrer` on every external open: without it the opened page can
 * reach back through `window.opener` and navigate this app somewhere else.
 */

/** Opens a report's file in a new tab. */
export const openFile = (url) => {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Copies text, falling back to a hidden textarea where the async Clipboard API
 * is unavailable (older Safari, and any page not served over HTTPS).
 * @returns {Promise<boolean>} whether the copy succeeded
 */
export const copyToClipboard = async (text) => {
  if (!text) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
};

/** Absolute URL for a report, for sharing outside the app. */
export const buildShareUrl = (path) => new URL(path, window.location.origin).toString();

export const COPY_SUCCESS_MESSAGE = TOAST_MESSAGES.copySuccess;
