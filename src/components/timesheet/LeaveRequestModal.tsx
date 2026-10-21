/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../LanguageContext';
import { LeaveType, EmployeeLeaveBalance, Employee } from '../../types';
import { 
  Calendar, 
  Send, 
  X, 
  AlertCircle, 
  Info,
  Clock,
  CheckCircle2,
  FileText,
  Palmtree,
  HeartHandshake,
  AlertTriangle
} from 'lucide-react';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: {
    employeeId: string;
    employeeName: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    totalHours: number;
    isPaid: boolean;
    reason?: string;
  }) => Promise<void>;
  employees: Employee[];
  defaultEmployeeId?: string;
  allLeaveBalances?: EmployeeLeaveBalance[];
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employees,
  defaultEmployeeId = '',
  allLeaveBalances = []
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const lt = (fr: string, en: string) => isFr ? fr : en;

  const [employeeId, setEmployeeId] = useState(defaultEmployeeId || (employees[0]?.id ?? ''));
  const [leaveType, setLeaveType] = useState<LeaveType>('vacation');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalDays, setTotalDays] = useState(1);
  const [totalHours, setTotalHours] = useState(8);
  const [isPaid, setIsPaid] = useState(true);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected Employee Info & Balances
  const selectedEmp = employees.find(e => e.id === employeeId);
  const empBalance = useMemo(() => {
    if (!employeeId) return null;
    const found = allLeaveBalances.find(b => b.employeeId === employeeId);
    const vRate = selectedEmp?.vacationRate || 0.04;
    const defaultVacation = vRate >= 0.08 ? 20 : vRate >= 0.06 ? 15 : vRate >= 0.04 ? 10 : 15;
    
    const vTotal = found ? found.vacationTotalDays : defaultVacation;
    const vUsed = found ? found.vacationUsedDays : 0;
    const pTotal = found ? found.personalTotalDays : 3;
    const pUsed = found ? found.personalUsedDays : 0;
    const sTotal = found ? found.sickTotalDays : 10;
    const sUsed = found ? found.sickUsedDays : 0;

    return {
      vacationAvailable: Math.max(0, vTotal - vUsed),
      vacationTotal: vTotal,
      vacationUsed: vUsed,
      personalAvailable: Math.max(0, pTotal - pUsed),
      personalTotal: pTotal,
      personalUsed: pUsed,
      sickAvailable: Math.max(0, sTotal - sUsed),
      sickTotal: sTotal,
      sickUsed: sUsed,
    };
  }, [employeeId, allLeaveBalances, selectedEmp]);

  if (!isOpen) return null;

  const handleDateChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      const d1 = new Date(start);
      const d2 = new Date(end);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
      setTotalDays(diffDays);
      setTotalHours(diffDays * 8);
    }
  };

  const isExceedingVacation = leaveType === 'vacation' && empBalance && totalDays > empBalance.vacationAvailable;
  const isExceedingPersonal = leaveType === 'personal' && empBalance && totalDays > empBalance.personalAvailable;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setErrorMsg(lt('Veuillez sélectionner un employé.', 'Please select an employee.'));
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg(lt('La date de fin doit être postérieure à la date de début.', 'End date must be after start date.'));
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      const employeeName = selectedEmp ? `${selectedEmp.firstName} ${selectedEmp.lastName}` : 'Employé';
      await onSubmit({
        employeeId,
        employeeName,
        leaveType,
        startDate,
        endDate,
        totalDays: Number(totalDays),
        totalHours: Number(totalHours),
        isPaid,
        reason: reason.trim() || undefined
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || lt('Erreur lors de la soumission.', 'Error submitting request.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight">
                {lt('Nouvelle Demande d\'Absence / Congé', 'New Leave / Absence Request')}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {lt('Conforme aux Normes du Travail du Québec (CNESST)', 'Compliant with Quebec Labour Standards (CNESST)')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
              {lt('Employé concerné', 'Employee')}
            </label>
            <select
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            >
              <option value="">{lt('-- Sélectionner un employé --', '-- Select an employee --')}</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.department || 'Général'})</option>
              ))}
            </select>
          </div>

          {/* Live Available Balance Snapshot for this Employee */}
          {empBalance && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                {lt('Soldes de congés disponibles pour cet employé :', 'Available balances for this employee:')}
              </span>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className={`p-2 rounded-lg border ${leaveType === 'vacation' ? 'bg-blue-50/80 border-blue-300 text-blue-900 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 text-slate-700'}`}>
                  <span className="text-[10px] font-bold text-slate-500 block">🏖️ {lt('Vacances', 'Vacation')}</span>
                  <span className="text-xs font-black">{empBalance.vacationAvailable} j</span>
                  <span className="text-[9px] text-slate-400 block">({empBalance.vacationAvailable * 8}h)</span>
                </div>

                <div className={`p-2 rounded-lg border ${leaveType === 'personal' ? 'bg-amber-50/80 border-amber-300 text-amber-900 ring-2 ring-amber-500/20' : 'bg-white border-slate-200 text-slate-700'}`}>
                  <span className="text-[10px] font-bold text-slate-500 block">👨‍👩‍👧 {lt('Personnel', 'Personal')}</span>
                  <span className="text-xs font-black">{empBalance.personalAvailable} j</span>
                  <span className="text-[9px] text-slate-400 block">({empBalance.personalAvailable * 8}h)</span>
                </div>

                <div className={`p-2 rounded-lg border ${leaveType === 'sick' ? 'bg-rose-50/80 border-rose-300 text-rose-900 ring-2 ring-rose-500/20' : 'bg-white border-slate-200 text-slate-700'}`}>
                  <span className="text-[10px] font-bold text-slate-500 block">🤒 {lt('Maladie', 'Sick')}</span>
                  <span className="text-xs font-black">{empBalance.sickAvailable} j</span>
                  <span className="text-[9px] text-slate-400 block">({empBalance.sickAvailable * 8}h)</span>
                </div>
              </div>

              {(isExceedingVacation || isExceedingPersonal) && (
                <div className="flex items-center gap-1.5 text-amber-700 text-[11px] font-bold pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>
                    {lt(`Attention : la durée demandée (${totalDays}j) dépasse le solde disponible (${leaveType === 'vacation' ? empBalance.vacationAvailable : empBalance.personalAvailable}j). Le surplus pourra être traité sans solde.`, `Note: Requested duration (${totalDays}d) exceeds available balance (${leaveType === 'vacation' ? empBalance.vacationAvailable : empBalance.personalAvailable}d).`)}
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
              {lt('Type d\'absence ou congé', 'Leave / Absence Type')}
            </label>
            <select
              value={leaveType}
              onChange={e => {
                const t = e.target.value as LeaveType;
                setLeaveType(t);
                if (t === 'unpaid') setIsPaid(false);
                else setIsPaid(true);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
            >
              <option value="vacation">{lt('🏖️ Congé annuel payé (Vacances)', '🏖️ Annual Paid Vacation')}</option>
              <option value="sick">{lt('🤒 Maladie / Rendez-vous médical (CNESST)', '🤒 Sick Leave / Medical')}</option>
              <option value="personal">{lt('👨‍👩‍👧 Obligations familiales / Raisons personnelles (Art. 79.7 LNT)', '👨‍👩‍👧 Family Obligations / Personal')}</option>
              <option value="statutory_holiday">{lt('🍁 Jour férié chômé et payé', '🍁 Statutory Holiday')}</option>
              <option value="bereavement">{lt('🕊️ Congé pour événement familial (Deuil/Mariage)', '🕊️ Bereavement / Family Event')}</option>
              <option value="parental">{lt('👶 Congé parental / Maternité (RQAP)', '👶 Parental / Maternity (QPIP)')}</option>
              <option value="unpaid">{lt('⏱️ Congé sans solde autorisé', '⏱️ Unpaid Leave of Absence')}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                {lt('Date de début', 'Start Date')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => handleDateChange(e.target.value, endDate)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                {lt('Date de fin', 'End Date')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => handleDateChange(startDate, e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                {lt('Jours ouvrables', 'Working Days')}
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="365"
                value={totalDays}
                onChange={e => {
                  const d = parseFloat(e.target.value) || 1;
                  setTotalDays(d);
                  setTotalHours(d * 8);
                }}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                {lt('Heures totales', 'Total Hours')}
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={totalHours}
                onChange={e => setTotalHours(parseFloat(e.target.value) || 8)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                {lt('Type traitement', 'Pay Status')}
              </label>
              <div className="flex items-center h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isPaid}
                    onChange={e => setIsPaid(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                  />
                  <span>{lt('Payé (LNT)', 'Paid')}</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
              {lt('Motif / Précisions (Facultatif)', 'Reason / Notes (Optional)')}
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={lt('Ex: Vacances estivales, rendez-vous chez le dentiste, obligations familiales...', 'E.g., Summer vacation, medical appointment, family care...')}
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {lt('Annuler', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? lt('Enregistrement...', 'Saving...') : lt('Soumettre la Demande', 'Submit Request')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
