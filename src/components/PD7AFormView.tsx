/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RemittancePeriodData, generatePD7APDF } from '../lib/pdfRemittance';
import { formatCurrency } from '../lib/utils';
import { useLanguage } from './LanguageContext';
import { Download, Printer, ShieldCheck, HelpCircle } from 'lucide-react';

interface PD7AFormViewProps {
  data: RemittancePeriodData;
}

export const PD7AFormView: React.FC<PD7AFormViewProps> = ({ data }) => {
  const { language, t } = useLanguage();
  const isFr = language === 'fr';

  const handleDownloadPDF = () => {
    const doc = generatePD7APDF(data, language);
    doc.save(`PD7A_${data.federalId || 'CRA'}_${data.periodEndDate}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            ARC
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              {isFr ? 'Formulaire PD7A - Relevé de compte pour les retenues sur la paie' : 'Form PD7A - Statement of Account for Current Source Deductions'}
            </h3>
            <p className="text-xs text-gray-500">
              {isFr ? 'Déclaration périodique prescrite pour l\'Agence du revenu du Canada (ARC)' : 'Official periodic remittance return for Canada Revenue Agency (CRA)'}
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
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-md shadow-slate-200 transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('export_pd7a_btn')}
          </button>
        </div>
      </div>

      {/* Realistic Visual Form Simulation Container */}
      <div className="bg-white border-2 border-slate-300 rounded-lg p-6 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto font-sans text-slate-800">
        {/* CRA Banner */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">
              {isFr ? 'Gouvernement du Canada' : 'Government of Canada'}
            </span>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              {isFr ? 'Agence du revenu du Canada' : 'Canada Revenue Agency'}
            </h2>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 bg-slate-900 text-white text-xs font-mono font-bold rounded">
              PD7A (2026)
            </span>
            <p className="text-[10px] text-gray-400 mt-1">canada.ca/payroll</p>
          </div>
        </div>

        {/* Section 1: Employer and Period Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-md space-y-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isFr ? 'Nom de l\'employeur :' : 'Employer Name:'}
              </p>
              <p className="text-sm font-bold text-slate-900">{data.companyName || 'Mon Entreprise Inc.'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isFr ? 'Numéro de compte de paie (NE / BN) :' : 'Payroll Account Number (BN):'}
              </p>
              <p className="text-sm font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded inline-block border border-sky-200">
                {data.federalId || '123456789 RP 0001'}
              </p>
            </div>
          </div>

          <div className="border border-slate-200 bg-slate-50/50 p-4 rounded-md space-y-3">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {isFr ? 'Fin de la période de paie visée :' : 'Remittance Period End Date:'}
              </p>
              <p className="text-sm font-bold text-slate-900">{data.periodLabel} ({data.periodEndDate})</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">
                {isFr ? 'Date limite de paiement :' : 'Payment Due Date:'}
              </p>
              <p className="text-sm font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded inline-block border border-rose-200">
                {data.paymentDueDate}
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Key Operational Metrics */}
        <div className="grid grid-cols-2 gap-4 bg-slate-100 p-3 rounded-md border border-slate-200">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {isFr ? 'Nombre d\'employés rémunérés :' : 'Employees Paid in Period:'}
            </p>
            <p className="text-base font-black text-slate-800">{data.employeeCount}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              {isFr ? 'Masse salariale brute totale :' : 'Gross Remuneration Paid:'}
            </p>
            <p className="text-base font-black text-slate-800">{formatCurrency(data.grossPayroll)}</p>
          </div>
        </div>

        {/* Section 3: Federal Remittance Lines Table */}
        <div className="border border-slate-300 rounded-md overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-white font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Ligne / Description</th>
                <th className="p-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-800">
                  <span className="font-bold text-slate-900 mr-2">1.</span>
                  {isFr ? 'Impôt sur le revenu fédéral retenu aux employés' : 'Federal income tax withheld from employees'}
                </td>
                <td className="p-3 text-right font-mono font-bold text-slate-800">
                  {formatCurrency(data.federalTaxWithheld)}
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 text-slate-700">
                  <span className="font-bold text-slate-900 mr-2">2.</span>
                  {isFr ? 'Cotisations de l\'employé à l\'assurance-emploi (AE - Taux QC 1.30%)' : 'Employee Employment Insurance (EI - QC Rate 1.30%)'}
                </td>
                <td className="p-3 text-right font-mono text-slate-700">
                  {formatCurrency(data.employeeEI)}
                </td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="p-3 text-slate-700">
                  <span className="font-bold text-slate-900 mr-2">3.</span>
                  {isFr ? 'Cotisations patronales à l\'assurance-emploi (Part employeur = 1.4 × employé)' : 'Employer Employment Insurance (Employer portion = 1.4 × employee)'}
                </td>
                <td className="p-3 text-right font-mono text-slate-700">
                  {formatCurrency(data.employerEI)}
                </td>
              </tr>
              <tr className="bg-slate-50/70 font-semibold">
                <td className="p-3 text-slate-900">
                  <span className="font-bold mr-2">4.</span>
                  {isFr ? 'Total des cotisations d\'assurance-emploi à verser (Lignes 2 + 3)' : 'Total Employment Insurance to remit (Lines 2 + 3)'}
                </td>
                <td className="p-3 text-right font-mono text-slate-900">
                  {formatCurrency(data.totalEI)}
                </td>
              </tr>
              <tr className="hover:bg-slate-50 text-slate-400">
                <td className="p-3 italic">
                  <span className="font-bold mr-2">5.</span>
                  {isFr ? 'Régime de pensions du Canada (RPC / CPP) [Non assujetti au QC]' : 'Canada Pension Plan (CPP) [Subject to QPP in Quebec]'}
                </td>
                <td className="p-3 text-right font-mono">
                  $0.00
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-blue-50 border-t-2 border-blue-400 text-blue-900">
              <tr>
                <td className="p-4 font-black uppercase text-xs">
                  {isFr ? 'TOTAL DU VERSEMENT À L\'ARC (RECEVEUR GÉNÉRAL DU CANADA)' : 'TOTAL CURRENT REMITTANCE (RECEIVER GENERAL FOR CANADA)'}
                  <p className="text-[10px] font-normal text-slate-500 normal-case mt-0.5">
                    {isFr ? 'Total de l\'impôt fédéral + Assurance-Emploi globale' : 'Total Federal Tax + Total Employment Insurance'}
                  </p>
                </td>
                <td className="p-4 text-right font-mono font-black text-lg text-blue-700">
                  {formatCurrency(data.totalFederalRemittance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Section 4: Remittance Voucher / Tear-off Stub */}
        <div className="pt-6 border-t-2 border-dashed border-slate-300 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <span>✂</span> {isFr ? 'Coupon de versement détachable' : 'Detachable Remittance Voucher'}
          </div>

          <div className="bg-amber-50/50 border border-amber-200 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase">
                  {isFr ? 'Pièce de versement - Formulaire PD7A' : 'Remittance Voucher - Form PD7A'}
                </p>
                <p className="text-[10px] text-slate-500">
                  {isFr ? 'Payable à l\'ordre du Receveur général du Canada' : 'Payable to Receiver General for Canada'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase">Montant inscrit</p>
                <p className="text-base font-mono font-bold text-slate-900">{formatCurrency(data.totalFederalRemittance)}</p>
              </div>
            </div>

            <div className="font-mono text-[10px] text-slate-500 bg-white p-2 rounded border border-slate-200 overflow-x-auto tracking-wider">
              {`A01  ${(data.federalId || '123456789RP0001').replace(/\s+/g, '')}  ${data.periodEndDate.replace(/-/g, '')}  ${Math.round(data.totalFederalRemittance * 100).toString().padStart(10, '0')}  CRA-PD7A`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
