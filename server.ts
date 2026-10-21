import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { db, ensureSchema } from "./src/db";
import { employees, payStubs, businessExpenses, taxableBenefits, companySettings, employeeAddresses, employeeTaxProfiles, employeeBankDetails, qcPayrollTaxConstants, timeEntries, leaveRequests, employeeLeaveBalances } from "./src/db/schema";
import { eq, desc, inArray, or } from "drizzle-orm";
import crypto from "crypto";
import payrollRouter from "./src/routes/payroll";
import { ExpenseCreationService } from "./src/services/ExpenseCreationService";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Helper for JSON and numeric fields in DB
function parseEmployee(emp: any) {
  if (!emp) return emp;
  const parsed = { ...emp };
  if (typeof emp.garnishments === 'string') {
    try { parsed.garnishments = JSON.parse(emp.garnishments); } catch (e) { parsed.garnishments = []; }
  }
  if (typeof emp.benefitContributions === 'string') {
    try { parsed.benefitContributions = JSON.parse(emp.benefitContributions); } catch (e) { parsed.benefitContributions = null; }
  }
  if (typeof emp.permissions === 'string') {
    try { parsed.permissions = JSON.parse(emp.permissions); } catch (e) { parsed.permissions = null; }
  }
  parsed.baseSalary = Number(emp.baseSalary ?? emp.payRate ?? 0) || 0;
  parsed.payRate = Number(emp.payRate ?? emp.baseSalary ?? 0) || 0;
  parsed.vacationRate = emp.vacationRate !== null && emp.vacationRate !== undefined ? Number(emp.vacationRate) : 0.04;
  parsed.hourlyRate = emp.hourlyRate !== null && emp.hourlyRate !== undefined ? Number(emp.hourlyRate) : undefined;
  parsed.frequency = emp.frequency || (emp.paySchedule ? emp.paySchedule.replace('_', '-') : 'bi-weekly');
  return parsed;
}

function parsePayStub(stub: any) {
  if (!stub) return stub;
  return {
    ...stub,
    grossPay: Number(stub.grossPay) || 0,
    netPay: Number(stub.netPay) || 0,
    totalDeductions: Number(stub.totalDeductions) || 0,
    federalTax: Number(stub.federalTax) || 0,
    quebecTax: Number(stub.quebecTax) || 0,
    qpp: Number(stub.qpp) || 0,
    qpip: Number(stub.qpip) || 0,
    ei: Number(stub.ei) || 0,
    hsf: Number(stub.hsf) || 0,
    labourStandards: Number(stub.labourStandards) || 0,
    employerQPP: Number(stub.employerQPP) || 0,
    employerQPIP: Number(stub.employerQPIP) || 0,
    employerEI: Number(stub.employerEI) || 0,
    totalEmployerCost: Number(stub.totalEmployerCost) || 0,
    vacationPay: stub.vacationPay !== null && stub.vacationPay !== undefined ? Number(stub.vacationPay) : 0,
    overtimePay: stub.overtimePay !== null && stub.overtimePay !== undefined ? Number(stub.overtimePay) : 0,
    bonusPay: stub.bonusPay !== null && stub.bonusPay !== undefined ? Number(stub.bonusPay) : 0,
  };
}

function stringifyEmployee(emp: any) {
  if (!emp) return emp;
  const stringified = { ...emp };
  if (emp.garnishments && typeof emp.garnishments !== 'string') {
    stringified.garnishments = JSON.stringify(emp.garnishments);
  }
  if (emp.benefitContributions && typeof emp.benefitContributions !== 'string') {
    stringified.benefitContributions = JSON.stringify(emp.benefitContributions);
  }
  if (emp.permissions && typeof emp.permissions !== 'string') {
    stringified.permissions = JSON.stringify(emp.permissions);
  }
  return stringified;
}

// API Routes
app.use("/api/payroll", payrollRouter);

app.get("/api/tax-constants/:year", async (req, res) => {
  try {
    const year = parseInt(req.params.year) || 2026;
    const constants = await db.select().from(qcPayrollTaxConstants).where(eq(qcPayrollTaxConstants.taxYear, year)).limit(1);
    if (constants.length === 0) {
      return res.json({
        taxYear: year,
        qppBasicExemption: 3500,
        qppMpe: 68500,
        qppYampe: year >= 2026 ? 77200 : 73200,
        qppTier1EeRate: 0.0640,
        qppTier1ErRate: 0.0640,
        qppTier2EeRate: 0.0400,
        qppTier2ErRate: 0.0400,
        qpipMie: 94000,
        qpipEeRate: 0.00494,
        qpipErRate: 0.00692,
        cnesstMaxInsurable: 94000
      });
    }
    // Convert numeric strings to numbers
    const c = constants[0];
    res.json({
      ...c,
      qppBasicExemption: Number(c.qppBasicExemption),
      qppMpe: Number(c.qppMpe),
      qppYampe: Number(c.qppYampe),
      qppTier1EeRate: Number(c.qppTier1EeRate),
      qppTier1ErRate: Number(c.qppTier1ErRate),
      qppTier2EeRate: Number(c.qppTier2EeRate),
      qppTier2ErRate: Number(c.qppTier2ErRate),
      qpipMie: Number(c.qpipMie),
      qpipEeRate: Number(c.qpipEeRate),
      qpipErRate: Number(c.qpipErRate),
      cnesstMaxInsurable: Number(c.cnesstMaxInsurable)
    });
  } catch (error) {
    console.error("Error fetching tax constants:", error);
    res.json({
      taxYear: 2026,
      qppBasicExemption: 3500,
      qppMpe: 68500,
      qppYampe: 77200,
      qppTier1EeRate: 0.0640,
      qppTier1ErRate: 0.0640,
      qppTier2EeRate: 0.0400,
      qppTier2ErRate: 0.0400,
      qpipMie: 94000,
      qpipEeRate: 0.00494,
      qpipErRate: 0.00692,
      cnesstMaxInsurable: 94000
    });
  }
});

import onboardingRouter from "./src/routes/onboarding";
import taxOnboardingRouter from "./src/routes/tax-onboarding";
import invAppRoutes from "./src/routes/invAppRoutes";
import gpsRouter from "./src/routes/gpsRoutes";
import questionnaireRouter from "./src/routes/questionnaireRoutes";

app.use("/api/v1/onboard", onboardingRouter);
app.use("/api/v1", questionnaireRouter);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(express.static(path.join(process.cwd(), "public")));
app.use("/api/tax-onboarding", taxOnboardingRouter);
app.use("/api", invAppRoutes);
app.use(invAppRoutes);
app.use(gpsRouter);

app.post("/api/onboarding", async (req, res) => {
  res.status(410).json({ error: 'This route is deprecated. Use /api/v1/onboard' });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Consolidated Database Status endpoint for PaieQuébec, Invoice Audit, and GPS Speedometer
app.get("/api/db-status", async (req, res) => {
  try {
    const { pool, pgliteInstance } = await import("./src/db/index");
    let versionRows: any[] = [];
    let countsRows: any[] = [];

    const queryStr1 = "SELECT version(), current_database() as db_name;";
    const queryStr2 = `
      SELECT 
        (SELECT COUNT(*) FROM employees) as employee_count,
        (SELECT COUNT(*) FROM pay_stubs) as pay_stub_count,
        (SELECT COUNT(*) FROM business_expenses) as expense_count,
        (SELECT COUNT(*) FROM gps_trips) as gps_trip_count,
        (SELECT COUNT(*) FROM inv_invoices) as invoice_count,
        (SELECT COUNT(*) FROM inv_vendors) as vendor_count,
        (SELECT COUNT(*) FROM inv_invoice_items) as invoice_item_count,
        (SELECT COUNT(*) FROM time_entries) as timesheet_count,
        (SELECT COUNT(*) FROM leave_requests) as leave_request_count
    `;

    if (pool) {
      const res1 = await pool.query(queryStr1);
      const res2 = await pool.query(queryStr2);
      versionRows = res1.rows;
      countsRows = res2.rows;
    } else if (pgliteInstance) {
      const res1 = await pgliteInstance.query(queryStr1);
      const res2 = await pgliteInstance.query(queryStr2);
      versionRows = res1.rows;
      countsRows = res2.rows;
    }

    res.json({
      status: "connected",
      engine: pool ? "PostgreSQL (External Cloud SQL / Pool)" : "PGlite (Embedded PostgreSQL 18.3 WASM)",
      host: process.env.SQL_HOST || (pool ? 'Cloud SQL' : 'Local Embedded Container'),
      database: versionRows[0]?.db_name || 'postgres',
      postgresVersion: versionRows[0]?.version || 'PostgreSQL 18.3 (WASM)',
      counts: countsRows[0] || {}
    });
  } catch (error: any) {
    console.error("Database status check error:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Employees API
app.get("/api/employees", async (req, res) => {
  try {
    const allEmployees = await db.select().from(employees);
    const parsed = allEmployees.map(parseEmployee);
    const seen = new Set();
    const deduped = parsed.filter(emp => {
      if (!emp || !emp.id) return false;
      if (seen.has(emp.id)) return false;
      seen.add(emp.id);
      return true;
    });
    res.json(deduped);
  } catch (error: any) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/employees", async (req, res) => {
  try {
    const data = req.body;

    const empId = (data.id && String(data.id).trim()) || ('emp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
    const cleanEmail = (data.email && String(data.email).trim()) || `employee_${Date.now()}_${Math.floor(Math.random()*1000)}@paiequebec.ca`;
    const cleanSin = (data.sin && String(data.sin).trim()) || `${Math.floor(100000000 + Math.random() * 900000000)}`;

    const payRateVal = String(data.payRate ?? data.baseSalary ?? data.hourlyRate ?? 0);
    const baseSalaryVal = String(data.baseSalary ?? data.payRate ?? 0);
    const hourlyRateVal = data.hourlyRate !== undefined && data.hourlyRate !== null ? String(data.hourlyRate) : null;
    const vacationRateVal = String(data.vacationRate ?? 0.04);

    const stringifiedPermissions = data.permissions 
      ? (typeof data.permissions === 'string' ? data.permissions : JSON.stringify(data.permissions)) 
      : null;
    const stringifiedGarnishments = data.garnishments 
      ? (typeof data.garnishments === 'string' ? data.garnishments : JSON.stringify(data.garnishments)) 
      : null;
    const stringifiedBenefitContributions = data.benefitContributions 
      ? (typeof data.benefitContributions === 'string' ? data.benefitContributions : JSON.stringify(data.benefitContributions)) 
      : null;

    const empValues = {
      id: empId,
      firstName: data.firstName || 'Employé',
      lastName: data.lastName || 'Anonyme',
      preferredName: data.preferredName || null,
      middleInitial: data.middleInitial || null,
      sin: cleanSin,
      dob: data.dob || null,
      email: cleanEmail,
      phone: data.phone || null,
      hireDate: data.hireDate || data.startDate || new Date().toISOString().split('T')[0],
      paySchedule: data.paySchedule || (data.frequency ? data.frequency.replace('-', '_') : 'bi_weekly'),
      payType: data.payType || data.employmentType || 'salary',
      payRate: payRateVal,
      vacationPolicy: data.vacationPolicy || 'accrue_per_period',
      status: data.status || 'active',
      startDate: data.startDate || data.hireDate || new Date().toISOString().split('T')[0],
      employmentType: data.employmentType || 'full-time',
      department: data.department || 'Administration',
      jobTitle: data.jobTitle || 'Spécialiste',
      baseSalary: baseSalaryVal,
      frequency: data.frequency || 'bi-weekly',
      vacationRate: vacationRateVal,
      hourlyRate: hourlyRateVal,
      onboardingStatus: data.onboardingStatus || 'incomplete',
      permissions: stringifiedPermissions,
      garnishments: stringifiedGarnishments,
      benefitContributions: stringifiedBenefitContributions,
    };

    // Check if employee with same ID exists
    const existingById = await db.select().from(employees).where(eq(employees.id, empId)).limit(1);

    if (existingById.length > 0) {
      // Update existing record (exclude primary key 'id' from set clause)
      const { id: _, ...updatePayload } = empValues;
      await db.update(employees).set(updatePayload).where(eq(employees.id, empId));
      return res.json(parseEmployee({ ...existingById[0], ...updatePayload, id: empId }));
    }

    // Check if employee with same email or SIN exists
    const existingByEmailOrSin = await db.select().from(employees).where(
      or(eq(employees.email, cleanEmail), eq(employees.sin, cleanSin))
    ).limit(1);

    if (existingByEmailOrSin.length > 0) {
      const matchId = existingByEmailOrSin[0].id;
      const { id: _, ...updatePayload } = empValues;
      await db.update(employees).set(updatePayload).where(eq(employees.id, matchId));
      return res.json(parseEmployee({ ...existingByEmailOrSin[0], ...updatePayload, id: matchId }));
    }

    // Otherwise insert new record
    await db.insert(employees).values(empValues);
    res.status(201).json(parseEmployee(empValues));
  } catch (error: any) {
    console.error("Error creating employee:", error);
    res.status(500).json({ error: error.message || 'Failed to save employee' });
  }
});

app.put("/api/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const stringifiedPermissions = data.permissions 
      ? (typeof data.permissions === 'string' ? data.permissions : JSON.stringify(data.permissions)) 
      : undefined;
    const stringifiedGarnishments = data.garnishments 
      ? (typeof data.garnishments === 'string' ? data.garnishments : JSON.stringify(data.garnishments)) 
      : undefined;
    const stringifiedBenefitContributions = data.benefitContributions 
      ? (typeof data.benefitContributions === 'string' ? data.benefitContributions : JSON.stringify(data.benefitContributions)) 
      : undefined;

    const updatedEmployee: Record<string, any> = {
      firstName: data.firstName,
      lastName: data.lastName,
      preferredName: data.preferredName,
      middleInitial: data.middleInitial,
      dob: data.dob,
      phone: data.phone,
      hireDate: data.hireDate || data.startDate,
      paySchedule: data.paySchedule || (data.frequency ? data.frequency.replace('-', '_') : undefined),
      payType: data.payType || data.employmentType,
      payRate: data.payRate !== undefined ? String(data.payRate) : (data.baseSalary !== undefined ? String(data.baseSalary) : undefined),
      vacationPolicy: data.vacationPolicy,
      status: data.status,
      startDate: data.startDate,
      employmentType: data.employmentType,
      department: data.department,
      jobTitle: data.jobTitle,
      baseSalary: data.baseSalary !== undefined ? String(data.baseSalary) : undefined,
      frequency: data.frequency,
      vacationRate: data.vacationRate !== undefined ? String(data.vacationRate) : undefined,
      hourlyRate: data.hourlyRate !== undefined && data.hourlyRate !== null ? String(data.hourlyRate) : undefined,
      onboardingStatus: data.onboardingStatus,
    };

    if (data.sin) updatedEmployee.sin = String(data.sin).trim();
    if (data.email) updatedEmployee.email = String(data.email).trim();
    if (stringifiedPermissions !== undefined) updatedEmployee.permissions = stringifiedPermissions;
    if (stringifiedGarnishments !== undefined) updatedEmployee.garnishments = stringifiedGarnishments;
    if (stringifiedBenefitContributions !== undefined) updatedEmployee.benefitContributions = stringifiedBenefitContributions;

    // Clean undefined keys
    Object.keys(updatedEmployee).forEach(key => {
      if (updatedEmployee[key] === undefined) {
        delete updatedEmployee[key];
      }
    });

    const existing = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
    if (existing.length === 0) {
      const newEmp = {
        id,
        firstName: data.firstName || 'Employé',
        lastName: data.lastName || 'Anonyme',
        sin: data.sin ? String(data.sin).trim() : `${Math.floor(100000000 + Math.random() * 900000000)}`,
        email: data.email ? String(data.email).trim() : `employee_${Date.now()}@paiequebec.ca`,
        hireDate: data.hireDate || data.startDate || new Date().toISOString().split('T')[0],
        paySchedule: data.paySchedule || 'bi_weekly',
        payType: data.payType || 'salary',
        payRate: String(data.payRate ?? data.baseSalary ?? 0),
        ...updatedEmployee
      };
      await db.insert(employees).values(newEmp);
      return res.json({ success: true, id });
    }

    await db.update(employees).set(updatedEmployee).where(eq(employees.id, id));
    res.json({ success: true, id });
  } catch (error: any) {
    console.error("Error updating employee:", error);
    res.status(500).json({ error: error.message || 'Failed to update employee' });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(employees).where(eq(employees.id, id));
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ error: error.message });
  }
});

// Pay Stubs API
app.get("/api/pay-stubs", async (req, res) => {
  try {
    const allStubs = await db.select().from(payStubs);
    res.json(allStubs.map(parsePayStub));
  } catch (error: any) {
    console.error("Error fetching pay stubs:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/pay-stubs", async (req, res) => {
  try {
    const newStub = req.body;
    await db.insert(payStubs).values(newStub);
    res.status(201).json(newStub);
  } catch (error: any) {
    console.error("Error creating pay stub:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/pay-stubs/batch", async (req, res) => {
  try {
    const stubsList = req.body;
    if (!Array.isArray(stubsList)) {
      return res.status(400).json({ error: "Expected an array of pay stubs" });
    }
    const inserted = [];
    for (const stub of stubsList) {
      await db.insert(payStubs).values(stub);
      inserted.push(parsePayStub(stub));
    }
    res.status(201).json(inserted);
  } catch (error: any) {
    console.error("Error batch creating pay stubs:", error);
    res.status(500).json({ error: error.message });
  }
});

// Business Expenses API
app.get("/api/expenses", async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    let query = db.select().from(businessExpenses);
    
    const allExpenses = await query.orderBy(desc(businessExpenses.createdAt));

    // Seed sample expenses if completely empty to provide an immediate active workflow
    if (allExpenses.length === 0) {
      const initialSeed = [
        {
          id: 'exp_seed_001',
          date: '2026-03-12',
          category: 'Meals & Entertainment',
          description: 'Client Working Lunch - Q1 Strategy (Resto Le Filet, Montréal)',
          amount: '184.50',
          deductibleAmount: '92.25', // 50% CRA rule
          employeeId: 'emp_001',
          employeeName: 'Alexandre Tremblay',
          employeeEmail: 'a.tremblay@applepai.ca',
          source: 'invoice_audit',
          sourceId: 'FACT-2026-092',
          status: 'pending_approval',
          notes: 'Facture #FACT-2026-092 soumise via le module Invoice Audit.',
          taxBreakdown: JSON.stringify({ gst: 8.02, qst: 16.00 }),
        },
        {
          id: 'exp_seed_002',
          date: '2026-03-14',
          category: 'Office Supplies',
          description: 'Bureau en Gros - Écrans 4K et adaptateurs USB-C',
          amount: '482.90',
          deductibleAmount: '482.90',
          employeeId: 'emp_002',
          employeeName: 'Sophie Bouchard',
          employeeEmail: 's.bouchard@applepai.ca',
          source: 'invoice_audit',
          sourceId: 'STAPLES-88219',
          status: 'approved',
          approvedAt: new Date(Date.now() - 86400000),
          approvedBy: 'Admin RH (Direction)',
          approvalReason: 'Matériel bureautique approuvé pour le télétravail',
          notes: 'Facture #STAPLES-88219 - À rembourser sur la prochaine paie.',
          taxBreakdown: JSON.stringify({ gst: 21.00, qst: 41.89 }),
        },
        {
          id: 'exp_seed_003',
          date: '2026-03-05',
          category: 'Travel & Lodging',
          description: 'Hôtel Le Germain Québec - Rencontre ministérielle CNESST',
          amount: '315.00',
          deductibleAmount: '315.00',
          employeeId: 'emp_003',
          employeeName: 'Marc-André Fortin',
          employeeEmail: 'ma.fortin@applepai.ca',
          source: 'invoice_audit',
          sourceId: 'GERMAIN-4412',
          status: 'reimbursed',
          approvedAt: new Date(Date.now() - 172800000),
          approvedBy: 'Admin RH (Direction)',
          reimbursedAt: new Date(Date.now() - 86400000),
          reimbursedBy: 'Admin RH (Direction)',
          reimbursementMethod: 'Dépôt direct de paie (Direct Deposit)',
          reimbursementRef: 'REIMB-2026-0041',
          notes: 'Remboursement versé avec succès.',
          taxBreakdown: JSON.stringify({ gst: 13.70, qst: 27.33 }),
        }
      ];

      for (const item of initialSeed) {
        await db.insert(businessExpenses).values(item);
      }

      return res.json(initialSeed.map(e => ({
        ...e,
        amount: parseFloat(e.amount),
        deductibleAmount: parseFloat(e.deductibleAmount),
        taxBreakdown: e.taxBreakdown ? JSON.parse(e.taxBreakdown) : undefined
      })));
    }

    let filtered = allExpenses;
    if (status && typeof status === 'string' && status !== 'all') {
      filtered = filtered.filter((e: any) => e.status === status);
    }
    if (employeeId && typeof employeeId === 'string' && employeeId !== 'all') {
      filtered = filtered.filter((e: any) => e.employeeId === employeeId);
    }

    const parsed = filtered.map((e: any) => ({
      ...e,
      amount: parseFloat(e.amount),
      deductibleAmount: parseFloat(e.deductibleAmount),
      taxBreakdown: e.taxBreakdown ? (() => {
        try { return JSON.parse(e.taxBreakdown); } catch { return e.taxBreakdown; }
      })() : undefined,
    }));

    res.json(parsed);
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/expenses", async (req, res) => {
  try {
    const raw = req.body;
    const expenseId = raw.id || `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const toInsert = {
      id: expenseId,
      date: raw.date || new Date().toISOString().split('T')[0],
      category: raw.category || 'Office Supplies',
      description: raw.description || 'Note de frais',
      amount: String(raw.amount || 0),
      deductibleAmount: String(raw.deductibleAmount !== undefined ? raw.deductibleAmount : raw.amount || 0),
      receiptUrl: raw.receiptUrl || null,
      notes: raw.notes || null,
      employeeId: raw.employeeId || null,
      employeeName: raw.employeeName || 'Employé',
      employeeEmail: raw.employeeEmail || null,
      source: raw.source || 'manual',
      sourceId: raw.sourceId || null,
      sourceLineId: raw.sourceLineId || null,
      taxBreakdown: raw.taxBreakdown ? (typeof raw.taxBreakdown === 'string' ? raw.taxBreakdown : JSON.stringify(raw.taxBreakdown)) : null,
      status: raw.status || 'pending_approval',
      createdAt: new Date(),
    };

    await db.insert(businessExpenses).values(toInsert);

    // Synchronize with canonical expenses table
    try {
      const { expenses, gpsTrips } = await import("./src/db/schema");
      const { eq, or } = await import("drizzle-orm");
      await db.insert(expenses).values({
        id: expenseId,
        source: toInsert.source,
        sourceId: toInsert.sourceId,
        sourceLineId: toInsert.sourceLineId,
        idempotencyKey: `idemp_${expenseId}`,
        amount: toInsert.amount,
        currency: 'CAD',
        status: toInsert.status,
        description: toInsert.description,
        userId: toInsert.employeeId,
        metadata: JSON.stringify({
          category: toInsert.category,
          taxBreakdown: raw.taxBreakdown,
          deductibleAmount: toInsert.deductibleAmount
        }),
        createdAt: new Date(),
      }).onConflictDoNothing();

      // If this expense originated from a GPS trip, link it back
      if (toInsert.source === 'gps_triplog' && toInsert.sourceId) {
        const numId = parseInt(toInsert.sourceId, 10);
        if (!isNaN(numId)) {
          await db.update(gpsTrips)
            .set({ status: 'converted_to_expense', expenseId })
            .where(or(eq(gpsTrips.localId, toInsert.sourceId), eq(gpsTrips.id, numId)));
        } else {
          await db.update(gpsTrips)
            .set({ status: 'converted_to_expense', expenseId })
            .where(eq(gpsTrips.localId, toInsert.sourceId));
        }
      }
    } catch (syncErr) {
      console.warn("Notice: Canonical expense synchronization:", syncErr);
    }

    res.status(201).json({
      ...toInsert,
      amount: parseFloat(toInsert.amount),
      deductibleAmount: parseFloat(toInsert.deductibleAmount),
      taxBreakdown: raw.taxBreakdown
    });
  } catch (error: any) {
    console.error("Error creating expense:", error);
    res.status(500).json({ error: error.message });
  }
});

// Approve an individual expense
app.put("/api/expenses/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy, reason } = req.body || {};

    await db.update(businessExpenses).set({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: approvedBy || 'Admin RH',
      approvalReason: reason || 'Approuvé conforme aux politiques de remboursement.',
    }).where(eq(businessExpenses.id, id));

    res.json({ success: true, status: 'approved' });
  } catch (error: any) {
    console.error("Error approving expense:", error);
    res.status(500).json({ error: error.message });
  }
});

// Reject an individual expense
app.put("/api/expenses/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, rejectedBy } = req.body || {};

    await db.update(businessExpenses).set({
      status: 'rejected',
      rejectionReason: reason || 'Non conforme aux politiques de l\'entreprise.',
    }).where(eq(businessExpenses.id, id));

    res.json({ success: true, status: 'rejected' });
  } catch (error: any) {
    console.error("Error rejecting expense:", error);
    res.status(500).json({ error: error.message });
  }
});

// Reimburse an individual expense
app.put("/api/expenses/:id/reimburse", async (req, res) => {
  try {
    const { id } = req.params;
    const { reimbursedBy, reimbursementMethod, reimbursementRef } = req.body || {};

    const ref = reimbursementRef || `REIMB-${Date.now().toString().slice(-6)}`;
    const method = reimbursementMethod || 'Dépôt direct de paie';

    await db.update(businessExpenses).set({
      status: 'reimbursed',
      reimbursedAt: new Date(),
      reimbursedBy: reimbursedBy || 'Admin RH',
      reimbursementMethod: method,
      reimbursementRef: ref,
    }).where(eq(businessExpenses.id, id));

    res.json({ success: true, status: 'reimbursed', reimbursementRef: ref });
  } catch (error: any) {
    console.error("Error reimbursing expense:", error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk approve multiple expenses
app.post("/api/expenses/bulk-approve", async (req, res) => {
  try {
    const { ids, approvedBy, reason } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No expense IDs provided" });
    }

    await db.update(businessExpenses).set({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: approvedBy || 'Admin RH',
      approvalReason: reason || 'Approbation groupée effectuée par l\'administrateur.',
    }).where(inArray(businessExpenses.id, ids));

    res.json({ success: true, approvedCount: ids.length });
  } catch (error: any) {
    console.error("Error bulk approving expenses:", error);
    res.status(500).json({ error: error.message });
  }
});

// Bulk reimburse multiple expenses
app.post("/api/expenses/bulk-reimburse", async (req, res) => {
  try {
    const { ids, reimbursedBy, reimbursementMethod, reimbursementRef } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No expense IDs provided" });
    }

    const ref = reimbursementRef || `REIMB-BATCH-${Date.now().toString().slice(-6)}`;
    const method = reimbursementMethod || 'Dépôt direct de paie';

    await db.update(businessExpenses).set({
      status: 'reimbursed',
      reimbursedAt: new Date(),
      reimbursedBy: reimbursedBy || 'Admin RH',
      reimbursementMethod: method,
      reimbursementRef: ref,
    }).where(inArray(businessExpenses.id, ids));

    res.json({ success: true, reimbursedCount: ids.length, reimbursementRef: ref });
  } catch (error: any) {
    console.error("Error bulk reimbursing expenses:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(businessExpenses).where(eq(businessExpenses.id, id));
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: error.message });
  }
});

// Taxable Benefits API
app.get("/api/taxable-benefits", async (req, res) => {
  try {
    const list = await db.select().from(taxableBenefits).orderBy(desc(taxableBenefits.createdAt));
    const parsed = list.map(b => ({
      ...b,
      totalAmount: parseFloat(b.totalAmount),
      taxableAmount: parseFloat(b.taxableAmount),
      nonTaxableAmount: parseFloat(b.nonTaxableAmount),
      calculationDetails: b.calculationDetails ? JSON.parse(b.calculationDetails) : undefined,
    }));
    res.json(parsed);
  } catch (error: any) {
    console.error("Error fetching taxable benefits:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/taxable-benefits", async (req, res) => {
  try {
    const newBenefit = req.body;
    const toInsert = {
      ...newBenefit,
      calculationDetails: newBenefit.calculationDetails ? JSON.stringify(newBenefit.calculationDetails) : null,
    };
    await db.insert(taxableBenefits).values(toInsert);
    res.status(201).json(newBenefit);
  } catch (error: any) {
    console.error("Error creating taxable benefit:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/taxable-benefits/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(taxableBenefits).where(eq(taxableBenefits.id, id));
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting taxable benefit:", error);
    res.status(500).json({ error: error.message });
  }
});

// Company Settings API
app.get("/api/settings", async (req, res) => {
  try {
    const settings = await db.select().from(companySettings).where(eq(companySettings.id, 'global'));
    if (settings.length === 0) {
      // Return default settings if none exist
      return res.json({
        id: 'global',
        companyName: 'ApplepAI Inc.',
        neq: '1178901234',
        federalId: '123456789 RP 0001',
        defaultFrequency: 'bi-weekly',
        language: 'fr'
      });
    }
    res.json(settings[0]);
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    const settings = req.body;
    const existing = await db.select().from(companySettings).where(eq(companySettings.id, 'global'));
    
    if (existing.length > 0) {
      await db.update(companySettings).set(settings).where(eq(companySettings.id, 'global'));
    } else {
      await db.insert(companySettings).values({ ...settings, id: 'global' });
    }
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error saving settings:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TIMESHEET & TIME ENTRY ENDPOINTS
// ============================================================================

app.get("/api/timesheets", async (req, res) => {
  try {
    const { employeeId, status, startDate, endDate } = req.query as Record<string, string>;
    let query = db.select().from(timeEntries).orderBy(desc(timeEntries.date));
    const entries = await query;
    let filtered = entries;
    if (employeeId) {
      filtered = filtered.filter((e: any) => e.employeeId === employeeId);
    }
    if (status) {
      filtered = filtered.filter((e: any) => e.status === status);
    }
    if (startDate && endDate) {
      filtered = filtered.filter((e: any) => e.date >= startDate && e.date <= endDate);
    }
    res.json(filtered.map((e: any) => ({
      ...e,
      hours: parseFloat(e.hours || '0'),
      hourlyRate: e.hourlyRate ? parseFloat(e.hourlyRate) : undefined,
    })));
  } catch (error: any) {
    console.error("Error fetching time entries:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/timesheets", async (req, res) => {
  try {
    const { employeeId, date, hours, entryType, projectTask, billable, hourlyRate, notes } = req.body;
    if (!employeeId || !date || hours === undefined) {
      return res.status(400).json({ error: "Missing required fields: employeeId, date, hours" });
    }
    const newEntry = {
      id: req.body.id || `time_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      employeeId,
      date,
      hours: String(hours),
      entryType: entryType || 'regular',
      projectTask: projectTask || null,
      billable: billable !== undefined ? Boolean(billable) : true,
      hourlyRate: hourlyRate ? String(hourlyRate) : null,
      status: 'submitted',
      notes: notes || null,
    };
    await db.insert(timeEntries).values(newEntry);
    res.status(201).json({ ...newEntry, hours: Number(newEntry.hours) });
  } catch (error: any) {
    console.error("Error creating time entry:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/timesheets/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body || {};
    await db.update(timeEntries).set({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: approvedBy || 'Admin RH',
    }).where(eq(timeEntries.id, id));
    res.json({ success: true, id, status: 'approved' });
  } catch (error: any) {
    console.error("Error approving time entry:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/timesheets/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(timeEntries).where(eq(timeEntries.id, id));
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting time entry:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// EMPLOYEE LEAVE & ABSENCE ENDPOINTS
// ============================================================================

app.get("/api/leaves", async (req, res) => {
  try {
    const { employeeId, status } = req.query as Record<string, string>;
    const allLeaves = await db.select().from(leaveRequests).orderBy(desc(leaveRequests.startDate));
    let filtered = allLeaves;
    if (employeeId) {
      filtered = filtered.filter((l: any) => l.employeeId === employeeId);
    }
    if (status) {
      filtered = filtered.filter((l: any) => l.status === status);
    }
    res.json(filtered.map((l: any) => ({
      ...l,
      totalDays: parseFloat(l.totalDays || '1'),
      totalHours: parseFloat(l.totalHours || '8'),
    })));
  } catch (error: any) {
    console.error("Error fetching leave requests:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/leaves", async (req, res) => {
  try {
    const { employeeId, employeeName, leaveType, startDate, endDate, totalDays, totalHours, isPaid, reason } = req.body;
    if (!employeeId || !startDate || !endDate || !leaveType) {
      return res.status(400).json({ error: "Missing required fields for leave request" });
    }
    const newLeave = {
      id: req.body.id || `leave_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      employeeId,
      employeeName: employeeName || 'Employé',
      leaveType,
      startDate,
      endDate,
      totalDays: String(totalDays || 1),
      totalHours: String(totalHours || 8),
      isPaid: isPaid !== undefined ? Boolean(isPaid) : true,
      reason: reason || null,
      status: 'pending',
    };
    await db.insert(leaveRequests).values(newLeave);
    res.status(201).json({
      ...newLeave,
      totalDays: Number(newLeave.totalDays),
      totalHours: Number(newLeave.totalHours)
    });
  } catch (error: any) {
    console.error("Error creating leave request:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/leaves/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewedBy, rejectionReason } = req.body;
    if (!status || !['approved', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }
    await db.update(leaveRequests).set({
      status,
      reviewedBy: reviewedBy || 'Direction RH',
      reviewedAt: new Date(),
      rejectionReason: rejectionReason || null,
    }).where(eq(leaveRequests.id, id));

    // If approved, update the employee's leave balance accordingly
    if (status === 'approved') {
      const leaveList = await db.select().from(leaveRequests).where(eq(leaveRequests.id, id));
      if (leaveList.length > 0) {
        const item = leaveList[0];
        const days = parseFloat(item.totalDays || '1');
        const empBalance = await db.select().from(employeeLeaveBalances).where(eq(employeeLeaveBalances.employeeId, item.employeeId));
        if (empBalance.length > 0) {
          const bal = empBalance[0];
          if (item.leaveType === 'vacation') {
            await db.update(employeeLeaveBalances).set({
              vacationUsedDays: String(parseFloat(bal.vacationUsedDays || '0') + days),
              updatedAt: new Date(),
            }).where(eq(employeeLeaveBalances.employeeId, item.employeeId));
          } else if (item.leaveType === 'sick') {
            await db.update(employeeLeaveBalances).set({
              sickUsedDays: String(parseFloat(bal.sickUsedDays || '0') + days),
              updatedAt: new Date(),
            }).where(eq(employeeLeaveBalances.employeeId, item.employeeId));
          } else if (item.leaveType === 'personal') {
            await db.update(employeeLeaveBalances).set({
              personalUsedDays: String(parseFloat(bal.personalUsedDays || '0') + days),
              updatedAt: new Date(),
            }).where(eq(employeeLeaveBalances.employeeId, item.employeeId));
          }
        }
      }
    }

    res.json({ success: true, id, status });
  } catch (error: any) {
    console.error("Error updating leave request status:", error);
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/leaves/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(leaveRequests).where(eq(leaveRequests.id, id));
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting leave request:", error);
    res.status(500).json({ error: error.message });
  }
});

// Leave Balances for all employees or a specific employee
app.get("/api/leave-balances", async (req, res) => {
  try {
    const allEmployees = await db.select().from(employees);
    const allBalances = await db.select().from(employeeLeaveBalances);
    const balanceMap = new Map<string, any>(allBalances.map((b: any) => [b.employeeId, b]));

    const result = [];
    for (const emp of allEmployees) {
      let b: any = balanceMap.get(emp.id);
      if (!b) {
        // Calculate standard vacation days from employee vacationRate in database
        const vRate = parseFloat(emp.vacationRate || '0.04');
        const vacationDays = vRate >= 0.08 ? '20.00' : vRate >= 0.06 ? '15.00' : vRate >= 0.04 ? '10.00' : '15.00';
        
        const newBal = {
          id: `bal_${emp.id}_2026`,
          employeeId: emp.id,
          fiscalYear: 2026,
          vacationTotalDays: vacationDays,
          vacationUsedDays: '0.00',
          sickTotalDays: '10.00',
          sickUsedDays: '0.00',
          personalTotalDays: '3.00',
          personalUsedDays: '0.00',
          rttCompensatoryHours: '0.00',
        };
        await db.insert(employeeLeaveBalances).values(newBal);
        b = newBal;
      }

      result.push({
        ...b,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department || 'Général',
        jobTitle: emp.jobTitle || 'Employé',
        vacationRate: parseFloat(emp.vacationRate || '0.04'),
        vacationTotalDays: parseFloat(b.vacationTotalDays || '15'),
        vacationUsedDays: parseFloat(b.vacationUsedDays || '0'),
        vacationAvailableDays: Math.max(0, parseFloat(b.vacationTotalDays || '15') - parseFloat(b.vacationUsedDays || '0')),
        sickTotalDays: parseFloat(b.sickTotalDays || '10'),
        sickUsedDays: parseFloat(b.sickUsedDays || '0'),
        sickAvailableDays: Math.max(0, parseFloat(b.sickTotalDays || '10') - parseFloat(b.sickUsedDays || '0')),
        personalTotalDays: parseFloat(b.personalTotalDays || '3'),
        personalUsedDays: parseFloat(b.personalUsedDays || '0'),
        personalAvailableDays: Math.max(0, parseFloat(b.personalTotalDays || '3') - parseFloat(b.personalUsedDays || '0')),
        rttCompensatoryHours: parseFloat(b.rttCompensatoryHours || '0'),
      });
    }

    res.json(result);
  } catch (error: any) {
    console.error("Error fetching all leave balances:", error);
    res.status(500).json({ error: error.message });
  }
});

// Leave Balances for an employee or all employees
app.get("/api/leave-balances/:employeeId", async (req, res) => {
  try {
    const { employeeId } = req.params;
    let balances = await db.select().from(employeeLeaveBalances).where(eq(employeeLeaveBalances.employeeId, employeeId));
    if (balances.length === 0) {
      // Initialize default annual balance (Quebec CNESST standard: 3 weeks / 15 days vacation, 10 days sick/care, 3 days personal/family obligations)
      const newBal = {
        id: `bal_${employeeId}_2026`,
        employeeId,
        fiscalYear: 2026,
        vacationTotalDays: '15.00',
        vacationUsedDays: '0.00',
        sickTotalDays: '10.00',
        sickUsedDays: '0.00',
        personalTotalDays: '3.00',
        personalUsedDays: '0.00',
        rttCompensatoryHours: '0.00',
      };
      await db.insert(employeeLeaveBalances).values(newBal);
      return res.json({
        ...newBal,
        vacationTotalDays: 15,
        vacationUsedDays: 0,
        sickTotalDays: 10,
        sickUsedDays: 0,
        personalTotalDays: 3,
        personalUsedDays: 0,
        rttCompensatoryHours: 0,
      });
    }
    const b = balances[0];
    res.json({
      ...b,
      vacationTotalDays: parseFloat(b.vacationTotalDays || '15'),
      vacationUsedDays: parseFloat(b.vacationUsedDays || '0'),
      sickTotalDays: parseFloat(b.sickTotalDays || '10'),
      sickUsedDays: parseFloat(b.sickUsedDays || '0'),
      personalTotalDays: parseFloat(b.personalTotalDays || '3'),
      personalUsedDays: parseFloat(b.personalUsedDays || '0'),
      rttCompensatoryHours: parseFloat(b.rttCompensatoryHours || '0'),
    });
  } catch (error: any) {
    console.error("Error fetching leave balances:", error);
    res.status(500).json({ error: error.message });
  }
});

const ecsService = new ExpenseCreationService();

app.post("/api/ecs/create", async (req, res) => {
  try {
    const payload = req.body;
    const roleHeader = req.headers['x-user-role'] as string || payload.role || 'Employee';
    const userIdHeader = req.headers['x-user-id'] as string || payload.userId || 'emp_1';
    
    const normalizedRole = roleHeader.toLowerCase() === 'admin' ? 'Admin' : 'Employee';

    const sessionUser = {
      id: userIdHeader,
      role: normalizedRole
    };

    const result = await ecsService.processInvoiceToExpense(payload, sessionUser);
    res.json(result);
  } catch (error: any) {
    console.error("ECS Error:", error);
    if (error.message && error.message.includes("only create expenses for their own accounts")) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Explicit API 404 handler to prevent API routes from falling back to Vite index.html
app.all("/api/*", (req, res) => {
  res.status(404).json({ success: false, error: "API endpoint not found", path: req.path });
});

// Global API error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled server error:", err);
  if (req.path.startsWith("/api") || req.xhr || req.headers.accept?.includes("application/json")) {
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: err.message || String(err),
    });
  }
  next(err);
});

async function startServer() {
  await ensureSchema();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
