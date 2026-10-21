
export const GST_RATE = 0.05;
export const QST_RATE = 0.09975;

export type TaxabilityStatus = 'taxable' | 'exempt' | 'zero_rated' | 'gst_only';
export type TaxCalculationMode = 'exclusive' | 'inclusive';

export interface SalesTaxBreakdownResult {
  baseAmount: number;
  gst: number;
  qst: number;
  totalTaxes: number;
  grandTotal: number;
  taxStatus: TaxabilityStatus;
  isTaxable: boolean;
  itcGst: number; // Crédits de taxe sur les intrants (CTI - Fédéral)
  itrQst: number; // Remboursements de la taxe sur les intrants (RTI - Québec)
}

export function calculateSalesTax(amount: number, includeGst: boolean = true, includeQst: boolean = true) {
  const gst = includeGst ? Number((amount * GST_RATE).toFixed(2)) : 0;
  const qst = includeQst ? Number((amount * QST_RATE).toFixed(2)) : 0;
  const total = Number((amount + gst + qst).toFixed(2));

  return {
    baseAmount: Number(amount.toFixed(2)),
    gst,
    qst,
    totalTaxes: Number((gst + qst).toFixed(2)),
    grandTotal: total
  };
}

export function extractSalesTax(totalAmount: number) {
  // total = base * (1 + 0.05 + 0.09975) = base * 1.14975
  const baseAmount = totalAmount / (1 + GST_RATE + QST_RATE);
  const gst = Number((baseAmount * GST_RATE).toFixed(2));
  const qst = Number((baseAmount * QST_RATE).toFixed(2));
  const roundedBase = Number((totalAmount - gst - qst).toFixed(2));

  return {
    baseAmount: roundedBase,
    gst,
    qst,
    totalTaxes: Number((gst + qst).toFixed(2)),
    grandTotal: Number(totalAmount.toFixed(2))
  };
}

/**
 * Calculates GST (5%) and QST (9.975%) while differentiating between
 * taxable, exempt (non-taxable), zero-rated, and GST-only goods/services.
 * Supports both tax-inclusive and tax-exclusive modes and ITC/ITR recovery factors (e.g. 50% for meals).
 */
export function calculateTaxByStatus(
  amount: number,
  taxStatus: TaxabilityStatus = 'taxable',
  mode: TaxCalculationMode = 'inclusive',
  itcRecoveryFactor: number = 1.0
): SalesTaxBreakdownResult {
  const cleanAmount = Math.max(0, amount || 0);

  if (taxStatus === 'exempt' || taxStatus === 'zero_rated') {
    const rounded = Number(cleanAmount.toFixed(2));
    return {
      baseAmount: rounded,
      gst: 0,
      qst: 0,
      totalTaxes: 0,
      grandTotal: rounded,
      taxStatus,
      isTaxable: false,
      itcGst: 0,
      itrQst: 0,
    };
  }

  if (taxStatus === 'gst_only') {
    if (mode === 'inclusive') {
      const base = cleanAmount / (1 + GST_RATE);
      const gst = Number((base * GST_RATE).toFixed(2));
      const baseRounded = Number((cleanAmount - gst).toFixed(2));
      return {
        baseAmount: baseRounded,
        gst,
        qst: 0,
        totalTaxes: gst,
        grandTotal: Number(cleanAmount.toFixed(2)),
        taxStatus,
        isTaxable: true,
        itcGst: Number((gst * itcRecoveryFactor).toFixed(2)),
        itrQst: 0,
      };
    } else {
      const baseRounded = Number(cleanAmount.toFixed(2));
      const gst = Number((baseRounded * GST_RATE).toFixed(2));
      return {
        baseAmount: baseRounded,
        gst,
        qst: 0,
        totalTaxes: gst,
        grandTotal: Number((baseRounded + gst).toFixed(2)),
        taxStatus,
        isTaxable: true,
        itcGst: Number((gst * itcRecoveryFactor).toFixed(2)),
        itrQst: 0,
      };
    }
  }

  // Standard 'taxable' (GST 5% + QST 9.975%)
  if (mode === 'inclusive') {
    const extracted = extractSalesTax(cleanAmount);
    return {
      ...extracted,
      taxStatus: 'taxable',
      isTaxable: true,
      itcGst: Number((extracted.gst * itcRecoveryFactor).toFixed(2)),
      itrQst: Number((extracted.qst * itcRecoveryFactor).toFixed(2)),
    };
  } else {
    const calculated = calculateSalesTax(cleanAmount, true, true);
    return {
      ...calculated,
      taxStatus: 'taxable',
      isTaxable: true,
      itcGst: Number((calculated.gst * itcRecoveryFactor).toFixed(2)),
      itrQst: Number((calculated.qst * itcRecoveryFactor).toFixed(2)),
    };
  }
}

