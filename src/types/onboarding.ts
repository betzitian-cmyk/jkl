import { z } from 'zod';

export const GarnishmentCategoryEnum = z.enum([
  'child_support',
  'alimony',
  'back_taxes',
  'civil_judgment'
]);

export const SelectedPlanEnum = z.enum([
  'single',
  'family',
  'couple',
  'opt_out'
]);

export const SpousePlanDetailsSchema = z.object({
  includes_health: z.boolean().default(false),
  includes_dental: z.boolean().default(false),
  plan_type: z.enum(['family', 'single', 'couple']).optional()
});

export const EmployeeOnboardingSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  preferredName: z.string().optional().or(z.literal('')),
  middleInitial: z.string().optional().or(z.literal('')),
  sin: z.string().regex(/^\d{3}-\d{3}-\d{3}$/, "SIN must match XXX-XXX-XXX format (e.g. 123-456-789)"),
  dob: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  email: z.string().email("Valid email address is required"),
  phone: z.string().optional().or(z.literal('')),
  
  // Address Information
  address: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  mailingAddress: z.string().optional().or(z.literal('')),

  // Direct Deposit / Bank Details
  bankName: z.string().optional().or(z.literal('')),
  accountNumber: z.string().optional().or(z.literal('')),
  transitNumber: z.string().optional().or(z.literal('')),
  institutionNumber: z.string().optional().or(z.literal('')),

  payPeriodsPerYear: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 26 : Number(val)),
    z.union([z.literal(52), z.literal(26), z.literal(24), z.literal(12)])
  ).default(26),
  estimatedAnnualIncome: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 75000 : Number(val)),
    z.number().min(0, "Estimated income must be positive")
  ).default(75000),

  // TD1 / T1213 / TP-1015.3-V / TP-1016-V Tax Amounts (Optional inputs for hydration engine)
  fedTaxCreditAmount: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || isNaN(Number(val)) ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  fedAdditionalTax: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || isNaN(Number(val)) ? 0 : Number(val)),
    z.number().min(0).default(0)
  ),
  fedTaxReductionAmount: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || isNaN(Number(val)) ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  provTaxCreditAmount: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || isNaN(Number(val)) ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  provAdditionalTax: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || isNaN(Number(val)) ? 0 : Number(val)),
    z.number().min(0).default(0)
  ),
  provTaxReductionAmount: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || isNaN(Number(val)) ? undefined : Number(val)),
    z.number().min(0).optional()
  ),
  provTaxReductionCredits: z.preprocess(
    (val) => (val === "" || val === undefined || val === null || isNaN(Number(val)) ? undefined : Number(val)),
    z.number().min(0).optional()
  ),

  // Part E: Group Insurance
  group_insurance: z.object({
    is_covered_by_spouse_plan: z.boolean().default(false),
    spouse_plan_details: SpousePlanDetailsSchema.optional(),
    selected_plan_post_validation: SelectedPlanEnum.default('single'),
    validation_completion_date: z.string().optional()
  }).default({
    is_covered_by_spouse_plan: false,
    selected_plan_post_validation: 'single'
  }),

  // Part F: Statutory Garnishments
  garnishments: z.object({
    has_active_garnishments: z.boolean().default(false),
    categories: z.array(GarnishmentCategoryEnum).default([]),
    documentation_provided: z.boolean().default(false),
    payroll_flag: z.string().optional()
  }).default({
    has_active_garnishments: false,
    categories: [],
    documentation_provided: false
  }),

  // Part G: Electronic Tax Form Consent
  tax_distribution: z.object({
    electronic_consent_t4_rl1: z.boolean().default(true),
    delivery_email: z.string().email("Invalid email format").optional().or(z.literal('')),
    consent_timestamp: z.string().optional()
  }).default({
    electronic_consent_t4_rl1: true,
    delivery_email: ''
  }),

  // Part H: Background Check Consent
  background_check: z.object({
    consent_criminal_record: z.boolean().default(false)
  }).default({
    consent_criminal_record: false
  }),

  // Avatar Picture & Thumbnail URLs
  avatarUrl: z.string().optional(),
  avatarThumbnailUrl: z.string().optional()
}).superRefine((data, ctx) => {
  const birthDate = data.dob || data.dateOfBirth;
  if (!birthDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Date of birth is required.",
      path: ["dob"]
    });
  }

  // Compliance Check 1: Delivery email required if electronic consent given
  if (data.tax_distribution?.electronic_consent_t4_rl1 && !data.tax_distribution?.delivery_email && !data.email) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Delivery email is mandatory when electronic tax form delivery is selected.",
      path: ["tax_distribution", "delivery_email"]
    });
  }

  // Compliance Check 2: Garnishment categories mandatory if active garnishments checked
  if (data.garnishments?.has_active_garnishments && data.garnishments?.categories?.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least one garnishment category must be selected if active garnishments exist.",
      path: ["garnishments", "categories"]
    });
  }
});

export type EmployeeOnboardingInput = z.infer<typeof EmployeeOnboardingSchema>;

export interface HydratedTaxRecord {
  fedTaxCreditAmount: number;
  fedAdditionalTax: number;
  fedTaxReductionAmount?: number;
  provTaxCreditAmount: number;
  provAdditionalTax: number;
  provTaxReductionAmount?: number;
  provTaxReductionCredits?: number;
  isFedBPAClawbacked: boolean;
}
