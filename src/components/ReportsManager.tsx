/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { PayStub, Employee, PayrollResult } from '../types';
import { formatCurrency } from '../lib/utils';
import { useLanguage } from './LanguageContext';
import { Storage } from '../lib/storage';
import { CNESST_SECTORS } from '../lib/constants';
import { calculateTaxByStatus } from '../services/salesTaxCalculator';
import { RemittancePeriodData, generatePD7APDF, generateTPZ1015PDF } from '../lib/pdfRemittance';
import { PD7AFormView } from './PD7AFormView';
import { TPZ1015FormView } from './TPZ1015FormView';
import { YearEndProcessingModule } from './YearEndProcessingModule';
import { ReportBuilderDashboard } from '../../features/reports/ReportBuilderDashboard';

import { TaxDocumentsModal } from './TaxDocumentsModal';
import { 
  FileText, 
  Download, 
  Building2, 
  Calendar, 
  DollarSign, 
  Printer, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  Landmark,
  FileCheck,
  UserCheck,
  Send,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ReportsManagerProps {
  stubs: PayStub[];
  employees: Employee[];
  activePayrollResult?: PayrollResult;
  activeGrossPay?: number;
  fiscalYear?: number;
}

type ReportTab = 'summary' | 'pd7a' | 'tpz1015' | 'yearend' | 'reportBuilder';

export const ReportsManager: React.FC<ReportsManagerProps> = ({ 
  stubs, 
  employees, 
  activePayrollResult,
  activeGrossPay = 2500,
  fiscalYear = 2026
}) => {
  const { language, t } = useLanguage();
  const isFr = language === 'fr';

  const [activeTab, setActiveTab] = useState<ReportTab>('summary');
  const [companySettings, setCompanySettings] = useState<{ companyName?: string; federalId?: string; neq?: string }>({
    companyName: 'Entreprise Démo Inc.',
    federalId: '123456789 RP 0001',
    neq: '1234567890 RS 0001'
  });

  // Unique list of periods (YYYY-MM) available in stubs
  const availablePeriods = useMemo(() => {
    const set = new Set<string>();
    stubs.forEach(s => {
      if (s.date && s.date.length >= 7) {
        set.add(s.date.substring(0, 7)); // e.g. "2026-08"
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [stubs]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    availablePeriods[0] || `${fiscalYear}-08`
  );
  const [useSimulationData, setUseSimulationData] = useState<boolean>(stubs.length === 0);
  const [isTaxDocsModalOpen, setIsTaxDocsModalOpen] = useState(false);
  const [taxDocsDefaultTab, setTaxDocsDefaultTab] = useState<'documents' | 'notify'>('documents');

  // GST / QST & CNESST Reporting State
  const [taxableSalesInput, setTaxableSalesInput] = useState<number>(25000);
  const [nonTaxableSalesInput, setNonTaxableSalesInput] = useState<number>(4500);
  const [cnesstReportSector, setCnesstReportSector] = useState<string>('15000');
  const [expenseItcSummary, setExpenseItcSummary] = useState<{
    taxableExpensesBase: number;
    nonTaxableExpenses: number;
    itcGst: number;
    itrQst: number;
  }>({ taxableExpensesBase: 0, nonTaxableExpenses: 0, itcGst: 0, itrQst: 0 });

  // Load saved company settings & expenses for ITC/ITR reconciliation
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settings, expensesList] = await Promise.all([
          Storage.getSettings(),
          Storage.getExpenses(),
        ]);
        if (settings) {
          setCompanySettings({
            companyName: settings.companyName || 'Mon Entreprise Inc.',
            federalId: settings.federalId || '123456789 RP 0001',
            neq: settings.neq || '1234567890 RS 0001'
          });
        }
        if (expensesList && expensesList.length > 0) {
          let taxBase = 0;
          let nonTax = 0;
          let itc = 0;
          let itr = 0;
          for (const exp of expensesList) {
            const isMeal = exp.category === 'meals';
            const factor = isMeal ? 0.5 : 1.0;
            const isExemptCat = ['insurance', 'interest', 'bank', 'bad_debts'].includes(exp.category);
            if (exp.taxBreakdown && typeof exp.taxBreakdown === 'object') {
              const tb = exp.taxBreakdown;
              const status = tb.taxStatus || (isExemptCat ? 'exempt' : 'taxable');
              if (status === 'exempt' || status === 'zero_rated') {
                nonTax += exp.amount;
              } else {
                const g = Number(tb.gst) || 0;
                const q = Number(tb.qst ?? tb.pst ?? 0) || 0;
                taxBase += tb.subTotal !== undefined ? Number(tb.subTotal) : Math.max(0, exp.amount - g - q);
                itc += tb.itcGst !== undefined ? Number(tb.itcGst) : Number((g * factor).toFixed(2));
                itr += tb.itrQst !== undefined ? Number(tb.itrQst) : Number((q * factor).toFixed(2));
              }
            } else if (isExemptCat) {
              nonTax += exp.amount;
            } else {
              const calc = calculateTaxByStatus(exp.amount, 'taxable', 'inclusive', factor);
              taxBase += calc.baseAmount;
              itc += calc.itcGst;
              itr += calc.itrQst;
            }
          }
          setExpenseItcSummary({
            taxableExpensesBase: Number(taxBase.toFixed(2)),
            nonTaxableExpenses: Number(nonTax.toFixed(2)),
            itcGst: Number(itc.toFixed(2)),
            itrQst: Number(itr.toFixed(2)),
          });
        }
      } catch (err) {
        console.error('Error loading settings', err);
      }
    };
    fetchSettings();
  }, []);

  // Compute accumulated remittance data for the selected period
  const remittanceData: RemittancePeriodData = useMemo(() => {
    const [yrStr, moStr] = selectedPeriod.split('-');
    const yr = parseInt(yrStr, 10) || fiscalYear;
    const mo = parseInt(moStr, 10) || 8;

    const monthNamesFr = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = isFr ? monthNamesFr[mo - 1] || 'Période' : monthNamesEn[mo - 1] || 'Period';

    // Due date is usually 15th of the following month
    const nextMonth = mo === 12 ? 1 : mo + 1;
    const nextYear = mo === 12 ? yr + 1 : yr;
    const paymentDueDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-15`;

    // Last day of current month
    const lastDay = new Date(yr, mo, 0).getDate();
    const periodEndDate = `${yr}-${String(mo).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Filter stubs
    const periodStubs = stubs.filter(s => s.date && s.date.startsWith(selectedPeriod));

    if (periodStubs.length > 0 && !useSimulationData) {
      const gross = periodStubs.reduce((sum, s) => sum + s.grossPay, 0);
      const fedTax = periodStubs.reduce((sum, s) => sum + s.federalTax, 0);
      const empEI = periodStubs.reduce((sum, s) => sum + s.ei, 0);
      const empyrEI = periodStubs.reduce((sum, s) => sum + (s.employerEI || s.ei * 1.4), 0);
      const qcTax = periodStubs.reduce((sum, s) => sum + s.quebecTax, 0);
      const empQPP = periodStubs.reduce((sum, s) => sum + s.qpp, 0);
      const empyrQPP = periodStubs.reduce((sum, s) => sum + (s.employerQPP || s.qpp), 0);
      const empQPIP = periodStubs.reduce((sum, s) => sum + s.qpip, 0);
      const empyrQPIP = periodStubs.reduce((sum, s) => sum + (s.employerQPIP || s.grossPay * 0.00602), 0);
      const hsf = periodStubs.reduce((sum, s) => sum + (s.hsf || s.grossPay * 0.0165), 0);
      const cnesst = periodStubs.reduce((sum, s) => sum + (s.labourStandards || s.grossPay * 0.0006), 0);

      const uniqueEmps = new Set(periodStubs.map(s => s.employeeId)).size || periodStubs.length;

      const totalFed = fedTax + empEI + empyrEI;
      const totalQc = qcTax + empQPP + empyrQPP + empQPIP + empyrQPIP + hsf + cnesst;

      return {
        periodLabel: `${monthName} ${yr}`,
        year: yr,
        monthName,
        periodEndDate,
        paymentDueDate,
        remittanceFrequency: isFr ? 'Mensuel' : 'Monthly',
        companyName: companySettings.companyName || 'Mon Entreprise Inc.',
        federalId: companySettings.federalId || '123456789 RP 0001',
        neq: companySettings.neq || '1234567890 RS 0001',
        employeeCount: uniqueEmps,
        grossPayroll: gross,
        federalTaxWithheld: fedTax,
        employeeEI: empEI,
        employerEI: empyrEI,
        totalEI: empEI + empyrEI,
        totalFederalRemittance: totalFed,
        quebecTaxWithheld: qcTax,
        employeeQPP: empQPP,
        employerQPP: empyrQPP,
        totalQPP: empQPP + empyrQPP,
        employeeQPIP: empQPIP,
        employerQPIP: empyrQPIP,
        totalQPIP: empQPIP + empyrQPIP,
        hsfAmount: hsf,
        labourStandardsAmount: cnesst,
        totalQuebecRemittance: totalQc,
        totalCombinedRemittance: totalFed + totalQc
      };
    }

    // Otherwise use active payroll result simulation
    const res = activePayrollResult;
    const gross = res ? res.grossPay : activeGrossPay;
    const fedTax = res ? res.federalTax : 285.50;
    const empEI = res ? res.ei : 32.50;
    const empyrEI = res ? res.employerEI : empEI * 1.4;
    const qcTax = res ? res.quebecTax : 395.20;
    const empQPP = res ? res.qpp : 157.50;
    const empyrQPP = res ? res.employerQPP : empQPP;
    const empQPIP = res ? res.qpip : 10.75;
    const empyrQPIP = res ? res.employerQPIP : 15.05;
    const hsf = res ? res.hsf : gross * 0.0165;
    const cnesst = res ? res.labourStandards : gross * 0.0006;

    const totalFed = fedTax + empEI + empyrEI;
    const totalQc = qcTax + empQPP + empyrQPP + empQPIP + empyrQPIP + hsf + cnesst;

    return {
      periodLabel: `${monthName} ${yr} (${isFr ? 'Période Active' : 'Active Period'})`,
      year: yr,
      monthName,
      periodEndDate,
      paymentDueDate,
      remittanceFrequency: isFr ? 'Aux 2 semaines' : 'Bi-weekly',
      companyName: companySettings.companyName || 'Mon Entreprise Inc.',
      federalId: companySettings.federalId || '123456789 RP 0001',
      neq: companySettings.neq || '1234567890 RS 0001',
      employeeCount: employees.length > 0 ? employees.length : 1,
      grossPayroll: gross,
      federalTaxWithheld: fedTax,
      employeeEI: empEI,
      employerEI: empyrEI,
      totalEI: empEI + empyrEI,
      totalFederalRemittance: totalFed,
      quebecTaxWithheld: qcTax,
      employeeQPP: empQPP,
      employerQPP: empyrQPP,
      totalQPP: empQPP + empyrQPP,
      employeeQPIP: empQPIP,
      employerQPIP: empyrQPIP,
      totalQPIP: empQPIP + empyrQPIP,
      hsfAmount: hsf,
      labourStandardsAmount: cnesst,
      totalQuebecRemittance: totalQc,
      totalCombinedRemittance: totalFed + totalQc
    };
  }, [selectedPeriod, useSimulationData, stubs, activePayrollResult, activeGrossPay, fiscalYear, employees, companySettings, isFr]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header & Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">{t('remittances_title')}</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t('remittances_desc')}
          </p>
        </div>

        {/* Global Quick Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setTaxDocsDefaultTab('documents');
              setIsTaxDocsModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            title={isFr ? "Télécharger les formulaires PDF (TD1, TP-1015, T4, RL-1)" : "Download Tax Forms (TD1, TP-1015, T4, RL-1)"}
          >
            <FileCheck className="w-3.5 h-3.5" />
            {isFr ? 'Documents Fiscaux (TD1, TP-1015, T4, RL-1)' : 'Tax Documents (TD1, TP-1015, T4, RL-1)'}
          </button>
          <button
            onClick={() => {
              setTaxDocsDefaultTab('notify');
              setIsTaxDocsModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            title={isFr ? "Aviser le nouvel employé par courriel" : "Send Onboarding Email to New Hire"}
          >
            <Send className="w-3.5 h-3.5" />
            {isFr ? 'Aviser Nouvel Employé' : 'Notify New Hire'}
          </button>
          <button
            onClick={() => {
              const doc = generatePD7APDF(remittanceData, language);
              doc.save(`PD7A_${remittanceData.periodEndDate}.pdf`);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            title="Télécharger le formulaire officiel PD7A"
          >
            <Download className="w-3.5 h-3.5" />
            PD7A (ARC)
          </button>
          <button
            onClick={() => {
              const doc = generateTPZ1015PDF(remittanceData, language);
              doc.save(`TPZ1015_${remittanceData.periodEndDate}.pdf`);
            }}
            className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            title="Télécharger le formulaire officiel TPZ-1015"
          >
            <Download className="w-3.5 h-3.5" />
            TPZ-1015 (RQ)
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div>
        {/* Mobile View: Native Dropdown */}
        <div className="md:hidden px-4 pt-3 pb-3 border-b border-gray-200 bg-white rounded-t-xl shadow-sm">
          <label htmlFor="tab-select" className="sr-only">
            {isFr ? 'Sélectionner un formulaire' : 'Select a form'}
          </label>
          <select
            id="tab-select"
            name="tabs"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as ReportTab)}
            className="block w-full rounded-lg border-gray-300 bg-gray-50 py-2.5 pl-3 pr-10 text-sm font-bold text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value="summary">{t('tab_remittances')}</option>
            <option value="pd7a">{t('tab_pd7a')}</option>
            <option value="tpz1015">{t('tab_tpz1015')}</option>
            <option value="yearend">{t('tab_yearend')}</option>
            <option value="reportBuilder">{isFr ? 'Générateur de Rapports' : 'Report Builder'}</option>
          </select>
        </div>

        {/* Desktop View: Horizontal Tabs */}
        <div className="hidden md:flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-3 gap-2 overflow-x-auto shadow-sm">
          <button
            onClick={() => setActiveTab('summary')}
            className={cn(
              "px-4 py-3 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-2 whitespace-nowrap",
              activeTab === 'summary' 
                ? "border-blue-600 text-blue-600 bg-blue-50/50" 
                : "border-transparent text-gray-500 hover:text-slate-800 hover:bg-gray-50"
            )}
          >
            <Layers className="w-4 h-4" />
            {t('tab_remittances')}
          </button>
          <button
            onClick={() => setActiveTab('pd7a')}
            className={cn(
              "px-4 py-3 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-2 whitespace-nowrap",
              activeTab === 'pd7a' 
                ? "border-slate-900 text-slate-900 bg-slate-50" 
                : "border-transparent text-gray-500 hover:text-slate-800 hover:bg-gray-50"
            )}
          >
            <Landmark className="w-4 h-4 text-slate-800" />
            {t('tab_pd7a')}
          </button>
          <button
            onClick={() => setActiveTab('tpz1015')}
            className={cn(
              "px-4 py-3 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-2 whitespace-nowrap",
              activeTab === 'tpz1015' 
                ? "border-blue-700 text-blue-700 bg-blue-50/50" 
                : "border-transparent text-gray-500 hover:text-slate-800 hover:bg-gray-50"
            )}
          >
            <Building2 className="w-4 h-4 text-blue-700" />
            {t('tab_tpz1015')}
          </button>
          <button
            onClick={() => setActiveTab('yearend')}
            className={cn(
              "px-4 py-3 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-2 whitespace-nowrap",
              activeTab === 'yearend' 
                ? "border-emerald-600 text-emerald-600 bg-emerald-50/50" 
                : "border-transparent text-gray-500 hover:text-slate-800 hover:bg-gray-50"
            )}
          >
            <FileText className="w-4 h-4" />
            {t('tab_yearend')}
          </button>
          <button
            onClick={() => setActiveTab('reportBuilder')}
            className={cn(
              "px-4 py-3 text-xs font-bold rounded-t-lg transition-all border-b-2 flex items-center gap-2 whitespace-nowrap",
              activeTab === 'reportBuilder' 
                ? "border-purple-600 text-purple-600 bg-purple-50/50" 
                : "border-transparent text-gray-500 hover:text-slate-800 hover:bg-gray-50"
            )}
          >
            <BarChart3 className="w-4 h-4 text-purple-600" />
            {isFr ? 'Générateur de Rapports' : 'Report Builder'}
          </button>
        </div>
      </div>

      {/* Period Selection Controls (shown on remittance tabs) */}
      {activeTab !== 'yearend' && activeTab !== 'reportBuilder' && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{t('period_selection')}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <select
                  value={selectedPeriod}
                  onChange={e => setSelectedPeriod(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {availablePeriods.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  {!availablePeriods.includes(`${fiscalYear}-08`) && (
                    <option value={`${fiscalYear}-08`}>{fiscalYear}-08 (Août)</option>
                  )}
                  {!availablePeriods.includes(`${fiscalYear}-07`) && (
                    <option value={`${fiscalYear}-07`}>{fiscalYear}-07 (Juillet)</option>
                  )}
                  {!availablePeriods.includes(`${fiscalYear}-06`) && (
                    <option value={`${fiscalYear}-06`}>{fiscalYear}-06 (Juin)</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                checked={useSimulationData}
                onChange={e => setUseSimulationData(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-medium text-slate-700">{t('active_simulation_period')}</span>
            </label>

            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase">{t('payment_due_date')}</span>
              <p className="font-mono font-bold text-rose-600 text-xs">{remittanceData.paymentDueDate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Executive Remittance Summary Cards */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Highlight KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Federal Total Box */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-xl shadow-md space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Agence du revenu du Canada</span>
                  <h3 className="text-base font-black mt-0.5">Formulaire PD7A</h3>
                </div>
                <button
                  onClick={() => setActiveTab('pd7a')}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 transition-all"
                  title="Voir le formulaire PD7A"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div>
                <p className="text-2xl font-black">{formatCurrency(remittanceData.totalFederalRemittance)}</p>
                <p className="text-[11px] text-slate-300 mt-1">
                  {language === 'fr' 
                    ? `Impôt Féd. (${formatCurrency(remittanceData.federalTaxWithheld)}) + AE (${formatCurrency(remittanceData.totalEI)})`
                    : `Fed. Tax (${formatCurrency(remittanceData.federalTaxWithheld)}) + EI (${formatCurrency(remittanceData.totalEI)})`}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-[10px] text-slate-400">
                <span>{language === 'fr' ? 'Échéance :' : 'Due Date:'} <strong className="text-white">{remittanceData.paymentDueDate}</strong></span>
                <button
                  onClick={() => {
                    const doc = generatePD7APDF(remittanceData, language);
                    doc.save(`PD7A_${remittanceData.periodEndDate}.pdf`);
                  }}
                  className="text-sky-300 hover:underline flex items-center gap-1 font-bold"
                >
                  <Download className="w-3 h-3" /> PDF
                </button>
              </div>
            </div>

            {/* Revenu Québec Total Box */}
            <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white p-5 rounded-xl shadow-md space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Revenu Québec</span>
                  <h3 className="text-base font-black mt-0.5">{language === 'fr' ? 'Formulaire TPZ-1015' : 'Form TPZ-1015'}</h3>
                </div>
                <button
                  onClick={() => setActiveTab('tpz1015')}
                  className="p-1.5 bg-blue-600 hover:bg-blue-500 rounded text-white transition-all"
                  title={language === 'fr' ? "Voir le formulaire TPZ-1015" : "View Form TPZ-1015"}
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div>
                <p className="text-2xl font-black">{formatCurrency(remittanceData.totalQuebecRemittance)}</p>
                <p className="text-[11px] text-blue-100 mt-1">
                  {language === 'fr'
                    ? `Impôt QC + RRQ (${formatCurrency(remittanceData.totalQPP)}) + RQAP (${formatCurrency(remittanceData.totalQPIP)}) + FSS/Normes`
                    : `QC Tax + QPP (${formatCurrency(remittanceData.totalQPP)}) + QPIP (${formatCurrency(remittanceData.totalQPIP)}) + HSF/Standards`}
                </p>
              </div>
              <div className="pt-2 border-t border-blue-600 flex justify-between items-center text-[10px] text-blue-200">
                <span>{language === 'fr' ? 'Échéance :' : 'Due Date:'} <strong className="text-white">{remittanceData.paymentDueDate}</strong></span>
                <button
                  onClick={() => {
                    const doc = generateTPZ1015PDF(remittanceData, language);
                    doc.save(`TPZ1015_${remittanceData.periodEndDate}.pdf`);
                  }}
                  className="text-yellow-300 hover:underline flex items-center gap-1 font-bold"
                >
                  <Download className="w-3 h-3" /> PDF
                </button>
              </div>
            </div>

            {/* Combined Remittances */}
            <div className="bg-gradient-to-br from-emerald-700 to-teal-900 text-white p-5 rounded-xl shadow-md space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">{t('total_combined_remittances')}</span>
                <h3 className="text-base font-black mt-0.5">{language === 'fr' ? 'Total Dû aux Organismes' : 'Total Due to Agencies'}</h3>
              </div>
              <div>
                <p className="text-3xl font-black">{formatCurrency(remittanceData.totalCombinedRemittance)}</p>
                <p className="text-[11px] text-emerald-100 mt-1">
                  {language === 'fr'
                    ? `Masse assujettie : ${formatCurrency(remittanceData.grossPayroll)} (${remittanceData.employeeCount} employés)`
                    : `Gross payroll: ${formatCurrency(remittanceData.grossPayroll)} (${remittanceData.employeeCount} employees)`}
                </p>
              </div>
              <div className="pt-2 border-t border-emerald-600 flex justify-between items-center text-[10px] text-emerald-200">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> {language === 'fr' ? 'Calcul automatique conforme' : 'Compliant automatic calculation'}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Side-by-Side Remittance Lines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CRA Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider">{language === 'fr' ? 'Détail ARC / CRA (Formulaire PD7A)' : 'CRA / ARC Breakdown (Form PD7A)'}</h4>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {remittanceData.federalId || '123456789RP0001'}
                </span>
              </div>
              <div className="divide-y divide-gray-100 text-xs">
                <div className="p-3.5 flex justify-between items-center">
                  <span className="text-gray-600">{t('line_fed_tax')}</span>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(remittanceData.federalTaxWithheld)}</span>
                </div>
                <div className="p-3.5 flex justify-between items-center">
                  <div>
                    <span className="text-gray-600">{language === 'fr' ? 'Assurance-Emploi (Employé - 1.30%)' : 'Employment Insurance (Employee - 1.30%)'}</span>
                  </div>
                  <span className="font-mono text-slate-700">{formatCurrency(remittanceData.employeeEI)}</span>
                </div>
                <div className="p-3.5 flex justify-between items-center">
                  <div>
                    <span className="text-gray-600">{language === 'fr' ? 'Assurance-Emploi (Part patronale 1.4x)' : 'Employment Insurance (Employer Share 1.4x)'}</span>
                  </div>
                  <span className="font-mono text-slate-700">{formatCurrency(remittanceData.employerEI)}</span>
                </div>
                <div className="p-3.5 bg-slate-50 flex justify-between items-center font-bold text-slate-900">
                  <span>{t('line_ei_total')}</span>
                  <span className="font-mono">{formatCurrency(remittanceData.totalEI)}</span>
                </div>
                <div className="p-4 bg-blue-50/50 flex justify-between items-center font-black text-sm text-blue-900">
                  <span>{t('total_cra_remittance')}</span>
                  <span className="font-mono text-blue-700">{formatCurrency(remittanceData.totalFederalRemittance)}</span>
                </div>
              </div>
            </div>

            {/* Revenu Québec Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-blue-700 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                  <h4 className="text-xs font-bold uppercase tracking-wider">{language === 'fr' ? 'Détail Revenu Québec (TPZ-1015.R.14.2-V)' : 'Revenu Québec Breakdown (TPZ-1015.R.14.2-V)'}</h4>
                </div>
                <span className="text-[10px] font-mono bg-blue-800 px-2 py-0.5 rounded text-blue-100">
                  {remittanceData.neq || '1234567890RS0001'}
                </span>
              </div>
              <div className="divide-y divide-gray-100 text-xs">
                <div className="p-3 flex justify-between items-center">
                  <span className="text-gray-600">{language === 'fr' ? 'Ligne 1 - Impôt du Québec retenu' : 'Line 1 - Quebec Tax Withheld'}</span>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(remittanceData.quebecTaxWithheld)}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <div>
                    <span className="text-gray-600">{language === 'fr' ? 'Ligne 2 - RRQ (Employé + Employeur 100%)' : 'Line 2 - QPP (Employee + Employer 100%)'}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(remittanceData.totalQPP)}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <div>
                    <span className="text-gray-600">{language === 'fr' ? 'Ligne 3 - RQAP (Employé + Employeur)' : 'Line 3 - QPIP (Employee + Employer)'}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(remittanceData.totalQPIP)}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-gray-600">{language === 'fr' ? 'Ligne 4 - Fonds des services de santé (FSS)' : 'Line 4 - Health Services Fund (HSF)'}</span>
                  <span className="font-mono text-slate-700">{formatCurrency(remittanceData.hsfAmount)}</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <span className="text-gray-600">{language === 'fr' ? 'Ligne 5 - Normes du travail (CNESST)' : 'Line 5 - Labour Standards (CNESST)'}</span>
                  <span className="font-mono text-slate-700">{formatCurrency(remittanceData.labourStandardsAmount)}</span>
                </div>
                <div className="p-4 bg-emerald-50/50 flex justify-between items-center font-black text-sm text-emerald-950">
                  <span>{t('total_rq_remittance')}</span>
                  <span className="font-mono text-emerald-700">{formatCurrency(remittanceData.totalQuebecRemittance)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CNESST Sector Dues & GST/QST (FPZ-500-V) Taxable vs Non-Taxable Reporting */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CNESST Sector Dues Assessment Card */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-amber-200 overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="p-4 bg-amber-600 text-white flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      {isFr ? 'Cotisations CNESST (Taux Sectoriel)' : 'CNESST Sector Dues Calculation'}
                    </h4>
                    <p className="text-[10px] text-amber-100">
                      {isFr ? 'Calcul basé sur le salaire assurable et l\'unité de classification' : 'Based on insurable salary and sector unit rate'}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono bg-amber-700 px-2 py-0.5 rounded text-amber-100 font-bold">
                    CNESST QC
                  </span>
                </div>
                <div className="p-4 space-y-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      {isFr ? 'Unité de Classification Sectorielle CNESST' : 'CNESST Sector Classification Unit'}
                    </label>
                    <select
                      value={cnesstReportSector}
                      onChange={e => setCnesstReportSector(e.target.value)}
                      className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-lg text-xs font-semibold text-slate-800 outline-none cursor-pointer"
                    >
                      {CNESST_SECTORS.map(sec => (
                        <option key={sec.code} value={sec.code}>
                          {isFr ? sec.labelFr : sec.labelEn} ({sec.rate.toFixed(2)}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  {(() => {
                    const sec = CNESST_SECTORS.find(s => s.code === cnesstReportSector) || CNESST_SECTORS[3];
                    const insurablePayroll = remittanceData.grossPayroll;
                    const sectorDues = Number((insurablePayroll * (sec.rate / 100)).toFixed(2));
                    const cntDues = remittanceData.labourStandardsAmount;
                    return (
                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                          <span className="text-gray-600">{isFr ? 'Masse salariale assurable (période)' : 'Insurable Payroll (Period)'}</span>
                          <span className="font-mono font-bold text-slate-800">{formatCurrency(insurablePayroll)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                          <span className="text-gray-600">{isFr ? `Taux de l'unité #${sec.code}` : `Sector Unit #${sec.code} Rate`}</span>
                          <span className="font-mono font-bold text-amber-800">{sec.rate.toFixed(2)} %</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                          <span className="text-gray-600">{isFr ? 'Cotisation SST (Santé & Sécurité)' : 'OHS Sector Assessment'}</span>
                          <span className="font-mono font-bold text-slate-900">{formatCurrency(sectorDues)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5">
                          <span className="text-gray-600">{isFr ? 'Normes du travail (CNT 0,06%)' : 'Labour Standards (0.06%)'}</span>
                          <span className="font-mono text-slate-700">{formatCurrency(cntDues)}</span>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex justify-between items-center font-black text-amber-950">
                          <span>{isFr ? 'Total Versement CNESST' : 'Total CNESST Remittance'}</span>
                          <span className="font-mono text-sm text-amber-800">{formatCurrency(sectorDues + cntDues)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* GST (5%) & QST (9.975%) Tax Reporting & Taxable vs Non-Taxable Reconciliation (Form FPZ-500-V) */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-emerald-200 overflow-hidden shadow-sm">
              <div className="p-4 bg-emerald-800 text-white flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {isFr ? 'Déclaration TPS (5%) & TVQ (9,975%) — Formulaire FPZ-500-V' : 'GST (5%) & QST (9.975%) Tax Return — Form FPZ-500-V'}
                  </h4>
                  <p className="text-[10px] text-emerald-100">
                    {isFr
                      ? 'Ventilation des biens/services taxables vs non taxables et conciliation CTI / RTI'
                      : 'Differentiation of taxable vs non-taxable goods/services and ITC / ITR reconciliation'}
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-emerald-900 px-2.5 py-0.5 rounded text-emerald-200 font-bold">
                  TPS 5% • TVQ 9,975%
                </span>
              </div>

              <div className="p-4 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-1">
                      {isFr ? 'Ventes / Services Taxables (Ligne 101 - HT)' : 'Taxable Sales / Services (Line 101 - Base)'}
                    </label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={taxableSalesInput || ''}
                      onChange={e => setTaxableSalesInput(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-emerald-50/40 border border-emerald-200 rounded-lg font-mono font-bold text-slate-900 outline-none focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      {isFr ? 'Fournitures Non Taxables / Exonérées (Ligne 90 - 0%)' : 'Non-Taxable / Exempt Supplies (Line 90 - 0%)'}
                    </label>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={nonTaxableSalesInput || ''}
                      onChange={e => setNonTaxableSalesInput(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-700 outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                </div>

                {(() => {
                  const collectedTax = calculateTaxByStatus(taxableSalesInput, 'taxable', 'exclusive', 1.0);
                  const gstCollected = collectedTax.gst;
                  const qstCollected = collectedTax.qst;
                  const netGst = Number((gstCollected - expenseItcSummary.itcGst).toFixed(2));
                  const netQst = Number((qstCollected - expenseItcSummary.itrQst).toFixed(2));
                  const totalNetSalesTax = Number((netGst + netQst).toFixed(2));

                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100">
                          <span className="text-[9px] font-bold text-blue-800 uppercase block">
                            {isFr ? 'TPS Perçue (5%)' : 'GST Collected (5%)'}
                          </span>
                          <span className="font-mono font-bold text-sm text-blue-950">{formatCurrency(gstCollected)}</span>
                          <span className="text-[9px] text-blue-700 block">
                            CTI: -{formatCurrency(expenseItcSummary.itcGst)}
                          </span>
                        </div>

                        <div className="p-2.5 bg-indigo-50/60 rounded-lg border border-indigo-100">
                          <span className="text-[9px] font-bold text-indigo-800 uppercase block">
                            {isFr ? 'TVQ Perçue (9,975%)' : 'QST Collected (9.975%)'}
                          </span>
                          <span className="font-mono font-bold text-sm text-indigo-950">{formatCurrency(qstCollected)}</span>
                          <span className="text-[9px] text-indigo-700 block">
                            RTI: -{formatCurrency(expenseItcSummary.itrQst)}
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-600 uppercase block">
                            {isFr ? 'Dépenses Taxables' : 'Taxable Expenses'}
                          </span>
                          <span className="font-mono font-bold text-sm text-slate-800">{formatCurrency(expenseItcSummary.taxableExpensesBase)}</span>
                          <span className="text-[9px] text-slate-500 block">
                            {isFr ? 'Exonérées :' : 'Exempt:'} {formatCurrency(expenseItcSummary.nonTaxableExpenses)}
                          </span>
                        </div>

                        <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                          <span className="text-[9px] font-bold text-emerald-800 uppercase block">
                            {isFr ? 'Solde Net TPS + TVQ' : 'Net GST + QST Due'}
                          </span>
                          <span className="font-mono font-black text-sm text-emerald-900">{formatCurrency(totalNetSalesTax)}</span>
                          <span className="text-[9px] text-emerald-700 block">
                            TPS {formatCurrency(netGst)} • TVQ {formatCurrency(netQst)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Visual PD7A Form */}
      {activeTab === 'pd7a' && (
        <PD7AFormView data={remittanceData} />
      )}

      {/* Tab 3: Visual TPZ-1015 Form */}
      {activeTab === 'tpz1015' && (
        <TPZ1015FormView data={remittanceData} />
      )}

      {/* Tab 4: Year-End RL-1 / T4 Tax Processing Module */}
      {activeTab === 'yearend' && (
        <YearEndProcessingModule
          stubs={stubs}
          employees={employees}
          companySettings={companySettings}
          fiscalYear={fiscalYear}
        />
      )}

      {/* Tab 5: Advanced Report Builder */}
      {activeTab === 'reportBuilder' && (
        <ReportBuilderDashboard
          stubs={stubs}
          employees={employees}
          language={language}
        />
      )}



      {/* Tax Documents Hub & Onboarding Notification Modal */}
      <TaxDocumentsModal
        isOpen={isTaxDocsModalOpen}
        onClose={() => setIsTaxDocsModalOpen(false)}
        employees={employees}
        stubs={stubs}
        companyName={companySettings.companyName || 'Mon Entreprise Inc.'}
        defaultTab={taxDocsDefaultTab}
      />
    </div>
  );
};
