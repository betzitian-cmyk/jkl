/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Briefcase, 
  Building2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  FileCheck, 
  CreditCard,
  ChevronRight,
  ChevronDown,
  Calculator,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { Employee, EmploymentType } from '../../types';

interface DashboardEmployeeWidgetsProps {
  employees: Employee[];
  isFr: boolean;
  onNavigate?: (view: any) => void;
}

export const DashboardEmployeeWidgets: React.FC<DashboardEmployeeWidgetsProps> = ({
  employees,
  isFr,
  onNavigate
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'roster' | 'onboarding' | 'structure'>('roster');

  // Stats
  const totalEmployees = employees.length;
  const completedOnboarding = employees.filter(e => e.onboardingStatus === 'completed');
  const incompleteOnboarding = employees.filter(e => e.onboardingStatus !== 'completed');
  const onboardingPct = totalEmployees > 0 
    ? Math.round((completedOnboarding.length / totalEmployees) * 100) 
    : 100;

  // Employment types
  const fullTimeCount = employees.filter(e => e.employmentType === 'full-time').length;
  const partTimeCount = employees.filter(e => e.employmentType === 'part-time').length;
  const contractCount = employees.filter(e => e.employmentType === 'contract').length;

  // Department groupings
  const departmentCounts = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach(emp => {
      const d = emp.department || (isFr ? 'Général' : 'General');
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [employees, isFr]);

  const formatCAD = (num: number) => {
    return num.toLocaleString(isFr ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5">
      {/* Header with Quick Action */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-slate-900 whitespace-normal break-words leading-snug">
              {isFr ? 'Gestion du Personnel & Conformité RH' : 'Workforce & HR Management'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed whitespace-normal break-words">
              {isFr 
                ? 'Effectif actif, intégration des dossiers fiscaux et répartition des départements' 
                : 'Active roster, tax file compliance, and department structure'}
            </p>
          </div>
        </div>

        {/* Centered Modern Single-Line Manage Button */}
        <div className="flex justify-center w-full">
          <button
            onClick={() => onNavigate?.('employees')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold tracking-wide shadow-sm hover:shadow transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">{isFr ? 'Gérer les employés' : 'Manage Employees'}</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Switcher (Converted to Dropdown Menu) */}
      <div className="relative w-full sm:w-72">
        <label htmlFor="subtab-select" className="sr-only">
          {isFr ? 'Sélectionner une vue' : 'Select View'}
        </label>
        <div className="relative flex items-center">
          <select
            id="subtab-select"
            value={activeSubTab}
            onChange={(e) => setActiveSubTab(e.target.value as 'roster' | 'onboarding' | 'structure')}
            className="w-full appearance-none bg-slate-100 text-slate-900 text-xs font-bold py-2.5 pl-3.5 pr-10 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
          >
            <option value="roster">
              {isFr ? 'Annuaire & Rémunération' : 'Roster & Compensation'}
            </option>
            <option value="onboarding">
              {isFr ? 'Conformité & Intégration' : 'Compliance & Onboarding'} {incompleteOnboarding.length > 0 ? '•' : ''}
            </option>
            <option value="structure">
              {isFr ? 'Départements & Postes' : 'Departments & Roles'}
            </option>
          </select>
          <div className="absolute right-3 pointer-events-none text-slate-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Sub-tab 1: Roster View */}
      {activeSubTab === 'roster' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {employees.slice(0, 6).map(employee => {
              const fullName = `${employee.firstName} ${employee.lastName}`;
              const initials = `${employee.firstName[0] || ''}${employee.lastName[0] || ''}`.toUpperCase();
              const isComplete = employee.onboardingStatus === 'completed';

              return (
                <div
                  key={employee.id}
                  onClick={() => onNavigate?.('employees')}
                  className="p-3.5 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/30 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  {/* Left: Avatar Icon + Name & Details */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-200 group-hover:scale-105 transition-transform">
                      {initials}
                    </div>
                    <div className="min-w-0 flex flex-col space-y-0.5">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {fullName}
                      </p>
                      <p className="text-[11px] text-slate-600 font-medium truncate">
                        {employee.jobTitle || (isFr ? 'Employé' : 'Employee')}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {employee.department || (isFr ? 'Général' : 'General')}
                      </p>
                      <p className="text-[10px] text-purple-600 font-medium truncate">
                        {employee.employmentType === 'full-time' ? (isFr ? 'Temps plein' : 'Full-time') : (isFr ? 'Temps partiel' : 'Part-time')} {employee.frequency}
                      </p>
                    </div>
                  </div>

                  {/* Right: Vertically Centered Complete/Active Status Badge */}
                  <div className="flex items-center shrink-0 self-center">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase transition-all ${
                      isComplete 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {isComplete ? (isFr ? 'Actif' : 'Active') : (isFr ? 'À compléter' : 'Pending')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {employees.length > 6 && (
            <div className="text-center pt-2">
              <button
                onClick={() => onNavigate?.('employees')}
                className="text-xs font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{isFr ? `Voir les ${employees.length} employés dans l'annuaire complet` : `View all ${employees.length} employees`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 2: Onboarding & Compliance View */}
      {activeSubTab === 'onboarding' && (
        <div className="space-y-4">
          {/* Progress Bar Header */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                {isFr ? 'Taux de Conformité des Dossiers Salariaux' : 'Employee File Compliance Rate'}
              </span>
              <span className="font-black text-purple-700">{onboardingPct}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${onboardingPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>{completedOnboarding.length} {isFr ? 'dossiers certifiés complets' : 'completed files'}</span>
              <span>{incompleteOnboarding.length} {isFr ? 'dossiers à finaliser' : 'pending files'}</span>
            </div>
          </div>

          {/* Compliance Checklist Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>TD1 & TP-1015.3</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isFr ? 'Déclarations des crédits fiscaux personnels du Canada et du Québec.' : 'Federal and provincial personal tax credits setup.'}
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>{isFr ? 'Dépôt Direct' : 'Direct Deposit'}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isFr ? 'Spécimens de chèque et transit bancaire pour les versements automatisés.' : 'Banking transit, institution, and account setup.'}
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>CNESST & Normes</span>
              </div>
              <p className="text-[11px] text-slate-500">
                {isFr ? 'Code d\'unité de classification et taux de cotisation pour santé et sécurité.' : 'Worker compensation unit classification and safety standards.'}
              </p>
            </div>
          </div>

          {/* Pending Action List */}
          {incompleteOnboarding.length > 0 && (
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>{isFr ? 'Employés avec formulaires manquants :' : 'Employees with missing forms:'}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {incompleteOnboarding.map(emp => (
                  <span
                    key={emp.id}
                    onClick={() => onNavigate?.('onboarding')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg border border-amber-300 text-amber-900 font-medium hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <span>{emp.firstName} {emp.lastName}</span>
                    <ArrowRight className="w-3 h-3 text-amber-600" />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-tab 3: Structure & Departments */}
      {activeSubTab === 'structure' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Employment Types */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {isFr ? 'Types de Contrat' : 'Employment Types'}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">{isFr ? 'Temps Plein' : 'Full-Time'}</span>
                  <span className="font-bold text-slate-900">{fullTimeCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">{isFr ? 'Temps Partiel' : 'Part-Time'}</span>
                  <span className="font-bold text-slate-900">{partTimeCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">{isFr ? 'Contractuels' : 'Contractors'}</span>
                  <span className="font-bold text-slate-900">{contractCount}</span>
                </div>
              </div>
            </div>

            {/* Department Breakdown */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                {isFr ? 'Répartition par Département' : 'Department Breakdown'}
              </h4>
              <div className="space-y-2">
                {departmentCounts.map(([dept, count]) => (
                  <div key={dept} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium truncate pr-2">{dept}</span>
                    <span className="font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-md text-[11px]">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick HR & Operational Shortcuts */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => onNavigate?.('calculator')}
          className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-200 border border-slate-100 transition-all text-left group cursor-pointer"
        >
          <Calculator className="w-4 h-4 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
            {isFr ? 'Calculer une Paie' : 'Run Payroll'}
          </p>
          <p className="text-[10px] text-slate-400">
            {isFr ? 'Calculateur 2026' : '2026 Engine'}
          </p>
        </button>

        <button
          onClick={() => onNavigate?.('timesheets')}
          className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-slate-100 transition-all text-left group cursor-pointer"
        >
          <Clock className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
            {isFr ? 'Feuilles de Temps' : 'Timesheets'}
          </p>
          <p className="text-[10px] text-slate-400">
            {isFr ? 'Heures & Primes' : 'Hours & Overtime'}
          </p>
        </button>

        <button
          onClick={() => onNavigate?.('onboarding')}
          className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 hover:border-purple-200 border border-slate-100 transition-all text-left group cursor-pointer"
        >
          <FileText className="w-4 h-4 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-bold text-slate-800 group-hover:text-purple-700">
            {isFr ? 'Dossiers RH' : 'HR Onboarding'}
          </p>
          <p className="text-[10px] text-slate-400">
            {isFr ? 'Formulaires TD1' : 'Tax Forms'}
          </p>
        </button>

        <button
          onClick={() => onNavigate?.('reports')}
          className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-200 border border-slate-100 transition-all text-left group cursor-pointer"
        >
          <Briefcase className="w-4 h-4 text-amber-600 mb-1 group-hover:scale-110 transition-transform" />
          <p className="text-xs font-bold text-slate-800 group-hover:text-amber-700">
            {isFr ? 'Rapports Fiscaux' : 'Tax Reports'}
          </p>
          <p className="text-[10px] text-slate-400">
            {isFr ? 'T4 & Relevé 1' : 'T4 & RL-1'}
          </p>
        </button>
      </div>
    </div>
  );
};