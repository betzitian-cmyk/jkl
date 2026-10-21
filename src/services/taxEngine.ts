/**
 * 2026 Canadian Payroll Statutory Service
 * Handles Federal BPA clawback logic and baseline hydration.
 */

export const STATUTORY_2026 = {
  FED_MAX_BPA: 16452,
  FED_MIN_BPA: 14829,
  FED_THRESHOLD_LOW: 181440,
  FED_THRESHOLD_HIGH: 258482,
  QC_DEFAULT_BPA: 18952,
};

/**
 * Calculates the dynamic Federal Basic Personal Amount (BPA) based on estimated annual income.
 * Applies the linear clawback for income between $181,142 and $255,274 (2026 projected).
 */
export function calculateDynamicFedBPA(annualIncome: number): number {
  const { FED_MAX_BPA, FED_MIN_BPA, FED_THRESHOLD_LOW, FED_THRESHOLD_HIGH } = STATUTORY_2026;

  if (annualIncome <= FED_THRESHOLD_LOW) {
    return FED_MAX_BPA;
  }

  if (annualIncome >= FED_THRESHOLD_HIGH) {
    return FED_MIN_BPA;
  }

  // Linear clawback calculation
  const incomeOverThreshold = annualIncome - FED_THRESHOLD_LOW;
  const thresholdRange = FED_THRESHOLD_HIGH - FED_THRESHOLD_LOW;
  const bpaRange = FED_MAX_BPA - FED_MIN_BPA;

  const reduction = (incomeOverThreshold / thresholdRange) * bpaRange;
  const calculatedBPA = FED_MAX_BPA - reduction;

  return Math.round(calculatedBPA * 100) / 100;
}

/**
 * Sanitizes the raw form payload, transforming empty strings into undefined
 * to ensure that backend statutory fallbacks are correctly triggered.
 */
export function sanitizeTaxPayload(payload: any) {
  const sanitized = { ...payload };
  
  const numericFields = [
    'fedTaxCreditAmount', 
    'fedAdditionalTax', 
    'fedTaxReductionAmount',
    'provTaxCreditAmount', 
    'provAdditionalTax',
    'provTaxReductionAmount',
    'provTaxReductionCredits'
  ];

  for (const field of numericFields) {
    const value = payload[field];
    if (value === '' || value === null || value === undefined) {
      sanitized[field] = undefined;
    } else {
      const parsed = parseFloat(value.toString().replace(/[^0-9.-]+/g, ""));
      sanitized[field] = isNaN(parsed) ? undefined : parsed;
    }
  }

  return sanitized;
}

/**
 * Hydrates a tax configuration with statutory defaults if user-provided values are missing.
 */
export function hydrateTaxDefaults(sanitizedData: any, annualIncome: number) {
  const systemCalculatedBPA = calculateDynamicFedBPA(annualIncome);
  
  const isFedDefaultApplied = sanitizedData.fedTaxCreditAmount === undefined;
  const isProvDefaultApplied = sanitizedData.provTaxCreditAmount === undefined;

  return {
    ...sanitizedData,
    fedTaxCreditAmount: sanitizedData.fedTaxCreditAmount ?? systemCalculatedBPA,
    fedAdditionalTax: sanitizedData.fedAdditionalTax ?? 0,
    fedTaxReductionAmount: sanitizedData.fedTaxReductionAmount ?? 0,
    provTaxCreditAmount: sanitizedData.provTaxCreditAmount ?? STATUTORY_2026.QC_DEFAULT_BPA,
    provAdditionalTax: sanitizedData.provAdditionalTax ?? 0,
    provTaxReductionAmount: sanitizedData.provTaxReductionAmount ?? 0,
    provTaxReductionCredits: sanitizedData.provTaxReductionCredits ?? 0,
    isFedDefaultApplied,
    isProvDefaultApplied,
    systemCalculatedBPA,
    isFedBPAClawbacked: annualIncome > STATUTORY_2026.FED_THRESHOLD_LOW,
  };
}
