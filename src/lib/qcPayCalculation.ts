import { z } from 'zod';

export interface QcTaxConstants {
  qppBasicExemption: number;
  qppMpe: number;
  qppYampe: number;
  qppTier1RateEe?: number;
  qppTier1RateEr?: number;
  qppTier2RateEe?: number;
  qppTier2RateEr?: number;
  qppTier1EeRate?: number;
  qppTier1ErRate?: number;
  qppTier2EeRate?: number;
  qppTier2ErRate?: number;
  qpipMie: number;
  qpipRateEe?: number;
  qpipRateEr?: number;
  qpipEeRate?: number;
  qpipErRate?: number;
  cnesstMaxInsurable: number;
}

const safeNonNegativeNumber = z.preprocess((val) => {
  const num = Number(val);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}, z.number().nonnegative());

const safeEmployeeId = z.preprocess((val) => {
  if (typeof val === 'string' && val.trim().length > 0) return val;
  const num = Number(val);
  return Number.isFinite(num) && num > 0 ? Math.round(num) : 'emp_1';
}, z.union([z.string(), z.number()]));

const safePayPeriods = z.preprocess((val) => {
  const num = Number(val);
  if (num === 12 || num === 24 || num === 26 || num === 52) return num;
  return 26;
}, z.union([z.literal(12), z.literal(24), z.literal(26), z.literal(52)]));

export const QcPayCalculationInputSchema = z.object({
  employeeId: safeEmployeeId,
  grossPay: safeNonNegativeNumber,
  payPeriodsPerYear: safePayPeriods,
  ytdGross: safeNonNegativeNumber,
  ytdQppTier1Ee: safeNonNegativeNumber,
  ytdQppTier2Ee: safeNonNegativeNumber,
  ytdQpipEe: safeNonNegativeNumber,
  ytdCnesstInsurable: safeNonNegativeNumber,
  isQppExempt: z.preprocess((val) => Boolean(val), z.boolean()),
  isQpipExempt: z.preprocess((val) => Boolean(val), z.boolean()),
  annualWorldwidePayroll: safeNonNegativeNumber,
  cnesstEmployerRate: safeNonNegativeNumber,
  constants: z.any().optional(),
});

export type QcPayCalculationInput = z.infer<typeof QcPayCalculationInputSchema>;

export interface QcPayCalculationOutput {
  employeeId: string | number;
  qppTier1Ee: number;
  qppTier1Er: number;
  qppTier2Ee: number;
  qppTier2Er: number;
  qpipEe: number;
  qpipEr: number;
  hsfEr: number;
  cnesstEr: number;
}

const QC_2026_CONSTANTS = {
  qppBasicExemption: 3500.00,
  qppMpe: 68500.00,
  qppYampe: 77200.00,
  qppTier1RateEe: 0.0640,
  qppTier1RateEr: 0.0640,
  qppTier2RateEe: 0.0400,
  qppTier2RateEr: 0.0400,
  qpipMie: 94000.00,
  qpipRateEe: 0.00494,
  qpipRateEr: 0.00692,
  cnesstMaxInsurable: 94000.00,
};

export function calculateQcSourceDeductions(input: QcPayCalculationInput): QcPayCalculationOutput {
  const parsed = QcPayCalculationInputSchema.safeParse(input);
  const verified = parsed.success
    ? parsed.data
    : {
        employeeId: 1,
        grossPay: Math.max(0, Number(input?.grossPay) || 0),
        payPeriodsPerYear: 26 as const,
        ytdGross: Math.max(0, Number(input?.ytdGross) || 0),
        ytdQppTier1Ee: Math.max(0, Number(input?.ytdQppTier1Ee) || 0),
        ytdQppTier2Ee: Math.max(0, Number(input?.ytdQppTier2Ee) || 0),
        ytdQpipEe: Math.max(0, Number(input?.ytdQpipEe) || 0),
        ytdCnesstInsurable: Math.max(0, Number(input?.ytdCnesstInsurable) || 0),
        isQppExempt: Boolean(input?.isQppExempt),
        isQpipExempt: Boolean(input?.isQpipExempt),
        annualWorldwidePayroll: Math.max(0, Number(input?.annualWorldwidePayroll) || 2000000),
        cnesstEmployerRate: Math.max(0, Number(input?.cnesstEmployerRate) || 1.5),
        constants: input?.constants,
      };

  const rawConstants = verified.constants || QC_2026_CONSTANTS;
  const constants = {
    qppBasicExemption: Number(rawConstants.qppBasicExemption ?? QC_2026_CONSTANTS.qppBasicExemption),
    qppMpe: Number(rawConstants.qppMpe ?? QC_2026_CONSTANTS.qppMpe),
    qppYampe: Number(rawConstants.qppYampe ?? QC_2026_CONSTANTS.qppYampe),
    qppTier1RateEe: Number(rawConstants.qppTier1RateEe ?? rawConstants.qppTier1EeRate ?? QC_2026_CONSTANTS.qppTier1RateEe),
    qppTier1RateEr: Number(rawConstants.qppTier1RateEr ?? rawConstants.qppTier1ErRate ?? QC_2026_CONSTANTS.qppTier1RateEr),
    qppTier2RateEe: Number(rawConstants.qppTier2RateEe ?? rawConstants.qppTier2EeRate ?? QC_2026_CONSTANTS.qppTier2RateEe),
    qppTier2RateEr: Number(rawConstants.qppTier2RateEr ?? rawConstants.qppTier2ErRate ?? QC_2026_CONSTANTS.qppTier2RateEr),
    qpipMie: Number(rawConstants.qpipMie ?? QC_2026_CONSTANTS.qpipMie),
    qpipRateEe: Number(rawConstants.qpipRateEe ?? rawConstants.qpipEeRate ?? QC_2026_CONSTANTS.qpipRateEe),
    qpipRateEr: Number(rawConstants.qpipRateEr ?? rawConstants.qpipErRate ?? QC_2026_CONSTANTS.qpipRateEr),
    cnesstMaxInsurable: Number(rawConstants.cnesstMaxInsurable ?? QC_2026_CONSTANTS.cnesstMaxInsurable),
  };

  // QPP Tier 1
  let qppTier1Ee = 0;
  let qppTier1Er = 0;
  if (!verified.isQppExempt) {
    const periodExemption = constants.qppBasicExemption / Number(verified.payPeriodsPerYear);
    const pensionableEarnings = Math.max(0, verified.grossPay - periodExemption);
    const maxTier1AnnualEe = (constants.qppMpe - constants.qppBasicExemption) * constants.qppTier1RateEe;
    const tier1RemainingEe = Math.max(0, maxTier1AnnualEe - verified.ytdQppTier1Ee);

    qppTier1Ee = Math.min(pensionableEarnings * constants.qppTier1RateEe, tier1RemainingEe);
    qppTier1Er = qppTier1Ee;
  }

  // QPP Tier 2
  let qppTier2Ee = 0;
  let qppTier2Er = 0;
  if (!verified.isQppExempt && (verified.ytdGross + verified.grossPay) > constants.qppMpe) {
    const maxTier2AnnualEe = (constants.qppYampe - constants.qppMpe) * constants.qppTier2RateEe;
    const tier2RemainingEe = Math.max(0, maxTier2AnnualEe - verified.ytdQppTier2Ee);
    const tier2EligibleEarnings = Math.min(
      verified.grossPay,
      Math.max(0, (verified.ytdGross + verified.grossPay) - constants.qppMpe)
    );
    qppTier2Ee = Math.min(tier2EligibleEarnings * constants.qppTier2RateEe, tier2RemainingEe);
    qppTier2Er = qppTier2Ee;
  }

  // QPIP
  let qpipEe = 0;
  let qpipEr = 0;
  if (!verified.isQpipExempt) {
    const maxQpipAnnualEe = constants.qpipMie * constants.qpipRateEe;
    const qpipRemainingEe = Math.max(0, maxQpipAnnualEe - verified.ytdQpipEe);
    qpipEe = Math.min(verified.grossPay * constants.qpipRateEe, qpipRemainingEe);

    const maxQpipAnnualEr = constants.qpipMie * constants.qpipRateEr;
    const qpipRemainingEr = Math.max(0, maxQpipAnnualEr - (verified.ytdQpipEe * (constants.qpipRateEr / constants.qpipRateEe)));
    qpipEr = Math.min(verified.grossPay * constants.qpipRateEr, qpipRemainingEr);
  }

  // HSF Employer Contribution
  let hsfRate = 0.0165;
  if (verified.annualWorldwidePayroll > 1000000 && verified.annualWorldwidePayroll <= 7500000) {
    hsfRate = 0.0125 + (0.0000005385 * verified.annualWorldwidePayroll);
  } else if (verified.annualWorldwidePayroll > 7500000) {
    hsfRate = 0.0426;
  }
  const hsfEr = verified.grossPay * hsfRate;

  // CNESST
  const cnesstRemainingInsurable = Math.max(0, constants.cnesstMaxInsurable - verified.ytdCnesstInsurable);
  const cnesstEligiblePay = Math.min(verified.grossPay, cnesstRemainingInsurable);
  const cnesstEr = cnesstEligiblePay * (verified.cnesstEmployerRate / 100);

  return {
    employeeId: verified.employeeId,
    qppTier1Ee: Number((qppTier1Ee || 0).toFixed(2)),
    qppTier1Er: Number((qppTier1Er || 0).toFixed(2)),
    qppTier2Ee: Number((qppTier2Ee || 0).toFixed(2)),
    qppTier2Er: Number((qppTier2Er || 0).toFixed(2)),
    qpipEe: Number((qpipEe || 0).toFixed(2)),
    qpipEr: Number((qpipEr || 0).toFixed(2)),
    hsfEr: Number((hsfEr || 0).toFixed(2)),
    cnesstEr: Number((cnesstEr || 0).toFixed(2)),
  };
}
