
import { calculateFederalLayer } from './federalCalculator';

export interface YtdSnapshot {
  pay_periods_per_year: number;
  ytd_gross: number;
  ytd_qpp1: number;
  ytd_qpp2: number;
  ytd_qpip: number;
  ytd_ei: number;
}

const TAX_CONSTANTS_2026 = {
  QPP_BASIC_EXEMPTION_ANNUAL: 3500,
  QPP1_RATE: 0.0640, // Updated from user prompt's 0.0630 to match existing code's 0.0640 for 2026
  QPP1_MAX: 4160.00, // Updated to match 2026 standards
  
  QPP2_THRESHOLD: 68500, // QPP Tier 2 starts above MPE
  QPP2_RATE: 0.04,
  QPP2_MAX: 348.00,
  
  QPIP_RATE: 0.00494, // Updated to 2026 rate
  QPIP_MAX: 464.36,
  
  BASIC_PERSONAL_AMOUNT: 18952,
  BASIC_PERSONAL_CREDIT_RATE: 0.14
};

export function calculateNetPay(grossPay: number, ytd: YtdSnapshot) {
  const { pay_periods_per_year: periods, ytd_gross, ytd_qpp1, ytd_qpp2, ytd_qpip, ytd_ei } = ytd;

  // 1. QPP Tier 1 (C)
  const qppBasicExemption = TAX_CONSTANTS_2026.QPP_BASIC_EXEMPTION_ANNUAL / periods;
  const qpp1Subject = Math.max(0, grossPay - qppBasicExemption);
  const qpp1Calculated = qpp1Subject * TAX_CONSTANTS_2026.QPP1_RATE;
  const qpp1 = Math.min(TAX_CONSTANTS_2026.QPP1_MAX - ytd_qpp1, qpp1Calculated);

  // 2. QPP Tier 2 (C2)
  const qpp2Subject = Math.max(0, (ytd_gross + grossPay) - TAX_CONSTANTS_2026.QPP2_THRESHOLD);
  const qpp2CappedSubject = Math.min(grossPay, qpp2Subject);
  const qpp2Calculated = qpp2CappedSubject * TAX_CONSTANTS_2026.QPP2_RATE;
  const qpp2 = Math.min(TAX_CONSTANTS_2026.QPP2_MAX - ytd_qpp2, qpp2Calculated);

  // 3. QPIP (Ap)
  const qpipCalculated = grossPay * TAX_CONSTANTS_2026.QPIP_RATE;
  const qpip = Math.min(TAX_CONSTANTS_2026.QPIP_MAX - ytd_qpip, qpipCalculated);

  // 4. Federal Layer (EI and Federal Tax)
  const { ei, federalTax } = calculateFederalLayer(grossPay, ytd_gross, ytd_ei, periods);

  // 5. Provincial Income Tax (Quebec)
  const workerDeduction = Math.min(grossPay * 0.06, 1450 / periods);
  
  // Calculate CSA (Deduction for additional QPP contributions)
  // Ratio is (0.01 / 0.0640) for Tier 1 + full Tier 2
  const csa = (qpp1 * (0.01 / 0.0640)) + qpp2;
  
  let annualTaxable = periods * (grossPay - workerDeduction - csa);
  annualTaxable = Math.max(0, annualTaxable);

  // Progressive Brackets
  let annualTax = 0;
  if (annualTaxable <= 54345) {
    annualTax = annualTaxable * 0.14;
  } else if (annualTaxable <= 108680) {
    annualTax = (annualTaxable * 0.19) - 2717;
  } else if (annualTaxable <= 132245) {
    annualTax = (annualTaxable * 0.24) - 8151;
  } else {
    annualTax = (annualTaxable * 0.2575) - 10465;
  }

  // Apply non-refundable tax credit (Basic Personal Amount)
  const personalCredit = TAX_CONSTANTS_2026.BASIC_PERSONAL_AMOUNT * TAX_CONSTANTS_2026.BASIC_PERSONAL_CREDIT_RATE;
  annualTax = Math.max(0, annualTax - personalCredit);
  
  const provTax = annualTax / periods;

  // 6. Final Net
  const netPay = grossPay - qpp1 - qpp2 - qpip - ei - federalTax - provTax;

  return { 
    grossPay,
    qpp1, 
    qpp2, 
    qpip, 
    ei,
    federalTax,
    provTax, 
    netPay,
    totalDeductions: grossPay - netPay
  };
}
