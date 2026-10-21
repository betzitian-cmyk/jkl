import React, { useState, useId } from 'react';
import {
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Calculator,
  RotateCcw,
  Sparkles,
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export interface TP1015FormData {
  tp_line1: number;
  tp_line2: number;
  tp_line3: number;
  tp_line5: number;
  tp_line70: number;
  tp_living_alone: boolean;
  tp_line80: number;
  tp_line81: number;
  tp_family_income: number;
  tp_line6_calculated: number;
  tp_line9: number;
  tp_line10_total: number;
  tp_line11_additional: number;
  tp_line14: number;
  tp_line15: number;
  tp_line19_deductions: number;
  tp_box20_exemption: boolean;
}

export interface QuebecTP1015ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLine10?: number;
  initialAdditionalTax?: number;
  onApply: (result: {
    line10: number;
    additionalTax: number;
    deductions: number;
    box20Exemption: boolean;
    formData: TP1015FormData;
  }) => void;
}

const DEFAULT_TP1015_STATE: TP1015FormData = {
  tp_line1: 18952,
  tp_line2: 0,
  tp_line3: 0,
  tp_line5: 0,
  tp_line70: 0,
  tp_living_alone: false,
  tp_line80: 0,
  tp_line81: 0,
  tp_family_income: 0,
  tp_line6_calculated: 0,
  tp_line9: 0,
  tp_line10_total: 18952,
  tp_line11_additional: 0,
  tp_line14: 0,
  tp_line15: 0,
  tp_line19_deductions: 0,
  tp_box20_exemption: false,
};

// Regulatory Caps for 2026 Québec TP-1015.3-V
const CAPS = {
  LINE1: 18952,
  LINE2: 18952,
  LINE5: 4208,
  LINE70: 7972, // 2 * 3986
  LINE80: 3541,
  LINE81: 3541,
  FAMILY_THRESHOLD: 42955,
  REDUCTION_RATE: 0.1875,
  LINE9: 12755,
  LIVING_ALONE_AMOUNT: 2172,
};

export const QuebecTP1015Modal: React.FC<QuebecTP1015ModalProps> = ({
  isOpen,
  onClose,
  initialLine10,
  initialAdditionalTax,
  onApply,
}) => {
  const [form, setForm] = useState<TP1015FormData>(() => ({
    ...DEFAULT_TP1015_STATE,
    tp_line1: initialLine10 !== undefined && initialLine10 > 0 ? initialLine10 : 18952,
    tp_line10_total: initialLine10 !== undefined && initialLine10 > 0 ? initialLine10 : 18952,
    tp_line11_additional: initialAdditionalTax !== undefined ? initialAdditionalTax : 0,
  }));

  const [warnings, setWarnings] = useState<{ [key: string]: string }>({});

  const idLine1 = useId();
  const idLine2 = useId();
  const idLine3 = useId();
  const idLine5 = useId();
  const idLine70 = useId();
  const idLivingAlone = useId();
  const idLine80 = useId();
  const idLine81 = useId();
  const idFamilyIncome = useId();
  const idLine9 = useId();
  const idLine11 = useId();
  const idLine14 = useId();
  const idLine15 = useId();
  const idBox20 = useId();

  if (!isOpen) return null;

  const calculateLine6 = (
    line70: number,
    livingAlone: boolean,
    line80: number,
    line81: number,
    familyIncome: number
  ): number => {
    const livingAloneAmount = livingAlone ? CAPS.LIVING_ALONE_AMOUNT : 0;
    const line85Sum = line70 + livingAloneAmount + line80 + line81;
    const excessIncome = Math.max(0, familyIncome - CAPS.FAMILY_THRESHOLD);
    const reduction = excessIncome * CAPS.REDUCTION_RATE;
    return Math.max(0, line85Sum - reduction);
  };

  const calculateTotals = (nextForm: TP1015FormData) => {
    const line6 = calculateLine6(
      nextForm.tp_line70,
      nextForm.tp_living_alone,
      nextForm.tp_line80,
      nextForm.tp_line81,
      nextForm.tp_family_income
    );

    const line10 =
      nextForm.tp_line1 +
      nextForm.tp_line2 +
      nextForm.tp_line3 +
      nextForm.tp_line5 +
      line6 +
      nextForm.tp_line9;

    const line19 = nextForm.tp_line14 + nextForm.tp_line15;

    return {
      ...nextForm,
      tp_line6_calculated: Math.round(line6 * 100) / 100,
      tp_line10_total: Math.round(line10 * 100) / 100,
      tp_line19_deductions: Math.round(line19 * 100) / 100,
    };
  };

  const handleNumberChange = (
    field: keyof TP1015FormData,
    valueStr: string,
    maxLimit?: number,
    warningMsg?: string
  ) => {
    let val = parseFloat(valueStr) || 0;
    const newWarnings = { ...warnings };

    if (maxLimit !== undefined && val > maxLimit) {
      newWarnings[field] = warningMsg || `Capped at statutory maximum of $${maxLimit.toLocaleString('en-CA')}.`;
      val = maxLimit;
    } else {
      delete newWarnings[field];
    }
    setWarnings(newWarnings);

    setForm((prev) => {
      const next = { ...prev, [field]: val };
      return calculateTotals(next);
    });
  };

  const handleCheckboxChange = (field: 'tp_living_alone' | 'tp_box20_exemption', checked: boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: checked };
      return calculateTotals(next);
    });
  };

  const handleResetToStandard = () => {
    setForm(DEFAULT_TP1015_STATE);
    setWarnings({});
  };

  const handleSeniorPreset = () => {
    const next: TP1015FormData = {
      ...DEFAULT_TP1015_STATE,
      tp_line70: 3986,
      tp_living_alone: true,
      tp_family_income: 32000,
    };
    setForm(calculateTotals(next));
    setWarnings({});
  };

  const handleSubmitAndApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      line10: form.tp_line10_total,
      additionalTax: form.tp_line11_additional,
      deductions: form.tp_line19_deductions,
      box20Exemption: form.tp_box20_exemption,
      formData: form,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tp1015-title"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-emerald-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-700/80 flex items-center justify-center text-emerald-100 border border-emerald-500/40">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded border border-emerald-400/30">
                  Revenu Québec • TP-1015.3-V (2026)
                </span>
                <span className="text-xs text-emerald-200 hidden sm:inline">• Source Deductions Return</span>
              </div>
              <h2 id="tp1015-title" className="text-base sm:text-lg font-bold text-white leading-tight">
                Déclaration pour la retenue à la source / Québec Tax Credits Webform
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-emerald-200 hover:text-white hover:bg-emerald-700/50 p-2 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUBHEADER CONTROLS */}
        <div className="bg-emerald-50/80 border-b border-emerald-100 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-emerald-950 font-medium">
            <Info className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Fill out the required lines to compute <strong>Line 10 (Total Personal Tax Credits)</strong> and pass it to your onboarding form.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSeniorPreset}
              className="px-2.5 py-1 rounded bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Senior 65+ Living Alone Preset
            </button>
            <button
              type="button"
              onClick={handleResetToStandard}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              Reset to Standard ($18,952)
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/60">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT / MAIN COLUMN: THE QUÉBEC WEBFORM */}
            <form id="tp-carbon-form" onSubmit={handleSubmitAndApply} className="lg:col-span-7 space-y-5">
              
              {/* SECTION 2: PERSONAL TAX CREDITS */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black inline-flex items-center justify-center">
                      2
                    </span>
                    Section 2: Personal Tax Credits (Lignes 1 à 10)
                  </h3>
                  <span className="text-[11px] text-slate-500">Formule TP-1015.3-V</span>
                </div>

                {/* LINE 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <label htmlFor={idLine1} className="text-xs font-bold text-slate-800">
                      Line 1: Basic personal amount / Montant personnel de base
                    </label>
                    <span className="text-[11px] text-emerald-700 font-semibold">Max: $18,952</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Standard amount is <strong>$18,952</strong>. Enter 0 if already claimed with another employer.
                  </p>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                    <input
                      id={idLine1}
                      type="number"
                      step="0.01"
                      max={CAPS.LINE1}
                      value={form.tp_line1}
                      onChange={(e) =>
                        handleNumberChange(
                          'tp_line1',
                          e.target.value,
                          CAPS.LINE1,
                          'Capped at maximum allowable $18,952.'
                        )
                      }
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      required
                    />
                  </div>
                  {warnings.tp_line1 && (
                    <p className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {warnings.tp_line1}
                    </p>
                  )}
                </div>

                {/* LINE 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <label htmlFor={idLine2} className="text-xs font-bold text-slate-800">
                      Line 2: Amount transferred from one spouse to another
                    </label>
                    <span className="text-[11px] text-slate-400">Max $18,952</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Max $18,952 minus spouse's estimated taxable income.
                  </p>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                    <input
                      id={idLine2}
                      type="number"
                      step="0.01"
                      max={CAPS.LINE2}
                      value={form.tp_line2}
                      onChange={(e) =>
                        handleNumberChange(
                          'tp_line2',
                          e.target.value,
                          CAPS.LINE2,
                          'Capped at maximum allowable $18,952.'
                        )
                      }
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  {warnings.tp_line2 && (
                    <p className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {warnings.tp_line2}
                    </p>
                  )}
                </div>

                {/* LINE 3 */}
                <div className="space-y-1">
                  <label htmlFor={idLine3} className="text-xs font-bold text-slate-800">
                    Line 3: Amount for dependants (Work Chart 1 / Grille 1)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                    <input
                      id={idLine3}
                      type="number"
                      step="0.01"
                      value={form.tp_line3}
                      onChange={(e) => handleNumberChange('tp_line3', e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* LINE 5 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <label htmlFor={idLine5} className="text-xs font-bold text-slate-800">
                      Line 5: Severe and prolonged impairment amount / Déficience grave
                    </label>
                    <span className="text-[11px] text-slate-400">Max $4,208</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Max $4,208 if certified by a recognized health professional.
                  </p>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                    <input
                      id={idLine5}
                      type="number"
                      step="0.01"
                      max={CAPS.LINE5}
                      value={form.tp_line5}
                      onChange={(e) =>
                        handleNumberChange(
                          'tp_line5',
                          e.target.value,
                          CAPS.LINE5,
                          'Capped at maximum allowable $4,208.'
                        )
                      }
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  {warnings.tp_line5 && (
                    <p className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {warnings.tp_line5}
                    </p>
                  )}
                </div>

                {/* WORK CHART 2 (LINE 6) */}
                <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                      <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                      Work Chart 2 Calculation (Line 6 / Grille 2)
                    </span>
                    <span className="text-[10px] font-medium text-emerald-700">Clawback applies over $42,955</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Line 70 */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <label htmlFor={idLine70} className="text-[11px] font-bold text-slate-700">
                          Line 70: Age Amount (65+)
                        </label>
                        <span className="text-[10px] text-slate-400">Max $7,972</span>
                      </div>
                      <p className="text-[10px] text-slate-500">$3,986 per eligible person (Max 2 = $7,972)</p>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">$</span>
                        <input
                          id={idLine70}
                          type="number"
                          step="0.01"
                          max={CAPS.LINE70}
                          value={form.tp_line70}
                          onChange={(e) =>
                            handleNumberChange(
                              'tp_line70',
                              e.target.value,
                              CAPS.LINE70,
                              'Capped at maximum $7,972 (2 x $3,986).'
                            )
                          }
                          className="w-full pl-6 pr-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      {warnings.tp_line70 && (
                        <p className="text-[10px] text-amber-700">{warnings.tp_line70}</p>
                      )}
                    </div>

                    {/* Line 75 Checkbox */}
                    <div className="space-y-1 flex flex-col justify-end">
                      <label
                        htmlFor={idLivingAlone}
                        className="flex items-start gap-2 text-xs font-semibold text-slate-800 cursor-pointer p-2 bg-white rounded border border-slate-200 hover:border-emerald-300 transition-colors"
                      >
                        <input
                          id={idLivingAlone}
                          type="checkbox"
                          checked={form.tp_living_alone}
                          onChange={(e) => handleCheckboxChange('tp_living_alone', e.target.checked)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 mt-0.5"
                        />
                        <span>
                          Line 75: Person living alone <br />
                          <strong className="text-emerald-700 font-bold">+$2,172.00</strong>
                        </span>
                      </label>
                    </div>

                    {/* Line 80 */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <label htmlFor={idLine80} className="text-[11px] font-bold text-slate-700">
                          Line 80: Retirement Income
                        </label>
                        <span className="text-[10px] text-slate-400">Max $3,541</span>
                      </div>
                      <p className="text-[10px] text-slate-500">1.25 x eligible income (Max $3,541)</p>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">$</span>
                        <input
                          id={idLine80}
                          type="number"
                          step="0.01"
                          max={CAPS.LINE80}
                          value={form.tp_line80}
                          onChange={(e) =>
                            handleNumberChange(
                              'tp_line80',
                              e.target.value,
                              CAPS.LINE80,
                              'Capped at maximum allowable $3,541.'
                            )
                          }
                          className="w-full pl-6 pr-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      {warnings.tp_line80 && (
                        <p className="text-[10px] text-amber-700">{warnings.tp_line80}</p>
                      )}
                    </div>

                    {/* Line 81 */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <label htmlFor={idLine81} className="text-[11px] font-bold text-slate-700">
                          Line 81: Spouse Retirement
                        </label>
                        <span className="text-[10px] text-slate-400">Max $3,541</span>
                      </div>
                      <p className="text-[10px] text-slate-500">1.25 x spouse income (Max $3,541)</p>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">$</span>
                        <input
                          id={idLine81}
                          type="number"
                          step="0.01"
                          max={CAPS.LINE81}
                          value={form.tp_line81}
                          onChange={(e) =>
                            handleNumberChange(
                              'tp_line81',
                              e.target.value,
                              CAPS.LINE81,
                              'Capped at maximum allowable $3,541.'
                            )
                          }
                          className="w-full pl-6 pr-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 font-medium focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      {warnings.tp_line81 && (
                        <p className="text-[10px] text-amber-700">{warnings.tp_line81}</p>
                      )}
                    </div>
                  </div>

                  {/* Family Income Clawback */}
                  <div className="pt-2 border-t border-emerald-200/50 space-y-1">
                    <label htmlFor={idFamilyIncome} className="text-[11px] font-bold text-slate-700 flex justify-between">
                      <span>Estimated Net Family Income / Revenu familial net</span>
                      <span className="text-slate-500 font-normal">Threshold: $42,955 (18.75%)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs">$</span>
                      <input
                        id={idFamilyIncome}
                        type="number"
                        step="0.01"
                        value={form.tp_family_income}
                        onChange={(e) => handleNumberChange('tp_family_income', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-6 pr-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Resulting Line 6 */}
                  <div className="p-2 bg-emerald-100/60 rounded-lg border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-950">Line 6: Net Work Chart 2 Amount</span>
                      <p className="text-[10px] text-emerald-800">Age, living alone & retirement amount after clawback</p>
                    </div>
                    <span className="text-sm font-black text-emerald-900">
                      ${form.tp_line6_calculated.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* LINE 9 */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline">
                    <label htmlFor={idLine9} className="text-xs font-bold text-slate-800">
                      Line 9: Amount for career extension (Work Chart 3 / Prolongation de carrière)
                    </label>
                    <span className="text-[11px] text-slate-400">Max $12,755</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    For workers 65+ earning over $7,655 in employment/business income (Max $12,755).
                  </p>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                    <input
                      id={idLine9}
                      type="number"
                      step="0.01"
                      max={CAPS.LINE9}
                      value={form.tp_line9}
                      onChange={(e) =>
                        handleNumberChange(
                          'tp_line9',
                          e.target.value,
                          CAPS.LINE9,
                          'Capped at maximum allowable $12,755.'
                        )
                      }
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  {warnings.tp_line9 && (
                    <p className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {warnings.tp_line9}
                    </p>
                  )}
                </div>

                {/* LINE 10 RESULT HIGHLIGHT */}
                <div className="p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 rounded-xl text-white shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-bold text-emerald-100">
                      Line 10: Personal Tax Credits Total (Lignes 1 + 2 + 3 + 5 + 6 + 9)
                    </span>
                    <p className="text-[11px] text-emerald-100">
                      This is the final value passed to your Onboarding Profile
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                      ${form.tp_line10_total.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: ADDITIONAL TAX WITHHELD */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black inline-flex items-center justify-center">
                      3
                    </span>
                    Section 3: Additional Tax Withheld / Retenue supplémentaire
                  </h3>
                </div>

                <div className="space-y-1">
                  <label htmlFor={idLine11} className="text-xs font-bold text-slate-800">
                    Line 11: Additional income tax to be withheld per paycheque
                  </label>
                  <p className="text-[11px] text-slate-500">
                    If you want more provincial tax withheld to avoid owing at tax time.
                  </p>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                    <input
                      id={idLine11}
                      type="number"
                      step="0.01"
                      value={form.tp_line11_additional}
                      onChange={(e) => handleNumberChange('tp_line11_additional', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: DEDUCTIONS */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black inline-flex items-center justify-center">
                      4
                    </span>
                    Section 4: Deductions (Lignes 14 à 19)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor={idLine14} className="text-xs font-bold text-slate-800">
                      Line 14: Housing deduction (Remote areas)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                      <input
                        id={idLine14}
                        type="number"
                        step="0.01"
                        value={form.tp_line14}
                        onChange={(e) => handleNumberChange('tp_line14', e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor={idLine15} className="text-xs font-bold text-slate-800">
                      Line 15: Deductible support payments
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                      <input
                        id={idLine15}
                        type="number"
                        step="0.01"
                        value={form.tp_line15}
                        onChange={(e) => handleNumberChange('tp_line15', e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Line 19: TOTAL DEDUCTIONS (Lines 14 + 15)</span>
                  <span className="font-bold text-slate-900">
                    ${form.tp_line19_deductions.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* SECTION 5: EXEMPTION */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-black inline-flex items-center justify-center">
                      5
                    </span>
                    Section 5: Exemption
                  </h3>
                </div>

                <label
                  htmlFor={idBox20}
                  className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors cursor-pointer"
                >
                  <input
                    id={idBox20}
                    type="checkbox"
                    checked={form.tp_box20_exemption}
                    onChange={(e) => handleCheckboxChange('tp_box20_exemption', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 mt-0.5"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800">Box 20: Request exemption from source deductions for 2026</span>
                    <p className="text-[11px] text-slate-500">
                      Check if you estimate your total taxable income from all sources will not exceed your total claim amount.
                    </p>
                  </div>
                </label>
              </div>

              {/* SUBMIT BUTTON (FOR FORM SUBMIT) */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Québec Form & Pass Line 10 (${form.tp_line10_total.toLocaleString('en-CA', { minimumFractionDigits: 2 })})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* RIGHT COLUMN: MASTER FORM RECORD & AUDIT SUMMARY */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-xl border-2 border-emerald-600 shadow-md p-5 space-y-4 sticky top-0">
                <div className="border-b-2 border-emerald-600 pb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wide">
                    Master Form Record
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Live Values
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">
                      Québec Personal Tax Credits (Line 10)
                    </label>
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-base font-black text-emerald-900 flex justify-between items-center">
                      <span>${form.tp_line10_total.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[10px] font-bold uppercase bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
                        Passes to Form
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">
                      Additional Tax Withheld / Pay (Line 11)
                    </label>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800">
                      ${form.tp_line11_additional.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">
                      Total Deductions (Line 19)
                    </label>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800">
                      ${form.tp_line19_deductions.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase">
                      Tax Source Exemption (Box 20)
                    </label>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      {form.tp_box20_exemption ? (
                        <>
                          <ShieldAlert className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-700 font-bold">Requested (Yes - Exemption active)</span>
                        </>
                      ) : (
                        <span className="text-slate-600">No (Standard withholding applied)</span>
                      )}
                    </div>
                  </div>

                  <hr className="border-slate-200 my-2" />

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Sub-Calculation Breakdown
                    </span>
                    
                    <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between text-xs">
                      <span className="text-slate-600">Net Line 6 (Age/Alone/Retirement):</span>
                      <span className="font-bold text-slate-900">
                        ${form.tp_line6_calculated.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between text-xs">
                      <span className="text-slate-600">Career Extension (Line 9):</span>
                      <span className="font-bold text-slate-900">
                        ${form.tp_line9.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between text-xs">
                      <span className="text-slate-600">Basic Personal (Line 1):</span>
                      <span className="font-bold text-slate-900">
                        ${form.tp_line1.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleSubmitAndApply}
                    className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply Line 10 to Onboarding</span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel & Return
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="bg-slate-100 border-t border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
          <span className="text-slate-500">
            Conforme aux barèmes officiels 2026 de Revenu Québec (TP-1015.3-V)
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitAndApply}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply Line 10 (${form.tp_line10_total.toLocaleString('en-CA', { minimumFractionDigits: 2 })})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
