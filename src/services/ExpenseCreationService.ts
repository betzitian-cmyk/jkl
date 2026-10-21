import { db } from '../db';
import { calculationLogs, expenses, businessExpenses, employees } from '../db/schema';
import { eq } from 'drizzle-orm';

export interface ECSRequestPayload {
  source: string;
  sourceId: string | number;
  sourceLineId: string | number;
  idempotencyKey: string;
  companyId: string;
  userId: string;
  date: string;
  currency: string;
  amountGross: number;
  taxes?: any;
  description: string;
  categoryHint?: string;
  attachments?: any[];
  mappingRules?: any;
  requestMode: 'preview' | 'commit';
  metadata?: any;
}

export class ExpenseCreationService {
  applyCurrencyConversion(amount: number, currency: string, companyId: string, date: string): number {
    return Number(amount) || 0;
  }

  async resolveCategory(categoryHint: string | undefined, companyId: string): Promise<string> {
    return categoryHint || 'General Business Expense';
  }

  async processInvoiceToExpense(payload: ECSRequestPayload, sessionUser: { id: string, role: string }) {
    // 1. Security & Context Enforcement (ALLOW Employee)
    if (sessionUser.role === 'Employee' && payload.userId !== sessionUser.id) {
      throw new Error("Employees can only create expenses for their own accounts.");
    }

    // Determine target status based on role
    const initialStatus = sessionUser.role === 'Admin' ? 'approved' : 'pending_approval';

    // 2. Validation & Idempotency Check
    if (payload.requestMode === 'commit') {
      const existingExpenses = await db.select().from(expenses).where(eq(expenses.idempotencyKey, payload.idempotencyKey)).limit(1);
      if (existingExpenses.length > 0) {
        return { createdExpenses: [{ expenseId: existingExpenses[0].id, existing: true }] };
      }
    }

    // 3. Apply Calculations
    const computedAmount = this.applyCurrencyConversion(payload.amountGross, payload.currency, payload.companyId, payload.date);
    const category = await this.resolveCategory(payload.categoryHint, payload.companyId);

    const calculationBreakdown = {
      sourceLineId: payload.sourceLineId,
      originalAmount: `${payload.amountGross} ${payload.currency}`,
      computedExpenseAmount: computedAmount.toString(),
      category: category,
      taxBreakdown: payload.taxes,
      idempotencyKey: payload.idempotencyKey
    };

    if (payload.requestMode === 'preview') {
      return { preview: true, calculations: [calculationBreakdown], warnings: [] };
    }

    // 4. Commit Mode: Write DB & Audit Log
    const calcLogId = `calc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.insert(calculationLogs).values({
      id: calcLogId,
      inputPayload: JSON.stringify(payload),
      intermediateValues: JSON.stringify(calculationBreakdown),
      timestamp: new Date(),
      processedBy: sessionUser.id
    });

    await db.insert(expenses).values({
      id: expenseId,
      source: payload.source,
      sourceId: String(payload.sourceId),
      sourceLineId: String(payload.sourceLineId),
      calculationLogId: calcLogId,
      idempotencyKey: payload.idempotencyKey,
      amount: computedAmount.toString(),
      currency: "CAD",
      status: initialStatus,
      description: payload.description,
      userId: payload.userId,
      companyId: payload.companyId,
      metadata: JSON.stringify(payload.metadata || {})
    });

    // Also mirror to businessExpenses for centralized payroll & executive dashboard visibility
    try {
      let empName = 'Employé';
      let empEmail: string | null = null;
      if (payload.userId) {
        const empList = await db.select().from(employees).where(eq(employees.id, payload.userId)).limit(1);
        if (empList.length > 0) {
          empName = `${empList[0].firstName} ${empList[0].lastName}`;
          empEmail = empList[0].email;
        }
      }

      await db.insert(businessExpenses).values({
        id: expenseId,
        date: payload.date || new Date().toISOString().split('T')[0],
        category: category,
        description: payload.description || `Facture #${payload.sourceId}`,
        amount: computedAmount.toString(),
        deductibleAmount: computedAmount.toString(),
        receiptUrl: Array.isArray(payload.attachments) && payload.attachments[0]?.url ? payload.attachments[0].url : null,
        notes: `Créé automatiquement via Expense Creation Service. Source: ${payload.source} #${payload.sourceId}`,
        employeeId: payload.userId || null,
        employeeName: empName,
        employeeEmail: empEmail,
        source: payload.source || 'invoice_audit',
        sourceId: String(payload.sourceId),
        sourceLineId: String(payload.sourceLineId),
        taxBreakdown: payload.taxes ? JSON.stringify(payload.taxes) : null,
        status: initialStatus,
        createdAt: new Date(),
      });
    } catch (mirrorErr) {
      console.warn("Could not mirror expense to businessExpenses table:", mirrorErr);
    }

    return {
      createdExpenses: [
        { expenseId, status: initialStatus, calculationLogId: calcLogId }
      ]
    };
  }
}
