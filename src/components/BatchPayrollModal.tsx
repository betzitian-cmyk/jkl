/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Employee, 
  PayStub, 
  PayFrequency 
} from '../types';
import { 
  X, 
  Calculator, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  Users, 
  Sparkles, 
  ArrowRight,
  TrendingUp,
  Download,
  Building2,
  ShieldAlert,
  Loader2,
  FileCheck2,
  Check,
  Search,
  CheckSquare,
  Square
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { calculatePayroll } from '../lib/calculations';
import { calculatePayPeriod, formatCurrency } from '../lib/utils';
import { FREQUENCY_WEEKS } from '../lib/constants';
import { Storage } from '../lib/storage';
import { useLanguage } from './LanguageContext';

export interface BatchPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmployees: Employee[];
  allEmployees?: Employee[];
  onBatchPayStubsCreated?: (stubs: PayStub[]) => void;
}

interface SimulatedEmployeeRecord {
  employee: Employee;
  grossPay: number;
  periodHours: number;
  frequency: PayFrequency;
  payPeriod: string;
  payrollResult: ReturnType<typeof calculatePayroll>;
}

export const BatchPayrollModal: React.FC<BatchPayrollModalProps> = ({
  isOpen,
  onClose,
  selectedEmployees: initialSelectedEmployees,
  onBatchPayStubsCreated,
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [payDate, setPayDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => 
    new Set(initialSelectedEmployees.map(e => e.id))
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedStubs, setGeneratedStubs] = useState<PayStub[] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Keep selectedIds in sync if initialSelectedEmployees changes and modal reopens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set(initialSelectedEmployees.map(e => e.id)));
      setGeneratedStubs(null);
      setIsProcessing(false);
    }
  }, [isOpen, initialSelectedEmployees]);

  // Filtered employees from selection
  const activeEmployees = useMemo(() => {
    return initialSelectedEmployees.filter(e => selectedIds.has(e.id));
  }, [initialSelectedEmployees, selectedIds]);

  // Compute individual payroll simulation per employee
  const simulationRecords: SimulatedEmployeeRecord[] = useMemo(() => {
    return activeEmployees.map((emp) => {
      const frequency = emp.frequency || 'bi-weekly';
      const periodsPerYear = FREQUENCY_WEEKS[frequency] ? (52 / FREQUENCY_WEEKS[frequency]) : 26;
      const hoursPerPeriod = Math.round((FREQUENCY_WEEKS[frequency] || 2) * 40);

      let calculatedGross = 0;
      if (emp.compensationType === 'hourly' && emp.hourlyRate) {
        calculatedGross = Math.round(emp.hourlyRate * hoursPerPeriod * 100) / 100;
      } else if (emp.baseSalary) {
        calculatedGross = Math.round((emp.baseSalary / periodsPerYear) * 100) / 100;
      } else {
        calculatedGross = 2500; // fallback standard
      }

      const { startDate, endDate } = calculatePayPeriod(payDate, frequency);
      const payPeriodText = `${startDate} - ${endDate}`;

      const payrollResult = calculatePayroll({
        grossPay: calculatedGross,
        frequency,
        year: 2026,
        employeeId: emp.id,
        vacationPay: 0,
        overtimePay: 0,
        bonusPay: 0,
        garnishments: emp.garnishments || [],
        benefitContributions: emp.benefitContributions,
        claimFederalBasicPersonalAmount: emp.claimFederalBasicPersonalAmount ?? true,
        hasMultipleEmployers: emp.hasMultipleEmployers ?? false,
        federalTd1ClaimAmount: emp.federalTd1ClaimAmount,
        claimProvincialBasicPersonalAmount: emp.claimProvincialBasicPersonalAmount ?? true,
        quebecTp1015Line10Code: emp.quebecTp1015Line10Code || 'A',
        t1213FederalReduction: emp.t1213Reduction || 0,
        tp1016QuebecReduction: emp.tp1016Reduction || 0,
        voluntaryPreTaxRrsp: emp.voluntaryPreTaxRrsp || 0,
        voluntaryPostTaxHealth: emp.voluntaryPostTaxHealth || 0,
      });

      return {
        employee: emp,
        grossPay: calculatedGross,
        periodHours: hoursPerPeriod,
        frequency,
        payPeriod: payPeriodText,
        payrollResult,
      };
    });
  }, [activeEmployees, payDate]);

  // Aggregate Batch Financial Totals
  const batchTotals = useMemo(() => {
    return simulationRecords.reduce(
      (acc, rec) => {
        const pr = rec.payrollResult;
        acc.totalGross += pr.grossPay;
        acc.totalNet += pr.netPay;
        acc.totalFedTax += pr.federalTax;
        acc.totalQcTax += pr.quebecTax;
        acc.totalQpp += pr.qpp;
        acc.totalEi += pr.ei;
        acc.totalQpip += pr.qpip;
        acc.totalDeductions += pr.totalDeductions;
        acc.totalEmployerCost += pr.totalEmployerCost;
        return acc;
      },
      {
        totalGross: 0,
        totalNet: 0,
        totalFedTax: 0,
        totalQcTax: 0,
        totalQpp: 0,
        totalEi: 0,
        totalQpip: 0,
        totalDeductions: 0,
        totalEmployerCost: 0,
      }
    );
  }, [simulationRecords]);

  if (!isOpen) return null;

  // Toggle individual employee selection
  const toggleEmployee = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === initialSelectedEmployees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(initialSelectedEmployees.map(e => e.id)));
    }
  };

  // One-click Batch Execution
  const handleExecuteBatchSimulation = async () => {
    if (simulationRecords.length === 0) return;
    setIsProcessing(true);

    try {
      const stubsToCreate: Omit<PayStub, 'id'>[] = simulationRecords.map((rec) => {
        const emp = rec.employee;
        return {
          ...rec.payrollResult,
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          date: payDate,
          payPeriod: rec.payPeriod,
        };
      });

      // Save simultaneously in batch
      const saved = await Storage.addPayStubsBatch(stubsToCreate);
      setGeneratedStubs(saved);

      if (onBatchPayStubsCreated) {
        onBatchPayStubsCreated(saved);
      }
    } catch (error) {
      console.error('Error during batch payroll simulation:', error);
      alert(isFr ? 'Une erreur est survenue lors de la génération groupée.' : 'An error occurred during batch generation.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export batch records to CSV
  const handleExportCsv = () => {
    if (simulationRecords.length === 0) return;
    const headers = [
      'ID Employé',
      'Nom',
      'Poste',
      'Période',
      'Date de paie',
      'Brut ($)',
      'Impôt Fédéral ($)',
      'Impôt Québec ($)',
      'RRQ ($)',
      'AE ($)',
      'RQAP ($)',
      'Déductions Totales ($)',
      'Net Payé ($)',
      'Coût Employeur ($)'
    ];

    const rows = simulationRecords.map(r => [
      `"${r.employee.id}"`,
      `"${r.employee.firstName} ${r.employee.lastName}"`,
      `"${r.employee.jobTitle || 'Employé'}"`,
      `"${r.payPeriod}"`,
      payDate,
      r.payrollResult.grossPay.toFixed(2),
      r.payrollResult.federalTax.toFixed(2),
      r.payrollResult.quebecTax.toFixed(2),
      r.payrollResult.qpp.toFixed(2),
      r.payrollResult.ei.toFixed(2),
      r.payrollResult.qpip.toFixed(2),
      r.payrollResult.totalDeductions.toFixed(2),
      r.payrollResult.netPay.toFixed(2),
      r.payrollResult.totalEmployerCost.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `simulation_paie_lot_${payDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDisplayRecords = simulationRecords.filter(r => {
    const name = `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase();
    const title = (r.employee.jobTitle || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || title.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] my-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-2xl border border-blue-400/30 shadow-inner">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 tracking-wider">
                  {isFr ? 'Traitement en lot' : 'Batch Processing'}
                </span>
                <span className="text-xs text-blue-200/80 font-mono">
                  {isFr ? 'Moteur Fiscal QC/CA 2026' : 'Statutory Engine 2026'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-0.5">
                {isFr ? 'Simulation de paie groupée en 1 clic' : 'One-Click Batch Payroll Simulation'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            title={isFr ? 'Fermer' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Success Banner if generated */}
          {generatedStubs && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 border border-emerald-300 p-4 sm:p-5 rounded-2xl shadow-sm text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base">
                    {isFr 
                      ? `${generatedStubs.length} fiches de paie générées et enregistrées avec succès !` 
                      : `Successfully generated & recorded ${generatedStubs.length} pay stubs!`}
                  </h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    {isFr 
                      ? 'Les enregistrements de paie sont maintenant archivés dans le grand livre et visibles dans l\'historique des paies.' 
                      : 'The payroll records are now archived in the general ledger and available in Pay Stub History.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={handleExportCsv}
                  className="px-3.5 py-2 rounded-xl bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100/50 font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isFr ? 'Exporter CSV' : 'Export CSV'}</span>
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'history' }));
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <span>{isFr ? 'Voir Historique' : 'View History'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Configuration Bar: Pay Date & Selection Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>{isFr ? 'Date de versement :' : 'Pay Date:'}</span>
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  {selectedIds.size === initialSelectedEmployees.length ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>{isFr ? 'Tout désélectionner' : 'Deselect All'}</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      <span>{isFr ? `Tout sélectionner (${initialSelectedEmployees.length})` : `Select All (${initialSelectedEmployees.length})`}</span>
                    </>
                  )}
                </button>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                  {selectedIds.size} / {initialSelectedEmployees.length} {isFr ? 'employés prêts' : 'employees ready'}
                </span>
              </div>
            </div>

            {/* Quick search input */}
            <div className="relative w-full md:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isFr ? "Filtrer employés..." : "Filter employees..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                {isFr ? 'Masse Salariale Brute' : 'Total Gross Pay'}
              </span>
              <span className="text-base sm:text-lg font-black text-blue-950 font-mono mt-1">
                {formatCurrency(batchTotals.totalGross)}
              </span>
              <span className="text-[10px] text-blue-600/80 mt-0.5">
                {activeEmployees.length} {isFr ? 'employé(s)' : 'employees'}
              </span>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-orange-50/50 border border-red-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                {isFr ? 'Retenues Fiscales' : 'Total Income Tax'}
              </span>
              <span className="text-base sm:text-lg font-black text-red-950 font-mono mt-1">
                {formatCurrency(batchTotals.totalFedTax + batchTotals.totalQcTax)}
              </span>
              <span className="text-[10px] text-red-600/80 mt-0.5">
                {isFr ? `Féd: ${formatCurrency(batchTotals.totalFedTax)} • QC: ${formatCurrency(batchTotals.totalQcTax)}` : `Fed: ${formatCurrency(batchTotals.totalFedTax)} • QC: ${formatCurrency(batchTotals.totalQcTax)}`}
              </span>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-yellow-50/50 border border-amber-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                {isFr ? 'Cotisations Sociales' : 'Statutory Deductions'}
              </span>
              <span className="text-base sm:text-lg font-black text-amber-950 font-mono mt-1">
                {formatCurrency(batchTotals.totalQpp + batchTotals.totalEi + batchTotals.totalQpip)}
              </span>
              <span className="text-[10px] text-amber-700/80 mt-0.5">
                RRQ + AE + RQAP
              </span>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                {isFr ? 'Net Total à Verser' : 'Total Net Pay'}
              </span>
              <span className="text-base sm:text-lg font-black text-emerald-950 font-mono mt-1">
                {formatCurrency(batchTotals.totalNet)}
              </span>
              <span className="text-[10px] text-emerald-700/80 mt-0.5">
                {isFr ? 'Dépôt direct bancaire' : 'Direct deposit total'}
              </span>
            </div>

            <div className="bg-gradient-to-br from-slate-100 to-slate-200/70 border border-slate-300 rounded-2xl p-3.5 flex flex-col justify-between col-span-2 lg:col-span-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-500" />
                <span>{isFr ? 'Coût Employeur' : 'Employer Outlay'}</span>
              </span>
              <span className="text-base sm:text-lg font-black text-slate-900 font-mono mt-1">
                {formatCurrency(batchTotals.totalEmployerCost)}
              </span>
              <span className="text-[10px] text-slate-600 mt-0.5">
                FSS, CNESST, CNT, RRQ
              </span>
            </div>
          </div>

          {/* Breakdown Table Preview */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-100/90 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {isFr ? 'Aperçu détaillé des calculs par employé' : 'Detailed Calculation Preview by Employee'}
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {filteredDisplayRecords.length} {isFr ? 'fiches affichées' : 'records displayed'}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[320px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-3.5 py-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === initialSelectedEmployees.length && initialSelectedEmployees.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-3.5 py-3">{isFr ? 'Employé' : 'Employee'}</th>
                    <th className="px-3.5 py-3">{isFr ? 'Mode & Taux' : 'Comp & Rate'}</th>
                    <th className="px-3.5 py-3 text-right">{isFr ? 'Salaire Brut' : 'Gross Pay'}</th>
                    <th className="px-3.5 py-3 text-right">{isFr ? 'Impôt Féd' : 'Fed Tax'}</th>
                    <th className="px-3.5 py-3 text-right">{isFr ? 'Impôt QC' : 'QC Tax'}</th>
                    <th className="px-3.5 py-3 text-right">RRQ/QPP</th>
                    <th className="px-3.5 py-3 text-right">AE/EI</th>
                    <th className="px-3.5 py-3 text-right">RQAP</th>
                    <th className="px-3.5 py-3 text-right font-black text-slate-900">{isFr ? 'Net à Verser' : 'Net Pay'}</th>
                    <th className="px-3.5 py-3 text-right text-slate-500">{isFr ? 'Coût Patronal' : 'Employer Cost'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {filteredDisplayRecords.map((record) => {
                    const emp = record.employee;
                    const pr = record.payrollResult;
                    const isSelected = selectedIds.has(emp.id);

                    return (
                      <tr 
                        key={emp.id} 
                        className={`hover:bg-blue-50/30 transition-colors ${!isSelected ? 'opacity-40 bg-slate-50/50' : ''}`}
                      >
                        <td className="px-3.5 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEmployee(emp.id)}
                            className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-3.5 py-2.5 font-sans font-bold text-slate-800 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {emp.firstName[0]}{emp.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <span className="block truncate max-w-[140px]">{emp.firstName} {emp.lastName}</span>
                              <span className="block text-[9px] font-normal text-slate-400 font-sans truncate max-w-[140px]">
                                {emp.jobTitle || (isFr ? 'Employé' : 'Employee')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 font-sans text-slate-600 whitespace-nowrap">
                          <span className="text-[10px] font-semibold block">
                            {emp.compensationType === 'hourly' 
                              ? `${formatCurrency(emp.hourlyRate || 0)}/h (${record.periodHours}h)`
                              : `${formatCurrency(emp.baseSalary || 0)}/an`}
                          </span>
                          <span className="text-[9px] text-slate-400 capitalize block">{emp.frequency}</span>
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-blue-900 whitespace-nowrap">
                          {formatCurrency(pr.grossPay)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-red-700 whitespace-nowrap">
                          -{formatCurrency(pr.federalTax)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-red-700 whitespace-nowrap">
                          -{formatCurrency(pr.quebecTax)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-amber-700 whitespace-nowrap">
                          -{formatCurrency(pr.qpp)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-amber-700 whitespace-nowrap">
                          -{formatCurrency(pr.ei)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-amber-700 whitespace-nowrap">
                          -{formatCurrency(pr.qpip)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-black text-emerald-800 bg-emerald-50/40 whitespace-nowrap">
                          {formatCurrency(pr.netPay)}
                        </td>
                        <td className="px-3.5 py-2.5 text-right text-slate-600 whitespace-nowrap font-sans text-[10px]">
                          {formatCurrency(pr.totalEmployerCost)}
                        </td>
                      </tr>
                    );
                  })}

                  {filteredDisplayRecords.length === 0 && (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400 font-sans text-xs">
                        {isFr ? 'Aucun employé sélectionné.' : 'No employees selected.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium text-center sm:text-left">
            <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {isFr 
                ? 'Les retenues sont calculées conformément aux tables de retenue TP-1015 et T4032.' 
                : 'Withholdings calculated per official CRA T4032 and Revenu Québec TP-1015 tables.'}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition cursor-pointer"
            >
              {isFr ? 'Fermer' : 'Close'}
            </button>

            <button
              type="button"
              onClick={handleExecuteBatchSimulation}
              disabled={isProcessing || activeEmployees.length === 0}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 active:scale-98 transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{isFr ? 'Génération simultanée en cours...' : 'Generating in 1 click...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>
                    {isFr 
                      ? `Exécuter la simulation en 1 clic (${activeEmployees.length} fiches)` 
                      : `Execute 1-Click Batch Simulation (${activeEmployees.length})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
