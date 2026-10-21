/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateQcSourceDeductions } from './qcPayCalculation';
import { TAX_CONSTANTS, FREQUENCY_WEEKS, CNESST_SECTORS } from './constants';
import { PayrollInput, PayrollResult } from '../types';
import { calculateNetPay, YtdSnapshot } from '../services/payrollCalculator';
import { calculateTaxByStatus } from '../services/salesTaxCalculator';

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const { 
    grossPay, 
    frequency, 
    year, 
    vacationPay = 0, 
    overtimePay = 0, 
    bonusPay = 0,
    commissionPay = 0,
    commissionExpenses = 0,
    rrspContribution = 0,
    taxableBenefitsFederal = 0,
    taxableBenefitsProvincial = 0,
    garnishments = [],
    benefitContributions,

    // YTD Accumulations for Capping Triggers
    ytdGross = 0,
    ytdQPP = 0,
    ytdEI = 0,
    ytdQPIP = 0,
    ytdEmployerQPP = 0,
    ytdEmployerEI = 0,
    ytdEmployerQPIP = 0,
    ytdCnesstInsurable = 0,

    // CNESST Sector & Rate Controls
    cnesstSectorCode = '15000',
    cnesstEmployerRate,
    includeCnesstInDeductions = false,

    // GST / QST Taxable vs Non-Taxable Supplies
    taxableSupplyAmount = 0,
    nonTaxableSupplyAmount = 0,
    supplyTaxability = 'taxable',
    supplyTaxMode = 'exclusive',

    // Statutory Tax Profile Controls
    claimFederalBasicPersonalAmount = true,
    hasMultipleEmployers = false,
    federalTd1ClaimAmount,
    federalAdditionalTax = 0,
    t1213FederalReduction = 0,

    claimProvincialBasicPersonalAmount = true,
    quebecTp1015Line10Code = 'A',
    livesInNorthernZone = false,
    spouseCreditTransfer = false,
    tp1016QuebecReduction = 0,

    // Voluntary Net Pay Modifiers
    voluntaryPreTaxRrsp = 0,
    voluntaryPostTaxHealth = 0,
  } = input;

  const safeGrossPay = Number(grossPay) || 0;
  const safeVacationPay = Number(vacationPay) || 0;
  const safeOvertimePay = Number(overtimePay) || 0;
  const safeBonusPay = Number(bonusPay) || 0;
  const safeCommissionPay = Number(commissionPay) || 0;
  const safeCommissionExpenses = Number(commissionExpenses) || 0;
  const safeRrspContribution = Number(rrspContribution) || 0;
  const safeVoluntaryPreTaxRrsp = Number(voluntaryPreTaxRrsp) || 0;
  const safeVoluntaryPostTaxHealth = Number(voluntaryPostTaxHealth) || 0;
  const safeYtdGross = Number(ytdGross) || 0;
  const safeYtdQPP = Number(ytdQPP) || 0;
  const safeYtdEI = Number(ytdEI) || 0;
  const safeYtdQPIP = Number(ytdQPIP) || 0;
  const safeYtdCnesstInsurable = Number(ytdCnesstInsurable) || 0;
  const safeTaxableSupplyAmount = Number(taxableSupplyAmount) || 0;
  const safeNonTaxableSupplyAmount = Number(nonTaxableSupplyAmount) || 0;

  const garnishmentAmount = (garnishments || []).reduce((sum, g) => sum + (Number(g.amount) || 0), 0);
  const totalPreTaxRrsp = Math.max(0, safeRrspContribution + safeVoluntaryPreTaxRrsp);

  // Benefit logic
  let calculatedTaxableFed = Number(taxableBenefitsFederal) || 0;
  let calculatedTaxableProv = Number(taxableBenefitsProvincial) || 0;

  if (benefitContributions) {
    calculatedTaxableFed += Number(benefitContributions.lifeInsurance) || 0;
    calculatedTaxableProv += Number(benefitContributions.lifeInsurance) || 0;
    calculatedTaxableProv += Number(benefitContributions.health) || 0;
    if (benefitContributions.isDisabilityEmployerPaid) {
      calculatedTaxableFed += Number(benefitContributions.disability) || 0;
      calculatedTaxableProv += Number(benefitContributions.disability) || 0;
    }
  }
  
  const numPeriods = FREQUENCY_WEEKS[frequency] || 26;
  const totalGrossForPeriod = safeGrossPay + safeVacationPay + safeOvertimePay + safeBonusPay + safeCommissionPay;
  
  const ytdSnapshot: YtdSnapshot = {
    pay_periods_per_year: numPeriods,
    ytd_gross: safeYtdGross,
    ytd_qpp1: Math.min(safeYtdQPP, 4160), // Estimate for 2026
    ytd_qpp2: Math.max(0, safeYtdQPP - 4160),
    ytd_qpip: safeYtdQPIP,
    ytd_ei: safeYtdEI
  };

  const calcResult = calculateNetPay(totalGrossForPeriod, ytdSnapshot);

  // Constants for capping indicators
  const constants = TAX_CONSTANTS[year as keyof typeof TAX_CONSTANTS] || TAX_CONSTANTS[2026];
  const annualMaxQPP = 4160 + 348; // Tier 1 + Tier 2
  const annualMaxEI = 895.70;
  const annualMaxQPIP = 464.36;
  const annualMaxCNESSTInsurable = constants.EMPLOYER?.LABOUR_STANDARDS_MAX_EARNINGS || (year === 2024 ? 94000 : year === 2025 ? 98000 : 103000);

  const qppCapped = safeYtdQPP >= annualMaxQPP || (safeYtdQPP + calcResult.qpp1 + calcResult.qpp2) >= annualMaxQPP;
  const eiCapped = safeYtdEI >= annualMaxEI || (safeYtdEI + calcResult.ei) >= annualMaxEI;
  const qpipCapped = safeYtdQPIP >= annualMaxQPIP || (safeYtdQPIP + calcResult.qpip) >= annualMaxQPIP;

  // Resolve CNESST Sector Rate (%): explicit rate overrides sector lookup, fallback 1.50%
  const matchedSector = CNESST_SECTORS.find(s => s.code === cnesstSectorCode);
  const resolvedCnesstRate = cnesstEmployerRate !== undefined && Number(cnesstEmployerRate) >= 0
    ? Number(cnesstEmployerRate)
    : (matchedSector ? matchedSector.rate : 1.50);

  // HSF and CNESST (using employee's salary & relevant CNESST sector rate, capped at annual maximum insurable salary)
  const qcDeductions = calculateQcSourceDeductions({
    employeeId: input.employeeId || 'emp_1',
    grossPay: totalGrossForPeriod,
    payPeriodsPerYear: ([12, 24, 26, 52].includes(numPeriods) ? numPeriods : 26) as any,
    ytdGross: safeYtdGross,
    ytdQppTier1Ee: ytdSnapshot.ytd_qpp1,
    ytdQppTier2Ee: ytdSnapshot.ytd_qpp2,
    ytdQpipEe: safeYtdQPIP,
    ytdCnesstInsurable: safeYtdCnesstInsurable,
    isQppExempt: input.isQppExempt || false,
    isQpipExempt: input.isQpipExempt || false,
    annualWorldwidePayroll: Number(input.annualWorldwidePayroll) || 2000000,
    cnesstEmployerRate: resolvedCnesstRate,
    constants: input.qcTaxConstants || {
      qppBasicExemption: 3500,
      qppMpe: 68500,
      qppYampe: 77200,
      qppTier1RateEe: 0.064,
      qppTier1RateEr: 0.064,
      qppTier2RateEe: 0.04,
      qppTier2RateEr: 0.04,
      qpipMie: 94000,
      qpipRateEe: 0.00494,
      qpipRateEr: 0.00692,
      cnesstMaxInsurable: annualMaxCNESSTInsurable,
    },
  });

  const cnesstRemainingBeforePeriod = Math.max(0, annualMaxCNESSTInsurable - safeYtdCnesstInsurable);
  const cnesstInsurableEarnings = Math.min(totalGrossForPeriod, cnesstRemainingBeforePeriod);
  const cnesstPerPeriod = Number((cnesstInsurableEarnings * (resolvedCnesstRate / 100)).toFixed(2));
  const cnesstCapped = safeYtdCnesstInsurable >= annualMaxCNESSTInsurable || (safeYtdCnesstInsurable + totalGrossForPeriod) >= annualMaxCNESSTInsurable;
  const cnesstRemainingCap = Math.max(0, annualMaxCNESSTInsurable - (safeYtdCnesstInsurable + cnesstInsurableEarnings));

  const hsfPerPeriod = qcDeductions.hsfEr;

  const lsRate = 0.0006;
  const lsMax = annualMaxCNESSTInsurable;
  const lsPerPeriod = Number(((Math.min(totalGrossForPeriod * numPeriods, lsMax) * lsRate) / numPeriods).toFixed(2));

  // GST (5%) & QST (9.975%) calculation on taxable vs non-taxable services/goods
  const salesTaxCalc = calculateTaxByStatus(safeTaxableSupplyAmount, supplyTaxability, supplyTaxMode, 1.0);
  const gstAmount = salesTaxCalc.gst;
  const qstAmount = salesTaxCalc.qst;
  const totalWithSalesTax = Number((salesTaxCalc.grandTotal + safeNonTaxableSupplyAmount).toFixed(2));

  const cnesstEmployeeDeduction = includeCnesstInDeductions ? cnesstPerPeriod : 0;
  const totalDeductions = calcResult.totalDeductions + totalPreTaxRrsp + garnishmentAmount + safeVoluntaryPostTaxHealth + cnesstEmployeeDeduction;
  const netPay = Math.max(0, totalGrossForPeriod - totalDeductions);

  const employerEI = calcResult.ei * 1.4;
  const totalEmployerCost = totalGrossForPeriod + calcResult.qpp1 + calcResult.qpp2 + calcResult.qpip + employerEI + hsfPerPeriod + cnesstPerPeriod + lsPerPeriod;

  return {
    grossPay: totalGrossForPeriod,
    netPay,
    totalDeductions,
    federalTax: calcResult.federalTax,
    quebecTax: calcResult.provTax,
    qpp: calcResult.qpp1 + calcResult.qpp2,
    qpip: calcResult.qpip,
    ei: calcResult.ei,
    hsf: hsfPerPeriod,
    cnesst: cnesstPerPeriod,
    gst: gstAmount,
    qst: qstAmount,
    taxableSupplyAmount: salesTaxCalc.baseAmount,
    nonTaxableSupplyAmount: Number(safeNonTaxableSupplyAmount.toFixed(2)),
    totalWithSalesTax,
    labourStandards: lsPerPeriod,
    employerQPP: calcResult.qpp1 + calcResult.qpp2,
    employerQPIP: calcResult.qpip,
    employerEI: employerEI,
    employerCNESST: cnesstPerPeriod,
    qppTier1Ee: calcResult.qpp1,
    qppTier2Ee: calcResult.qpp2,
    qppTier1Er: calcResult.qpp1,
    qppTier2Er: calcResult.qpp2,
    totalEmployerCost,
    vacationPay: safeVacationPay,
    overtimePay: safeOvertimePay,
    bonusPay: safeBonusPay,
    commissionPay: safeCommissionPay,
    commissionExpenses: safeCommissionExpenses,
    qppCapped,
    eiCapped,
    qpipCapped,
    cnesstCapped,
    qppRemainingCap: Math.max(0, annualMaxQPP - (safeYtdQPP + calcResult.qpp1 + calcResult.qpp2)),
    eiRemainingCap: Math.max(0, annualMaxEI - (safeYtdEI + calcResult.ei)),
    qpipRemainingCap: Math.max(0, annualMaxQPIP - (safeYtdQPIP + calcResult.qpip)),
    cnesstRemainingCap,
    annualMaxQPP,
    annualMaxEI,
    annualMaxQPIP,
    annualMaxCNESSTInsurable,
    cnesstInsurableEarnings,
    cnesstRateApplied: resolvedCnesstRate,
    cnesstSectorCode,
    annualMaxEmployerQPP: annualMaxQPP,
    annualMaxEmployerEI: annualMaxEI * 1.4,
    annualMaxEmployerQPIP: annualMaxQPIP * 1.4,
    ytdPriorQPP: safeYtdQPP,
    ytdPriorEI: safeYtdEI,
    ytdPriorQPIP: safeYtdQPIP,
    ytdPriorCNESSTInsurable: safeYtdCnesstInsurable,
    ytdNewQPP: safeYtdQPP + calcResult.qpp1 + calcResult.qpp2,
    ytdNewEI: safeYtdEI + calcResult.ei,
    ytdNewQPIP: safeYtdQPIP + calcResult.qpip,
    ytdNewCNESSTInsurable: safeYtdCnesstInsurable + cnesstInsurableEarnings,
    hasMultipleEmployersApplied: hasMultipleEmployers,
    t1213ReductionApplied: 0,
    tp1016ReductionApplied: 0,
    preTaxRrspDeduction: totalPreTaxRrsp,
    postTaxHealthDeduction: safeVoluntaryPostTaxHealth,
    taxableFederalBase: totalGrossForPeriod,
    taxableQuebecBase: totalGrossForPeriod,
    breakdown: [
      { label: 'Salaire Net', amount: netPay, percentage: totalGrossForPeriod > 0 ? (netPay / totalGrossForPeriod) * 100 : 0, color: '#10b981' },
      { label: 'Impôt Féd', amount: calcResult.federalTax, percentage: totalGrossForPeriod > 0 ? (calcResult.federalTax / totalGrossForPeriod) * 100 : 0, color: '#ef4444' },
      { label: 'Impôt Prov', amount: calcResult.provTax, percentage: totalGrossForPeriod > 0 ? (calcResult.provTax / totalGrossForPeriod) * 100 : 0, color: '#f97316' },
      { label: `RRQ${qppCapped ? ' (Plafond)' : ''}`, amount: calcResult.qpp1 + calcResult.qpp2, percentage: totalGrossForPeriod > 0 ? ((calcResult.qpp1 + calcResult.qpp2) / totalGrossForPeriod) * 100 : 0, color: '#3b82f6' },
      { label: `RQAP${qpipCapped ? ' (Plafond)' : ''}`, amount: calcResult.qpip, percentage: totalGrossForPeriod > 0 ? (calcResult.qpip / totalGrossForPeriod) * 100 : 0, color: '#8b5cf6' },
      { label: `AE${eiCapped ? ' (Plafond)' : ''}`, amount: calcResult.ei, percentage: totalGrossForPeriod > 0 ? (calcResult.ei / totalGrossForPeriod) * 100 : 0, color: '#64748b' },
      ...(includeCnesstInDeductions && cnesstPerPeriod > 0 ? [{ label: `CNESST (${resolvedCnesstRate.toFixed(2)}%)`, amount: cnesstPerPeriod, percentage: totalGrossForPeriod > 0 ? (cnesstPerPeriod / totalGrossForPeriod) * 100 : 0, color: '#eab308' }] : []),
      ...(totalPreTaxRrsp > 0 ? [{ label: 'REER / RVER (Avant Impôt)', amount: totalPreTaxRrsp, percentage: totalGrossForPeriod > 0 ? (totalPreTaxRrsp / totalGrossForPeriod) * 100 : 0, color: '#0ea5e9' }] : []),
      ...(voluntaryPostTaxHealth > 0 ? [{ label: 'Santé Volontaire (Après Impôt)', amount: voluntaryPostTaxHealth, percentage: totalGrossForPeriod > 0 ? (voluntaryPostTaxHealth / totalGrossForPeriod) * 100 : 0, color: '#d946ef' }] : []),
      ...(garnishmentAmount > 0 ? [{ label: 'Saisies', amount: garnishmentAmount, percentage: totalGrossForPeriod > 0 ? (garnishmentAmount / totalGrossForPeriod) * 100 : 0, color: '#475569' }] : []),
    ],
  };
}

