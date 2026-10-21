/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { TaxableBenefitRecord, TaxableBenefitCategory, Employee } from '../types';
import { 
  REVENU_QUEBEC_2025_RULES, 
  TaxableBenefitCalculators 
} from '../lib/taxableBenefits2025';
import { 
  Car, 
  Utensils, 
  Home, 
  HeartHandshake, 
  Coins, 
  Gift, 
  Plus, 
  Trash2, 
  Calculator, 
  FileText, 
  Info, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  Compass, 
  ShieldAlert,
  HelpCircle,
  Building,
  UserCheck
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Storage } from '../lib/storage';
import { useLanguage } from './LanguageContext';

interface TaxableBenefitsManagerProps {
  employees?: Employee[];
}

export const TaxableBenefitsManager: React.FC<TaxableBenefitsManagerProps> = ({ employees = [] }) => {
  const { isFr } = useLanguage();
  const [benefits, setBenefits] = useState<TaxableBenefitRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState<TaxableBenefitCategory>('motor_vehicle_allowance');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [taxableAmount, setTaxableAmount] = useState<number>(0);
  const [nonTaxableAmount, setNonTaxableAmount] = useState<number>(0);

  // Calculator State Modal / Interactive Section
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcKm, setCalcKm] = useState<number>(6500);
  const [calcAllowancePaid, setCalcAllowancePaid] = useState<number>(5200);
  const [calcAutoCost, setCalcAutoCost] = useState<number>(40000);
  const [calcPersonalKm, setCalcPersonalKm] = useState<number>(15000);
  const [calcMealCount, setCalcMealCount] = useState<number>(20);
  const [calcMealPrice, setCalcMealPrice] = useState<number>(18);
  const [calcLoanPrincipal, setCalcLoanPrincipal] = useState<number>(50000);
  const [calcLoanInterestPaid, setCalcLoanInterestPaid] = useState<number>(500);
  const [calcGiftAmount, setCalcGiftAmount] = useState<number>(750);
  const [calcGiftIsCash, setCalcGiftIsCash] = useState<boolean>(false);
  const [calcRamqDays, setCalcRamqDays] = useState<number>(365);
  const [calcRamqIsFamily, setCalcRamqIsFamily] = useState<boolean>(false);

  useEffect(() => {
    loadBenefits();
  }, []);

  const loadBenefits = async () => {
    setLoading(true);
    const data = await Storage.getTaxableBenefits();
    setBenefits(data);
    setLoading(false);
  };

  // Rule metadata for selected category
  const activeRule = useMemo(() => {
    return REVENU_QUEBEC_2025_RULES[selectedCategory] || REVENU_QUEBEC_2025_RULES.other_benefit;
  }, [selectedCategory]);

  // Sync default amounts when category changes
  const handleCategoryChange = (cat: TaxableBenefitCategory) => {
    setSelectedCategory(cat);
    const rule = REVENU_QUEBEC_2025_RULES[cat];
    if (rule) {
      if (!description) {
        setDescription(isFr ? rule.nameFr : rule.nameEn);
      }
    }
  };

  // Run calculator presets
  const applyCalculatorResult = () => {
    if (selectedCategory === 'motor_vehicle_allowance') {
      const res = TaxableBenefitCalculators.calculateMotorVehicleAllowance(calcKm, calcAllowancePaid);
      setTotalAmount(calcAllowancePaid);
      setTaxableAmount(res.taxableAmount);
      setNonTaxableAmount(res.nonTaxableAmount);
      setDescription(`${isFr ? 'Indemnité kilométrique' : 'Motor Vehicle Allowance'} (${calcKm} km)`);
    } else if (selectedCategory === 'automobile_operating') {
      const res = TaxableBenefitCalculators.calculateOperatingCostBenefit(calcPersonalKm);
      setTotalAmount(res.grossBenefit);
      setTaxableAmount(res.taxableBenefit);
      setNonTaxableAmount(0);
      setDescription(`${isFr ? 'Frais de fonctionnement auto' : 'Automobile Operating Benefit'} (${calcPersonalKm} km @ 0,34 $/km)`);
    } else if (selectedCategory === 'standby_charge') {
      const res = TaxableBenefitCalculators.calculateStandbyCharge(calcAutoCost, 'owned_simplified');
      setTotalAmount(calcAutoCost);
      setTaxableAmount(res.netCharge);
      setNonTaxableAmount(0);
      setDescription(`${isFr ? 'Droit d\'usage auto possédée' : 'Standby Charge Owned Auto'} (24% de ${formatCurrency(calcAutoCost)})`);
    } else if (selectedCategory === 'restaurant_hotel_meals') {
      const res = TaxableBenefitCalculators.calculateRestaurantMealBenefit(calcMealCount, calcMealPrice);
      setTotalAmount(calcMealCount * calcMealPrice);
      setTaxableAmount(res.totalBenefit);
      setNonTaxableAmount(calcMealCount * calcMealPrice - res.totalBenefit);
      setDescription(`${isFr ? 'Repas employés resto/hôtel' : 'Restaurant/Hotel Meals'} (${calcMealCount} repas @ max 11,57 $)`);
    } else if (selectedCategory === 'low_interest_loan') {
      const res = TaxableBenefitCalculators.calculateLowInterestLoanBenefit(calcLoanPrincipal, { q1: 90, q2: 91, q3: 92, q4: 92 }, calcLoanInterestPaid);
      setTotalAmount(calcLoanPrincipal);
      setTaxableAmount(res.taxableBenefit);
      setNonTaxableAmount(0);
      setDescription(`${isFr ? 'Prêt à taux réduit 2025' : 'Low-Interest Loan 2025'} (${formatCurrency(calcLoanPrincipal)} - Taux 4%/3%)`);
    } else if (selectedCategory === 'gifts_rewards') {
      const res = TaxableBenefitCalculators.calculateGiftsRewards(calcGiftAmount, calcGiftIsCash, 0);
      setTotalAmount(calcGiftAmount);
      setTaxableAmount(res.taxableAmount);
      setNonTaxableAmount(res.nonTaxableAmount);
      setDescription(`${isFr ? 'Cadeaux et récompenses' : 'Gifts & Awards'} (${calcGiftIsCash ? 'Espèces' : 'Nature'})`);
    } else if (selectedCategory === 'ramq_equivalency') {
      const res = TaxableBenefitCalculators.calculateRamqReduction(calcRamqDays, calcRamqIsFamily);
      setTotalAmount(res.reductionAmount);
      setTaxableAmount(res.totalReduction);
      setNonTaxableAmount(0);
      setDescription(`${isFr ? 'Réduction RAMQ non-assujetti' : 'RAMQ Equivalency Reduction'} (${calcRamqDays} jours @ ${res.perDay} $/j)`);
    }
    setShowCalculator(false);
  };

  const handleAddBenefit = async () => {
    if (taxableAmount <= 0 && totalAmount <= 0) return;

    const emp = employees.find(e => e.id === selectedEmployeeId);
    const rule = activeRule;

    const newBenefit: Omit<TaxableBenefitRecord, 'id'> = {
      employeeId: selectedEmployeeId || undefined,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : (isFr ? 'Général / Tous' : 'General / All'),
      date: date || new Date().toISOString().split('T')[0],
      category: selectedCategory,
      description: description || (isFr ? rule.nameFr : rule.nameEn),
      totalAmount,
      taxableAmount: taxableAmount > 0 ? taxableAmount : totalAmount,
      nonTaxableAmount: nonTaxableAmount || Math.max(0, totalAmount - taxableAmount),
      rl1Box: rule.rl1Boxes,
      t4Box: rule.t4Boxes,
      subjectToQpp: rule.subjectToQpp,
      subjectToQpip: rule.subjectToQpip,
      subjectToEi: rule.subjectToEi,
      subjectToTax: rule.subjectToTax,
      calculationDetails: {
        formula: rule.rates2025,
        notes: isFr ? rule.descriptionFr : rule.descriptionEn
      }
    };

    await Storage.saveTaxableBenefit(newBenefit);
    await loadBenefits();

    // Reset Form
    setDescription('');
    setTotalAmount(0);
    setTaxableAmount(0);
    setNonTaxableAmount(0);
  };

  const handleDeleteBenefit = async (id: string) => {
    await Storage.deleteTaxableBenefit(id);
    setBenefits(benefits.filter(b => b.id !== id));
  };

  // Aggregated Stats
  const totals = useMemo(() => {
    return benefits.reduce((acc, b) => ({
      total: acc.total + (b.totalAmount || 0),
      taxable: acc.taxable + (b.taxableAmount || 0),
      nonTaxable: acc.nonTaxable + (b.nonTaxableAmount || 0),
      qppPensionable: acc.qppPensionable + (b.subjectToQpp ? b.taxableAmount : 0),
      rl1BoxA: acc.rl1BoxA + (b.rl1Box.includes('A') ? b.taxableAmount : 0),
      rl1BoxW: acc.rl1BoxW + (b.rl1Box.includes('W') ? b.taxableAmount : 0),
      rl1BoxJ: acc.rl1BoxJ + (b.rl1Box.includes('J') ? b.taxableAmount : 0),
      rl1BoxL: acc.rl1BoxL + (b.rl1Box.includes('L') ? b.taxableAmount : 0),
      rl1BoxV: acc.rl1BoxV + (b.rl1Box.includes('V') ? b.taxableAmount : 0),
    }), {
      total: 0,
      taxable: 0,
      nonTaxable: 0,
      qppPensionable: 0,
      rl1BoxA: 0,
      rl1BoxW: 0,
      rl1BoxJ: 0,
      rl1BoxL: 0,
      rl1BoxV: 0
    });
  }, [benefits]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-indigo-900/40 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-widest">
                Revenu Québec IN-253-V (2025)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-400/30">
                CRA T4130 Rev. 25
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {isFr ? 'Avantages Imposables & Allocations' : 'Taxable Benefits & Allowances'}
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl mt-1">
              {isFr 
                ? 'Conformité fiscale intégrale selon le guide IN-253-V (2025-11). Calculs automatisés des droits d\'usage, véhicules, repas plafonnés, prêts à taux prescrits et cases RL-1 / T4.' 
                : 'Full tax compliance based on Revenu Québec 2025 rules. Automated standby charges, vehicle allowances, meal caps, prescribed loan interest, and RL-1/T4 slip box allocations.'}
            </p>
          </div>

          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm self-start md:self-auto cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>{showCalculator ? (isFr ? 'Masquer le simulateur' : 'Hide Simulator') : (isFr ? 'Simulateur de calculs 2025' : '2025 Benefit Calculators')}</span>
          </button>
        </div>
      </div>

      {/* Interactive 2025 Calculator Drawer / Card */}
      {showCalculator && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-indigo-200 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-700" />
              <h3 className="text-sm font-extrabold text-indigo-950 uppercase tracking-tight">
                {isFr ? 'Simulateurs de Barèmes Revenu Québec 2025' : 'Revenu Québec 2025 Formula Simulators'}
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
              {activeRule.rates2025}
            </span>
          </div>

          {/* Conditional Controls by Category */}
          {selectedCategory === 'motor_vehicle_allowance' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                  {isFr ? 'Kilomètres totaux parcourus' : 'Total Kilometres Driven'}
                </label>
                <input
                  type="number"
                  value={calcKm}
                  onChange={e => setCalcKm(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none"
                />
                <p className="text-[10px] text-indigo-600 mt-1">Taux: 0,72 $/km (1er 5 000 km) puis 0,66 $/km</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                  {isFr ? 'Indemnité totale versée ($)' : 'Total Allowance Paid ($)'}
                </label>
                <input
                  type="number"
                  value={calcAllowancePaid}
                  onChange={e => setCalcAllowancePaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none"
                />
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Résultat du calcul</span>
                {(() => {
                  const res = TaxableBenefitCalculators.calculateMotorVehicleAllowance(calcKm, calcAllowancePaid);
                  return (
                    <div>
                      <p className="text-xs text-slate-700 font-medium">{res.explanationFr}</p>
                      <p className="text-sm font-extrabold text-indigo-900 mt-1">
                        Imposable : <span className={res.taxableAmount > 0 ? 'text-red-600' : 'text-emerald-600'}>{formatCurrency(res.taxableAmount)}</span>
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {selectedCategory === 'automobile_operating' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                  {isFr ? 'Kilomètres personnels parcourus' : 'Personal Kilometres Driven'}
                </label>
                <input
                  type="number"
                  value={calcPersonalKm}
                  onChange={e => setCalcPersonalKm(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none"
                />
                <p className="text-[10px] text-indigo-600 mt-1">Taux prescrit 2025 : 0,34 $/km</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 md:col-span-2 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Avantage relatif aux frais de fonctionnement</span>
                {(() => {
                  const res = TaxableBenefitCalculators.calculateOperatingCostBenefit(calcPersonalKm);
                  return (
                    <div>
                      <p className="text-xs text-slate-700">{res.explanationFr}</p>
                      <p className="text-base font-extrabold text-indigo-900 mt-1">
                        Montant imposable (Case A, W) : {formatCurrency(res.taxableBenefit)}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {selectedCategory === 'standby_charge' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                  {isFr ? 'Coût d\'achat du véhicule (taxes incl.)' : 'Automobile Cost (incl. taxes)'}
                </label>
                <input
                  type="number"
                  value={calcAutoCost}
                  onChange={e => setCalcAutoCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none"
                />
                <p className="text-[10px] text-indigo-600 mt-1">Méthode simplifiée : 24% du coût</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 md:col-span-2 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Droit d'usage simplifié (Section 3.3.1)</span>
                {(() => {
                  const res = TaxableBenefitCalculators.calculateStandbyCharge(calcAutoCost, 'owned_simplified');
                  return (
                    <div>
                      <p className="text-xs text-slate-700">{res.explanationFr}</p>
                      <p className="text-base font-extrabold text-indigo-900 mt-1">
                        Droit d'usage imposable : {formatCurrency(res.netCharge)} (Case A, W)
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {selectedCategory === 'restaurant_hotel_meals' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                  {isFr ? 'Nombre de repas' : 'Meal Count'}
                </label>
                <input
                  type="number"
                  value={calcMealCount}
                  onChange={e => setCalcMealCount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                  {isFr ? 'Prix menu facturé aux clients ($)' : 'Menu Price ($)'}
                </label>
                <input
                  type="number"
                  value={calcMealPrice}
                  onChange={e => setCalcMealPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none"
                />
                <p className="text-[10px] text-indigo-600 mt-1">Plafond 2025 : 11,57 $/repas (Section 5.5)</p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Avantage net calculé</span>
                {(() => {
                  const res = TaxableBenefitCalculators.calculateRestaurantMealBenefit(calcMealCount, calcMealPrice);
                  return (
                    <div>
                      <p className="text-xs text-slate-700">{res.explanationFr}</p>
                      <p className="text-sm font-extrabold text-indigo-900 mt-1">
                        Total imposable : {formatCurrency(res.totalBenefit)} (Case A, V)
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {selectedCategory === 'low_interest_loan' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                  {isFr ? 'Montant du prêt ($)' : 'Loan Principal ($)'}
                </label>
                <input
                  type="number"
                  value={calcLoanPrincipal}
                  onChange={e => setCalcLoanPrincipal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none"
                />
                <p className="text-[10px] text-indigo-600 mt-1">Taux 2025: T1 4%, T2 4%, T3 3%, T4 3%</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                  {isFr ? 'Intérêt payé par l\'employé ($)' : 'Interest Paid by Employee ($)'}
                </label>
                <input
                  type="number"
                  value={calcLoanInterestPaid}
                  onChange={e => setCalcLoanInterestPaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none"
                />
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Avantage d'intérêt prescrit</span>
                {(() => {
                  const res = TaxableBenefitCalculators.calculateLowInterestLoanBenefit(calcLoanPrincipal, { q1: 90, q2: 91, q3: 92, q4: 92 }, calcLoanInterestPaid);
                  return (
                    <div>
                      <p className="text-xs text-slate-700">{res.explanationFr}</p>
                      <p className="text-sm font-extrabold text-indigo-900 mt-1">
                        Avantage imposable : {formatCurrency(res.taxableBenefit)} (Case A, L / Code 36)
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {selectedCategory === 'gifts_rewards' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                  {isFr ? 'Valeur du cadeau / récompense ($)' : 'Gift Value ($)'}
                </label>
                <input
                  type="number"
                  value={calcGiftAmount}
                  onChange={e => setCalcGiftAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm outline-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  id="giftIsCash"
                  checked={calcGiftIsCash}
                  onChange={e => setCalcGiftIsCash(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="giftIsCash" className="text-xs font-bold text-indigo-950 cursor-pointer">
                  {isFr ? 'Cadeau en espèces ou carte quasi-espèces (100% imposable)' : 'Cash or convertible card'}
                </label>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-indigo-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Exemption 500 $ Revenu Québec</span>
                {(() => {
                  const res = TaxableBenefitCalculators.calculateGiftsRewards(calcGiftAmount, calcGiftIsCash, 0);
                  return (
                    <div>
                      <p className="text-xs text-slate-700">{res.explanationFr}</p>
                      <p className="text-sm font-extrabold text-indigo-900 mt-1">
                        Imposable : {formatCurrency(res.taxableAmount)}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Action to transfer simulation to main form */}
          <div className="flex justify-end pt-2 border-t border-indigo-200">
            <button
              onClick={applyCalculatorResult}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isFr ? 'Appliquer les résultats au formulaire ci-dessous' : 'Apply Results to Entry Form'}</span>
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">{isFr ? 'Total Avantages Déclarés' : 'Total Benefits Logged'}</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(totals.total)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{benefits.length} {isFr ? 'entrées actives' : 'active records'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">{isFr ? 'Part Imposable (Case A)' : 'Taxable Amount (Box A)'}</span>
            <TrendingUp className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-extrabold text-red-600">{formatCurrency(totals.taxable)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{isFr ? 'Soumis à l\'impôt sur le revenu' : 'Subject to income tax'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">{isFr ? 'Gains Ouvrant Droit au RRQ' : 'RRQ Pensionable Additions'}</span>
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(totals.qppPensionable)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{isFr ? 'Cotisable au régime des rentes (Case G)' : 'Pensionable under QPP (Box G)'}</p>
        </div>

        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">{isFr ? 'Exonérations & Déductions' : 'Exemptions & Non-Taxable'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-400">{formatCurrency(totals.nonTaxable)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{isFr ? 'Allocations raisonnables ou sous plafonds' : 'Under thresholds or TD4 certified'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                {isFr ? 'Nouvel Avantage Imposable' : 'New Taxable Benefit'}
              </h3>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                {isFr ? 'Catégorie Réglementaire (IN-253-V)' : 'Regulatory Category (IN-253-V)'}
              </label>
              <select
                value={selectedCategory}
                onChange={e => handleCategoryChange(e.target.value as TaxableBenefitCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                {Object.values(REVENU_QUEBEC_2025_RULES).map(rule => (
                  <option key={rule.id} value={rule.id}>
                    {isFr ? rule.nameFr : rule.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                {isFr ? 'Employé concerné' : 'Employee'}
              </label>
              <select
                value={selectedEmployeeId}
                onChange={e => setSelectedEmployeeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="">{isFr ? '-- Tous les employés / Général --' : '-- All Employees / General --'}</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.sin})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                {isFr ? 'Description' : 'Description'}
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={isFr ? 'ex: Allocation véhicule de fonction' : 'e.g. Vehicle standby allowance'}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  {isFr ? 'Date' : 'Date'}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  {isFr ? 'Valeur Totale ($)' : 'Total Value ($)'}
                </label>
                <input
                  type="number"
                  value={totalAmount || ''}
                  onChange={e => setTotalAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0,00 $"
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-red-600 uppercase tracking-wider mb-1">
                  {isFr ? 'Part Imposable ($)' : 'Taxable Portion ($)'}
                </label>
                <input
                  type="number"
                  value={taxableAmount || ''}
                  onChange={e => setTaxableAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0,00 $"
                  className="w-full px-3 py-2 bg-red-50/40 border border-red-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500 outline-none font-bold text-red-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  {isFr ? 'Part Exonérée ($)' : 'Exempt Portion ($)'}
                </label>
                <input
                  type="number"
                  value={nonTaxableAmount || ''}
                  onChange={e => setNonTaxableAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0,00 $"
                  className="w-full px-3 py-2 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-emerald-700"
                />
              </div>
            </div>

            {/* Regulatory Box Mapping Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700">Relevé 1 (RL-1) :</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Cases {activeRule.rl1Boxes}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700">Feuillet T4 fédéral :</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {activeRule.t4Boxes}
                </span>
              </div>
              <div className="pt-1 text-[10px] text-slate-500 border-t border-gray-200 flex flex-wrap gap-1.5">
                <span className={`px-1.5 py-0.5 rounded ${activeRule.subjectToTax ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>Impôt: {activeRule.subjectToTax ? 'Oui' : 'Non'}</span>
                <span className={`px-1.5 py-0.5 rounded ${activeRule.subjectToQpp ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>RRQ: {activeRule.subjectToQpp ? 'Oui' : 'Non'}</span>
                <span className={`px-1.5 py-0.5 rounded ${activeRule.subjectToQpip ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-500'}`}>RQAP: {activeRule.subjectToQpip ? 'Oui' : 'Non'}</span>
                <span className={`px-1.5 py-0.5 rounded ${activeRule.subjectToEi ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-500'}`}>AE: {activeRule.subjectToEi ? 'Oui' : 'Non'}</span>
              </div>
            </div>

            <button
              onClick={handleAddBenefit}
              disabled={taxableAmount <= 0 && totalAmount <= 0}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{isFr ? 'Enregistrer l\'avantage' : 'Save Taxable Benefit'}</span>
            </button>
          </div>
        </div>

        {/* Benefits Register & Audit Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs flex flex-col min-h-[380px]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/60">
              <div>
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">
                  {isFr ? 'Registre des Avantages Imposables' : 'Taxable Benefits Register'}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {isFr ? 'Ventilation conforme aux cases RL-1 et T4 pour la paie 2025' : 'RL-1 and T4 compliant payroll register'}
                </p>
              </div>
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200">
                Revenu Québec 2025
              </span>
            </div>

            <div className="flex-grow overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-gray-200">
                  <tr className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5">{isFr ? 'Date' : 'Date'}</th>
                    <th className="px-4 py-2.5">{isFr ? 'Bénéficiaire' : 'Employee'}</th>
                    <th className="px-4 py-2.5">{isFr ? 'Catégorie & Détails' : 'Category & Details'}</th>
                    <th className="px-4 py-2.5 text-right">{isFr ? 'Valeur' : 'Total'}</th>
                    <th className="px-4 py-2.5 text-right">{isFr ? 'Imposable' : 'Taxable'}</th>
                    <th className="px-4 py-2.5 text-center">{isFr ? 'RL-1 / T4' : 'RL-1 / T4'}</th>
                    <th className="px-4 py-2.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {benefits.map(b => {
                    const rule = REVENU_QUEBEC_2025_RULES[b.category];
                    return (
                      <tr key={b.id} className="group hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{b.date}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">
                          {b.employeeName || (isFr ? 'Général' : 'General')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-0.5">
                            <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">
                              {rule ? (isFr ? rule.nameFr : rule.nameEn) : b.category}
                            </span>
                            <p className="text-[11px] text-slate-600 line-clamp-1">{b.description}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-600">
                          {formatCurrency(b.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-extrabold text-red-600">
                            {formatCurrency(b.taxableAmount)}
                          </span>
                          {b.nonTaxableAmount > 0 && (
                            <span className="block text-[10px] text-emerald-600 font-medium">
                              (Exo: {formatCurrency(b.nonTaxableAmount)})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-[9px] font-bold">
                              RL-1: {b.rl1Box}
                            </span>
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-medium">
                              T4: {b.t4Box}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteBenefit(b.id)}
                            className="p-1.5 text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all rounded"
                            title={isFr ? 'Supprimer' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {benefits.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-16 text-center text-slate-400 italic">
                        {isFr 
                          ? 'Aucun avantage imposable consigné. Utilisez le formulaire ci-contre ou l\'extracteur automatique de documents.' 
                          : 'No taxable benefits recorded yet. Use the entry form or the automated document extractor.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenu Québec Appendix 1 Reference Table */}
          <div className="bg-slate-50 border border-gray-200 rounded-2xl p-4 text-xs">
            <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              {isFr ? 'Sommaire des Cases de Déclaration Revenu Québec (Annexe 1 IN-253-V)' : 'Revenu Québec Reporting Codes (Appendix 1 IN-253-V)'}
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <span className="font-bold text-indigo-700">Case A :</span> Revenu brut imposable
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <span className="font-bold text-indigo-700">Case W :</span> Véhicule à moteur / auto
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <span className="font-bold text-indigo-700">Case J :</span> Régime privé santé (RAMQ)
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <span className="font-bold text-indigo-700">Case V :</span> Nourriture &amp; logement
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <span className="font-bold text-indigo-700">Case L :</span> Autres avantages (vie, etc.)
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <span className="font-bold text-indigo-700">Case G :</span> Salaire admissible au RRQ
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <span className="font-bold text-indigo-700">Case I :</span> Salaire admissible au RQAP
              </div>
              <div className="bg-white p-2 rounded-lg border border-gray-200">
                <span className="font-bold text-indigo-700">Case O (RO/RP) :</span> Actionnaires / Associés
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
