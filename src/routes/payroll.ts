
import express, { Request, Response } from 'express';
import { db } from '../db';
import { employees, payStubs } from '../db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { z } from 'zod';
import { calculateNetPay, YtdSnapshot } from '../services/payrollCalculator';
import crypto from 'crypto';

const router = express.Router();

const PayrollRequestSchema = z.object({
  employeeId: z.string(),
  grossPay: z.number().positive(),
  payDate: z.string() // expected format YYYY-MM-DD
});

router.post('/calculate', async (req: Request, res: Response) => {
  try {
    // 1. Validate Input
    const validated = PayrollRequestSchema.parse(req.body);
    const { employeeId, grossPay, payDate } = validated;

    // 2. Fetch Employee Config and Current YTD
    const employee = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);
    
    if (employee.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const emp = employee[0];
    const year = new Date(payDate).getFullYear();

    // Fetch YTD from existing pay stubs for this year (PostgreSQL / PGlite compliant)
    const ytdResults = await db.select({
      ytd_gross: sql<number>`COALESCE(SUM(CAST(${payStubs.grossPay} AS NUMERIC)), 0)`,
      ytd_qpp: sql<number>`COALESCE(SUM(CAST(${payStubs.qpp} AS NUMERIC)), 0)`,
      ytd_qpip: sql<number>`COALESCE(SUM(CAST(${payStubs.qpip} AS NUMERIC)), 0)`,
      ytd_ei: sql<number>`COALESCE(SUM(CAST(${payStubs.ei} AS NUMERIC)), 0)`
    })
    .from(payStubs)
    .where(
      and(
        eq(payStubs.employeeId, employeeId),
        sql`SUBSTR(${payStubs.date}, 1, 4) = ${year.toString()}`
      )
    );

    const ytd = ytdResults[0];

    // Determine pay periods based on schedule
    const scheduleToPeriods: Record<string, number> = {
      'weekly': 52,
      'bi-weekly': 26,
      'bi_weekly': 26,
      'semi-monthly': 24,
      'semi_monthly': 24,
      'monthly': 12
    };

    const periods = scheduleToPeriods[emp.paySchedule || emp.frequency || 'bi-weekly'] || 26;

    const ytdSnapshot: YtdSnapshot = {
      pay_periods_per_year: periods,
      ytd_gross: Number(ytd.ytd_gross),
      ytd_qpp1: Number(ytd.ytd_qpp), // Assuming existing qpp is Tier 1 for simplicity in migration
      ytd_qpp2: 0,
      ytd_qpip: Number(ytd.ytd_qpip),
      ytd_ei: Number(ytd.ytd_ei)
    };

    // 3. Execute Core Business Logic
    const result = calculateNetPay(grossPay, ytdSnapshot);

    // 4. Construct DB Payload
    const stubId = crypto.randomUUID();
    const newStub = {
      id: stubId,
      employeeId: employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      date: payDate,
      payPeriod: `${payDate} - ${payDate}`, // Simplified
      grossPay: result.grossPay.toString(),
      netPay: result.netPay.toString(),
      totalDeductions: result.totalDeductions.toString(),
      federalTax: result.federalTax.toString(),
      quebecTax: result.provTax.toString(),
      qpp: (result.qpp1 + result.qpp2).toString(),
      qpip: result.qpip.toString(),
      ei: result.ei.toString(),
      hsf: "0", // Need to calculate HSF if needed for stub
      labourStandards: "0",
      employerQPP: (result.qpp1 + result.qpp2).toString(), // simplified
      employerQPIP: result.qpip.toString(),
      employerEI: (result.ei * 1.4).toString(),
      totalEmployerCost: (result.grossPay + (result.qpp1 + result.qpp2) + result.qpip + (result.ei * 1.4)).toString(),
    };

    // 5. Persist Record
    await db.insert(payStubs).values(newStub);

    // 6. Return Response
    return res.status(201).json({
      message: 'Payroll processed successfully',
      stub: newStub,
      periodResult: result
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.issues });
    }
    console.error('Payroll processing error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
