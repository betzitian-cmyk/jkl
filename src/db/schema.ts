import { pgTable, text, timestamp, integer, numeric, boolean, pgEnum, json, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const planPostValidationEnum = pgEnum('plan_post_validation', ['single', 'family', 'couple', 'opt_out']);
export const docTypeEnum = pgEnum('doc_type', ['RAMQ_SPOUSAL_PROOF', 'GARNISHMENT_ORDER', 'OTHER']);

export const cnesstClassifications = pgTable('cnesst_classifications', {
  code: text('code').primaryKey(),
  description: text('description').notNull(),
  assessmentRate: numeric('assessment_rate').notNull().default('0.0000'),
  createdAt: timestamp('created_at').defaultNow()
});

export const qcDeductionCodes = pgTable('qc_deduction_codes', {
  code: text('code').primaryKey(),
  description: text('description').notNull(),
  baseDeductionAmount: numeric('base_deduction_amount').notNull().default('0.00')
});

export const qcPayrollTaxConstants = pgTable('qc_payroll_tax_constants', {
  taxYear: integer('tax_year').primaryKey(),
  qppBasicExemption: numeric('qpp_basic_exemption').notNull().default('3500.00'),
  qppMpe: numeric('qpp_mpe').notNull(),
  qppYampe: numeric('qpp_yampe').notNull(),
  qppTier1EeRate: numeric('qpp_tier1_ee_rate').notNull(),
  qppTier1ErRate: numeric('qpp_tier1_er_rate').notNull(),
  qppTier2EeRate: numeric('qpp_tier2_ee_rate').notNull(),
  qppTier2ErRate: numeric('qpp_tier2_er_rate').notNull(),
  qpipMie: numeric('qpip_mie').notNull(),
  qpipEeRate: numeric('qpip_ee_rate').notNull(),
  qpipErRate: numeric('qpip_er_rate').notNull(),
  cnesstMaxInsurable: numeric('cnesst_max_insurable').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  preferredName: text('preferred_name'),
  middleInitial: text('middle_initial'),
  sin: text('sin').notNull().unique(),
  dob: text('dob'),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  hireDate: text('hire_date').notNull(),
  paySchedule: text('pay_schedule').notNull(), // weekly, bi_weekly, semi_monthly, monthly
  payType: text('pay_type').notNull(), // hourly, salary, commission
  payRate: numeric('pay_rate').notNull(),
  vacationPolicy: text('vacation_policy').notNull().default('accrue_per_period'), // accrue_per_hour, accrue_per_period, pay_out
  status: text('status').notNull().default('pending_onboarding'), // pending_onboarding, active, suspended, terminated
  
  // Kept for backward compatibility
  startDate: text('start_date'),
  employmentType: text('employment_type'),
  department: text('department'),
  jobTitle: text('job_title'),
  baseSalary: numeric('base_salary'),
  frequency: text('frequency'),
  vacationRate: numeric('vacation_rate'),
  hourlyRate: numeric('hourly_rate'),
  onboardingStatus: text('onboarding_status'),

  // 2026 Statutory Tax Hydrated Values
  fedTaxCreditAmount: numeric('fed_tax_credit_amount', { precision: 12, scale: 2 }),
  fedAdditionalTax: numeric('fed_additional_tax', { precision: 12, scale: 2 }).notNull().default('0.00'),
  provTaxCreditAmount: numeric('prov_tax_credit_amount', { precision: 12, scale: 2 }),
  provAdditionalTax: numeric('prov_additional_tax', { precision: 12, scale: 2 }).notNull().default('0.00'),
  isFedBPAClawbacked: boolean('is_fed_bpa_clawbacked').notNull().default(false),
  isFedDefaultApplied: boolean('is_fed_default_applied').notNull().default(false),
  isProvDefaultApplied: boolean('is_prov_default_applied').notNull().default(false),
  systemCalculatedBPA: numeric('system_calculated_bpa', { precision: 12, scale: 2 }),

  // Part E: Group Insurance & Benefits Selection
  isCoveredBySpousePlan: boolean('is_covered_by_spouse_plan').notNull().default(false),
  spousePlanDetails: json('spouse_plan_details'), // JSON string
  selectedPlanPostValidation: planPostValidationEnum('selected_plan_post_validation'), // single, family, couple, opt_out
  validationCompletionDate: text('validation_completion_date'),

  // Part F: Statutory Garnishments
  hasActiveGarnishments: boolean('has_active_garnishments').notNull().default(false),
  garnishmentCategories: json('garnishment_categories'), // JSON string
  garnishmentDocProvided: boolean('garnishment_doc_provided').notNull().default(false),
  payrollLockFlag: text('payroll_lock_flag'),

  // Part G: Electronic Tax Form Consent
  electronicConsentT4Rl1: boolean('electronic_consent_t4_rl1').notNull().default(false),
  taxDeliveryEmail: text('tax_delivery_email'),
  taxConsentTimestamp: timestamp('tax_consent_timestamp'),

  // Part H: Background Check Consent
  backgroundCheckConsent: boolean('background_check_consent').default(true),

  // Avatar Picture & Thumbnail
  avatarUrl: text('avatar_url'),
  avatarThumbnailUrl: text('avatar_thumbnail_url'),

  // Permissions & Custom Metadata
  permissions: text('permissions'),
  garnishments: text('garnishments'),
  benefitContributions: text('benefit_contributions'),

  // Automated Onboarding & Invitation Lifecycle
  isFirstLogin: boolean('is_first_login').default(false),
  inviteToken: text('invite_token'),
  inviteTokenExpiresAt: text('invite_token_expires_at'),
  questionnaireId: text('questionnaire_id'),
  personalInfo: text('personal_info'),
  bankingInfo: text('banking_info'),
  taxParameters: text('tax_parameters'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const hireQuestionnaires = pgTable('hire_questionnaires', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').notNull().default('draft'), // 'draft' | 'submitted'
  createdAt: timestamp('created_at').defaultNow(),
  submittedAt: text('submitted_at'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  workEmail: text('work_email').notNull(),
  jobTitle: text('job_title').notNull(),
  departmentId: text('department_id'),
  employmentType: text('employment_type').notNull(),
  payFrequency: text('pay_frequency').notNull(),
  baseRate: numeric('base_rate').notNull(),
  personalEmail: text('personal_email'),
  phone: text('phone'),
  dateOfBirth: text('date_of_birth'),
  socialInsuranceNumber: text('social_insurance_number'),
  streetAddress: text('street_address'),
  city: text('city'),
  province: text('province'),
  postalCode: text('postal_code'),
  federalTD1ClaimAmount: numeric('federal_td1_claim_amount'),
  quebecTP1015ClaimAmount: numeric('quebec_tp1015_claim_amount'),
  additionalTaxDeductionPerPay: numeric('additional_tax_deduction_per_pay'),
  bill96LanguagePreference: text('bill96_language_preference').default('fr'),
  bankInstitutionNumber: text('bank_institution_number'),
  bankTransitNumber: text('bank_transit_number'),
  bankAccountNumber: text('bank_account_number'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactRelationship: text('emergency_contact_relationship'),
  emergencyContactPhone: text('emergency_contact_phone'),
});

export const onboardingDocuments = pgTable('onboarding_documents', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  docType: docTypeEnum('doc_type').notNull(), // 'RAMQ_SPOUSAL_PROOF', 'GARNISHMENT_ORDER', 'OTHER'
  originalName: text('original_name').notNull(),
  storedFilename: text('stored_filename').notNull(),
  filePath: text('file_path').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow(),
});

export const employeesRelations = relations(employees, ({ one, many }) => ({
  address: one(employeeAddresses, { fields: [employees.id], references: [employeeAddresses.employeeId] }),
  taxProfile: one(employeeTaxProfiles, { fields: [employees.id], references: [employeeTaxProfiles.employeeId] }),
  bankDetails: one(employeeBankDetails, { fields: [employees.id], references: [employeeBankDetails.employeeId] }),
}));

export const employeeAddresses = pgTable('employee_addresses', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id).notNull().unique(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  province: text('province').notNull().default('QC'),
  postalCode: text('postal_code').notNull(),
  mailingAddress: text('mailing_address'),
});

export const employeeTaxProfiles = pgTable('employee_tax_profiles', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id).notNull().unique(),
  federalBasicAmount: numeric('federal_basic_amount').notNull().default('15705.00'),
  federalAdditionalTax: numeric('federal_additional_tax').notNull().default('0.00'),
  eiExempt: boolean('ei_exempt').notNull().default(false),
  qppExempt: boolean('qpp_exempt').notNull().default(false),
  qcDeductionCode: text('qc_deduction_code').notNull().default('A'),
  qcAdditionalTax: numeric('qc_additional_tax').notNull().default('0.00'),
  annualDeductionTp1015: numeric('annual_deduction_tp1015').notNull().default('0.00'),
  qpipExempt: boolean('qpip_exempt').notNull().default(false),
  cnesstClassification: text('cnesst_classification'),
});

export const employeeBankDetails = pgTable('employee_bank_details', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id).notNull().unique(),
  paymentMethod: text('payment_method').notNull().default('direct_deposit'),
  transitNumber: text('transit_number'),
  institutionNumber: text('institution_number'),
  accountNumber: text('account_number'),
});

export const employeeTaxableBenefits = pgTable('employee_taxable_benefits', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id).notNull(),
  benefitType: text('benefit_type').notNull(), // motor_vehicle_standby, motor_vehicle_operating, group_health_insurance, group_life_insurance, board_and_lodging, parking, other
  estimatedAnnualValue: numeric('estimated_annual_value').notNull().default('0.00'),
  payPeriodAmount: numeric('pay_period_amount').notNull().default('0.00'),
  rl1BoxCode: text('rl1_box_code').notNull().default('A'), // A, G, I, J, K, L, P, V, W, G-1, 211, RO, RP
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const payrollRuns = pgTable('payroll_runs', {
  id: text('id').primaryKey(),
  payPeriodStart: text('pay_period_start').notNull(),
  payPeriodEnd: text('pay_period_end').notNull(),
  payDate: text('pay_date').notNull(),
  status: text('status').notNull().default('draft'), // draft, calculated, approved, paid
  createdAt: timestamp('created_at').defaultNow()
});

export const payStubLineItems = pgTable('pay_stub_line_items', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id).notNull(),
  payrollRunId: text('payroll_run_id').references(() => payrollRuns.id).notNull(),
  grossPay: numeric('gross_pay').notNull(),
  qppTier1Ee: numeric('qpp_tier1_ee').notNull().default('0.00'),
  qppTier1Er: numeric('qpp_tier1_er').notNull().default('0.00'),
  qppTier2Ee: numeric('qpp_tier2_ee').notNull().default('0.00'),
  qppTier2Er: numeric('qpp_tier2_er').notNull().default('0.00'),
  qpipEe: numeric('qpip_ee').notNull().default('0.00'),
  qpipEr: numeric('qpip_er').notNull().default('0.00'),
  qcIncomeTaxEe: numeric('qc_income_tax_ee').notNull().default('0.00'),
  fedIncomeTaxEe: numeric('fed_income_tax_ee').notNull().default('0.00'),
  hsfEmployerTax: numeric('hsf_employer_tax').notNull().default('0.00'),
  cnesstEmployerPremium: numeric('cnesst_employer_premium').notNull().default('0.00'),
  createdAt: timestamp('created_at').defaultNow()
});

export const onboardingAuditLogs = pgTable('onboarding_audit_logs', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id).notNull(),
  action: text('action').notNull(),
  details: text('details'),
  performedBy: text('performed_by').default('SYSTEM'),
  createdAt: timestamp('created_at').defaultNow()
});

export const payStubs = pgTable('pay_stubs', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id).notNull(),
  employeeName: text('employee_name').notNull(),
  date: text('date').notNull(),
  payPeriod: text('pay_period').notNull(),
  
  grossPay: numeric('gross_pay').notNull(),
  netPay: numeric('net_pay').notNull(),
  totalDeductions: numeric('total_deductions').notNull(),
  federalTax: numeric('federal_tax').notNull(),
  quebecTax: numeric('quebec_tax').notNull(),
  qpp: numeric('qpp').notNull(),
  qpip: numeric('qpip').notNull(),
  ei: numeric('ei').notNull(),
  hsf: numeric('hsf').notNull(),
  labourStandards: numeric('labour_standards').notNull(),
  employerQPP: numeric('employer_qpp').notNull(),
  employerQPIP: numeric('employer_qpip').notNull(),
  employerEI: numeric('employer_ei').notNull(),
  totalEmployerCost: numeric('total_employer_cost').notNull(),
  
  vacationPay: numeric('vacation_pay'),
  overtimePay: numeric('overtime_pay'),
  bonusPay: numeric('bonus_pay'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

export const businessExpenses = pgTable('business_expenses', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount').notNull(),
  deductibleAmount: numeric('deductible_amount').notNull(),
  receiptUrl: text('receipt_url'),
  notes: text('notes'),

  // Submitter / Employee Identity
  employeeId: text('employee_id'),
  employeeName: text('employee_name'),
  employeeEmail: text('employee_email'),

  // Source Provenance
  source: text('source').default('manual'), // 'invoice_audit' | 'gps_triplog' | 'manual'
  sourceId: text('source_id'),
  sourceLineId: text('source_line_id'),
  taxBreakdown: text('tax_breakdown'),

  // Approval & Reimbursement Workflow
  status: text('status').default('pending_approval'), // 'pending_approval' | 'approved' | 'rejected' | 'reimbursed'
  approvedAt: timestamp('approved_at'),
  approvedBy: text('approved_by'),
  approvalReason: text('approval_reason'),
  reimbursedAt: timestamp('reimbursed_at'),
  reimbursedBy: text('reimbursed_by'),
  reimbursementMethod: text('reimbursement_method'),
  reimbursementRef: text('reimbursement_ref'),
  rejectionReason: text('rejection_reason'),
  
  createdAt: timestamp('created_at').defaultNow(),
});

export const taxableBenefits = pgTable('taxable_benefits', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id'),
  employeeName: text('employee_name'),
  date: text('date').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  totalAmount: numeric('total_amount').notNull(),
  taxableAmount: numeric('taxable_amount').notNull(),
  nonTaxableAmount: numeric('non_taxable_amount').notNull(),
  rl1Box: text('rl1_box').notNull(),
  t4Box: text('t4_box').notNull(),
  subjectToQpp: boolean('subject_to_qpp').default(true),
  subjectToQpip: boolean('subject_to_qpip').default(false),
  subjectToEi: boolean('subject_to_ei').default(false),
  subjectToTax: boolean('subject_to_tax').default(true),
  calculationDetails: text('calculation_details'), // JSON string
  
  createdAt: timestamp('created_at').defaultNow(),
});

export const companySettings = pgTable('company_settings', {
  id: text('id').primaryKey(), // We'll just use 'global'
  companyName: text('company_name').notNull(),
  tradeName: text('trade_name'),
  address: text('address'),
  city: text('city'),
  province: text('province').default('QC'),
  postalCode: text('postal_code'),
  phone: text('phone'),
  email: text('email'),
  
  // Statutory Numbers (PDF Section 2)
  federalId: text('federal_id'), // Federal Business Number (BN): 9 digits + RP + 4 digits e.g. 123456789RP0001
  neq: text('neq'), // Quebec Enterprise Number (NEQ): 10 digits
  revenuQuebecId: text('revenu_quebec_id'), // Revenu Québec No d'identification: 10 digits + RS + 4 digits e.g. 1234567890RS0001
  cnesstNumber: text('cnesst_number'), // CNESST Account ID
  
  // Statutory Employer Contributions & Fringe Taxes (PDF Section 4)
  hsfRateModifier: numeric('hsf_rate_modifier').default('1.65'), // Health Services Fund rate %
  hsfSector: text('hsf_sector').default('services_other'), // 'primary_manufacturing' | 'services_other' | 'large_enterprise'
  cnesstRate: numeric('cnesst_rate').default('1.85'), // CNESST Combined Worker Safety & Standards rate %
  cnesstRiskCode: text('cnesst_risk_code').default('69990'), // Risk sector classification code
  wsdrfApplicable: boolean('wsdrf_applicable').default(false), // WSDRF / FDRCMT 1% training fund tracking (> $2M CAD)
  estimatedAnnualPayroll: numeric('estimated_annual_payroll').default('750000'),
  
  // CPA Standard 005 Direct Deposit Configuration (PDF Section 5)
  cpaOriginatorId: text('cpa_originator_id'), // 10-digit CPA Originator ID
  cpaDataCenter: text('cpa_data_center').default('00100'), // 5-digit data center
  cpaFormat: text('cpa_format').default('1464_byte'), // '1464_byte' | '80_byte'
  disbursingBankName: text('disbursing_bank_name'),
  disbursingInstitution: text('disbursing_institution'), // 3 digits
  disbursingTransit: text('disbursing_transit'), // 5 digits
  disbursingAccount: text('disbursing_account'),
  
  // Record of Employment (ROE) API (PDF Section 5)
  roeContactName: text('roe_contact_name'),
  roeContactPhone: text('roe_contact_phone'),
  roeContactEmail: text('roe_contact_email'),
  roeWebApiKey: text('roe_web_api_key'),
  
  defaultFrequency: text('default_frequency').default('bi-weekly'),
  defaultProvince: text('default_province').default('QC'),
  language: text('language').default('fr'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// APPLECHAI INVOICE AUDITOR TABLES (PostgreSQL Migration)
// ============================================================================

export const invUsers = pgTable('inv_users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  passwordHash: text('password_hash'),
  avatarUrl: text('avatar_url'),
  googleId: text('google_id'),
  provider: text('provider').default('email'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const invVendors = pgTable('inv_vendors', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  name: text('name'),
  address: text('address'),
  businessNumber: text('business_number'),
  gstHstNumber: text('gst_hst_number'),
  qstNumber: text('qst_number'),
  pstNumber: text('pst_number'),
  rstNumber: text('rst_number'),
  businessType: text('business_type'),
  mainProduct: text('main_product'),
  productExamples: text('product_examples'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const invCustomers = pgTable('inv_customers', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  name: text('name'),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const invInvoices = pgTable('inv_invoices', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  vendorId: integer('vendor_id').references(() => invVendors.id, { onDelete: 'set null' }),
  customerId: integer('customer_id').references(() => invCustomers.id, { onDelete: 'set null' }),
  invoiceNumber: text('invoice_number'),
  poNumber: text('po_number'),
  invoiceDate: text('invoice_date'),
  dueDate: text('due_date'),
  language: text('language'),
  currency: text('currency'),
  paymentTerms: text('payment_terms'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).default('0.00'),
  zeroRatedSubtotal: numeric('zero_rated_subtotal', { precision: 12, scale: 2 }).default('0.00'),
  exemptSubtotal: numeric('exempt_subtotal', { precision: 12, scale: 2 }).default('0.00'),
  shipping: numeric('shipping', { precision: 12, scale: 2 }).default('0.00'),
  freight: numeric('freight', { precision: 12, scale: 2 }).default('0.00'),
  delivery: numeric('delivery', { precision: 12, scale: 2 }).default('0.00'),
  handling: numeric('handling', { precision: 12, scale: 2 }).default('0.00'),
  recycleFee: numeric('recycle_fee', { precision: 12, scale: 2 }).default('0.00'),
  fuelSurcharge: numeric('fuel_surcharge', { precision: 12, scale: 2 }).default('0.00'),
  surcharge: numeric('surcharge', { precision: 12, scale: 2 }).default('0.00'),
  deposit: numeric('deposit', { precision: 12, scale: 2 }).default('0.00'),
  containerFee: numeric('container_fee', { precision: 12, scale: 2 }).default('0.00'),
  environmentalFee: numeric('environmental_fee', { precision: 12, scale: 2 }).default('0.00'),
  serviceFee: numeric('service_fee', { precision: 12, scale: 2 }).default('0.00'),
  taxTotal: numeric('tax_total', { precision: 12, scale: 2 }).default('0.00'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).default('0.00'),
  taxGst: numeric('tax_gst', { precision: 12, scale: 2 }).default('0.00'),
  taxPst: numeric('tax_pst', { precision: 12, scale: 2 }).default('0.00'),
  taxHst: numeric('tax_hst', { precision: 12, scale: 2 }).default('0.00'),
  taxQst: numeric('tax_qst', { precision: 12, scale: 2 }).default('0.00'),
  taxRst: numeric('tax_rst', { precision: 12, scale: 2 }).default('0.00'),
  province: text('province'),
  taxGroup: text('tax_group'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const invInvoiceItems = pgTable('inv_invoice_items', {
  id: serial('id').primaryKey(),
  userId: text('user_id'),
  invoiceId: integer('invoice_id').references(() => invInvoices.id, { onDelete: 'cascade' }),
  description: text('description'),
  quantity: numeric('quantity', { precision: 12, scale: 3 }).default('1.000'),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).default('0.00'),
  amount: numeric('amount', { precision: 12, scale: 2 }).default('0.00'),
  tax: numeric('tax', { precision: 12, scale: 2 }).default('0.00'),
  taxRate: numeric('tax_rate', { precision: 6, scale: 4 }).default('0.0000'),
  isTaxExempt: boolean('is_tax_exempt').default(false),
  taxabilityGroup: text('taxability_group'),
  taxGst: numeric('tax_gst', { precision: 12, scale: 2 }).default('0.00'),
  taxPst: numeric('tax_pst', { precision: 12, scale: 2 }).default('0.00'),
  taxHst: numeric('tax_hst', { precision: 12, scale: 2 }).default('0.00'),
  taxQst: numeric('tax_qst', { precision: 12, scale: 2 }).default('0.00'),
  taxRst: numeric('tax_rst', { precision: 12, scale: 2 }).default('0.00'),
  category: text('category'),
  categoryReason: text('category_reason'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// TRIPLE-GPS (GANTAVYA GPS SPEEDOMETER) TABLES (PostgreSQL Migration)
// ============================================================================

export const gpsUsers = pgTable('gps_users', {
  id: serial('id').primaryKey(),
  username: text('username'),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const gpsTrips = pgTable('gps_trips', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => gpsUsers.id, { onDelete: 'cascade' }).notNull(),
  localId: text('local_id').unique(),
  date: timestamp('date').defaultNow(),
  duration: integer('duration'),
  distance: numeric('distance', { precision: 12, scale: 3 }),
  maxSpeed: numeric('max_speed', { precision: 8, scale: 2 }),
  avgSpeed: numeric('avg_speed', { precision: 8, scale: 2 }),
  calories: numeric('calories', { precision: 8, scale: 2 }),
  score: integer('score'),
  overspeedSeconds: integer('overspeed_seconds').default(0),
  status: text('status').default('recorded'),
  expenseId: text('expense_id'),
  route: json('route'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const gpsUsersRelations = relations(gpsUsers, ({ many }) => ({
  trips: many(gpsTrips),
}));

export const gpsTripsRelations = relations(gpsTrips, ({ one }) => ({
  user: one(gpsUsers, {
    fields: [gpsTrips.userId],
    references: [gpsUsers.id],
  }),
}));

export const calculationLogs = pgTable('calculation_logs', {
  id: text('id').primaryKey(),
  inputPayload: text('input_payload'),
  intermediateValues: text('intermediate_values'),
  timestamp: timestamp('timestamp').defaultNow(),
  processedBy: text('processed_by'),
});

export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  source: text('source'),
  sourceId: text('source_id'),
  sourceLineId: text('source_line_id'),
  calculationLogId: text('calculation_log_id'),
  idempotencyKey: text('idempotency_key').unique(),
  amount: numeric('amount', { precision: 12, scale: 2 }),
  currency: text('currency').default('CAD'),
  status: text('status').default('pending_approval'),
  description: text('description'),
  userId: text('user_id'),
  companyId: text('company_id'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// TIME, TIMESHEET, LEAVE & ABSENCE TABLES (PostgreSQL / Drizzle ORM)
// ============================================================================

export const timeEntries = pgTable('time_entries', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  date: text('date').notNull(),
  hours: numeric('hours', { precision: 6, scale: 2 }).notNull().default('8.00'),
  entryType: text('entry_type').notNull().default('regular'), // regular, overtime, double_time, on_call, statutory_holiday
  projectTask: text('project_task'),
  billable: boolean('billable').default(true),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }),
  status: text('status').default('submitted'), // draft, submitted, approved, rejected, applied_to_payroll
  payrollStubId: text('payroll_stub_id'),
  notes: text('notes'),
  submittedAt: timestamp('submitted_at').defaultNow(),
  approvedAt: timestamp('approved_at'),
  approvedBy: text('approved_by'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const leaveRequests = pgTable('leave_requests', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  employeeName: text('employee_name').notNull(),
  leaveType: text('leave_type').notNull(), // vacation (congé annuel), sick (maladie), personal (obligations familiales), statutory_holiday (férié chômé), bereavement (deuil), parental (parental/maternité), unpaid (sans solde)
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  totalDays: numeric('total_days', { precision: 6, scale: 2 }).notNull().default('1.00'),
  totalHours: numeric('total_hours', { precision: 6, scale: 2 }).notNull().default('8.00'),
  isPaid: boolean('is_paid').default(true),
  reason: text('reason'),
  status: text('status').notNull().default('pending'), // pending, approved, rejected, cancelled
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  rejectionReason: text('rejection_reason'),
  appliedToPayroll: boolean('applied_to_payroll').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()),
});

export const employeeLeaveBalances = pgTable('employee_leave_balances', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull().unique(),
  fiscalYear: integer('fiscal_year').notNull().default(2026),
  vacationTotalDays: numeric('vacation_total_days', { precision: 6, scale: 2 }).default('15.00'),
  vacationUsedDays: numeric('vacation_used_days', { precision: 6, scale: 2 }).default('0.00'),
  sickTotalDays: numeric('sick_total_days', { precision: 6, scale: 2 }).default('10.00'),
  sickUsedDays: numeric('sick_used_days', { precision: 6, scale: 2 }).default('0.00'),
  personalTotalDays: numeric('personal_total_days', { precision: 6, scale: 2 }).default('3.00'),
  personalUsedDays: numeric('personal_used_days', { precision: 6, scale: 2 }).default('0.00'),
  rttCompensatoryHours: numeric('rtt_compensatory_hours', { precision: 6, scale: 2 }).default('0.00'),
  updatedAt: timestamp('updated_at').defaultNow(),
});


