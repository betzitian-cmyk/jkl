/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PayrollResult, Employee } from '../types';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { Download, Info, FileDown, ShieldCheck, AlertCircle, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { exportPayrollCalculationPDF } from '../lib/exportPayrollPdf';
import { Storage } from '../lib/storage';

interface PayrollSummaryProps {
  result: PayrollResult;
  employee?: Employee;
  fiscalYear: number;
  payPeriod?: { startDate: string, endDate: string };
}

export const PayrollSummary: React.FC<PayrollSummaryProps> = ({ result, employee, fiscalYear, payPeriod }) => {
  const { t, language } = useLanguage();
  const chartData = result.breakdown.filter(item => item.amount > 0);

  const handleDownloadPDF = async () => {
    let companySettings: any = null;
    try {
      companySettings = await Storage.getSettings();
    } catch {
      // fallback
    }

    exportPayrollCalculationPDF({
      result,
      employee,
      fiscalYear,
      frequency: employee?.frequency || 'bi-weekly',
      payPeriod,
      language: language as 'fr' | 'en',
      companyInfo: {
        name: companySettings?.companyName,
        address: companySettings?.address,
        employerNumber: companySettings?.revenuQuebecId,
        neq: companySettings?.neq,
        federalId: companySettings?.federalId,
      }
    });
  };

  return (
    <div className="space-y-6">
      {payPeriod && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-900">
                {language === 'fr' ? 'Période de paie' : 'Pay Period'}
              </h3>
              <p className="text-sm font-semibold text-blue-800">
                {payPeriod.startDate} &mdash; {payPeriod.endDate}
              </p>
            </div>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-100/80 border border-blue-200 font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
            title={language === 'fr' ? 'Exporter les résultats de paie en format PDF' : 'Export payroll calculation results to PDF format'}
          >
            <FileDown className="w-4 h-4 text-blue-600" />
            <span>{language === 'fr' ? 'Exporter PDF' : 'Export PDF'}</span>
          </button>
        </div>
      )}

      {/* Statutory Caps Monitoring Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              {t('statutory_caps_status')} ({fiscalYear})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {result.qppCapped || result.eiCapped || result.qpipCapped ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                {language === 'fr' ? '⚠️ Cotisations automatiquement plafonnées' : '⚠️ Automatic Capping Triggered'}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {language === 'fr' ? '✓ Cotisations en cours (Sous plafond)' : '✓ In progress (Under cap)'}
              </span>
            )}
          </div>
        </div>

        {/* 4 Progress Bars for QPP, EI, QPIP, and CNESST */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* QPP */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-slate-700">RRQ / QPP</span>
              {result.qppCapped ? (
                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  {t('cap_reached')}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-semibold">
                  {formatCurrency(result.qppRemainingCap)} {language === 'fr' ? 'restant' : 'left'}
                </span>
              )}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1.5">
              <div 
                className={`h-full transition-all ${result.qppCapped ? 'bg-amber-500' : 'bg-blue-600'}`}
                style={{ width: `${Math.min(100, (result.ytdNewQPP / result.annualMaxQPP) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>YTD: {formatCurrency(result.ytdNewQPP)}</span>
              <span>Max: {formatCurrency(result.annualMaxQPP)}</span>
            </div>
          </div>

          {/* EI */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-slate-700">AE / EI (QC)</span>
              {result.eiCapped ? (
                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  {t('cap_reached')}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-semibold">
                  {formatCurrency(result.eiRemainingCap)} {language === 'fr' ? 'restant' : 'left'}
                </span>
              )}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1.5">
              <div 
                className={`h-full transition-all ${result.eiCapped ? 'bg-amber-500' : 'bg-slate-700'}`}
                style={{ width: `${Math.min(100, (result.ytdNewEI / result.annualMaxEI) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>YTD: {formatCurrency(result.ytdNewEI)}</span>
              <span>Max: {formatCurrency(result.annualMaxEI)}</span>
            </div>
          </div>

          {/* QPIP */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-slate-700">RQAP / QPIP</span>
              {result.qpipCapped ? (
                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  {t('cap_reached')}
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-semibold">
                  {formatCurrency(result.qpipRemainingCap)} {language === 'fr' ? 'restant' : 'left'}
                </span>
              )}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-1.5">
              <div 
                className={`h-full transition-all ${result.qpipCapped ? 'bg-amber-500' : 'bg-purple-600'}`}
                style={{ width: `${Math.min(100, (result.ytdNewQPIP / result.annualMaxQPIP) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500">
              <span>YTD: {formatCurrency(result.ytdNewQPIP)}</span>
              <span>Max: {formatCurrency(result.annualMaxQPIP)}</span>
            </div>
          </div>

          {/* CNESST */}
          <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200/80">
            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
              <span className="text-amber-900">
                CNESST ({(result.cnesstRateApplied ?? 1.50).toFixed(2)}%)
              </span>
              {result.cnesstCapped ? (
                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                  {t('cap_reached')}
                </span>
              ) : (
                <span className="text-[10px] text-amber-800 font-mono font-bold">
                  {formatCurrency(result.cnesst)}
                </span>
              )}
            </div>
            <div className="w-full bg-amber-200/60 rounded-full h-2 overflow-hidden mb-1.5">
              <div 
                className={`h-full transition-all ${result.cnesstCapped ? 'bg-amber-600' : 'bg-amber-500'}`}
                style={{ width: `${Math.min(100, ((result.ytdNewCNESSTInsurable || result.grossPay) / (result.annualMaxCNESSTInsurable || 103000)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-amber-800/80">
              <span>{language === 'fr' ? 'Unité' : 'Unit'} #{result.cnesstSectorCode || '15000'}</span>
              <span>Max: {formatCurrency(result.annualMaxCNESSTInsurable || 103000)}</span>
            </div>
          </div>
        </div>

        {/* Active Statutory Notes Badges */}
        {(result.hasMultipleEmployersApplied || result.t1213ReductionApplied > 0 || result.tp1016ReductionApplied > 0 || result.preTaxRrspDeduction > 0 || result.postTaxHealthDeduction > 0) && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60">
            {result.hasMultipleEmployersApplied && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-50 text-red-700 text-[10px] font-bold border border-red-200">
                <AlertCircle className="w-3 h-3" />
                {language === 'fr' ? 'TD1 Plus d\'un employeur ($0 montant de base)' : 'TD1 Multiple Employers ($0 Basic Claim)'}
              </span>
            )}
            {result.t1213ReductionApplied > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                <CheckCircle2 className="w-3 h-3" />
                {language === 'fr' ? `Lettre T1213 ARC (-${formatCurrency(result.t1213ReductionApplied)})` : `CRA T1213 Letter (-${formatCurrency(result.t1213ReductionApplied)})`}
              </span>
            )}
            {result.tp1016ReductionApplied > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                <CheckCircle2 className="w-3 h-3" />
                {language === 'fr' ? `Lettre TP-1016 RQ (-${formatCurrency(result.tp1016ReductionApplied)})` : `Revenu QC TP-1016 (-${formatCurrency(result.tp1016ReductionApplied)})`}
              </span>
            )}
            {result.preTaxRrspDeduction > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-50 text-sky-700 text-[10px] font-bold border border-sky-200">
                <TrendingUp className="w-3 h-3" />
                {language === 'fr' ? `REER Avant Impôt (${formatCurrency(result.preTaxRrspDeduction)})` : `Pre-tax RRSP (${formatCurrency(result.preTaxRrspDeduction)})`}
              </span>
            )}
            {result.postTaxHealthDeduction > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200">
                {language === 'fr' ? `Santé Après Impôt (${formatCurrency(result.postTaxHealthDeduction)})` : `Post-tax Health (${formatCurrency(result.postTaxHealthDeduction)})`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards Row (Balanced 4-Card Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 border border-gray-200 rounded-xl shadow-xs"
        >
          <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">{t('gross_pay')}</p>
          <p className="text-2xl font-bold mt-1 text-slate-800">{formatCurrency(result.grossPay)}</p>
          <div className="mt-2 space-y-1">
            {(result.vacationPay || 0) > 0 && (
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-tight">
                <span className="text-gray-400">{t('vacation')}:</span>
                <span className="text-blue-600">{formatCurrency(result.vacationPay || 0)}</span>
              </div>
            )}
            {(result.overtimePay || 0) > 0 && (
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-tight">
                <span className="text-gray-400">{t('overtime')}:</span>
                <span className="text-orange-600">{formatCurrency(result.overtimePay || 0)}</span>
              </div>
            )}
            {(result.bonusPay || 0) > 0 && (
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-tight">
                <span className="text-gray-400">{t('bonus')}:</span>
                <span className="text-blue-600 font-extrabold">{formatCurrency(result.bonusPay || 0)}</span>
              </div>
            )}
            {!result.vacationPay && !result.overtimePay && !result.bonusPay && (
              <div className="text-[10px] text-slate-400 font-medium italic">
                {language === 'fr' ? 'Base de calcul standard' : 'Standard calculation base'}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 border border-gray-200 rounded-xl shadow-xs"
        >
          <p className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">{t('total_deductions')}</p>
          <p className="text-2xl font-bold mt-1 text-rose-600">{formatCurrency(result.totalDeductions)}</p>
          <p className="text-[10px] text-gray-400 mt-1 font-medium italic">
            {language === 'fr' ? 'Taux eff.' : 'Eff. rate'} {((result.totalDeductions / result.grossPay) * 100).toFixed(1)}%
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 border border-emerald-100 rounded-xl shadow-xs bg-emerald-50/20"
        >
          <p className="text-[11px] text-emerald-700 uppercase font-bold tracking-wider">{t('net_pay')}</p>
          <p className="text-2xl font-black mt-1 text-emerald-600">{formatCurrency(result.netPay)}</p>
          <p className="text-[10px] text-emerald-600 mt-1 font-medium">
            {language === 'fr' ? 'À verser à l\'employé' : 'To be paid to employee'}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900 p-4 border border-slate-800 rounded-xl shadow-xs"
        >
          <p className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">{t('employer_costs')}</p>
          <p className="text-2xl font-bold mt-1 text-white">{formatCurrency(result.totalEmployerCost)}</p>
          <p className="text-[10px] text-slate-500 mt-1 font-medium italic">
            {language === 'fr' ? 'Inclut charges patronales' : 'Includes employer charges'}
          </p>
        </motion.div>
      </div>

      {/* High-Impact PDF Export Action Banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-4 sm:p-5 text-white shadow-lg border border-blue-500/25 flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30 shrink-0">
            <FileDown className="w-5 h-5 text-blue-300 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black tracking-tight">
              {language === 'fr' 
                ? 'Exporter les résultats du calcul de paie en PDF' 
                : 'Export Payroll Calculation Results to PDF'}
            </h4>
            <p className="text-xs text-blue-200/80 mt-0.5">
              {language === 'fr'
                ? 'Génère un rapport officiel complet via jsPDF incluant ventilation itemisée des retenues, salaire net et charges patronales.'
                : 'Generates a publication-grade official report via jsPDF with complete breakdown of deductions, net pay, and employer costs.'}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadPDF}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <FileDown className="w-4 h-4 text-white" />
          <span>{language === 'fr' ? 'Télécharger PDF (jsPDF)' : 'Download PDF (jsPDF)'}</span>
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Breakdown */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-4 bg-white p-6 border border-gray-200 rounded-lg shadow-sm h-[320px] flex flex-col"
        >
          <div className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-4">
            {language === 'fr' ? 'Répartition graphique' : 'Graphical Breakdown'}
          </div>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="amount"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Detailed Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  <th className="px-4 py-3">{language === 'fr' ? 'Description' : 'Description'}</th>
                  <th className="px-4 py-3 text-right">{t('amount')}</th>
                  <th className="px-4 py-3 text-right">{language === 'fr' ? 'Proportion' : 'Share'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {result.breakdown.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-medium text-slate-700 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 text-right">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-gray-400 font-medium text-right">
                      {item.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* CNESST Sector Dues & GST/QST Sales Tax Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CNESST Sector Dues Card */}
        <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-amber-100 pb-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">
                {language === 'fr' ? 'Cotisations CNESST (Santé & Sécurité)' : 'CNESST Dues (Sector Assessment)'}
              </h4>
              <p className="text-[10px] text-slate-500">
                {language === 'fr'
                  ? `Unité sectorielle #${result.cnesstSectorCode || '15000'} • Taux appliqué : ${(result.cnesstRateApplied ?? 1.50).toFixed(2)} %`
                  : `Sector Unit #${result.cnesstSectorCode || '15000'} • Applied Rate: ${(result.cnesstRateApplied ?? 1.50).toFixed(2)}%`}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-lg font-mono font-black text-xs border border-amber-200">
              {formatCurrency(result.cnesst)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-amber-50/50 p-2 rounded border border-amber-100">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">
                {language === 'fr' ? 'Salaire Assurable' : 'Insurable Salary'}
              </span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(result.cnesstInsurableEarnings ?? result.grossPay)}
              </span>
            </div>
            <div className="bg-amber-50/50 p-2 rounded border border-amber-100">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">
                {language === 'fr' ? 'Plafond Annuel' : 'Annual Max Cap'}
              </span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(result.annualMaxCNESSTInsurable || 103000)}
              </span>
            </div>
            <div className="bg-amber-50/50 p-2 rounded border border-amber-100">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">
                {language === 'fr' ? 'Normes (CNT 0,06%)' : 'Standards (0.06%)'}
              </span>
              <span className="font-mono font-bold text-slate-800">
                {formatCurrency(result.labourStandards)}
              </span>
            </div>
          </div>
        </div>

        {/* GST (5%) & QST (9.975%) Sales Tax Tracking Card */}
        <div className="bg-white border border-emerald-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                {language === 'fr' ? 'Suivi TPS (5%) & TVQ (9,975%) — Biens & Services' : 'GST (5%) & QST (9.975%) — Goods & Services'}
              </h4>
              <p className="text-[10px] text-slate-500">
                {language === 'fr'
                  ? 'Ventilation des fournitures taxables et non taxables / exonérées'
                  : 'Differentiation of taxable vs non-taxable / exempt supplies'}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-lg font-mono font-black text-xs border border-emerald-200">
              {formatCurrency((result.gst || 0) + (result.qst || 0))}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100">
              <span className="text-[9px] text-emerald-800 uppercase font-bold block">
                {language === 'fr' ? 'Taxable (HT)' : 'Taxable Base'}
              </span>
              <span className="font-mono font-bold text-slate-900">
                {formatCurrency(result.taxableSupplyAmount || 0)}
              </span>
            </div>
            <div className="bg-slate-50 p-2 rounded border border-slate-200">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">
                {language === 'fr' ? 'Non-Taxable' : 'Non-Taxable'}
              </span>
              <span className="font-mono font-bold text-slate-700">
                {formatCurrency(result.nonTaxableSupplyAmount || 0)}
              </span>
            </div>
            <div className="bg-blue-50/60 p-2 rounded border border-blue-100">
              <span className="text-[9px] text-blue-800 uppercase font-bold block">
                {language === 'fr' ? 'TPS (5 %)' : 'GST (5%)'}
              </span>
              <span className="font-mono font-bold text-blue-900">
                {formatCurrency(result.gst || 0)}
              </span>
            </div>
            <div className="bg-indigo-50/60 p-2 rounded border border-indigo-100">
              <span className="text-[9px] text-indigo-800 uppercase font-bold block">
                {language === 'fr' ? 'TVQ (9,975 %)' : 'QST (9.975%)'}
              </span>
              <span className="font-mono font-bold text-indigo-900">
                {formatCurrency(result.qst || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Info - DUAL MODE */}
      <div className="bg-slate-50 border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
        <div className="p-4 flex gap-6 items-center">
          <div className="flex-grow flex flex-col justify-center">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
              {language === 'fr' ? 'Sommaire Employé (Retenues & Cotisations)' : 'Employee Summary (Deductions & Contributions)'}
            </h4>
            <div className="grid grid-cols-4 gap-4 mt-1">
               <div>
                  <p className="text-[10px] text-gray-400">{t('qpp')}</p>
                  <p className="text-xs font-bold text-slate-700">
                    {formatCurrency(result.qpp)}
                    {result.qppCapped && <span className="text-[9px] text-amber-600 block">({t('cap_reached')})</span>}
                  </p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-400">{t('qpip')}</p>
                  <p className="text-xs font-bold text-slate-700">
                    {formatCurrency(result.qpip)}
                    {result.qpipCapped && <span className="text-[9px] text-amber-600 block">({t('cap_reached')})</span>}
                  </p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-400">{t('ei')}</p>
                  <p className="text-xs font-bold text-slate-700">
                    {formatCurrency(result.ei)}
                    {result.eiCapped && <span className="text-[9px] text-amber-600 block">({t('cap_reached')})</span>}
                  </p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-400">{t('prov_tax')}</p>
                  <p className="text-xs font-bold text-slate-700">{formatCurrency(result.quebecTax)}</p>
               </div>
            </div>
          </div>
        </div>

        <div className="p-4 flex gap-6 items-center bg-white/50">
          <div className="flex-grow flex flex-col justify-center">
            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">
              {language === 'fr' ? 'Sommaire Employeur (Charges)' : 'Employer Summary (Charges)'}
            </h4>
            <div className="grid grid-cols-6 gap-4 mt-1">
               <div>
                  <p className="text-[10px] text-gray-400">{t('qpp')} Pat.</p>
                  <p className="text-xs font-bold text-blue-800">{formatCurrency(result.employerQPP)}</p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-400">{t('qpip')} Pat.</p>
                  <p className="text-xs font-bold text-blue-800">{formatCurrency(result.employerQPIP)}</p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-400">{t('ei')} Pat.</p>
                  <p className="text-xs font-bold text-blue-800">{formatCurrency(result.employerEI)}</p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-400">FSS</p>
                  <p className="text-xs font-bold text-blue-800">{formatCurrency(result.hsf)}</p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-400">CNESST</p>
                  <p className="text-xs font-bold text-blue-800">{formatCurrency(result.employerCNESST)}</p>
               </div>
               <div>
                  <p className="text-[10px] text-gray-400">{language === 'fr' ? 'Normes' : 'Standards'}</p>
                  <p className="text-xs font-bold text-blue-800">{formatCurrency(result.labourStandards)}</p>
               </div>
            </div>
          </div>
          <div className="w-48 border-l border-gray-200 pl-6 hidden md:flex flex-col justify-center">
             <div className="flex items-center text-blue-700">
               <Info className="w-4 h-4 mr-2" />
               <p className="text-[10px] font-bold uppercase">{language === 'fr' ? `Estimé fiscal ${fiscalYear}` : `${fiscalYear} Fiscal Estimate`}</p>
             </div>
             <p className="text-[9px] text-slate-500 mt-1 leading-tight italic">
               {language === 'fr' 
                 ? "Conforme au guide de l'employeur Revenu Québec & CRA." 
                 : "Compliant with Revenu Québec & CRA guidelines."}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
