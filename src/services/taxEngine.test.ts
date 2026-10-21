import { describe, test, expect } from 'vitest';
import { calculateDynamicFedBPA, hydrateTaxDefaults } from './taxEngine';
import { EmployeeOnboardingInput } from '../types/onboarding';

describe('2026 Statutory Canadian Tax Fallback Engine', () => {
  
  test('Should assign maximum standard base amount when income is lower tier', () => {
    const result = calculateDynamicFedBPA(75000);
    expect(result).toBe(16452);
  });

  test('Should apply absolute floor value when income is ultra high', () => {
    const result = calculateDynamicFedBPA(300000);
    expect(result).toBe(14829);
  });

  test('Should calculate mid-bracket reduction when income falls inside clawback zone', () => {
    const intermediateIncome = 220000; // Right between 181,440 and 258,482
    const result = calculateDynamicFedBPA(intermediateIncome);
    expect(result).toBeLessThan(16452);
    expect(result).toBeGreaterThan(14829);
  });

  test('Should respect explicit claims over statutory fallbacks', () => {
    const validatedMockInput: Partial<EmployeeOnboardingInput> = {
      fedTaxCreditAmount: 25000, // Employee has heavy custom tuition/dependant credits
      fedAdditionalTax: 50,
      provTaxCreditAmount: 18952,
      provAdditionalTax: 0,
      estimatedAnnualIncome: 500000 // High income but explicit form provided
    };
    
    const context = hydrateTaxDefaults(validatedMockInput as EmployeeOnboardingInput, validatedMockInput.estimatedAnnualIncome || 0);
    expect(context.fedTaxCreditAmount).toBe(25000); // Must ignore dynamic calculation block completely
  });
});
