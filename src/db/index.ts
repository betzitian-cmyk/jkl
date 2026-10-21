import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

let internalDb: any = null;
export let pool: pg.Pool | null = null;

// Initialize default PGlite instance synchronously so db is available immediately
const dbDir = path.join(process.cwd(), '.data', 'pglite');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
export const pgliteInstance = new PGlite(dbDir);
internalDb = drizzlePglite(pgliteInstance, { schema });

// Proxy db delegates all properties/methods to active internalDb
export const db = new Proxy({} as any, {
  get(_target, prop) {
    if (prop in internalDb) {
      const val = internalDb[prop];
      return typeof val === 'function' ? val.bind(internalDb) : val;
    }
    return undefined;
  }
});

export async function ensureSchema() {
  const { SQL_USER, SQL_PASSWORD, SQL_HOST, SQL_DB_NAME, DATABASE_URL } = process.env;
  let usePg = false;
  let pgClient: pg.PoolClient | null = null;

  // Determine if valid external Postgres configuration exists
  const hasValidHost = Boolean(SQL_HOST && SQL_HOST !== 'undefined' && SQL_HOST.trim().length > 0);
  const connStr = DATABASE_URL || (hasValidHost ? `postgresql://${SQL_USER || 'postgres'}:${encodeURIComponent(SQL_PASSWORD || '')}@${SQL_HOST}:5432/${SQL_DB_NAME || 'postgres'}` : null);

  if (connStr) {
    try {
      const testPool = new pg.Pool({ connectionString: connStr, connectionTimeoutMillis: 3000 });
      pgClient = await testPool.connect();
      pool = testPool;
      usePg = true;
      console.log("Connected to external PostgreSQL database.");
      internalDb = drizzlePg(pool, { schema });
    } catch (err) {
      console.warn("Could not connect to external PostgreSQL database. Falling back to embedded PGlite database.", err);
      usePg = false;
      if (pool) {
        pool.end().catch(() => {});
        pool = null;
      }
    }
  }

  try {
    const queryFn = async (sqlText: string) => {
      // Split by semicolon to run statements sequentially, avoiding "cannot insert multiple commands into a prepared statement"
      const statements = sqlText
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        if (usePg && pgClient) {
          await pgClient.query(statement + ';');
        } else {
          await pgliteInstance.query(statement + ';');
        }
      }
    };

    await queryFn(`
      CREATE TABLE IF NOT EXISTS cnesst_classifications (
        code TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        assessment_rate NUMERIC NOT NULL DEFAULT '0.0000',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS qc_deduction_codes (
        code TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        base_deduction_amount NUMERIC NOT NULL DEFAULT '0.00'
      );

      CREATE TABLE IF NOT EXISTS qc_payroll_tax_constants (
        tax_year INTEGER PRIMARY KEY,
        qpp_basic_exemption NUMERIC NOT NULL DEFAULT '3500.00',
        qpp_mpe NUMERIC NOT NULL,
        qpp_yampe NUMERIC NOT NULL,
        qpp_tier1_ee_rate NUMERIC NOT NULL,
        qpp_tier1_er_rate NUMERIC NOT NULL,
        qpp_tier2_ee_rate NUMERIC NOT NULL,
        qpp_tier2_er_rate NUMERIC NOT NULL,
        qpip_mie NUMERIC NOT NULL,
        qpip_ee_rate NUMERIC NOT NULL,
        qpip_er_rate NUMERIC NOT NULL,
        cnesst_max_insurable NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS employees (
        id TEXT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        sin TEXT NOT NULL,
        dob TEXT,
        address TEXT NOT NULL,
        mailing_address TEXT,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        start_date TEXT,
        employment_type TEXT,
        base_salary NUMERIC,
        frequency TEXT,
        vacation_rate NUMERIC,
        hourly_rate NUMERIC,
        hire_date TEXT,
        pay_schedule TEXT,
        pay_type TEXT,
        pay_rate NUMERIC,
        vacation_policy TEXT DEFAULT 'accrue_per_period',
        status TEXT DEFAULT 'pending_onboarding',
        bank_name TEXT,
        account_number TEXT,
        transit_number TEXT,
        institution_number TEXT,
        onboarding_status TEXT NOT NULL,
        claim_federal_basic_personal_amount BOOLEAN DEFAULT TRUE,
        has_multiple_employers BOOLEAN DEFAULT FALSE,
        federal_additional_tax NUMERIC DEFAULT '0',
        claim_provincial_basic_personal_amount BOOLEAN DEFAULT TRUE,
        lives_in_northern_zone BOOLEAN DEFAULT FALSE,
        spouse_credit_transfer BOOLEAN DEFAULT FALSE,
        language_preference TEXT DEFAULT 'fr',
        province_of_employment TEXT DEFAULT 'QC',
        group_insurance_enrollment BOOLEAN DEFAULT FALSE,
        group_insurance_coverage TEXT,
        beneficiary_name TEXT,
        beneficiary_relationship TEXT,
        beneficiary_share NUMERIC,
        has_tp1015 BOOLEAN DEFAULT FALSE,
        has_federal_td1 BOOLEAN DEFAULT FALSE,
        has_direct_deposit_auth BOOLEAN DEFAULT FALSE,
        notes TEXT,
        garnishments TEXT DEFAULT '[]',
        benefit_contributions TEXT,
        preferred_name TEXT,
        department TEXT,
        job_title TEXT,
        province TEXT DEFAULT 'QC',
        federal_td1_claim_amount NUMERIC,
        t1213_reduction NUMERIC,
        quebec_tp1015_line10_code TEXT,
        tp1016_reduction NUMERIC,
        emergency_contact_name TEXT,
        emergency_contact_relationship TEXT,
        emergency_contact_phone TEXT,
        english_proficiency TEXT DEFAULT 'fluent',
        french_proficiency TEXT DEFAULT 'fluent',
        other_languages TEXT,
        is_commission_earner BOOLEAN DEFAULT FALSE,
        commission_estimated_income NUMERIC,
        commission_estimated_expenses NUMERIC,
        voluntary_pre_tax_rrsp NUMERIC,
        voluntary_post_tax_health NUMERIC,
        electronic_tax_slip_consent BOOLEAN DEFAULT TRUE,
        background_check_consent BOOLEAN DEFAULT TRUE,
        nda_signed BOOLEAN DEFAULT TRUE,
        non_solicitation_signed BOOLEAN DEFAULT TRUE,
        handbook_acknowledged BOOLEAN DEFAULT TRUE,
        middle_initial TEXT,
        city TEXT,
        postal_code TEXT,
        ei_exempt BOOLEAN DEFAULT FALSE,
        qpp_exempt BOOLEAN DEFAULT FALSE,
        qc_additional_tax NUMERIC,
        qpip_exempt BOOLEAN DEFAULT FALSE,
        cnesst_classification TEXT,
        payment_method TEXT,
        avatar_url TEXT,
        avatar_thumbnail_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS employee_addresses (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        province TEXT NOT NULL DEFAULT 'QC',
        postal_code TEXT NOT NULL,
        mailing_address TEXT
      );

      -- Onboarding Documents Table
      CREATE TABLE IF NOT EXISTS onboarding_documents (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        doc_type TEXT NOT NULL,
        original_name TEXT NOT NULL,
        stored_filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        uploaded_at TIMESTAMP DEFAULT NOW()
      );

      -- Ensure employees table has modern fields required by current Drizzle schema
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS fed_tax_credit_amount NUMERIC;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS fed_additional_tax NUMERIC DEFAULT '0.00';
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS prov_tax_credit_amount NUMERIC;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS prov_additional_tax NUMERIC DEFAULT '0.00';
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_fed_bpa_clawbacked BOOLEAN DEFAULT FALSE;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_fed_default_applied BOOLEAN DEFAULT FALSE;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_prov_default_applied BOOLEAN DEFAULT FALSE;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS system_calculated_bpa NUMERIC;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_covered_by_spouse_plan BOOLEAN DEFAULT FALSE;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS spouse_plan_details JSONB;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS selected_plan_post_validation TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS validation_completion_date TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS has_active_garnishments BOOLEAN DEFAULT FALSE;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS garnishment_categories JSONB;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS garnishment_doc_provided BOOLEAN DEFAULT FALSE;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS payroll_lock_flag TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS electronic_consent_t4_rl1 BOOLEAN DEFAULT FALSE;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS tax_delivery_email TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS tax_consent_timestamp TIMESTAMP;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS permissions TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS garnishments TEXT DEFAULT '[]';
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS benefit_contributions TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_thumbnail_url TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS background_check_consent BOOLEAN DEFAULT TRUE;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT FALSE;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS invite_token TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS invite_token_expires_at TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS questionnaire_id TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS personal_info TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS banking_info TEXT;
      ALTER TABLE employees ADD COLUMN IF NOT EXISTS tax_parameters TEXT;

      CREATE TABLE IF NOT EXISTS hire_questionnaires (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW(),
        submitted_at TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        work_email TEXT NOT NULL,
        job_title TEXT NOT NULL,
        department_id TEXT,
        employment_type TEXT NOT NULL,
        pay_frequency TEXT NOT NULL,
        base_rate NUMERIC NOT NULL,
        personal_email TEXT,
        phone TEXT,
        date_of_birth TEXT,
        social_insurance_number TEXT,
        street_address TEXT,
        city TEXT,
        province TEXT,
        postal_code TEXT,
        federal_td1_claim_amount NUMERIC,
        quebec_tp1015_claim_amount NUMERIC,
        additional_tax_deduction_per_pay NUMERIC,
        bill96_language_preference TEXT DEFAULT 'fr',
        bank_institution_number TEXT,
        bank_transit_number TEXT,
        bank_account_number TEXT,
        emergency_contact_name TEXT,
        emergency_contact_relationship TEXT,
        emergency_contact_phone TEXT
      );

      CREATE TABLE IF NOT EXISTS employee_tax_profiles (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        federal_basic_amount NUMERIC NOT NULL DEFAULT '15705.00',
        federal_additional_tax NUMERIC NOT NULL DEFAULT '0.00',
        ei_exempt BOOLEAN NOT NULL DEFAULT FALSE,
        qpp_exempt BOOLEAN NOT NULL DEFAULT FALSE,
        qc_deduction_code TEXT NOT NULL DEFAULT 'A',
        qc_additional_tax NUMERIC NOT NULL DEFAULT '0.00',
        annual_deduction_tp1015 NUMERIC NOT NULL DEFAULT '0.00',
        qpip_exempt BOOLEAN NOT NULL DEFAULT FALSE,
        cnesst_classification TEXT
      );

      CREATE TABLE IF NOT EXISTS employee_bank_details (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        payment_method TEXT NOT NULL DEFAULT 'direct_deposit',
        transit_number TEXT,
        institution_number TEXT,
        account_number TEXT
      );

      CREATE TABLE IF NOT EXISTS employee_taxable_benefits (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        benefit_type TEXT NOT NULL,
        estimated_annual_value NUMERIC NOT NULL DEFAULT '0.00',
        pay_period_amount NUMERIC NOT NULL DEFAULT '0.00',
        rl1_box_code TEXT NOT NULL DEFAULT 'A',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS payroll_runs (
        id TEXT PRIMARY KEY,
        pay_period_start TEXT NOT NULL,
        pay_period_end TEXT NOT NULL,
        pay_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pay_stub_line_items (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        payroll_run_id TEXT NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
        gross_pay NUMERIC NOT NULL,
        qpp_tier1_ee NUMERIC NOT NULL DEFAULT '0.00',
        qpp_tier1_er NUMERIC NOT NULL DEFAULT '0.00',
        qpp_tier2_ee NUMERIC NOT NULL DEFAULT '0.00',
        qpp_tier2_er NUMERIC NOT NULL DEFAULT '0.00',
        qpip_ee NUMERIC NOT NULL DEFAULT '0.00',
        qpip_er NUMERIC NOT NULL DEFAULT '0.00',
        qc_income_tax_ee NUMERIC NOT NULL DEFAULT '0.00',
        fed_income_tax_ee NUMERIC NOT NULL DEFAULT '0.00',
        hsf_employer_tax NUMERIC NOT NULL DEFAULT '0.00',
        cnesst_employer_premium NUMERIC NOT NULL DEFAULT '0.00',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS onboarding_audit_logs (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        details TEXT,
        performed_by TEXT DEFAULT 'SYSTEM',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS business_expenses (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        deductible_amount NUMERIC NOT NULL,
        receipt_url TEXT,
        notes TEXT,
        employee_id TEXT,
        employee_name TEXT,
        employee_email TEXT,
        source TEXT DEFAULT 'manual',
        source_id TEXT,
        source_line_id TEXT,
        tax_breakdown TEXT,
        status TEXT DEFAULT 'pending_approval',
        approved_at TIMESTAMP,
        approved_by TEXT,
        approval_reason TEXT,
        reimbursed_at TIMESTAMP,
        reimbursed_by TEXT,
        reimbursement_method TEXT,
        reimbursement_ref TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS employee_id TEXT;
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS employee_name TEXT;
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS employee_email TEXT;
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS source_id TEXT;
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS source_line_id TEXT;
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS tax_breakdown TEXT;
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_approval';
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS approved_by TEXT;
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS approval_reason TEXT;
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS reimbursed_at TIMESTAMP;
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS reimbursed_by TEXT;
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS reimbursement_method TEXT;
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS reimbursement_ref TEXT;
      ALTER TABLE business_expenses ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

      CREATE TABLE IF NOT EXISTS taxable_benefits (
        id TEXT PRIMARY KEY,
        employee_id TEXT,
        employee_name TEXT,
        date TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        total_amount NUMERIC NOT NULL,
        taxable_amount NUMERIC NOT NULL,
        non_taxable_amount NUMERIC NOT NULL,
        rl1_box TEXT NOT NULL,
        t4_box TEXT NOT NULL,
        subject_to_qpp BOOLEAN DEFAULT TRUE,
        subject_to_qpip BOOLEAN DEFAULT FALSE,
        subject_to_ei BOOLEAN DEFAULT FALSE,
        subject_to_tax BOOLEAN DEFAULT TRUE,
        calculation_details TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS company_settings (
        id TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        trade_name TEXT,
        address TEXT,
        city TEXT,
        province TEXT DEFAULT 'QC',
        postal_code TEXT,
        phone TEXT,
        email TEXT,
        federal_id TEXT,
        neq TEXT,
        revenu_quebec_id TEXT,
        cnesst_number TEXT,
        hsf_rate_modifier NUMERIC DEFAULT '1.65',
        hsf_sector TEXT DEFAULT 'services_other',
        cnesst_rate NUMERIC DEFAULT '1.85',
        cnesst_risk_code TEXT DEFAULT '69990',
        wsdrf_applicable BOOLEAN DEFAULT FALSE,
        estimated_annual_payroll NUMERIC DEFAULT '750000',
        cpa_originator_id TEXT,
        cpa_data_center TEXT DEFAULT '00100',
        cpa_format TEXT DEFAULT '1464_byte',
        disbursing_bank_name TEXT,
        disbursing_institution TEXT,
        disbursing_transit TEXT,
        disbursing_account TEXT,
        roe_contact_name TEXT,
        roe_contact_phone TEXT,
        roe_contact_email TEXT,
        roe_web_api_key TEXT,
        default_frequency TEXT DEFAULT 'bi-weekly',
        default_province TEXT DEFAULT 'QC',
        language TEXT DEFAULT 'fr',
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS pay_stubs (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        employee_name TEXT NOT NULL,
        date TEXT NOT NULL,
        pay_period TEXT NOT NULL,
        gross_pay NUMERIC NOT NULL,
        net_pay NUMERIC NOT NULL,
        total_deductions NUMERIC NOT NULL,
        federal_tax NUMERIC NOT NULL,
        quebec_tax NUMERIC NOT NULL,
        qpp NUMERIC NOT NULL,
        qpip NUMERIC NOT NULL,
        ei NUMERIC NOT NULL,
        hsf NUMERIC NOT NULL,
        labour_standards NUMERIC NOT NULL,
        employer_qpp NUMERIC NOT NULL,
        employer_qpip NUMERIC NOT NULL,
        employer_ei NUMERIC NOT NULL,
        total_employer_cost NUMERIC NOT NULL,
        vacation_pay NUMERIC,
        overtime_pay NUMERIC,
        bonus_pay NUMERIC,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- ApplechAI Invoice Auditor PostgreSQL Tables
      CREATE TABLE IF NOT EXISTS inv_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        password_hash TEXT,
        avatar_url TEXT,
        google_id TEXT,
        provider TEXT DEFAULT 'email',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inv_vendors (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        address TEXT,
        business_number TEXT,
        gst_hst_number TEXT,
        qst_number TEXT,
        pst_number TEXT,
        rst_number TEXT,
        business_type TEXT,
        main_product TEXT,
        product_examples TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inv_customers (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inv_invoices (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        vendor_id INTEGER REFERENCES inv_vendors(id) ON DELETE SET NULL,
        customer_id INTEGER REFERENCES inv_customers(id) ON DELETE SET NULL,
        invoice_number TEXT,
        po_number TEXT,
        invoice_date TEXT,
        due_date TEXT,
        language TEXT,
        currency TEXT,
        payment_terms TEXT,
        subtotal NUMERIC DEFAULT '0.00',
        zero_rated_subtotal NUMERIC DEFAULT '0.00',
        exempt_subtotal NUMERIC DEFAULT '0.00',
        shipping NUMERIC DEFAULT '0.00',
        freight NUMERIC DEFAULT '0.00',
        delivery NUMERIC DEFAULT '0.00',
        handling NUMERIC DEFAULT '0.00',
        recycle_fee NUMERIC DEFAULT '0.00',
        fuel_surcharge NUMERIC DEFAULT '0.00',
        surcharge NUMERIC DEFAULT '0.00',
        deposit NUMERIC DEFAULT '0.00',
        container_fee NUMERIC DEFAULT '0.00',
        environmental_fee NUMERIC DEFAULT '0.00',
        service_fee NUMERIC DEFAULT '0.00',
        tax_total NUMERIC DEFAULT '0.00',
        total_amount NUMERIC DEFAULT '0.00',
        tax_gst NUMERIC DEFAULT '0.00',
        tax_pst NUMERIC DEFAULT '0.00',
        tax_hst NUMERIC DEFAULT '0.00',
        tax_qst NUMERIC DEFAULT '0.00',
        tax_rst NUMERIC DEFAULT '0.00',
        province TEXT,
        tax_group TEXT,
        summary TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inv_invoice_items (
        id SERIAL PRIMARY KEY,
        user_id TEXT,
        invoice_id INTEGER REFERENCES inv_invoices(id) ON DELETE CASCADE,
        description TEXT,
        quantity NUMERIC DEFAULT '1.000',
        unit_price NUMERIC DEFAULT '0.00',
        amount NUMERIC DEFAULT '0.00',
        tax NUMERIC DEFAULT '0.00',
        tax_rate NUMERIC DEFAULT '0.0000',
        is_tax_exempt BOOLEAN DEFAULT FALSE,
        taxability_group TEXT,
        tax_gst NUMERIC DEFAULT '0.00',
        tax_pst NUMERIC DEFAULT '0.00',
        tax_hst NUMERIC DEFAULT '0.00',
        tax_qst NUMERIC DEFAULT '0.00',
        tax_rst NUMERIC DEFAULT '0.00',
        category TEXT,
        category_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Gantavya TripLog GPS PostgreSQL Tables
      CREATE TABLE IF NOT EXISTS gps_users (
        id SERIAL PRIMARY KEY,
        username TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS gps_trips (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES gps_users(id) ON DELETE CASCADE,
        local_id TEXT UNIQUE,
        date TIMESTAMP DEFAULT NOW(),
        duration INTEGER,
        distance NUMERIC,
        max_speed NUMERIC,
        avg_speed NUMERIC,
        calories NUMERIC,
        score INTEGER,
        overspeed_seconds INTEGER DEFAULT 0,
        status TEXT DEFAULT 'recorded',
        expense_id TEXT,
        route JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE gps_trips ADD COLUMN IF NOT EXISTS overspeed_seconds INTEGER DEFAULT 0;
      ALTER TABLE gps_trips ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'recorded';
      ALTER TABLE gps_trips ADD COLUMN IF NOT EXISTS expense_id TEXT;

      CREATE TABLE IF NOT EXISTS calculation_logs (
        id TEXT PRIMARY KEY,
        input_payload TEXT,
        intermediate_values TEXT,
        timestamp TIMESTAMP DEFAULT NOW(),
        processed_by TEXT
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        source TEXT,
        source_id TEXT,
        source_line_id TEXT,
        calculation_log_id TEXT,
        idempotency_key TEXT UNIQUE,
        amount NUMERIC,
        currency TEXT DEFAULT 'CAD',
        status TEXT DEFAULT 'pending_approval',
        description TEXT,
        user_id TEXT,
        company_id TEXT,
        metadata TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      -- Time Tracking, Timesheet and Leave/Absence Management Tables
      CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        hours NUMERIC DEFAULT '8.00',
        entry_type TEXT DEFAULT 'regular',
        project_task TEXT,
        billable BOOLEAN DEFAULT TRUE,
        hourly_rate NUMERIC,
        status TEXT DEFAULT 'submitted',
        payroll_stub_id TEXT,
        notes TEXT,
        submitted_at TIMESTAMP DEFAULT NOW(),
        approved_at TIMESTAMP,
        approved_by TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS leave_requests (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        employee_name TEXT NOT NULL,
        leave_type TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        total_days NUMERIC DEFAULT '1.00',
        total_hours NUMERIC DEFAULT '8.00',
        is_paid BOOLEAN DEFAULT TRUE,
        reason TEXT,
        status TEXT DEFAULT 'pending',
        reviewed_by TEXT,
        reviewed_at TIMESTAMP,
        rejection_reason TEXT,
        applied_to_payroll BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS employee_leave_balances (
        id TEXT PRIMARY KEY,
        employee_id TEXT NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
        fiscal_year INTEGER DEFAULT 2026,
        vacation_total_days NUMERIC DEFAULT '15.00',
        vacation_used_days NUMERIC DEFAULT '0.00',
        sick_total_days NUMERIC DEFAULT '10.00',
        sick_used_days NUMERIC DEFAULT '0.00',
        personal_total_days NUMERIC DEFAULT '3.00',
        personal_used_days NUMERIC DEFAULT '0.00',
        rtt_compensatory_hours NUMERIC DEFAULT '0.00',
        updated_at TIMESTAMP DEFAULT NOW()
      );

      -- Auxiliary indexes for high-performance lookups across modules
      CREATE INDEX IF NOT EXISTS idx_gps_trips_user ON gps_trips(user_id);
      CREATE INDEX IF NOT EXISTS idx_gps_trips_date ON gps_trips(date);
      CREATE INDEX IF NOT EXISTS idx_gps_trips_local_id ON gps_trips(local_id);
      CREATE INDEX IF NOT EXISTS idx_inv_invoices_user ON inv_invoices(user_id);
      CREATE INDEX IF NOT EXISTS idx_inv_invoices_vendor ON inv_invoices(vendor_id);
      CREATE INDEX IF NOT EXISTS idx_inv_invoices_num ON inv_invoices(invoice_number);
      CREATE INDEX IF NOT EXISTS idx_inv_items_invoice ON inv_invoice_items(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_inv_vendors_user ON inv_vendors(user_id);
      CREATE INDEX IF NOT EXISTS idx_inv_vendors_name ON inv_vendors(name);
      CREATE INDEX IF NOT EXISTS idx_expenses_user ON expenses(user_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_source ON expenses(source, source_id);
      CREATE INDEX IF NOT EXISTS idx_biz_expenses_source ON business_expenses(source, source_id);

      -- Seed Tax Constants for 2024, 2025, 2026
      INSERT INTO qc_payroll_tax_constants (
        tax_year, qpp_basic_exemption, qpp_mpe, qpp_yampe, 
        qpp_tier1_ee_rate, qpp_tier1_er_rate, qpp_tier2_ee_rate, qpp_tier2_er_rate, 
        qpip_mie, qpip_ee_rate, qpip_er_rate, cnesst_max_insurable
      ) VALUES 
      (2024, '3500.00', '68500.00', '73200.00', '0.0640', '0.0640', '0.0400', '0.0400', '94000.00', '0.00494', '0.00692', '94000.00'),
      (2025, '3500.00', '68500.00', '73200.00', '0.0640', '0.0640', '0.0400', '0.0400', '94000.00', '0.00494', '0.00692', '94000.00'),
      (2026, '3500.00', '68500.00', '77200.00', '0.0640', '0.0640', '0.0400', '0.0400', '94000.00', '0.00494', '0.00692', '94000.00')
      ON CONFLICT (tax_year) DO NOTHING;

      -- Seed Company Settings
      INSERT INTO company_settings (
        id, company_name, neq, federal_id, default_frequency, language
      ) VALUES (
        'global', 'ApplepAI Inc.', '1178901234', '123456789 RP 0001', 'bi-weekly', 'fr'
      ) ON CONFLICT (id) DO NOTHING;

      -- Seed Initial Sample Employees if empty
      INSERT INTO employees (
        id, first_name, last_name, preferred_name, middle_initial, sin, dob, email, phone,
        hire_date, pay_schedule, pay_type, pay_rate, vacation_policy, status, start_date,
        employment_type, department, job_title, base_salary, frequency, vacation_rate,
        onboarding_status, address, city, province, postal_code
      ) VALUES 
      ('emp_1', 'Jean', 'Tremblay', 'Jean', 'M', '123-456-789', '1985-05-12', 'jean.tremblay@example.com', '514-555-0192',
       '2022-01-15', 'bi_weekly', 'salary', '3200.00', 'accrue_per_period', 'active', '2022-01-15',
       'full_time', 'Engineering', 'Senior Developer', '3200.00', 'bi-weekly', '0.04',
       'completed', '1234 Rue Sainte-Catherine', 'Montréal', 'QC', 'H3B 1A1'),
      ('emp_2', 'Sophie', 'Gagnon', 'Sophie', 'A', '987-654-321', '1990-09-24', 'sophie.gagnon@example.com', '418-555-0143',
       '2023-03-01', 'bi_weekly', 'salary', '2800.00', 'accrue_per_period', 'active', '2023-03-01',
       'full_time', 'Marketing', 'Marketing Manager', '2800.00', 'bi-weekly', '0.04',
       'completed', '5678 Boulevard René-Lévesque', 'Québec', 'QC', 'G1R 2L3')
      ON CONFLICT (id) DO NOTHING;

      -- Seed Initial Sample Pay Stubs if empty
      INSERT INTO pay_stubs (
        id, employee_id, employee_name, date, pay_period, gross_pay, net_pay, total_deductions,
        federal_tax, quebec_tax, qpp, qpip, ei, hsf, labour_standards, employer_qpp, employer_qpip,
        employer_ei, total_employer_cost
      ) VALUES 
      ('stub_1', 'emp_1', 'Jean Tremblay', '2026-09-15', '2026-09-01 - 2026-09-15', '3200.00', '2350.50', '849.50',
       '320.00', '350.00', '182.50', '15.80', '41.20', '52.80', '2.24', '182.50', '22.14',
       '57.68', '3517.36')
      ON CONFLICT (id) DO NOTHING;
    `);

    console.log("Database schema successfully verified and synced.");
  } catch (err) {
    console.error("Error during database schema sync:", err);
  } finally {
    if (pgClient) {
      pgClient.release();
    }
  }
}
