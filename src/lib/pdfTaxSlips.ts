/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from 'jspdf';
import { safeAutoTable } from './pdfAutoTable';
import { EmployeeTaxSlipData, YearEndSummaryTotals } from './taxSlips';
import { formatCurrency } from './utils';

/**
 * Generate a PDF for an Employee's T4 Slip (Statement of Remuneration Paid)
 */
export function generateT4SlipPDF(slip: EmployeeTaxSlipData, language: 'fr' | 'en' = 'fr'): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const isFr = language === 'fr';
  const pageWidth = doc.internal.pageSize.getWidth();
  const emp = slip.employee;
  const t4 = slip.t4;

  // Header band
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 16, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'AGENCE DU REVENU DU CANADA' : 'CANADA REVENUE AGENCY', 14, 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('T4 (2026)', pageWidth - 14, 10, { align: 'right' });

  // Title
  let y = 24;
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'ÉTAT DE LA RÉMUNÉRATION PAYÉE (T4)' : 'STATEMENT OF REMUNERATION PAID (T4)', 14, y);
  
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(isFr ? `Feuillet d'information fiscale - Année d'imposition ${slip.year} (DRAFT / PROJET)` : `Tax Information Slip - Taxation Year ${slip.year} (DRAFT / PROVISIONAL)`, 14, y);

  // Top Info Box: Employer & Employee Identification
  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 36, 2, 2, 'FD');

  // Employer info (left)
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? "NOM ET ADRESSE DE L'EMPLOYEUR / EMPLOYER'S NAME & ADDRESS" : "EMPLOYER'S NAME & ADDRESS", 18, y + 6);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(t4.employerName || 'Entreprise Démo Inc.', 18, y + 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`NE / BN: ${t4.employerBn || '123456789 RP 0001'}`, 18, y + 18);
  doc.text(`Province d'emploi: ${t4.provinceOfEmployment}`, 18, y + 24);

  // Employee info (right)
  const rightColX = 110;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? "NOM ET ADRESSE DE L'EMPLOYÉ / EMPLOYEE'S NAME & ADDRESS" : "EMPLOYEE'S NAME & ADDRESS", rightColX, y + 6);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`${emp.firstName} ${emp.lastName}`, rightColX, y + 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(emp.address || '123 Boulevard René-Lévesque, Montréal QC', rightColX, y + 18);
  doc.text(`NAS / SIN (Case 12): ${emp.sin || '000-000-000'}`, rightColX, y + 24);
  doc.text(`${slip.stubCount} ${isFr ? 'périodes de paie compilées' : 'pay stubs compiled'}`, rightColX, y + 30);

  // T4 Boxes Grid
  y += 42;
  const boxes = [
    { box: '14', label: isFr ? "Revenus d'emploi" : "Employment income", amount: t4.box14_employmentIncome, primary: true },
    { box: '22', label: isFr ? "Impôt sur le revenu retenu" : "Income tax deducted", amount: t4.box22_incomeTaxDeducted, primary: true },
    { box: '16', label: isFr ? "Cotisations de l'employé au RPC/RRQ" : "Employee's CPP/QPP contributions", amount: t4.box16_employeeCppQpp },
    { box: '18', label: isFr ? "Cotisations de l'employé à l'AE" : "Employee's EI premiums", amount: t4.box18_employeeEi },
    { box: '24', label: isFr ? "Gains assurables d'AE" : "EI insurable earnings", amount: t4.box24_eiInsurableEarnings },
    { box: '26', label: isFr ? "Gains ouvrant droit à pension RPC/RRQ" : "CPP/QPP pensionable earnings", amount: t4.box26_cppQppPensionableEarnings },
    { box: '20', label: isFr ? "Cotisations à un RPA / RVER" : "RPP contributions", amount: t4.box20_rppContributions },
    { box: '52', label: isFr ? "Facteur d'équivalence (PA)" : "Pension adjustment", amount: t4.box52_pensionAdjustment },
    { box: '85', label: isFr ? "Régimes privés de soins médicaux" : "Employee health premiums", amount: t4.box85_employeePaidHealthPremiums },
  ];

  const colWidth = (pageWidth - 28 - 6) / 2;
  let currentY = y;

  boxes.forEach((b, idx) => {
    const isEven = idx % 2 === 0;
    const colX = isEven ? 14 : 14 + colWidth + 6;
    if (idx > 0 && isEven) {
      currentY += 18;
    }

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(b.primary ? 241 : 255, b.primary ? 245 : 255, b.primary ? 249 : 255);
    doc.roundedRect(colX, currentY, colWidth, 16, 1.5, 1.5, 'FD');

    // Box Number Tag
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(colX + 2, currentY + 2, 8, 5, 0.8, 0.8, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(b.box, colX + 6, currentY + 5.5, { align: 'center' });

    // Box Label
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(b.label, colX + 12, currentY + 5.5);

    // Box Amount
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(b.amount), colX + colWidth - 4, currentY + 12, { align: 'right' });
  });

  // Footer compliance note
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'italic');
  doc.text(
    isFr 
      ? "Ce feuillet T4 est un projet généré automatiquement pour fins d'audit fiscal de fin d'année. Conserver pour vos dossiers."
      : "This T4 slip is an automated draft generated for year-end tax auditing purposes. Keep for your records.",
    14, 
    270
  );

  return doc;
}

/**
 * Generate a PDF for an Employee's RL-1 Slip (Relevé 1 - Revenus d'emploi et revenus divers)
 */
export function generateRL1SlipPDF(slip: EmployeeTaxSlipData, language: 'fr' | 'en' = 'fr'): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const isFr = language === 'fr';
  const pageWidth = doc.internal.pageSize.getWidth();
  const emp = slip.employee;
  const rl1 = slip.rl1;

  // Header band (Revenu Québec Blue)
  doc.setFillColor(29, 78, 216); // blue-700
  doc.rect(0, 0, pageWidth, 16, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('REVENU QUÉBEC', 14, 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('RELEVÉ 1 (RL-1 / 2026)', pageWidth - 14, 10, { align: 'right' });

  // Title
  let y = 24;
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? "REVENUS D'EMPLOI ET REVENUS DIVERS (RELEVÉ 1)" : "EMPLOYMENT INCOME AND DIVERSE INCOMES (RL-1)", 14, y);
  
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(isFr ? `Formulaire officiel prescrit par Revenu Québec - Année ${slip.year} (PROJET / DRAFT)` : `Official prescribed statement by Revenu Québec - Year ${slip.year} (DRAFT)`, 14, y);

  // Top Info Box: Employer & Employee Identification
  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 36, 2, 2, 'FD');

  // Employer info (left)
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? "NOM ET ADRESSE DE L'EMPLOYEUR" : "EMPLOYER'S NAME & ADDRESS", 18, y + 6);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(rl1.employerName || 'Entreprise Démo Inc.', 18, y + 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`NEQ / Québec ID: ${rl1.employerNeq || '1234567890 RS 0001'}`, 18, y + 18);
  doc.text(`Nombre de paies compilées: ${slip.stubCount}`, 18, y + 24);

  // Employee info (right)
  const rightColX = 110;
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? "NOM DE FAMILLE, PRÉNOM ET ADRESSE DU BÉNÉFICIAIRE" : "EMPLOYEE'S SURNAME, FIRST NAME & ADDRESS", rightColX, y + 6);
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`${emp.lastName.toUpperCase()}, ${emp.firstName}`, rightColX, y + 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(emp.address || '123 Boulevard René-Lévesque, Montréal QC', rightColX, y + 18);
  doc.text(`Numéro d'assurance sociale (NAS): ${emp.sin || '000-000-000'}`, rightColX, y + 24);

  // RL-1 Boxes Grid
  y += 42;
  const boxes = [
    { box: 'A', label: isFr ? "Revenus d'emploi" : "Employment income", amount: rl1.boxA_employmentIncome, primary: true },
    { box: 'E', label: isFr ? "Impôt du Québec retenu" : "Quebec income tax withheld", amount: rl1.boxE_quebecTaxDeducted, primary: true },
    { box: 'B', label: isFr ? "Cotisation au RRQ" : "QPP contribution", amount: rl1.boxB_qppContribution },
    { box: 'C', label: isFr ? "Cotisation à l'assurance-emploi" : "EI premium", amount: rl1.boxC_eiPremium },
    { box: 'G', label: isFr ? "Salaire admissible au RRQ" : "QPP pensionable earnings", amount: rl1.boxG_qppPensionableEarnings },
    { box: 'H', label: isFr ? "Cotisation au RQAP" : "QPIP premium", amount: rl1.boxH_qpipPremium },
    { box: 'I', label: isFr ? "Salaire admissible au RQAP" : "QPIP eligible earnings", amount: rl1.boxI_qpipEligibleEarnings },
    { box: 'J', label: isFr ? "Régime privé d'assurance maladie" : "Private health insurance benefit", amount: rl1.boxJ_privateHealthInsuranceEmployer },
    { box: 'M', label: isFr ? "Commissions incluses à la case A" : "Commissions included in box A", amount: rl1.boxM_commissions },
    { box: 'U', label: isFr ? "Salaire admissible pour CNESST" : "CNESST eligible earnings", amount: rl1.boxU_cnesstEarnings },
  ];

  const colWidth = (pageWidth - 28 - 6) / 2;
  let currentY = y;

  boxes.forEach((b, idx) => {
    const isEven = idx % 2 === 0;
    const colX = isEven ? 14 : 14 + colWidth + 6;
    if (idx > 0 && isEven) {
      currentY += 18;
    }

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(b.primary ? 239 : 255, b.primary ? 246 : 255, b.primary ? 255 : 255);
    doc.roundedRect(colX, currentY, colWidth, 16, 1.5, 1.5, 'FD');

    // Box Letter Tag (Blue for RL-1)
    doc.setFillColor(29, 78, 216);
    doc.roundedRect(colX + 2, currentY + 2, 8, 5, 0.8, 0.8, 'F');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text(b.box, colX + 6, currentY + 5.5, { align: 'center' });

    // Box Label
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(b.label, colX + 12, currentY + 5.5);

    // Box Amount
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(b.amount), colX + colWidth - 4, currentY + 12, { align: 'right' });
  });

  // Footer compliance note
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'italic');
  doc.text(
    isFr 
      ? "Ce Relevé 1 est un projet généré automatiquement pour fins d'audit fiscal de fin d'année. Conserver pour vos dossiers."
      : "This RL-1 slip is an automated draft generated for year-end tax auditing purposes. Keep for your records.",
    14, 
    270
  );

  return doc;
}

/**
 * Generate a PDF for the Employer's Year-End Summary (T4 & RL-1 Grand Summary Report)
 */
export function generateYearEndSummaryPDF(
  summary: YearEndSummaryTotals,
  slips: EmployeeTaxSlipData[],
  companyInfo: { companyName: string; federalId: string; neq: string },
  language: 'fr' | 'en' = 'fr'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const isFr = language === 'fr';
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 18, 'F');
  
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'SOMMAIRE ANNUEL DES DÉCLARATIONS DE FIN D\'ANNÉE' : 'ANNUAL YEAR-END TAX FILING SUMMARY', 14, 11);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Année fiscale ${summary.year}`, pageWidth - 14, 11, { align: 'right' });

  // Employer Info & Summary Overview
  let y = 26;
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(companyInfo.companyName || 'Mon Entreprise Inc.', 14, y);
  
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`ARC / BN: ${companyInfo.federalId}   |   Revenu Québec / NEQ: ${companyInfo.neq}   |   Total employés: ${summary.employeeCount}`, 14, y);

  // Top Metrics 3 Cards
  y += 8;
  const cardWidth = (pageWidth - 28 - 8) / 3;

  // Card 1: Total Payroll
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, y, cardWidth, 20, 1.5, 1.5, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'MASSE SALARIALE BRUTE' : 'TOTAL GROSS PAYROLL', 18, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(summary.totalGrossPayroll), 18, y + 14);

  // Card 2: Federal CRA Payable
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14 + cardWidth + 4, y, cardWidth, 20, 1.5, 1.5, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(isFr ? 'TOTAL REMISES ARC (T4)' : 'TOTAL CRA REMITTANCES', 18 + cardWidth + 4, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(summary.t4Summary.totalRemittanceFederal), 18 + cardWidth + 4, y + 14);

  // Card 3: Revenu Québec Payable
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14 + (cardWidth + 4) * 2, y, cardWidth, 20, 1.5, 1.5, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(isFr ? 'TOTAL REVENU QUÉBEC (RL-1)' : 'TOTAL RQ REMITTANCES', 18 + (cardWidth + 4) * 2, y + 6);
  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216);
  doc.text(formatCurrency(summary.rl1Summary.totalRemittanceQuebec), 18 + (cardWidth + 4) * 2, y + 14);

  // Section: Per-Employee Breakdown Table
  y += 28;
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(isFr ? 'VENTILATION PAR EMPLOYÉ (FEUILLETS T4 & RELEVÉ 1)' : 'EMPLOYEE BREAKDOWN (T4 & RL-1 SLIPS)', 14, y);

  // Table using autotable
  const tableRows = slips.map(s => [
    `${s.employee.lastName}, ${s.employee.firstName}`,
    s.employee.sin || '000-000-000',
    formatCurrency(s.t4.box14_employmentIncome),
    formatCurrency(s.t4.box22_incomeTaxDeducted),
    formatCurrency(s.rl1.boxE_quebecTaxDeducted),
    formatCurrency(s.rl1.boxB_qppContribution),
    formatCurrency(s.rl1.boxH_qpipPremium),
    formatCurrency(s.t4.box18_employeeEi),
  ]);

  safeAutoTable(doc, {
    startY: y + 4,
    head: [[
      isFr ? 'Employé' : 'Employee',
      'NAS / SIN',
      isFr ? 'Brut (Case 14/A)' : 'Gross (14/A)',
      isFr ? 'Impôt Féd (22)' : 'Fed Tax (22)',
      isFr ? 'Impôt QC (E)' : 'QC Tax (E)',
      'RRQ (16/B)',
      'RQAP (H)',
      'AE (18/C)'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [51, 65, 85]
    },
    foot: [[
      isFr ? 'TOTAL ANNUEL' : 'ANNUAL TOTAL',
      `${summary.employeeCount} ${isFr ? 'employés' : 'employees'}`,
      formatCurrency(summary.totalGrossPayroll),
      formatCurrency(summary.t4Summary.totalBox22_federalIncomeTax),
      formatCurrency(summary.rl1Summary.totalBoxE_quebecTax),
      formatCurrency(summary.rl1Summary.totalBoxB_qpp),
      formatCurrency(summary.rl1Summary.totalBoxH_qpip),
      formatCurrency(summary.t4Summary.totalBox18_employeeEi)
    ]],
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 7.5,
      fontStyle: 'bold'
    }
  });

  return doc;
}
