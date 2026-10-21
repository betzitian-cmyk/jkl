/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, PayStub } from '../types';

export interface EmployeeTaxSlipData {
  employee: Employee;
  year: number;
  stubCount: number;
  
  // T4 Slip Boxes (Canada Revenue Agency)
  t4: {
    box14_employmentIncome: number;
    box16_employeeCppQpp: number;
    box16a_employeeQppTier2: number;
    box18_employeeEi: number;
    box20_rppContributions: number;
    box22_incomeTaxDeducted: number; // Federal tax only
    box24_eiInsurableEarnings: number;
    box26_cppQppPensionableEarnings: number;
    box44_unionDues: number;
    box46_charitableDonations: number;
    box52_pensionAdjustment: number;
    box40_taxableBenefits: number; // Taxable allowances/benefits included in box 14
    box85_employeePaidHealthPremiums: number; // Private health services plan premiums
    provinceOfEmployment: string;
    sin: string;
    employerName: string;
    employerBn: string;
  };

  // RL-1 Slip Boxes (Revenu Québec - Relevé 1)
  rl1: {
    boxA_employmentIncome: number;
    boxB_qppContribution: number;
    boxB2_qppTier2Contribution: number;
    boxC_eiPremium: number;
    boxE_quebecTaxDeducted: number;
    boxG_qppPensionableEarnings: number;
    boxH_qpipPremium: number;
    boxI_qpipEligibleEarnings: number;
    boxJ_privateHealthInsuranceEmployer: number; // Taxable benefit from employer-paid private health
    boxL_otherTaxableBenefits: number;
    boxM_commissions: number;
    boxN_charitableDonations: number;
    boxO_otherIncome: number;
    boxQ_deferredSalaryOrOther: number;
    boxR_rnsqIndianIncome: number;
    boxS_tips: number;
    boxT_tipsAttributed: number;
    boxU_cnesstEarnings: number;
    sin: string;
    employerName: string;
    employerNeq: string;
  };

  // Raw totals
  rawTotals: {
    gross: number;
    net: number;
    federalTax: number;
    quebecTax: number;
    qpp: number;
    employerQpp: number;
    ei: number;
    employerEi: number;
    qpip: number;
    employerQpip: number;
    hsf: number;
    cnesst: number;
    vacationPay: number;
    overtimePay: number;
    bonusPay: number;
    commissionPay: number;
    preTaxRrsp: number;
    postTaxHealth: number;
    garnishments: number;
  };
}

export interface YearEndSummaryTotals {
  year: number;
  employeeCount: number;
  totalGrossPayroll: number;
  totalNetPayroll: number;
  
  // Federal (T4 Summary)
  t4Summary: {
    totalBox14_employmentIncome: number;
    totalBox16_employeeQpp: number;
    totalBox18_employeeEi: number;
    totalBox22_federalIncomeTax: number;
    totalEmployerQpp: number;
    totalEmployerEi: number;
    totalRemittanceFederal: number; // Total CRA payable
  };

  // Quebec (RL-1 Summary / Sommaire 1 - RLZ-1.S)
  rl1Summary: {
    totalBoxA_employmentIncome: number;
    totalBoxB_qpp: number;
    totalEmployerQpp: number;
    totalBoxC_ei: number;
    totalBoxE_quebecTax: number;
    totalBoxH_qpip: number;
    totalEmployerQpip: number;
    totalHsf: number;
    totalCnesst: number;
    totalRemittanceQuebec: number; // Total RQ payable
  };
}

/**
 * Calculates aggregated tax slip data for a specific employee and fiscal year.
 */
export function calculateEmployeeTaxSlip(
  employee: Employee,
  stubs: PayStub[],
  year: number,
  companyInfo: { companyName: string; federalId: string; neq: string }
): EmployeeTaxSlipData {
  const yearPrefix = String(year);
  const employeeStubs = stubs.filter(
    s => s.employeeId === employee.id && s.date && s.date.startsWith(yearPrefix)
  );

  // Accumulate totals from stubs
  const gross = employeeStubs.reduce((sum, s) => sum + (s.grossPay || 0), 0);
  const net = employeeStubs.reduce((sum, s) => sum + (s.netPay || 0), 0);
  const fedTax = employeeStubs.reduce((sum, s) => sum + (s.federalTax || 0), 0);
  const provTax = employeeStubs.reduce((sum, s) => sum + (s.quebecTax || 0), 0);
  const qpp = employeeStubs.reduce((sum, s) => sum + (s.qpp || 0), 0);
  const employerQpp = employeeStubs.reduce((sum, s) => sum + (s.employerQPP || s.qpp || 0), 0);
  const ei = employeeStubs.reduce((sum, s) => sum + (s.ei || 0), 0);
  const employerEi = employeeStubs.reduce((sum, s) => sum + (s.employerEI || s.ei * 1.4 || 0), 0);
  const qpip = employeeStubs.reduce((sum, s) => sum + (s.qpip || 0), 0);
  const employerQpip = employeeStubs.reduce((sum, s) => sum + (s.employerQPIP || s.grossPay * 0.00602 || 0), 0);
  const hsf = employeeStubs.reduce((sum, s) => sum + (s.hsf || s.grossPay * 0.0165 || 0), 0);
  const cnesst = employeeStubs.reduce((sum, s) => sum + (s.labourStandards || s.grossPay * 0.0006 || 0), 0);
  
  const vacationPay = employeeStubs.reduce((sum, s) => sum + (s.vacationPay || 0), 0);
  const overtimePay = employeeStubs.reduce((sum, s) => sum + (s.overtimePay || 0), 0);
  const bonusPay = employeeStubs.reduce((sum, s) => sum + (s.bonusPay || 0), 0);
  const commissionPay = employeeStubs.reduce((sum, s) => sum + (s.commissionPay || 0), 0);
  const preTaxRrsp = employeeStubs.reduce((sum, s) => sum + (s.preTaxRrspDeduction || 0), 0);
  const postTaxHealth = employeeStubs.reduce((sum, s) => sum + (s.postTaxHealthDeduction || 0), 0);
  const garnishments = employeeStubs.reduce((sum, s) => {
    if (!s.breakdown) return sum;
    const gItem = s.breakdown.find(b => b.label.toLowerCase().includes('saisie') || b.label.toLowerCase().includes('garnishment'));
    return sum + (gItem ? gItem.amount : 0);
  }, 0);

  // Limits based on tax year for Pensionable/Insurable Earnings
  const qppMaxEarnings = year === 2026 ? 73200 : year === 2025 ? 71300 : 68500;
  const eiMaxEarnings = year === 2026 ? 65700 : year === 2025 ? 64200 : 63200;
  const qpipMaxEarnings = year === 2026 ? 102000 : year === 2025 ? 98000 : 94000;

  // Box 26 CPP/QPP pensionable earnings
  const pensionableEarnings = gross > 0 ? Math.min(gross, qppMaxEarnings) : 0;
  // Box 24 EI insurable earnings
  const insurableEarnings = gross > 0 ? Math.min(gross, eiMaxEarnings) : 0;
  // Box I QPIP eligible earnings
  const qpipEarnings = gross > 0 ? Math.min(gross, qpipMaxEarnings) : 0;

  // Health benefit estimation if enrolled
  const taxableBenefitsEmployerHealth = employee.groupInsuranceEnrollment ? (employee.benefitContributions?.health || 0) * employeeStubs.length : 0;

  return {
    employee,
    year,
    stubCount: employeeStubs.length,
    t4: {
      box14_employmentIncome: Number(gross.toFixed(2)),
      box16_employeeCppQpp: Number(qpp.toFixed(2)),
      box16a_employeeQppTier2: 0,
      box18_employeeEi: Number(ei.toFixed(2)),
      box20_rppContributions: Number(preTaxRrsp.toFixed(2)),
      box22_incomeTaxDeducted: Number(fedTax.toFixed(2)),
      box24_eiInsurableEarnings: Number(insurableEarnings.toFixed(2)),
      box26_cppQppPensionableEarnings: Number(pensionableEarnings.toFixed(2)),
      box44_unionDues: 0,
      box46_charitableDonations: 0,
      box52_pensionAdjustment: Number((preTaxRrsp * 1.0).toFixed(2)),
      box40_taxableBenefits: 0,
      box85_employeePaidHealthPremiums: Number(postTaxHealth.toFixed(2)),
      provinceOfEmployment: 'QC',
      sin: employee.sin || '000-000-000',
      employerName: companyInfo.companyName,
      employerBn: companyInfo.federalId
    },
    rl1: {
      boxA_employmentIncome: Number(gross.toFixed(2)),
      boxB_qppContribution: Number(qpp.toFixed(2)),
      boxB2_qppTier2Contribution: 0,
      boxC_eiPremium: Number(ei.toFixed(2)),
      boxE_quebecTaxDeducted: Number(provTax.toFixed(2)),
      boxG_qppPensionableEarnings: Number(pensionableEarnings.toFixed(2)),
      boxH_qpipPremium: Number(qpip.toFixed(2)),
      boxI_qpipEligibleEarnings: Number(qpipEarnings.toFixed(2)),
      boxJ_privateHealthInsuranceEmployer: Number(taxableBenefitsEmployerHealth.toFixed(2)),
      boxL_otherTaxableBenefits: 0,
      boxM_commissions: Number(commissionPay.toFixed(2)),
      boxN_charitableDonations: 0,
      boxO_otherIncome: 0,
      boxQ_deferredSalaryOrOther: 0,
      boxR_rnsqIndianIncome: 0,
      boxS_tips: 0,
      boxT_tipsAttributed: 0,
      boxU_cnesstEarnings: Number(gross.toFixed(2)),
      sin: employee.sin || '000-000-000',
      employerName: companyInfo.companyName,
      employerNeq: companyInfo.neq
    },
    rawTotals: {
      gross,
      net,
      federalTax: fedTax,
      quebecTax: provTax,
      qpp,
      employerQpp,
      ei,
      employerEi,
      qpip,
      employerQpip,
      hsf,
      cnesst,
      vacationPay,
      overtimePay,
      bonusPay,
      commissionPay,
      preTaxRrsp,
      postTaxHealth,
      garnishments
    }
  };
}

/**
 * Aggregates all employee tax slips into summary totals for the year.
 */
export function calculateYearEndSummary(
  slips: EmployeeTaxSlipData[],
  year: number
): YearEndSummaryTotals {
  let totalGrossPayroll = 0;
  let totalNetPayroll = 0;
  let totalBox14 = 0;
  let totalBox16_qpp = 0;
  let totalBox18_ei = 0;
  let totalBox22_fedTax = 0;
  let totalEmployerQpp = 0;
  let totalEmployerEi = 0;

  let totalBoxA = 0;
  let totalBoxB_qpp = 0;
  let totalBoxC_ei = 0;
  let totalBoxE_qcTax = 0;
  let totalBoxH_qpip = 0;
  let totalEmployerQpip = 0;
  let totalHsf = 0;
  let totalCnesst = 0;

  slips.forEach(s => {
    totalGrossPayroll += s.rawTotals.gross;
    totalNetPayroll += s.rawTotals.net;

    // CRA / T4 Summary
    totalBox14 += s.t4.box14_employmentIncome;
    totalBox16_qpp += s.t4.box16_employeeCppQpp;
    totalBox18_ei += s.t4.box18_employeeEi;
    totalBox22_fedTax += s.t4.box22_incomeTaxDeducted;
    totalEmployerQpp += s.rawTotals.employerQpp;
    totalEmployerEi += s.rawTotals.employerEi;

    // Revenu Québec / RL-1 Summary
    totalBoxA += s.rl1.boxA_employmentIncome;
    totalBoxB_qpp += s.rl1.boxB_qppContribution;
    totalBoxC_ei += s.rl1.boxC_eiPremium;
    totalBoxE_qcTax += s.rl1.boxE_quebecTaxDeducted;
    totalBoxH_qpip += s.rl1.boxH_qpipPremium;
    totalEmployerQpip += s.rawTotals.employerQpip;
    totalHsf += s.rawTotals.hsf;
    totalCnesst += s.rawTotals.cnesst;
  });

  const totalRemittanceFederal = totalBox22_fedTax + totalBox18_ei + totalEmployerEi;
  const totalRemittanceQuebec = totalBoxE_qcTax + totalBoxB_qpp + totalEmployerQpp + totalBoxH_qpip + totalEmployerQpip + totalHsf + totalCnesst;

  return {
    year,
    employeeCount: slips.length,
    totalGrossPayroll: Number(totalGrossPayroll.toFixed(2)),
    totalNetPayroll: Number(totalNetPayroll.toFixed(2)),
    t4Summary: {
      totalBox14_employmentIncome: Number(totalBox14.toFixed(2)),
      totalBox16_employeeQpp: Number(totalBox16_qpp.toFixed(2)),
      totalBox18_employeeEi: Number(totalBox18_ei.toFixed(2)),
      totalBox22_federalIncomeTax: Number(totalBox22_fedTax.toFixed(2)),
      totalEmployerQpp: Number(totalEmployerQpp.toFixed(2)),
      totalEmployerEi: Number(totalEmployerEi.toFixed(2)),
      totalRemittanceFederal: Number(totalRemittanceFederal.toFixed(2))
    },
    rl1Summary: {
      totalBoxA_employmentIncome: Number(totalBoxA.toFixed(2)),
      totalBoxB_qpp: Number(totalBoxB_qpp.toFixed(2)),
      totalEmployerQpp: Number(totalEmployerQpp.toFixed(2)),
      totalBoxC_ei: Number(totalBoxC_ei.toFixed(2)),
      totalBoxE_quebecTax: Number(totalBoxE_qcTax.toFixed(2)),
      totalBoxH_qpip: Number(totalBoxH_qpip.toFixed(2)),
      totalEmployerQpip: Number(totalEmployerQpip.toFixed(2)),
      totalHsf: Number(totalHsf.toFixed(2)),
      totalCnesst: Number(totalCnesst.toFixed(2)),
      totalRemittanceQuebec: Number(totalRemittanceQuebec.toFixed(2))
    }
  };
}
