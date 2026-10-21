import React, { useState, useEffect, useId } from 'react';
import { 
  X, 
  Calculator, 
  CheckCircle2, 
  FileText, 
  Info, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  Building2,
  DollarSign,
  Globe,
  RotateCcw
} from 'lucide-react';

export interface T1213FormData {
  t1213_employer: string;
  t1213_tax_on: 'Salary' | 'Lump Sum';
  t1213_lump_sum: number;
  t1213_diff_prov: 'Yes' | 'No';
  t1213_prov_worked: string;

  // Part 3 Deductions
  t1213_line1_rrsp: number;
  t1213_line2_child_care: number;
  t1213_line3_support: number;
  t1213_line4_employment_exp: number;
  t1213_line5_carrying_charges: number;
  t1213_line6_medical: number;
  t1213_line7_donations: number;
  t1213_line8_clergy: number;
  t1213_line9_rpp_buyback: number;
  t1213_line10_foreign_tax: number;
  t1213_line11_other: number;

  t1213_total_deductions: number;
  t1213_line12_other_income: number;
  t1213_net_waiver: number;
}

interface FederalT1213ModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmployerName?: string;
  initialNetWaiver?: number;
  onApply: (result: {
    netWaiverAmount: number;
    reductionTarget: 'Salary' | 'Lump Sum';
    isCrossProvince: boolean;
    formData: T1213FormData;
  }) => void;
}

const DEFAULT_FORM_STATE: T1213FormData = {
  t1213_employer: 'PaieQuébec Inc.',
  t1213_tax_on: 'Salary',
  t1213_lump_sum: 0,
  t1213_diff_prov: 'No',
  t1213_prov_worked: '',

  t1213_line1_rrsp: 0,
  t1213_line2_child_care: 0,
  t1213_line3_support: 0,
  t1213_line4_employment_exp: 0,
  t1213_line5_carrying_charges: 0,
  t1213_line6_medical: 0,
  t1213_line7_donations: 0,
  t1213_line8_clergy: 0,
  t1213_line9_rpp_buyback: 0,
  t1213_line10_foreign_tax: 0,
  t1213_line11_other: 0,

  t1213_total_deductions: 0,
  t1213_line12_other_income: 0,
  t1213_net_waiver: 0,
};

export const FederalT1213Modal: React.FC<FederalT1213ModalProps> = ({
  isOpen,
  onClose,
  defaultEmployerName,
  initialNetWaiver,
  onApply,
}) => {
  const formId = useId();
  const [formData, setFormData] = useState<T1213FormData>({
    ...DEFAULT_FORM_STATE,
    t1213_employer: defaultEmployerName || 'PaieQuébec Inc.',
    t1213_line1_rrsp: initialNetWaiver && initialNetWaiver > 0 ? initialNetWaiver : 0,
  });

  const [hasCalculated, setHasCalculated] = useState<boolean>(false);

  // Synchronize initial values when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        t1213_employer: defaultEmployerName || prev.t1213_employer || 'PaieQuébec Inc.',
        t1213_line1_rrsp: (initialNetWaiver && initialNetWaiver > 0 && prev.t1213_line1_rrsp === 0) 
          ? initialNetWaiver 
          : prev.t1213_line1_rrsp,
      }));
    }
  }, [isOpen, defaultEmployerName, initialNetWaiver]);

  // Recalculate totals dynamically whenever relevant fields change
  useEffect(() => {
    const isDiffProv = formData.t1213_diff_prov === 'Yes';
    if (isDiffProv) {
      setFormData(prev => ({
        ...prev,
        t1213_total_deductions: 0,
        t1213_net_waiver: 0,
      }));
      return;
    }

    const totalDeductions = (
      (Number(formData.t1213_line1_rrsp) || 0) +
      (Number(formData.t1213_line2_child_care) || 0) +
      (Number(formData.t1213_line3_support) || 0) +
      (Number(formData.t1213_line4_employment_exp) || 0) +
      (Number(formData.t1213_line5_carrying_charges) || 0) +
      (Number(formData.t1213_line6_medical) || 0) +
      (Number(formData.t1213_line7_donations) || 0) +
      (Number(formData.t1213_line8_clergy) || 0) +
      (Number(formData.t1213_line9_rpp_buyback) || 0) +
      (Number(formData.t1213_line10_foreign_tax) || 0) +
      (Number(formData.t1213_line11_other) || 0)
    );

    const line12 = Number(formData.t1213_line12_other_income) || 0;
    const netWaiver = Math.max(0, totalDeductions - line12);

    setFormData(prev => ({
      ...prev,
      t1213_total_deductions: Math.round(totalDeductions * 100) / 100,
      t1213_net_waiver: Math.round(netWaiver * 100) / 100,
    }));
  }, [
    formData.t1213_diff_prov,
    formData.t1213_line1_rrsp,
    formData.t1213_line2_child_care,
    formData.t1213_line3_support,
    formData.t1213_line4_employment_exp,
    formData.t1213_line5_carrying_charges,
    formData.t1213_line6_medical,
    formData.t1213_line7_donations,
    formData.t1213_line8_clergy,
    formData.t1213_line9_rpp_buyback,
    formData.t1213_line10_foreign_tax,
    formData.t1213_line11_other,
    formData.t1213_line12_other_income,
  ]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof T1213FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberChange = (field: keyof T1213FormData, rawVal: string) => {
    const parsed = parseFloat(rawVal);
    handleInputChange(field, isNaN(parsed) || parsed < 0 ? 0 : parsed);
  };

  const handlePreset = (type: 'rrsp' | 'employment' | 'family_medical' | 'reset') => {
    if (type === 'rrsp') {
      setFormData(prev => ({
        ...prev,
        t1213_diff_prov: 'No',
        t1213_line1_rrsp: 6000,
        t1213_line4_employment_exp: 0,
        t1213_line2_child_care: 0,
        t1213_line12_other_income: 0,
      }));
    } else if (type === 'employment') {
      setFormData(prev => ({
        ...prev,
        t1213_diff_prov: 'No',
        t1213_line4_employment_exp: 3500,
        t1213_line5_carrying_charges: 450,
      }));
    } else if (type === 'family_medical') {
      setFormData(prev => ({
        ...prev,
        t1213_diff_prov: 'No',
        t1213_line2_child_care: 4200,
        t1213_line6_medical: 2100,
        t1213_line7_donations: 500,
      }));
    } else if (type === 'reset') {
      setFormData({
        ...DEFAULT_FORM_STATE,
        t1213_employer: defaultEmployerName || 'PaieQuébec Inc.',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasCalculated(true);

    onApply({
      netWaiverAmount: formData.t1213_diff_prov === 'Yes' ? 0 : formData.t1213_net_waiver,
      reductionTarget: formData.t1213_tax_on,
      isCrossProvince: formData.t1213_diff_prov === 'Yes',
      formData,
    });

    onClose();
  };

  const isCrossProv = formData.t1213_diff_prov === 'Yes';
  const isLumpSum = formData.t1213_tax_on === 'Lump Sum';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${formId}-title`}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-5xl my-6 max-h-[92vh] flex flex-col overflow-hidden text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-700/80 rounded-lg text-white">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id={`${formId}-title`} className="text-base font-bold text-white tracking-tight">
                  2026 CRA Form T1213
                </h2>
                <span className="text-[11px] font-semibold uppercase tracking-wider bg-sky-500/20 text-sky-200 px-2 py-0.5 rounded border border-sky-400/30">
                  Federal Tax Reduction
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Request to Reduce Tax Deductions at Source (Canada Revenue Agency)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Bar */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-sky-700" />
            <span>Quick Presets:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handlePreset('rrsp')}
              className="px-2.5 py-1 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-900 border border-slate-200 rounded text-[11px] font-medium transition cursor-pointer"
            >
              $6k RRSP Contribution
            </button>
            <button
              type="button"
              onClick={() => handlePreset('employment')}
              className="px-2.5 py-1 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-900 border border-slate-200 rounded text-[11px] font-medium transition cursor-pointer"
            >
              Employment & Loan Expenses
            </button>
            <button
              type="button"
              onClick={() => handlePreset('family_medical')}
              className="px-2.5 py-1 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-900 border border-slate-200 rounded text-[11px] font-medium transition cursor-pointer"
            >
              Child Care & Medical
            </button>
            <button
              type="button"
              onClick={() => handlePreset('reset')}
              className="px-2 py-1 text-slate-500 hover:text-red-700 rounded text-[11px] flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Form Body - Split View */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50">
          
          {/* Main Webform Inputs (Left 7 Cols) */}
          <form id="t1213-modal-form" onSubmit={handleSubmit} className="lg:col-span-7 space-y-5 bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
            
            {/* Employer / Payer Name */}
            <div className="space-y-1.5">
              <label htmlFor="t1213_employer" className="block text-xs font-bold text-slate-800">
                Employer / Payer Name *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  id="t1213_employer"
                  required
                  value={formData.t1213_employer}
                  onChange={e => handleInputChange('t1213_employer', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 focus:ring-2 focus:ring-sky-600 focus:outline-none"
                  placeholder="Company Legal Name"
                />
              </div>
            </div>

            {/* Part 2: Request to Reduce Tax On */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5">
                Part 2 — Request to reduce tax on
              </h3>

              <div className="flex items-center gap-6 text-xs font-semibold text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="t1213_tax_on"
                    checked={formData.t1213_tax_on === 'Salary'}
                    onChange={() => handleInputChange('t1213_tax_on', 'Salary')}
                    className="w-4 h-4 text-sky-700 focus:ring-sky-600 border-slate-300"
                  />
                  <span>Salary / Regular Paycheques</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="t1213_tax_on"
                    checked={formData.t1213_tax_on === 'Lump Sum'}
                    onChange={() => handleInputChange('t1213_tax_on', 'Lump Sum')}
                    className="w-4 h-4 text-sky-700 focus:ring-sky-600 border-slate-300"
                  />
                  <span>Lump Sum Payment (e.g. Bonus, Retiring Allowance)</span>
                </label>
              </div>

              {isLumpSum && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md space-y-1.5">
                  <label htmlFor="t1213_lump_sum" className="block text-xs font-semibold text-amber-900">
                    Lump sum payment amount ($)
                  </label>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Enter payment details (e.g., bonus). If for an RRSP, do not exceed your RRSP deduction limit.
                  </p>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">$</span>
                    <input
                      type="number"
                      id="t1213_lump_sum"
                      min="0"
                      step="0.01"
                      value={formData.t1213_lump_sum || ''}
                      onChange={e => handleNumberChange('t1213_lump_sum', e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-1.5 bg-white border border-amber-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Cross-Province Question */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Do you work in a different province or territory than the one you live in?
                </label>
                <div className="flex items-center gap-6 text-xs font-semibold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="t1213_diff_prov"
                      checked={formData.t1213_diff_prov === 'Yes'}
                      onChange={() => handleInputChange('t1213_diff_prov', 'Yes')}
                      className="w-4 h-4 text-sky-700 focus:ring-sky-600 border-slate-300"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="t1213_diff_prov"
                      checked={formData.t1213_diff_prov === 'No'}
                      onChange={() => handleInputChange('t1213_diff_prov', 'No')}
                      className="w-4 h-4 text-sky-700 focus:ring-sky-600 border-slate-300"
                    />
                    <span>No</span>
                  </label>
                </div>

                {isCrossProv && (
                  <div className="p-3 bg-sky-50 border border-sky-300 rounded-md space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-sky-950 font-medium">
                      <Globe className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
                      <span>Notice: Form instructions require skipping Part 3. Your request will be evaluated by CRA based on your interprovincial tax differential.</span>
                    </div>
                    <div>
                      <label htmlFor="t1213_prov_worked" className="block text-xs font-semibold text-sky-900 mb-1">
                        Province / Territory worked in:
                      </label>
                      <input
                        type="text"
                        id="t1213_prov_worked"
                        value={formData.t1213_prov_worked}
                        onChange={e => handleInputChange('t1213_prov_worked', e.target.value)}
                        placeholder="e.g., Ontario, Alberta, British Columbia"
                        className="w-full px-3 py-1.5 bg-white border border-sky-300 rounded text-sm text-slate-900 focus:ring-2 focus:ring-sky-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Part 3: Deductions & Credits (Conditional on diff_prov === 'No') */}
            {!isCrossProv && (
              <div className="space-y-4 pt-1">
                <div className="border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Part 3 — Deductions from income and non-refundable tax credits
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enter anticipated 2026 allowable deductions. Must be verified and supported by documentation upon CRA request.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Line 1: RRSP */}
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                      <label htmlFor="t1213_line1_rrsp" className="text-xs font-semibold text-slate-800">
                        Line 1: Registered retirement savings plan (RRSP) contributions
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400 mb-1.5">
                      Do not include employer-deducted contributions. Must not exceed your available RRSP deduction limit.
                    </p>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        id="t1213_line1_rrsp"
                        min="0"
                        step="0.01"
                        value={formData.t1213_line1_rrsp || ''}
                        onChange={e => handleNumberChange('t1213_line1_rrsp', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-medium"
                      />
                    </div>
                  </div>

                  {/* Line 2: Child care */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <label htmlFor="t1213_line2_child_care" className="block text-xs font-semibold text-slate-800 mb-1">
                        Line 2: Child care expenses
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          id="t1213_line2_child_care"
                          min="0"
                          step="0.01"
                          value={formData.t1213_line2_child_care || ''}
                          onChange={e => handleNumberChange('t1213_line2_child_care', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-medium"
                        />
                      </div>
                    </div>

                    {/* Line 3: Support payments */}
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <label htmlFor="t1213_line3_support" className="block text-xs font-semibold text-slate-800 mb-1">
                        Line 3: Support payments
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          id="t1213_line3_support"
                          min="0"
                          step="0.01"
                          value={formData.t1213_line3_support || ''}
                          onChange={e => handleNumberChange('t1213_line3_support', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Line 4: Employment expenses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <label htmlFor="t1213_line4_employment_exp" className="block text-xs font-semibold text-slate-800 mb-1">
                        Line 4: Employment expenses (Form T2200)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          id="t1213_line4_employment_exp"
                          min="0"
                          step="0.01"
                          value={formData.t1213_line4_employment_exp || ''}
                          onChange={e => handleNumberChange('t1213_line4_employment_exp', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-medium"
                        />
                      </div>
                    </div>

                    {/* Line 5: Carrying charges & interest */}
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <label htmlFor="t1213_line5_carrying_charges" className="block text-xs font-semibold text-slate-800 mb-1">
                        Line 5: Carrying charges & loan interest
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          id="t1213_line5_carrying_charges"
                          min="0"
                          step="0.01"
                          value={formData.t1213_line5_carrying_charges || ''}
                          onChange={e => handleNumberChange('t1213_line5_carrying_charges', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Line 6: Medical & Line 7: Donations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <label htmlFor="t1213_line6_medical" className="block text-xs font-semibold text-slate-800 mb-1">
                        Line 6: Medical expenses
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          id="t1213_line6_medical"
                          min="0"
                          step="0.01"
                          value={formData.t1213_line6_medical || ''}
                          onChange={e => handleNumberChange('t1213_line6_medical', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-medium"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <label htmlFor="t1213_line7_donations" className="block text-xs font-semibold text-slate-800 mb-1">
                        Line 7: Charitable donations
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          id="t1213_line7_donations"
                          min="0"
                          step="0.01"
                          value={formData.t1213_line7_donations || ''}
                          onChange={e => handleNumberChange('t1213_line7_donations', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lines 8, 9, 10, 11 collapsed or compact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <label htmlFor="t1213_line8_clergy" className="block text-xs font-semibold text-slate-800 mb-1">
                        Line 8: Clergy residence
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          id="t1213_line8_clergy"
                          min="0"
                          step="0.01"
                          value={formData.t1213_line8_clergy || ''}
                          onChange={e => handleNumberChange('t1213_line8_clergy', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-medium"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <label htmlFor="t1213_line9_rpp_buyback" className="block text-xs font-semibold text-slate-800 mb-1">
                        Line 9: RPP past service buy-back
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          id="t1213_line9_rpp_buyback"
                          min="0"
                          step="0.01"
                          value={formData.t1213_line9_rpp_buyback || ''}
                          onChange={e => handleNumberChange('t1213_line9_rpp_buyback', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-medium"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <label htmlFor="t1213_line10_foreign_tax" className="block text-xs font-semibold text-slate-800 mb-1">
                        Line 10: Foreign tax credit
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          id="t1213_line10_foreign_tax"
                          min="0"
                          step="0.01"
                          value={formData.t1213_line10_foreign_tax || ''}
                          onChange={e => handleNumberChange('t1213_line10_foreign_tax', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-medium"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                      <label htmlFor="t1213_line11_other" className="block text-xs font-semibold text-slate-800 mb-1">
                        Line 11: Other deduction / credits
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          id="t1213_line11_other"
                          min="0"
                          step="0.01"
                          value={formData.t1213_line11_other || ''}
                          onChange={e => handleNumberChange('t1213_line11_other', e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-1 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-sky-600 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subtotal: Lines 1 to 11 */}
                  <div className="p-3 bg-sky-50 rounded-lg border border-sky-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-sky-950">Total Deductions Requested (Lines 1 to 11)</span>
                      <p className="text-[10px] text-sky-700">Sum of all allowable deductions requested from CRA</p>
                    </div>
                    <span className="text-sm font-bold text-sky-900 bg-white px-3 py-1 rounded border border-sky-300">
                      ${formData.t1213_total_deductions.toLocaleString('en-CA', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Line 12: Offsetting Other Income */}
                  <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 space-y-1.5">
                    <label htmlFor="t1213_line12_other_income" className="block text-xs font-bold text-amber-950">
                      Line 12: Other income (no tax deducted at source)
                    </label>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      e.g., interest, rental, or self-employment income. This directly offsets your deduction request.
                    </p>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        id="t1213_line12_other_income"
                        min="0"
                        step="0.01"
                        value={formData.t1213_line12_other_income || ''}
                        onChange={e => handleNumberChange('t1213_line12_other_income', e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-6 pr-3 py-1 bg-white border border-amber-300 rounded text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Master Record / Live Audit Display (Right 5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-lg border-2 border-sky-900 p-4 shadow-sm space-y-4 sticky top-0">
              <div className="flex items-center justify-between border-b-2 border-sky-900 pb-2">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-sky-900" />
                  <h3 className="text-sm font-bold text-sky-950">Master Form Record (T1213 Data)</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-900 px-2 py-0.5 rounded">
                  Live Audit
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Employer / Payer:</span>
                  <span className="font-semibold text-slate-900 text-right truncate max-w-[180px]">
                    {formData.t1213_employer || '—'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Reduction Applied To:</span>
                  <span className="font-semibold text-slate-900">
                    {formData.t1213_tax_on}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Lump Sum Amount:</span>
                  <span className="font-semibold text-slate-900">
                    {isLumpSum ? `$${formData.t1213_lump_sum.toLocaleString('en-CA', { minimumFractionDigits: 2 })}` : 'N/A'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Cross-Province Reduction:</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {isCrossProv ? `Yes (${formData.t1213_prov_worked || 'Pending'})` : 'No'}
                  </span>
                </div>

                {/* Financial Summary */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Calculated Waiver Base (Part 3)
                  </span>

                  <div className="space-y-1.5 p-3 bg-slate-50 rounded-md border border-slate-200">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Total Requested (Lines 1-11):</span>
                      <span className="font-semibold text-slate-900">
                        {isCrossProv ? 'N/A' : `$${formData.t1213_total_deductions.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Offsetting Income (Line 12):</span>
                      <span className="font-semibold text-amber-700">
                        {isCrossProv ? 'N/A' : `-$${formData.t1213_line12_other_income.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-sky-950">Net Waiver Evaluated Amount:</span>
                      <span className="text-sm font-extrabold text-sky-950 bg-sky-100 px-2.5 py-1 rounded border border-sky-300">
                        {isCrossProv ? 'Deferred to CRA' : `$${formData.t1213_net_waiver.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Regulatory Note */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-md text-[11px] text-blue-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Info className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <span>CRA Letter of Authority Mandate:</span>
                  </div>
                  <p className="leading-relaxed text-[10px] text-blue-800">
                    Under Canada Revenue Agency regulations, the employer can only reduce tax withholdings at source upon receiving an official CRA Letter of Authority based on Form T1213.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                form="t1213-modal-form"
                className="w-full py-2.5 px-4 bg-sky-900 hover:bg-sky-950 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow hover:shadow-md transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit T1213 & Apply Federal Tax Reduction</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Form CRA T1213 (2026/01) — Canada Revenue Agency / Agence du revenu du Canada</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="t1213-modal-form"
              className="px-4 py-1.5 bg-sky-900 hover:bg-sky-950 text-white rounded text-xs font-bold transition cursor-pointer"
            >
              Apply Reduction
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
