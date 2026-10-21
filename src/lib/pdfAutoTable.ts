/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import autoTable, { UserOptions } from 'jspdf-autotable';
import type jsPDF from 'jspdf';

/**
 * Safely invokes jspdf-autotable across both prototype and functional execution styles,
 * preventing "doc.autoTable is not a function" errors in Vite ESM bundles.
 */
export function safeAutoTable(doc: jsPDF, options: UserOptions): void {
  try {
    if (typeof (doc as any).autoTable === 'function') {
      (doc as any).autoTable(options);
    } else {
      autoTable(doc, options);
    }
  } catch (err) {
    // Fallback directly to the imported autoTable function
    autoTable(doc, options);
  }
}

export default safeAutoTable;
