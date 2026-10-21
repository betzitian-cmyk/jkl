/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EmployeeTaxSlipData } from '../lib/taxSlips';
import { formatCurrency } from '../lib/utils';
import { generateT4SlipPDF, generateRL1SlipPDF } from '../lib/pdfTaxSlips';
import { 
  FileText, 
  Download, 
  X, 
  Printer, 
  User, 
  Building2, 
  Landmark, 
  CheckCircle2,
  HelpCircle,
  Eye
} from 'lucide-react';
import { useLanguage } from './LanguageContext';

interface TaxSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  slipData: EmployeeTaxSlipData | null;
  initialType?: 't4' | 'rl1';
}

export const TaxSlipModal: React.FC<TaxSlipModalProps> = ({
  isOpen,
  onClose,
  slipData,
  initialType = 't4'
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const [activeSlip, setActiveSlip] = useState<'t4' | 'rl1'>(initialType);

  if (!isOpen || !slipData) return null;

  const emp = slipData.employee;
  const t4 = slipData.t4;
  const rl1 = slipData.rl1;

  const handleDownloadPDF = () => {
    if (activeSlip === 't4') {
      const doc = generateT4SlipPDF(slipData, language);
      doc.save(`T4_${slipData.year}_${emp.lastName}_${emp.firstName}.pdf`);
    } else {
      const doc = generateRL1SlipPDF(slipData, language);
      doc.save(`RL1_${slipData.year}_${emp.lastName}_${emp.firstName}.pdf`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">
                  {isFr ? 'Feuillet Fiscal Provisoire de Fin d\'Année' : 'Provisional Year-End Tax Slip'}
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {slipData.year}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {emp.firstName} {emp.lastName} &bull; {emp.sin || '000-000-000'} &bull; {slipData.stubCount} {isFr ? 'paies compilées' : 'stubs compiled'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isFr ? `Télécharger ${activeSlip.toUpperCase()} (PDF)` : `Download ${activeSlip.toUpperCase()} (PDF)`}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-header Tab Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSlip('t4')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSlip === 't4'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Landmark className="w-4 h-4 text-rose-600" />
              <span>{isFr ? 'Feuillet T4 (ARC / Fédéral)' : 'T4 Slip (CRA / Federal)'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSlip('rl1')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeSlip === 'rl1'
                  ? 'bg-white text-blue-800 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-700" />
              <span>{isFr ? 'Relevé 1 (RL-1 / Revenu Québec)' : 'RL-1 Slip (Revenu Québec)'}</span>
            </button>
          </div>

          <span className="text-[11px] font-medium text-slate-500 italic">
            {isFr ? 'Bordereau officiel prescrit pour audit d\'employeur' : 'Official slip format for employer audit'}
          </span>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">

          {/* Employer / Employee Information Header Banner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {isFr ? "Nom et numéro de l'employeur" : "Employer Name & Account"}
              </span>
              <p className="text-sm font-bold text-slate-900">{t4.employerName || 'Entreprise Démo Inc.'}</p>
              <p className="text-xs font-mono text-slate-600 mt-0.5">
                {activeSlip === 't4' ? `NE / BN: ${t4.employerBn}` : `NEQ: ${rl1.employerNeq}`}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                {isFr ? "Nom et adresse de l'employé" : "Employee Name & Address"}
              </span>
              <p className="text-sm font-bold text-slate-900">{emp.firstName} {emp.lastName}</p>
              <p className="text-xs text-slate-600 mt-0.5">{emp.address || 'Montréal, QC'}</p>
              <p className="text-xs font-mono text-slate-700 font-bold mt-0.5">NAS / SIN: {emp.sin || '000-000-000'}</p>
            </div>
          </div>

          {/* T4 View */}
          {activeSlip === 't4' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-rose-600" />
                  <span>{isFr ? 'Cases officielles du Feuillet T4' : 'Official T4 Statement Boxes'}</span>
                </h4>
                <span className="text-xs font-semibold text-slate-500">
                  {isFr ? 'Province d\'emploi :' : 'Province of employment:'} <strong className="text-slate-800">QC</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                
                {/* Box 14 */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-black">Case 14</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{isFr ? 'Revenus d\'emploi' : 'Employment Income'}</span>
                  </div>
                  <p className="text-lg font-black text-slate-900">{formatCurrency(t4.box14_employmentIncome)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Salaire brut annuel imposable' : 'Total annual gross pay'}</p>
                </div>

                {/* Box 22 */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black">Case 22</span>
                    <span className="text-[10px] text-rose-600 font-bold uppercase">{isFr ? 'Impôt fédéral' : 'Federal Tax'}</span>
                  </div>
                  <p className="text-lg font-black text-rose-700">{formatCurrency(t4.box22_incomeTaxDeducted)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Retenu pour l\'ARC' : 'Withheld for CRA'}</p>
                </div>

                {/* Box 16 */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-black">Case 16</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">RPC / RRQ</span>
                  </div>
                  <p className="text-lg font-black text-slate-800">{formatCurrency(t4.box16_employeeCppQpp)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Cotisations de l\'employé' : 'Employee contributions'}</p>
                </div>

                {/* Box 18 */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-black">Case 18</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Assurance-Emploi</span>
                  </div>
                  <p className="text-lg font-black text-slate-800">{formatCurrency(t4.box18_employeeEi)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Cotisations AE retenues' : 'EI premiums deducted'}</p>
                </div>

                {/* Box 24 */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-black">Case 24</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{isFr ? 'Gains assurables AE' : 'EI Insurable'}</span>
                  </div>
                  <p className="text-lg font-bold text-slate-700">{formatCurrency(t4.box24_eiInsurableEarnings)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Plafonné au MGA de l\'AE' : 'Capped at EI maximum'}</p>
                </div>

                {/* Box 26 */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-black">Case 26</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{isFr ? 'Gains pensionnables' : 'QPP Pensionable'}</span>
                  </div>
                  <p className="text-lg font-bold text-slate-700">{formatCurrency(t4.box26_cppQppPensionableEarnings)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Plafonné au MGA RRQ' : 'Capped at QPP MGA'}</p>
                </div>

                {/* Box 20 / 52 */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-black">Case 20 / 52</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">RPA / RVER / PA</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(t4.box20_rppContributions)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'REER collectif avant impôt' : 'Pre-tax Group RRSP'}</p>
                </div>

                {/* Box 85 */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-black">Case 85</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{isFr ? 'Soins médicaux' : 'Health Premiums'}</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(t4.box85_employeePaidHealthPremiums)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Primes santé après impôt' : 'Post-tax health premiums'}</p>
                </div>

              </div>
            </div>
          )}

          {/* RL-1 View */}
          {activeSlip === 'rl1' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-700" />
                  <span>{isFr ? 'Cases officielles du Relevé 1 (RL-1)' : 'Official RL-1 Statement Boxes'}</span>
                </h4>
                <span className="text-xs font-semibold text-blue-700">Revenu Québec</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                
                {/* Box A */}
                <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blue-700 text-white rounded text-[10px] font-black">Case A</span>
                    <span className="text-[10px] text-blue-800 font-bold uppercase">{isFr ? 'Revenus d\'emploi' : 'Employment Income'}</span>
                  </div>
                  <p className="text-lg font-black text-blue-950">{formatCurrency(rl1.boxA_employmentIncome)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Rémunération brute globale' : 'Total gross remuneration'}</p>
                </div>

                {/* Box E */}
                <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black">Case E</span>
                    <span className="text-[10px] text-rose-700 font-bold uppercase">{isFr ? 'Impôt du Québec' : 'Quebec Tax'}</span>
                  </div>
                  <p className="text-lg font-black text-rose-700">{formatCurrency(rl1.boxE_quebecTaxDeducted)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Impôt provincial retenu' : 'Provincial tax deducted'}</p>
                </div>

                {/* Box B */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-black">Case B</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Cotisation RRQ</span>
                  </div>
                  <p className="text-lg font-black text-slate-800">{formatCurrency(rl1.boxB_qppContribution)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Régime des rentes du Québec' : 'Quebec Pension Plan'}</p>
                </div>

                {/* Box H */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-black">Case H</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Cotisation RQAP</span>
                  </div>
                  <p className="text-lg font-black text-slate-800">{formatCurrency(rl1.boxH_qpipPremium)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Assurance parentale' : 'Parental insurance'}</p>
                </div>

                {/* Box G */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-black">Case G</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{isFr ? 'Gains RRQ' : 'QPP Pensionable'}</span>
                  </div>
                  <p className="text-lg font-bold text-slate-700">{formatCurrency(rl1.boxG_qppPensionableEarnings)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Salaire admissible au RRQ' : 'QPP eligible earnings'}</p>
                </div>

                {/* Box I */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-[10px] font-black">Case I</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{isFr ? 'Gains RQAP' : 'QPIP Eligible'}</span>
                  </div>
                  <p className="text-lg font-bold text-slate-700">{formatCurrency(rl1.boxI_qpipEligibleEarnings)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Salaire admissible au RQAP' : 'QPIP eligible earnings'}</p>
                </div>

                {/* Box J */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-black">Case J</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{isFr ? 'Assurance Maladie' : 'Private Health'}</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(rl1.boxJ_privateHealthInsuranceEmployer)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Avantage imposable patronal' : 'Employer taxable benefit'}</p>
                </div>

                {/* Box C */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-slate-800 text-white rounded text-[10px] font-black">Case C</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">AE / EI</span>
                  </div>
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(rl1.boxC_eiPremium)}</p>
                  <p className="text-[10px] text-slate-500">{isFr ? 'Cotisations assurance-emploi' : 'EI deductions'}</p>
                </div>

              </div>
            </div>
          )}

          {/* Aggregated Raw Figures Checklist */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
              {isFr ? 'Sommaire des flux annuels de cet employé :' : 'Annual cashflow summary for this employee:'}
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">{isFr ? 'Brut Total' : 'Gross Total'}</span>
                <span className="font-bold text-slate-800">{formatCurrency(slipData.rawTotals.gross)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">{isFr ? 'Net Payé' : 'Net Paid'}</span>
                <span className="font-bold text-emerald-700">{formatCurrency(slipData.rawTotals.net)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">{isFr ? 'Part Patronale RRQ' : 'Employer QPP'}</span>
                <span className="font-bold text-slate-700">{formatCurrency(slipData.rawTotals.employerQpp)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[9px] uppercase">{isFr ? 'Cotisation FSS/HSF' : 'Employer HSF'}</span>
                <span className="font-bold text-slate-700">{formatCurrency(slipData.rawTotals.hsf)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {isFr ? 'Généré conformément aux tables de retenues fédérales et québécoises.' : 'Generated per CRA and Revenu Québec statutory tables.'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isFr ? 'Fermer' : 'Close'}
          </button>
        </div>

      </div>
    </div>
  );
};
