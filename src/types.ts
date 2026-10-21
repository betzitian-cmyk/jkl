/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PayFrequency = 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly' | 'annually';
export type EmploymentType = 'full-time' | 'part-time' | 'contract';
export type GarnishmentCategory = 'family_support' | 'tax_arrears' | 'civil_judgment';

export interface Garnishment {
  id: string;
  category: GarnishmentCategory;
  amount: number;
  totalDebt?: number;
  monthlyLimit?: number;
  remainingPeriods?: number;
  description?: string;
}

export type PermissionKey =
  // Domain 1: System Administration & Platform Security
  | 'SYS_ADMIN_DASHBOARD_ACCESS'
  | 'SYS_EMPLOYEE_PORTAL_ACCESS'
  | 'SYS_EMP_SELF_SERVICE_ACCESS'
  | 'SYS_ENV_API_KEYS_MANAGE'
  | 'SYS_MANAGE_ENV_API_KEYS'
  | 'SYS_DB_CONSOLE_ACCESS'
  | 'SYS_ACCESS_DATABASE_CONSOLE'
  | 'SYS_AUDIT_LOGS_VIEW'
  | 'SYS_VIEW_DIAGNOSTICS_LOGS'
  | 'SYS_ROLE_PREVIEW_TOGGLE'
  | 'SYS_TOGGLE_ROLE_PREVIEW'
  | 'SYS_COMPANY_SETTINGS_MANAGE'
  | 'SYS_CONFIGURE_COMPANY_SETTINGS'
  | 'SYS_BILL96_LANG_MANAGE'
  | 'SYS_MANAGE_BILL96_COMPLIANCE'

  // Domain 2: Employee Profile & Scope Control
  | 'EMP_PROFILES_MANAGE_ALL'
  | 'EMP_MANAGE_ALL_PROFILES'
  | 'EMP_ROLES_ASSIGN_MODIFY'
  | 'EMP_ASSIGN_ROLES_PERMISSIONS'
  | 'EMP_OVERRIDE_CONTEXT_SELECT'
  | 'EMP_DIRECT_REPORTS_VIEW'
  | 'EMP_VIEW_DIRECT_REPORTS_BASIC'
  | 'EMP_PII_SENSITIVE_VIEW'
  | 'EMP_VIEW_SENSITIVE_PII'
  | 'EMP_PROFILE_OWN_VIEW'
  | 'EMP_VIEW_OWN_PROFILE'
  | 'EMP_PROFILE_OWN_EDIT'
  | 'EMP_EDIT_OWN_PROFILE'
  | 'EMP_DOC_CONSENTS_MANAGE'
  | 'EMP_MANAGE_COMPLIANCE_CONSENTS'

  // Domain 3: Payroll, Compensation & Direct Deposit
  | 'PAY_RUN_EXECUTE_GLOBAL'
  | 'PAY_EXECUTE_GLOBAL_RUNS'
  | 'PAY_RATES_MANAGE_ALL'
  | 'PAY_SET_MODIFY_ALL_COMPENSATION'
  | 'PAY_RATES_DIRECT_REPORTS_VIEW'
  | 'PAY_VIEW_DIRECT_REPORTS_COMPENSATION'
  | 'PAY_RATES_OWN_VIEW'
  | 'PAY_VIEW_OWN_COMPENSATION_HISTORY'
  | 'PAY_COMMISSION_PARAMS_CONFIG'
  | 'PAY_CONFIGURE_COMMISSION_PARAMS'
  | 'PAY_BANK_DETAILS_MANAGE_ALL'
  | 'PAY_MANAGE_GLOBAL_BANKING'
  | 'PAY_CPA_005_EFT_GENERATE'
  | 'PAY_GENERATE_CPA005_EFT'
  | 'PAY_BANK_DETAILS_OWN_EDIT'
  | 'PAY_EDIT_OWN_DIRECT_DEPOSIT'
  | 'PAY_STUBS_VIEW_ALL'
  | 'PAY_VIEW_ALL_HISTORICAL_STUBS'
  | 'PAY_STUBS_OWN_VIEW_DOWNLOAD'
  | 'PAY_VIEW_DOWNLOAD_OWN_STUBS'
  | 'PAY_STUBS_REVERSE_DELETE'
  | 'PAY_DELETE_REVERSE_STUBS'

  // Domain 4: Tax Compliance, Remittances & Statutory Filings
  | 'TAX_PARAMS_MANAGE_GLOBAL'
  | 'TAX_CONFIGURE_FEDERAL_PROVINCIAL_PARAMS'
  | 'TAX_EXEMPTIONS_TOGGLE'
  | 'TAX_CONFIGURE_EXEMPTION_FLAGS'
  | 'TAX_SOURCE_REDUCTIONS_APPLY'
  | 'TAX_APPLY_SOURCE_REDUCTIONS'
  | 'TAX_GARNISHMENTS_MANAGE'
  | 'TAX_CONFIGURE_GARNISHMENTS'
  | 'TAX_PRE_POST_DEDUCTIONS_CONFIG'
  | 'TAX_CONFIGURE_PRE_POST_DEDUCTIONS'
  | 'TAX_EMPLOYER_LIABILITIES_CALC'
  | 'TAX_CALCULATE_EMPLOYER_CONTRIBUTIONS'
  | 'TAX_REMITTANCE_REPORTS_GEN'
  | 'TAX_GENERATE_MONTHLY_REMITTANCES'
  | 'TAX_SLIPS_ANNUAL_GENERATE'
  | 'TAX_GENERATE_ANNUAL_SLIPS_T4_RL1'
  | 'TAX_ROE_GENERATE_SUBMIT'
  | 'TAX_GENERATE_ROE'
  | 'TAX_WSDRF_1PERCENT_TRACK'
  | 'TAX_TRACK_WSDRF_TRAINING'
  | 'TAX_SLIPS_OWN_VIEW_DOWNLOAD'
  | 'TAX_VIEW_OWN_DECLARATIONS_SLIPS'

  // Domain 5: Expense Management & Reimbursements
  | 'EXP_GLOBAL_APPROVE_REJECT'
  | 'EXP_APPROVE_REIMBURSE_REJECT_GLOBAL'
  | 'EXP_GLOBAL_MANAGE_ALL'
  | 'EXP_MANAGE_GLOBAL_EXPENSES'
  | 'EXP_TAX_CREDIT_AUTO_EXTRACT'
  | 'EXP_AUTOMATE_TAX_CREDIT_EXTRACTION'
  | 'EXP_OWN_SUBMIT_CREATE'
  | 'EXP_SUBMIT_OWN_CLAIMS'
  | 'EXP_OWN_VIEW_EDIT_DELETE'
  | 'EXP_MANAGE_OWN_PENDING_CLAIMS'

  // Domain 6: Timesheet, Attendance & Leave Management
  | 'TIME_GLOBAL_MANAGE_ALL'
  | 'TIME_MANAGE_GLOBAL_TIMESHEETS'
  | 'LEAVE_GLOBAL_APPROVE_REJECT'
  | 'TIME_APPROVE_REJECT_GLOBAL_LEAVE'
  | 'LEAVE_APPROVED_CALENDAR_VIEW'
  | 'TIME_VIEW_ALL_APPROVED_ABSENCES'
  | 'TIME_HOLIDAYS_LEAVE_BALANCES_MANAGE'
  | 'TIME_MANAGE_HOLIDAYS_LEAVE_BALANCES'
  | 'TIME_OWN_LOG_SUBMIT'
  | 'TIME_LOG_SUBMIT_OWN_HOURS'
  | 'LEAVE_OWN_MANAGE_SUBMIT'
  | 'TIME_MANAGE_OWN_LEAVE_REQUESTS'

  // Domain 7: Specialized AI, OCR & Mobile Tracking Tools
  | 'AI_GLOBAL_DOC_PROCESS'
  | 'TOOL_PROCESS_GLOBAL_DOCS_AI'
  | 'AI_TAX_REG_VERIFY'
  | 'TOOL_VERIFY_TAX_REGISTRATION_NUMBERS'
  | 'APP_INV_AUDIT_OWN_SUBMIT'
  | 'TOOL_SUBMIT_OWN_INVOICE_AUDIT_EXPENSES'
  | 'APP_GPS_TRIP_OWN_SUBMIT'
  | 'TOOL_SUBMIT_OWN_GPS_TRIPS'
  | 'GPS_TRIP_LOGS_MANAGE_ALL'
  | 'TOOL_MANAGE_GLOBAL_GPS_TRIP_LOGS'

  // Domain 8: Corporate Distributions & Shareholder Equity
  | 'CORP_DIVIDENDS_MANAGE'
  | 'CORP_MANAGE_DISTRIBUTIONS_DIVIDENDS'
  | 'CORP_TAX_SLIPS_T5_RL3_GEN'
  | 'CORP_GENERATE_SHAREHOLDER_SLIPS_T5_RL3'
  | 'CORP_OWNER_CAPITAL_DRAWS_TRACK'
  | 'CORP_TRACK_OWNER_CAPITAL_DRAWS';

export type PermissionDomain =
  | 'system_admin'
  | 'employee_scope'
  | 'payroll_compensation'
  | 'tax_compliance'
  | 'expense_management'
  | 'time_leave'
  | 'ai_ocr_gps'
  | 'corporate_governance';

export type UserPermissions = Record<PermissionKey, boolean>;
export type PermissionsMap = UserPermissions;

export const ALL_PERMISSION_KEYS: PermissionKey[] = [
  'SYS_ADMIN_DASHBOARD_ACCESS',
  'SYS_EMP_SELF_SERVICE_ACCESS',
  'SYS_MANAGE_ENV_API_KEYS',
  'SYS_ACCESS_DATABASE_CONSOLE',
  'SYS_VIEW_DIAGNOSTICS_LOGS',
  'SYS_TOGGLE_ROLE_PREVIEW',
  'SYS_CONFIGURE_COMPANY_SETTINGS',
  'SYS_MANAGE_BILL96_COMPLIANCE',

  'EMP_MANAGE_ALL_PROFILES',
  'EMP_ASSIGN_ROLES_PERMISSIONS',
  'EMP_OVERRIDE_CONTEXT_SELECT',
  'EMP_VIEW_DIRECT_REPORTS_BASIC',
  'EMP_VIEW_SENSITIVE_PII',
  'EMP_VIEW_OWN_PROFILE',
  'EMP_EDIT_OWN_PROFILE',
  'EMP_MANAGE_COMPLIANCE_CONSENTS',

  'PAY_EXECUTE_GLOBAL_RUNS',
  'PAY_SET_MODIFY_ALL_COMPENSATION',
  'PAY_VIEW_DIRECT_REPORTS_COMPENSATION',
  'PAY_VIEW_OWN_COMPENSATION_HISTORY',
  'PAY_CONFIGURE_COMMISSION_PARAMS',
  'PAY_MANAGE_GLOBAL_BANKING',
  'PAY_GENERATE_CPA005_EFT',
  'PAY_EDIT_OWN_DIRECT_DEPOSIT',
  'PAY_VIEW_ALL_HISTORICAL_STUBS',
  'PAY_VIEW_DOWNLOAD_OWN_STUBS',
  'PAY_DELETE_REVERSE_STUBS',

  'TAX_CONFIGURE_FEDERAL_PROVINCIAL_PARAMS',
  'TAX_CONFIGURE_EXEMPTION_FLAGS',
  'TAX_APPLY_SOURCE_REDUCTIONS',
  'TAX_CONFIGURE_GARNISHMENTS',
  'TAX_CONFIGURE_PRE_POST_DEDUCTIONS',
  'TAX_CALCULATE_EMPLOYER_CONTRIBUTIONS',
  'TAX_GENERATE_MONTHLY_REMITTANCES',
  'TAX_GENERATE_ANNUAL_SLIPS_T4_RL1',
  'TAX_GENERATE_ROE',
  'TAX_TRACK_WSDRF_TRAINING',
  'TAX_VIEW_OWN_DECLARATIONS_SLIPS',

  'EXP_APPROVE_REIMBURSE_REJECT_GLOBAL',
  'EXP_MANAGE_GLOBAL_EXPENSES',
  'EXP_AUTOMATE_TAX_CREDIT_EXTRACTION',
  'EXP_SUBMIT_OWN_CLAIMS',
  'EXP_MANAGE_OWN_PENDING_CLAIMS',

  'TIME_MANAGE_GLOBAL_TIMESHEETS',
  'TIME_APPROVE_REJECT_GLOBAL_LEAVE',
  'TIME_VIEW_ALL_APPROVED_ABSENCES',
  'TIME_MANAGE_HOLIDAYS_LEAVE_BALANCES',
  'TIME_LOG_SUBMIT_OWN_HOURS',
  'TIME_MANAGE_OWN_LEAVE_REQUESTS',

  'TOOL_PROCESS_GLOBAL_DOCS_AI',
  'TOOL_VERIFY_TAX_REGISTRATION_NUMBERS',
  'TOOL_SUBMIT_OWN_INVOICE_AUDIT_EXPENSES',
  'TOOL_SUBMIT_OWN_GPS_TRIPS',
  'TOOL_MANAGE_GLOBAL_GPS_TRIP_LOGS',

  'CORP_MANAGE_DISTRIBUTIONS_DIVIDENDS',
  'CORP_GENERATE_SHAREHOLDER_SLIPS_T5_RL3',
  'CORP_TRACK_OWNER_CAPITAL_DRAWS',
];

export const DEFAULT_ADMIN_PERMISSIONS: PermissionsMap = ALL_PERMISSION_KEYS.reduce((acc, key) => {
  acc[key] = true;
  return acc;
}, {} as PermissionsMap);

export const DEFAULT_MANAGER_PERMISSIONS: PermissionsMap = {
  ...DEFAULT_ADMIN_PERMISSIONS,
  SYS_MANAGE_ENV_API_KEYS: false,
  SYS_ACCESS_DATABASE_CONSOLE: false,
  PAY_DELETE_REVERSE_STUBS: false,
  CORP_MANAGE_DISTRIBUTIONS_DIVIDENDS: false,
  CORP_GENERATE_SHAREHOLDER_SLIPS_T5_RL3: false,
  CORP_TRACK_OWNER_CAPITAL_DRAWS: false,
};

export const DEFAULT_EMPLOYEE_PERMISSIONS: PermissionsMap = ALL_PERMISSION_KEYS.reduce((acc, key) => {
  const isSelfService =
    key === 'SYS_EMP_SELF_SERVICE_ACCESS' ||
    key === 'EMP_VIEW_OWN_PROFILE' ||
    key === 'EMP_EDIT_OWN_PROFILE' ||
    key === 'PAY_VIEW_OWN_COMPENSATION_HISTORY' ||
    key === 'PAY_EDIT_OWN_DIRECT_DEPOSIT' ||
    key === 'PAY_VIEW_DOWNLOAD_OWN_STUBS' ||
    key === 'TAX_VIEW_OWN_DECLARATIONS_SLIPS' ||
    key === 'EXP_SUBMIT_OWN_CLAIMS' ||
    key === 'EXP_MANAGE_OWN_PENDING_CLAIMS' ||
    key === 'TIME_LOG_SUBMIT_OWN_HOURS' ||
    key === 'TIME_MANAGE_OWN_LEAVE_REQUESTS' ||
    key === 'TOOL_SUBMIT_OWN_INVOICE_AUDIT_EXPENSES' ||
    key === 'TOOL_SUBMIT_OWN_GPS_TRIPS';

  acc[key] = isSelfService;
  return acc;
}, {} as PermissionsMap);

export type OnboardingStatus = 'pending_invite' | 'invited' | 'pending_questionnaire' | 'questionnaire_in_progress' | 'active' | 'archived' | 'pending_onboarding' | 'completed' | 'incomplete';

export interface EmployeeOnboardingInvite {
  token: string;
  employeeId: string;
  temporaryPassword?: string;
  expiresAt: string;
  sentAt: string;
}

export interface HireQuestionnaireData {
  id: string;
  employeeId: string;
  status: 'draft' | 'submitted';
  createdAt: string;
  submittedAt?: string;
  
  // Section 1: Prefilled Administrative Baseline
  firstName: string;
  lastName: string;
  workEmail: string;
  jobTitle: string;
  departmentId?: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'full-time' | 'part-time';
  payFrequency: 'weekly' | 'bi_weekly' | 'semi_monthly' | 'monthly' | 'bi-weekly' | 'semi-monthly';
  baseRate: number;
  
  // Section 2: Employee Self-Completed Data
  personalEmail?: string;
  phone?: string;
  dateOfBirth?: string;
  socialInsuranceNumber?: string; // SIN / NAS (Quebec)
  streetAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;

  // Section 3: Tax Declarations & Quebec Compliance
  federalTD1ClaimAmount?: number;
  quebecTP1015ClaimAmount?: number;
  additionalTaxDeductionPerPay?: number;
  bill96LanguagePreference: 'fr' | 'en';

  // Section 4: Direct Deposit Details
  bankInstitutionNumber?: string;
  bankTransitNumber?: string;
  bankAccountNumber?: string;

  // Section 5: Emergency Contact
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
}

export interface HireQuestionnaire extends HireQuestionnaireData {}

export interface BenefitContributions {
  health: number;
  lifeInsurance: number;
  disability: number;
  isDisabilityEmployerPaid: boolean;
}

export type CompensationType = 'salary' | 'hourly';

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  middleInitial?: string;
  sin: string;
  dob?: string;
  address: string;
  city?: string;
  postalCode?: string;
  mailingAddress?: string;
  phone: string;
  email: string;
  startDate: string;
  employmentType: EmploymentType;
  compensationType?: CompensationType;
  department?: string;
  jobTitle?: string;
  baseSalary: number;
  frequency: PayFrequency;
  vacationRate: number; // e.g. 0.04
  hourlyRate?: number;
  bankName?: string;
  accountNumber?: string;
  transitNumber?: string;
  institutionNumber?: string;
  paymentMethod?: 'direct_deposit' | 'cheque';
  status: OnboardingStatus;
  onboardingStatus: 'incomplete' | 'completed';
  isFirstLogin?: boolean;
  inviteToken?: string;
  inviteTokenExpiresAt?: string;
  questionnaireId?: string;
  avatarUrl?: string;
  avatarThumbnailUrl?: string;

  // Nested Profile Mappings from Questionnaire
  personalInfo?: {
    sin?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: {
      street: string;
      city: string;
      province: string;
      postalCode: string;
    };
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  bankingInfo?: {
    institution: string;
    transit: string;
    account: string;
  };
  taxParameters?: {
    td1Claim: number;
    tp1015Claim: number;
    additionalDeduction: number;
    bill96Language: 'fr' | 'en';
  };
  
  // Tax Setup (Federal TD1 equivalent)
  claimFederalBasicPersonalAmount: boolean;
  hasMultipleEmployers: boolean;
  federalTd1ClaimAmount?: number;
  federalAdditionalTax: number;
  t1213Reduction?: number; // CRA Request to Reduce Tax Deductions at Source
  eiExempt?: boolean;
  qppExempt?: boolean;
  
  // Tax Setup (Provincial TP-1015.3 equivalent)
  claimProvincialBasicPersonalAmount: boolean;
  quebecTp1015Line10Code?: string; // Form TP-1015.3-V Line 10 code (e.g., 'A')
  qcAdditionalTax?: number;
  livesInNorthernZone: boolean;
  spouseCreditTransfer: boolean;
  tp1016Reduction?: number; // Revenu Québec Application for a Reduction in Source Deductions
  qpipExempt?: boolean;
  cnesstClassification?: string;
  
  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;

  // Language Skills & Bill 96 Preference
  languagePreference?: 'fr' | 'en'; // Bill 96 communication language
  province?: string; // e.g. 'QC'
  provinceOfEmployment?: string; // e.g. 'QC'
  englishProficiency?: 'none' | 'basic' | 'conversational' | 'fluent';
  frenchProficiency?: 'none' | 'basic' | 'conversational' | 'fluent';
  otherLanguages?: string;

  // Commission Earners (TD1X / TP-1015.R)
  isCommissionEarner?: boolean;
  commissionEstimatedIncome?: number;
  commissionEstimatedExpenses?: number;

  // Voluntary Net Pay Modifiers & Retirement
  voluntaryPreTaxRrsp?: number; // Pre-tax Group RRSP / VRSP deduction
  voluntaryPostTaxHealth?: number; // Post-tax health / dental voluntary premium

  // Group Insurance
  groupInsuranceEnrollment: boolean;
  groupInsuranceCoverage?: 'single' | 'couple' | 'family';
  beneficiaryName?: string;
  beneficiaryRelationship?: string;
  beneficiaryShare?: number;

  // Compliance & Regulatory Checkpoints & Consents
  hasTP1015?: boolean;
  hasFederalTD1?: boolean;
  hasDirectDepositAuth?: boolean;
  electronicTaxSlipConsent?: boolean;
  backgroundCheckConsent?: boolean;
  ndaSigned?: boolean;
  nonSolicitationSigned?: boolean;
  handbookAcknowledged?: boolean;
  
  notes?: string;
  garnishments: Garnishment[];
  benefitContributions?: BenefitContributions;
  permissions?: PermissionsMap;
}

export interface CompanySettings {
  id?: string;
  companyName: string;
  tradeName?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  
  // Tax Registration Numbers (PDF Section 2)
  federalId?: string; // Federal Business Number (BN): e.g. 123456789RP0001
  neq?: string; // Quebec Enterprise Number (NEQ): 10 digits
  revenuQuebecId?: string; // Revenu Québec No d'identification: 10 digits + RS + 4 digits e.g. 1234567890RS0001
  cnesstNumber?: string; // CNESST Account ID
  
  // Statutory Employer Rates & Fringe Taxes (PDF Section 4)
  hsfRateModifier?: number; // Health Services Fund rate %
  hsfSector?: 'primary_manufacturing' | 'services_other' | 'large_enterprise';
  cnesstRate?: number; // Worker Safety & Standards rate %
  cnesstRiskCode?: string; // Risk sector classification code (e.g. 69990)
  wsdrfApplicable?: boolean; // WSDRF / FDRCMT 1% training expenditure tracking (> $2M CAD)
  estimatedAnnualPayroll?: number;
  
  // CPA Standard 005 Direct Deposit Configuration (PDF Section 5)
  cpaOriginatorId?: string; // 10-digit CPA Originator ID
  cpaDataCenter?: string; // 5-digit data center
  cpaFormat?: '1464_byte' | '80_byte';
  disbursingBankName?: string;
  disbursingInstitution?: string;
  disbursingTransit?: string;
  disbursingAccount?: string;
  
  // Record of Employment (ROE) Service Canada Web API (PDF Section 5)
  roeContactName?: string;
  roeContactPhone?: string;
  roeContactEmail?: string;
  roeWebApiKey?: string;
  
  defaultFrequency?: PayFrequency;
  defaultProvince?: string;
  language?: 'fr' | 'en';
}

export interface PayrollInput {
  grossPay: number;
  frequency: PayFrequency;
  year: 2024 | 2025 | 2026;
  employeeId?: string;
  vacationPay?: number;
  overtimePay?: number;
  bonusPay?: number;
  commissionPay?: number;
  commissionExpenses?: number; // TD1X / TP-1015.R.13.1-V allowable expenses
  rrspContribution?: number;
  taxableBenefitsProvincial?: number; // e.g. Private health insurance employer portion
  taxableBenefitsFederal?: number;    // e.g. Life insurance employer portion
  garnishments?: Garnishment[];
  benefitContributions?: BenefitContributions;

  // YTD Balances for Automated Maximum Capping Triggers
  ytdGross?: number;
  ytdQPP?: number;
  ytdEI?: number;
  ytdQPIP?: number;
  ytdEmployerQPP?: number;
  ytdEmployerEI?: number;
  ytdEmployerQPIP?: number;
  ytdCnesstInsurable?: number;
  annualWorldwidePayroll?: number;
  cnesstEmployerRate?: number;
  cnesstSectorCode?: string;
  includeCnesstInDeductions?: boolean;
  qcTaxConstants?: any;

  // GST & QST Taxable vs Non-Taxable Supplies / Reimbursements
  taxableSupplyAmount?: number;
  nonTaxableSupplyAmount?: number;
  supplyTaxability?: 'taxable' | 'exempt' | 'zero_rated' | 'gst_only';
  supplyTaxMode?: 'exclusive' | 'inclusive';

  // Statutory Tax Profiles & Reductions
  claimFederalBasicPersonalAmount?: boolean;
  hasMultipleEmployers?: boolean; // If true: BPA = 0, tax from $0
  federalTd1ClaimAmount?: number;
  federalAdditionalTax?: number;
  t1213FederalReduction?: number; // Form T1213 CRA Reduction Letter

  claimProvincialBasicPersonalAmount?: boolean;
  quebecTp1015Line10Code?: string; // e.g. 'A'
  livesInNorthernZone?: boolean;
  spouseCreditTransfer?: boolean;
  tp1016QuebecReduction?: number; // Form TP-1016-V Revenu Québec Reduction Letter
  isQppExempt?: boolean;
  isQpipExempt?: boolean;

  // Voluntary Net Pay Modifiers
  voluntaryPreTaxRrsp?: number; // Pre-tax deduction from gross income
  voluntaryPostTaxHealth?: number; // Post-tax deduction from net pay
}

export interface DeductionBreakdown {
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface PayrollResult {
  grossPay: number;
  netPay: number;
  totalDeductions: number;
  federalTax: number;
  quebecTax: number;
  qpp: number;
  qpip: number;
  ei: number;
  hsf: number;
  cnesst: number;
  gst?: number;
  qst?: number;
  labourStandards: number;
  employerQPP: number;
  employerQPIP: number;
  employerEI: number;
  employerCNESST: number;
  qppTier1Ee?: number;
  qppTier2Ee?: number;
  qppTier1Er?: number;
  qppTier2Er?: number;
  totalEmployerCost: number;
  vacationPay?: number;
  overtimePay?: number;
  bonusPay?: number;
  commissionPay?: number;
  commissionExpenses?: number;
  breakdown: DeductionBreakdown[];

  // YTD & Capping Trigger Indicators
  qppCapped: boolean;
  eiCapped: boolean;
  qpipCapped: boolean;
  cnesstCapped?: boolean;
  qppRemainingCap: number;
  eiRemainingCap: number;
  qpipRemainingCap: number;
  cnesstRemainingCap?: number;
  annualMaxQPP: number;
  annualMaxEI: number;
  annualMaxQPIP: number;
  annualMaxCNESSTInsurable?: number;
  cnesstInsurableEarnings?: number;
  cnesstRateApplied?: number;
  cnesstSectorCode?: string;
  annualMaxEmployerQPP: number;
  annualMaxEmployerEI: number;
  annualMaxEmployerQPIP: number;
  ytdPriorQPP: number;
  ytdPriorEI: number;
  ytdPriorQPIP: number;
  ytdPriorCNESSTInsurable?: number;
  ytdNewQPP: number;
  ytdNewEI: number;
  ytdNewQPIP: number;
  ytdNewCNESSTInsurable?: number;

  // GST / QST Summary on Payroll / Supplies
  taxableSupplyAmount?: number;
  nonTaxableSupplyAmount?: number;
  totalWithSalesTax?: number;

  // Statutory Form Effects
  hasMultipleEmployersApplied: boolean;
  t1213ReductionApplied: number;
  tp1016ReductionApplied: number;
  preTaxRrspDeduction: number;
  postTaxHealthDeduction: number;
  taxableFederalBase: number;
  taxableQuebecBase: number;
}

export type ExpenseStatus = 'pending_approval' | 'approved' | 'rejected' | 'reimbursed';
export type ExpenseSource = 'invoice_audit' | 'gps_triplog' | 'manual' | 'extractor';

export interface BusinessExpense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  deductibleAmount: number;
  receiptUrl?: string;
  notes?: string;

  // Submitter / Employee Identity
  employeeId?: string;
  employeeName?: string;
  employeeEmail?: string;

  // Source Provenance & GST/QST Taxability
  source?: ExpenseSource;
  sourceId?: string;
  sourceLineId?: string;
  taxBreakdown?: {
    gst?: number | null;
    pst?: number | null;
    qst?: number | null;
    hst?: number | null;
    taxStatus?: 'taxable' | 'exempt' | 'zero_rated' | 'gst_only';
    subTotal?: number;
    itcGst?: number;
    itrQst?: number;
  } | string;

  // Approval & Reimbursement Workflow
  status?: ExpenseStatus;
  approvedAt?: string;
  approvedBy?: string;
  approvalReason?: string;
  reimbursedAt?: string;
  reimbursedBy?: string;
  reimbursementMethod?: string;
  reimbursementRef?: string;
  rejectionReason?: string;

  createdAt?: string;
}

export type TaxableBenefitCategory =
  | 'motor_vehicle_allowance'
  | 'automobile_operating'
  | 'standby_charge'
  | 'non_auto_motor_vehicle'
  | 'restaurant_hotel_meals'
  | 'restaurant_hotel_lodging'
  | 'free_subsidized_lodging'
  | 'remote_work_site'
  | 'remote_allowance'
  | 'group_insurance_health'
  | 'group_insurance_life'
  | 'non_group_insurance'
  | 'ramq_equivalency'
  | 'low_interest_loan'
  | 'tfsa_fhsa_rrsp'
  | 'gifts_rewards'
  | 'cryptoassets'
  | 'moving_relocation'
  | 'security_options'
  | 'other_benefit';

export interface TaxableBenefitRecord {
  id: string;
  employeeId?: string;
  employeeName?: string;
  date: string;
  category: TaxableBenefitCategory;
  description: string;
  totalAmount: number;
  taxableAmount: number;
  nonTaxableAmount: number;
  rl1Box: string; // e.g. "A, W", "A, J", "A, L", "A, V", "A, G, I, L", "O (code RO)"
  t4Box: string;  // e.g. "14, 34", "14, 30", "14, 36", "14, 40", "14, 85"
  subjectToQpp: boolean;
  subjectToQpip: boolean;
  subjectToEi: boolean;
  subjectToTax: boolean;
  calculationDetails?: {
    method?: string;
    kilometers?: number;
    reasonableRate?: number;
    prescribedRate?: number;
    quarters?: number[];
    ceilingAmount?: number;
    fmv?: number;
    employeePaid?: number;
    formula?: string;
    notes?: string;
  };
  createdAt?: string;
}

export interface ExtractedFinancialItem {
  id: string;
  date: string;
  description: string;
  rawText?: string;
  totalAmount: number;
  type: 'business_expense' | 'taxable_benefit' | 'non_taxable_reimbursement';
  expenseCategory?: string;
  deductibleAmount?: number;
  taxableBenefitCategory?: TaxableBenefitCategory;
  taxableAmount?: number;
  nonTaxableAmount?: number;
  rl1Box?: string;
  t4Box?: string;
  explanation: string;
  appliedRule: string;
  employeeName?: string;
  employeeId?: string;
  calculationDetails?: any;
}

export interface PayStub extends PayrollResult {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  payPeriod: string;
}

export type DistributionMethod = 'bonus' | 'non_eligible_dividend' | 'eligible_dividend' | 'epsp' | 'dpsp';

export interface OwnerMixSimulationInput {
  corporateNetIncome: number; // Pre-tax corporate earnings (e.g. $150,000)
  targetPersonalCash: number; // How much personal cash is needed
  salaryBonusAmount: number; // Portion taken as salary / bonus
  dividendAmount: number; // Portion taken as dividend
  dividendType: 'non_eligible' | 'eligible';
  isCCPC: boolean; // Canadian-Controlled Private Corporation
  qualifiesForSBD: boolean; // Small business deduction (first $500k active income)
  passiveInvestmentIncome: number; // Passive income grind threshold ($50k)
  familyShareholderActive: boolean; // >20 hrs/week or age 65+ for TOSI exemption
  year: 2024 | 2025 | 2026;
}

export interface OwnerMixSimulationResult {
  corporatePreTax: number;
  corporateTax: number;
  corporateRetainedEarnings: number;
  salaryBonusPaid: number;
  dividendPaid: number;
  corporateDeduction: number;
  payrollTaxesEmployer: {
    qpp: number;
    qpip: number;
    hsf: number;
    cnesst: number;
    total: number;
  };
  personalIncomeTax: {
    federalTax: number;
    quebecTax: number;
    dividendTaxCreditFederal: number;
    dividendTaxCreditQuebec: number;
    netPersonalTax: number;
  };
  employeePayrollDeductions: {
    qpp: number;
    ei: number;
    qpip: number;
    total: number;
  };
  netCashInHand: number;
  effectiveTotalTaxRate: number; // Combined Corp + Personal effective tax rate %
  rrspRoomGenerated: number; // 18% of earned salary/bonus
  qppPensionCredits: boolean;
  tosiApplied: boolean;
  tosiTaxPenalty: number;
  taxIntegrationSavingsVsSalary: number; // Difference in net cash
  sbdGrindReduction: number; // SBD limit reduction from passive income
}

export interface RetiringAllowanceCalculation {
  totalSeveranceAmount: number;
  pre1996YearsOfService: number;
  pre1979YearsOfService: number;
  directRrspTransferEligible: number; // $2,000/yr (1971-1995) + $1,500/yr (unvested pre-1989)
  voluntaryRrspContribution: number; // Using normal RRSP room
  taxableCashPortion: number;
  federalLumpSumRate: number; // 10%, 20%, 30%
  quebecLumpSumRate: number;  // 14%, 19%, 24%
  federalWithholdingTax: number;
  quebecWithholdingTax: number;
  totalWithholdingTax: number;
  netCashToEmployee: number;
  t4Box: string; // "Code 66 (Eligible), Code 67 (Non-eligible)"
  rl1Box: string; // "Box O (Code RJ / RQ)"
}

export type TimeEntryType = 'regular' | 'overtime' | 'double_time' | 'on_call' | 'statutory_holiday';
export type TimeEntryStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'applied_to_payroll';

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  entryType: TimeEntryType;
  projectTask?: string;
  billable?: boolean;
  hourlyRate?: number;
  status: TimeEntryStatus;
  payrollStubId?: string;
  notes?: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  createdAt?: string;
}

export type LeaveType = 
  | 'vacation'             // Congé annuel payé
  | 'sick'                 // Maladie / Obligations familiales (Loi sur les normes du travail)
  | 'personal'             // Raisons personnelles ou familiales
  | 'statutory_holiday'    // Jour férié chômé et payé
  | 'bereavement'          // Deuil
  | 'parental'             // Congé de maternité / paternité / parental
  | 'unpaid';              // Congé sans solde

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalHours: number;
  isPaid: boolean;
  reason?: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  appliedToPayroll?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeLeaveBalance {
  id: string;
  employeeId: string;
  employeeName?: string;
  department?: string;
  jobTitle?: string;
  fiscalYear: number;
  vacationRate?: number;
  vacationTotalDays: number;
  vacationUsedDays: number;
  vacationAvailableDays?: number;
  sickTotalDays: number;
  sickUsedDays: number;
  sickAvailableDays?: number;
  personalTotalDays: number;
  personalUsedDays: number;
  personalAvailableDays?: number;
  rttCompensatoryHours: number;
  updatedAt?: string;
}


