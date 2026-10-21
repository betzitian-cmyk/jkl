
const CRA_2026 = {
  EI_RATE_QC: 0.0130, 
  EI_MAX_PREMIUM_QC: 895.70, 
  
  BPA_MAX: 16452,
  BPA_MIN: 14829,
  BPA_THRESH_LOWER: 181440,
  BPA_THRESH_UPPER: 258482,
  BPA_RATE: 0.15 
};

export function calculateFederalLayer(grossPay: number, ytd_gross: number, ytd_ei: number, periods: number) {
  // 1. Employment Insurance (Quebec Rate)
  const eiCalculated = grossPay * CRA_2026.EI_RATE_QC;
  const ei = Math.min(CRA_2026.EI_MAX_PREMIUM_QC - ytd_ei, eiCalculated);

  // 2. Federal Taxable Income
  // In a full implementation, deduct RRSP, RPP, and union dues here.
  let annualTaxable = periods * (grossPay - ei); 
  annualTaxable = Math.max(0, annualTaxable);

  // 3. Federal Progressive Brackets (2026)
  let annualTax = 0;
  if (annualTaxable <= 58523) {
    annualTax = annualTaxable * 0.14;
  } else if (annualTaxable <= 117045) {
    annualTax = 8193.22 + ((annualTaxable - 58523) * 0.205);
  } else if (annualTaxable <= 181440) {
    annualTax = 20190.23 + ((annualTaxable - 117045) * 0.26);
  } else if (annualTaxable <= 258482) {
    annualTax = 36932.93 + ((annualTaxable - 181440) * 0.29);
  } else {
    annualTax = 59275.11 + ((annualTaxable - 258482) * 0.33);
  }

  // 4. Basic Personal Amount (BPA) Clawback
  let currentBPA = CRA_2026.BPA_MAX;
  if (annualTaxable > CRA_2026.BPA_THRESH_UPPER) {
    currentBPA = CRA_2026.BPA_MIN;
  } else if (annualTaxable > CRA_2026.BPA_THRESH_LOWER) {
    const ratio = (annualTaxable - CRA_2026.BPA_THRESH_LOWER) / (CRA_2026.BPA_THRESH_UPPER - CRA_2026.BPA_THRESH_LOWER);
    currentBPA = CRA_2026.BPA_MAX - (ratio * (CRA_2026.BPA_MAX - CRA_2026.BPA_MIN));
  }

  const federalCredits = currentBPA * CRA_2026.BPA_RATE;
  annualTax = Math.max(0, annualTax - federalCredits);

  // Apply Quebec Abatment (16.5%)
  annualTax = annualTax * (1 - 0.165);

  const federalTax = annualTax / periods;

  return { ei, federalTax };
}
