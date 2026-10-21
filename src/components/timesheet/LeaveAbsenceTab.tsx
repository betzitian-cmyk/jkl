/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useLanguage } from '../LanguageContext';
import { LeaveRequest, LeaveType, LeaveStatus, EmployeeLeaveBalance, Employee } from '../../types';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Plus, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  Filter,
  Info,
  AlertTriangle,
  Search,
  Users,
  ChevronRight,
  Briefcase,
  Sparkles,
  Palmtree,
  HeartHandshake,
  Activity,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';

interface LeaveAbsenceTabProps {
  leaveRequests: LeaveRequest[];
  leaveBalance: EmployeeLeaveBalance | null;
  allLeaveBalances?: EmployeeLeaveBalance[];
  employees: Employee[];
  selectedEmployeeId: string;
  onSelectEmployee: (id: string) => void;
  onOpenRequestModal: () => void;
  onUpdateStatus: (id: string, status: 'approved' | 'rejected' | 'cancelled', rejectionReason?: string) => Promise<void>;
  onDeleteRequest: (id: string) => Promise<void>;
  isAdmin: boolean;
}

export const LeaveAbsenceTab: React.FC<LeaveAbsenceTabProps> = ({
  leaveRequests,
  leaveBalance,
  allLeaveBalances = [],
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  onOpenRequestModal,
  onUpdateStatus,
  onDeleteRequest,
  isAdmin
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const lt = (fr: string, en: string) => isFr ? fr : en;

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [balanceSearch, setBalanceSearch] = useState('');
  const [balanceDeptFilter, setBalanceDeptFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  // Selected employee object
  const selectedEmp = employees.find(e => e.id === selectedEmployeeId);

  // Departments list for filtering
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Merge employee data with leave balances
  const enrichedBalances = useMemo(() => {
    return employees.map(emp => {
      const match = allLeaveBalances.find(b => b.employeeId === emp.id);
      const vRate = emp.vacationRate || 0.04;
      const defaultVacation = vRate >= 0.08 ? 20 : vRate >= 0.06 ? 15 : vRate >= 0.04 ? 10 : 15;
      
      const vacationTotal = match ? match.vacationTotalDays : defaultVacation;
      const vacationUsed = match ? match.vacationUsedDays : 0;
      const vacationAvail = Math.max(0, vacationTotal - vacationUsed);

      const personalTotal = match ? match.personalTotalDays : 3;
      const personalUsed = match ? match.personalUsedDays : 0;
      const personalAvail = Math.max(0, personalTotal - personalUsed);

      const sickTotal = match ? match.sickTotalDays : 10;
      const sickUsed = match ? match.sickUsedDays : 0;
      const sickAvail = Math.max(0, sickTotal - sickUsed);

      return {
        employee: emp,
        balanceId: match?.id || `bal_${emp.id}`,
        vacationRate: vRate,
        vacationTotalDays: vacationTotal,
        vacationUsedDays: vacationUsed,
        vacationAvailableDays: vacationAvail,
        vacationAvailableHours: vacationAvail * 8,
        personalTotalDays: personalTotal,
        personalUsedDays: personalUsed,
        personalAvailableDays: personalAvail,
        personalAvailableHours: personalAvail * 8,
        sickTotalDays: sickTotal,
        sickUsedDays: sickUsed,
        sickAvailableDays: sickAvail,
        rttHours: match?.rttCompensatoryHours || 0
      };
    });
  }, [employees, allLeaveBalances]);

  // Filter enriched balances
  const filteredBalances = useMemo(() => {
    return enrichedBalances.filter(item => {
      const nameMatch = `${item.employee.firstName} ${item.employee.lastName} ${item.employee.jobTitle || ''}`.toLowerCase().includes(balanceSearch.toLowerCase());
      const deptMatch = balanceDeptFilter === 'all' || item.employee.department === balanceDeptFilter;
      return nameMatch && deptMatch;
    });
  }, [enrichedBalances, balanceSearch, balanceDeptFilter]);

  // Aggregate Company Totals
  const totalAvailableVacation = enrichedBalances.reduce((sum, b) => sum + b.vacationAvailableDays, 0);
  const totalAvailablePersonal = enrichedBalances.reduce((sum, b) => sum + b.personalAvailableDays, 0);
  const totalAvailableSick = enrichedBalances.reduce((sum, b) => sum + b.sickAvailableDays, 0);

  // Filter requests
  const filteredRequests = leaveRequests.filter(req => {
    const matchEmp = selectedEmployeeId ? req.employeeId === selectedEmployeeId : true;
    const matchStatus = statusFilter === 'all' ? true : req.status === statusFilter;
    return matchEmp && matchStatus;
  });

  const getLeaveTypeBadge = (type: LeaveType) => {
    switch (type) {
      case 'vacation':
        return <span className="inline-flex items-center justify-center gap-1 max-w-full px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold tracking-tight bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap overflow-hidden">🏖️ <span className="truncate">{lt('Congé Annuel (Vacances)', 'Annual Vacation')}</span></span>;
      case 'sick':
        return <span className="inline-flex items-center justify-center gap-1 max-w-full px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold tracking-tight bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap overflow-hidden">🤒 <span className="truncate">{lt('Maladie / Médical', 'Sick Leave')}</span></span>;
      case 'personal':
        return <span className="inline-flex items-center justify-center gap-1 max-w-full px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold tracking-tight bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap overflow-hidden">👨‍👩‍👧 <span className="truncate">{lt('Obligations Familiales', 'Family Obligations')}</span></span>;
      case 'statutory_holiday':
        return <span className="inline-flex items-center justify-center gap-1 max-w-full px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold tracking-tight bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap overflow-hidden">🍁 <span className="truncate">{lt('Jour Férié Payé', 'Statutory Holiday')}</span></span>;
      case 'bereavement':
        return <span className="inline-flex items-center justify-center gap-1 max-w-full px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold tracking-tight bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap overflow-hidden">🕊️ <span className="truncate">{lt('Deuil / Événement', 'Bereavement')}</span></span>;
      case 'parental':
        return <span className="inline-flex items-center justify-center gap-1 max-w-full px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold tracking-tight bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap overflow-hidden">👶 <span className="truncate">{lt('Congé Parental', 'Parental Leave')}</span></span>;
      case 'unpaid':
        return <span className="inline-flex items-center justify-center gap-1 max-w-full px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold tracking-tight bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap overflow-hidden">⏱️ <span className="truncate">{lt('Sans Solde', 'Unpaid Leave')}</span></span>;
      default:
        return <span className="inline-flex items-center justify-center gap-1 max-w-full px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold tracking-tight bg-slate-100 text-slate-700 whitespace-nowrap overflow-hidden"><span className="truncate">{type}</span></span>;
    }
  };

  const getStatusBadge = (status: LeaveStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            {lt('Approuvé', 'Approved')}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" />
            {lt('Refusé', 'Rejected')}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
            {lt('Annulé', 'Cancelled')}
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 animate-pulse" />
            {lt('En attente RH', 'Pending HR')}
          </span>
        );
    }
  };

  const confirmRejection = async () => {
    if (!rejectingId) return;
    await onUpdateStatus(rejectingId, 'rejected', rejectReason);
    setRejectingId(null);
    setRejectReason('');
  };

  // Selected employee specific balance
  const activeBal = selectedEmp ? enrichedBalances.find(b => b.employee.id === selectedEmp.id) : null;
  const vacationRemaining = activeBal ? activeBal.vacationAvailableDays : 15;
  const vacationTotal = activeBal ? activeBal.vacationTotalDays : 15;
  const vacationUsed = activeBal ? activeBal.vacationUsedDays : 0;

  const personalRemaining = activeBal ? activeBal.personalAvailableDays : 3;
  const personalTotal = activeBal ? activeBal.personalTotalDays : 3;
  const personalUsed = activeBal ? activeBal.personalUsedDays : 0;

  const sickRemaining = activeBal ? activeBal.sickAvailableDays : 10;
  const sickTotal = activeBal ? activeBal.sickTotalDays : 10;
  const sickUsed = activeBal ? activeBal.sickUsedDays : 0;

  return (
    <div className="space-y-6">
      {/* Employee & Filter Control Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-600" />
            {lt('Collaborateur Actif :', 'Active Employee:')}
          </label>
          <select
            value={selectedEmployeeId}
            onChange={e => onSelectEmployee(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
          >
            <option value="">{lt('-- Vue d\'ensemble (Tous les employés) --', '-- Overview (All Employees) --')}</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} {emp.department ? `(${emp.department})` : ''}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {lt('Toutes', 'All')}
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {lt('En attente', 'Pending')}
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'approved' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {lt('Approuvées', 'Approved')}
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${statusFilter === 'rejected' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {lt('Refusées', 'Rejected')}
            </button>
          </div>
        </div>

        <button
          onClick={onOpenRequestModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{lt('Déposer une Demande de Congé', 'New Leave Request')}</span>
        </button>
      </div>

      {/* Available Leave Balances Overview (Focused vs Roster Mode) */}
      {selectedEmp ? (
        /* Focused Individual Employee Balance Cards */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                {lt(`Soldes de congés disponibles pour ${selectedEmp.firstName} ${selectedEmp.lastName}`, `Available leave balances for ${selectedEmp.firstName} ${selectedEmp.lastName}`)}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                {selectedEmp.jobTitle || lt('Employé', 'Employee')} · {selectedEmp.department || 'Général'}
              </span>
            </div>
            <button
              onClick={() => onSelectEmployee('')}
              className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              {lt('← Voir tous les employés', '← View all employees')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Vacation Balance */}
            <div className="p-5 rounded-2xl bg-white border border-blue-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                    🏖️ {lt('Congés Annuels Payés (Vacances)', 'Annual Paid Vacation')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-800 text-[10px] font-bold">
                    {((selectedEmp.vacationRate || 0.04) * 100).toFixed(0)}% CNESST
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-3xl font-black text-slate-900">
                    {vacationRemaining} <span className="text-xs font-bold text-slate-500">{lt('jours restants', 'days available')}</span>
                  </span>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                    {vacationRemaining * 8}h
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mb-3">
                  {vacationUsed} {lt('pris sur quota annuel de', 'used of')} {vacationTotal} {lt('jours', 'days')}
                </p>
              </div>
              <div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((vacationUsed / (vacationTotal || 15)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Personal / Family Balance */}
            <div className="p-5 rounded-2xl bg-white border border-amber-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50/50 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                    👨‍👩‍👧 {lt('Obligations Familiales & Personnelles', 'Family & Personal Leave')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100/70 text-amber-800 text-[10px] font-bold">
                    {lt('Art. 79.7 LNT', 'Sec 79.7 LNT')}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-3xl font-black text-slate-900">
                    {personalRemaining} <span className="text-xs font-bold text-slate-500">{lt('jours restants', 'days available')}</span>
                  </span>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                    {personalRemaining * 8}h
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mb-3">
                  {personalUsed} {lt('pris sur quota de', 'used of')} {personalTotal} {lt('jours (2 payés mini)', 'days (2 paid min)')}
                </p>
              </div>
              <div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((personalUsed / (personalTotal || 3)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Sick / Medical Balance */}
            <div className="p-5 rounded-2xl bg-white border border-rose-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 rounded-full blur-xl -mr-6 -mt-6 pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                    🤒 {lt('Maladie & Soins Médicaux', 'Sick & Medical Leave')}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100/70 text-rose-800 text-[10px] font-bold">
                    {lt('Loi Normes Travail', 'Labour Standards')}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-3xl font-black text-slate-900">
                    {sickRemaining} <span className="text-xs font-bold text-slate-500">{lt('jours restants', 'days available')}</span>
                  </span>
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                    {sickRemaining * 8}h
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mb-3">
                  {sickUsed} {lt('pris sur quota de', 'used of')} {sickTotal} {lt('jours', 'days')}
                </p>
              </div>
              <div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-rose-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, ((sickUsed / (sickTotal || 10)) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Company Roster Overview Cards & Directory */
        <div className="space-y-4">
          {/* Summary Metric Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-white border border-blue-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <Palmtree className="w-4 h-4 text-blue-600" />
                  {lt('Vacances Disponibles Globales', 'Total Company Vacation')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                  {enrichedBalances.length} {lt('employés', 'employees')}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{totalAvailableVacation}</span>
                <span className="text-xs font-bold text-slate-500">{lt('jours restants', 'days available')} ({totalAvailableVacation * 8}h)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/80 to-white border border-amber-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-amber-600" />
                  {lt('Congés Personnels & Famille', 'Personal & Family Days')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {lt('Normes LNT', 'CNESST Std')}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{totalAvailablePersonal}</span>
                <span className="text-xs font-bold text-slate-500">{lt('jours restants', 'days available')} ({totalAvailablePersonal * 8}h)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-50/80 to-white border border-rose-200 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-600" />
                  {lt('Congés Maladie Disponibles', 'Sick Leaves Available')}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                  {lt('Protection Santé', 'Medical')}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">{totalAvailableSick}</span>
                <span className="text-xs font-bold text-slate-500">{lt('jours restants', 'days available')}</span>
              </div>
            </div>
          </div>

          {/* Roster Leave Balances Directory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Palmtree className="w-4 h-4 text-blue-600" />
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    {lt('Soldes de Congés & Vacances par Collaborateur (Base de Données)', 'Employee Leave & Vacation Balances Directory')}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {lt('Suivi en temps réel des quotas de vacances, obligations familiales et congés maladie', 'Real-time tracking of vacation, family obligations, and sick leave quotas')}
                  </p>
                </div>
              </div>

              {/* Directory Filter & Search */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={lt('Rechercher un employé...', 'Search employee...')}
                    value={balanceSearch}
                    onChange={e => setBalanceSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-44 sm:w-56"
                  />
                </div>

                {departments.length > 0 && (
                  <select
                    value={balanceDeptFilter}
                    onChange={e => setBalanceDeptFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none"
                  >
                    <option value="all">{lt('Tous départements', 'All Depts')}</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">{lt('Collaborateur', 'Employee')}</th>
                    <th className="px-4 py-3">{lt('Département / Rôle', 'Department / Role')}</th>
                    <th className="px-4 py-3">{lt('Taux LNT', 'CNESST Rate')}</th>
                    <th className="px-4 py-3 text-center">{lt('Vacances Disponibles', 'Available Vacation')}</th>
                    <th className="px-4 py-3 text-center">{lt('Congés Personnels & Famille', 'Personal / Family Leave')}</th>
                    <th className="px-4 py-3 text-center">{lt('Maladie & Soins', 'Sick & Medical')}</th>
                    <th className="px-4 py-3 text-right">{lt('Actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredBalances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 text-xs font-medium">
                        {lt('Aucun employé trouvé pour cette recherche.', 'No employee found matching your search.')}
                      </td>
                    </tr>
                  ) : (
                    filteredBalances.map(item => (
                      <tr 
                        key={item.employee.id} 
                        className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                        onClick={() => onSelectEmployee(item.employee.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              {item.employee.firstName.charAt(0)}{item.employee.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {item.employee.firstName} {item.employee.lastName}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {item.employee.email || item.employee.phone || 'ID: ' + item.employee.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-700 block">
                            {item.employee.department || lt('Général', 'General')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {item.employee.jobTitle || lt('Poste non défini', 'Role not set')}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {(item.vacationRate * 100).toFixed(0)}% ({item.vacationTotalDays}j)
                          </span>
                        </td>

                        {/* Vacation Balance Column */}
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200">
                              🏖️ {item.vacationAvailableDays} {lt('jours', 'days')} ({item.vacationAvailableHours}h)
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {item.vacationUsedDays} {lt('utilisés sur', 'used of')} {item.vacationTotalDays}j
                            </span>
                          </div>
                        </td>

                        {/* Personal Leave Balance Column */}
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 text-amber-700 border border-amber-200">
                              👨‍👩‍👧 {item.personalAvailableDays} {lt('jours', 'days')} ({item.personalAvailableHours}h)
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {item.personalUsedDays} {lt('utilisés sur', 'used of')} {item.personalTotalDays}j
                            </span>
                          </div>
                        </td>

                        {/* Sick Balance Column */}
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                              🤒 {item.sickAvailableDays} {lt('jours', 'days')}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {item.sickUsedDays} {lt('utilisés sur', 'used of')} {item.sickTotalDays}j
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEmployee(item.employee.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title={lt('Filtrer sur cet employé', 'Filter on this employee')}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Leave Requests Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              {lt('Registre des Demandes de Congé & Absences', 'Leave & Absence Registry')}
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
              {filteredRequests.length}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="hidden md:table-header-group">
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="px-4 py-3">{lt('Collaborateur', 'Employee')}</th>
                <th className="px-4 py-3">{lt('Type de Congé', 'Type')}</th>
                <th className="px-4 py-3">{lt('Période (Début - Fin)', 'Period')}</th>
                <th className="px-4 py-3">{lt('Durée', 'Duration')}</th>
                <th className="px-4 py-3">{lt('Rémunéré', 'Paid')}</th>
                <th className="px-4 py-3">{lt('Motif / Détails', 'Reason')}</th>
                <th className="px-4 py-3">{lt('Statut', 'Status')}</th>
                <th className="px-4 py-3 text-right">{lt('Actions RH', 'HR Actions')}</th>
              </tr>
            </thead>
            <tbody className="block p-3 sm:p-4 bg-slate-50/50 md:bg-transparent md:p-0 md:table-row-group md:divide-y md:divide-slate-100 text-xs">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400 text-xs">
                    {lt('Aucune demande de congé enregistrée.', 'No leave request recorded.')}
                  </td>
                </tr>
              ) : (
                filteredRequests.map(req => (
                  <tr 
                    key={req.id} 
                    className="flex flex-col gap-3 p-4 sm:p-5 mb-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-xs md:table-row md:gap-0 md:p-0 md:mb-0 md:border-0 md:shadow-none md:rounded-none hover:bg-slate-50/60 transition-colors"
                  >
                    {/* Employee */}
                    <td className="flex justify-between items-center pb-2.5 border-b border-slate-100 md:border-0 md:pb-0 md:table-cell md:px-4 md:py-3">
                      <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400">{lt('Collaborateur', 'Employee')}</span>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm md:text-xs">{req.employeeName}</span>
                    </td>

                    {/* Leave Type */}
                    <td className="flex justify-between items-center py-1 md:table-cell md:px-4 md:py-3">
                      <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400">{lt('Type de Congé', 'Type')}</span>
                      {getLeaveTypeBadge(req.leaveType)}
                    </td>

                    {/* Period */}
                    <td className="flex justify-between items-center py-1 md:table-cell md:px-4 md:py-3">
                      <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400">{lt('Période', 'Period')}</span>
                      <span className="font-semibold text-slate-700 whitespace-nowrap bg-slate-100/80 md:bg-transparent px-2 py-0.5 md:p-0 rounded-md text-[11px] font-mono">{req.startDate} <span className="text-slate-400 mx-0.5">→</span> {req.endDate}</span>
                    </td>

                    {/* Duration */}
                    <td className="flex justify-between items-center py-1 md:table-cell md:px-4 md:py-3">
                      <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400">{lt('Durée', 'Duration')}</span>
                      <span className="font-black text-slate-900 whitespace-nowrap">{req.totalDays} {lt('j', 'days')} <span className="text-[11px] font-normal text-slate-400 ml-1">({req.totalHours}h)</span></span>
                    </td>

                    {/* Paid Status */}
                    <td className="flex justify-between items-center py-1 md:table-cell md:px-4 md:py-3">
                      <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400">{lt('Rémunéré', 'Paid')}</span>
                      {req.isPaid ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 shadow-2xs">
                          {lt('Payé (LNT)', 'Paid')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                          {lt('Sans solde', 'Unpaid')}
                        </span>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="flex justify-between items-start md:items-center py-1 md:table-cell md:px-4 md:py-3">
                      <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400 pt-0.5">{lt('Motif / Détails', 'Reason')}</span>
                      <span className="text-slate-600 max-w-[200px] sm:max-w-xs text-right md:text-left truncate block" title={req.reason}>
                        {req.reason || '-'}
                        {req.rejectionReason && (
                          <p className="text-[10px] text-red-600 font-semibold mt-0.5">
                            {lt('Refus :', 'Rejected:')} {req.rejectionReason}
                          </p>
                        )}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="flex justify-between items-center py-1 md:table-cell md:px-4 md:py-3">
                      <span className="md:hidden text-[10px] font-black uppercase tracking-wider text-slate-400">{lt('Statut', 'Status')}</span>
                      {getStatusBadge(req.status)}
                    </td>

                    {/* HR Actions */}
                    <td className="pt-3 mt-1 border-t border-slate-100 md:table-cell md:px-4 md:py-3 md:mt-0 md:pt-0 md:border-transparent text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {req.status === 'pending' && isAdmin && (
                          <>
                            <button
                              onClick={() => onUpdateStatus(req.id, 'approved')}
                              className="flex-1 md:flex-none py-2 px-3 md:p-1.5 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center justify-center gap-1.5 font-bold text-xs md:text-[10px] active:scale-98"
                              title={lt('Approuver et déduire du solde', 'Approve and deduct from balance')}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="md:hidden">{lt('Approuver', 'Approve')}</span>
                            </button>
                            <button
                              onClick={() => setRejectingId(req.id)}
                              className="py-2 px-3 md:p-1.5 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 bg-red-50/50 transition-colors flex items-center justify-center gap-1 font-bold text-xs md:text-[10px] active:scale-98"
                              title={lt('Refuser', 'Reject')}
                            >
                              <XCircle className="w-4 h-4" />
                              <span className="md:hidden">{lt('Refuser', 'Reject')}</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onDeleteRequest(req.id)}
                          className="py-2 px-3 md:p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 md:border-0 transition-colors flex items-center justify-center active:scale-98"
                          title={lt('Supprimer', 'Delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="md:hidden ml-1 text-xs">{lt('Supprimer', 'Delete')}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal Prompt */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h4 className="font-black text-sm text-slate-800">{lt('Motif du refus RH', 'HR Rejection Reason')}</h4>
            </div>
            <p className="text-xs text-slate-500">
              {lt('Veuillez indiquer au collaborateur la raison motivant le refus de sa demande :', 'Please enter a justification message for the employee:')}
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder={lt('Ex: Conflit avec la période de clôture fiscale...', 'E.g., Overlap with fiscal closing period...')}
              className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none resize-none"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {lt('Annuler', 'Cancel')}
              </button>
              <button
                onClick={confirmRejection}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {lt('Confirmer le refus', 'Confirm Rejection')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
