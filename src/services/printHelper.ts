/**
 * Universal print utility for AI Studio web application.
 * Defines and exports `window.printDocument`.
 */

declare global {
  interface Window {
    printDocument: (containerId: string, documentTitle?: string) => void;
  }
}

/**
 * Unified `window.printDocument` utility function that adds a temporary 'print-active' class
 * to a specific container ID, executes `window.print()`, and removes the class afterward
 * to ensure consistent CSS media query targeting across all report sections.
 *
 * @param containerId The DOM element ID of the printable report or letter
 * @param documentTitle Optional document title used for the print dialog
 */
export function printDocument(containerId: string, documentTitle?: string): void {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[printDocument] Container with ID "${containerId}" not found in DOM, falling back to window.print()`);
    window.print();
    return;
  }

  // Remove print-active from any previous containers
  document.querySelectorAll('.print-active').forEach((el) => el.classList.remove('print-active'));

  // 1. Add temporary 'print-active' class to the target container
  container.classList.add('print-active');

  // Set document title temporarily
  const originalTitle = document.title;
  if (documentTitle) {
    const cleanTitle = documentTitle.replace(/[^a-zA-Z0-9_\-\. ]/g, '_');
    document.title = cleanTitle;
  }

  // 2. Execute window.print()
  window.print();

  // 3. Remove the 'print-active' class only when print dialog finishes or on generous timeout
  let isCleanedUp = false;
  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    container.classList.remove('print-active');
    if (documentTitle) {
      document.title = originalTitle;
    }
    window.removeEventListener('afterprint', cleanup);
  };

  // Modern browsers fire 'afterprint' when user prints or cancels
  window.addEventListener('afterprint', cleanup);

  // Safety fallback after 60s (not 1.5s so preview remains active while user reviews)
  setTimeout(cleanup, 60000);
}

// Attach to window object for global availability (window.printDocument)
if (typeof window !== 'undefined') {
  window.printDocument = printDocument;
}

// Backwards-compatible export
export const triggerPrintWithTarget = (elementId: string, filename?: string) => {
  printDocument(elementId, filename);
};
