/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RemittancePeriodData, generateTPZ1015PDF } from '../lib/pdfRemittance';
import { formatCurrency } from '../lib/utils';
import { useLanguage } from './LanguageContext';
import { Download, Printer } from 'lucide-react';

interface TPZ1015FormViewProps {
  data: RemittancePeriodData;
}

export const TPZ1015FormView: React.FC<TPZ1015FormViewProps> = ({ data }) => {
  const { language, t } = useLanguage();
  const isFr = language === 'fr';

  const handleDownloadPDF = () => {
    const doc = generateTPZ1015PDF(data, language);
    doc.save(`TPZ1015_${data.neq || 'RQ'}_${data.periodEndDate}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-bold text-xs">
            RQ
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {isFr ? 'Formulaire TPZ-1015.R.14.2-V - Bordereau de paiement' : 'Form TPZ-1015.R.14.2-V - Source Deductions Remittance'}
            </h3>
            <p className="text-xs text-gray-500">
              {isFr ? 'Bordereau de paiement des retenues à la source et cotisations de l\'employeur (Revenu Québec)' : 'Remittance of source deductions and employer contributions (Revenu Québec)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {t('print_form')}
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-200 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('export_tpz_btn')}
          </button>
        </div>
      </div>

      {/* Realistic Visual Form Simulation Container */}
      <div className="bg-white border-2 border-blue-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto font-sans text-slate-800">
        {/* Revenu Québec Official Banner */}
        <div className="border-b-2 border-blue-700 pb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-blue-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
              ⚜
            </div>
            <div>
              <h2 className="text-lg font-black text-blue-900 uppercase tracking-tight">
                Revenu Québec
              </h2>
              <p className="text-[10px] text-gray-500">Gouvernement du Québec</p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 bg-blue-700 text-white text-xs font-mono font-bold rounded">
              TPZ-1015.R.14.2-V (2026)
            </span>
            <p className="text-[10px] text-gray-400 mt-1">revenuquebec.ca</p>
          </div>
        </div>

        {/* Section 1: Employer and Period Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-blue-100 bg-blue-50/30 p-4 rounded-md space-y-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isFr ? 'Nom ou raison sociale de l\'employeur :' : 'Employer Legal Name:'}
              </p>
              <p className="text-sm font-bold text-slate-900">{data.companyName || 'Mon Entreprise Inc.'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isFr ? 'Numéro d\'identification / NEQ :' : 'Identification Number (NEQ / ID):'}
              </p>
              <p className="text-sm font-mono font-bold text-blue-800 bg-blue-100/60 px-2 py-0.5 rounded inline-block border border-blue-300">
                {data.neq || '1234567890 RS 0001'}
              </p>
            </div>
          </div>

          <div className="border border-blue-100 bg-blue-50/30 p-4 rounded-md space-y-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isFr ? 'Fin de période de paie visée :' : 'Period Ending Date:'}
              </p>
              <p className="text-sm font-bold text-slate-900">{data.periodLabel} ({data.periodEndDate})</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                {isFr ? 'Date limite du versement :' : 'Payment Due Date:'}
              </p>
              <p className="text-sm font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded inline-block border border-rose-200">
                {data.paymentDueDate}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Case A and Case B */}
        <div className="grid grid-cols-2 gap-4 bg-slate-100 p-3 rounded-md border border-slate-200">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {isFr ? 'Case A - Nombre d\'employés rémunérés :' : 'Box A - Employees Paid:'}
            </p>
            <p className="text-base font-black text-slate-800">{data.employeeCount}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {isFr ? 'Case B - Rémunération brute assujettie :' : 'Box B - Insurable / Gross Payroll:'}
            </p>
            <p className="text-base font-black text-slate-800">{formatCurrency(data.grossPayroll)}</p>
          </div>
        </div>

        {/* Section 3: Revenu Québec Official Calculation Lines */}
        <div className="border border-slate-300 rounded-md overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-blue-800 text-white font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Ligne officielle / Description</th>
                <th className="p-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="hover:bg-blue-50/20">
                <td className="p-3 font-medium text-slate-800">
                  <span className="font-bold text-blue-900 mr-2">Ligne 1.</span>
                  {isFr ? 'Impôt du Québec retenu à la source' : 'Quebec income tax withheld at source'}
                </td>
                <td className="p-3 text-right font-mono font-bold text-slate-800">
                  {formatCurrency(data.quebecTaxWithheld)}
                </td>
              </tr>
              <tr className="hover:bg-blue-50/20">
                <td className="p-3 text-slate-700">
                  <div className="font-semibold text-slate-900">
                    <span className="font-bold text-blue-900 mr-2">Ligne 2.</span>
                    {isFr ? 'Cotisations au Régime de rentes du Québec (RRQ)' : 'Quebec Pension Plan (QPP) contributions'}
                  </div>
                  <div className="text-[11px] text-slate-500 pl-6 mt-0.5">
                    {isFr ? `Part employé : ${formatCurrency(data.employeeQPP)} + Part employeur (100%) : ${formatCurrency(data.employerQPP)}` : `Employee: ${formatCurrency(data.employeeQPP)} + Employer (100%): ${formatCurrency(data.employerQPP)}`}
                  </div>
                </td>
                <td className="p-3 text-right font-mono font-bold text-slate-700">
                  {formatCurrency(data.totalQPP)}
                </td>
              </tr>
              <tr className="hover:bg-blue-50/20">
                <td className="p-3 text-slate-700">
                  <div className="font-semibold text-slate-900">
                    <span className="font-bold text-blue-900 mr-2">Ligne 3.</span>
                    {isFr ? 'Primes au Régime québécois d\'assurance parentale (RQAP)' : 'Quebec Parental Insurance Plan (QPIP) premiums'}
                  </div>
                  <div className="text-[11px] text-slate-500 pl-6 mt-0.5">
                    {isFr ? `Part employé (0.430%) : ${formatCurrency(data.employeeQPIP)} + Part employeur (0.602%) : ${formatCurrency(data.employerQPIP)}` : `Employee (0.430%): ${formatCurrency(data.employeeQPIP)} + Employer (0.602%): ${formatCurrency(data.employerQPIP)}`}
                  </div>
                </td>
                <td className="p-3 text-right font-mono font-bold text-slate-700">
                  {formatCurrency(data.totalQPIP)}
                </td>
              </tr>
              <tr className="hover:bg-blue-50/20">
                <td className="p-3 text-slate-700">
                  <span className="font-bold text-blue-900 mr-2">Ligne 4.</span>
                  {isFr ? 'Cotisation au Fonds des services de santé (FSS)' : 'Health Services Fund (HSF/FSS) contribution'}
                </td>
                <td className="p-3 text-right font-mono text-slate-700">
                  {formatCurrency(data.hsfAmount)}
                </td>
              </tr>
              <tr className="hover:bg-blue-50/20">
                <td className="p-3 text-slate-700">
                  <span className="font-bold text-blue-900 mr-2">Ligne 5.</span>
                  {isFr ? 'Cotisation relative aux normes du travail (CNESST - 0.06%)' : 'Labour Standards contribution (CNESST - 0.06%)'}
                </td>
                <td className="p-3 text-right font-mono text-slate-700">
                  {formatCurrency(data.labourStandardsAmount)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-emerald-50 border-t-2 border-emerald-400 text-emerald-950">
              <tr>
                <td className="p-4 font-black uppercase text-xs">
                  {isFr ? 'TOTAL DU VERSEMENT À REVENU QUÉBEC (LIGNES 1 À 5)' : 'TOTAL REMITTANCE TO REVENU QUÉBEC (LINES 1 TO 5)'}
                  <p className="text-[10px] font-normal text-emerald-800 normal-case mt-0.5">
                    {isFr ? 'Comprend impôt du Québec, RRQ total, RQAP total, FSS et Normes du travail' : 'Includes Quebec tax, total QPP, total QPIP, HSF, and Labour standards'}
                  </p>
                </td>
                <td className="p-4 text-right font-mono font-black text-lg text-emerald-700">
                  {formatCurrency(data.totalQuebecRemittance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Section 4: Detachable Coupon */}
        <div className="pt-6 border-t-2 border-dashed border-slate-300 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <span>✂</span> {isFr ? 'Coupon de versement détachable (Revenu Québec)' : 'Detachable Remittance Stub (Revenu Québec)'}
          </div>

          <div className="bg-sky-50/60 border border-sky-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase">
                  {isFr ? 'Bordereau de paiement - TPZ-1015.R.14.2-V' : 'Remittance Slip - TPZ-1015.R.14.2-V'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isFr ? 'Payable à l\'ordre du ministre du Revenu du Québec' : 'Payable to Ministre du Revenu du Québec'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Montant total versé</p>
                <p className="text-base font-mono font-bold text-blue-800">{formatCurrency(data.totalQuebecRemittance)}</p>
              </div>
            </div>

            <div className="font-mono text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-200 overflow-x-auto tracking-wider">
              {`>1015142> ${(data.neq || '1234567890RS0001').replace(/\s+/g, '')}  ${data.periodEndDate.replace(/-/g, '')}  ${Math.round(data.totalQuebecRemittance * 100).toString().padStart(10, '0')}<`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
