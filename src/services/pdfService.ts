import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { printDocument } from './printHelper';

export interface PdfExportOptions {
  filename?: string;
  orientation?: 'p' | 'portrait' | 'l' | 'landscape';
  format?: 'a4' | 'letter' | [number, number];
  margin?: number; // in mm
  isReceipt?: boolean;
}

/**
 * Downloads a direct .pdf file to the user's computer.
 * Uses html-to-image with native SVG foreignObject (supports oklch, CSS Grid, Flexbox, Tailwind)
 * and embeds it into a jsPDF A4 document, saving the file directly to user downloads.
 */
export async function exportElementToPdf(
  elementOrId: string | HTMLElement,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const element = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!element) {
    console.error(`[pdfService] Target element not found: ${elementOrId}`);
    return false;
  }

  const filename = options.filename || 'COSMOS_Document.pdf';
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  const isLandscape = options.orientation === 'l' || options.orientation === 'landscape';
  const isReceipt = Boolean(options.isReceipt || element.id === 'printable-receipt');

  // Width in pixels matching standard 96 DPI CSS screen rendering
  // A4 portrait: 210mm ~ 794px, A4 landscape: 297mm ~ 1122px, Receipt: 80mm ~ 320px
  const containerWidthPx = isReceipt ? 320 : isLandscape ? 1122 : 794;

  // Create an offscreen staging container in body
  // The wrapper is placed offscreen, but its child (the clone) has static position and left: 0
  // so SVG foreignObject captures it at (0, 0) without blank canvas issues
  const stagingWrapper = document.createElement('div');
  stagingWrapper.style.position = 'fixed';
  stagingWrapper.style.left = '-10000px';
  stagingWrapper.style.top = '0';
  stagingWrapper.style.width = `${containerWidthPx}px`;
  stagingWrapper.style.overflow = 'visible';
  stagingWrapper.style.zIndex = '-99999';
  stagingWrapper.style.opacity = '1';
  stagingWrapper.style.pointerEvents = 'none';

  // Clone target element
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = `${element.id}-staging-clone`;
  clone.classList.remove('hidden');
  clone.classList.remove('print:hidden');
  clone.classList.add('staging-pdf-active');

  // Clean layout overrides on clone
  clone.style.display = 'block';
  clone.style.position = 'static';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.width = `${containerWidthPx}px`;
  clone.style.maxWidth = `${containerWidthPx}px`;
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#000000';
  clone.style.margin = '0';
  clone.style.boxSizing = 'border-box';
  clone.style.visibility = 'visible';

  // Remove buttons, navigation, and interactive controls from clone
  clone.querySelectorAll('button, nav, .no-print, .print\\:hidden').forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });

  stagingWrapper.appendChild(clone);
  document.body.appendChild(stagingWrapper);

  // Microtick for styles & images to settle
  await new Promise((resolve) => setTimeout(resolve, 80));

  try {
    let dataUrl: string;
    try {
      dataUrl = await toPng(clone, {
        quality: 0.98,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: containerWidthPx,
      });
    } catch (primaryErr) {
      console.warn('[pdfService] Primary toPng failed, retrying with skipFonts: true', primaryErr);
      dataUrl = await toPng(clone, {
        quality: 0.95,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: containerWidthPx,
        skipFonts: true,
      });
    }

    if (isReceipt) {
      const receiptWidthMm = 80;
      const receiptHeightMm = Math.max((clone.offsetHeight * receiptWidthMm) / containerWidthPx, 100);
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: [receiptWidthMm, receiptHeightMm],
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, receiptWidthMm, receiptHeightMm);
      pdf.save(cleanFilename);
      return true;
    }

    const pdf = new jsPDF({
      orientation: isLandscape ? 'l' : 'p',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = isLandscape ? 297 : 210;
    const pageHeight = isLandscape ? 210 : 297;
    const margin = options.margin ?? 10;
    const printableWidth = pageWidth - margin * 2;
    const imgHeight = (clone.offsetHeight * printableWidth) / containerWidthPx;

    if (imgHeight <= pageHeight - margin * 2) {
      pdf.addImage(dataUrl, 'PNG', margin, margin, printableWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = margin;
      const usableHeight = pageHeight - margin * 2;

      pdf.addImage(dataUrl, 'PNG', margin, position, printableWidth, imgHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 5) {
        position -= usableHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', margin, position, printableWidth, imgHeight);
        heightLeft -= usableHeight;
      }
    }

    pdf.save(cleanFilename);
    return true;
  } catch (error) {
    console.error('[pdfService] Error generating PDF with html-to-image:', error);
    // Fallback to printDocument
    printDocument(typeof elementOrId === 'string' ? elementOrId : elementOrId.id, cleanFilename);
    return false;
  } finally {
    if (document.body.contains(stagingWrapper)) {
      document.body.removeChild(stagingWrapper);
    }
  }
}

/**
 * Triggers the browser's native print dialog for the target container ID using printDocument.
 */
export function printElement(
  elementOrId: string | HTMLElement,
  documentTitle: string = 'Document'
): void {
  const containerId = typeof elementOrId === 'string' ? elementOrId : elementOrId.id;
  printDocument(containerId, documentTitle);
}
