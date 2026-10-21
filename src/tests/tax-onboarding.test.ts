import { describe, it, expect } from 'vitest';
import { 
  calculateDynamicFedBPA, 
  hydrateTaxDefaults, 
  sanitizeTaxPayload,
  STATUTORY_2026 
} from '../services/taxEngine';

describe('Tax Onboarding Engine - 2026 Statutory Logic', () => {
  
  describe('calculateDynamicFedBPA', () => {
    it('should return MAX_BPA for income below the low threshold', () => {
      const bpa = calculateDynamicFedBPA(50000);
      expect(bpa).toBe(STATUTORY_2026.FED_MAX_BPA);
    });

    it('should return MAX_BPA exactly at the low threshold', () => {
      const bpa = calculateDynamicFedBPA(STATUTORY_2026.FED_THRESHOLD_LOW);
      expect(bpa).toBe(STATUTORY_2026.FED_MAX_BPA);
    });

    it('should return MIN_BPA for income above the high threshold', () => {
      const bpa = calculateDynamicFedBPA(300000);
      expect(bpa).toBe(STATUTORY_2026.FED_MIN_BPA);
    });

    it('should return MIN_BPA exactly at the high threshold', () => {
      const bpa = calculateDynamicFedBPA(STATUTORY_2026.FED_THRESHOLD_HIGH);
      expect(bpa).toBe(STATUTORY_2026.FED_MIN_BPA);
    });

    it('should calculate linear clawback for income between thresholds', () => {
      // Midpoint: (181440 + 258482) / 2 = 219961
      // Reduction should be half of (16452 - 14829) = 1623 / 2 = 811.5
      // Expected: 16452 - 811.5 = 15640.5
      const midpoint = (STATUTORY_2026.FED_THRESHOLD_LOW + STATUTORY_2026.FED_THRESHOLD_HIGH) / 2;
      const bpa = calculateDynamicFedBPA(midpoint);
      expect(bpa).toBe(15640.5);
    });
  });

  describe('sanitizeTaxPayload', () => {
    it('should convert empty strings and invalid values to undefined', () => {
      const raw = {
        fedTaxCreditAmount: '',
        fedAdditionalTax: 'invalid',
        provTaxCreditAmount: null,
        provAdditionalTax: '25.50'
      };
      const sanitized = sanitizeTaxPayload(raw);
      expect(sanitized.fedTaxCreditAmount).toBeUndefined();
      expect(sanitized.fedAdditionalTax).toBeUndefined();
      expect(sanitized.provTaxCreditAmount).toBeUndefined();
      expect(sanitized.provAdditionalTax).toBe(25.5);
    });

    it('should handle currency formatting like commas', () => {
      const raw = { fedTaxCreditAmount: '16,452.00' };
      const sanitized = sanitizeTaxPayload(raw);
      expect(sanitized.fedTaxCreditAmount).toBe(16452);
    });
  });

  describe('hydrateTaxDefaults', () => {
    it('should apply statutory defaults when fields are missing', () => {
      const sanitized = {
        fedTaxCreditAmount: undefined,
        fedAdditionalTax: undefined,
        provTaxCreditAmount: undefined,
        provAdditionalTax: undefined
      };
      const income = 50000;
      const hydrated = hydrateTaxDefaults(sanitized, income);

      expect(hydrated.fedTaxCreditAmount).toBe(STATUTORY_2026.FED_MAX_BPA);
      expect(hydrated.provTaxCreditAmount).toBe(STATUTORY_2026.QC_DEFAULT_BPA);
      expect(hydrated.isFedDefaultApplied).toBe(true);
      expect(hydrated.isProvDefaultApplied).toBe(true);
      expect(hydrated.isFedBPAClawbacked).toBe(false);
    });

    it('should respect user-provided values and mark defaults as not applied', () => {
      const sanitized = {
        fedTaxCreditAmount: 15000,
        fedAdditionalTax: 10,
        provTaxCreditAmount: 17000,
        provAdditionalTax: 5
      };
      const income = 50000;
      const hydrated = hydrateTaxDefaults(sanitized, income);

      expect(hydrated.fedTaxCreditAmount).toBe(15000);
      expect(hydrated.fedAdditionalTax).toBe(10);
      expect(hydrated.isFedDefaultApplied).toBe(false);
      expect(hydrated.isProvDefaultApplied).toBe(false);
    });

    it('should correctly flag BPA clawback for high income even if default is not applied', () => {
      const sanitized = { fedTaxCreditAmount: 14829 };
      const income = 300000;
      const hydrated = hydrateTaxDefaults(sanitized, income);

      expect(hydrated.isFedBPAClawbacked).toBe(true);
      expect(hydrated.systemCalculatedBPA).toBe(STATUTORY_2026.FED_MIN_BPA);
    });
  });
});
