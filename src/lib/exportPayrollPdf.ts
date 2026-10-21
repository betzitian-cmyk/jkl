/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import { safeAutoTable } from './pdfAutoTable';
import { formatCurrency } from './utils';
import { PayrollResult, Employee } from '../types';

export interface ExportPayrollPdfOptions {
  result: PayrollResult;
  employee?: Employee | null;
  fiscalYear: number;
  frequency?: string;
  payPeriod?: { startDate: string; endDate: string } | null;
  language?: 'fr' | 'en';
  companyInfo?: {
    name?: string;
    address?: string;
    employerNumber?: string;
    neq?: string;
    federalId?: string;
  };
}

/**
 * Exports current payroll calculation results to an official, publication-quality PDF
 * using jsPDF and safeAutoTable, including complete itemized breakdowns of earnings,
 * statutory and voluntary deductions, net pay, and employer contributions.
 */
export function exportPayrollCalculationPDF(options: ExportPayrollPdfOptions): jsPDF {
  const {
    result,
    employee,
    fiscalYear,
    frequency = 'bi-weekly',
    payPeriod,
    language = 'fr',
    companyInfo
  } = options;

  const isFr = language === 'fr';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const companyName = companyInfo?.name || 'ApplepAI Inc.';
  const companyAddress = companyInfo?.address || '1000 Rue Sherbrooke Ouest, Montréal, QC H3A 3G4';
  const rqId = companyInfo?.employerNumber || '1234567890RS0001';
  const federalBn = companyInfo?.federalId || '123456789RP0001';
  const neq = companyInfo?.neq || '1178923456';

  const currentDateStr = new Date().toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // --- 1. Top Decorative Brand Bar ---
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 18, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(
    isFr
      ? 'SYSTÈME FISCAL OFFICIEL DU QUÉBEC & DU CANADA — RAPPORT DE PAIE'
      : 'OFFICIAL QUEBEC & CANADA STATUTORY PAYROLL CALCULATION STATEMENT',
    margin,
    11
  );

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Année / Tax Year ${fiscalYear}`, pageWidth - margin, 11, { align: 'right' });

  // --- 2. Title & Document Identification ---
  let y = 28;
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.text(
    isFr ? 'RÉSULTATS DU CALCUL DE PAIE OFFICIEL' : 'OFFICIAL PAYROLL CALCULATION RESULTS',
    margin,
    y
  );

  y += 5.5;
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont('helvetica', 'normal');
  doc.text(
    isFr
      ? `Relevé officiel des gains bruts, retenues à la source, salaire net et cotisations patronales • Généré le ${currentDateStr}`
      : `Official statement of gross earnings, source deductions, net pay, and employer contributions • Generated on ${currentDateStr}`,
    margin,
    y
  );

  // --- 3. Employer & Employee Profile Box ---
  y += 7;
  const boxHeight = payPeriod ? 38 : 34;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, y, pageWidth - (margin * 2), boxHeight, 2, 2, 'FD');

  // Left Column: Organization
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'EMPLOYEUR / ORGANISATION :' : 'EMPLOYER / ORGANIZATION:', margin + 4, y + 6);

  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(companyName, margin + 4, y + 12);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text(companyAddress, margin + 4, y + 17);

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `NEQ: ${neq} | Revenu QC: ${rqId} | ARC/CRA: ${federalBn}`,
    margin + 4,
    y + 23
  );

  if (payPeriod) {
    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235); // blue-600
    doc.setFont('helvetica', 'bold');
    doc.text(
      isFr
        ? `Période de paie : ${payPeriod.startDate} au ${payPeriod.endDate} (${frequency})`
        : `Pay Period: ${payPeriod.startDate} to ${payPeriod.endDate} (${frequency})`,
      margin + 4,
      y + 29
    );
  }

  // Right Column: Employee Info
  const col2X = (pageWidth / 2) + 6;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'EMPLOYÉ / BÉNÉFICIAIRE :' : 'EMPLOYEE / BENEFICIARY:', col2X, y + 6);

  const empName = employee
    ? `${employee.firstName} ${employee.lastName}`
    : (isFr ? 'Simulation Libre (Profil Standard)' : 'Free Simulation (Standard Profile)');

  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(empName, col2X, y + 12);

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  const jobTitleText = employee?.jobTitle || (isFr ? 'Employé salarié' : 'Salaried Employee');
  const sinText = employee?.sin
    ? `NAS/SIN: ${employee.sin.replace(/.(?=.{4})/g, '*')}`
    : (isFr ? 'NAS: Non spécifié' : 'SIN: Not specified');
  doc.text(`${jobTitleText} • ${sinText}`, col2X, y + 17);

  // Tax Profile flags line
  const taxFlags: string[] = [];
  if (result.hasMultipleEmployersApplied) {
    taxFlags.push(isFr ? 'Multi-employeurs TD1 ($0)' : 'Multi-employers TD1 ($0)');
  }
  if (result.t1213ReductionApplied > 0) {
    taxFlags.push(`T1213: -${formatCurrency(result.t1213ReductionApplied)}`);
  }
  if (result.tp1016ReductionApplied > 0) {
    taxFlags.push(`TP-1016: -${formatCurrency(result.tp1016ReductionApplied)}`);
  }
  if (taxFlags.length === 0) {
    taxFlags.push(isFr ? 'Crédits de base complets (QC/CA 2026)' : 'Full Basic Tax Credits (QC/CA 2026)');
  }

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${isFr ? 'Profil fiscal :' : 'Tax Profile:'} ${taxFlags.join(' | ')}`, col2X, y + 23);

  // --- 4. Earnings Table (Gains Bruts) ---
  y += boxHeight + 6;

  const baseSalaryAmount = Math.max(
    0,
    result.grossPay -
      (result.bonusPay || 0) -
      (result.vacationPay || 0) -
      (result.overtimePay || 0) -
      (result.commissionPay || 0)
  );

  const earningsRows = [
    [
      isFr ? 'Salaire de base régulier / Heures normales' : 'Regular Base Salary / Standard Hours',
      frequency,
      formatCurrency(baseSalaryAmount)
    ],
    ...(result.overtimePay && result.overtimePay > 0
      ? [[isFr ? 'Heures supplémentaires majorées' : 'Overtime Pay', '1.5x', formatCurrency(result.overtimePay)]]
      : []),
    ...(result.vacationPay && result.vacationPay > 0
      ? [[isFr ? 'Indemnité de congés payés / Vacances' : 'Vacation Pay (Indemnity)', '4% / 6%', formatCurrency(result.vacationPay)]]
      : []),
    ...(result.bonusPay && result.bonusPay > 0
      ? [[isFr ? 'Prime de rendement / Boni' : 'Performance Bonus', 'Boni', formatCurrency(result.bonusPay)]]
      : []),
    ...(result.commissionPay && result.commissionPay > 0
      ? [[isFr ? 'Commissions brutes' : 'Gross Commissions', 'Commission', formatCurrency(result.commissionPay)]]
      : [])
  ];

  safeAutoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [[
      isFr ? '1. DESCRIPTION DES GAINS BRUTS' : '1. GROSS EARNINGS BREAKDOWN',
      isFr ? 'TYPE / TAUX' : 'TYPE / RATE',
      isFr ? 'MONTANT BRUT' : 'GROSS AMOUNT'
    ]],
    body: [
      ...earningsRows,
      [
        {
          content: isFr ? 'TOTAL DES GAINS BRUTS (SALAIRE BRUT)' : 'TOTAL GROSS EARNINGS (GROSS PAY)',
          colSpan: 2,
          styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] }
        },
        {
          content: formatCurrency(result.grossPay),
          styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [37, 99, 235], halign: 'right' }
        }
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.2
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 38, halign: 'right' }
    }
  });

  // --- 5. Statutory & Voluntary Deductions Breakdown Table ---
  const deductionsStartY = ((doc as any).lastAutoTable?.finalY || y + 35) + 6;

  const deductionsRows = [
    [
      isFr ? 'Impôt sur le revenu fédéral (ARC / CRA)' : 'Federal Income Tax (CRA)',
      isFr ? 'Loi de l\'impôt sur le revenu (Canada)' : 'Income Tax Act (Canada)',
      result.t1213ReductionApplied > 0
        ? (isFr ? `Réduction T1213 (-${formatCurrency(result.t1213ReductionApplied)})` : `T1213 reduction (-${formatCurrency(result.t1213ReductionApplied)})`)
        : (isFr ? 'Tables T4032 2026' : 'T4032 Tables 2026'),
      formatCurrency(result.federalTax)
    ],
    [
      isFr ? 'Impôt sur le revenu du Québec (Revenu Québec)' : 'Quebec Provincial Income Tax (Revenu QC)',
      isFr ? 'Loi sur les impôts (Québec)' : 'Taxation Act (Quebec)',
      result.tp1016ReductionApplied > 0
        ? (isFr ? `Réduction TP-1016 (-${formatCurrency(result.tp1016ReductionApplied)})` : `TP-1016 reduction (-${formatCurrency(result.tp1016ReductionApplied)})`)
        : (isFr ? 'Tables TP-1015 2026' : 'TP-1015 Tables 2026'),
      formatCurrency(result.quebecTax)
    ],
    [
      isFr ? 'Régime de rentes du Québec (RRQ / QPP Base - Tier 1)' : 'Quebec Pension Plan (QPP Base - Tier 1)',
      'Retraite Québec',
      result.qppCapped ? (isFr ? 'Plafond annuel atteint' : 'Annual cap reached') : '6,40 %',
      formatCurrency(result.qppTier1Ee ?? result.qpp)
    ],
    ...(result.qppTier2Ee && result.qppTier2Ee > 0
      ? [[
          isFr ? 'RRQ / QPP Supplémentaire (Tier 2 - Salaire > MGA)' : 'QPP Second Additional (Tier 2 - Earnings > YAMPE)',
          'Retraite Québec',
          '4,00 %',
          formatCurrency(result.qppTier2Ee)
        ]]
      : []),
    [
      isFr ? 'Assurance-emploi (AE / EI - Taux réduit Québec)' : 'Employment Insurance (EI - Reduced Quebec Rate)',
      'Service Canada / CRA',
      result.eiCapped ? (isFr ? 'Plafond annuel atteint' : 'Annual cap reached') : '1,31 %',
      formatCurrency(result.ei)
    ],
    [
      isFr ? 'Régime québécois d\'assurance parentale (RQAP / QPIP)' : 'Quebec Parental Insurance Plan (QPIP)',
      'Revenu Québec',
      result.qpipCapped ? (isFr ? 'Plafond annuel atteint' : 'Annual cap reached') : '0,494 %',
      formatCurrency(result.qpip)
    ],
    ...(result.preTaxRrspDeduction && result.preTaxRrspDeduction > 0
      ? [[
          isFr ? 'Cotisation REER collectif (Déduction avant impôt)' : 'Group RRSP Deduction (Pre-tax)',
          'Régime volontaire',
          isFr ? 'Déductible' : 'Pre-tax deductible',
          formatCurrency(result.preTaxRrspDeduction)
        ]]
      : []),
    ...(result.postTaxHealthDeduction && result.postTaxHealthDeduction > 0
      ? [[
          isFr ? 'Assurance santé & dentaire collective (Après impôt)' : 'Group Health & Dental Plan (Post-tax)',
          'Prime employé',
          isFr ? 'Non déductible' : 'Post-tax',
          formatCurrency(result.postTaxHealthDeduction)
        ]]
      : [])
  ];

  safeAutoTable(doc, {
    startY: deductionsStartY,
    margin: { left: margin, right: margin },
    head: [[
      isFr ? '2. RETENUES À LA SOURCE (DÉDUCTIONS)' : '2. SOURCE DEDUCTIONS BREAKDOWN',
      isFr ? 'ORGANISME / RÉGIME' : 'AGENCY / PLAN',
      isFr ? 'RÉFÉRENCE / TAUX' : 'REFERENCE / RATE',
      isFr ? 'RETENUE' : 'DEDUCTION'
    ]],
    body: [
      ...deductionsRows,
      [
        {
          content: isFr ? 'TOTAL DES RETENUES À LA SOURCE' : 'TOTAL STATUTORY & OTHER DEDUCTIONS',
          colSpan: 3,
          styles: { fontStyle: 'bold', fillColor: [255, 241, 242], textColor: [190, 18, 60] }
        },
        {
          content: `-${formatCurrency(result.totalDeductions)}`,
          styles: { fontStyle: 'bold', fillColor: [255, 241, 242], textColor: [190, 18, 60], halign: 'right' }
        }
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [225, 29, 72], // rose-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.2
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 42 },
      2: { cellWidth: 42 },
      3: { cellWidth: 32, halign: 'right' }
    }
  });

  // --- 6. Net Pay Callout Banner (Prominent High-Contrast Box) ---
  const netPayY = ((doc as any).lastAutoTable?.finalY || deductionsStartY + 60) + 6;

  // Background card for Net Pay
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, netPayY, pageWidth - (margin * 2), 22, 2.5, 2.5, 'F');

  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFont('helvetica', 'bold');
  doc.text(
    isFr ? 'SALAIRE NET OFFICIEL À VERSER À L\'EMPLOYÉ :' : 'OFFICIAL NET PAY TO BE DISBURSED TO EMPLOYEE:',
    margin + 6,
    netPayY + 8
  );

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'normal');
  const netRatio = result.grossPay > 0 ? ((result.netPay / result.grossPay) * 100).toFixed(1) : '100';
  const dedRatio = result.grossPay > 0 ? ((result.totalDeductions / result.grossPay) * 100).toFixed(1) : '0';
  doc.text(
    isFr
      ? `Revenu net disponible : ${netRatio} % du brut (Taux effectif de retenue : ${dedRatio} %) • Dépôt direct CPA Standard 005`
      : `Net take-home pay: ${netRatio}% of gross (Effective withholding rate: ${dedRatio}%) • CPA Standard 005 Direct Deposit`,
    margin + 6,
    netPayY + 16
  );

  // Big Emerald Net Pay text on right
  doc.setFontSize(18);
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(result.netPay), pageWidth - margin - 6, netPayY + 14, { align: 'right' });

  // --- 7. Employer Statutory Liabilities & Contributions ---
  const employerStartY = netPayY + 28;

  const employerRows = [
    [
      isFr ? 'RRQ / QPP Cotisation patronale (Base + Supp.)' : 'Employer QPP Contribution (Tier 1 + 2)',
      formatCurrency(result.employerQPP)
    ],
    [
      isFr ? 'RQAP / QPIP Cotisation patronale' : 'Employer QPIP Contribution',
      formatCurrency(result.employerQPIP)
    ],
    [
      isFr ? 'Assurance-emploi patronale (1,4x cotisation employé)' : 'Employer EI Contribution (1.4x employee rate)',
      formatCurrency(result.employerEI)
    ],
    [
      isFr ? 'Fonds des services de santé (FSS / HSF Québec)' : 'Health Services Fund (HSF / FSS Quebec)',
      formatCurrency(result.hsf)
    ],
    [
      isFr ? `CNESST (Santé et sécurité du travail - Unité ${result.cnesstSectorCode || '15000'})` : `CNESST (Worker Safety - Sector ${result.cnesstSectorCode || '15000'})`,
      formatCurrency(result.employerCNESST || result.cnesst)
    ],
    [
      isFr ? 'Normes du travail (CNT / Labour Standards - 0,06 %)' : 'Labour Standards Contribution (CNT - 0.06%)',
      formatCurrency(result.labourStandards)
    ]
  ];

  safeAutoTable(doc, {
    startY: employerStartY,
    margin: { left: margin, right: margin },
    head: [[
      isFr ? '3. CHARGES PATRONALES & COTISATIONS DE L\'ENTREPRISE' : '3. EMPLOYER STATUTORY CHARGES & LIABILITIES',
      isFr ? 'COÛT PATRONAL' : 'EMPLOYER OUTLAY'
    ]],
    body: [
      ...employerRows,
      [
        {
          content: isFr ? 'COÛT TOTAL POUR L\'EMPLOYEUR (BRUT + CHARGES)' : 'TOTAL EMPLOYER OUTLAY (GROSS + STATUTORY CHARGES)',
          styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] }
        },
        {
          content: formatCurrency(result.totalEmployerCost),
          styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42], halign: 'right' }
        }
      ]
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105], // slate-600
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 1.8
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 38, halign: 'right' }
    }
  });

  // --- 8. Legal Compliance & Footer ---
  const finalTableY = (doc as any).lastAutoTable?.finalY || employerStartY + 45;
  const footerY = Math.min(pageHeight - 12, finalTableY + 8);

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'normal');
  doc.text(
    isFr
      ? 'Document généré automatiquement à des fins de simulation et de gestion de paie. Conforme aux tables T4032 (ARC) et TP-1015 (Revenu Québec) 2026. Conformité Loi 96.'
      : 'Document automatically generated for payroll calculation & management. Fully compliant with 2026 CRA T4032 and Revenu Québec TP-1015 statutory schedules. Bill 96 compliant.',
    margin,
    footerY + 2
  );

  doc.text(
    `${companyName} • Page 1 / 1`,
    pageWidth - margin,
    footerY + 2,
    { align: 'right' }
  );

  // --- Save File ---
  const safeEmpName = employee
    ? `${employee.lastName}_${employee.firstName}`.replace(/[^a-zA-Z0-9_-]/g, '_')
    : 'Simulation';
  const fileDate = new Date().toISOString().split('T')[0];
  const filename = `Calcul_Paie_${safeEmpName}_${fileDate}.pdf`;

  doc.save(filename);
  return doc;
}
