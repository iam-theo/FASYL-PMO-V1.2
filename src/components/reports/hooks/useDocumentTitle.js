import { useEffect } from 'react';

/**
 * Sets the tab title while a page is mounted and restores it on the way out.
 *
 * Small, but it is what makes a report findable when someone has fifteen tabs
 * open — and it is the accessible name of the page for screen-reader users
 * switching windows.
 */
export const useDocumentTitle = (title, { suffix = 'PMO' } = {}) => {
  useEffect(() => {
    if (!title) return undefined;

    const previous = document.title;
    document.title = suffix ? `${title} · ${suffix}` : title;

    return () => {
      document.title = previous;
    };
  }, [title, suffix]);
};
