/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { PayStub, Employee } from '../types';
import { formatCurrency } from '../lib/utils';
import { useLanguage } from './LanguageContext';
import { 
  EmployeeTaxSlipData, 
  YearEndSummaryTotals, 
  calculateEmployeeTaxSlip, 
  calculateYearEndSummary 
} from '../lib/taxSlips';
import { 
  generateT4SlipPDF, 
  generateRL1SlipPDF, 
  generateYearEndSummaryPDF 
} from '../lib/pdfTaxSlips';
import { TaxSlipModal } from './TaxSlipModal';
import { 
  FileText, 
  Download, 
  Building2, 
  Landmark, 
  Eye, 
  Users, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Calendar,
  Sparkles,
  TrendingUp,
  FileCheck
} from 'lucide-react';

interface YearEndProcessingModuleProps {
  stubs: PayStub[];
  employees: Employee[];
  companySettings: {
    companyName?: string;
    federalId?: string;
    neq?: string;
  };
  fiscalYear?: number;
}

export const YearEndProcessingModule: React.FC<YearEndProcessingModuleProps> = ({
  stubs,
  employees,
  companySettings,
  fiscalYear = 2026
}) => {
  const { language, t } = useLanguage();
  const isFr = language === 'fr';

  // Available tax years in stubs or defaults
  const availableYears = useMemo(() => {
    const set = new Set<string>(['2024', '2025', '2026']);
    stubs.forEach(s => {
      if (s.date && s.date.length >= 4) {
        set.add(s.date.substring(0, 4));
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [stubs]);

  const [selectedYear, setSelectedYear] = useState<string>(String(fiscalYear));
  const yearNum = parseInt(selectedYear, 10) || 2026;

  const resolvedCompany = useMemo(() => ({
    companyName: companySettings.companyName || 'Mon Entreprise Inc.',
    federalId: companySettings.federalId || '123456789 RP 0001',
    neq: companySettings.neq || '1234567890 RS 0001'
  }), [companySettings]);

  // Generate tax slips for all employees
  const employeeTaxSlips: EmployeeTaxSlipData[] = useMemo(() => {
    return employees.map(emp => 
      calculateEmployeeTaxSlip(emp, stubs, yearNum, resolvedCompany)
    );
  }, [employees, stubs, yearNum, resolvedCompany]);

  // Aggregated year-end totals for T4 and RL-1 Summary (RLZ-1.S)
  const summaryTotals: YearEndSummaryTotals = useMemo(() => {
    return calculateYearEndSummary(employeeTaxSlips, yearNum);
  }, [employeeTaxSlips, yearNum]);

  // Filter or search
  const [searchTerm, setSearchTerm] = useState('');
  const filteredSlips = useMemo(() => {
    if (!searchTerm.trim()) return employeeTaxSlips;
    const term = searchTerm.toLowerCase();
    return employeeTaxSlips.filter(s => 
      s.employee.firstName.toLowerCase().includes(term) ||
      s.employee.lastName.toLowerCase().includes(term) ||
      (s.employee.sin && s.employee.sin.includes(term))
    );
  }, [employeeTaxSlips, searchTerm]);

  // Modal inspection
  const [selectedSlipForModal, setSelectedSlipForModal] = useState<EmployeeTaxSlipData | null>(null);
  const [modalInitialType, setModalInitialType] = useState<'t4' | 'rl1'>('t4');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const openSlipModal = (slip: EmployeeTaxSlipData, type: 't4' | 'rl1') => {
    setSelectedSlipForModal(slip);
    setModalInitialType(type);
    setIsModalOpen(true);
  };

  const handleDownloadAllT4 = () => {
    employeeTaxSlips.forEach(slip => {
      if (slip.rawTotals.gross > 0) {
        const doc = generateT4SlipPDF(slip, language);
        doc.save(`T4_${yearNum}_${slip.employee.lastName}_${slip.employee.firstName}.pdf`);
      }
    });
  };

  const handleDownloadAllRL1 = () => {
    employeeTaxSlips.forEach(slip => {
      if (slip.rawTotals.gross > 0) {
        const doc = generateRL1SlipPDF(slip, language);
        doc.save(`RL1_${yearNum}_${slip.employee.lastName}_${slip.employee.firstName}.pdf`);
      }
    });
  };

  const handleDownloadGrandSummary = () => {
    const doc = generateYearEndSummaryPDF(summaryTotals, employeeTaxSlips, resolvedCompany, language);
    doc.save(`Sommaire_Fin_Annee_${yearNum}_T4_RL1.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Year-End Control Header */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isFr ? 'Module de Fin d\'Année Fiscale (T4 & Relevé 1)' : 'Year-End Tax Processing Module (T4 & RL-1)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isFr 
                  ? 'Agrégation annuelle des salaires, déductions et génération des feuillets fiscaux prescrits.'
                  : 'Annual aggregation of earnings, statutory deductions, and tax slips generation.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tax Year Selector */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-600">
              {isFr ? 'Année :' : 'Year:'}
            </span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-900 outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Grand Summary Export Button */}
          <button
            onClick={handleDownloadGrandSummary}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            title={isFr ? 'Télécharger le rapport de sommaire annuel' : 'Download grand year-end summary PDF'}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isFr ? 'Sommaire Annuel (PDF)' : 'Annual Summary (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* Aggregate KPI Summary Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Annual Payroll Gross & Count */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-xl shadow-sm space-y-3">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span className="font-bold uppercase tracking-wider text-[10px]">
              {isFr ? 'Masse Salariale Cumulée' : 'Gross Annual Payroll'}
            </span>
            <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-300">
              {summaryTotals.employeeCount} {isFr ? 'employés' : 'employees'}
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-white">{formatCurrency(summaryTotals.totalGrossPayroll)}</p>
            <p className="text-xs text-slate-300 mt-1">
              {isFr ? 'Net total distribué :' : 'Total net distributed:'} <strong className="text-emerald-400 font-mono">{formatCurrency(summaryTotals.totalNetPayroll)}</strong>
            </p>
          </div>
          <div className="pt-2 border-t border-slate-700/60 text-[10px] text-slate-400 flex items-center justify-between">
            <span>{isFr ? 'Exercice fiscal' : 'Tax Year'} : <strong>{selectedYear}</strong></span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {isFr ? 'Compilé' : 'Compiled'}
            </span>
          </div>
        </div>

        {/* Card 2: Federal T4 Summary Total */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-rose-950 text-white p-5 rounded-xl shadow-sm space-y-3">
          <div className="flex justify-between items-center text-rose-200 text-xs">
            <div className="flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-bold uppercase tracking-wider text-[10px]">
                {isFr ? 'Sommaire T4 (ARC / Fédéral)' : 'T4 Summary (CRA)'}
              </span>
            </div>
            <button
              onClick={handleDownloadAllT4}
              className="text-[10px] font-bold text-rose-300 hover:text-white flex items-center gap-1 hover:underline"
              title="Exporter tous les T4"
            >
              <Download className="w-3 h-3" /> {isFr ? 'Tous T4' : 'All T4'}
            </button>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-100">{formatCurrency(summaryTotals.t4Summary.totalRemittanceFederal)}</p>
            <p className="text-xs text-slate-300 mt-1">
              Impôt Féd. (Case 22): {formatCurrency(summaryTotals.t4Summary.totalBox22_federalIncomeTax)} &bull; AE: {formatCurrency(summaryTotals.t4Summary.totalBox18_employeeEi + summaryTotals.t4Summary.totalEmployerEi)}
            </p>
          </div>
          <div className="pt-2 border-t border-rose-900/40 text-[10px] text-slate-400 flex items-center justify-between">
            <span>{isFr ? 'Case 14 Totale :' : 'Total Box 14:'} <strong className="text-white font-mono">{formatCurrency(summaryTotals.t4Summary.totalBox14_employmentIncome)}</strong></span>
            <span className="font-mono text-slate-400 text-[9px]">{resolvedCompany.federalId}</span>
          </div>
        </div>

        {/* Card 3: Revenu Québec RL-1 Summary Total */}
        <div className="bg-gradient-to-br from-blue-900 via-indigo-950 to-blue-950 text-white p-5 rounded-xl shadow-sm space-y-3">
          <div className="flex justify-between items-center text-blue-200 text-xs">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-bold uppercase tracking-wider text-[10px]">
                {isFr ? 'Sommaire 1 (Revenu Québec)' : 'RL-1 Summary (Revenu QC)'}
              </span>
            </div>
            <button
              onClick={handleDownloadAllRL1}
              className="text-[10px] font-bold text-yellow-300 hover:text-white flex items-center gap-1 hover:underline"
              title="Exporter tous les RL-1"
            >
              <Download className="w-3 h-3" /> {isFr ? 'Tous RL-1' : 'All RL-1'}
            </button>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-100">{formatCurrency(summaryTotals.rl1Summary.totalRemittanceQuebec)}</p>
            <p className="text-xs text-blue-200 mt-1">
              Impôt QC (Case E): {formatCurrency(summaryTotals.rl1Summary.totalBoxE_quebecTax)} &bull; RRQ: {formatCurrency(summaryTotals.rl1Summary.totalBoxB_qpp + summaryTotals.rl1Summary.totalEmployerQpp)}
            </p>
          </div>
          <div className="pt-2 border-t border-blue-800/40 text-[10px] text-blue-300 flex items-center justify-between">
            <span>{isFr ? 'Case A Totale :' : 'Total Box A:'} <strong className="text-white font-mono">{formatCurrency(summaryTotals.rl1Summary.totalBoxA_employmentIncome)}</strong></span>
            <span className="font-mono text-blue-300 text-[9px]">{resolvedCompany.neq}</span>
          </div>
        </div>

      </div>

      {/* Employee Annual Slips Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        
        {/* Table Header Controls */}
        <div className="p-4 bg-slate-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {isFr ? 'Feuillets Fiscaux Individuels par Employé' : 'Individual Employee Tax Slips'}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isFr 
                ? 'Cliquez sur Aperçu pour inspecter le T4 / Relevé 1 ou télécharger directement le PDF officiel.'
                : 'Click Preview to inspect T4 / RL-1 boxes or download official draft PDFs.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={isFr ? 'Filtrer un employé...' : 'Filter an employee...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-500 w-48 font-medium"
            />
          </div>
        </div>

        {/* Slips Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/70 border-b border-gray-200">
              <tr className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5">{isFr ? 'Employé / NAS' : 'Employee / SIN'}</th>
                <th className="px-4 py-3.5 text-right">{isFr ? 'Revenu Brut (14 / A)' : 'Gross (14 / A)'}</th>
                <th className="px-4 py-3.5 text-right text-rose-700">{isFr ? 'Impôt Féd. (22)' : 'Fed Tax (22)'}</th>
                <th className="px-4 py-3.5 text-right text-blue-700">{isFr ? 'Impôt QC (E)' : 'QC Tax (E)'}</th>
                <th className="px-4 py-3.5 text-right">{isFr ? 'RRQ (16 / B)' : 'QPP (16 / B)'}</th>
                <th className="px-4 py-3.5 text-right">{isFr ? 'RQAP (H)' : 'QPIP (H)'}</th>
                <th className="px-4 py-3.5 text-right">{isFr ? 'AE (18 / C)' : 'EI (18 / C)'}</th>
                <th className="px-5 py-3.5 text-right">{isFr ? 'Actions Feuillets' : 'Slip Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs font-medium">
              {filteredSlips.map(slip => {
                const emp = slip.employee;
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors group">
                    
                    {/* Employee info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{emp.firstName} {emp.lastName}</p>
                          <p className="text-[10px] font-mono text-slate-400">
                            NAS: {emp.sin || '000-000-000'} &bull; {slip.stubCount} {isFr ? 'paies' : 'pays'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Gross */}
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(slip.t4.box14_employmentIncome)}
                    </td>

                    {/* Fed Tax */}
                    <td className="px-4 py-3.5 text-right font-bold text-rose-700 font-mono">
                      {formatCurrency(slip.t4.box22_incomeTaxDeducted)}
                    </td>

                    {/* QC Tax */}
                    <td className="px-4 py-3.5 text-right font-bold text-blue-700 font-mono">
                      {formatCurrency(slip.rl1.boxE_quebecTaxDeducted)}
                    </td>

                    {/* QPP */}
                    <td className="px-4 py-3.5 text-right text-slate-700 font-mono">
                      {formatCurrency(slip.rl1.boxB_qppContribution)}
                    </td>

                    {/* QPIP */}
                    <td className="px-4 py-3.5 text-right text-slate-700 font-mono">
                      {formatCurrency(slip.rl1.boxH_qpipPremium)}
                    </td>

                    {/* EI */}
                    <td className="px-4 py-3.5 text-right text-slate-700 font-mono">
                      {formatCurrency(slip.t4.box18_employeeEi)}
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openSlipModal(slip, 't4')}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-md text-[11px] font-bold transition-colors border border-rose-200 flex items-center gap-1"
                          title="Aperçu T4"
                        >
                          <Eye className="w-3 h-3" />
                          <span>T4</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openSlipModal(slip, 'rl1')}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-md text-[11px] font-bold transition-colors border border-blue-200 flex items-center gap-1"
                          title="Aperçu Relevé 1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>RL-1</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const doc = generateT4SlipPDF(slip, language);
                            doc.save(`T4_${yearNum}_${emp.lastName}_${emp.firstName}.pdf`);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Télécharger T4 PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredSlips.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-semibold">{isFr ? 'Aucun employé trouvé.' : 'No employees found.'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Totals */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
          <span>
            {isFr 
              ? `Affichage de ${filteredSlips.length} employé(s) pour l'année fiscale ${selectedYear}`
              : `Showing ${filteredSlips.length} employee(s) for tax year ${selectedYear}`}
          </span>
          <div className="flex items-center gap-3 font-mono font-bold text-slate-900">
            <span>Total Brut: {formatCurrency(summaryTotals.totalGrossPayroll)}</span>
          </div>
        </div>

      </div>

      {/* Compliance Note Callout */}
      <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200/80 flex items-start gap-3">
        <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
          <AlertCircle className="w-4 h-4" />
        </div>
        <div className="text-xs text-amber-900 space-y-1">
          <span className="font-bold block uppercase tracking-tight text-[11px]">
            {isFr ? 'Échéances Réglementaires de Fin d\'Année' : 'Year-End Regulatory Deadlines'}
          </span>
          <p className="leading-relaxed text-amber-800">
            {isFr 
              ? 'Conformément aux lois fiscales de l\'ARC et de Revenu Québec, les employeurs doivent transmettre les feuillets T4 et Relevés 1 à leurs employés ainsi que les déclarations sommaires (T4 Sommaire et RLZ-1.S) au plus tard le dernier jour de février suivant l\'année d\'imposition.'
              : 'Per CRA and Revenu Québec mandates, employers must file and distribute T4 and RL-1 slips along with respective summary statements (T4 Summary and RLZ-1.S) no later than the last day of February following the calendar taxation year.'}
          </p>
        </div>
      </div>

      {/* Visual Modal for Previewing and Downloading Specific Slips */}
      <TaxSlipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slipData={selectedSlipForModal}
        initialType={modalInitialType}
      />

    </div>
  );
};
