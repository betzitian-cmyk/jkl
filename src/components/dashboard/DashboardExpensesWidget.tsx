/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Receipt, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowRight, 
  Navigation, 
  FileText, 
  DollarSign, 
  Check, 
  X, 
  CreditCard,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BusinessExpense, ExpenseStatus } from '../../types';
import { Storage } from '../../lib/storage';

interface DashboardExpensesWidgetProps {
  expenses: BusinessExpense[];
  isFr: boolean;
  onNavigate?: (view: any) => void;
  onRefreshExpenses: () => Promise<void>;
  userDisplayName?: string;
}

export const DashboardExpensesWidget: React.FC<DashboardExpensesWidgetProps> = ({
  expenses,
  isFr,
  onNavigate,
  onRefreshExpenses,
  userDisplayName = 'Admin Direction'
}) => {
  const [selectedStatuses, setSelectedStatuses] = useState<('all' | ExpenseStatus)[]>(['all']);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [detailModalExpense, setDetailModalExpense] = useState<BusinessExpense | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Status counts
  const counts = useMemo(() => {
    return {
      all: expenses.length,
      pending: expenses.filter(e => (e.status || 'pending_approval') === 'pending_approval').length,
      approved: expenses.filter(e => e.status === 'approved').length,
      reimbursed: expenses.filter(e => e.status === 'reimbursed').length,
      rejected: expenses.filter(e => e.status === 'rejected').length,
    };
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const eStatus = (e.status || 'pending_approval') as ExpenseStatus;
      
      if (!selectedStatuses.includes('all') && !selectedStatuses.includes(eStatus)) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (e.employeeName || '').toLowerCase().includes(q);
        const matchDesc = (e.description || '').toLowerCase().includes(q);
        const matchCat = (e.category || '').toLowerCase().includes(q);
        const matchRef = (e.sourceId || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat && !matchRef) return false;
      }
      return true;
    });
  }, [expenses, selectedStatuses, searchQuery]);

  // Format currency
  const formatCAD = (num: number) => {
    return num.toLocaleString(isFr ? 'fr-CA' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 2
    });
  };

  // Toggle status selection in multiple choice dropdown
  const toggleStatus = (status: 'all' | ExpenseStatus) => {
    if (status === 'all') {
      setSelectedStatuses(['all']);
      return;
    }

    let updated = selectedStatuses.filter(s => s !== 'all');
    if (updated.includes(status)) {
      updated = updated.filter(s => s !== status);
    } else {
      updated.push(status);
    }

    if (updated.length === 0) {
      setSelectedStatuses(['all']);
    } else {
      setSelectedStatuses(updated);
    }
  };

  // Quick Approve
  const handleQuickApprove = async (e: React.MouseEvent, expense: BusinessExpense) => {
    e.stopPropagation();
    setProcessingId(expense.id);
    try {
      await Storage.approveExpense(expense.id, 'Validé depuis le Tableau de Bord RH', userDisplayName);
      setActionFeedback(isFr ? `Note de ${expense.employeeName || 'l\'employé'} approuvée !` : `Expense approved!`);
      await onRefreshExpenses();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'approbation');
    } finally {
      setProcessingId(null);
    }
  };

  // Quick Reject
  const handleQuickReject = async (e: React.MouseEvent, expense: BusinessExpense) => {
    e.stopPropagation();
    const reason = window.prompt(
      isFr ? 'Raison du refus de la dépense :' : 'Reason for rejection:',
      isFr ? 'Justificatif non conforme ou montant à vérifier' : 'Missing documentation'
    );
    if (reason === null) return;
    setProcessingId(expense.id);
    try {
      await Storage.rejectExpense(expense.id, reason, userDisplayName);
      setActionFeedback(isFr ? `Note de frais refusée.` : `Expense rejected.`);
      await onRefreshExpenses();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du refus');
    } finally {
      setProcessingId(null);
    }
  };

  // Quick Reimburse
  const handleQuickReimburse = async (e: React.MouseEvent, expense: BusinessExpense) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      isFr 
        ? `Confirmer le remboursement de ${formatCAD(expense.amount)} à ${expense.employeeName || 'l\'employé'} via dépôt direct ?` 
        : `Confirm reimbursement of ${formatCAD(expense.amount)} via direct deposit?`
    );
    if (!confirmed) return;
    setProcessingId(expense.id);
    try {
      await Storage.reimburseExpense(expense.id, {
        method: 'Dépôt direct de paie (Direct Deposit)',
        ref: `REIMB-${Date.now().toString().slice(-6)}`,
        reimbursedBy: userDisplayName
      });
      setActionFeedback(isFr ? `Remboursement de ${formatCAD(expense.amount)} validé !` : `Reimbursement recorded!`);
      await onRefreshExpenses();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du remboursement');
    } finally {
      setProcessingId(null);
    }
  };

  const statusOptions: { id: 'all' | ExpenseStatus; labelFr: string; labelEn: string; count: number }[] = [
    { id: 'all', labelFr: 'Toutes', labelEn: 'All', count: counts.all },
    { id: 'pending_approval', labelFr: 'En attente', labelEn: 'Pending', count: counts.pending },
    { id: 'approved', labelFr: 'Approuvées', labelEn: 'Approved', count: counts.approved },
    { id: 'reimbursed', labelFr: 'Remboursées', labelEn: 'Reimbursed', count: counts.reimbursed },
    { id: 'rejected', labelFr: 'Rejetées', labelEn: 'Rejected', count: counts.rejected },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 space-y-5">
      {/* Header & Main Nav Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50/80 text-amber-700 border border-amber-200/50 shrink-0 shadow-2xs">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                {isFr ? 'Notes de Frais & Indemnités des Employés' : 'Employee Submitted Expenses & Claims'}
              </h3>
              {/* Action badge removed per user request */}
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-snug">
              {isFr 
                ? 'Suivi du statut en temps réel (CRA/RQ 0,70 $/km, factures audités et justificatifs)' 
                : 'Real-time status tracking (CRA/RQ 0.70 $/km, audited invoices and receipts)'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate?.('expenses')}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-xs cursor-pointer w-full sm:w-auto shrink-0"
        >
          <span>{isFr ? 'Gérer toutes les dépenses' : 'Manage all expenses'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action Notification Banner */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
            <button 
              onClick={() => setActionFeedback(null)}
              className="text-emerald-600 hover:text-emerald-900 cursor-pointer text-xs p-1"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter Controls: Modernized Multiple Choice Dropdown with Checkmarks */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Custom Multiple Choice Dropdown */}
        <div className="relative w-full sm:w-64" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-2xs"
          >
            <div className="flex items-center gap-2 truncate">
              <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="truncate">
                {selectedStatuses.includes('all') 
                  ? (isFr ? 'Tous les statuts' : 'All Statuses')
                  : `${selectedStatuses.length} ${isFr ? 'sélectionné(s)' : 'selected'}`}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-slate-200/80 rounded-xl shadow-xl overflow-hidden py-1 text-xs"
              >
                {statusOptions.map((opt) => {
                  const isChecked = selectedStatuses.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleStatus(opt.id)}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                          isChecked 
                            ? 'bg-blue-600 border-blue-600 text-white' 
                            : 'border-slate-300 bg-white group-hover:border-slate-400'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className={`font-medium truncate ${isChecked ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                          {isFr ? opt.labelFr : opt.labelEn}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full ml-2 shrink-0">
                        {opt.count}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={isFr ? 'Rechercher employé, note...' : 'Search employee, note...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white text-slate-800 font-medium transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Expense Cards / List */}
      <div className="space-y-3">
        {filteredExpenses.length > 0 ? (
          filteredExpenses.slice(0, 8).map((expense) => {
            const status = expense.status || 'pending_approval';
            const isGps = expense.source === 'gps_triplog';
            const isInvoice = expense.source === 'invoice_audit';
            const isProcessing = processingId === expense.id;

            return (
              <motion.div
                key={expense.id}
                layout
                onClick={() => setDetailModalExpense(expense)}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col gap-3 cursor-pointer group bg-white"
              >
                {/* Row 1: Submitter on its own line */}
                <div>
                  <span className="text-sm font-bold text-slate-900 block truncate">
                    {expense.employeeName || (isFr ? 'Employé non spécifié' : 'Unassigned')}
                  </span>
                </div>

                {/* Row 2: Source Badge on its own line */}
                <div>
                  {isGps ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200/80">
                      <Navigation className="w-3 h-3 text-emerald-600" />
                      <span>GPS TripLog</span>
                      {expense.sourceId && <span className="text-emerald-700 font-mono">#{expense.sourceId.replace('trip_', '')}</span>}
                    </span>
                  ) : isInvoice ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200/80">
                      <FileText className="w-3 h-3 text-blue-600" />
                      <span>Audit Facture</span>
                      {expense.sourceId && <span className="font-mono">#{expense.sourceId}</span>}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200/60">
                      {isFr ? 'Saisie Manuelle' : 'Manual'}
                    </span>
                  )}
                </div>

                {/* Row 3: Description & Category */}
                <div>
                  <p className="text-xs text-slate-700 font-medium truncate">
                    {expense.description}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {expense.category} • {expense.date}
                  </p>
                </div>

                {/* Row 4: Amount & Status on their own line */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <p className="text-base font-black text-slate-900 tracking-tight leading-none">
                      {formatCAD(expense.amount)}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                      {isFr ? 'Montant réclamé' : 'Claim amount'}
                    </p>
                  </div>

                  {/* Refactored "En attente" status badge to fit on 1 single line */}
                  <div className="shrink-0">
                    {status === 'pending_approval' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold whitespace-nowrap leading-none">
                        <Clock className="w-3 h-3 text-amber-600 animate-spin-slow shrink-0" />
                        <span className="whitespace-nowrap">{isFr ? 'En attente' : 'Pending'}</span>
                      </span>
                    )}

                    {status === 'approved' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold whitespace-nowrap leading-none">
                        <Check className="w-3 h-3 text-blue-600 shrink-0" />
                        <span className="whitespace-nowrap">{isFr ? 'Approuvé' : 'Approved'}</span>
                      </span>
                    )}

                    {status === 'reimbursed' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold whitespace-nowrap leading-none">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="whitespace-nowrap">{isFr ? 'Remboursé' : 'Reimbursed'}</span>
                      </span>
                    )}

                    {status === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold whitespace-nowrap leading-none">
                        <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                        <span className="whitespace-nowrap">{isFr ? 'Rejeté' : 'Rejected'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100 text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs font-medium">
              {isFr ? 'Aucune note de frais ne correspond aux filtres sélectionnés.' : 'No expenses match the current filter.'}
            </p>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs border-t border-slate-100">
        <span className="text-slate-500 font-medium text-center sm:text-left">
          {filteredExpenses.length} {isFr ? 'note(s) de frais affichée(s)' : 'claims displayed'}
        </span>
        
        <div className="flex items-center justify-center sm:justify-end gap-3 font-semibold">
          <button
            onClick={() => onNavigate?.('gpsTriplog')}
            className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>{isFr ? 'Ouvrir le Registre Kilométrique GPS' : 'GPS Mileage TripLog'}</span>
          </button>

          <span className="text-slate-300">•</span>

          <button
            onClick={() => onNavigate?.('invoiceAudit')}
            className="text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isFr ? 'Audit des Factures (IA)' : 'Invoice Audit'}</span>
          </button>
        </div>
      </div>

      {/* Expense Detail Modal */}
      <AnimatePresence>
        {detailModalExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {isFr ? 'Détails de la Note de Frais' : 'Expense Claim Details'}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">#{detailModalExpense.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModalExpense(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                  <div>
                    <span className="text-slate-400 font-medium">{isFr ? 'Employé demandeur' : 'Claimant'}</span>
                    <p className="font-bold text-slate-800 text-sm mt-0.5">{detailModalExpense.employeeName || 'N/A'}</p>
                    <p className="text-[10px] text-slate-500">{detailModalExpense.employeeEmail}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">{isFr ? 'Montant Réclamé' : 'Claim Amount'}</span>
                    <p className="font-black text-slate-900 text-base mt-0.5 text-blue-700">
                      {formatCAD(detailModalExpense.amount)}
                    </p>
                    <p className="text-[10px] text-slate-500">{detailModalExpense.date}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-2">
                  <p><strong>{isFr ? 'Catégorie :' : 'Category:'}</strong> {detailModalExpense.category}</p>
                  <p><strong>{isFr ? 'Description :' : 'Description:'}</strong> {detailModalExpense.description}</p>
                  <p>
                    <strong>{isFr ? 'Provenance :' : 'Source:'}</strong>{' '}
                    {detailModalExpense.source === 'gps_triplog' 
                      ? '📍 GPS TripLog (Déplacement professionnel avec télémétrie)' 
                      : detailModalExpense.source === 'invoice_audit' 
                      ? '📄 Facture Fournisseur (Module Invoice Audit)' 
                      : 'Saisie Manuelle'}
                  </p>
                  {detailModalExpense.notes && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200">
                      <p className="text-[11px] text-slate-700 leading-relaxed font-sans">{detailModalExpense.notes}</p>
                    </div>
                  )}
                </div>

                {/* GPS Telemetry Special Card */}
                {detailModalExpense.source === 'gps_triplog' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isFr ? 'Taux Kilométrique Officiel CRA / RQ : 0,70 $ / km' : 'Official CRA / RQ Mileage Rate: $0.70 / km'}</span>
                    </div>
                    <p className="text-emerald-700 leading-relaxed">
                      {isFr 
                        ? 'Ce trajet a été calculé et validé via l\'odomètre GPS haute précision avec horodatage pour conformité avec les règles de déductibilité fiscale.' 
                        : 'Calculated and certified via high-precision GPS odometer with timestamped route verification.'}
                    </p>
                  </div>
                )}

                {/* Audit Approval Info */}
                {detailModalExpense.approvedBy && (
                  <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-900">
                    <p><strong>{isFr ? 'Approuvé par :' : 'Approved by:'}</strong> {detailModalExpense.approvedBy} ({detailModalExpense.approvedAt ? new Date(detailModalExpense.approvedAt).toLocaleDateString() : 'Récemment'})</p>
                  </div>
                )}
                {detailModalExpense.reimbursedBy && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-900">
                    <p><strong>{isFr ? 'Remboursé le :' : 'Reimbursed on:'}</strong> {detailModalExpense.reimbursedAt ? new Date(detailModalExpense.reimbursedAt).toLocaleDateString() : 'Récemment'} via {detailModalExpense.reimbursementMethod || 'Dépôt direct'} (Réf: {detailModalExpense.reimbursementRef})</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => setDetailModalExpense(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  {isFr ? 'Fermer' : 'Close'}
                </button>

                <button
                  onClick={() => {
                    setDetailModalExpense(null);
                    onNavigate?.('expenses');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>{isFr ? 'Ouvrir dans le Gestionnaire des Dépenses' : 'Open in Expense Manager'}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};