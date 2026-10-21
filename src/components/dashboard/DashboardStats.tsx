/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Car
} from 'lucide-react';
import { motion } from 'motion/react';
import { Employee, PayStub, BusinessExpense } from '../../types';

interface DashboardStatsProps {
  employees: Employee[];
  payStubs: PayStub[];
  expenses: BusinessExpense[];
  isFr: boolean;
  onNavigate?: (view: any) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  employees,
  payStubs,
  expenses,
  isFr,
  onNavigate
}) => {
  const totalPayroll = payStubs.reduce((sum, stub) => sum + stub.grossPay, 0);
  const activeEmployees = employees.length;
  const avgNetPay = payStubs.length > 0 
    ? payStubs.reduce((sum, stub) => sum + stub.netPay, 0) / payStubs.length 
    : 0;

  // Expenses calculations
  const totalExpensesAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const pendingExpenses = expenses.filter(e => (e.status || 'pending_approval') === 'pending_approval');
  const approvedExpenses = expenses.filter(e => e.status === 'approved');
  const reimbursedExpenses = expenses.filter(e => e.status === 'reimbursed');
  const pendingAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Onboarding compliance
  const completedOnboarding = employees.filter(e => e.onboardingStatus === 'completed').length;
  const onboardingPct = activeEmployees > 0 ? Math.round((completedOnboarding / activeEmployees) * 100) : 100;

  // GPS TripLog stats
  const gpsExpenses = expenses.filter(e => e.source === 'gps_triplog');
  const gpsAmount = gpsExpenses.reduce((sum, e) => sum + e.amount, 0);

  const formatCAD = (num: number) => {
    return num.toLocaleString(isFr ? 'fr-CA' : 'en-CA', { 
      style: 'currency', 
      currency: 'CAD',
      maximumFractionDigits: 2 
    });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl mx-auto p-1 font-sans">
      {/* 1. Masse Salariale Brute */}
      <motion.div 
        variants={cardVariants}
        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              {isFr ? 'Masse Salariale Brute' : 'Gross Payroll Disbursed'}
            </p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              {isFr ? 'Cumulatif annuel calculé' : 'Cumulative total calculated'}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 whitespace-nowrap">
              <ArrowUpRight className="w-3 h-3" />
              {payStubs.length} {isFr ? 'paies émises' : 'pay stubs'}
            </span>
            <p className="text-2xl font-black text-slate-900 tracking-tight shrink-0">
              {formatCAD(totalPayroll)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 2. Employés Actifs */}
      <motion.div 
        variants={cardVariants}
        onClick={() => onNavigate?.('employees')}
        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl border border-purple-100 shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              {isFr ? 'Employés Actifs' : 'Active Employees'}
            </p>
            <p className="text-[12px] text-purple-600 font-medium mt-0.5 group-hover:underline">
              {isFr ? 'Gérer le personnel →' : 'Manage workforce →'}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 whitespace-nowrap">
              {isFr ? 'Effectif actif' : 'Active workforce'}
            </span>
            <div className="flex items-baseline gap-1.5 shrink-0">
              <p className="text-2xl font-black text-slate-900 tracking-tight">
                {activeEmployees}
              </p>
              <span className="text-xs font-medium text-slate-400">
                ({employees.filter(e => e.employmentType === 'full-time').length} {isFr ? 'temps plein' : 'full-time'})
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. Dépenses des Employés */}
      <motion.div 
        variants={cardVariants}
        onClick={() => onNavigate?.('expenses')}
        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 shrink-0 group-hover:scale-105 transition-transform">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col">
            <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              {isFr ? 'Dépenses des Employés' : 'Employee Submitted Expenses'}
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-[12px]">
              <span className="text-amber-600 font-bold">
                {formatCAD(pendingAmount)} {isFr ? 'à valider' : 'to review'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400 group-hover:text-amber-700 group-hover:underline">
                {isFr ? 'Détails →' : 'Details →'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex items-center gap-3">
            {pendingExpenses.length > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 animate-pulse whitespace-nowrap">
                <Clock className="w-3 h-3" />
                {pendingExpenses.length} {isFr ? 'en attente' : 'pending'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3" />
                {isFr ? 'À jour' : 'Up to date'}
              </span>
            )}
            <p className="text-2xl font-black text-slate-900 tracking-tight shrink-0">
              {formatCAD(totalExpensesAmount)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 4. Salaire Net Moyen */}
      <motion.div 
        variants={cardVariants}
        className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="flex flex-col w-full max-w-[200px]">
            <p className="text-xs font-bold text-slate-500 tracking-wider uppercase">
              {isFr ? 'Salaire Net Moyen' : 'Average Net Take-Home'}
            </p>
            <div className="flex items-center gap-2 mt-1.5 w-full">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex-1">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${onboardingPct}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-bold shrink-0">
                {completedOnboarding}/{activeEmployees}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:items-end gap-2">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 whitespace-nowrap">
              {onboardingPct}% {isFr ? 'conformité RH' : 'RH compliance'}
            </span>
            <p className="text-2xl font-black text-slate-900 tracking-tight shrink-0">
              {formatCAD(avgNetPay)}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
