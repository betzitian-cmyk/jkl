import React, { useState, useId } from 'react';
import {
  X,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Calculator,
  RotateCcw,
  Sparkles,
  Info,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Building2,
  User,
  Briefcase
} from 'lucide-react';

export interface TP1016FormData {
  taxYear: number;
  applicantName: string;
  professionalName: string;
  payerName: string;
  remunSalary: boolean;
  remunLump: boolean;
  remunOther: boolean;
  remunTreaty: boolean;
  remunNonResident: boolean;
  line1_rrsp: number;
  line2_employment_expenses: number;
  line3_other_deductions: number;
  line5_total_deductions: number;
  line8_other_income: number;
  line10_net_deductions: number;
  line11_labour_fund: number;
  line12_other_credits: number;
  line15_total_credits: number;
  // Part 5 Non-resident fields
  nonResidentApplicantType: string;
  nonResidentAdditionalPayments: number;
  nonResidentArrivalDate: string;
  nonResidentDepartureDate: string;
}

export interface QuebecTP1016ModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultApplicantName?: string;
  defaultEmployerName?: string;
  initialLine10?: number;
  initialLine15?: number;
  onApply: (result: {
    line10NetDeductions: number;
    line15TaxCredits: number;
    isEligible: boolean;
    formData: TP1016FormData;
  }) => void;
}

const DEFAULT_TP1016_STATE: TP1016FormData = {
  taxYear: 2026,
  applicantName: '',
  professionalName: '',
  payerName: 'AppStudio Technologies Inc.',
  remunSalary: true,
  remunLump: false,
  remunOther: false,
  remunTreaty: false,
  remunNonResident: false,
  line1_rrsp: 0,
  line2_employment_expenses: 0,
  line3_other_deductions: 0,
  line5_total_deductions: 0,
  line8_other_income: 0,
  line10_net_deductions: 0,
  line11_labour_fund: 0,
  line12_other_credits: 0,
  line15_total_credits: 0,
  nonResidentApplicantType: 'Individual - Employee',
  nonResidentAdditionalPayments: 0,
  nonResidentArrivalDate: '',
  nonResidentDepartureDate: '',
};

export const QuebecTP1016Modal: React.FC<QuebecTP1016ModalProps> = ({
  isOpen,
  onClose,
  defaultApplicantName,
  defaultEmployerName,
  initialLine10,
  initialLine15,
  onApply,
}) => {
  const [form, setForm] = useState<TP1016FormData>(() => ({
    ...DEFAULT_TP1016_STATE,
    applicantName: defaultApplicantName || '',
    payerName: defaultEmployerName || DEFAULT_TP1016_STATE.payerName,
    line10_net_deductions: initialLine10 || 0,
    line15_total_credits: initialLine15 || 0,
  }));

  const idTaxYear = useId();
  const idApplicantName = useId();
  const idProfName = useId();
  const idPayerName = useId();
  const idLine1 = useId();
  const idLine2 = useId();
  const idLine3 = useId();
  const idLine8 = useId();
  const idLine11 = useId();
  const idLine12 = useId();

  if (!isOpen) return null;

  const calculateDerived = (prev: TP1016FormData): TP1016FormData => {
    const line5 = prev.line1_rrsp + prev.line2_employment_expenses + prev.line3_other_deductions;
    const line10 = Math.max(0, line5 - prev.line8_other_income);
    const line15 = prev.line11_labour_fund + prev.line12_other_credits;

    return {
      ...prev,
      line5_total_deductions: Math.round(line5 * 100) / 100,
      line10_net_deductions: Math.round(line10 * 100) / 100,
      line15_total_credits: Math.round(line15 * 100) / 100,
    };
  };

  const handleNumberChange = (field: keyof TP1016FormData, valueStr: string) => {
    const val = Math.max(0, parseFloat(valueStr) || 0);
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      return calculateDerived(next);
    });
  };

  const handleTextChange = (field: keyof TP1016FormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: keyof TP1016FormData, checked: boolean) => {
    setForm((prev) => ({ ...prev, [field]: checked }));
  };

  const isEligible = form.line10_net_deductions >= 2000 || form.line15_total_credits >= 400;

  const handlePresetRRSP = () => {
    setForm((prev) =>
      calculateDerived({
        ...prev,
        line1_rrsp: 4500,
        line2_employment_expenses: 1200,
        line8_other_income: 0,
        line11_labour_fund: 0,
        line12_other_credits: 0,
      })
    );
  };

  const handlePresetCredits = () => {
    setForm((prev) =>
      calculateDerived({
        ...prev,
        line1_rrsp: 0,
        line2_employment_expenses: 0,
        line8_other_income: 0,
        line11_labour_fund: 750,
        line12_other_credits: 300,
      })
    );
  };

  const handleReset = () => {
    setForm({
      ...DEFAULT_TP1016_STATE,
      applicantName: defaultApplicantName || '',
      payerName: defaultEmployerName || DEFAULT_TP1016_STATE.payerName,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      line10NetDeductions: form.line10_net_deductions,
      line15TaxCredits: form.line15_total_credits,
      isEligible,
      formData: form,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tp1016-title"
    >
      <div className="bg-white rounded-xl shadow-2xl border border-cyan-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-cyan-900 via-teal-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-700/80 flex items-center justify-center text-cyan-100 border border-cyan-500/40">
              <FileCheck2 className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider bg-cyan-500/30 text-cyan-200 px-2 py-0.5 rounded border border-cyan-400/30">
                  Revenu Québec • TP-1016-V (2026)
                </span>
                <span className="text-xs text-cyan-200 hidden sm:inline">
                  • Demande de réduction de la retenue d'impôt
                </span>
              </div>
              <h2 id="tp1016-title" className="text-base sm:text-lg font-bold text-white leading-tight">
                Application for a Reduction in Source Deductions of Québec Income Tax
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-cyan-200 hover:text-white hover:bg-cyan-800/60 p-2 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SUBHEADER CONTROLS & PRESETS */}
        <div className="bg-cyan-50/70 border-b border-cyan-100 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-cyan-950 font-medium">
            <Info className="w-4 h-4 text-cyan-700 shrink-0" />
            <span>
              Generally requires net deductions of <strong>$2,000+ (Line 10)</strong> or tax credits of <strong>$400+ (Line 15)</strong> not already on Form TP-1015.3-V.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePresetRRSP}
              className="px-2.5 py-1 rounded bg-white hover:bg-cyan-100 text-cyan-900 border border-cyan-200 font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-cyan-600" />
              RRSP & Expenses Preset ($5,700)
            </button>
            <button
              type="button"
              onClick={handlePresetCredits}
              className="px-2.5 py-1 rounded bg-white hover:bg-cyan-100 text-cyan-900 border border-cyan-200 font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-cyan-600" />
              Labour Fund & Donation Preset ($1,050)
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              Reset
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/60">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* LEFT / MAIN COLUMN: THE TP-1016-V FORM */}
            <form id="tp1016-form" onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
              
              {/* SECTION 1 & 2: TAX YEAR, APPLICANT & PAYER */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-cyan-700" />
                    1 & 2. Applicant & Employer Information
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <label htmlFor={idTaxYear} className="text-[11px] font-bold text-slate-600">Year:</label>
                    <input
                      id={idTaxYear}
                      type="number"
                      value={form.taxYear}
                      onChange={(e) => handleTextChange('taxYear', parseInt(e.target.value) || 2026)}
                      className="w-20 px-2 py-0.5 border border-slate-300 rounded text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor={idApplicantName} className="text-xs font-bold text-slate-800">
                      Applicant Name (First & Last)
                    </label>
                    <input
                      id={idApplicantName}
                      type="text"
                      value={form.applicantName}
                      onChange={(e) => handleTextChange('applicantName', e.target.value)}
                      placeholder="e.g. Jean Tremblay"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor={idProfName} className="text-xs font-bold text-slate-800">
                      Professional Name (if applicable)
                    </label>
                    <input
                      id={idProfName}
                      type="text"
                      value={form.professionalName}
                      onChange={(e) => handleTextChange('professionalName', e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label htmlFor={idPayerName} className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      Payer / Employer Name
                    </label>
                    <input
                      id={idPayerName}
                      type="text"
                      value={form.payerName}
                      onChange={(e) => handleTextChange('payerName', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-cyan-600 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: REMUNERATION TYPE */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-cyan-700" />
                    3. Information about the Remuneration
                  </h3>
                  <p className="text-[11px] text-slate-500">Select all payment categories subject to this reduction request:</p>
                </div>

                <div className="space-y-2 text-xs">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.remunSalary}
                      onChange={(e) => handleCheckboxChange('remunSalary', e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-700 focus:ring-cyan-600 border-slate-300 mt-0.5"
                    />
                    <span className="text-slate-700">Salary or wages (other than a lump-sum payment)</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.remunLump}
                      onChange={(e) => handleCheckboxChange('remunLump', e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-700 focus:ring-cyan-600 border-slate-300 mt-0.5"
                    />
                    <span className="text-slate-700">Lump-sum payment of salary or wages (e.g., bonus, retroactive pay, vacation pay)</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.remunOther}
                      onChange={(e) => handleCheckboxChange('remunOther', e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-700 focus:ring-cyan-600 border-slate-300 mt-0.5"
                    />
                    <span className="text-slate-700">Other payment (e.g., single payment from RRSP or RRIF)</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.remunTreaty}
                      onChange={(e) => handleCheckboxChange('remunTreaty', e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-700 focus:ring-cyan-600 border-slate-300 mt-0.5"
                    />
                    <span className="text-slate-700">Amount exempt under a tax agreement / tax treaty</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.remunNonResident}
                      onChange={(e) => handleCheckboxChange('remunNonResident', e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-700 focus:ring-cyan-600 border-slate-300 mt-0.5"
                    />
                    <span className="text-slate-700 font-semibold text-cyan-900">
                      Payment for services rendered in Québec by a non-resident (Unlocks Section 5)
                    </span>
                  </label>
                </div>
              </div>

              {/* SECTION 4: DEDUCTIONS & TAX CREDITS */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-cyan-700" />
                    4. Deductions and Tax Credits
                  </h3>
                </div>

                {/* 4.1 Deductions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-900">4.1 Deductions (Lignes 1 à 10)</span>
                    <span className="text-[11px] text-slate-500">Min $2,000 threshold</span>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor={idLine1} className="text-xs font-bold text-slate-700">
                      Line 1: Contributions to an RRSP (not withheld at source)
                    </label>
                    <p className="text-[10px] text-slate-400">Direct individual contributions made to an RRSP/PRAC/VRSP</p>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                      <input
                        id={idLine1}
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.line1_rrsp}
                        onChange={(e) => handleNumberChange('line1_rrsp', e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-cyan-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor={idLine2} className="text-xs font-bold text-slate-700">
                      Line 2: Employment expenses (Forms TP-64.3-V & TP-59-V)
                    </label>
                    <p className="text-[10px] text-slate-400">Allowable motor vehicle, home office, or travel expenses certified by employer</p>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                      <input
                        id={idLine2}
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.line2_employment_expenses}
                        onChange={(e) => handleNumberChange('line2_employment_expenses', e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-cyan-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor={idLine3} className="text-xs font-bold text-slate-700">
                      Line 3: Other deductions (e.g. moving expenses, carrying charges)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                      <input
                        id={idLine3}
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.line3_other_deductions}
                        onChange={(e) => handleNumberChange('line3_other_deductions', e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-cyan-600"
                      />
                    </div>
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-semibold">Line 5: Total Deductions (Lines 1 to 3)</span>
                    <span className="font-bold text-slate-800">
                      ${form.line5_total_deductions.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor={idLine8} className="text-xs font-bold text-slate-700">
                      Line 8: Estimated income not subject to source deductions
                    </label>
                    <span className="text-[10px] text-slate-400 block">
                      e.g., interest, taxable dividends, net business or net rental income
                    </span>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                      <input
                        id={idLine8}
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.line8_other_income}
                        onChange={(e) => handleNumberChange('line8_other_income', e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-cyan-600"
                      />
                    </div>
                  </div>

                  {/* LINE 10 RESULT HIGHLIGHT */}
                  <div className="p-3 bg-cyan-50 border-2 border-cyan-600 rounded-xl flex items-center justify-between text-cyan-950">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wide">
                        Line 10: Net Deductions (Line 5 minus Line 8)
                      </span>
                      <p className="text-[11px] text-cyan-800">Reduces remuneration subject to Québec withholding</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-black text-cyan-900">
                        ${form.line10_net_deductions.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-200" />

                {/* 4.2 Tax Credits */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-900">4.2 Tax Credits (Lignes 11 à 15)</span>
                    <span className="text-[11px] text-slate-500">Min $400 threshold</span>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor={idLine11} className="text-xs font-bold text-slate-700">
                      Line 11: Tax credit respecting a labour-sponsored fund (Fonds FTQ / Fondaction)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                      <input
                        id={idLine11}
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.line11_labour_fund}
                        onChange={(e) => handleNumberChange('line11_labour_fund', e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-cyan-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor={idLine12} className="text-xs font-bold text-slate-700">
                      Line 12: Other tax credits (donations, foreign tax credits)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                      <input
                        id={idLine12}
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.line12_other_credits}
                        onChange={(e) => handleNumberChange('line12_other_credits', e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-2 focus:ring-cyan-600"
                      />
                    </div>
                  </div>

                  {/* LINE 15 RESULT HIGHLIGHT */}
                  <div className="p-3 bg-cyan-50 border-2 border-cyan-600 rounded-xl flex items-center justify-between text-cyan-950">
                    <div>
                      <span className="text-xs font-extrabold uppercase tracking-wide">
                        Line 15: Total Tax Credits (Lines 11 + 12)
                      </span>
                      <p className="text-[11px] text-cyan-800">Directly credits and reduces Québec tax payable</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg sm:text-xl font-black text-cyan-900">
                        ${form.line15_total_credits.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* THRESHOLD VALIDATION STATUS BANNER */}
                {isEligible ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-start gap-2 text-xs text-emerald-900">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Eligibility Requirement Met:</strong>
                      <p className="text-emerald-800">
                        You meet the statutory requirement (Net Deductions ≥ $2,000 or Tax Credits ≥ $400). This reduction can be applied to your source deductions.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Notice Regarding Statutory Thresholds:</strong>
                      <p className="text-amber-800">
                        An application generally requires net deductions of at least <strong>$2,000 (Line 10)</strong> OR tax credits of at least <strong>$400 (Line 15)</strong> not shown on Form TP-1015.3-V.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* CONDITIONAL PART 5: NON-RESIDENT SERVICES */}
              {form.remunNonResident && (
                <div className="bg-cyan-50/70 border border-cyan-300 rounded-xl p-4 sm:p-5 space-y-3 animate-fadeIn">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-950 border-b border-cyan-200 pb-1.5">
                    5. Services Rendered in Québec by a Non-Resident
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">5.1 Type of Applicant</label>
                      <select
                        value={form.nonResidentApplicantType}
                        onChange={(e) => handleTextChange('nonResidentApplicantType', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="Individual - Employee">Individual (Employee)</option>
                        <option value="Individual - Self-Employed">Individual (Self-Employed)</option>
                        <option value="Unincorporated Group">Unincorporated Group</option>
                        <option value="Partnership">Partnership</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">5.2 Additional Contract Payments</label>
                      <input
                        type="number"
                        min="0"
                        value={form.nonResidentAdditionalPayments}
                        onChange={(e) => handleNumberChange('nonResidentAdditionalPayments', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">5.3 Arrival Date in Québec</label>
                      <input
                        type="date"
                        value={form.nonResidentArrivalDate}
                        onChange={(e) => handleTextChange('nonResidentArrivalDate', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">5.3 Departure Date from Québec</label>
                      <input
                        type="date"
                        value={form.nonResidentDepartureDate}
                        onChange={(e) => handleTextChange('nonResidentDepartureDate', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="w-full py-3 px-4 bg-cyan-800 hover:bg-cyan-900 active:bg-cyan-950 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit TP-1016-V & Apply Québec Tax Reduction</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* RIGHT COLUMN: MASTER FORM RECORD (TP-1016-V DATA) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-xl border-2 border-cyan-800 shadow-md p-5 space-y-4 sticky top-0">
                <div className="border-b-2 border-cyan-800 pb-2 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-cyan-950 uppercase tracking-wide">
                    Master Form Record (TP-1016-V Data)
                  </h3>
                  <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full">
                    Active Values
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">Taxation Year</label>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">
                      {form.taxYear}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">Applicant Name</label>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800 truncate">
                      {form.applicantName || '(Employee Name Pending)'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">Payer / Employer</label>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800 truncate">
                      {form.payerName}
                    </div>
                  </div>

                  <hr className="border-slate-200 my-2" />
                  <strong className="text-slate-800 block uppercase text-[11px] tracking-wider">Evaluated Amounts</strong>

                  <div>
                    <label className="block text-[11px] font-bold text-cyan-900 uppercase">
                      Evaluated Net Deductions (Line 10)
                    </label>
                    <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-lg text-base font-black text-cyan-950 flex justify-between items-center">
                      <span>${form.line10_net_deductions.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[10px] font-bold uppercase bg-cyan-200 text-cyan-900 px-1.5 py-0.5 rounded">
                        Remuneration Reduction
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-cyan-900 uppercase">
                      Evaluated Total Tax Credits (Line 15)
                    </label>
                    <div className="p-2.5 bg-cyan-50 border border-cyan-200 rounded-lg text-base font-black text-cyan-950 flex justify-between items-center">
                      <span>${form.line15_total_credits.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</span>
                      <span className="text-[10px] font-bold uppercase bg-cyan-200 text-cyan-900 px-1.5 py-0.5 rounded">
                        Direct Tax Credit
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase">
                      Minimum Threshold Met?
                    </label>
                    <div
                      className={`p-2 rounded font-bold flex items-center gap-1.5 ${
                        isEligible
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {isEligible ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>Yes (Eligible for Source Reduction)</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-700" />
                          <span>No (Below $2,000 / $400 limit)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <hr className="border-slate-200 my-2" />
                  <strong className="text-slate-800 block uppercase text-[11px] tracking-wider">Non-Resident Status</strong>

                  <div className="p-2 bg-slate-50 rounded border border-slate-200 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Non-Resident Services Included:</span>
                      <span className="font-bold text-slate-800">{form.remunNonResident ? 'Yes' : 'No'}</span>
                    </div>
                    {form.remunNonResident && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">Applicant Type:</span>
                        <span className="font-bold text-slate-800">{form.nonResidentApplicantType}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full py-2.5 px-3 bg-cyan-800 hover:bg-cyan-900 text-white rounded-lg font-bold text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Apply Reduction to Onboarding Profile</span>
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
            Revenu Québec Form TP-1016-V / Application for a Reduction in Source Deductions of Income Tax
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
              onClick={handleSubmit}
              className="px-4 py-1.5 bg-cyan-800 hover:bg-cyan-900 text-white rounded-lg font-bold shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply Reduction (Line 10: ${form.line10_net_deductions.toLocaleString('en-CA', { minimumFractionDigits: 2 })})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
