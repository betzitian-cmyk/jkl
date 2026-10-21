/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../LanguageContext';
import { TimeEntry, TimeEntryType, EmployeeLeaveBalance, Employee } from '../../types';
import { 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Calendar,
  Send,
  Sparkles,
  ArrowRight,
  Filter,
  DollarSign,
  AlertCircle,
  Palmtree,
  HeartHandshake
} from 'lucide-react';
import { motion } from 'motion/react';

interface TimesheetTrackerTabProps {
  entries: TimeEntry[];
  employees: Employee[];
  selectedEmployeeId: string;
  leaveBalance?: EmployeeLeaveBalance | null;
  allLeaveBalances?: EmployeeLeaveBalance[];
  onSelectEmployee: (id: string) => void;
  onAddEntry: (entry: {
    employeeId: string;
    date: string;
    hours: number;
    entryType: TimeEntryType;
    projectTask?: string;
    billable: boolean;
    hourlyRate?: number;
    notes?: string;
  }) => Promise<void>;
  onApproveEntry: (id: string) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onApplyHoursToPayroll: (employeeId: string, regularHours: number, overtimeHours: number) => void;
  isAdmin: boolean;
}

export const TimesheetTrackerTab: React.FC<TimesheetTrackerTabProps> = ({
  entries,
  employees,
  selectedEmployeeId,
  leaveBalance,
  allLeaveBalances = [],
  onSelectEmployee,
  onAddEntry,
  onApproveEntry,
  onDeleteEntry,
  onApplyHoursToPayroll,
  isAdmin
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const lt = (fr: string, en: string) => isFr ? fr : en;

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState(8);
  const [entryType, setEntryType] = useState<TimeEntryType>('regular');
  const [projectTask, setProjectTask] = useState('');
  const [billable, setBillable] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'approved'>('all');

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  // Filter entries for active employee or all
  const filteredEntries = entries.filter(e => {
    const matchEmp = selectedEmployeeId ? e.employeeId === selectedEmployeeId : true;
    const matchStatus = statusFilter === 'all' ? true : e.status === statusFilter;
    return matchEmp && matchStatus;
  });

  // Calculate totals for active employee
  const activeEmployeeEntries = selectedEmployeeId 
    ? entries.filter(e => e.employeeId === selectedEmployeeId)
    : entries;

  const totalRegular = activeEmployeeEntries
    .filter(e => e.entryType === 'regular' || e.entryType === 'statutory_holiday')
    .reduce((sum, e) => sum + (e.hours || 0), 0);

  const totalOvertime = activeEmployeeEntries
    .filter(e => e.entryType === 'overtime' || e.entryType === 'double_time')
    .reduce((sum, e) => sum + (e.hours || 0), 0);

  const totalAllHours = totalRegular + totalOvertime;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;

    try {
      setIsSubmitting(true);
      await onAddEntry({
        employeeId: selectedEmployeeId,
        date,
        hours: Number(hours),
        entryType,
        projectTask: projectTask.trim() || undefined,
        billable,
        hourlyRate: selectedEmployee?.hourlyRate,
        notes: notes.trim() || undefined
      });
      // Reset form fields
      setHours(8);
      setProjectTask('');
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEntryBadge = (type: TimeEntryType) => {
    switch (type) {
      case 'regular':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">{lt('Régulier (1.0x)', 'Regular (1.0x)')}</span>;
      case 'overtime':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">{lt('H. Supp (1.5x)', 'Overtime (1.5x)')}</span>;
      case 'double_time':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">{lt('Temps Double (2.0x)', 'Double (2.0x)')}</span>;
      case 'on_call':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">{lt('Garde / Astreinte', 'On-Call')}</span>;
      case 'statutory_holiday':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">{lt('Férié Travaillé', 'Stat Holiday')}</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{type}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Employee Selector Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500">
            {lt('Filtrer par employé :', 'Filter by Employee:')}
          </label>
          <select
            value={selectedEmployeeId}
            onChange={e => onSelectEmployee(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
          >
            <option value="">{lt('-- Tous les collaborateurs --', '-- All Employees --')}</option>
            {employees.map((emp, idx) => (
              <option key={`${emp.id}-${idx}`} value={emp.id}>{emp.firstName} {emp.lastName}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {lt('Tous', 'All')}
            </button>
            <button
              onClick={() => setStatusFilter('submitted')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'submitted' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {lt('Soumis', 'Submitted')}
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'approved' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {lt('Approuvés', 'Approved')}
            </button>
          </div>
        </div>

        {/* Action button to apply directly to payroll */}
        {selectedEmployeeId && totalAllHours > 0 && (
          <button
            onClick={() => onApplyHoursToPayroll(selectedEmployeeId, totalRegular, totalOvertime)}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-700 hover:to-indigo-700 shadow-xs flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>{lt('Injecter dans le Simulateur de Paie', 'Apply to Payroll Calculator')} ({totalAllHours}h)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Submission Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              {lt('Saisie des Feuilles de Temps', 'Timesheet Entry')}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
              {lt('Temps & Facturation', 'Time & Billing')}
            </span>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                {lt('Collaborateur', 'Employee')}
              </label>
              <select
                value={selectedEmployeeId}
                onChange={e => onSelectEmployee(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              >
                <option value="">{lt('-- Sélectionner un collaborateur --', '-- Select an employee --')}</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            </div>

            {/* Leave Balance Snapshot for Active Employee */}
            {selectedEmployeeId && (
              (() => {
                const bal = allLeaveBalances.find(b => b.employeeId === selectedEmployeeId) || leaveBalance;
                const vRate = selectedEmployee?.vacationRate || 0.04;
                const defaultVac = vRate >= 0.08 ? 20 : vRate >= 0.06 ? 15 : vRate >= 0.04 ? 10 : 15;
                const vAvail = bal ? Math.max(0, (bal.vacationTotalDays || defaultVac) - (bal.vacationUsedDays || 0)) : defaultVac;
                const pAvail = bal ? Math.max(0, (bal.personalTotalDays || 3) - (bal.personalUsedDays || 0)) : 3;

                return (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/90 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        {lt('Soldes de Congés Disponibles', 'Available Leave Balances')}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        {lt('Exercice 2026', '2026')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-white rounded-lg border border-blue-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-blue-700 block">🏖️ {lt('Vacances', 'Vacation')}</span>
                          <span className="text-xs font-black text-slate-900">{vAvail} <span className="text-[10px] font-normal text-slate-400">j</span></span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {vAvail * 8}h
                        </span>
                      </div>

                      <div className="p-2 bg-white rounded-lg border border-amber-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-amber-700 block">👨‍👩‍👧 {lt('Personnel', 'Personal')}</span>
                          <span className="text-xs font-black text-slate-900">{pAvail} <span className="text-[10px] font-normal text-slate-400">j</span></span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          {pAvail * 8}h
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  {lt('Date', 'Date')}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                  {lt('Heures', 'Hours')}
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  value={hours}
                  onChange={e => setHours(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                {lt('Catégorie d\'heures (LNT Québec)', 'Hour Classification (Quebec LNT)')}
              </label>
              <select
                value={entryType}
                onChange={e => setEntryType(e.target.value as TimeEntryType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              >
                <option value="regular">{lt('Heures régulières (100% taux de base)', 'Regular Hours (1.0x Base Rate)')}</option>
                <option value="overtime">{lt('Heures en surtemps (Majorées 150% - Art. 55 LNT)', 'Overtime (1.5x Base Rate - LNT Art. 55)')}</option>
                <option value="double_time">{lt('Temps double (Majorées 200% - Dimanche/Férié)', 'Double Time (2.0x Sunday/Holiday)')}</option>
                <option value="on_call">{lt('Prime de garde / Astreinte', 'On-Call / Standby Hours')}</option>
                <option value="statutory_holiday">{lt('Jour férié travaillé avec indemnité', 'Statutory Holiday Worked')}</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                {lt('Projet / Mandat / Bon de travail', 'Project / Mandate / Work Order')}
              </label>
              <input
                type="text"
                value={projectTask}
                onChange={e => setProjectTask(e.target.value)}
                placeholder={lt('Ex: Client Montréal - Phase 2, Audit CNESST...', 'E.g. Montreal Client - Phase 2, CNESST Audit...')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={billable}
                  onChange={e => setBillable(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-slate-700">
                  {lt('Heures facturables au client', 'Billable to client')}
                </span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                {lt('Notes de travail', 'Work Notes')}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={lt('Détails des livrables complétés...', 'Deliverables and completed work...')}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!selectedEmployeeId || isSubmitting}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? lt('Enregistrement...', 'Saving...') : lt('Enregistrer la saisie', 'Save Time Entry')}
            </button>
          </form>
        </div>

        {/* Entries Table & Analytical Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                {lt('Heures Régulières', 'Regular Hours')}
              </span>
              <div className="text-xl font-black text-slate-900">{totalRegular} <span className="text-xs font-normal text-slate-500">h</span></div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block mb-1">
                {lt('Heures En Surtemps', 'Overtime Hours')}
              </span>
              <div className="text-xl font-black text-amber-600">{totalOvertime} <span className="text-xs font-normal text-amber-500">h</span></div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 block mb-1">
                {lt('Total Enregistré', 'Total Tracked')}
              </span>
              <div className="text-xl font-black text-blue-600">{totalAllHours} <span className="text-xs font-normal text-blue-400">h</span></div>
            </div>
          </div>

          {/* Entries Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  {lt('Historique des Heures et Pointages', 'Timesheet Entries Log')}
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                  {filteredEntries.length}
                </span>
              </div>
            </div>

            <div className="flex-grow overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="hidden md:table-header-group">
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">{lt('Date', 'Date')}</th>
                    <th className="px-4 py-3">{lt('Collaborateur', 'Employee')}</th>
                    <th className="px-4 py-3">{lt('Classification', 'Type')}</th>
                    <th className="px-4 py-3">{lt('Mandat / Projet', 'Project / Task')}</th>
                    <th className="px-4 py-3">{lt('Heures', 'Hours')}</th>
                    <th className="px-4 py-3">{lt('Statut', 'Status')}</th>
                    <th className="px-4 py-3 text-right">{lt('Actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="block p-3 sm:p-4 bg-slate-50/50 md:bg-transparent md:p-0 md:table-row-group md:divide-y md:divide-slate-100 text-xs">
                  {filteredEntries.map(entry => {
                    const emp = employees.find(e => e.id === entry.employeeId);
                    return (
                      <tr 
                        key={entry.id} 
                        className="flex flex-col gap-3 p-4 sm:p-5 mb-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-xs md:table-row md:gap-0 md:p-0 md:mb-0 md:border-0 md:shadow-none md:rounded-none hover:bg-slate-50/60 transition-colors group"
                      >
                        
                        {/* Date */}
                        <td className="flex justify-between items-center pb-2.5 border-b border-slate-100 md:border-0 md:pb-0 md:table-cell md:px-4 md:py-3">
                          <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400">{lt('Date', 'Date')}</span>
                          <span className="font-semibold text-slate-700 whitespace-nowrap bg-slate-100/80 md:bg-transparent px-2 py-0.5 md:p-0 rounded-md text-[11px] font-mono">{entry.date}</span>
                        </td>

                        {/* Collaborateur */}
                        <td className="flex justify-between items-center py-1 md:table-cell md:px-4 md:py-3">
                          <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400">{lt('Collaborateur', 'Employee')}</span>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm md:text-xs">{emp ? `${emp.firstName} ${emp.lastName}` : entry.employeeId}</span>
                        </td>

                        {/* Classification */}
                        <td className="flex justify-between items-center py-1 md:table-cell md:px-4 md:py-3">
                          <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400">{lt('Classification', 'Type')}</span>
                          {getEntryBadge(entry.entryType)}
                        </td>

                        {/* Mandat / Projet */}
                        <td className="flex justify-between items-center py-1 md:table-cell md:px-4 md:py-3">
                          <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400">{lt('Mandat / Projet', 'Project / Task')}</span>
                          <span className="truncate max-w-[160px] block text-slate-600 font-medium" title={entry.projectTask || ''}>
                            {entry.projectTask || lt('Général', 'General')}
                          </span>
                        </td>

                        {/* Heures */}
                        <td className="flex justify-between items-center bg-slate-50/80 md:bg-transparent rounded-xl p-2.5 md:p-3 border border-slate-100 md:border-0 md:table-cell md:px-4 md:py-3">
                          <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400">{lt('Heures', 'Hours')}</span>
                          <span className="font-black text-slate-900 text-sm md:text-xs font-mono">{entry.hours} h</span>
                        </td>

                        {/* Statut */}
                        <td className="flex justify-between items-center py-1 md:table-cell md:px-4 md:py-3">
                          <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400">{lt('Statut', 'Status')}</span>
                          {entry.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] md:text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 md:py-0.5 rounded-full shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 md:w-3 md:h-3" />
                              {lt('Approuvé', 'Approved')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[11px] md:text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 md:py-0.5 rounded-full shadow-2xs">
                              <Clock className="w-3.5 h-3.5 md:w-3 md:h-3" />
                              {lt('Soumis', 'Submitted')}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="pt-3 mt-1 border-t border-slate-100 md:table-cell md:px-4 md:py-3 md:mt-0 md:pt-0 md:border-transparent text-right">
                          <div className="flex items-center gap-2 justify-end">
                            {isAdmin && entry.status !== 'approved' && (
                              <button
                                onClick={() => onApproveEntry(entry.id)}
                                title={lt('Approuver l\'entrée', 'Approve Entry')}
                                className="flex-1 md:flex-none py-2 px-3 md:p-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 md:border-0 rounded-xl transition-colors cursor-pointer font-bold text-xs md:text-[10px] flex items-center justify-center gap-1.5 active:scale-98"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span className="md:hidden">{lt('Approuver', 'Approve')}</span>
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteEntry(entry.id)}
                              title={lt('Supprimer', 'Delete')}
                              className="py-2 px-3 md:p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 md:border-0 rounded-xl transition-colors cursor-pointer flex items-center justify-center active:scale-98"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="md:hidden ml-1 text-xs">{lt('Supprimer', 'Delete')}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEntries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic">
                        {lt('Aucune entrée de temps enregistrée pour ce filtre.', 'No timesheet entries recorded for this filter.')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
