/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OwnerMixSimulationInput, OwnerMixSimulationResult, RetiringAllowanceCalculation } from '../types';

/**
 * Calculates Corporate and Personal Tax Integration for Business Owners in Quebec & Canada
 * Compares Salary/Bonus vs Dividends (Non-Eligible and Eligible)
 */
export function calculateOwnerMix(input: OwnerMixSimulationInput): OwnerMixSimulationResult {
  const {
    corporateNetIncome,
    salaryBonusAmount,
    dividendAmount,
    dividendType,
    isCCPC,
    qualifiesForSBD,
    passiveInvestmentIncome,
    familyShareholderActive,
    year
  } = input;

  // 1. Calculate Passive Income Grind on Small Business Deduction ($500k limit reduced by $5 for every $1 of passive income over $50k)
  let sbdLimit = 500000;
  let sbdGrindReduction = 0;
  if (passiveInvestmentIncome > 50000) {
    const excessPassive = passiveInvestmentIncome - 50000;
    sbdGrindReduction = Math.min(500000, excessPassive * 5);
    sbdLimit = Math.max(0, 500000 - sbdGrindReduction);
  }

  // 2. Employer Payroll Taxes on Salary/Bonus (QPP, QPIP, HSF, CNESST)
  // 2025/2026 Quebec rates approximation
  const maxQppEarnings = year >= 2025 ? 71300 : 68500;
  const qppBasicExemption = 3500;
  const qppRate = 0.064; // Base + First Additional
  const contributorySalary = Math.max(0, Math.min(salaryBonusAmount, maxQppEarnings) - qppBasicExemption);
  const employerQPP = salaryBonusAmount > 0 ? Math.min(4348, contributorySalary * qppRate) : 0;
  
  // QPIP Employer rate (0.692%)
  const maxQpipEarnings = year >= 2025 ? 98000 : 94000;
  const employerQPIP = salaryBonusAmount > 0 ? Math.min(678, Math.min(salaryBonusAmount, maxQpipEarnings) * 0.00692) : 0;
  
  // HSF (FSS) Small business rate in QC (1.65% for payroll under $1M)
  const employerHSF = salaryBonusAmount * 0.0165;
  
  // CNESST average rate (~1.5%)
  const employerCNESST = salaryBonusAmount * 0.015;

  const totalEmployerPayrollTaxes = employerQPP + employerQPIP + employerHSF + employerCNESST;

  // 3. Corporate Tax Deduction: Salary/Bonus + Employer Payroll Taxes are 100% deductible
  const corporateDeduction = salaryBonusAmount + totalEmployerPayrollTaxes;
  const corporateTaxableIncome = Math.max(0, corporateNetIncome - corporateDeduction);

  // 4. Corporate Tax Calculation
  // Quebec CCPC Small Business Rate: Fed (9%) + QC (3.2%) = 12.2%
  // Quebec General Corporate Rate: Fed (15%) + QC (11.5%) = 26.5%
  let corporateTax = 0;
  if (corporateTaxableIncome > 0) {
    if (isCCPC && qualifiesForSBD && sbdLimit > 0) {
      const sbdPortion = Math.min(corporateTaxableIncome, sbdLimit);
      const generalPortion = Math.max(0, corporateTaxableIncome - sbdLimit);
      corporateTax = (sbdPortion * 0.122) + (generalPortion * 0.265);
    } else {
      corporateTax = corporateTaxableIncome * 0.265;
    }
  }

  const corporateRetainedEarnings = corporateTaxableIncome - corporateTax;

  // 5. Personal Employee Payroll Deductions on Salary/Bonus
  const employeeQPP = salaryBonusAmount > 0 ? Math.min(4348, contributorySalary * qppRate) : 0;
  const maxEiEarnings = year >= 2025 ? 65700 : 63200;
  // In QC, EI rate is 1.31% (due to QPIP reduction)
  const employeeEI = salaryBonusAmount > 0 ? Math.min(860, Math.min(salaryBonusAmount, maxEiEarnings) * 0.0131) : 0;
  const employeeQPIP = salaryBonusAmount > 0 ? Math.min(484, Math.min(salaryBonusAmount, maxQpipEarnings) * 0.00494) : 0;
  const totalEmployeePayrollDeductions = employeeQPP + employeeEI + employeeQPIP;

  // 6. Personal Income Tax on Salary/Bonus
  // Approximate blended marginal tax rates for Quebec (Fed + QC)
  let personalTaxOnSalary = 0;
  if (salaryBonusAmount > 0) {
    if (salaryBonusAmount <= 53359) {
      personalTaxOnSalary = salaryBonusAmount * 0.275;
    } else if (salaryBonusAmount <= 106717) {
      personalTaxOnSalary = 14673 + (salaryBonusAmount - 53359) * 0.371;
    } else if (salaryBonusAmount <= 130000) {
      personalTaxOnSalary = 34479 + (salaryBonusAmount - 106717) * 0.457;
    } else {
      personalTaxOnSalary = 45122 + (salaryBonusAmount - 130000) * 0.533;
    }
    // Net of basic personal amount
    personalTaxOnSalary = Math.max(0, personalTaxOnSalary - 4200);
  }

  // 7. Personal Income Tax on Dividends (Gross-up and Dividend Tax Credit)
  let personalTaxOnDividends = 0;
  let federalGrossUp = 0;
  let federalTaxCredit = 0;
  let quebecTaxCredit = 0;
  let tosiApplied = false;
  let tosiTaxPenalty = 0;

  if (dividendAmount > 0) {
    // Check TOSI: If family shareholder is not active (under 20 hrs/wk) and owner under 65, hit with top marginal rate (53.53%)
    if (!familyShareholderActive) {
      tosiApplied = true;
      // Taxed at top marginal tax rate 53.53% without dividend tax credit benefits
      tosiTaxPenalty = dividendAmount * 0.5353;
      personalTaxOnDividends = tosiTaxPenalty;
    } else {
      if (dividendType === 'eligible') {
        // Eligible Dividends: 38% Gross-up
        const grossedUp = dividendAmount * 1.38;
        federalGrossUp = grossedUp - dividendAmount;
        federalTaxCredit = grossedUp * 0.150198;
        quebecTaxCredit = grossedUp * 0.1178; // Quebec TP-1 eligible dividend credit

        // Effective personal tax on eligible dividend in QC (~25% to 40% depending on bracket)
        const marginalRate = salaryBonusAmount > 80000 ? 0.40 : 0.28;
        personalTaxOnDividends = Math.max(0, (dividendAmount * marginalRate));
      } else {
        // Non-Eligible Dividends (Small Business): 15% Gross-up
        const grossedUp = dividendAmount * 1.15;
        federalGrossUp = grossedUp - dividendAmount;
        federalTaxCredit = grossedUp * 0.090301;
        quebecTaxCredit = grossedUp * 0.0401; // Quebec TP-1 non-eligible dividend credit

        // Effective personal tax on non-eligible dividend in QC (~32% to 48%)
        const marginalRate = salaryBonusAmount > 80000 ? 0.46 : 0.35;
        personalTaxOnDividends = Math.max(0, (dividendAmount * marginalRate));
      }
    }
  }

  const totalPersonalTax = personalTaxOnSalary + personalTaxOnDividends;

  // 8. Net Cash in Pocket for Owner
  const grossPersonalDraw = salaryBonusAmount + dividendAmount;
  const netCashInHand = grossPersonalDraw - totalEmployeePayrollDeductions - totalPersonalTax;

  // 9. Total Effective System Tax Rate (Corp Tax + Personal Tax + Payroll Taxes) / Pre-tax Corporate Income
  const totalTaxesPaidBySystem = corporateTax + totalEmployerPayrollTaxes + totalEmployeePayrollDeductions + totalPersonalTax;
  const effectiveTotalTaxRate = corporateNetIncome > 0 ? (totalTaxesPaidBySystem / corporateNetIncome) * 100 : 0;

  // 10. RRSP Room Generated: 18% of earned salary/bonus up to 2025/2026 limit (~$32,490)
  const rrspRoomGenerated = Math.min(32490, salaryBonusAmount * 0.18);

  // 11. Comparison Benchmark: Pure Salary vs This Mix
  // Pure Salary baseline calculation
  const baselineSalary = Math.min(corporateNetIncome / 1.05, corporateNetIncome);
  const baselineNetSalary = baselineSalary * 0.58; // Approximate net on salary
  const taxIntegrationSavingsVsSalary = netCashInHand - (baselineNetSalary * (grossPersonalDraw / (corporateNetIncome || 1)));

  return {
    corporatePreTax: corporateNetIncome,
    corporateTax,
    corporateRetainedEarnings,
    salaryBonusPaid: salaryBonusAmount,
    dividendPaid: dividendAmount,
    corporateDeduction,
    payrollTaxesEmployer: {
      qpp: employerQPP,
      qpip: employerQPIP,
      hsf: employerHSF,
      cnesst: employerCNESST,
      total: totalEmployerPayrollTaxes
    },
    personalIncomeTax: {
      federalTax: personalTaxOnSalary * 0.52,
      quebecTax: personalTaxOnSalary * 0.48,
      dividendTaxCreditFederal: federalTaxCredit,
      dividendTaxCreditQuebec: quebecTaxCredit,
      netPersonalTax: totalPersonalTax
    },
    employeePayrollDeductions: {
      qpp: employeeQPP,
      ei: employeeEI,
      qpip: employeeQPIP,
      total: totalEmployeePayrollDeductions
    },
    netCashInHand,
    effectiveTotalTaxRate,
    rrspRoomGenerated,
    qppPensionCredits: salaryBonusAmount >= 3500,
    tosiApplied,
    tosiTaxPenalty,
    taxIntegrationSavingsVsSalary,
    sbdGrindReduction
  };
}

/**
 * Calculates Retiring Allowance / Severance Payout with CRA Section 60(j.1) Pre-1996 Direct RRSP Rollover
 * and statutory non-regular lump-sum withholding tax brackets.
 */
export function calculateRetiringAllowance(
  totalSeveranceAmount: number,
  pre1996YearsOfService: number,
  pre1979YearsOfService: number,
  voluntaryRrspContribution: number = 0
): RetiringAllowanceCalculation {
  // ITA Section 60(j.1) calculation:
  // - $2,000 for each year of service prior to 1996
  // - PLUS $1,500 for each year prior to 1989 for which employer contributions in pension/DPSP have not vested
  const basePre1996 = Math.max(0, pre1996YearsOfService) * 2000;
  const bonusPre1979 = Math.max(0, pre1979YearsOfService) * 1500;
  const directRrspTransferEligible = Math.min(totalSeveranceAmount, basePre1996 + bonusPre1979);

  // Allowable direct RRSP rollover (tax-exempt at source)
  const totalRrspSheltered = Math.min(totalSeveranceAmount, directRrspTransferEligible + voluntaryRrspContribution);
  const taxableCashPortion = Math.max(0, totalSeveranceAmount - totalRrspSheltered);

  // Lump-Sum Withholding Tax Brackets (Canada / Quebec combined)
  // Bracket 1: Up to $5,000 => 10% Federal / 14% Quebec (24% Total)
  // Bracket 2: $5,001 to $15,000 => 20% Federal / 19% Quebec (39% Total)
  // Bracket 3: Over $15,000 => 30% Federal / 24% Quebec (54% Total)
  let federalLumpSumRate = 0.10;
  let quebecLumpSumRate = 0.14;

  if (taxableCashPortion > 15000) {
    federalLumpSumRate = 0.30;
    quebecLumpSumRate = 0.24;
  } else if (taxableCashPortion > 5000) {
    federalLumpSumRate = 0.20;
    quebecLumpSumRate = 0.19;
  }

  const federalWithholdingTax = taxableCashPortion * federalLumpSumRate;
  const quebecWithholdingTax = taxableCashPortion * quebecLumpSumRate;
  const totalWithholdingTax = federalWithholdingTax + quebecWithholdingTax;
  const netCashToEmployee = taxableCashPortion - totalWithholdingTax;

  return {
    totalSeveranceAmount,
    pre1996YearsOfService,
    pre1979YearsOfService,
    directRrspTransferEligible,
    voluntaryRrspContribution,
    taxableCashPortion,
    federalLumpSumRate,
    quebecLumpSumRate,
    federalWithholdingTax,
    quebecWithholdingTax,
    totalWithholdingTax,
    netCashToEmployee,
    t4Box: directRrspTransferEligible > 0 ? 'Box 14, Code 66 (Eligible) & Code 67 (Non-eligible)' : 'Box 14, Code 67',
    rl1Box: 'Box O (Code RJ: Retiring allowance)'
  };
}
