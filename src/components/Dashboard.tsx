/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Calendar, 
  RefreshCw, 
  Sparkles, 
  Receipt, 
  Users, 
  TrendingUp, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { Employee, PayStub, BusinessExpense } from '../types';
import { Storage } from '../lib/storage';
import { DashboardStats } from './dashboard/DashboardStats';
import { DashboardCharts } from './dashboard/DashboardCharts';
import { DashboardExpensesWidget } from './dashboard/DashboardExpensesWidget';
import { DashboardEmployeeWidgets } from './dashboard/DashboardEmployeeWidgets';

export interface DashboardProps {
  employees: Employee[];
  payStubs: PayStub[];
  onNavigate?: (view: any) => void;
  expenses?: BusinessExpense[];
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  employees, 
  payStubs, 
  onNavigate,
  expenses: propExpenses 
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const { user, userProfile } = useAuth();

  const [expenses, setExpenses] = useState<BusinessExpense[]>(propExpenses || []);
  const [loadingExpenses, setLoadingExpenses] = useState(!propExpenses);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load expenses from backend/storage
  const loadExpenses = useCallback(async () => {
    try {
      const data = await Storage.getExpenses();
      if (Array.isArray(data)) {
        setExpenses(data);
      }
    } catch (err) {
      console.error('Failed to load expenses for dashboard', err);
    } finally {
      setLoadingExpenses(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!propExpenses) {
      loadExpenses();
    } else {
      setExpenses(propExpenses);
    }
  }, [propExpenses, loadExpenses]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadExpenses();
  };

  const displayName = user?.displayName || userProfile?.displayName || (user?.email ? user.email.split('@')[0] : 'Admin Direction');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-12"
    >
      {/* Top Welcome & Executive Header Bar */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ paddingLeft: '10px', paddingRight: '10px', paddingTop: '10px', paddingBottom: '10px' }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-black border border-blue-200 uppercase tracking-wider">
              {isFr ? 'Tableau de Bord Exécutif' : 'Executive Dashboard'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
              {isFr ? 'Année Fiscale 2026' : 'Fiscal Year 2026'}
            </span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {isFr ? `Bonjour, ${displayName}` : `Welcome back, ${displayName}`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFr 
              ? 'Aperçu centralisé de la paie Québec, conformité RH et approbation des notes de frais' 
              : 'Centralized overview of Quebec payroll, HR compliance, and employee expense claims'}
          </p>
        </div>

        {/* Quick Date & Refresh Button */}
        <div className="flex items-center justify-between sm:justify-end w-full md:w-auto gap-2.5 pt-3 md:pt-0 border-t border-slate-100 md:border-t-0 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] sm:text-xs font-medium text-slate-600" style={{ paddingLeft: '0px', paddingRight: '0px', paddingTop: '0px', paddingBottom: '0px' }}>
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {new Date().toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          </div>

          <button
            disabled={isRefreshing}
            onClick={handleManualRefresh}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
            title={isFr ? 'Actualiser les données' : 'Refresh dashboard'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="inline">{isFr ? 'Actualiser' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 1. Executive Metric Cards */}
      <DashboardStats
        employees={employees}
        payStubs={payStubs}
        expenses={expenses}
        isFr={isFr}
        onNavigate={onNavigate}
      />

      {/* 2. Visualizations & Multi-Chart Analytics */}
      <DashboardCharts
        employees={employees}
        payStubs={payStubs}
        expenses={expenses}
        isFr={isFr}
      />

      {/* 3. Operational Grid: Employee Expenses with Statuses & HR Management Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Employee Submitted Expenses & Status Tracking */}
        <div className="w-full">
          <DashboardExpensesWidget
            expenses={expenses}
            isFr={isFr}
            onNavigate={onNavigate}
            onRefreshExpenses={loadExpenses}
            userDisplayName={displayName}
          />
        </div>

        {/* Right Column: Employee Management & HR Widgets */}
        <div className="w-full">
          <DashboardEmployeeWidgets
            employees={employees}
            isFr={isFr}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </motion.div>
  );
};
