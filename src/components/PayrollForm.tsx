/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PayFrequency, Garnishment, GarnishmentCategory } from '../types';
import { CNESST_SECTORS } from '../lib/constants';
import { calculateTaxByStatus, TaxabilityStatus, TaxCalculationMode } from '../services/salesTaxCalculator';
import { formatCurrency } from '../lib/utils';
import { Calculator, DollarSign, Calendar, Plus, X, ShieldAlert, Clock, CheckCircle, HardHat, Receipt } from 'lucide-react';
import { useLanguage } from './LanguageContext';
import { GarnishmentCalculatorModal, GarnishmentCalcResult } from './GarnishmentCalculatorModal';

interface PayrollFormProps {
  grossPay: number;
  frequency: PayFrequency;
  bonusPay: number;
  vacationPay: number;
  overtimePay: number;
  commissionPay?: number;
  commissionExpenses?: number;
  rrspContribution: number;
  taxableBenefitsFederal: number;
  taxableBenefitsProvincial: number;
  garnishments: Garnishment[];
  // YTD Balances for Capping Triggers
  ytdQPP?: number;
  ytdEI?: number;
  ytdQPIP?: number;
  ytdCnesstInsurable?: number;
  // CNESST Sector & Dues Controls
  cnesstSectorCode?: string;
  cnesstEmployerRate?: number;
  includeCnesstInDeductions?: boolean;
  // GST & QST Taxable vs Non-Taxable Services/Goods
  taxableSupplyAmount?: number;
  nonTaxableSupplyAmount?: number;
  supplyTaxability?: TaxabilityStatus;
  supplyTaxMode?: TaxCalculationMode;
  // Statutory Forms & Voluntary Deductions
  hasMultipleEmployers?: boolean;
  claimFederalBasicPersonalAmount?: boolean;
  federalTd1ClaimAmount?: number;
  t1213FederalReduction?: number;
  claimProvincialBasicPersonalAmount?: boolean;
  quebecTp1015Line10Code?: string;
  tp1016QuebecReduction?: number;
  voluntaryPreTaxRrsp?: number;
  voluntaryPostTaxHealth?: number;
  onChange: (updates: { 
    grossPay?: number; 
    frequency?: PayFrequency;
    bonusPay?: number;
    vacationPay?: number;
    overtimePay?: number;
    commissionPay?: number;
    commissionExpenses?: number;
    rrspContribution?: number;
    taxableBenefitsFederal?: number;
    taxableBenefitsProvincial?: number;
    garnishments?: Garnishment[];
    ytdQPP?: number;
    ytdEI?: number;
    ytdQPIP?: number;
    ytdCnesstInsurable?: number;
    cnesstSectorCode?: string;
    cnesstEmployerRate?: number;
    includeCnesstInDeductions?: boolean;
    taxableSupplyAmount?: number;
    nonTaxableSupplyAmount?: number;
    supplyTaxability?: TaxabilityStatus;
    supplyTaxMode?: TaxCalculationMode;
    hasMultipleEmployers?: boolean;
    claimFederalBasicPersonalAmount?: boolean;
    federalTd1ClaimAmount?: number;
    t1213FederalReduction?: number;
    claimProvincialBasicPersonalAmount?: boolean;
    quebecTp1015Line10Code?: string;
    tp1016QuebecReduction?: number;
    voluntaryPreTaxRrsp?: number;
    voluntaryPostTaxHealth?: number;
  }) => void;
}

export const PayrollForm: React.FC<PayrollFormProps> = ({ 
  grossPay, 
  frequency, 
  bonusPay,
  vacationPay,
  overtimePay,
  commissionPay = 0,
  commissionExpenses = 0,
  rrspContribution,
  taxableBenefitsFederal,
  taxableBenefitsProvincial,
  garnishments = [],
  ytdQPP = 0,
  ytdEI = 0,
  ytdQPIP = 0,
  ytdCnesstInsurable = 0,
  cnesstSectorCode = '15000',
  cnesstEmployerRate = 1.50,
  includeCnesstInDeductions = false,
  taxableSupplyAmount = 0,
  nonTaxableSupplyAmount = 0,
  supplyTaxability = 'taxable',
  supplyTaxMode = 'exclusive',
  hasMultipleEmployers = false,
  claimFederalBasicPersonalAmount = true,
  federalTd1ClaimAmount,
  t1213FederalReduction = 0,
  claimProvincialBasicPersonalAmount = true,
  quebecTp1015Line10Code = 'A',
  tp1016QuebecReduction = 0,
  voluntaryPreTaxRrsp = 0,
  voluntaryPostTaxHealth = 0,
  onChange 
}) => {
  const { t, language } = useLanguage();
  const isFr = language === 'fr';
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);
  const [targetGarnishmentId, setTargetGarnishmentId] = useState<string | null>(null);
  const [showStatutorySection, setShowStatutorySection] = useState(true);

  const totalPeriodGross = grossPay + bonusPay + vacationPay + overtimePay + commissionPay;
  const activeSector = CNESST_SECTORS.find(s => s.code === cnesstSectorCode);
  const effectiveCnesstRate = cnesstEmployerRate !== undefined ? cnesstEmployerRate : (activeSector?.rate || 1.50);
  const previewCnesstDues = Number((Math.min(totalPeriodGross, Math.max(0, 103000 - ytdCnesstInsurable)) * (effectiveCnesstRate / 100)).toFixed(2));
  const previewSalesTax = calculateTaxByStatus(taxableSupplyAmount, supplyTaxability as TaxabilityStatus, supplyTaxMode as TaxCalculationMode, 1.0);

  const addGarnishment = (initialAmount: number = 0) => {
    const newGarnishment: Garnishment = {
      id: Math.random().toString(36).substr(2, 9),
      category: 'civil_judgment',
      amount: initialAmount
    };
    onChange({ garnishments: [...garnishments, newGarnishment] });
    return newGarnishment.id;
  };

  const removeGarnishment = (id: string) => {
    onChange({ garnishments: garnishments.filter(g => g.id !== id) });
  };

  const updateGarnishment = (id: string, updates: Partial<Garnishment>) => {
    onChange({
      garnishments: garnishments.map(g => g.id === id ? { ...g, ...updates } : g)
    });
  };

  const openCalculator = (garnishmentId?: string) => {
    setTargetGarnishmentId(garnishmentId || null);
    setIsCalcModalOpen(true);
  };

  const handleApplyCalculatedAmount = (amount: number, details?: GarnishmentCalcResult) => {
    if (targetGarnishmentId) {
      updateGarnishment(targetGarnishmentId, { 
        amount,
        category: details?.category || undefined,
        totalDebt: details?.totalDebt,
        monthlyLimit: details?.monthlyLimit,
        remainingPeriods: details?.remainingPeriods
      });
    } else if (garnishments.length > 0) {
      updateGarnishment(garnishments[0].id, { 
        amount,
        category: details?.category || undefined,
        totalDebt: details?.totalDebt,
        monthlyLimit: details?.monthlyLimit,
        remainingPeriods: details?.remainingPeriods
      });
    } else {
      const newGarnishment: Garnishment = {
        id: Math.random().toString(36).substr(2, 9),
        category: details?.category || 'civil_judgment',
        amount,
        totalDebt: details?.totalDebt,
        monthlyLimit: details?.monthlyLimit,
        remainingPeriods: details?.remainingPeriods
      };
      onChange({ garnishments: [...garnishments, newGarnishment] });
    }
  };

  const activeTargetGarnishment = targetGarnishmentId 
    ? garnishments.find(g => g.id === targetGarnishmentId)
    : garnishments[0];

  const currentInitialAmount = activeTargetGarnishment?.amount || 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-1.5 bg-blue-50 rounded text-blue-600">
          <Calculator className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
          {t('payroll_settings')}
        </h2>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{t('gross_pay')}</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                value={grossPay || ''}
                onChange={(e) => onChange({ grossPay: parseFloat(e.target.value) || 0 })}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-slate-900 font-medium"
                placeholder="0,00 $"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5">{t('bonus')}</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                value={bonusPay || ''}
                onChange={(e) => onChange({ bonusPay: parseFloat(e.target.value) || 0 })}
                className="w-full pl-9 pr-3 py-2 bg-blue-50/30 border border-blue-100 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-blue-900 font-bold"
                placeholder="0,00 $"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('vacation')}</label>
            <input
              type="number"
              value={vacationPay || ''}
              onChange={(e) => onChange({ vacationPay: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-600"
              placeholder="0,00 $"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t('overtime')}</label>
            <input
              type="number"
              value={overtimePay || ''}
              onChange={(e) => onChange({ overtimePay: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-600"
              placeholder="0,00 $"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">{language === 'fr' ? 'Commissions' : 'Commissions'}</label>
            <input
              type="number"
              value={commissionPay || ''}
              onChange={(e) => onChange({ commissionPay: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none text-amber-900 font-semibold"
              placeholder="0,00 $"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">{t('reer')}</label>
            <input
              type="number"
              value={rrspContribution || ''}
              onChange={(e) => onChange({ rrspContribution: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded text-xs focus:ring-1 focus:ring-emerald-500 outline-none text-emerald-700 font-bold"
              placeholder="0,00 $"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t('wage_garnishments')}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openCalculator()}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                title={t('garnishment_calculator')}
              >
                <Calculator className="w-3 h-3" />
                <span>{t('garnishment_calculator')}</span>
              </button>
              <button
                type="button"
                onClick={() => addGarnishment()}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors uppercase"
              >
                <Plus className="w-3 h-3" /> {t('add')}
              </button>
            </div>
          </div>

          {garnishments.length === 0 ? (
            <div className="text-center py-3 bg-gray-50 rounded-lg border border-dashed border-gray-200 space-y-1">
              <p className="text-[11px] text-gray-500 font-medium">
                {t('no_garnishments')}
              </p>
              <button
                type="button"
                onClick={() => openCalculator()}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                <Calculator className="w-3 h-3" /> {language === 'fr' ? 'Calculer et ajouter une saisie avec échéancier' : 'Calculate and add a garnishment with payoff schedule'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {garnishments.map((g) => (
                <div key={g.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100 relative group animate-in fade-in slide-in-from-top-1 space-y-2">
                  <div className="flex gap-2 sm:gap-3 items-end">
                    <div className="flex-1 min-w-[130px]">
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">
                        {t('category')}
                      </label>
                      <select
                        value={g.category}
                        onChange={(e) => updateGarnishment(g.id, { category: e.target.value as GarnishmentCategory })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[11px] focus:ring-1 focus:ring-blue-500 outline-none font-medium"
                      >
                        <option value="family_support">{t('family_support')}</option>
                        <option value="tax_arrears">{t('tax_arrears')}</option>
                        <option value="civil_judgment">{t('civil_judgment')}</option>
                      </select>
                    </div>
                    <div className="w-36">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[9px] font-bold text-gray-400 uppercase">
                          {t('amount')}
                        </label>
                        <button
                          type="button"
                          onClick={() => openCalculator(g.id)}
                          className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                          title={t('garnishment_calculator')}
                        >
                          <Calculator className="w-2.5 h-2.5" />
                          <span>{language === 'fr' ? 'Échéancier' : 'Schedule'}</span>
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-300">
                          <DollarSign className="w-3 h-3" />
                        </div>
                        <input
                          type="number"
                          value={g.amount || ''}
                          onChange={(e) => updateGarnishment(g.id, { amount: parseFloat(e.target.value) || 0 })}
                          className="w-full pl-6 pr-2 py-1.5 bg-white border border-slate-200 rounded text-[11px] focus:ring-1 focus:ring-blue-500 outline-none font-bold text-slate-700"
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeGarnishment(g.id)}
                      className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                      title={t('delete')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {g.totalDebt && g.totalDebt > 0 ? (
                    <div className="pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-500">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        <span className="text-slate-700 font-bold">
                          {language === 'fr' ? 'Dette :' : 'Debt:'} ${g.totalDebt.toFixed(2)}
                        </span>
                        {g.monthlyLimit ? (
                          <span className="text-slate-400">
                            (max ${g.monthlyLimit}/mo)
                          </span>
                        ) : null}
                      </div>
                      {g.remainingPeriods ? (
                        <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold text-[9px] border border-indigo-100">
                          {g.remainingPeriods} {t('periods')}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1.5">{t('taxable_benefit_prov')}</label>
            <input
              type="number"
              value={taxableBenefitsProvincial || ''}
              onChange={(e) => onChange({ taxableBenefitsProvincial: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-orange-50 border border-orange-100 rounded text-xs focus:ring-1 focus:ring-orange-500 outline-none text-orange-900"
              placeholder={language === 'fr' ? "ex: Santé (Empl.)" : "e.g. Health (Emp.)"}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">{t('taxable_benefit_fed')}</label>
            <input
              type="number"
              value={taxableBenefitsFederal || ''}
              onChange={(e) => onChange({ taxableBenefitsFederal: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-amber-50 border border-amber-100 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none text-amber-900"
              placeholder={language === 'fr' ? "ex: Vie (Empl.)" : "e.g. Life (Emp.)"}
            />
          </div>
        </div>

        {/* Voluntary Pre-tax and Post-tax Deductions */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {language === 'fr' ? 'Déductions Volontaires & Régimes' : 'Voluntary Deductions & Plans'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-sky-600 uppercase tracking-widest">
                  {t('voluntary_pre_tax_rrsp')}
                </label>
                <span className="text-[9px] text-sky-500 font-semibold uppercase">{language === 'fr' ? 'Avant Impôt' : 'Pre-tax'}</span>
              </div>
              <input
                type="number"
                value={voluntaryPreTaxRrsp || ''}
                onChange={(e) => onChange({ voluntaryPreTaxRrsp: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-sky-50/40 border border-sky-200 rounded text-xs focus:ring-1 focus:ring-sky-500 outline-none text-sky-900 font-bold"
                placeholder="0,00 $"
              />
              <p className="text-[9px] text-slate-400 mt-1">{t('voluntary_pre_tax_desc')}</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-bold text-purple-600 uppercase tracking-widest">
                  {t('voluntary_post_tax_health')}
                </label>
                <span className="text-[9px] text-purple-500 font-semibold uppercase">{language === 'fr' ? 'Après Impôt' : 'Post-tax'}</span>
              </div>
              <input
                type="number"
                value={voluntaryPostTaxHealth || ''}
                onChange={(e) => onChange({ voluntaryPostTaxHealth: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-purple-50/40 border border-purple-200 rounded text-xs focus:ring-1 focus:ring-purple-500 outline-none text-purple-900 font-bold"
                placeholder="0,00 $"
              />
              <p className="text-[9px] text-slate-400 mt-1">{t('voluntary_post_tax_desc')}</p>
            </div>
          </div>
        </div>

        {/* Statutory Tax Profiles & Automated YTD Caps Section */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                {t('statutory_profiles')}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowStatutorySection(!showStatutorySection)}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800"
            >
              {showStatutorySection ? (language === 'fr' ? 'Masquer' : 'Hide') : (language === 'fr' ? 'Afficher' : 'Show')}
            </button>
          </div>

          {showStatutorySection && (
            <div className="space-y-4 bg-slate-50/70 p-4 rounded-lg border border-slate-200 animate-in fade-in">
              {/* YTD Cumulative Paid Balances (Triggers automatic stops) */}
              <div>
                <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">
                  {t('ytd_caps_tracking')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                      {t('ytd_qpp_paid')}
                    </label>
                    <input
                      type="number"
                      value={ytdQPP || ''}
                      onChange={(e) => onChange({ ytdQPP: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 font-semibold"
                      placeholder="0,00 $"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                      {t('ytd_ei_paid')}
                    </label>
                    <input
                      type="number"
                      value={ytdEI || ''}
                      onChange={(e) => onChange({ ytdEI: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 font-semibold"
                      placeholder="0,00 $"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                      {t('ytd_qpip_paid')}
                    </label>
                    <input
                      type="number"
                      value={ytdQPIP || ''}
                      onChange={(e) => onChange({ ytdQPIP: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 font-semibold"
                      placeholder="0,00 $"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-amber-600 uppercase mb-1">
                      {isFr ? 'Cumul Salaire CNESST' : 'YTD CNESST Salary'}
                    </label>
                    <input
                      type="number"
                      value={ytdCnesstInsurable || ''}
                      onChange={(e) => onChange({ ytdCnesstInsurable: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-amber-50/40 border border-amber-200 rounded text-xs focus:ring-1 focus:ring-amber-500 outline-none text-amber-900 font-semibold"
                      placeholder="0,00 $"
                    />
                  </div>
                </div>
              </div>

              {/* CNESST Sector Classification & Dues Calculation */}
              <div className="pt-2 border-t border-slate-200/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-800 uppercase tracking-tight flex items-center gap-1.5">
                    <HardHat className="w-3.5 h-3.5 text-amber-600" />
                    {isFr ? 'Cotisations CNESST (Taux Sectoriel & Salaire Assurable)' : 'CNESST Dues (Sector Rate & Insurable Salary)'}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                    {formatCurrency(previewCnesstDues)} ({effectiveCnesstRate.toFixed(2)}%)
                  </span>
                </div>

                <div className="space-y-2 bg-white p-3 rounded border border-amber-200/70">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                      {isFr ? 'Unité de Classification Sectorielle CNESST' : 'CNESST Sector Classification Unit'}
                    </label>
                    <select
                      value={cnesstSectorCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        const sector = CNESST_SECTORS.find(s => s.code === code);
                        onChange({
                          cnesstSectorCode: code,
                          cnesstEmployerRate: sector ? sector.rate : cnesstEmployerRate
                        });
                      }}
                      className="w-full px-2.5 py-1.5 bg-amber-50/30 border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer"
                    >
                      {CNESST_SECTORS.map(sec => (
                        <option key={sec.code} value={sec.code}>
                          {isFr ? sec.labelFr : sec.labelEn} ({sec.rate.toFixed(2)}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                        {isFr ? 'Taux CNESST personnalisé (% / 100 $)' : 'Custom CNESST Rate (% per $100)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="25"
                        value={cnesstEmployerRate ?? ''}
                        onChange={(e) => onChange({ cnesstEmployerRate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono font-bold text-amber-900 focus:ring-1 focus:ring-amber-500 outline-none"
                        placeholder="1.50"
                      />
                    </div>
                    <div className="pt-3 sm:pt-4">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={includeCnesstInDeductions}
                          onChange={(e) => onChange({ includeCnesstInDeductions: e.target.checked })}
                          className="mt-0.5 w-3.5 h-3.5 text-amber-600 rounded border-gray-300 focus:ring-amber-500"
                        />
                        <span className="text-[10px] text-slate-700 leading-tight font-medium">
                          {isFr
                            ? 'Déduire la cotisation CNESST directement de la paie nette'
                            : 'Deduct CNESST dues directly from employee net pay'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* GST (5%) & QST (9.975%) Calculation on Taxable vs Non-Taxable Services / Goods */}
              <div className="pt-2 border-t border-slate-200/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-tight flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                    {isFr ? 'Calcul TPS (5%) & TVQ (9,975%) — Biens & Services' : 'GST (5%) & QST (9.975%) — Goods & Services'}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-200">
                    TPS/TVQ: {formatCurrency(previewSalesTax.totalTaxes)}
                  </span>
                </div>

                <div className="space-y-2.5 bg-white p-3 rounded border border-emerald-200/70">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-emerald-700 uppercase mb-1">
                        {isFr ? 'Biens / Services Taxables ($)' : 'Taxable Goods / Services ($)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={taxableSupplyAmount || ''}
                        onChange={(e) => onChange({ taxableSupplyAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-emerald-50/30 border border-emerald-200 rounded text-xs font-mono font-bold text-emerald-950 focus:ring-1 focus:ring-emerald-500 outline-none"
                        placeholder="0,00 $"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-600 uppercase mb-1">
                        {isFr ? 'Biens / Services Non Taxables / Exonérés ($)' : 'Non-Taxable / Exempt Goods & Services ($)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={nonTaxableSupplyAmount || ''}
                        onChange={(e) => onChange({ nonTaxableSupplyAmount: parseFloat(e.target.value) || 0 })}
                        className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-slate-700 focus:ring-1 focus:ring-slate-500 outline-none"
                        placeholder="0,00 $"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                        {isFr ? 'Statut Fiscal de la Fourniture' : 'Supply Taxability Status'}
                      </label>
                      <select
                        value={supplyTaxability}
                        onChange={(e) => onChange({ supplyTaxability: e.target.value as TaxabilityStatus })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-800 outline-none cursor-pointer"
                      >
                        <option value="taxable">{isFr ? 'Taxable — TPS (5%) + TVQ (9,975%)' : 'Taxable — GST (5%) + QST (9.975%)'}</option>
                        <option value="exempt">{isFr ? 'Exonéré / Non taxable (0%)' : 'Exempt / Non-taxable (0%)'}</option>
                        <option value="zero_rated">{isFr ? 'Détaxé — Taux 0% (CTI/RTI admissibles)' : 'Zero-rated — 0% Rate (ITC/ITR eligible)'}</option>
                        <option value="gst_only">{isFr ? 'TPS seulement (5% — Hors Québec)' : 'GST Only (5% — Outside QC)'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                        {isFr ? 'Mode de Calcul des Taxes' : 'Tax Calculation Mode'}
                      </label>
                      <select
                        value={supplyTaxMode}
                        onChange={(e) => onChange({ supplyTaxMode: e.target.value as TaxCalculationMode })}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-800 outline-none cursor-pointer"
                      >
                        <option value="exclusive">{isFr ? 'Montant avant taxes (Ajouter TPS/TVQ)' : 'Before taxes (Add GST/QST)'}</option>
                        <option value="inclusive">{isFr ? 'Taxes incluses (Extraire TPS/TVQ)' : 'Taxes included (Extract GST/QST)'}</option>
                      </select>
                    </div>
                  </div>

                  {(taxableSupplyAmount > 0 || nonTaxableSupplyAmount > 0) && (
                    <div className="pt-2 border-t border-emerald-100 grid grid-cols-4 gap-1.5 text-[10px]">
                      <div className="bg-emerald-50/70 p-1.5 rounded text-center">
                        <span className="text-slate-500 block">{isFr ? 'Taxable HT' : 'Taxable Base'}</span>
                        <span className="font-mono font-bold text-slate-900">{formatCurrency(previewSalesTax.baseAmount)}</span>
                      </div>
                      <div className="bg-slate-100 p-1.5 rounded text-center">
                        <span className="text-slate-500 block">{isFr ? 'Non-Taxable' : 'Non-Taxable'}</span>
                        <span className="font-mono font-bold text-slate-700">{formatCurrency(nonTaxableSupplyAmount)}</span>
                      </div>
                      <div className="bg-blue-50 p-1.5 rounded text-center">
                        <span className="text-blue-700 block">TPS (5%)</span>
                        <span className="font-mono font-bold text-blue-900">{formatCurrency(previewSalesTax.gst)}</span>
                      </div>
                      <div className="bg-indigo-50 p-1.5 rounded text-center">
                        <span className="text-indigo-700 block">TVQ (9,975%)</span>
                        <span className="font-mono font-bold text-indigo-900">{formatCurrency(previewSalesTax.qst)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Federal TD1 & T1213 Profile */}
              <div className="pt-2 border-t border-slate-200/60 space-y-2">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight block">
                  {t('federal_td1')}
                </span>

                <div className="flex items-start gap-2 bg-white p-2.5 rounded border border-slate-200">
                  <input
                    type="checkbox"
                    id="hasMultipleEmployers"
                    checked={hasMultipleEmployers}
                    onChange={(e) => onChange({ hasMultipleEmployers: e.target.checked })}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="hasMultipleEmployers" className="text-xs text-slate-700 cursor-pointer">
                    <span className="font-bold text-slate-900 block">{t('multiple_employers')}</span>
                    <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                      {t('multiple_employers_desc')}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                      {t('federal_td1_claim')}
                    </label>
                    <input
                      type="number"
                      value={federalTd1ClaimAmount || ''}
                      onChange={(e) => onChange({ federalTd1ClaimAmount: parseFloat(e.target.value) || undefined })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-800"
                      placeholder={language === 'fr' ? "16 452 $ (Défaut)" : "$16,452 (Default)"}
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                      {t('t1213_reduction')}
                    </label>
                    <input
                      type="number"
                      value={t1213FederalReduction || ''}
                      onChange={(e) => onChange({ t1213FederalReduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-800"
                      placeholder="0,00 $"
                    />
                  </div>
                </div>
              </div>

              {/* Quebec TP-1015.3-V & TP-1016-V Profile */}
              <div className="pt-2 border-t border-slate-200/60 space-y-2">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight block">
                  {t('quebec_tp1015')}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                      {t('tp1015_line10')}
                    </label>
                    <input
                      type="text"
                      value={quebecTp1015Line10Code || 'A'}
                      onChange={(e) => onChange({ quebecTp1015Line10Code: e.target.value.toUpperCase() })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-800 font-bold"
                      placeholder="A"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">
                      {t('tp1016_reduction')}
                    </label>
                    <input
                      type="number"
                      value={tp1016QuebecReduction || ''}
                      onChange={(e) => onChange({ tp1016QuebecReduction: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none text-slate-800"
                      placeholder="0,00 $"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">{t('frequency')}</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
            <select
              value={frequency}
              onChange={(e) => onChange({ frequency: e.target.value as PayFrequency })}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all text-slate-900 font-medium appearance-none cursor-pointer"
            >
              <option value="weekly">{t('weekly')}</option>
              <option value="bi-weekly">{t('bi_weekly')}</option>
              <option value="semi-monthly">{t('semi_monthly')}</option>
              <option value="monthly">{t('monthly')}</option>
              <option value="annually">{t('annually')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <p className="text-[10px] text-gray-400 leading-relaxed italic border-t border-gray-100 pt-3">
          {t('fiscal_note_2024')}
        </p>
      </div>

      <GarnishmentCalculatorModal
        isOpen={isCalcModalOpen}
        onClose={() => {
          setIsCalcModalOpen(false);
          setTargetGarnishmentId(null);
        }}
        frequency={frequency}
        initialAmount={currentInitialAmount}
        initialTotalDebt={activeTargetGarnishment?.totalDebt}
        initialMonthlyLimit={activeTargetGarnishment?.monthlyLimit}
        initialCategory={activeTargetGarnishment?.category}
        onApply={handleApplyCalculatedAmount}
      />
    </div>
  );
};
