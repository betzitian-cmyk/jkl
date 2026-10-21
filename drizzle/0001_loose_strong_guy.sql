CREATE TYPE "public"."doc_type" AS ENUM('RAMQ_SPOUSAL_PROOF', 'GARNISHMENT_ORDER', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."plan_post_validation" AS ENUM('single', 'family', 'couple', 'opt_out');--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "fed_tax_credit_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "fed_additional_tax" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "fed_additional_tax" SET DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "prov_tax_credit_amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "prov_additional_tax" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "prov_additional_tax" SET DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "spouse_plan_details" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "selected_plan_post_validation" SET DATA TYPE "public"."plan_post_validation" USING "selected_plan_post_validation"::"public"."plan_post_validation";--> statement-breakpoint
ALTER TABLE "employees" ALTER COLUMN "garnishment_categories" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "onboarding_documents" ALTER COLUMN "doc_type" SET DATA TYPE "public"."doc_type" USING "doc_type"::"public"."doc_type";