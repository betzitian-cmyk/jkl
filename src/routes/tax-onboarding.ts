import express from "express";
import { z } from "zod";
import { db } from "../db";
import { employees } from "../db/schema";
import { eq } from "drizzle-orm";
import { 
  sanitizeTaxPayload, 
  hydrateTaxDefaults 
} from "../services/taxEngine";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // 1. Sanitize incoming payload
    const sanitized = sanitizeTaxPayload(req.body);

    // 2. Fetch Employee Context
    const targetEmployeeId = sanitized.employeeId || "emp_987234";
    const employeeList = await db.select().from(employees).where(eq(employees.id, targetEmployeeId)).limit(1);
    
    const annualIncome = employeeList.length > 0 
      ? Number(employeeList[0].payRate || 75000) 
      : 75000;

    // 3. Hydrate Statutory Defaults
    const hydratedData = hydrateTaxDefaults(sanitized, annualIncome);

    // 4. Persistence Mapping
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

    console.log('Tax Profile Processed:', updatePayload);

    return res.status(201).json({ 
      message: 'Tax onboarding configurations successfully processed.', 
      data: {
        ...hydratedData,
        employeeId: targetEmployeeId
      }
    });

  } catch (error) {
    console.error('Unhandled system exception in tax API controller:', error);
    return res.status(500).json({ error: 'An unexpected system execution failure occurred.' });
  }
});

export default router;
