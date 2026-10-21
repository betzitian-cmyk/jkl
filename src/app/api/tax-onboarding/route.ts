import { z } from "zod";
import { db } from "../../../db";
import { employees } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { 
  sanitizeTaxPayload, 
  hydrateTaxDefaults 
} from "../../../services/taxEngine";

/**
 * 2026 Statutory Tax Onboarding API Handler
 * Processes and hydrates tax defaults using the centralized taxEngine service.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Sanitize incoming payload (handles currency formatting and empty strings)
    const sanitized = sanitizeTaxPayload(body);

    // 2. Fetch Employee Context (for income-based clawback logic)
    const targetEmployeeId = sanitized.employeeId || "emp_987234";
    const employeeList = await db.select().from(employees).where(eq(employees.id, targetEmployeeId)).limit(1);
    
    const annualIncome = employeeList.length > 0 
      ? Number(employeeList[0].payRate || 75000) 
      : 75000;

    // 3. Hydrate Statutory Defaults
    const hydratedData = hydrateTaxDefaults(sanitized, annualIncome);

    // 4. Persistence
    const updatePayload = {
      fedTaxCreditAmount: hydratedData.fedTaxCreditAmount.toString(),
      fedAdditionalTax: hydratedData.fedAdditionalTax.toString(),
      provTaxCreditAmount: hydratedData.provTaxCreditAmount.toString(),
      provAdditionalTax: hydratedData.provAdditionalTax.toString(),
      isFedDefaultApplied: hydratedData.isFedDefaultApplied,
      isProvDefaultApplied: hydratedData.isProvDefaultApplied,
      systemCalculatedBPA: hydratedData.systemCalculatedBPA.toString(),
      updatedAt: new Date()
    };

    if (employeeList.length > 0) {
      await db.update(employees).set(updatePayload).where(eq(employees.id, targetEmployeeId));
    }

    return new Response(JSON.stringify({
      message: 'Tax onboarding successfully processed.',
      data: {
        ...hydratedData,
        employeeId: targetEmployeeId
      }
    }), { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Tax API Failure:', error);
    return new Response(JSON.stringify({ error: 'Internal system failure processing tax onboarding.' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
