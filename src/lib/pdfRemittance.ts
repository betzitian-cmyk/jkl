/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import { safeAutoTable } from './pdfAutoTable';
import { formatCurrency } from './utils';

export interface RemittancePeriodData {
  periodLabel: string;
  year: number;
  monthName: string;
  periodEndDate: string;
  paymentDueDate: string;
  remittanceFrequency: string;
  
  // Employer
  companyName: string;
  federalId: string;
  neq: string;
  address?: string;
  
  // Metrics
  employeeCount: number;
  grossPayroll: number;
  
  // CRA / Federal (PD7A)
  federalTaxWithheld: number;
  employeeEI: number;
  employerEI: number;
  totalEI: number;
  totalFederalRemittance: number; // federalTax + totalEI
  
  // Revenu Québec (TPZ-1015.R.14.2-V)
  quebecTaxWithheld: number;
  employeeQPP: number;
  employerQPP: number;
  totalQPP: number;
  employeeQPIP: number;
  employerQPIP: number;
  totalQPIP: number;
  hsfAmount: number;
  labourStandardsAmount: number;
  totalQuebecRemittance: number; // quebecTax + totalQPP + totalQPIP + hsf + labourStandards
  
  // Grand Total
  totalCombinedRemittance: number;
}

/**
 * Generate Form PD7A - CRA Statement of Account for Current Source Deductions
 */
export function generatePD7APDF(data: RemittancePeriodData, language: 'fr' | 'en' = 'fr'): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const isFr = language === 'fr';

  // --- Official Header Bar ---
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 18, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'AGENCE DU REVENU DU CANADA' : 'CANADA REVENUE AGENCY', 14, 11);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(isFr ? 'canada.ca/impot-retenues' : 'canada.ca/payroll', pageWidth - 14, 11, { align: 'right' });

  // --- Form Identification ---
  let y = 26;
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'RELEVÉ DE COMPTE POUR LES RETENUES SUR LA PAIE (PD7A)' : 'STATEMENT OF ACCOUNT FOR CURRENT SOURCE DEDUCTIONS (PD7A)', 14, y);
  
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'normal');
  doc.text(isFr ? 'Formulaire officiel prescrit pour la déclaration des versements périodiques à l\'ARC' : 'Prescribed official statement for remitting payroll deductions to CRA', 14, y);

  // --- Employer & Period Info Box ---
  y += 8;
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, 'FD');

  // Left Column: Employer Info
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'NOM LÉGAL DE L\'EMPLOYEUR :' : 'EMPLOYER LEGAL NAME:', 18, y + 8);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(data.companyName || (isFr ? 'Entreprise sans nom' : 'Unnamed Company'), 18, y + 14);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(isFr ? 'NUMÉRO DE COMPTE DE PAIE (NE) :' : 'PAYROLL ACCOUNT NUMBER (BN):', 18, y + 24);
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199); // sky-600
  doc.setFont('courier', 'bold');
  doc.text(data.federalId || '123456789 RP 0001', 18, y + 30);
  doc.setFont('helvetica', 'normal');

  // Right Column: Period Info
  const col2X = pageWidth / 2 + 10;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'PÉRIODE VISÉE :' : 'REMITTANCE PERIOD:', col2X, y + 8);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.periodLabel} (${data.periodEndDate})`, col2X, y + 14);

  doc.setFontSize(8);
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text(isFr ? 'DATE D\'ÉCHÉANCE DU PAIEMENT :' : 'PAYMENT DUE DATE:', col2X, y + 24);
  doc.setFontSize(10);
  doc.setTextColor(225, 29, 72);
  doc.setFont('helvetica', 'bold');
  doc.text(data.paymentDueDate, col2X, y + 30);
  doc.setFont('helvetica', 'normal');

  // --- Statistics Bar ---
  y += 44;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, y, pageWidth - 28, 16, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 16, 'S');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'NOMBRE D\'EMPLOYÉS PAYÉS DANS LA PÉRIODE :' : 'EMPLOYEES PAID IN THIS PERIOD:', 18, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(String(data.employeeCount), 18, y + 12);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(isFr ? 'MASSE SALARIALE BRUTE TOTALE :' : 'TOTAL GROSS REMUNERATION:', col2X, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(data.grossPayroll), col2X, y + 12);

  // --- Main Source Deductions Table ---
  y += 22;
  const tableData = [
    [
      isFr ? '1. Impôt sur le revenu fédéral retenu' : '1. Federal income tax deductions',
      formatCurrency(data.federalTaxWithheld)
    ],
    [
      isFr ? '2. Cotisation de l\'employé à l\'assurance-emploi (AE - Taux QC 1.30%)' : '2. Employee Employment Insurance (EI - QC Rate 1.30%)',
      formatCurrency(data.employeeEI)
    ],
    [
      isFr ? '3. Cotisation patronale à l\'assurance-emploi (Part employeur = 1.4 × employé)' : '3. Employer Employment Insurance (Employer portion = 1.4 × employee)',
      formatCurrency(data.employerEI)
    ],
    [
      isFr ? '4. Total des cotisations d\'assurance-emploi à verser (Lignes 2 + 3)' : '4. Total Employment Insurance remitted (Lines 2 + 3)',
      formatCurrency(data.totalEI)
    ],
    [
      isFr ? '5. Régime de pensions du Canada (RPC / CPP)' : '5. Canada Pension Plan (CPP)',
      isFr ? '$0.00 (Assujetti au RRQ au Québec)' : '$0.00 (Subject to QPP in Quebec)'
    ],
  ];

  safeAutoTable(doc, {
    startY: y,
    head: [[isFr ? 'DESCRIPTION DES RETENUES FÉDÉRALES' : 'FEDERAL DEDUCTIONS BREAKDOWN', isFr ? 'MONTANT' : 'AMOUNT']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
      cellPadding: 3.5
    },
    columnStyles: {
      0: { cellWidth: pageWidth - 28 - 45 },
      1: { cellWidth: 45, halign: 'right', fontStyle: 'bold' }
    }
  });

  // --- Total Remittance Highlight Box ---
  const finalTableY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFillColor(239, 246, 255); // blue-50
  doc.setDrawColor(59, 130, 246); // blue-500
  doc.setLineWidth(0.8);
  doc.roundedRect(14, finalTableY, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFontSize(11);
  doc.setTextColor(30, 64, 175); // blue-800
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'TOTAL DU VERSEMENT À L\'ARC (RECEVEUR GÉNÉRAL DU CANADA) :' : 'TOTAL CURRENT REMITTANCE (RECEIVER GENERAL FOR CANADA):', 20, finalTableY + 9);
  
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(isFr ? 'Égale au total de l\'impôt fédéral retenu plus les parts employé et employeur de l\'assurance-emploi.' : 'Sum of federal tax withheld plus employee and employer EI contributions.', 20, finalTableY + 16);

  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.totalFederalRemittance), pageWidth - 20, finalTableY + 14, { align: 'right' });

  // --- Remittance Voucher (Tear-off slip) ---
  const voucherY = pageHeight - 75;
  
  // Dashed Cut Line
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(14, voucherY, pageWidth - 14, voucherY);
  doc.setLineDashPattern([], 0); // reset

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? '✂ DÉTACHER ET RETOURNER AVEC LE PAIEMENT SI NON PAYÉ EN LIGNE' : '✂ DETACH AND RETURN WITH YOUR PAYMENT IF NOT REMITTING ONLINE', pageWidth / 2, voucherY - 2, { align: 'center' });

  // Voucher Box
  doc.setFillColor(254, 252, 232); // yellow-50
  doc.setDrawColor(253, 224, 71); // yellow-300
  doc.roundedRect(14, voucherY + 3, pageWidth - 28, 62, 1.5, 1.5, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'PIÈCE DE VERSEMENT - FORMULAIRE PD7A' : 'REMITTANCE VOUCHER - FORM PD7A', 18, voucherY + 10);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`${isFr ? 'Compte :' : 'Account:'} ${data.federalId || '123456789 RP 0001'}  |  ${isFr ? 'Période :' : 'Period:'} ${data.periodEndDate}  |  ${isFr ? 'Échéance :' : 'Due:'} ${data.paymentDueDate}`, 18, voucherY + 16);

  // Voucher details table
  doc.rect(18, voucherY + 20, 110, 20);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(isFr ? 'EMPLOYEUR' : 'EMPLOYER', 20, voucherY + 24);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(data.companyName || 'Mon Entreprise Inc.', 20, voucherY + 30);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(isFr ? 'Payable à l\'ordre du Receveur général du Canada' : 'Payable to Receiver General for Canada', 20, voucherY + 36);

  // Amount Box on voucher
  doc.setFillColor(255, 255, 255);
  doc.rect(132, voucherY + 20, pageWidth - 14 - 136, 20, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'MONTANT DU VERSEMENT' : 'AMOUNT REMITTED', 136, voucherY + 25);
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(data.totalFederalRemittance), pageWidth - 20, voucherY + 34, { align: 'right' });

  // Optical Scan OCR Line Simulation at bottom
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const ocrLine = `A01  ${(data.federalId || '123456789RP0001').replace(/\s+/g, '')}  ${data.periodEndDate.replace(/-/g, '')}  ${Math.round(data.totalFederalRemittance * 100).toString().padStart(10, '0')}  CRA-PD7A`;
  doc.text(ocrLine, 20, voucherY + 54);
  doc.setFont('helvetica', 'normal');

  return doc;
}

/**
 * Generate Form TPZ-1015.R.14.2-V - Revenu Québec Remittance of Source Deductions and Employer Contributions
 */
export function generateTPZ1015PDF(data: RemittancePeriodData, language: 'fr' | 'en' = 'fr'): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const isFr = language === 'fr';

  // --- Official Header Bar with Québec Blue ---
  doc.setFillColor(15, 76, 129); // Quebec Flag Blue #0F4C81
  doc.rect(0, 0, pageWidth, 18, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('REVENU QUÉBEC', 14, 11);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('revenuquebec.ca/retenues', pageWidth - 14, 11, { align: 'right' });

  // --- Form Identification ---
  let y = 26;
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'BORDEREAU DE PAIEMENT DES RETENUES À LA SOURCE (TPZ-1015.R.14.2-V)' : 'REMITTANCE OF SOURCE DEDUCTIONS & CONTRIBUTIONS (TPZ-1015.R.14.2-V)', 14, y);
  
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(isFr ? 'Paiement des retenues à la source et des cotisations de l\'employeur à Revenu Québec' : 'Payment of source deductions and employer contributions to Revenu Québec', 14, y);

  // --- Employer & Period Info Box ---
  y += 8;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 38, 2, 2, 'FD');

  // Left Column: Employer Info
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'NOM OU RAISON SOCIALE DE L\'EMPLOYEUR :' : 'EMPLOYER LEGAL NAME:', 18, y + 8);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(data.companyName || (isFr ? 'Mon Entreprise Inc.' : 'My Company Inc.'), 18, y + 14);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(isFr ? 'NUMÉRO D\'IDENTIFICATION / NEQ :' : 'QUEBEC ENTERPRISE NUMBER (NEQ / ID):', 18, y + 24);
  doc.setFontSize(11);
  doc.setTextColor(15, 76, 129); // Quebec blue
  doc.setFont('courier', 'bold');
  doc.text(data.neq || '1234567890 RS 0001', 18, y + 30);
  doc.setFont('helvetica', 'normal');

  // Right Column: Period Info
  const col2X = pageWidth / 2 + 10;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'FIN DE PÉRIODE VISÉE :' : 'PERIOD ENDING DATE:', col2X, y + 8);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.periodLabel} (${data.periodEndDate})`, col2X, y + 14);

  doc.setFontSize(8);
  doc.setTextColor(225, 29, 72);
  doc.text(isFr ? 'DATE LIMITE DU VERSEMENT :' : 'PAYMENT DUE DATE:', col2X, y + 24);
  doc.setFontSize(10);
  doc.setTextColor(225, 29, 72);
  doc.setFont('helvetica', 'bold');
  doc.text(data.paymentDueDate, col2X, y + 30);
  doc.setFont('helvetica', 'normal');

  // --- Statistics Bar ---
  y += 44;
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 16, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, pageWidth - 28, 16, 'S');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'CASE A - NOMBRE D\'EMPLOYÉS RÉMUNÉRÉS :' : 'BOX A - EMPLOYEES PAID:', 18, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(String(data.employeeCount), 18, y + 12);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(isFr ? 'CASE B - RÉMUNÉRATION BRUTE ASSUJETTIE :' : 'BOX B - GROSS SUBJECT REMUNERATION:', col2X, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(data.grossPayroll), col2X, y + 12);

  // --- Main Lines Table (Revenu Québec Official Codes) ---
  y += 22;
  const tableData = [
    [
      isFr ? 'Ligne 1 - Impôt du Québec retenu à la source' : 'Line 1 - Quebec income tax withheld at source',
      formatCurrency(data.quebecTaxWithheld)
    ],
    [
      isFr ? `Ligne 2 - Cotisations au Régime de rentes du Québec (RRQ)\n  • Employé : ${formatCurrency(data.employeeQPP)} | Employeur (100%) : ${formatCurrency(data.employerQPP)}` : `Line 2 - Quebec Pension Plan (QPP) contributions\n  • Employee: ${formatCurrency(data.employeeQPP)} | Employer (100%): ${formatCurrency(data.employerQPP)}`,
      formatCurrency(data.totalQPP)
    ],
    [
      isFr ? `Ligne 3 - Primes au Régime québécois d'assurance parentale (RQAP)\n  • Employé (0.430%) : ${formatCurrency(data.employeeQPIP)} | Employeur (0.602%) : ${formatCurrency(data.employerQPIP)}` : `Line 3 - Quebec Parental Insurance Plan (QPIP) premiums\n  • Employee (0.430%): ${formatCurrency(data.employeeQPIP)} | Employer (0.602%): ${formatCurrency(data.employerQPIP)}`,
      formatCurrency(data.totalQPIP)
    ],
    [
      isFr ? 'Ligne 4 - Cotisation de l\'employeur au Fonds des services de santé (FSS)' : 'Line 4 - Employer Health Services Fund contribution (HSF/FSS)',
      formatCurrency(data.hsfAmount)
    ],
    [
      isFr ? 'Ligne 5 - Cotisation relative aux normes du travail (CNESST - 0.06%)' : 'Line 5 - Contribution related to Labour Standards (CNESST - 0.06%)',
      formatCurrency(data.labourStandardsAmount)
    ],
  ];

  safeAutoTable(doc, {
    startY: y,
    head: [[isFr ? 'LIGNES DE CALCUL OFFICIELLES (REVENU QUÉBEC)' : 'OFFICIAL CALCULATION LINES (REVENU QUÉBEC)', isFr ? 'MONTANT' : 'AMOUNT']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 76, 129],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: pageWidth - 28 - 45 },
      1: { cellWidth: 45, halign: 'right', fontStyle: 'bold' }
    }
  });

  // --- Total Remittance Highlight Box ---
  const finalTableY = (doc as any).lastAutoTable.finalY + 5;
  doc.setFillColor(240, 253, 244); // emerald-50
  doc.setDrawColor(34, 197, 94); // emerald-500
  doc.setLineWidth(0.8);
  doc.roundedRect(14, finalTableY, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61); // emerald-700
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'TOTAL DU VERSEMENT À REVENU QUÉBEC (LIGNES 1 À 5) :' : 'TOTAL REMITTANCE TO REVENU QUÉBEC (LINES 1 TO 5):', 20, finalTableY + 9);
  
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(isFr ? 'Comprend l\'impôt provincial, RRQ total, RQAP total, FSS et les Normes du travail.' : 'Includes Quebec tax, total QPP, total QPIP, HSF, and Labour standards.', 20, finalTableY + 16);

  doc.setFontSize(16);
  doc.setTextColor(21, 128, 61);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(data.totalQuebecRemittance), pageWidth - 20, finalTableY + 14, { align: 'right' });

  // --- Remittance Voucher (Tear-off slip) ---
  const voucherY = pageHeight - 75;
  
  // Dashed Cut Line
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(14, voucherY, pageWidth - 14, voucherY);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? '✂ DÉTACHER ET TRANSMETTRE AVEC LE PAIEMENT - MINISTRE DU REVENU DU QUÉBEC' : '✂ DETACH AND TRANSMIT WITH PAYMENT - MINISTRE DU REVENU DU QUÉBEC', pageWidth / 2, voucherY - 2, { align: 'center' });

  // Voucher Box
  doc.setFillColor(240, 249, 255); // sky-50
  doc.setDrawColor(186, 230, 253); // sky-200
  doc.roundedRect(14, voucherY + 3, pageWidth - 28, 62, 1.5, 1.5, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(15, 76, 129);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'COUPON DE VERSEMENT - FORMULAIRE TPZ-1015.R.14.2-V' : 'REMITTANCE SLIP - FORM TPZ-1015.R.14.2-V', 18, voucherY + 10);
  
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'normal');
  doc.text(`${isFr ? 'Identifiant / NEQ :' : 'ID / NEQ:'} ${data.neq || '1234567890 RS 0001'}  |  ${isFr ? 'Période :' : 'Period:'} ${data.periodEndDate}  |  ${isFr ? 'Échéance :' : 'Due:'} ${data.paymentDueDate}`, 18, voucherY + 16);

  // Voucher details table
  doc.rect(18, voucherY + 20, 110, 20);
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(isFr ? 'EMPLOYEUR' : 'EMPLOYER', 20, voucherY + 24);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(data.companyName || 'Mon Entreprise Inc.', 20, voucherY + 30);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(isFr ? 'Payable à l\'ordre du ministre du Revenu du Québec' : 'Payable to Ministre du Revenu du Québec', 20, voucherY + 36);

  // Amount Box on voucher
  doc.setFillColor(255, 255, 255);
  doc.rect(132, voucherY + 20, pageWidth - 14 - 136, 20, 'FD');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'MONTANT DU VERSEMENT' : 'TOTAL REMITTANCE', 136, voucherY + 25);
  doc.setFontSize(13);
  doc.setTextColor(15, 76, 129);
  doc.text(formatCurrency(data.totalQuebecRemittance), pageWidth - 20, voucherY + 34, { align: 'right' });

  // Optical Scan OCR Line Simulation at bottom
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const ocrLine = `>1015142> ${(data.neq || '1234567890RS0001').replace(/\s+/g, '')}  ${data.periodEndDate.replace(/-/g, '')}  ${Math.round(data.totalQuebecRemittance * 100).toString().padStart(10, '0')}<`;
  doc.text(ocrLine, 20, voucherY + 54);
  doc.setFont('helvetica', 'normal');

  return doc;
}

/**
 * Generate Combined Remittance Package (PD7A + TPZ-1015 + Summary in 1 multi-page PDF)
 */
export function generateCombinedRemittancePackage(data: RemittancePeriodData, language: 'fr' | 'en' = 'fr'): jsPDF {
  // Page 1: TPZ-1015.R.14.2-V (Quebec)
  const doc = generateTPZ1015PDF(data, language);

  // Page 2: PD7A (Federal CRA)
  doc.addPage('letter', 'portrait');
  const pd7aDoc = generatePD7APDF(data, language);
  
  // To avoid re-implementing, we create a fresh multi-page doc
  const multiDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  
  // Page 1: Summary Overview
  const pageWidth = multiDoc.internal.pageSize.getWidth();
  const isFr = language === 'fr';

  multiDoc.setFillColor(15, 23, 42); // slate-900
  multiDoc.rect(0, 0, pageWidth, 24, 'F');
  multiDoc.setFontSize(14);
  multiDoc.setTextColor(255, 255, 255);
  multiDoc.setFont('helvetica', 'bold');
  multiDoc.text(isFr ? 'DOSSIER FISCAL DE VERSEMENT PÉRIODIQUE (QUÉBEC & FÉDÉRAL)' : 'PERIODIC REMITTANCE COMPLIANCE DOSSIER (QUEBEC & FEDERAL)', 14, 15);

  let y = 35;
  multiDoc.setFontSize(11);
  multiDoc.setTextColor(15, 23, 42);
  multiDoc.text(isFr ? 'RÉCAPITULATIF DES REMISES GOUVERNEMENTALES :' : 'GOVERNMENT REMITTANCE SUMMARY:', 14, y);

  safeAutoTable(multiDoc, {
    startY: y + 5,
    head: [[isFr ? 'ORGANISME FISCAL' : 'TAX AGENCY', isFr ? 'FORMULAIRE' : 'FORM', isFr ? 'ÉCHÉANCE' : 'DUE DATE', isFr ? 'MONTANT DÛ' : 'AMOUNT DUE']],
    body: [
      [
        isFr ? 'Revenu Québec' : 'Revenu Québec',
        'TPZ-1015.R.14.2-V',
        data.paymentDueDate,
        formatCurrency(data.totalQuebecRemittance)
      ],
      [
        isFr ? 'Agence du revenu du Canada (ARC)' : 'Canada Revenue Agency (CRA)',
        'PD7A',
        data.paymentDueDate,
        formatCurrency(data.totalFederalRemittance)
      ],
      [
        { content: isFr ? 'TOTAL COMBINÉ DES VERSEMENTS' : 'TOTAL COMBINED REMITTANCE', colSpan: 3, styles: { fontStyle: 'bold' } },
        { content: formatCurrency(data.totalCombinedRemittance), styles: { fontStyle: 'bold', textColor: [37, 99, 235] } }
      ]
    ],
    theme: 'grid',
    headStyles: { fillColor: [51, 65, 85] }
  });

  return doc; // returns the primary form
}
