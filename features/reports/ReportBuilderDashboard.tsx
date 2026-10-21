import React, { useState, useEffect, useMemo } from 'react';
import { ExpensesReportBuilder } from './ExpensesReportBuilder';
import { PayrollReportBuilder } from './PayrollReportBuilder';
import { ExpenseItem, PayrollItem } from './types';
import { PayStub, Employee } from '../../src/types';
import { Storage } from '../../src/lib/storage';
import { BarChart3, Receipt, Users, Layers, Sparkles } from 'lucide-react';

interface ReportBuilderDashboardProps {
  stubs: PayStub[];
  employees: Employee[];
  language?: string;
}

export const ReportBuilderDashboard: React.FC<ReportBuilderDashboardProps> = ({ 
  stubs, 
  employees, 
  language = 'fr' 
}) => {
  const isFr = language === 'fr';
  const [activeTab, setActiveTab] = useState<'expenses' | 'payroll'>('expenses');
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const savedExpenses = await Storage.getExpenses();
        if (savedExpenses && savedExpenses.length > 0) {
          setExpensesList(savedExpenses.map((exp: any) => ({
            id: exp.id || `exp_${Math.random()}`,
            date: exp.date || new Date().toISOString().split('T')[0],
            amount: Number(exp.amount) || 0,
            taxAmount: exp.taxBreakdown?.gst ? Number(exp.taxBreakdown.gst) + Number(exp.taxBreakdown.qst || 0) : (exp.tax || 0),
            taxRate: 0.14975,
            description: exp.description || exp.memo || '',
            referenceNumber: exp.referenceNumber || exp.refNo || '',
            status: exp.status || 'Paid',
            category: exp.category || 'General',
            account: exp.account || exp.category || 'General',
            vendor: exp.vendor || exp.merchant || exp.vendorName || 'Supplier',
            paymentMethod: exp.paymentMethod || 'Bank Transfer',
            deductibleAmount: Number(exp.deductibleAmount ?? exp.amount ?? 0),
            notes: exp.notes || '',
            employeeName: exp.employeeName || '',
            source: exp.source || 'manual',
            taxStatus: typeof exp.taxBreakdown === 'object' ? exp.taxBreakdown?.taxStatus : 'taxable',
            itcGst: typeof exp.taxBreakdown === 'object' ? Number(exp.taxBreakdown?.itcGst || 0) : 0,
            itrQst: typeof exp.taxBreakdown === 'object' ? Number(exp.taxBreakdown?.itrQst || 0) : 0,
            approvedBy: exp.approvedBy || '',
            reimbursementMethod: exp.reimbursementMethod || '',
            reimbursementRef: exp.reimbursementRef || '',
            invoiceNumber: exp.invoiceNumber || '',
            poNumber: exp.poNumber || '',
            dueDate: exp.dueDate || '',
            paymentTerms: exp.paymentTerms || '',
            vendorAddress: exp.vendorAddress || '',
            customerName: exp.customerName || '',
            customerAddress: exp.customerAddress || '',
            subtotal: Number(exp.subtotal || exp.amount || 0),
            zeroRatedSubtotal: Number(exp.zeroRatedSubtotal || 0),
            exemptSubtotal: Number(exp.exemptSubtotal || 0),
            shipping: Number(exp.shipping || 0),
            freight: Number(exp.freight || 0),
            delivery: Number(exp.delivery || 0),
            handling: Number(exp.handling || 0),
            recycleFee: Number(exp.recycleFee || 0),
            fuelSurcharge: Number(exp.fuelSurcharge || 0),
            surcharge: Number(exp.surcharge || 0),
            deposit: Number(exp.deposit || 0),
            containerFee: Number(exp.containerFee || 0),
            environmentalFee: Number(exp.environmentalFee || 0),
            serviceFee: Number(exp.serviceFee || 0),
            tax: Number(exp.tax || 0),
            total: Number(exp.total || exp.amount || 0),
            currency: exp.currency || 'CAD',
            province: exp.province || 'QC',
            taxGroup: exp.taxGroup || '',
            gst: Number(exp.taxBreakdown?.gst || 0),
            qst: Number(exp.taxBreakdown?.qst || 0),
            pst: Number(exp.taxBreakdown?.pst || 0),
            hst: Number(exp.taxBreakdown?.hst || 0),
            vendorBusinessNumber: exp.vendorTaxNumbers?.businessNumber || '',
            vendorGstHst: exp.vendorTaxNumbers?.gstHst || '',
            vendorQst: exp.vendorTaxNumbers?.qst || '',
            summary: exp.summary || '',
          })));
        } else {
          // Demo fallback items
          setExpensesList([
            {
              id: 'exp_01',
              date: '2026-08-12',
              amount: 1450.00,
              taxAmount: 217.14,
              taxRate: 0.14975,
              description: 'Cloud AI Server Cluster Hosting - Node Alpha',
              referenceNumber: 'INV-9841',
              status: 'Paid',
              category: 'Cloud & Infrastructure',
              vendor: 'AWS Canada Inc.',
              paymentMethod: 'Corporate Card',
              invoiceNumber: 'INV-9841',
              subtotal: 1250.00,
              tax: 200.00,
              total: 1450.00
            },
            {
              id: 'exp_02',
              date: '2026-08-15',
              amount: 320.50,
              taxAmount: 47.95,
              taxRate: 0.14975,
              description: 'Office Supplies & Ergonomic Workstation Upgrades',
              referenceNumber: 'PO-4412',
              status: 'Paid',
              category: 'Office & Equipment',
              vendor: 'Staples Business Depot',
              paymentMethod: 'ACH Transfer',
              invoiceNumber: 'INV-4412',
              subtotal: 275.00,
              tax: 45.50,
              total: 320.50
            }
          ]);
        }
      } catch (err) {
        console.error('Error loading expenses for report builder:', err);
      } finally {
        setLoading(false);
      }
    };
    loadExpenses();
  }, []);

  const payrollItemsList: PayrollItem[] = useMemo(() => {
    if (!stubs || stubs.length === 0) {
      return [
        {
          id: 'stub_01',
          employeeName: 'Alexandre Tremblay',
          payPeriod: '2026-08-01 - 2026-08-15',
          payDate: '2026-08-15',
          grossPay: 3200.00,
          netPay: 2245.50,
          totalTaxes: 954.50,
          totalDeductions: 350.00,
          totalEarnings: 3200.00,
          employerContributions: 620.40,
          department: 'Engineering',
          location: 'Montreal HQ',
          checkNumber: 'CHK-1001',
          ytdEarnings: 44800.00,
          ytdWithholding: 13363.00,
          status: 'Paid'
        }
      ];
    }

    return stubs.map(s => {
      const emp = employees.find(e => e.id === s.employeeId);
      const gross = Number(s.grossPay) || 0;
      const net = Number(s.netPay) || 0;
      const fedTax = Number(s.federalTax) || 0;
      const qcTax = Number(s.quebecTax) || 0;
      const ei = Number(s.ei) || 0;
      const qpp = Number(s.qpp) || 0;
      const qpip = Number(s.qpip) || 0;
      const totalTax = fedTax + qcTax + ei + qpp + qpip;
      const empyrTotal = (Number(s.employerEI) || ei * 1.4) + (Number(s.employerQPP) || qpp) + (Number(s.employerQPIP) || 15) + (Number(s.hsf) || gross * 0.0165) + (Number(s.labourStandards) || gross * 0.0006);

      return {
        id: s.id || `stub_${Math.random()}`,
        employeeName: s.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : 'Employé'),
        payPeriod: s.payPeriod || '2026-08-01 - 2026-08-15',
        payDate: s.date || new Date().toISOString().split('T')[0],
        grossPay: gross,
        netPay: net,
        totalTaxes: Number(totalTax.toFixed(2)),
        totalDeductions: Number((gross - net).toFixed(2)),
        totalEarnings: gross,
        employerContributions: Number(empyrTotal.toFixed(2)),
        department: emp?.department || 'Administration',
        location: emp?.location || 'Québec',
        checkNumber: s.checkNumber || `CHK-${Math.floor(1000 + Math.random() * 9000)}`,
        ytdEarnings: gross * 12,
        ytdWithholding: totalTax * 12,
        status: 'Paid',
        frequency: 'bi-weekly',
        vacationPay: s.vacationPay || 0,
        overtimePay: s.overtimePay || 0,
        bonusPay: s.bonusPay || 0,
        commissionPay: s.commissionPay || 0,
        rrspContribution: 0,
        taxableBenefitsFederal: 0,
        taxableBenefitsProvincial: 0,
        federalTax: fedTax,
        quebecTax: qcTax,
        qpp: qpp,
        qpip: qpip,
        ei: ei,
        hsf: s.hsf || 0,
        cnesst: s.labourStandards || 0,
        employerQPP: s.employerQPP || 0,
        employerQPIP: s.employerQPIP || 0,
        employerEI: s.employerEI || 0,
        employerCNESST: s.employerCNESST || 0,
        totalEmployerCost: s.totalEmployerCost || 0
      };
    });
  }, [stubs, employees]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header & Description */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              {isFr ? 'Générateur de Rapports Avancé (Report Builder)' : 'Advanced Report Builder'}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isFr 
              ? 'Analysez l\'ensemble des champs de dépenses (tab Dépenses) et les résultats d\'audit de factures avec des colonnes personnalisables.'
              : 'Analyze all expense tab fields and invoice audit result dashboard fields with customizable columns.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'expenses' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-blue-600" />
            {isFr ? 'Rapport Dépenses' : 'Expenses Report'}
          </button>
          <button
            onClick={() => setActiveTab('payroll')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'payroll' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            {isFr ? 'Rapport Paie' : 'Payroll Report'}
          </button>
        </div>
      </div>

      {/* Render Active Builder Pane */}
      {activeTab === 'expenses' ? (
        <ExpensesReportBuilder expenses={expensesList} language={language} />
      ) : (
        <PayrollReportBuilder payrollItems={payrollItemsList} language={language} />
      )}
    </div>
  );
};
