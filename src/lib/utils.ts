/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { PayFrequency } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
}

export function calculatePayPeriod(paymentDateStr: string, frequency: PayFrequency): { startDate: string, endDate: string } {
  // Parse the payment date
  const paymentDate = new Date(paymentDateStr);
  if (isNaN(paymentDate.getTime())) {
    return { startDate: paymentDateStr, endDate: paymentDateStr };
  }

  const startDate = new Date(paymentDate);
  const endDate = new Date(paymentDate);

  // Set time to noon to avoid timezone issues when manipulating dates
  startDate.setHours(12, 0, 0, 0);
  endDate.setHours(12, 0, 0, 0);

  switch (frequency) {
    case 'weekly':
      startDate.setDate(endDate.getDate() - 6);
      break;
    case 'bi-weekly':
      startDate.setDate(endDate.getDate() - 13);
      break;
    case 'semi-monthly':
      if (endDate.getDate() <= 15) {
        startDate.setDate(1);
        endDate.setDate(15);
      } else {
        startDate.setDate(16);
        endDate.setMonth(endDate.getMonth() + 1, 0); 
      }
      break;
    case 'monthly':
      startDate.setDate(1);
      endDate.setMonth(endDate.getMonth() + 1, 0);
      break;
    case 'annually':
      startDate.setMonth(0, 1);
      endDate.setMonth(11, 31);
      break;
  }
  
  return { 
    startDate: startDate.toISOString().split('T')[0], 
    endDate: endDate.toISOString().split('T')[0] 
  };
}
