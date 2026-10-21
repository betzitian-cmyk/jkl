/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Employee, PayStub } from '../types';
import { X, User, Mail, Phone, MapPin, Calendar, CreditCard, ShieldCheck, DollarSign, Edit2, Trash2, FileText, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { useLanguage } from './LanguageContext';
import { PayStubModal } from './PayStubModal';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  employees: Employee[];
  payStubs: PayStub[];
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onPayStubCreated?: (stub: PayStub) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  employee,
  employees,
  payStubs,
  onEdit,
  onDelete,
  onPayStubCreated
}) => {
  const { language, t } = useLanguage();
  const isFr = language === 'fr';
  const [isGenerateStubOpen, setIsGenerateStubOpen] = useState(false);

  if (!isOpen || !employee) return null;

  const empStubs = payStubs.filter(s => s.employeeId === employee.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl uppercase shadow-lg border-2 border-white/20 shrink-0">
                {employee.firstName[0]}{employee.lastName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {employee.firstName} {employee.lastName}
                  </h2>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    employee.onboardingStatus === 'completed' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}>
                    {employee.onboardingStatus === 'completed' ? t('completed') : t('incomplete')}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {employee.jobTitle || (isFr ? 'Employé' : 'Employee')} &bull; {employee.department || 'Général'}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  NAS / SIN: {employee.sin ? employee.sin.replace(/.(?=.{4})/g, '*') : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              <button
                onClick={() => {
                  onClose();
                  onEdit(employee);
                }}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                {t('edit')}
              </button>
              <button
                onClick={() => setIsGenerateStubOpen(true)}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg active:scale-95"
              >
                <FileText className="w-3.5 h-3.5" />
                {isFr ? 'Créer un bulletin' : 'Generate Stub'}
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Contact & Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                {t('contact_info')}
              </h4>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold">{employee.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold">{employee.phone || 'N/A'}</span>
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{employee.address || 'N/A'}</p>
                    {employee.city && <p>{employee.city}, {employee.province || 'QC'} {employee.postalCode}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Compensation & Pay Frequency */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                {isFr ? 'Rémunération & Fréquence' : 'Pay Rate & Frequency'}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{isFr ? 'Type de Paie' : 'Pay Type'}</p>
                  <p className="font-bold text-slate-800 capitalize">
                    {employee.compensationType === 'hourly' ? (isFr ? 'Taux Horaire' : 'Hourly Rate') : (isFr ? 'Salaire Annuel' : 'Annual Salary')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{isFr ? 'Taux / Salaire' : 'Rate / Salary'}</p>
                  <p className="font-extrabold text-emerald-700 text-sm">
                    {employee.compensationType === 'hourly'
                      ? `${formatCurrency(employee.hourlyRate || 0)}/h`
                      : formatCurrency(employee.baseSalary || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{t('frequency')}</p>
                  <p className="font-bold text-slate-800 capitalize">{employee.frequency}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{t('start_date')}</p>
                  <p className="font-bold text-slate-800">{employee.startDate || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Tax Profile & Direct Deposit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                {isFr ? 'Profil Fiscal & Crédits' : 'Tax Profile & Claims'}
              </h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p>
                  <span className="font-semibold">TD1 Fédéral:</span> {employee.claimFederalBasicPersonalAmount ? (isFr ? 'Crédit de base demandé' : 'Basic claim active') : (isFr ? 'Sans crédit de base' : 'No basic claim')}
                </p>
                <p>
                  <span className="font-semibold">TP-1015.3 Québec:</span> Code Ligne 10: <span className="font-bold">{employee.quebecTp1015Line10Code || 'A'}</span>
                </p>
                {employee.hasMultipleEmployers && (
                  <p className="text-amber-700 font-bold text-[11px]">⚠️ Plusieurs employeurs actifs (Crédit $0)</p>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                {isFr ? 'Coordonnées de Dépôt Direct' : 'Direct Deposit Information'}
              </h4>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p><span className="font-semibold">Mode:</span> {employee.paymentMethod === 'direct_deposit' ? (isFr ? 'Dépôt direct' : 'Direct Deposit') : 'Chèque'}</p>
                <p><span className="font-semibold">Institution:</span> {employee.bankName || 'N/A'}</p>
                <p className="font-mono"><span className="font-semibold font-sans">Compte / Account:</span> {employee.accountNumber ? `••••${employee.accountNumber.slice(-4)}` : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Section 4: Recent Pay Stubs History for this employee */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                {isFr ? 'Bulletins de Paie Récents' : 'Recent Pay Stubs'} ({empStubs.length})
              </h4>
              <button
                onClick={() => setIsGenerateStubOpen(true)}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
              >
                + {isFr ? 'Générer un bulletin' : 'New Stub'}
              </button>
            </div>

            {empStubs.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-slate-400 text-xs">
                {isFr ? 'Aucun bulletin de paie généré pour cet employé.' : 'No pay stubs generated for this employee yet.'}
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {empStubs.map(stub => (
                  <div key={stub.id} className="p-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-xs hover:border-blue-200 transition">
                    <div>
                      <p className="font-bold text-slate-800">{stub.payPeriod}</p>
                      <p className="text-[10px] text-slate-400">Date: {stub.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">{t('net_pay')}</p>
                      <p className="font-extrabold text-emerald-600 text-sm">{formatCurrency(stub.netPay)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={() => {
              if (confirm(isFr ? `Êtes-vous sûr de vouloir supprimer ${employee.firstName} ${employee.lastName} ?` : `Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`)) {
                onDelete(employee.id);
                onClose();
              }
            }}
            className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800 transition"
          >
            <Trash2 className="w-4 h-4" />
            {t('delete')}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl uppercase transition"
          >
            {isFr ? 'Fermer' : 'Close'}
          </button>
        </div>
      </div>

      <PayStubModal
        isOpen={isGenerateStubOpen}
        onClose={() => setIsGenerateStubOpen(false)}
        employee={employee}
        employees={employees}
        onPayStubCreated={onPayStubCreated}
      />
    </div>
  );
};
