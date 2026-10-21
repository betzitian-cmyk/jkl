/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { PayFrequency, GarnishmentCategory } from '../types';
import { 
  Calculator, 
  DollarSign, 
  Calendar, 
  Clock, 
  X, 
  Check, 
  HelpCircle, 
  TrendingDown, 
  ShieldAlert,
  Sparkles,
  Info,
  CalendarCheck,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLanguage } from './LanguageContext';

export interface GarnishmentCalcResult {
  perPayAmount: number;
  totalDebt: number;
  monthlyLimit: number;
  remainingPeriods: number;
  estimatedMonths: number;
  finalPayment: number;
  category?: GarnishmentCategory;
}

interface GarnishmentCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  frequency: PayFrequency;
  initialAmount?: number;
  initialTotalDebt?: number;
  initialMonthlyLimit?: number;
  initialCategory?: GarnishmentCategory;
  onApply: (perPayAmount: number, details?: GarnishmentCalcResult) => void;
}

export const GarnishmentCalculatorModal: React.FC<GarnishmentCalculatorModalProps> = ({
  isOpen,
  onClose,
  frequency,
  initialAmount = 0,
  initialTotalDebt = 5000,
  initialMonthlyLimit,
  initialCategory = 'civil_judgment',
  onApply
}) => {
  const { t, language } = useLanguage();
  const isFr = language === 'fr';

  // Periods per year calculation
  const getPeriodsPerYear = (freq: PayFrequency): number => {
    switch (freq) {
      case 'weekly': return 52;
      case 'bi-weekly': return 26;
      case 'semi-monthly': return 24;
      case 'monthly': return 12;
      case 'annually': return 1;
      default: return 26;
    }
  };

  const periodsPerYear = getPeriodsPerYear(frequency);

  // Derive initial monthly limit
  const defaultMonthlyLimit = initialMonthlyLimit ?? (
    initialAmount > 0 
      ? Number(((initialAmount * periodsPerYear) / 12).toFixed(2)) 
      : 500
  );

  const [totalDebt, setTotalDebt] = useState<number>(initialTotalDebt || 5000);
  const [monthlyLimit, setMonthlyLimit] = useState<number>(defaultMonthlyLimit);
  const [useCustomPerPay, setUseCustomPerPay] = useState<boolean>(false);
  const [customPerPay, setCustomPerPay] = useState<number>(initialAmount || 0);
  const [category, setCategory] = useState<GarnishmentCategory>(initialCategory);
  const [showSchedule, setShowSchedule] = useState<boolean>(false);

  // Calculate default per-pay deduction from monthly limit
  const calculatedPerPayFromMonthly = useMemo(() => {
    if (monthlyLimit <= 0 || periodsPerYear <= 0) return 0;
    return Number(((monthlyLimit * 12) / periodsPerYear).toFixed(2));
  }, [monthlyLimit, periodsPerYear]);

  const activePerPay = useCustomPerPay ? customPerPay : calculatedPerPayFromMonthly;

  // Synchronize when opening or inputs change
  useEffect(() => {
    if (isOpen) {
      if (initialTotalDebt) setTotalDebt(initialTotalDebt);
      if (initialCategory) setCategory(initialCategory);
      if (initialAmount > 0) {
        setCustomPerPay(initialAmount);
        const approxMonthly = Number(((initialAmount * periodsPerYear) / 12).toFixed(2));
        setMonthlyLimit(initialMonthlyLimit || approxMonthly);
      } else if (initialMonthlyLimit) {
        setMonthlyLimit(initialMonthlyLimit);
      }
    }
  }, [isOpen, initialAmount, initialTotalDebt, initialMonthlyLimit, initialCategory, periodsPerYear]);

  // Calculations
  const remainingPeriods = useMemo(() => {
    if (activePerPay <= 0 || totalDebt <= 0) return 0;
    return Math.ceil(totalDebt / activePerPay);
  }, [activePerPay, totalDebt]);

  const fullPeriods = useMemo(() => {
    if (activePerPay <= 0 || totalDebt <= 0) return 0;
    return Math.floor(totalDebt / activePerPay);
  }, [activePerPay, totalDebt]);

  const finalRemainder = useMemo(() => {
    if (activePerPay <= 0 || totalDebt <= 0) return 0;
    const remainder = totalDebt - (fullPeriods * activePerPay);
    return remainder > 0.005 ? Number(remainder.toFixed(2)) : 0;
  }, [activePerPay, totalDebt, fullPeriods]);

  const estimatedMonths = useMemo(() => {
    if (periodsPerYear <= 0 || remainingPeriods <= 0) return 0;
    return Number(((remainingPeriods / periodsPerYear) * 12).toFixed(1));
  }, [remainingPeriods, periodsPerYear]);

  const estimatedWeeks = useMemo(() => {
    if (periodsPerYear <= 0 || remainingPeriods <= 0) return 0;
    return Number(((remainingPeriods / periodsPerYear) * 52).toFixed(0));
  }, [remainingPeriods, periodsPerYear]);

  // Completion date projection
  const completionDate = useMemo(() => {
    const d = new Date();
    if (remainingPeriods > 0 && periodsPerYear > 0) {
      const daysToAdd = (remainingPeriods / periodsPerYear) * 365;
      d.setDate(d.getDate() + daysToAdd);
    }
    return d;
  }, [remainingPeriods, periodsPerYear]);

  const formattedCompletionDate = useMemo(() => {
    return completionDate.toLocaleDateString(isFr ? 'fr-CA' : 'en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, [completionDate, isFr]);

  // Generate schedule rows (first 3, middle ellipsis if needed, last 3)
  const scheduleRows = useMemo(() => {
    if (remainingPeriods <= 0 || activePerPay <= 0) return [];
    
    const rows: Array<{
      periodNum: number;
      payment: number;
      balanceAfter: number;
    }> = [];

    let currentBalance = totalDebt;
    for (let i = 1; i <= remainingPeriods; i++) {
      const payment = i === remainingPeriods && finalRemainder > 0 
        ? finalRemainder 
        : Math.min(activePerPay, currentBalance);
      currentBalance = Math.max(0, Number((currentBalance - payment).toFixed(2)));
      
      rows.push({
        periodNum: i,
        payment,
        balanceAfter: currentBalance
      });
    }

    return rows;
  }, [remainingPeriods, activePerPay, totalDebt, finalRemainder]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (activePerPay > 0) {
      onApply(activePerPay, {
        perPayAmount: activePerPay,
        totalDebt,
        monthlyLimit,
        remainingPeriods,
        estimatedMonths,
        finalPayment: finalRemainder > 0 ? finalRemainder : activePerPay,
        category
      });
      onClose();
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat(isFr ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 2
    }).format(val);
  };

  const getFrequencyLabel = (freq: PayFrequency) => {
    switch (freq) {
      case 'weekly': return isFr ? 'Hebdomadaire (52 paies/an)' : 'Weekly (52 pays/yr)';
      case 'bi-weekly': return isFr ? 'Aux deux semaines (26 paies/an)' : 'Bi-weekly (26 pays/yr)';
      case 'semi-monthly': return isFr ? 'Bimensuel (24 paies/an)' : 'Semi-monthly (24 pays/yr)';
      case 'monthly': return isFr ? 'Mensuel (12 paies/an)' : 'Monthly (12 pays/yr)';
      case 'annually': return isFr ? 'Annuel (1 paie/an)' : 'Annually (1 pay/yr)';
      default: return freq;
    }
  };

  const debtPresets = [1000, 2500, 5000, 10000, 20000];
  const limitPresets = [150, 300, 500, 750, 1000];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white">
                {t('garnishment_calculator')}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {t('frequency_badge')}: <span className="text-blue-400 font-semibold">{getFrequencyLabel(frequency)}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title={t('delete')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Explanation Banner */}
          <div className="text-xs text-slate-600 leading-relaxed bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-blue-900 block mb-0.5">
                {isFr ? 'Calcul automatique de l\'échéancier' : 'Automated Payoff Schedule Calculation'}
              </span>
              <span>{t('garnishment_calc_desc')}</span>
            </div>
          </div>

          {/* Garnishment Category Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t('garnishment_category_label')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('family_support')}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center ${
                  category === 'family_support'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isFr ? 'Soutien familial (P1)' : 'Family Support (P1)'}
              </button>
              <button
                type="button"
                onClick={() => setCategory('tax_arrears')}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center ${
                  category === 'tax_arrears'
                    ? 'bg-amber-50 border-amber-400 text-amber-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isFr ? 'Arriérés fiscaux (P2)' : 'Tax Arrears (P2)'}
              </button>
              <button
                type="button"
                onClick={() => setCategory('civil_judgment')}
                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center ${
                  category === 'civil_judgment'
                    ? 'bg-blue-50 border-blue-400 text-blue-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {isFr ? 'Jugement civil (P3)' : 'Civil Judgment (P3)'}
              </button>
            </div>
          </div>

          {/* Main Inputs: Total Debt & Monthly Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Input 1: Total Debt */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  {t('total_debt_amount')} *
                </label>
                <span className="text-[10px] font-mono font-bold text-slate-400">CAD</span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={totalDebt || ''}
                  onChange={(e) => setTotalDebt(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="5000.00"
                />
              </div>

              {/* Debt Quick Presets */}
              <div className="flex flex-wrap gap-1 pt-1">
                {debtPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTotalDebt(preset)}
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors ${
                      totalDebt === preset 
                        ? 'bg-blue-600 text-white border-blue-600 font-bold' 
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    ${preset >= 1000 ? `${preset / 1000}k` : preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Input 2: Monthly Limit */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                  {t('monthly_limit')} *
                </label>
                <span className="text-[10px] font-mono font-bold text-slate-400">CAD / {isFr ? 'mois' : 'mo'}</span>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={monthlyLimit || ''}
                  onChange={(e) => {
                    setMonthlyLimit(Math.max(0, parseFloat(e.target.value) || 0));
                    setUseCustomPerPay(false);
                  }}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="500.00"
                />
              </div>

              {/* Monthly Limit Quick Presets */}
              <div className="flex flex-wrap gap-1 pt-1">
                {limitPresets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setMonthlyLimit(preset);
                      setUseCustomPerPay(false);
                    }}
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors ${
                      monthlyLimit === preset && !useCustomPerPay
                        ? 'bg-blue-600 text-white border-blue-600 font-bold' 
                        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    ${preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Per Pay Period Sync Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                {t('per_pay_deduction')}
              </span>
              <span className="text-xs px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold">
                {frequency}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={activePerPay || ''}
                  onChange={(e) => {
                    setUseCustomPerPay(true);
                    setCustomPerPay(Math.max(0, parseFloat(e.target.value) || 0));
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-base font-black text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="230.77"
                />
              </div>
              {useCustomPerPay && (
                <button
                  type="button"
                  onClick={() => setUseCustomPerPay(false)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline transition-colors"
                >
                  {isFr ? 'Réinitialiser' : 'Reset'}
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-500 font-mono">
              {isFr 
                ? `Formule légale : (${formatCurrency(monthlyLimit)} × 12 mois) ÷ ${periodsPerYear} paies = ${formatCurrency(calculatedPerPayFromMonthly)} / paie`
                : `Statutory formula: (${formatCurrency(monthlyLimit)} × 12 mo) ÷ ${periodsPerYear} pays = ${formatCurrency(calculatedPerPayFromMonthly)} / pay`}
            </p>
          </div>

          {/* Payoff Projection Metrics Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  {t('payoff_timeline')}
                </span>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {t('full_settlement')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              {/* Remaining Pay Periods */}
              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-300 mb-1">
                  {t('remaining_pay_periods')}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white">
                    {remainingPeriods}
                  </span>
                  <span className="text-xs text-blue-200 font-medium">
                    {t('periods')}
                  </span>
                </div>
              </div>

              {/* Estimated Duration */}
              <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-300 mb-1">
                  {t('estimated_duration')}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white">
                    {estimatedMonths}
                  </span>
                  <span className="text-xs text-blue-200 font-medium">
                    {t('months')} ({estimatedWeeks} {t('weeks')})
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown Detail */}
            <div className="pt-2 text-xs text-slate-300 space-y-2 border-t border-slate-700/60 font-sans">
              <div className="flex justify-between items-center">
                <span>{isFr ? 'Versements réguliers complets :' : 'Full regular installments:'}</span>
                <span className="font-mono font-bold text-white">
                  {fullPeriods > 0 ? `${fullPeriods} × ${formatCurrency(activePerPay)}` : '0'}
                </span>
              </div>
              {finalRemainder > 0 && (
                <div className="flex justify-between items-center text-amber-300 font-medium">
                  <span>{t('final_payment_estimate')} :</span>
                  <span className="font-mono font-bold">{formatCurrency(finalRemainder)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-slate-200 pt-1.5 border-t border-white/10">
                <span>{isFr ? 'Date estimée d\'extinction totale :' : 'Estimated debt completion date:'}</span>
                <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded text-xs">{formattedCompletionDate}</span>
              </div>
            </div>
          </div>

          {/* Toggle Amortization Schedule */}
          {remainingPeriods > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSchedule(!showSchedule)}
                className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('amortization_schedule')} ({remainingPeriods} {t('periods')})</span>
                </div>
                {showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showSchedule && (
                <div className="max-h-52 overflow-y-auto p-2 bg-white text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                      <tr>
                        <th className="p-2">{t('pay_period_num')}</th>
                        <th className="p-2 text-right">{t('payment_amount')}</th>
                        <th className="p-2 text-right">{t('balance_remaining')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {scheduleRows.slice(0, 10).map(row => (
                        <tr key={row.periodNum} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-700">#{row.periodNum}</td>
                          <td className="p-2 text-right text-blue-600">{formatCurrency(row.payment)}</td>
                          <td className="p-2 text-right text-slate-600">{formatCurrency(row.balanceAfter)}</td>
                        </tr>
                      ))}
                      {scheduleRows.length > 12 && (
                        <tr>
                          <td colSpan={3} className="p-2 text-center text-slate-400 italic text-[11px]">
                            ... {scheduleRows.length - 12} {isFr ? 'périodes intermédiaires' : 'intermediate periods'} ...
                          </td>
                        </tr>
                      )}
                      {scheduleRows.length > 10 && scheduleRows.slice(-2).map(row => (
                        <tr key={row.periodNum} className={row.balanceAfter === 0 ? "bg-emerald-50 font-bold" : "hover:bg-slate-50"}>
                          <td className="p-2 text-slate-700">
                            #{row.periodNum} {row.balanceAfter === 0 && <span className="text-[10px] text-emerald-600 font-sans ml-1">({t('debt_cleared')})</span>}
                          </td>
                          <td className="p-2 text-right text-blue-600">{formatCurrency(row.payment)}</td>
                          <td className="p-2 text-right text-slate-600">{formatCurrency(row.balanceAfter)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {remainingPeriods > 0 && (
              <span>
                <strong className="text-slate-800">{remainingPeriods}</strong> {t('periods')} | <strong className="text-slate-800">{formatCurrency(activePerPay)}</strong> / {isFr ? 'paie' : 'pay'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={activePerPay <= 0 || totalDebt <= 0}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all"
            >
              <Check className="w-4 h-4" />
              {t('apply_to_garnishment')} ({formatCurrency(activePerPay)})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
