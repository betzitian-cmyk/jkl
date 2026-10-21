/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BenefitContributions } from '../types';
import { Heart, Activity, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface BenefitsManagerProps {
  benefits: BenefitContributions;
  onChange: (benefits: BenefitContributions) => void;
}

export const BenefitsManager: React.FC<BenefitsManagerProps> = ({ benefits, onChange }) => {
  const { t } = useLanguage();

  const handleUpdate = (field: keyof BenefitContributions, value: any) => {
    onChange({ ...benefits, [field]: value });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-1.5 bg-purple-50 rounded text-purple-600">
          <Heart className="w-5 h-5" />
        </div>
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
          {t('benefits_employer')}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            {t('health_insurance')}
          </label>
          <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-500 transition-colors">
                <Activity className="w-3 h-3" />
              </div>
            <input
              type="number"
              value={benefits.health || ''}
              onChange={(e) => handleUpdate('health', parseFloat(e.target.value) || 0)}
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-purple-500 outline-none font-medium"
              placeholder="0,00 $"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            {t('life_insurance')}
          </label>
          <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-500 transition-colors">
                <ShieldCheck className="w-3 h-3" />
              </div>
            <input
              type="number"
              value={benefits.lifeInsurance || ''}
              onChange={(e) => handleUpdate('lifeInsurance', parseFloat(e.target.value) || 0)}
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-purple-500 outline-none font-medium"
              placeholder="0,00 $"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
            {t('disability_insurance')}
          </label>
          <div className="relative group">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-purple-500 transition-colors">
                <Zap className="w-3 h-3" />
              </div>
            <input
              type="number"
              value={benefits.disability || ''}
              onChange={(e) => handleUpdate('disability', parseFloat(e.target.value) || 0)}
              className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-purple-500 outline-none font-medium"
              placeholder="0,00 $"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-purple-50/30 rounded-lg border border-purple-100">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${benefits.isDisabilityEmployerPaid ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">
              {t('employer_paid_disability')}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">
              {t('taxable_disability_note')}
            </p>
          </div>
        </div>
        <button
          onClick={() => handleUpdate('isDisabilityEmployerPaid', !benefits.isDisabilityEmployerPaid)}
          className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${
            benefits.isDisabilityEmployerPaid ? 'bg-purple-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
              benefits.isDisabilityEmployerPaid ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
