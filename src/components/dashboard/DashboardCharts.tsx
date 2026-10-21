/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  PieChart as PieIcon, 
  Building2, 
  DollarSign, 
  Layers, 
  ChevronDown,
  CheckCircle2,
  Clock,
  CreditCard
} from 'lucide-react';
import { motion } from 'motion/react';
import { Employee, PayStub, BusinessExpense } from '../../types';

interface DashboardChartsProps {
  employees: Employee[];
  payStubs: PayStub[];
  expenses: BusinessExpense[];
  isFr: boolean;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  employees,
  payStubs,
  expenses,
  isFr
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'payroll_expenses' | 'expense_categories' | 'departments'>('payroll_expenses');

  // Format currency
  const formatCAD = (num: number) => {
    return num.toLocaleString(isFr ? 'fr-CA' : 'en-CA', { 
      style: 'currency', 
      currency: 'CAD',
      maximumFractionDigits: 0 
    });
  };

  // 1. Dual Monthly Data: Monthly Gross Payroll & Monthly Expenses
  const monthlyTrendData = useMemo(() => {
    const map = new Map<string, { month: string; payroll: number; expenses: number; reimbursed: number }>();

    // Seed with last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', { month: 'short', year: '2-digit' });
      map.set(key, { month: label, payroll: 0, expenses: 0, reimbursed: 0 });
    }

    // Accumulate PayStubs
    payStubs.forEach(stub => {
      const key = stub.date.substring(0, 7);
      if (!map.has(key)) {
        const [y, m] = key.split('-').map(Number);
        const d = new Date(y, (m || 1) - 1, 1);
        map.set(key, {
          month: d.toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', { month: 'short', year: '2-digit' }),
          payroll: 0,
          expenses: 0,
          reimbursed: 0
        });
      }
      const entry = map.get(key)!;
      entry.payroll += stub.grossPay;
    });

    // Accumulate Expenses
    expenses.forEach(exp => {
      const key = exp.date ? exp.date.substring(0, 7) : '';
      if (key && map.has(key)) {
        const entry = map.get(key)!;
        entry.expenses += exp.amount;
        if (exp.status === 'reimbursed') {
          entry.reimbursed += exp.amount;
        }
      } else if (key) {
        const [y, m] = key.split('-').map(Number);
        const d = new Date(y, (m || 1) - 1, 1);
        map.set(key, {
          month: d.toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', { month: 'short', year: '2-digit' }),
          payroll: 0,
          expenses: exp.amount,
          reimbursed: exp.status === 'reimbursed' ? exp.amount : 0
        });
      }
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([_, v]) => ({
        ...v,
        payroll: Math.round(v.payroll),
        expenses: Math.round(v.expenses),
        reimbursed: Math.round(v.reimbursed)
      }));
  }, [payStubs, expenses, isFr]);

  // 2. Expenses by Category - Modern Pie Chart Data with Contrasting Scheme
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, { name: string; amount: number; count: number; color: string }> = {};

    // Vibrant contrasting color scheme
    const colorPalette = [
      '#2563EB', // Blue
      '#059669', // Emerald
      '#D97706', // Amber
      '#7C3AED', // Purple
      '#DB2777', // Pink
      '#0891B2', // Cyan
      '#EA580C', // Orange
      '#4F46E5'  // Indigo
    ];

    expenses.forEach((exp) => {
      const cat = exp.category || (isFr ? 'Autres' : 'Other');
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = {
          name: cat,
          amount: 0,
          count: 0,
          color: colorPalette[Object.keys(categoryTotals).length % colorPalette.length]
        };
      }
      categoryTotals[cat].amount += exp.amount;
      categoryTotals[cat].count += 1;
    });

    const totalCategoryExpense = Object.values(categoryTotals).reduce((sum, item) => sum + item.amount, 0);

    return Object.values(categoryTotals)
      .sort((a, b) => b.amount - a.amount)
      .map(item => ({
        ...item,
        amount: Math.round(item.amount * 100) / 100,
        percentage: totalCategoryExpense > 0 ? Math.round((item.amount / totalCategoryExpense) * 100) : 0
      }));
  }, [expenses, isFr]);

  // 3. Department Data for Clustered Column Chart
  const departmentData = useMemo(() => {
    const depts: Record<string, { department: string; count: number; totalSalary: number; avgSalary: number }> = {};

    employees.forEach(emp => {
      const dept = emp.department || (isFr ? 'Général' : 'General');
      if (!depts[dept]) {
        depts[dept] = { department: dept, count: 0, totalSalary: 0, avgSalary: 0 };
      }
      depts[dept].count += 1;
      depts[dept].totalSalary += emp.baseSalary || (emp.hourlyRate ? emp.hourlyRate * 2080 : 50000);
    });

    return Object.values(depts).map(d => ({
      ...d,
      totalSalary: Math.round(d.totalSalary),
      avgSalary: d.count > 0 ? Math.round(d.totalSalary / d.count) : 0
    }));
  }, [employees, isFr]);

  // Status summaries for expense view
  const expenseStatusSummary = useMemo(() => {
    const pending = expenses.filter(e => (e.status || 'pending_approval') === 'pending_approval');
    const approved = expenses.filter(e => e.status === 'approved');
    const reimbursed = expenses.filter(e => e.status === 'reimbursed');
    const rejected = expenses.filter(e => e.status === 'rejected');

    return {
      pending: { count: pending.length, total: pending.reduce((s, e) => s + e.amount, 0) },
      approved: { count: approved.length, total: approved.reduce((s, e) => s + e.amount, 0) },
      reimbursed: { count: reimbursed.length, total: reimbursed.reduce((s, e) => s + e.amount, 0) },
      rejected: { count: rejected.length, total: rejected.reduce((s, e) => s + e.amount, 0) }
    };
  }, [expenses]);

  const totalPayrollVal = payStubs.reduce((s, p) => s + p.grossPay, 0);
  const totalExpenseVal = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-6">
      {/* Header & Dropdown Menu Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {isFr ? 'Analytique & Visualisations' : 'Analytics & Visualizations'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFr 
              ? 'Tendances salariales, répartition des notes de frais et dynamique des départements' 
              : 'Payroll trends, expense distribution, and department dynamics'}
          </p>
        </div>

        {/* Dropdown Menu Switcher (Exact Names Preserved) */}
        <div className="relative w-full sm:w-64 shrink-0">
          <select
            value={activeChartTab}
            onChange={(e) => setActiveChartTab(e.target.value as 'payroll_expenses' | 'expense_categories' | 'departments')}
            className="w-full appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold rounded-xl py-2.5 pl-9 pr-9 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer shadow-xs transition-all"
          >
            <option value="payroll_expenses">
              {isFr ? 'Paie & Dépenses' : 'Payroll & Expenses'}
            </option>
            <option value="expense_categories">
              {isFr ? 'Catégories Dépenses' : 'Expense Categories'}
            </option>
            <option value="departments">
              {isFr ? 'Par Département' : 'By Department'}
            </option>
          </select>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-600">
            {activeChartTab === 'payroll_expenses' && <DollarSign className="w-4 h-4 text-blue-600" />}
            {activeChartTab === 'expense_categories' && <Layers className="w-4 h-4 text-emerald-600" />}
            {activeChartTab === 'departments' && <Building2 className="w-4 h-4 text-purple-600" />}
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full">
        {/* VIEW 1: Payroll & Expenses as Vertical Stacked Metrics Cards with Sparklines */}
        {activeChartTab === 'payroll_expenses' && (
          <motion.div
            key="payroll_expenses"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Card 1: Gross Payroll */}
              <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3.5 flex flex-col justify-between hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                    {isFr ? 'Masse Salariale Totale' : 'Total Gross Payroll'}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">6M</span>
                </div>
                <div className="text-lg font-black text-slate-900 mb-2">
                  {formatCAD(totalPayrollVal)}
                </div>
                <div className="h-11 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrendData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sparklinePayroll" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="payroll" stroke="#2563eb" strokeWidth={2} fill="url(#sparklinePayroll)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 2: Total Expenses */}
              <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3.5 flex flex-col justify-between hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-600" />
                    {isFr ? 'Dépenses Totales' : 'Total Expenses'}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700">6M</span>
                </div>
                <div className="text-lg font-black text-slate-900 mb-2">
                  {formatCAD(totalExpenseVal)}
                </div>
                <div className="h-11 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrendData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sparklineExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#64748b" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#64748b" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="expenses" stroke="#64748b" strokeWidth={2} fill="url(#sparklineExpenses)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 3: Reimbursed Total */}
              <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3.5 flex flex-col justify-between hover:border-emerald-300 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {isFr ? 'Remboursements Versés' : 'Reimbursed Total'}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700">6M</span>
                </div>
                <div className="text-lg font-black text-emerald-700 mb-2">
                  {formatCAD(expenseStatusSummary.reimbursed.total)}
                </div>
                <div className="h-11 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrendData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sparklineReimbursed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#059669" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="reimbursed" stroke="#059669" strokeWidth={2} fill="url(#sparklineReimbursed)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Card 4: Pending Approval */}
              <div className="bg-slate-50/70 rounded-xl border border-slate-200/80 p-3.5 flex flex-col justify-between hover:border-amber-300 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    {isFr ? 'En Attente de Validation' : 'Pending Approval'}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                    {expenseStatusSummary.pending.count} {isFr ? 'frais' : 'items'}
                  </span>
                </div>
                <div className="text-lg font-black text-amber-700 mb-2">
                  {formatCAD(expenseStatusSummary.pending.total)}
                </div>
                <div className="h-11 w-full min-w-0 flex items-center">
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${totalExpenseVal > 0 ? Math.min(100, Math.round((expenseStatusSummary.pending.total / totalExpenseVal) * 100)) : 0}%` 
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-Trend Chart Visual */}
            <div className="p-3.5 sm:p-4 bg-slate-50/50 rounded-xl border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  {isFr ? 'Évolution Mensuelle' : 'Monthly Trend Overview'}
                </p>
                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
                    {isFr ? 'Paie' : 'Payroll'}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                    {isFr ? 'Dépenses' : 'Expenses'}
                  </span>
                </div>
              </div>
              <div className="h-56 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mainPayroll" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="mainExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#64748b' }} 
                      tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} 
                    />
                    <Tooltip 
                      formatter={(val: any, name: any) => [
                        formatCAD(Number(val)),
                        name === 'payroll' 
                          ? (isFr ? 'Masse Salariale' : 'Gross Payroll') 
                          : (isFr ? 'Dépenses Total' : 'Total Expenses')
                      ]}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        fontSize: '11px'
                      }}
                    />
                    <Area type="monotone" dataKey="payroll" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#mainPayroll)" />
                    <Area type="monotone" dataKey="expenses" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#mainExpenses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: Category Chart as Modern Pie Chart Format with High-Contrast Color Scheme */}
        {activeChartTab === 'expense_categories' && (
          <motion.div
            key="expense_categories"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Status Breakdown Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">
                    {isFr ? 'En Attente' : 'Pending'}
                  </span>
                  <p className="text-sm sm:text-base font-black text-amber-950 mt-0.5">
                    {formatCAD(expenseStatusSummary.pending.total)}
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded-md text-xs font-bold">
                  {expenseStatusSummary.pending.count}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider">
                    {isFr ? 'Approuvé' : 'Approved'}
                  </span>
                  <p className="text-sm sm:text-base font-black text-blue-950 mt-0.5">
                    {formatCAD(expenseStatusSummary.approved.total)}
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-blue-200/70 text-blue-900 rounded-md text-xs font-bold">
                  {expenseStatusSummary.approved.count}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                    {isFr ? 'Remboursé' : 'Reimbursed'}
                  </span>
                  <p className="text-sm sm:text-base font-black text-emerald-950 mt-0.5">
                    {formatCAD(expenseStatusSummary.reimbursed.total)}
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-200/70 text-emerald-900 rounded-md text-xs font-bold">
                  {expenseStatusSummary.reimbursed.count}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">
                    {isFr ? 'Rejeté' : 'Rejected'}
                  </span>
                  <p className="text-sm sm:text-base font-black text-rose-950 mt-0.5">
                    {formatCAD(expenseStatusSummary.rejected.total)}
                  </p>
                </div>
                <span className="px-2 py-0.5 bg-rose-200/70 text-rose-900 rounded-md text-xs font-bold">
                  {expenseStatusSummary.rejected.count}
                </span>
              </div>
            </div>

            {/* Modern Pie / Donut Chart */}
            {categoryData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-7 h-64 sm:h-72 w-full min-w-0 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius="55%"
                        outerRadius="82%"
                        paddingAngle={3}
                        dataKey="amount"
                        nameKey="name"
                        stroke="#ffffff"
                        strokeWidth={2}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(val: any) => [formatCAD(Number(val)), isFr ? 'Montant Total' : 'Total Amount']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Donut Label */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {isFr ? 'Total Dépenses' : 'Total Spent'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-slate-900">
                      {formatCAD(categoryData.reduce((s, c) => s + c.amount, 0))}
                    </span>
                  </div>
                </div>

                {/* Mobile Itemized Breakdown List */}
                <div className="md:col-span-5 space-y-2 p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                    {isFr ? 'Répartition des Catégories' : 'Category Distribution'}
                  </p>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {categoryData.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-100 shadow-2xs">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-slate-800 font-semibold truncate">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                            {item.percentage}%
                          </span>
                          <span className="font-extrabold text-slate-900">{formatCAD(item.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
                {isFr ? 'Aucune note de frais enregistrée pour le moment' : 'No expenses recorded yet'}
              </div>
            )}
          </motion.div>
        )}

        {/* VIEW 3: By Department Chart as a Clustered Column Chart */}
        {activeChartTab === 'departments' && (
          <motion.div
            key="departments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="h-72 sm:h-80 w-full min-w-0 pt-2">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart 
                  data={departmentData} 
                  margin={{ top: 15, right: 10, left: -15, bottom: 5 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="department" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} 
                  />
                  <Tooltip 
                    formatter={(val: any, name: any) => [
                      formatCAD(Number(val)), 
                      name === 'totalSalary' 
                        ? (isFr ? 'Masse Salariale Annuelle' : 'Annual Total Payroll') 
                        : (isFr ? 'Salaire Moyen par Employé' : 'Average Salary per Employee')
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                      fontSize: '12px'
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    height={36}
                    formatter={(val) => (
                      <span className="text-xs font-semibold text-slate-700 ml-1">
                        {val === 'totalSalary' 
                          ? (isFr ? 'Masse Salariale Totale' : 'Total Department Payroll') 
                          : (isFr ? 'Salaire Moyen' : 'Average Salary')}
                      </span>
                    )}
                  />
                  {/* Clustered Vertical Columns */}
                  <Bar 
                    dataKey="totalSalary" 
                    fill="#4F46E5" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={28} 
                  />
                  <Bar 
                    dataKey="avgSalary" 
                    fill="#06B6D4" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={28} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};