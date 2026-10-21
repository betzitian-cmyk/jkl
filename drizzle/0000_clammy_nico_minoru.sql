CREATE TABLE "business_expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"date" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric NOT NULL,
	"deductible_amount" numeric NOT NULL,
	"receipt_url" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cnesst_classifications" (
	"code" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"assessment_rate" numeric DEFAULT '0.0000' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"trade_name" text,
	"address" text,
	"city" text,
	"province" text DEFAULT 'QC',
	"postal_code" text,
	"phone" text,
	"email" text,
	"federal_id" text,
	"neq" text,
	"revenu_quebec_id" text,
	"cnesst_number" text,
	"hsf_rate_modifier" numeric DEFAULT '1.65',
	"hsf_sector" text DEFAULT 'services_other',
	"cnesst_rate" numeric DEFAULT '1.85',
	"cnesst_risk_code" text DEFAULT '69990',
	"wsdrf_applicable" boolean DEFAULT false,
	"estimated_annual_payroll" numeric DEFAULT '750000',
	"cpa_originator_id" text,
	"cpa_data_center" text DEFAULT '00100',
	"cpa_format" text DEFAULT '1464_byte',
	"disbursing_bank_name" text,
	"disbursing_institution" text,
	"disbursing_transit" text,
	"disbursing_account" text,
	"roe_contact_name" text,
	"roe_contact_phone" text,
	"roe_contact_email" text,
	"roe_web_api_key" text,
	"default_frequency" text DEFAULT 'bi-weekly',
	"default_province" text DEFAULT 'QC',
	"language" text DEFAULT 'fr',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employee_addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"province" text DEFAULT 'QC' NOT NULL,
	"postal_code" text NOT NULL,
	"mailing_address" text,
	CONSTRAINT "employee_addresses_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "employee_bank_details" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"payment_method" text DEFAULT 'direct_deposit' NOT NULL,
	"transit_number" text,
	"institution_number" text,
	"account_number" text,
	CONSTRAINT "employee_bank_details_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "employee_tax_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"federal_basic_amount" numeric DEFAULT '15705.00' NOT NULL,
	"federal_additional_tax" numeric DEFAULT '0.00' NOT NULL,
	"ei_exempt" boolean DEFAULT false NOT NULL,
	"qpp_exempt" boolean DEFAULT false NOT NULL,
	"qc_deduction_code" text DEFAULT 'A' NOT NULL,
	"qc_additional_tax" numeric DEFAULT '0.00' NOT NULL,
	"annual_deduction_tp1015" numeric DEFAULT '0.00' NOT NULL,
	"qpip_exempt" boolean DEFAULT false NOT NULL,
	"cnesst_classification" text,
	CONSTRAINT "employee_tax_profiles_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE "employee_taxable_benefits" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"benefit_type" text NOT NULL,
	"estimated_annual_value" numeric DEFAULT '0.00' NOT NULL,
	"pay_period_amount" numeric DEFAULT '0.00' NOT NULL,
	"rl1_box_code" text DEFAULT 'A' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"preferred_name" text,
	"middle_initial" text,
	"sin" text NOT NULL,
	"dob" text,
	"email" text NOT NULL,
	"phone" text,
	"hire_date" text NOT NULL,
	"pay_schedule" text NOT NULL,
	"pay_type" text NOT NULL,
	"pay_rate" numeric NOT NULL,
	"vacation_policy" text DEFAULT 'accrue_per_period' NOT NULL,
	"status" text DEFAULT 'pending_onboarding' NOT NULL,
	"start_date" text,
	"employment_type" text,
	"department" text,
	"job_title" text,
	"base_salary" numeric,
	"frequency" text,
	"vacation_rate" numeric,
	"hourly_rate" numeric,
	"onboarding_status" text,
	"fed_tax_credit_amount" numeric,
	"fed_additional_tax" numeric DEFAULT '0.00' NOT NULL,
	"prov_tax_credit_amount" numeric,
	"prov_additional_tax" numeric DEFAULT '0.00' NOT NULL,
	"is_fed_bpa_clawbacked" boolean DEFAULT false NOT NULL,
	"is_covered_by_spouse_plan" boolean DEFAULT false NOT NULL,
	"spouse_plan_details" text,
	"selected_plan_post_validation" text,
	"validation_completion_date" text,
	"has_active_garnishments" boolean DEFAULT false NOT NULL,
	"garnishment_categories" text,
	"garnishment_doc_provided" boolean DEFAULT false NOT NULL,
	"payroll_lock_flag" text,
	"electronic_consent_t4_rl1" boolean DEFAULT false NOT NULL,
	"tax_delivery_email" text,
	"tax_consent_timestamp" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "employees_sin_unique" UNIQUE("sin"),
	CONSTRAINT "employees_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "onboarding_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"action" text NOT NULL,
	"details" text,
	"performed_by" text DEFAULT 'SYSTEM',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"doc_type" text NOT NULL,
	"original_name" text NOT NULL,
	"stored_filename" text NOT NULL,
	"file_path" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"uploaded_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pay_stub_line_items" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"payroll_run_id" text NOT NULL,
	"gross_pay" numeric NOT NULL,
	"qpp_tier1_ee" numeric DEFAULT '0.00' NOT NULL,
	"qpp_tier1_er" numeric DEFAULT '0.00' NOT NULL,
	"qpp_tier2_ee" numeric DEFAULT '0.00' NOT NULL,
	"qpp_tier2_er" numeric DEFAULT '0.00' NOT NULL,
	"qpip_ee" numeric DEFAULT '0.00' NOT NULL,
	"qpip_er" numeric DEFAULT '0.00' NOT NULL,
	"qc_income_tax_ee" numeric DEFAULT '0.00' NOT NULL,
	"fed_income_tax_ee" numeric DEFAULT '0.00' NOT NULL,
	"hsf_employer_tax" numeric DEFAULT '0.00' NOT NULL,
	"cnesst_employer_premium" numeric DEFAULT '0.00' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pay_stubs" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"employee_name" text NOT NULL,
	"date" text NOT NULL,
	"pay_period" text NOT NULL,
	"gross_pay" numeric NOT NULL,
	"net_pay" numeric NOT NULL,
	"total_deductions" numeric NOT NULL,
	"federal_tax" numeric NOT NULL,
	"quebec_tax" numeric NOT NULL,
	"qpp" numeric NOT NULL,
	"qpip" numeric NOT NULL,
	"ei" numeric NOT NULL,
	"hsf" numeric NOT NULL,
	"labour_standards" numeric NOT NULL,
	"employer_qpp" numeric NOT NULL,
	"employer_qpip" numeric NOT NULL,
	"employer_ei" numeric NOT NULL,
	"total_employer_cost" numeric NOT NULL,
	"vacation_pay" numeric,
	"overtime_pay" numeric,
	"bonus_pay" numeric,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"pay_period_start" text NOT NULL,
	"pay_period_end" text NOT NULL,
	"pay_date" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qc_deduction_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"base_deduction_amount" numeric DEFAULT '0.00' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qc_payroll_tax_constants" (
	"tax_year" integer PRIMARY KEY NOT NULL,
	"qpp_basic_exemption" numeric DEFAULT '3500.00' NOT NULL,
	"qpp_mpe" numeric NOT NULL,
	"qpp_yampe" numeric NOT NULL,
	"qpp_tier1_ee_rate" numeric NOT NULL,
	"qpp_tier1_er_rate" numeric NOT NULL,
	"qpp_tier2_ee_rate" numeric NOT NULL,
	"qpp_tier2_er_rate" numeric NOT NULL,
	"qpip_mie" numeric NOT NULL,
	"qpip_ee_rate" numeric NOT NULL,
	"qpip_er_rate" numeric NOT NULL,
	"cnesst_max_insurable" numeric NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "taxable_benefits" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text,
	"employee_name" text,
	"date" text NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"total_amount" numeric NOT NULL,
	"taxable_amount" numeric NOT NULL,
	"non_taxable_amount" numeric NOT NULL,
	"rl1_box" text NOT NULL,
	"t4_box" text NOT NULL,
	"subject_to_qpp" boolean DEFAULT true,
	"subject_to_qpip" boolean DEFAULT false,
	"subject_to_ei" boolean DEFAULT false,
	"subject_to_tax" boolean DEFAULT true,
	"calculation_details" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "employee_addresses" ADD CONSTRAINT "employee_addresses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_bank_details" ADD CONSTRAINT "employee_bank_details_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_tax_profiles" ADD CONSTRAINT "employee_tax_profiles_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_taxable_benefits" ADD CONSTRAINT "employee_taxable_benefits_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_audit_logs" ADD CONSTRAINT "onboarding_audit_logs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_documents" ADD CONSTRAINT "onboarding_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pay_stub_line_items" ADD CONSTRAINT "pay_stub_line_items_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pay_stub_line_items" ADD CONSTRAINT "pay_stub_line_items_payroll_run_id_payroll_runs_id_fk" FOREIGN KEY ("payroll_run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pay_stubs" ADD CONSTRAINT "pay_stubs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;