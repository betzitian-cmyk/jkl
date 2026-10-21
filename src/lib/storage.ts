/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Employee, PayStub, BusinessExpense, TaxableBenefitRecord, TimeEntry, LeaveRequest, EmployeeLeaveBalance } from '../types';
import { fetchWithRetry } from './fetchWithRetry';

export const Storage = {
  // Employees
  getEmployees: async (): Promise<Employee[]> => {
    const raw = await fetchWithRetry<Employee[]>('/api/employees', {}, 2, []);
    const seen = new Set();
    return (raw || []).filter(e => {
      if (!e || !e.id) return false;
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
  },

  // Questionnaire & Invitation Flow
  createEmployeeWithInvite: async (formData: any) => {
    const res = await fetch('/api/v1/questionnaire/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create employee invite.');
    }
    return await res.json();
  },

  validateInviteToken: async (token: string) => {
    const res = await fetch(`/api/v1/invite/validate?token=${encodeURIComponent(token)}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Invalid or expired invitation token.');
    }
    return await res.json();
  },

  acceptInviteToken: async (token: string, password?: string) => {
    const res = await fetch('/api/v1/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to accept invitation.');
    }
    return await res.json();
  },

  getQuestionnaireByEmployeeId: async (employeeId: string) => {
    const res = await fetch(`/api/v1/questionnaire/employee/${employeeId}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch questionnaire.');
    }
    return await res.json();
  },

  submitQuestionnaireAndPopulateProfile: async (questionnaireId: string, questionnaireData: any, profileUpdates?: any) => {
    const res = await fetch('/api/v1/questionnaire/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionnaireId, questionnaireData, profileUpdates })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit questionnaire.');
    }
    return await res.json();
  },

  saveEmployee: async (employee: Omit<Employee, 'id'> | Employee): Promise<string> => {
    try {
      const isUpdate = 'id' in employee && employee.id;
      const method = isUpdate ? 'PUT' : 'POST';
      const url = isUpdate ? `/api/employees/${employee.id}` : '/api/employees';
      
      const payload = isUpdate ? employee : { 
        ...employee, 
        id: Math.random().toString(36).substr(2, 9),
        onboardingStatus: 'incomplete'
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save employee');
      const data = await response.json();
      return isUpdate ? (employee as Employee).id : data.id;
    } catch (error) {
      console.error("Error saving employee", error);
      throw error;
    }
  },

  deleteEmployee: async (id: string) => {
    try {
      const response = await fetch(`/api/employees/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete employee');
    } catch (error) {
      console.error("Error deleting employee", error);
    }
  },

  // PayStubs
  getPayStubs: async (): Promise<PayStub[]> => {
    return await fetchWithRetry<PayStub[]>('/api/pay-stubs', {}, 2, []);
  },

  addPayStub: async (stub: Omit<PayStub, 'id'>): Promise<PayStub> => {
    try {
      const payload = { ...stub, id: Math.random().toString(36).substr(2, 9) };
      const response = await fetch('/api/pay-stubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to save pay stub');
      const data = await response.json().catch(() => payload);
      return (data || payload) as PayStub;
    } catch (error) {
      console.error("Error saving paystub", error);
      throw error;
    }
  },

  addPayStubsBatch: async (stubs: Omit<PayStub, 'id'>[]): Promise<PayStub[]> => {
    try {
      const payloads = stubs.map(s => ({
        ...s,
        id: 'stub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6)
      }));
      const response = await fetch('/api/pay-stubs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads),
      });
      if (!response.ok) {
        // Fallback to individual additions
        const results: PayStub[] = [];
        for (const p of payloads) {
          const res = await Storage.addPayStub(p);
          results.push(res);
        }
        return results;
      }
      const data = await response.json();
      return (Array.isArray(data) ? data : payloads) as PayStub[];
    } catch (error) {
      console.error("Error saving batch pay stubs, falling back to sequential:", error);
      const results: PayStub[] = [];
      for (const s of stubs) {
        const res = await Storage.addPayStub(s);
        results.push(res);
      }
      return results;
    }
  },

  // Expenses
  getExpenses: async (filter?: { status?: string; employeeId?: string }): Promise<BusinessExpense[]> => {
    const params = new URLSearchParams();
    if (filter?.status) params.append('status', filter.status);
    if (filter?.employeeId) params.append('employeeId', filter.employeeId);
    const url = `/api/expenses${params.toString() ? `?${params.toString()}` : ''}`;
    return await fetchWithRetry<BusinessExpense[]>(url, {}, 2, []);
  },

  saveExpense: async (expense: Omit<BusinessExpense, 'id'> | BusinessExpense) => {
    try {
      const isUpdate = 'id' in expense && expense.id;
      const payload = isUpdate ? expense : { ...expense, id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) };
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to save expense');
      return await response.json();
    } catch (error) {
      console.error("Error saving expense", error);
      throw error;
    }
  },

  approveExpense: async (id: string, reason?: string, approvedBy?: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, approvedBy }),
      });
      if (!response.ok) throw new Error('Failed to approve expense');
      return await response.json();
    } catch (error) {
      console.error("Error approving expense", error);
      throw error;
    }
  },

  rejectExpense: async (id: string, reason?: string, rejectedBy?: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, rejectedBy }),
      });
      if (!response.ok) throw new Error('Failed to reject expense');
      return await response.json();
    } catch (error) {
      console.error("Error rejecting expense", error);
      throw error;
    }
  },

  reimburseExpense: async (id: string, details?: { method?: string; ref?: string; reimbursedBy?: string }) => {
    try {
      const response = await fetch(`/api/expenses/${id}/reimburse`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reimbursementMethod: details?.method,
          reimbursementRef: details?.ref,
          reimbursedBy: details?.reimbursedBy,
        }),
      });
      if (!response.ok) throw new Error('Failed to reimburse expense');
      return await response.json();
    } catch (error) {
      console.error("Error reimbursing expense", error);
      throw error;
    }
  },

  bulkApproveExpenses: async (ids: string[], reason?: string, approvedBy?: string) => {
    try {
      const response = await fetch('/api/expenses/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, reason, approvedBy }),
      });
      if (!response.ok) throw new Error('Failed to bulk approve expenses');
      return await response.json();
    } catch (error) {
      console.error("Error bulk approving expenses", error);
      throw error;
    }
  },

  bulkReimburseExpenses: async (ids: string[], method?: string, reimbursedBy?: string, ref?: string) => {
    try {
      const response = await fetch('/api/expenses/bulk-reimburse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, reimbursementMethod: method, reimbursedBy, reimbursementRef: ref }),
      });
      if (!response.ok) throw new Error('Failed to bulk reimburse expenses');
      return await response.json();
    } catch (error) {
      console.error("Error bulk reimbursing expenses", error);
      throw error;
    }
  },

  deleteExpense: async (id: string) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete expense');
    } catch (error) {
      console.error("Error deleting expense", error);
    }
  },

  // Taxable Benefits (Revenu Québec 2025 IN-253-V & CRA T4130)
  getTaxableBenefits: async (): Promise<TaxableBenefitRecord[]> => {
    return await fetchWithRetry<TaxableBenefitRecord[]>('/api/taxable-benefits', {}, 2, []);
  },

  saveTaxableBenefit: async (benefit: Omit<TaxableBenefitRecord, 'id'> | TaxableBenefitRecord) => {
    try {
      const isUpdate = 'id' in benefit && benefit.id;
      const payload = isUpdate ? benefit : { ...benefit, id: 'tb_' + Math.random().toString(36).substr(2, 9) };
      const response = await fetch('/api/taxable-benefits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to save taxable benefit');
      return payload;
    } catch (error) {
      console.error("Error saving taxable benefit", error);
    }
  },

  deleteTaxableBenefit: async (id: string) => {
    try {
      const response = await fetch(`/api/taxable-benefits/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete taxable benefit');
    } catch (error) {
      console.error("Error deleting taxable benefit", error);
    }
  },

  // Settings
  getSettings: async () => {
    return await fetchWithRetry<any>('/api/settings', {}, 2, null);
  },

  saveSettings: async (settings: any) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
    } catch (error) {
      console.error("Error saving settings", error);
    }
  },

  // Timesheets & Time Tracking (PostgreSQL backend)
  getTimesheets: async (filters?: { employeeId?: string; status?: string; startDate?: string; endDate?: string }): Promise<TimeEntry[]> => {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const url = `/api/timesheets${params.toString() ? '?' + params.toString() : ''}`;
    return await fetchWithRetry<TimeEntry[]>(url, {}, 2, []);
  },

  saveTimesheetEntry: async (entry: Partial<TimeEntry> & { employeeId: string; date: string; hours: number }): Promise<TimeEntry | null> => {
    try {
      const response = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      if (!response.ok) throw new Error('Failed to save timesheet entry');
      return await response.json();
    } catch (error) {
      console.error("Error saving timesheet entry", error);
      return null;
    }
  },

  approveTimesheetEntry: async (id: string, approvedBy?: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/timesheets/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy }),
      });
      return response.ok;
    } catch (error) {
      console.error("Error approving timesheet entry", error);
      return false;
    }
  },

  deleteTimesheetEntry: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/timesheets/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error("Error deleting timesheet entry", error);
      return false;
    }
  },

  // Leave & Absence Management (PostgreSQL backend)
  getLeaveRequests: async (filters?: { employeeId?: string; status?: string }): Promise<LeaveRequest[]> => {
    const params = new URLSearchParams();
    if (filters?.employeeId) params.append('employeeId', filters.employeeId);
    if (filters?.status) params.append('status', filters.status);
    const url = `/api/leaves${params.toString() ? '?' + params.toString() : ''}`;
    return await fetchWithRetry<LeaveRequest[]>(url, {}, 2, []);
  },

  createLeaveRequest: async (leave: Partial<LeaveRequest> & { employeeId: string; leaveType: string; startDate: string; endDate: string }): Promise<LeaveRequest | null> => {
    try {
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leave),
      });
      if (!response.ok) throw new Error('Failed to create leave request');
      return await response.json();
    } catch (error) {
      console.error("Error creating leave request", error);
      return null;
    }
  },

  updateLeaveStatus: async (id: string, status: 'approved' | 'rejected' | 'cancelled', reviewedBy?: string, rejectionReason?: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/leaves/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewedBy, rejectionReason }),
      });
      return response.ok;
    } catch (error) {
      console.error("Error updating leave status", error);
      return false;
    }
  },

  deleteLeaveRequest: async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/leaves/${id}`, {
        method: 'DELETE',
      });
      return response.ok;
    } catch (error) {
      console.error("Error deleting leave request", error);
      return false;
    }
  },

  getLeaveBalance: async (employeeId: string): Promise<EmployeeLeaveBalance | null> => {
    return await fetchWithRetry<EmployeeLeaveBalance | null>(`/api/leave-balances/${employeeId}`, {}, 2, null);
  },

  getAllLeaveBalances: async (): Promise<EmployeeLeaveBalance[]> => {
    return await fetchWithRetry<EmployeeLeaveBalance[]>('/api/leave-balances', {}, 2, []);
  }
};
