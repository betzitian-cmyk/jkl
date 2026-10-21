import React from 'react';
import { UserPermissions, PermissionKey, PermissionDomain } from '../types';
import { useLanguage } from './LanguageContext';
import {
  STANDARD_EMPLOYEE_PRESET,
  MANAGER_PRESET,
  PAYROLL_ADMIN_PRESET,
  SUPER_ADMIN_PRESET
} from '../utils/permissionPresets';

interface PermissionsChecklistProps {
  permissions: UserPermissions;
  onChange: (updatedPermissions: UserPermissions) => void;
  disabled?: boolean;
}

interface DomainConfig {
  id: PermissionDomain;
  title: string;
  items: { key: PermissionKey; label: string; tooltip: string; warning?: boolean }[];
}

const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    id: 'system_admin',
    title: '1. System Administration & Platform Security',
    items: [
      { key: 'SYS_ADMIN_DASHBOARD_ACCESS', label: 'Access Admin / Executive Dashboard', tooltip: 'Full administrative UI, financial metrics, and company-wide analytics.' },
      { key: 'SYS_EMPLOYEE_PORTAL_ACCESS', label: 'Access Employee Self-Service Dashboard', tooltip: 'Restricts view exclusively to personal self-service portal.' },
      { key: 'SYS_ENV_API_KEYS_MANAGE', label: 'Manage System Environment Variables & API Keys', tooltip: 'Grants access to rotate external AI and service keys.', warning: true },
      { key: 'SYS_DB_CONSOLE_ACCESS', label: 'Access Database Console & System Schema', tooltip: 'Allows running direct SQL queries and database migrations.', warning: true },
      { key: 'SYS_AUDIT_LOGS_VIEW', label: 'View System Health & Diagnostic Logs', tooltip: 'Monitors user activity, security logs, and database health.' },
      { key: 'SYS_ROLE_PREVIEW_TOGGLE', label: 'Toggle Role Preview Mode', tooltip: 'Permits switching between Admin and Employee perspectives.' },
      { key: 'SYS_COMPANY_SETTINGS_MANAGE', label: 'Configure Company Settings & Identifiers', tooltip: 'Updates corporate legal names, NEQ, BN, and CNESST tax IDs.' },
      { key: 'SYS_BILL96_LANG_MANAGE', label: 'Manage Bill 96 & Language Compliance', tooltip: 'Sets official language communications and UI preferences.' }
    ]
  },
  {
    id: 'employee_scope',
    title: '2. Employee Profile & Scope Control',
    items: [
      { key: 'EMP_PROFILES_MANAGE_ALL', label: 'Create, Update, Archive, and Manage All Profiles', tooltip: 'Full organizational CRUD over employee master records.' },
      { key: 'EMP_ROLES_ASSIGN_MODIFY', label: 'Assign Roles & Modify Access Permissions', tooltip: 'Permits toggling permission checkboxes for other staff.', warning: true },
      { key: 'EMP_OVERRIDE_CONTEXT_SELECT', label: 'Override Employee Context Selection (Global Switcher)', tooltip: 'Unlocks context switcher. If unchecked, user is strictly locked to own UUID.', warning: true },
      { key: 'EMP_DIRECT_REPORTS_VIEW', label: 'View Basic Profile Details of Direct Reports Only', tooltip: 'Managerial scope to inspect subordinate contact details.' },
      { key: 'EMP_PII_SENSITIVE_VIEW', label: 'View Sensitive Personal Identifiers (PII)', tooltip: 'Unmasks Social Insurance Numbers (SIN) and private home addresses.', warning: true },
      { key: 'EMP_PROFILE_OWN_VIEW', label: 'View Own Personal Profile Details', tooltip: 'Access self-service personal information.' },
      { key: 'EMP_PROFILE_OWN_EDIT', label: 'Edit Own Personal Profile Details', tooltip: 'Update personal address, phone number, and emergency contacts.' },
      { key: 'EMP_DOC_CONSENTS_MANAGE', label: 'Manage Document Compliance Consents', tooltip: 'Tracks compliance signatures for NDAs and handbooks.' }
    ]
  },
  {
    id: 'payroll_compensation',
    title: '3. Payroll, Compensation & Direct Deposit',
    items: [
      { key: 'PAY_RUN_EXECUTE_GLOBAL', label: 'Execute Global Payroll Runs', tooltip: 'Calculates gross-to-net pay and generates company pay stubs.', warning: true },
      { key: 'PAY_RATES_MANAGE_ALL', label: 'Set & Modify All Employee Pay Rates & Compensation', tooltip: 'Full control over base wages, salaries, and overtime rates.' },
      { key: 'PAY_RATES_DIRECT_REPORTS_VIEW', label: 'View Compensation Details of Direct Reports Only', tooltip: 'Managerial visibility into team pay structures.' },
      { key: 'PAY_RATES_OWN_VIEW', label: 'View Own Pay Rate & Compensation History', tooltip: 'Self-service view of wage rates and pay stub history.' },
      { key: 'PAY_COMMISSION_PARAMS_CONFIG', label: 'Configure Commission Earner Parameters', tooltip: 'Sets estimated commission and tax deduction expenses (TD1X/TP-1015.R).' },
      { key: 'PAY_BANK_DETAILS_MANAGE_ALL', label: 'Manage Global Bank Account Details', tooltip: 'Edits banking transit and account numbers for all staff.' },
      { key: 'PAY_CPA_005_EFT_GENERATE', label: 'Generate CPA Standard 005 Direct Deposit Files', tooltip: 'Exports electronic funds transfer (EFT) batch files for banks.', warning: true },
      { key: 'PAY_BANK_DETAILS_OWN_EDIT', label: 'View & Edit Own Direct Deposit Details', tooltip: 'Self-service updates to personal direct deposit details.' },
      { key: 'PAY_STUBS_VIEW_ALL', label: 'View All Historical Pay Stubs', tooltip: 'Access company-wide pay stub archive.' },
      { key: 'PAY_STUBS_OWN_VIEW_DOWNLOAD', label: 'View & Download Own Pay Stubs', tooltip: 'Self-service PDF download of personal pay stubs.' },
      { key: 'PAY_STUBS_REVERSE_DELETE', label: 'Delete & Reverse Historical Pay Stubs', tooltip: 'Voids historical pay stubs and recalculates YTD totals.', warning: true }
    ]
  },
  {
    id: 'tax_compliance',
    title: '4. Tax Compliance, Remittances & Statutory Filings',
    items: [
      { key: 'TAX_PARAMS_MANAGE_GLOBAL', label: 'Configure Federal & Provincial Tax Parameters', tooltip: 'Modifies TD1 and TP-1015.3-V tax codes and deduction rules.' },
      { key: 'TAX_EXEMPTIONS_TOGGLE', label: 'Configure Statutory Exemption Flags', tooltip: 'Toggles EI, QPP, QPIP, and CNESST exemption flags.' },
      { key: 'TAX_SOURCE_REDUCTIONS_APPLY', label: 'Apply CRA & Revenu Québec Source Tax Reductions', tooltip: 'Records official T1213 / TP-1016 tax reduction letters.' },
      { key: 'TAX_GARNISHMENTS_MANAGE', label: 'Configure Wage Garnishments & Court Orders', tooltip: 'Sets up support payments and court-ordered tax arrears.' },
      { key: 'TAX_PRE_POST_DEDUCTIONS_CONFIG', label: 'Configure Pre-Tax & Post-Tax Deductions', tooltip: 'Manages group RRSP/VRSP and benefit plan deductions.' },
      { key: 'TAX_EMPLOYER_LIABILITIES_CALC', label: 'Calculate & Report Employer Statutory Contributions', tooltip: 'Computes employer QPP, EI, QPIP, HSF, and CNESST burdens.' },
      { key: 'TAX_REMITTANCE_REPORTS_GEN', label: 'Generate Monthly Remittance Reports', tooltip: 'Creates CRA PD7A and Revenu Québec TPZ-1015 forms.' },
      { key: 'TAX_SLIPS_ANNUAL_GENERATE', label: 'Generate Annual Tax Slips (T4 & RL-1)', tooltip: 'Finalizes T4/RL-1 slips and generates XML web filing packages.', warning: true },
      { key: 'TAX_ROE_GENERATE_SUBMIT', label: 'Generate Records of Employment (ROE)', tooltip: 'Transmits ROE payloads via Service Canada Web API.', warning: true },
      { key: 'TAX_WSDRF_1PERCENT_TRACK', label: 'Track WSDRF / FDRCMT 1% Training Compliance', tooltip: 'Monitors workforce training compliance for large payrolls.' },
      { key: 'TAX_SLIPS_OWN_VIEW_DOWNLOAD', label: 'View Own Submitted Tax Declarations & Download Tax Slips', tooltip: 'Access personal tax slips and filed credit declarations.' }
    ]
  },
  {
    id: 'expense_management',
    title: '5. Expense Management & Reimbursements',
    items: [
      { key: 'EXP_GLOBAL_APPROVE_REJECT', label: 'Approve, Reimburse & Reject Global Expenses', tooltip: 'Managerial/Financial approval of employee claims.' },
      { key: 'EXP_GLOBAL_MANAGE_ALL', label: 'Manage Global Business Expenses', tooltip: 'Creates, edits, and categorizes business expenses company-wide.' },
      { key: 'EXP_TAX_CREDIT_AUTO_EXTRACT', label: 'Automate Sales Tax Credit Extraction', tooltip: 'Calculates GST/QST Input Tax Credits (ITC/ITR).' },
      { key: 'EXP_OWN_SUBMIT_CREATE', label: 'Submit Own Expense Claims', tooltip: 'Drafts and submits personal reimbursement requests.' },
      { key: 'EXP_OWN_VIEW_EDIT_DELETE', label: 'View, Edit & Delete Own Pending Expenses', tooltip: 'Restricts visibility to personal pending claims.' }
    ]
  },
  {
    id: 'time_leave',
    title: '6. Timesheet, Attendance & Leave Management',
    items: [
      { key: 'TIME_GLOBAL_MANAGE_ALL', label: 'Manage Global Timesheets & Time Entries', tooltip: 'Edits, approves, or locks shift hours and overtime for all staff.' },
      { key: 'LEAVE_GLOBAL_APPROVE_REJECT', label: 'Approve & Reject Global Leave Requests', tooltip: 'Managerial authority over vacation and sick leave requests.' },
      { key: 'LEAVE_APPROVED_CALENDAR_VIEW', label: 'View All Approved Employee Absence Requests', tooltip: 'Read-only access to master approved leave calendar.' },
      { key: 'TIME_HOLIDAYS_LEAVE_BALANCES_MANAGE', label: 'Manage Statutory Holiday Calendar & Leave Balances', tooltip: 'Adjusts vacation pay rates (4/6/8%) and statutory holiday setups.' },
      { key: 'TIME_OWN_LOG_SUBMIT', label: 'Log & Submit Own Working Hours', tooltip: 'Personal clock-in/clock-out and break logging.' },
      { key: 'LEAVE_OWN_MANAGE_SUBMIT', label: 'Create, Edit, View & Delete Own Leave Requests', tooltip: 'Submits and manages personal time-off requests.' }
    ]
  },
  {
    id: 'ai_ocr_gps',
    title: '7. Specialized AI, OCR & Mobile Tracking Tools',
    items: [
      { key: 'AI_GLOBAL_DOC_PROCESS', label: 'Process Global Documents via AI & OCR Engine', tooltip: 'Bulk AI processing of invoices, receipts, and timesheets.' },
      { key: 'AI_TAX_REG_VERIFY', label: 'Execute Real-Time Tax Registration Verification', tooltip: 'Validates vendor GST/QST registration numbers in real time.' },
      { key: 'APP_INV_AUDIT_OWN_SUBMIT', label: 'Submit Personal Expenses via Invoice Audit App (/inv)', tooltip: 'Uses AI/OCR scanner to submit personal receipts only.' },
      { key: 'APP_GPS_TRIP_OWN_SUBMIT', label: 'Submit Personal Trips via GPS TripLog App (/gps)', tooltip: 'Logs personal business travel and calculates mileage.' },
      { key: 'GPS_TRIP_LOGS_MANAGE_ALL', label: 'Manage Global Driving Trip Logs', tooltip: 'Audits and inspects driving routes across all drivers.' }
    ]
  },
  {
    id: 'corporate_governance',
    title: '8. Corporate Distributions & Shareholder Equity',
    items: [
      { key: 'CORP_DIVIDENDS_MANAGE', label: 'Manage Corporate Distributions & Dividends', tooltip: 'Authorizes eligible/non-eligible dividend payouts.', warning: true },
      { key: 'CORP_TAX_SLIPS_T5_RL3_GEN', label: 'Generate Shareholder Tax Slips (T5 / RL-3)', tooltip: 'Issues federal T5 and Quebec RL-3 slips for shareholders.' },
      { key: 'CORP_OWNER_CAPITAL_DRAWS_TRACK', label: 'Track Owner Capital Draws', tooltip: 'Monitors non-taxable owner equity withdrawals.' }
    ]
  }
];

export const PermissionsChecklist: React.FC<PermissionsChecklistProps> = ({
  permissions,
  onChange,
  disabled = false
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const handleToggle = (key: PermissionKey) => {
    if (disabled) return;
    onChange({ ...permissions, [key]: !permissions[key] });
  };

  const handleApplyPreset = (preset: UserPermissions) => {
    if (disabled) return;
    onChange({ ...preset });
  };

  const handleDomainToggle = (domain: DomainConfig, enable: boolean) => {
    if (disabled) return;
    const updated = { ...permissions };
    domain.items.forEach(item => {
      updated[item.key] = enable;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-6 border rounded-xl p-4 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b">
        <div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
            {isFr ? 'Droits d\'accès & Matrice de permissions granulaires' : 'Access Rights & Granular Permissions Matrix'}
          </h3>
          <p className="text-xs text-gray-500">
            {isFr ? 'Configurez les capacités opérationnelles ou choisissez un profil préréglé.' : 'Configure operational capabilities or select a role preset.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleApplyPreset(STANDARD_EMPLOYEE_PRESET)}
            className="px-3 py-1.5 text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition active:scale-95 cursor-pointer"
          >
            {isFr ? '[Profil : Employé Standard]' : '[Preset: Standard Employee]'}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleApplyPreset(MANAGER_PRESET)}
            className="px-3 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg transition active:scale-95 cursor-pointer"
          >
            {isFr ? '[Profil : Gestionnaire]' : '[Preset: Manager]'}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleApplyPreset(PAYROLL_ADMIN_PRESET)}
            className="px-3 py-1.5 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg transition active:scale-95 cursor-pointer"
          >
            {isFr ? '[Profil : Admin Paie]' : '[Preset: Payroll Admin]'}
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => handleApplyPreset(SUPER_ADMIN_PRESET)}
            className="px-3 py-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-800 rounded-lg transition active:scale-95 cursor-pointer"
          >
            {isFr ? '[Profil : Super Admin]' : '[Preset: Super Admin]'}
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
        {DOMAIN_CONFIGS.map(domain => {
          const allDomainChecked = domain.items.every(i => !!permissions[i.key]);
          return (
            <div key={domain.id} className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-tight">{domain.title}</span>
                <div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDomainToggle(domain, !allDomainChecked)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    {allDomainChecked ? (isFr ? 'Désélectionner le domaine' : 'Deselect Domain') : (isFr ? 'Sélectionner le domaine' : 'Select Domain')}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {domain.items.map(item => (
                  <label
                    key={item.key}
                    title={item.tooltip}
                    className={`flex items-start space-x-2.5 p-2.5 rounded-xl cursor-pointer border transition-colors ${
                      permissions[item.key] ? 'border-indigo-200 bg-indigo-50/40 ring-1 ring-indigo-200' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={!!permissions[item.key]}
                      onChange={() => handleToggle(item.key)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div className="text-xs space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold ${item.warning ? 'text-amber-900' : 'text-slate-800'}`}>
                          {item.label}
                        </span>
                        {item.warning && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                            Élevé
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-500 leading-tight">{item.tooltip}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
