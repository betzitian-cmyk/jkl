/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Employee, TimeEntry, LeaveRequest, EmployeeLeaveBalance, LeaveType, TimeEntryType } from '../types';
import { Storage } from '../lib/storage';
import { useLanguage } from './LanguageContext';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  Calendar, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  UserCheck, 
  BarChart3, 
  CalendarDays,
  FileSpreadsheet,
  Palmtree
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TimesheetTrackerTab } from './timesheet/TimesheetTrackerTab';
import { LeaveAbsenceTab } from './timesheet/LeaveAbsenceTab';
import { StatutoryHolidaysTab } from './timesheet/StatutoryHolidaysTab';
import { LeaveRequestModal } from './timesheet/LeaveRequestModal';

export interface TimesheetManagerProps {
  employees: Employee[];
  onApplyHours: (employeeId: string, regularHours: number, overtimeHours: number) => void;
}

export const TimesheetManager: React.FC<TimesheetManagerProps> = ({
  employees,
  onApplyHours
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const lt = (fr: string, en: string) => isFr ? fr : en;
  const { userProfile, role } = useAuth();
  const isAdmin = role === 'admin' || !role; // default true for power tools

  const [activeTab, setActiveTab] = useState<'tracker' | 'leaves' | 'holidays'>('tracker');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employees[0]?.id || '');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<EmployeeLeaveBalance | null>(null);
  const [allLeaveBalances, setAllLeaveBalances] = useState<EmployeeLeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all time data and leave balances from backend
  const loadData = useCallback(async () => {
    try {
      const [timesheetData, leavesData, allBals] = await Promise.all([
        Storage.getTimesheets(),
        Storage.getLeaveRequests(),
        Storage.getAllLeaveBalances()
      ]);
      setEntries(timesheetData || []);
      setLeaveRequests(leavesData || []);
      setAllLeaveBalances(allBals || []);

      if (selectedEmployeeId) {
        const found = (allBals || []).find(b => b.employeeId === selectedEmployeeId);
        if (found) {
          setLeaveBalance(found);
        } else {
          const bal = await Storage.getLeaveBalance(selectedEmployeeId);
          setLeaveBalance(bal);
        }
      }
    } catch (err) {
      console.error('Failed to load timesheet & leave data', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedEmployeeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // When selected employee changes, update balance
  useEffect(() => {
    if (selectedEmployeeId) {
      const found = allLeaveBalances.find(b => b.employeeId === selectedEmployeeId);
      if (found) {
        setLeaveBalance(found);
      } else {
        Storage.getLeaveBalance(selectedEmployeeId).then(bal => {
          setLeaveBalance(bal);
        });
      }
    }
  }, [selectedEmployeeId, allLeaveBalances]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  // Time Entry Handlers
  const handleAddEntry = async (entryData: {
    employeeId: string;
    date: string;
    hours: number;
    entryType: TimeEntryType;
    projectTask?: string;
    billable: boolean;
    hourlyRate?: number;
    notes?: string;
  }) => {
    const saved = await Storage.saveTimesheetEntry(entryData);
    if (saved) {
      setEntries(prev => [saved, ...prev]);
    }
  };

  const handleApproveEntry = async (id: string) => {
    const ok = await Storage.approveTimesheetEntry(id, userProfile?.displayName || 'Admin RH');
    if (ok) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e));
    }
  };

  const handleDeleteEntry = async (id: string) => {
    const ok = await Storage.deleteTimesheetEntry(id);
    if (ok) {
      setEntries(prev => prev.filter(e => e.id !== id));
    }
  };

  // Leave Request Handlers
  const handleCreateLeaveRequest = async (requestData: {
    employeeId: string;
    employeeName: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    totalDays: number;
    totalHours: number;
    isPaid: boolean;
    reason?: string;
  }) => {
    const saved = await Storage.createLeaveRequest(requestData);
    if (saved) {
      setLeaveRequests(prev => [saved, ...prev]);
      // Refresh balances across all employees
      const updatedAllBals = await Storage.getAllLeaveBalances();
      setAllLeaveBalances(updatedAllBals);
      if (saved.employeeId === selectedEmployeeId) {
        const updatedBal = updatedAllBals.find(b => b.employeeId === saved.employeeId) || await Storage.getLeaveBalance(saved.employeeId);
        setLeaveBalance(updatedBal);
      }
    }
  };

  const handleUpdateLeaveStatus = async (
    id: string, 
    status: 'approved' | 'rejected' | 'cancelled', 
    rejectionReason?: string
  ) => {
    const ok = await Storage.updateLeaveStatus(
      id, 
      status, 
      userProfile?.displayName || 'Direction RH', 
      rejectionReason
    );
    if (ok) {
      setLeaveRequests(prev => prev.map(l => l.id === id ? { ...l, status, rejectionReason } : l));
      // Refresh balances
      const updatedAllBals = await Storage.getAllLeaveBalances();
      setAllLeaveBalances(updatedAllBals);
      if (selectedEmployeeId) {
        const updatedBal = updatedAllBals.find(b => b.employeeId === selectedEmployeeId) || await Storage.getLeaveBalance(selectedEmployeeId);
        setLeaveBalance(updatedBal);
      }
    }
  };

  const handleDeleteLeaveRequest = async (id: string) => {
    const ok = await Storage.deleteLeaveRequest(id);
    if (ok) {
      setLeaveRequests(prev => prev.filter(l => l.id !== id));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Dashboard Executive Summary */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-black border border-blue-200 uppercase tracking-wider">
              {lt('Gestion du Temps & Congés', 'Time & Leave Management')}
            </span>
            <span className="text-xs font-semibold text-slate-400">
              • {lt('Normes du Travail Québec (CNESST / LNT)', 'Quebec Labour Standards Act')}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            {lt('Feuilles de Temps, Absences & Congés', 'Timesheets, Leaves & Absences')}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {lt(
              'Enregistrement des heures, gestion des banques de congés payés / personnels et jours fériés 2026.',
              'Track working hours, manage paid vacation & personal leave quotas, and review 2026 statutory holidays.'
            )}
          </p>
        </div>

        {/* Global Action Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Palmtree className="w-4 h-4" />
            <span>{lt('Demande de Congé', 'Request Leave')}</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer flex items-center gap-2 text-xs font-bold"
            title={lt('Actualiser les données', 'Refresh data')}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{lt('Actualiser', 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Navigation Dropdown Menu */}
      <div className="relative inline-block text-left">
        {/* Dropdown Toggle Button */}
        <div>
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-xs transition-all hover:bg-blue-700 cursor-pointer"
            id="menu-button"
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            {lt('Gestion du Temps & Congés', 'Time & Leave Management')}
            <svg className="-mr-1 h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
            <div
              className="absolute left-0 z-20 mt-2 w-64 origin-top-left rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="menu-button"
              tabIndex={-1}
            >
              <div className="py-1" role="none">
                <button
                  type="button"
                  onClick={() => { setActiveTab('tracker'); setIsDropdownOpen(false); }}
                  className={`flex w-full items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors text-left cursor-pointer ${
                    activeTab === 'tracker' ? 'bg-slate-100 text-blue-600 font-extrabold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  role="menuitem"
                  tabIndex={-1}
                  id="menu-item-0"
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>{lt('Feuilles de Temps', 'Timesheets')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('leaves'); setIsDropdownOpen(false); }}
                  className={`flex w-full items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors text-left cursor-pointer ${
                    activeTab === 'leaves' ? 'bg-slate-100 text-blue-600 font-extrabold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  role="menuitem"
                  tabIndex={-1}
                  id="menu-item-1"
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>{lt('Absences & Soldes (LNT)', 'Leaves & Balances')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveTab('holidays'); setIsDropdownOpen(false); }}
                  className={`flex w-full items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider transition-colors text-left cursor-pointer ${
                    activeTab === 'holidays' ? 'bg-slate-100 text-blue-600 font-extrabold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  role="menuitem"
                  tabIndex={-1}
                  id="menu-item-2"
                >
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  <span>{lt('Jours Fériés Québec 2026', 'Statutory Holidays')}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Active Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'tracker' && (
          <motion.div
            key="tracker"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <TimesheetTrackerTab
              entries={entries}
              employees={employees}
              selectedEmployeeId={selectedEmployeeId}
              leaveBalance={leaveBalance}
              allLeaveBalances={allLeaveBalances}
              onSelectEmployee={setSelectedEmployeeId}
              onAddEntry={handleAddEntry}
              onApproveEntry={handleApproveEntry}
              onDeleteEntry={handleDeleteEntry}
              onApplyHoursToPayroll={onApplyHours}
              isAdmin={isAdmin}
            />
          </motion.div>
        )}

        {activeTab === 'leaves' && (
          <motion.div
            key="leaves"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <LeaveAbsenceTab
              leaveRequests={leaveRequests}
              leaveBalance={leaveBalance}
              allLeaveBalances={allLeaveBalances}
              employees={employees}
              selectedEmployeeId={selectedEmployeeId}
              onSelectEmployee={setSelectedEmployeeId}
              onOpenRequestModal={() => setIsModalOpen(true)}
              onUpdateStatus={handleUpdateLeaveStatus}
              onDeleteRequest={handleDeleteLeaveRequest}
              isAdmin={isAdmin}
            />
          </motion.div>
        )}

        {activeTab === 'holidays' && (
          <motion.div
            key="holidays"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <StatutoryHolidaysTab />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal for Submitting New Leave / Absence */}
      <LeaveRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateLeaveRequest}
        employees={employees}
        defaultEmployeeId={selectedEmployeeId}
        allLeaveBalances={allLeaveBalances}
      />
    </div>
  );
};
