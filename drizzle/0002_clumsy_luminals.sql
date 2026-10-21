ALTER TABLE "employees" ADD COLUMN "is_fed_default_applied" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "is_prov_default_applied" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "system_calculated_bpa" numeric(12, 2);