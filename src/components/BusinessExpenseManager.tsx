/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { BusinessExpense, Employee, ExpenseStatus } from '../types';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  PieChart, 
  Info, 
  Building2, 
  FileCheck2, 
  CheckCircle2,
  TrendingDown,
  ShieldCheck,
  Navigation,
  Clock,
  Check,
  X,
  CreditCard,
  User,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Calendar,
  Layers,
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';
import { Storage } from '../lib/storage';
import { TaxableBenefitsManager } from './TaxableBenefitsManager';
import { DocumentExtractor } from './DocumentExtractor';
import { GpsTripLogWrapper } from './GpsTripLogWrapper';
import { useLanguage } from './LanguageContext';
import { useAuth } from '../context/AuthContext';
import { calculateTaxByStatus, TaxabilityStatus, TaxCalculationMode } from '../services/salesTaxCalculator';

export const EXPENSE_CATEGORIES: Array<{
  id: string;
  labelFr: string;
  labelEn: string;
  deductible: number;
  defaultTaxStatus: TaxabilityStatus;
  info: string;
}> = [
  { id: 'advertising', labelFr: 'Publicité & Marketing', labelEn: 'Advertising & Marketing', deductible: 1.0, defaultTaxStatus: 'taxable', info: 'Campagnes Google/FB, annonces médias canadiens (100% déductible, taxable TPS/TVQ).' },
  { id: 'bad_debts', labelFr: 'Créances irrécouvrables', labelEn: 'Bad Debts', deductible: 1.0, defaultTaxStatus: 'exempt', info: 'Factures impayées de biens/services (Ajustement comptable non-taxable).' },
  { id: 'vehicle', labelFr: 'Frais de véhicule d\'affaires (non imposable)', labelEn: 'Business Vehicle (Non-taxable)', deductible: 1.0, defaultTaxStatus: 'taxable', info: 'Indemnités raisonnables (0,72 $/km 2025), carburant, entretien pro (CTI/RTI applicables).' },
  { id: 'meals', labelFr: 'Repas et représentation', labelEn: 'Meals & Entertainment', deductible: 0.5, defaultTaxStatus: 'taxable', info: 'Déductible à 50% selon la loi fiscale (CTI TPS et RTI TVQ limités à 50%).' },
  { id: 'rent', labelFr: 'Loyer et locaux d\'exploitation', labelEn: 'Rent & Premises', deductible: 1.0, defaultTaxStatus: 'taxable', info: 'Loyer commercial, entretien des bureaux (Taxable TPS 5% + TVQ 9,975%).' },
  { id: 'interest', labelFr: 'Intérêts sur emprunts d\'affaires', labelEn: 'Interest on Loans', deductible: 1.0, defaultTaxStatus: 'exempt', info: 'Services financiers exonérés de TPS et de TVQ (0% taxes).' },
  { id: 'office', labelFr: 'Frais de bureau & logiciels SaaS', labelEn: 'Office & SaaS Software', deductible: 1.0, defaultTaxStatus: 'taxable', info: 'Fournitures, abonnements logiciels de gestion, ordinateurs (Taxable TPS/TVQ).' },
  { id: 'insurance', labelFr: 'Assurance commerciale de l\'entreprise', labelEn: 'Commercial Business Insurance', deductible: 1.0, defaultTaxStatus: 'exempt', info: 'Primes d\'assurance exonérées de TPS (0%) et de TVQ standard.' },
  { id: 'bank', labelFr: 'Frais bancaires & terminaux POS', labelEn: 'Bank & Merchant Fees', deductible: 1.0, defaultTaxStatus: 'exempt', info: 'Frais de services financiers exonérés de TPS/TVQ (Non-taxable).' },
  { id: 'professional', labelFr: 'Honoraires professionnels & comptables', labelEn: 'Professional & Accounting Fees', deductible: 1.0, defaultTaxStatus: 'taxable', info: 'Comptables CPA, conseillers juridiques, fiscalistes (Taxable TPS 5% + TVQ 9,975%).' },
  { id: 'utilities', labelFr: 'Services publics & Télécoms', labelEn: 'Utilities & Telecoms', deductible: 1.0, defaultTaxStatus: 'taxable', info: 'Électricité, chauffage, internet d\'entreprise, téléphonie (Taxable TPS/TVQ).' },
  { id: 'travel', labelFr: 'Déplacements d\'affaires admissibles', labelEn: 'Business Travel', deductible: 1.0, defaultTaxStatus: 'taxable', info: 'Billets d\'avion, train, hébergement d\'affaires justifié.' },
  { id: 'other', labelFr: 'Autres dépenses d\'exploitation', labelEn: 'Other Operating Expenses', deductible: 1.0, defaultTaxStatus: 'taxable', info: 'Toute autre dépense d\'entreprise raisonnable.' },
];

interface BusinessExpenseManagerProps {
  employees?: Employee[];
  initialTab?: 'main_expenses' | 'taxable_benefits' | 'extractor' | 'gps_triplog';
}

export const BusinessExpenseManager: React.FC<BusinessExpenseManagerProps> = ({ 
  employees = [], 
  initialTab = 'main_expenses' 
}) => {
  const { isFr } = useLanguage();
  const { isAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'main_expenses' | 'taxable_benefits' | 'extractor' | 'gps_triplog'>(initialTab);
  
  // Expenses State
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State for manual creation
  const [category, setCategory] = useState('office');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [taxStatus, setTaxStatus] = useState<TaxabilityStatus>('taxable');
  const [taxCalcMode, setTaxCalcMode] = useState<TaxCalculationMode>('inclusive');

  const activeCategoryConfig = EXPENSE_CATEGORIES.find(c => c.id === category);
  const previewSalesTax = useMemo(() => {
    return calculateTaxByStatus(amount, taxStatus, taxCalcMode, activeCategoryConfig?.deductible ?? 1.0);
  }, [amount, taxStatus, taxCalcMode, activeCategoryConfig]);

  // Filtering & Selection State
  const [statusFilter, setStatusFilter] = useState<'all' | ExpenseStatus>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'gps_triplog' | 'invoice_audit' | 'manual'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal States
  const [isReimburseModalOpen, setIsReimburseModalOpen] = useState(false);
  const [activeExpenseToReimburse, setActiveExpenseToReimburse] = useState<BusinessExpense | null>(null);
  const [reimbursementMethod, setReimbursementMethod] = useState('Dépôt direct de paie (Direct Deposit)');
  const [reimbursementRef, setReimbursementRef] = useState('');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [activeDetailExpense, setActiveDetailExpense] = useState<BusinessExpense | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await Storage.getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // Set default employee selection when employees load
  useEffect(() => {
    if (employees.length > 0 && !selectedEmployeeId) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [employees, selectedEmployeeId]);

  // Handle add expense
  const handleAddExpense = async () => {
    if (amount <= 0) return;
    
    const cat = EXPENSE_CATEGORIES.find(c => c.id === category);
    const assignedEmp = employees.find(e => e.id === selectedEmployeeId);
    const taxCalc = calculateTaxByStatus(amount, taxStatus, taxCalcMode, cat?.deductible || 1.0);
    const finalTotalAmount = taxCalc.grandTotal;

    const newExpense: Omit<BusinessExpense, 'id'> = {
      date: date || new Date().toISOString().split('T')[0],
      category,
      description: description || (isFr ? (cat?.labelFr || '') : (cat?.labelEn || '')),
      amount: finalTotalAmount,
      deductibleAmount: Number((finalTotalAmount * (cat?.deductible || 1)).toFixed(2)),
      notes: notes || undefined,
      employeeId: assignedEmp ? assignedEmp.id : undefined,
      employeeName: assignedEmp ? `${assignedEmp.firstName} ${assignedEmp.lastName}` : (user?.displayName || 'Admin Entreprise'),
      employeeEmail: assignedEmp ? assignedEmp.email : user?.email,
      source: 'manual',
      status: 'pending_approval',
      taxBreakdown: {
        subTotal: taxCalc.baseAmount,
        gst: taxCalc.gst,
        qst: taxCalc.qst,
        taxStatus: taxCalc.taxStatus,
        itcGst: taxCalc.itcGst,
        itrQst: taxCalc.itrQst,
      },
    };
    
    await Storage.saveExpense(newExpense);
    await loadExpenses();

    setDescription('');
    setAmount(0);
    setNotes('');
    showToast(isFr ? 'Dépense et calcul TPS/TVQ soumis avec succès.' : 'Expense and GST/QST breakdown submitted successfully.');
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm(isFr ? 'Confirmer la suppression de cette note de frais ?' : 'Confirm deletion of this expense?')) return;
    await Storage.deleteExpense(id);
    setExpenses(prev => prev.filter(e => e.id !== id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showToast(isFr ? 'Dépense supprimée.' : 'Expense deleted.');
  };

  // Approval logic
  const handleApprove = async (id: string) => {
    try {
      await Storage.approveExpense(id, isFr ? 'Approuvé conforme aux politiques de remboursement' : 'Approved compliant with company expense policy', user?.displayName || 'Admin RH');
      await loadExpenses();
      showToast(isFr ? 'Note de frais approuvée avec succès !' : 'Expense approved successfully!');
    } catch (err: any) {
      alert(err.message || 'Error approving expense');
    }
  };

  // Rejection logic
  const handleReject = async (id: string) => {
    const reason = window.prompt(isFr ? 'Raison du refus :' : 'Reason for rejection:', isFr ? 'Non admissible ou justificatif manquant' : 'Ineligible or missing receipt');
    if (reason === null) return;
    try {
      await Storage.rejectExpense(id, reason);
      await loadExpenses();
      showToast(isFr ? 'Note de frais refusée.' : 'Expense rejected.');
    } catch (err: any) {
      alert(err.message || 'Error rejecting expense');
    }
  };

  // Open reimbursement modal
  const openReimbursementModal = (expense: BusinessExpense) => {
    setActiveExpenseToReimburse(expense);
    setReimbursementRef(`REIMB-${Date.now().toString().slice(-6)}`);
    setIsReimburseModalOpen(true);
  };

  // Confirm reimbursement
  const confirmReimbursement = async () => {
    if (!activeExpenseToReimburse) return;
    try {
      await Storage.reimburseExpense(activeExpenseToReimburse.id, {
        method: reimbursementMethod,
        ref: reimbursementRef,
        reimbursedBy: user?.displayName || 'Admin RH (Direction)'
      });
      setIsReimburseModalOpen(false);
      setActiveExpenseToReimburse(null);
      await loadExpenses();
      showToast(isFr ? `Remboursement de ${formatCurrency(activeExpenseToReimburse.amount)} validé !` : `Reimbursement of ${formatCurrency(activeExpenseToReimburse.amount)} confirmed!`);
    } catch (err: any) {
      alert(err.message || 'Error reimbursing expense');
    }
  };

  // Bulk actions
  const handleBulkApprove = async () => {
    const ids: string[] = Array.from(selectedIds);
    if (ids.length === 0) return;
    try {
      await Storage.bulkApproveExpenses(ids, 'Approbation groupée effectuée par l\'administrateur', user?.displayName || 'Admin RH');
      setSelectedIds(new Set<string>());
      await loadExpenses();
      showToast(isFr ? `${ids.length} dépense(s) approuvée(s) !` : `${ids.length} expense(s) approved!`);
    } catch (err: any) {
      alert(err.message || 'Error in bulk approval');
    }
  };

  const handleBulkReimburse = async () => {
    const ids: string[] = Array.from(selectedIds);
    if (ids.length === 0) return;
    const ref = `REIMB-BATCH-${Date.now().toString().slice(-6)}`;
    try {
      await Storage.bulkReimburseExpenses(ids, 'Dépôt direct de paie (Direct Deposit)', user?.displayName || 'Admin RH', ref);
      setSelectedIds(new Set<string>());
      await loadExpenses();
      showToast(isFr ? `${ids.length} remboursement(s) groupé(s) exécuté(s) (${ref}) !` : `${ids.length} batch reimbursement(s) executed!`);
    } catch (err: any) {
      alert(err.message || 'Error in bulk reimbursement');
    }
  };

  const showToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 3500);
  };

  // Toggle selection
  const toggleSelectExpense = (id: string) => {
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
    if (selectedIds.size === filteredExpenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredExpenses.map(e => e.id)));
    }
  };

  // Helper to resolve GST/QST breakdown for any expense item (including legacy items)
  const resolveExpenseTax = (e: BusinessExpense) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === e.category);
    const dedFactor = cat?.deductible ?? 1.0;
    if (e.taxBreakdown && typeof e.taxBreakdown === 'object') {
      const tb = e.taxBreakdown;
      const status: TaxabilityStatus = tb.taxStatus || ((tb.gst || 0) > 0 || (tb.qst || 0) > 0 ? 'taxable' : (cat?.defaultTaxStatus || 'taxable'));
      if (tb.gst !== undefined && tb.gst !== null) {
        const gstVal = Number(tb.gst) || 0;
        const qstVal = Number(tb.qst ?? tb.pst ?? 0) || 0;
        const sub = tb.subTotal !== undefined ? Number(tb.subTotal) : Number((e.amount - gstVal - qstVal).toFixed(2));
        return {
          baseAmount: sub,
          gst: gstVal,
          qst: qstVal,
          totalTaxes: Number((gstVal + qstVal).toFixed(2)),
          grandTotal: e.amount,
          taxStatus: status,
          isTaxable: status === 'taxable' || status === 'gst_only',
          itcGst: tb.itcGst !== undefined ? Number(tb.itcGst) : Number((gstVal * dedFactor).toFixed(2)),
          itrQst: tb.itrQst !== undefined ? Number(tb.itrQst) : Number((qstVal * dedFactor).toFixed(2)),
        };
      }
    }
    const fallbackStatus: TaxabilityStatus = cat?.defaultTaxStatus || 'taxable';
    return calculateTaxByStatus(e.amount, fallbackStatus, 'inclusive', dedFactor);
  };

  // KPI Calculations (including GST/QST & Taxable vs Non-Taxable goods/services)
  const metrics = useMemo(() => {
    let total = 0;
    let deductible = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let approvedCount = 0;
    let approvedAmount = 0;
    let reimbursedCount = 0;
    let reimbursedAmount = 0;

    let taxableBaseTotal = 0;
    let nonTaxableTotal = 0;
    let totalGst = 0;
    let totalQst = 0;
    let totalItcGst = 0;
    let totalItrQst = 0;
    let taxableCount = 0;
    let nonTaxableCount = 0;

    for (const e of expenses) {
      total += e.amount;
      deductible += e.deductibleAmount;
      const status = e.status || 'pending_approval';
      if (status === 'pending_approval') {
        pendingCount += 1;
        pendingAmount += e.amount;
      } else if (status === 'approved') {
        approvedCount += 1;
        approvedAmount += e.amount;
      } else if (status === 'reimbursed') {
        reimbursedCount += 1;
        reimbursedAmount += e.amount;
      }

      const taxInfo = resolveExpenseTax(e);
      if (taxInfo.isTaxable) {
        taxableBaseTotal += taxInfo.baseAmount;
        totalGst += taxInfo.gst;
        totalQst += taxInfo.qst;
        totalItcGst += taxInfo.itcGst;
        totalItrQst += taxInfo.itrQst;
        taxableCount += 1;
      } else {
        nonTaxableTotal += taxInfo.grandTotal;
        nonTaxableCount += 1;
      }
    }

    return {
      total,
      deductible,
      pendingCount,
      pendingAmount,
      approvedCount,
      approvedAmount,
      reimbursedCount,
      reimbursedAmount,
      taxableBaseTotal,
      nonTaxableTotal,
      totalGst,
      totalQst,
      totalItcGst,
      totalItrQst,
      taxableCount,
      nonTaxableCount,
    };
  }, [expenses]);

  // Filtered List
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const eStatus = e.status || 'pending_approval';
      if (statusFilter !== 'all' && eStatus !== statusFilter) {
        return false;
      }
      if (sourceFilter !== 'all') {
        const src = e.source || 'manual';
        if (src !== sourceFilter) {
          return false;
        }
      }
      if (employeeFilter !== 'all') {
        if (e.employeeId !== employeeFilter && e.employeeName !== employeeFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = (e.description || '').toLowerCase().includes(q);
        const empMatch = (e.employeeName || '').toLowerCase().includes(q);
        const sourceMatch = (e.sourceId || '').toLowerCase().includes(q);
        const notesMatch = (e.notes || '').toLowerCase().includes(q);
        if (!descMatch && !empMatch && !sourceMatch && !notesMatch) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, statusFilter, sourceFilter, employeeFilter, searchQuery]);

  // Unique list of submitters/employees
  const submitterNames = useMemo(() => {
    const set = new Set<string>();
    for (const e of expenses) {
      if (e.employeeName) set.add(e.employeeName);
    }
    for (const emp of employees) {
      set.add(`${emp.firstName} ${emp.lastName}`);
    }
    return Array.from(set);
  }, [expenses, employees]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {actionSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 text-xs font-semibold"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Level Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('main_expenses')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'main_expenses'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>{isFr ? '1. Dépenses & Remboursements' : '1. Expenses & Reimbursements'}</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full font-extrabold">
            {expenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('taxable_benefits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'taxable_benefits'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileCheck2 className="w-4 h-4 text-red-600" />
          <span>{isFr ? '2. Avantages Imposables (Sous-Page)' : '2. Taxable Benefits Sub-Page'}</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-red-100 text-red-800 rounded-full font-extrabold">
            Revenu Québec 2025
          </span>
        </button>

        <button
          onClick={() => setActiveTab('extractor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'extractor'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4 text-indigo-600" />
          <span>{isFr ? '3. Extracteur IA de Reçus' : '3. AI Receipt Extractor'}</span>
        </button>

        <button
          onClick={() => setActiveTab('gps_triplog')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'gps_triplog'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span>{isFr ? '4. Registre des Déplacements GPS' : '4. GPS Vehicle TripLog App'}</span>
          <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full font-extrabold">
            En direct
          </span>
        </button>
      </div>

      {/* Tab 1: Main Expenses Page */}
      {activeTab === 'main_expenses' && (
        <div className="space-y-6">
          {/* Summary KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between text-gray-500 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">{isFr ? 'Total Déclaré' : 'Total Expenses'}</span>
                <Receipt className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-extrabold text-slate-900">{formatCurrency(metrics.total)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {expenses.length} {isFr ? 'justificatifs au registre' : 'total items recorded'}
              </p>
            </div>

            {/* Pending Approval */}
            <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200/80 shadow-xs">
              <div className="flex items-center justify-between text-amber-700 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">{isFr ? 'En Attente d\'Approbation' : 'Pending Approval'}</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-extrabold text-amber-900">{formatCurrency(metrics.pendingAmount)}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block px-1.5 py-0.2 bg-amber-200/80 text-amber-900 rounded font-bold text-[10px]">
                  {metrics.pendingCount}
                </span>
                <span className="text-[10px] text-amber-700">{isFr ? 'à valider par l\'admin' : 'requiring review'}</span>
              </div>
            </div>

            {/* Approved / Awaiting Reimbursement */}
            <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200/80 shadow-xs">
              <div className="flex items-center justify-between text-emerald-700 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">{isFr ? 'Approuvé (À Rembourser)' : 'Approved (Pending Payout)'}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-900">{formatCurrency(metrics.approvedAmount)}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block px-1.5 py-0.2 bg-emerald-200/80 text-emerald-900 rounded font-bold text-[10px]">
                  {metrics.approvedCount}
                </span>
                <span className="text-[10px] text-emerald-700">{isFr ? 'prêts pour virement/paie' : 'ready for payment'}</span>
              </div>
            </div>

            {/* Reimbursed */}
            <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200/80 shadow-xs">
              <div className="flex items-center justify-between text-blue-700 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">{isFr ? 'Remboursé aux Employés' : 'Reimbursed to Staff'}</span>
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-2xl font-extrabold text-blue-900">{formatCurrency(metrics.reimbursedAmount)}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block px-1.5 py-0.2 bg-blue-200/80 text-blue-900 rounded font-bold text-[10px]">
                  {metrics.reimbursedCount}
                </span>
                <span className="text-[10px] text-blue-700">{isFr ? 'virements exécutés' : 'payouts finalized'}</span>
              </div>
            </div>
          </div>

          {/* GST (5%) & QST (9.975%) Taxability & Input Tax Credit (CTI / RTI) Tracking Banner */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    {isFr
                      ? 'Suivi Fiscal TPS (5%) & TVQ (9,975%) — Biens et Services Taxables vs Non Taxables'
                      : 'GST (5%) & QST (9.975%) Tax Tracking — Taxable vs Non-Taxable Goods & Services'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {isFr
                      ? 'Calcul automatique des Crédits de taxe sur les intrants (CTI - ARC) et Remboursements de la taxe sur les intrants (RTI - Revenu Québec)'
                      : 'Automated calculation of Input Tax Credits (ITC - CRA) and Input Tax Refunds (ITR - Revenu Québec)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold">
                  {metrics.taxableCount} {isFr ? 'Taxables' : 'Taxable'}
                </span>
                <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold">
                  {metrics.nonTaxableCount} {isFr ? 'Non-Taxables / Exonérés' : 'Non-Taxable / Exempt'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/70">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  {isFr ? 'Biens / Services Taxables (HT)' : 'Taxable Goods & Services (Base)'}
                </span>
                <span className="text-lg font-extrabold text-slate-900 font-mono mt-0.5 block">
                  {formatCurrency(metrics.taxableBaseTotal)}
                </span>
                <span className="text-[10px] text-emerald-700">
                  {isFr ? 'Assujettis TPS 5% + TVQ 9,975%' : 'Subject to GST 5% + QST 9.975%'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  {isFr ? 'Biens / Services Non Taxables' : 'Non-Taxable / Exempt Supplies'}
                </span>
                <span className="text-lg font-extrabold text-slate-800 font-mono mt-0.5 block">
                  {formatCurrency(metrics.nonTaxableTotal)}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isFr ? 'Exonérés ou détaxés (0% TPS/TVQ)' : 'Exempt or zero-rated (0% tax)'}
                </span>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/70">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                  {isFr ? 'TPS Payée (5%) & CTI' : 'GST Paid (5%) & ITC'}
                </span>
                <span className="text-lg font-extrabold text-blue-950 font-mono mt-0.5 block">
                  {formatCurrency(metrics.totalGst)}
                </span>
                <span className="text-[10px] text-blue-700 font-semibold">
                  {isFr ? 'CTI réclamable :' : 'Recoverable ITC:'} {formatCurrency(metrics.totalItcGst)}
                </span>
              </div>

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/70">
                <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
                  {isFr ? 'TVQ Payée (9,975%) & RTI' : 'QST Paid (9.975%) & ITR'}
                </span>
                <span className="text-lg font-extrabold text-indigo-950 font-mono mt-0.5 block">
                  {formatCurrency(metrics.totalQst)}
                </span>
                <span className="text-[10px] text-indigo-700 font-semibold">
                  {isFr ? 'RTI réclamable :' : 'Recoverable ITR:'} {formatCurrency(metrics.totalItrQst)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form for manual input / Submissions */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Plus className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                    {isFr ? 'Enregistrer une Dépense' : 'Record Business Expense'}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {isFr ? 'Manuel' : 'Manual'}
                </span>
              </div>

              <div className="space-y-3.5">
                {/* Employee / Submitter Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>{isFr ? 'Employé / Demandeur' : 'Employee / Submitter'}</span>
                    <span className="text-blue-600 font-semibold lowercase">requis</span>
                  </label>
                  <select 
                    value={selectedEmployeeId}
                    onChange={e => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.email})
                      </option>
                    ))}
                    <option value="company_direct">
                      {isFr ? '🏢 Dépense directe de l\'entreprise' : '🏢 Direct Company Expense'}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {isFr ? 'Catégorie de Dépense' : 'Expense Category'}
                  </label>
                  <select 
                    value={category}
                    onChange={e => {
                      const newCatId = e.target.value;
                      setCategory(newCatId);
                      const foundCat = EXPENSE_CATEGORIES.find(c => c.id === newCatId);
                      if (foundCat) {
                        setTaxStatus(foundCat.defaultTaxStatus);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                  >
                    {EXPENSE_CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>
                        {isFr ? c.labelFr : c.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* GST / QST Taxability Classification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      {isFr ? 'Statut TPS / TVQ' : 'GST / QST Status'}
                    </label>
                    <select
                      value={taxStatus}
                      onChange={e => setTaxStatus(e.target.value as TaxabilityStatus)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-semibold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="taxable">{isFr ? 'Taxable (TPS 5% + TVQ 9,975%)' : 'Taxable (GST 5% + QST 9.975%)'}</option>
                      <option value="exempt">{isFr ? 'Non-taxable / Exonéré (0%)' : 'Non-taxable / Exempt (0%)'}</option>
                      <option value="zero_rated">{isFr ? 'Détaxé — Taux 0%' : 'Zero-rated (0%)'}</option>
                      <option value="gst_only">{isFr ? 'TPS 5% seulement (Hors QC)' : 'GST 5% Only (Outside QC)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      {isFr ? 'Mode de Saisie' : 'Calculation Mode'}
                    </label>
                    <select
                      value={taxCalcMode}
                      onChange={e => setTaxCalcMode(e.target.value as TaxCalculationMode)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[11px] font-semibold text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="inclusive">{isFr ? 'Taxes incluses dans le montant' : 'Taxes included in amount'}</option>
                      <option value="exclusive">{isFr ? 'Montant avant taxes (+TPS/TVQ)' : 'Before taxes (+GST/QST)'}</option>
                    </select>
                  </div>

                  {amount > 0 && (
                    <div className="sm:col-span-2 pt-2 border-t border-slate-200/80 grid grid-cols-3 gap-2 text-[10px]">
                      <div className="bg-white p-1.5 rounded border border-slate-200/70">
                        <span className="text-slate-400 block">{isFr ? 'Sous-total HT' : 'Subtotal'}</span>
                        <span className="font-mono font-bold text-slate-800">{formatCurrency(previewSalesTax.baseAmount)}</span>
                      </div>
                      <div className="bg-blue-50/60 p-1.5 rounded border border-blue-100">
                        <span className="text-blue-700 block">TPS (5%)</span>
                        <span className="font-mono font-bold text-blue-900">{formatCurrency(previewSalesTax.gst)}</span>
                      </div>
                      <div className="bg-indigo-50/60 p-1.5 rounded border border-indigo-100">
                        <span className="text-indigo-700 block">TVQ (9,975%)</span>
                        <span className="font-mono font-bold text-indigo-900">{formatCurrency(previewSalesTax.qst)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {isFr ? 'Description / Fournisseur' : 'Description / Vendor'}
                  </label>
                  <input 
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={isFr ? 'Ex. Resto Le Filet, Bureau en Gros, Bell...' : 'e.g. Staples, Client Lunch...'}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {isFr ? 'Date' : 'Date'}
                    </label>
                    <input 
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {isFr ? 'Montant Total ($)' : 'Total Amount ($)'}
                    </label>
                    <input 
                      type="number"
                      value={amount || ''}
                      onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0,00 $"
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {isFr ? 'Notes & Justificatif' : 'Notes & Receipt reference'}
                  </label>
                  <input 
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={isFr ? 'Ex. Numéro de facture ou contexte de mission' : 'Invoice # or purpose'}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800 flex gap-2.5 items-start">
                  <Info className="w-4 h-4 flex-shrink-0 text-blue-600 mt-0.5" />
                  <span className="text-[11px] leading-relaxed">
                    {EXPENSE_CATEGORIES.find(c => c.id === category)?.info}
                  </span>
                </div>

                <button 
                  onClick={handleAddExpense}
                  disabled={amount <= 0}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" /> 
                  <span>{isFr ? 'Soumettre la Dépense' : 'Submit Expense'}</span>
                </button>
              </div>
            </div>

            {/* Expenses Table & Management Workspace */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs flex flex-col min-h-[500px]">
                
                {/* Header with Title & Status Tabs */}
                <div className="p-4 border-b border-gray-100 bg-slate-50/60 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <span>{isFr ? 'Journal des Notes de Frais & Dépenses' : 'Operating Expenses & Reimbursement Journal'}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full font-bold">
                          {filteredExpenses.length}
                        </span>
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {isFr ? 'Traitement des approbations administratives et virements de remboursement pour employés' : 'Admin approval workflows and employee reimbursement disbursements'}
                      </p>
                    </div>

                    {/* Bulk Action Controls */}
                    {selectedIds.size > 0 && (
                      <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-900 animate-fadeIn">
                        <span>{selectedIds.size} {isFr ? 'sélectionné(s)' : 'selected'}</span>
                        <div className="h-4 w-px bg-blue-200" />
                        <button
                          onClick={handleBulkApprove}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          {isFr ? 'Approuver tout' : 'Approve All'}
                        </button>
                        <button
                          onClick={handleBulkReimburse}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          {isFr ? 'Rembourser tout' : 'Reimburse All'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Filters Bar: Status Tabs + Employee Filter + Search */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/60">
                    {/* Status Tabs */}
                    <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-xl">
                      {[
                        { id: 'all', label: isFr ? 'Tous' : 'All' },
                        { id: 'pending_approval', label: isFr ? 'En attente' : 'Pending', color: 'text-amber-700' },
                        { id: 'approved', label: isFr ? 'Approuvés' : 'Approved', color: 'text-emerald-700' },
                        { id: 'reimbursed', label: isFr ? 'Remboursés' : 'Reimbursed', color: 'text-blue-700' },
                        { id: 'rejected', label: isFr ? 'Rejetés' : 'Rejected', color: 'text-rose-700' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setStatusFilter(tab.id as any)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            statusFilter === tab.id
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Filters: Source, Employee & Search */}
                    <div className="flex flex-wrap items-center gap-2 flex-grow sm:flex-grow-0">
                      {/* Source Filter */}
                      <div className="relative">
                        <select
                          value={sourceFilter}
                          onChange={e => setSourceFilter(e.target.value as any)}
                          className="pl-7 pr-3 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                          <option value="all">{isFr ? 'Toutes les sources' : 'All Sources'}</option>
                          <option value="gps_triplog">📍 {isFr ? 'GPS TripLog' : 'GPS TripLog'}</option>
                          <option value="invoice_audit">📄 {isFr ? 'Factures (Audit)' : 'Invoices (Audit)'}</option>
                          <option value="manual">✏️ {isFr ? 'Saisie Manuelle' : 'Manual Entry'}</option>
                        </select>
                        <Navigation className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                      </div>

                      {/* Employee Filter */}
                      <div className="relative">
                        <select
                          value={employeeFilter}
                          onChange={e => setEmployeeFilter(e.target.value)}
                          className="pl-7 pr-3 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                          <option value="all">{isFr ? 'Tous les demandeurs' : 'All Employees'}</option>
                          {submitterNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                      </div>

                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder={isFr ? 'Recherche...' : 'Search...'}
                          className="pl-7 pr-3 py-1 bg-white border border-gray-200 rounded-lg text-[11px] text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none w-32 sm:w-40"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                      </div>
                    </div>
                  </div>
                </div>
                
             {/* Main Table / Mobile Card View */}
<div className="flex-grow overflow-x-auto no-scrollbar">
  <table className="w-full text-left border-collapse">
    <thead className="hidden md:table-header-group bg-slate-50/80 border-b border-gray-200">
      <tr className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
        <th className="px-3 py-2.5 w-8 text-center">
          <input 
            type="checkbox"
            checked={filteredExpenses.length > 0 && selectedIds.size === filteredExpenses.length}
            onChange={toggleSelectAll}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
        </th>
        <th className="px-3 py-2.5">{isFr ? 'Date' : 'Date'}</th>
        <th className="px-3 py-2.5">{isFr ? 'Statut' : 'Status'}</th>
        <th className="px-3 py-2.5">{isFr ? 'Employé / Demandeur' : 'Employee / Submitter'}</th>
        <th className="px-3 py-2.5">{isFr ? 'Description & Source' : 'Description & Source'}</th>
        <th className="px-3 py-2.5">{isFr ? 'Catégorie' : 'Category'}</th>
        <th className="px-3 py-2.5 text-right">{isFr ? 'Montant' : 'Amount'}</th>
        <th className="px-3 py-2.5 text-center">{isFr ? 'Actions Admin' : 'Admin Actions'}</th>
      </tr>
    </thead>
    <tbody className="block p-3 sm:p-4 bg-slate-50/50 md:bg-transparent md:p-0 md:table-row-group md:divide-y md:divide-gray-100 text-xs">
      {filteredExpenses.map(e => {
        const cat = EXPENSE_CATEGORIES.find(c => c.id === e.category);
        const status = e.status || 'pending_approval';
        const isSelected = selectedIds.has(e.id);
        const tInfo = resolveExpenseTax(e);

        return (
          <tr 
            key={e.id} 
            className={`flex flex-col gap-3 p-4 mb-3 rounded-2xl border transition-all duration-200 md:table-row md:gap-0 md:p-0 md:mb-0 md:border-0 md:shadow-none md:rounded-none group ${
              isSelected 
                ? 'bg-blue-50/70 border-blue-300 shadow-sm ring-1 ring-blue-400/40 md:bg-blue-50/50 md:ring-0 md:border-0' 
                : 'bg-white border-slate-200/80 shadow-xs hover:border-slate-300 md:hover:bg-slate-50/70'
            }`}
          >
            {/* 1. HEADER (Mobile Top Bar: Selection, Date, Status) / DESKTOP: Checkbox Column */}
            <td className="flex items-center justify-between pb-2.5 border-b border-slate-100 md:border-0 md:pb-0 md:table-cell md:px-3 md:py-3 md:text-center">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectExpense(e.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </label>
                <span className="md:hidden inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {e.date}
                </span>
              </div>
              
              {/* Status Badge (Mobile top-right corner) */}
              <div className="md:hidden">
                {status === 'pending_approval' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/70 rounded-full text-[11px] font-semibold">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>{isFr ? 'En attente' : 'Pending'}</span>
                  </span>
                )}
                {status === 'approved' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/70 rounded-full text-[11px] font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>{isFr ? 'Approuvé' : 'Approved'}</span>
                  </span>
                )}
                {status === 'reimbursed' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/70 rounded-full text-[11px] font-semibold">
                    <CreditCard className="w-3 h-3 text-blue-500" />
                    <span>{isFr ? 'Remboursé' : 'Reimbursed'}</span>
                  </span>
                )}
                {status === 'rejected' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/70 rounded-full text-[11px] font-semibold">
                    <X className="w-3 h-3 text-rose-500" />
                    <span>{isFr ? 'Rejeté' : 'Rejected'}</span>
                  </span>
                )}
              </div>
            </td>

            {/* 2. DESKTOP ONLY: Date Column */}
            <td className="hidden md:table-cell md:px-3 md:py-3">
              <span className="text-slate-500 whitespace-nowrap text-[11px] font-mono">{e.date}</span>
            </td>

            {/* 3. DESKTOP ONLY: Status Column */}
            <td className="hidden md:table-cell md:px-3 md:py-3">
              {status === 'pending_approval' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-bold whitespace-nowrap shadow-2xs">
                  <Clock className="w-3 h-3 text-amber-500" />
                  <span>{isFr ? 'En attente' : 'Pending'}</span>
                </span>
              )}
              {status === 'approved' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold whitespace-nowrap shadow-2xs">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>{isFr ? 'Approuvé' : 'Approved'}</span>
                </span>
              )}
              {status === 'reimbursed' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold whitespace-nowrap shadow-2xs">
                  <CreditCard className="w-3 h-3 text-blue-500" />
                  <span>{isFr ? 'Remboursé' : 'Reimbursed'}</span>
                </span>
              )}
              {status === 'rejected' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold whitespace-nowrap shadow-2xs">
                  <X className="w-3 h-3 text-rose-500" />
                  <span>{isFr ? 'Rejeté' : 'Rejected'}</span>
                </span>
              )}
            </td>

            {/* 4. EMPLOYEE INFO */}
            <td className="md:table-cell md:px-3 md:py-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 md:w-6 md:h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs md:text-[10px] font-bold shrink-0 shadow-xs ring-1 ring-slate-200">
                  {(e.employeeName || 'EM').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-xs md:text-xs truncate">
                    {e.employeeName || (isFr ? 'Employé' : 'Employee')}
                  </p>
                  {e.employeeEmail && (
                    <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                      {e.employeeEmail}
                    </p>
                  )}
                </div>
              </div>
            </td>

            {/* 5. DESCRIPTION & METADATA */}
            <td className="space-y-1.5 md:space-y-1 md:table-cell md:px-3 md:py-3">
              <p className="font-medium text-slate-900 text-xs md:text-xs leading-snug break-words">
                {e.description}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {e.source === 'invoice_audit' ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/80 rounded text-[9px] font-semibold">
                    <FileText className="w-2.5 h-2.5" />
                    <span>{isFr ? 'Facture Audit' : 'Invoice Audit'}</span>
                    {e.sourceId && <span className="font-mono font-bold">#{e.sourceId}</span>}
                  </span>
                ) : e.source === 'gps_triplog' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[10px] font-bold shadow-2xs">
                    <Navigation className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>GPS TripLog</span>
                    {e.sourceId && <span className="font-mono text-emerald-700">#{e.sourceId.replace('trip_', '')}</span>}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-medium">
                    {isFr ? 'Manuel' : 'Manual'}
                  </span>
                )}
                
                {e.notes && (
                  <span className="text-[10px] text-slate-400 truncate max-w-[200px]" title={e.notes}>
                    • {e.notes}
                  </span>
                )}
              </div>
            </td>

            {/* 6. CATEGORY */}
            <td className="md:table-cell md:px-3 md:py-3">
              <div className="flex items-center">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium whitespace-nowrap">
                  {cat ? (isFr ? cat.labelFr : cat.labelEn) : e.category}
                </span>
              </div>
            </td>

            {/* 7. AMOUNT & TAXES (Card Focal Point) */}
            <td className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 md:border-0 md:bg-transparent md:p-3 md:table-cell md:text-right">
              <div className="flex items-center justify-between md:block">
                <span className="md:hidden text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {isFr ? 'Total' : 'Total'}
                </span>
                <div className="text-right whitespace-nowrap space-y-0.5">
                  <p className="font-bold text-slate-900 font-mono text-base md:text-xs">
                    {formatCurrency(e.amount)}
                  </p>
                  {tInfo.isTaxable ? (
                    <p className="text-[10px] md:text-[9px] text-emerald-700 font-mono font-semibold">
                      TPS {formatCurrency(tInfo.gst)} • TVQ {formatCurrency(tInfo.qst)}
                    </p>
                  ) : (
                    <p className="text-[10px] md:text-[9px] text-slate-400 font-semibold">
                      {isFr ? 'Exonéré / Non-taxable (0%)' : 'Exempt / Non-taxable (0%)'}
                    </p>
                  )}
                  <p className="hidden md:block text-[10px] text-slate-400 font-mono" style={{ paddingBottom: '20px' }}>
                    {formatCurrency(e.deductibleAmount)} {isFr ? 'déd.' : 'ded.'}
                  </p>
                </div>
              </div>
            </td>

            {/* 8. ACTIONS BAR */}
            <td className="pt-2 mt-1 border-t border-slate-100 md:border-0 md:pt-3 md:mt-0 md:table-cell md:px-3 md:py-3 md:text-center">
              <div className="flex items-center justify-between md:justify-center gap-2">
                {/* If Pending Approval -> show Approve and Reject */}
                {status === 'pending_approval' && (
                  <div className="flex items-center gap-1.5 flex-1 md:flex-initial">
                    <button
                      onClick={() => handleApprove(e.id)}
                      className="flex-1 md:flex-none py-1.5 px-3 md:py-1 md:px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs md:text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs active:scale-98"
                      title={isFr ? 'Approuver cette dépense' : 'Approve expense'}
                    >
                      <Check className="w-3.5 h-3.5 md:w-3 md:h-3" />
                      <span>{isFr ? 'Approuver' : 'Approve'}</span>
                    </button>
                    <button
                      onClick={() => handleReject(e.id)}
                      className="py-1.5 px-2.5 md:p-1 hover:bg-rose-50 border border-rose-200 bg-rose-50/50 text-rose-600 rounded-lg text-xs md:text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer active:scale-98"
                      title={isFr ? 'Refuser cette dépense' : 'Reject expense'}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{isFr ? 'Refuser' : 'Reject'}</span>
                    </button>
                  </div>
                )}

                {/* If Approved -> show Reimburse Button */}
                {status === 'approved' && (
                  <button
                    onClick={() => openReimbursementModal(e)}
                    className="flex-1 md:flex-none py-1.5 px-3 md:py-1 md:px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs md:text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                    title={isFr ? 'Effectuer le remboursement à l\'employé' : 'Disburse reimbursement to employee'}
                  >
                    <CreditCard className="w-3.5 h-3.5 md:w-3 md:h-3" />
                    <span>{isFr ? 'Rembourser' : 'Reimburse'}</span>
                  </button>
                )}

                {/* If Reimbursed -> show Receipt info */}
                {status === 'reimbursed' && (
                  <span 
                    className="px-2.5 py-1 md:py-0.5 bg-blue-50 text-blue-800 rounded-lg text-xs md:text-[9px] font-mono font-bold cursor-pointer hover:bg-blue-100 flex items-center gap-1"
                    onClick={() => {
                      setActiveDetailExpense(e);
                      setIsDetailModalOpen(true);
                    }}
                    title={isFr ? 'Cliquer pour voir les détails du versement' : 'Click to view payout details'}
                  >
                    <CreditCard className="w-3 h-3 text-blue-600" />
                    <span>{e.reimbursementRef || 'PAYÉ'}</span>
                  </span>
                )}

                {/* Details and Delete Button Group */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setActiveDetailExpense(e);
                      setIsDetailModalOpen(true);
                    }}
                    className="py-1 px-2.5 md:p-1 text-slate-600 hover:text-slate-800 border border-slate-200 bg-white hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs md:text-[10px]"
                    title={isFr ? 'Voir les détails et pièces jointes' : 'View details'}
                  >
                    <Info className="w-3.5 h-3.5 text-slate-500" />
                    <span className="md:hidden">{isFr ? 'Détails' : 'Details'}</span>
                  </button>

                  <button 
                    onClick={() => handleDeleteExpense(e.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 md:border-0 rounded-lg transition-colors cursor-pointer"
                    title={isFr ? 'Supprimer cette dépense' : 'Delete'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </td>
          </tr>
        );
      })}

      {filteredExpenses.length === 0 && (
        <tr className="block md:table-row">
          <td colSpan={8} className="px-4 py-16 text-center text-slate-400 italic block md:table-cell">
            <div className="max-w-xs mx-auto space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600 text-xs">
                {isFr ? 'Aucune note de frais trouvée' : 'No expenses match the current filter'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isFr 
                  ? 'Utilisez le module Invoice Audit pour soumettre une facture, ou le formulaire à gauche.' 
                  : 'Submit an invoice via the Invoice Audit module or use the form on the left.'}
              </p>
            </div>
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

{/* Table Footer Summary */}
<div className="p-3 bg-slate-50 border-t border-gray-100 flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center text-xs text-slate-500">
  <div className="flex items-center gap-4">
    <span>{filteredExpenses.length} {isFr ? 'dépense(s) affichée(s)' : 'expense(s) shown'}</span>
    {statusFilter !== 'all' && (
      <span className="text-blue-600 font-bold">Filtre: {statusFilter}</span>
    )}
  </div>
  <div className="flex items-center gap-4 font-mono">
    <span>{isFr ? 'Total affiché :' : 'Filtered Total:'} <strong className="text-slate-900">{formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0))}</strong></span>
  </div>
</div>

</div>
</div>
</div>
</div>
)}

{/* Tab 2: Taxable Benefits Sub-Page */}
{activeTab === 'taxable_benefits' && (
  <TaxableBenefitsManager employees={employees} />
)}

{/* Tab 3: Document & Receipt Extractor */}
{activeTab === 'extractor' && (
  <DocumentExtractor 
    employees={employees} 
    onImportComplete={() => {
      loadExpenses();
    }} 
  />
)}

{/* Tab 4: GPS Vehicle TripLog App */}
{activeTab === 'gps_triplog' && (
  <GpsTripLogWrapper
    onNavigateToExpenses={() => {
      setActiveTab('main_expenses');
      loadExpenses();
    }}
    onExpenseCreated={() => {
      loadExpenses();
    }}
  />
)}

{/* Reimbursement Modal */}
<AnimatePresence>
  {isReimburseModalOpen && activeExpenseToReimburse && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-300" />
              <span>{isFr ? 'Traiter le Remboursement' : 'Process Reimbursement'}</span>
            </h3>
            <p className="text-xs text-blue-200 mt-0.5">
              {isFr ? 'Autorisation de paiement pour la note de frais' : 'Payment authorization for employee expense'}
            </p>
          </div>
          <button
            onClick={() => setIsReimburseModalOpen(false)}
            className="text-blue-200 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto">
          {/* Amount to pay */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                {isFr ? 'Montant à Rembourser' : 'Amount to Reimburse'}
              </span>
              <span className="text-xl sm:text-2xl font-black text-blue-950">
                {formatCurrency(activeExpenseToReimburse.amount)}
              </span>
            </div>
            <div className="text-right min-w-0">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                {isFr ? 'Bénéficiaire' : 'Beneficiary'}
              </span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                {activeExpenseToReimburse.employeeName}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                {activeExpenseToReimburse.employeeEmail}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                {isFr ? 'Mode de Règlement' : 'Payment Method'}
              </label>
              <select
                value={reimbursementMethod}
                onChange={e => setReimbursementMethod(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="Dépôt direct de paie (Direct Deposit)">
                  {isFr ? '💳 Dépôt direct de paie (Inclus sur le prochain talon)' : '💳 Direct Deposit (Next payroll paystub)'}
                </option>
                <option value="Virement Interac (e-Transfer)">
                  {isFr ? '⚡ Virement Interac immédiat' : '⚡ Interac e-Transfer'}
                </option>
                <option value="Chèque d'entreprise (Company Cheque)">
                  {isFr ? '📝 Chèque commercial d\'entreprise' : '📝 Company Cheque'}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                {isFr ? 'Numéro de Référence Comptable' : 'Accounting Reference Number'}
              </label>
              <input
                type="text"
                value={reimbursementRef}
                onChange={e => setReimbursementRef(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 text-slate-600 space-y-1 text-[11px] break-words">
              <p><strong>{isFr ? 'Description :' : 'Description:'}</strong> {activeExpenseToReimburse.description}</p>
              <p><strong>{isFr ? 'Date de la dépense :' : 'Expense date:'}</strong> {activeExpenseToReimburse.date}</p>
              {activeExpenseToReimburse.sourceId && (
                <p><strong>{isFr ? 'Source Facture :' : 'Source Invoice:'}</strong> #{activeExpenseToReimburse.sourceId}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsReimburseModalOpen(false)}
              className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
            >
              {isFr ? 'Annuler' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={confirmReimbursement}
              className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{isFr ? 'Confirmer le Remboursement' : 'Confirm Payout'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>

{/* Expense Detail Modal */}
<AnimatePresence>
  {isDetailModalOpen && activeDetailExpense && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <span>{isFr ? 'Détails de la Note de Frais' : 'Expense & Audit Details'}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              ID: {activeDetailExpense.id}
            </p>
          </div>
          <button
            onClick={() => setIsDetailModalOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">{isFr ? 'Employé' : 'Employee'}</span>
              <span className="font-bold text-slate-800 text-sm block mt-0.5 truncate">{activeDetailExpense.employeeName || 'N/A'}</span>
              <span className="text-[10px] text-slate-500 block truncate">{activeDetailExpense.employeeEmail || ''}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">{isFr ? 'Montant Brut' : 'Gross Amount'}</span>
              <span className="font-extrabold text-slate-900 text-sm block mt-0.5 font-mono">{formatCurrency(activeDetailExpense.amount)}</span>
              <span className="text-[10px] text-emerald-600 font-bold">{formatCurrency(activeDetailExpense.deductibleAmount)} {isFr ? 'déductible' : 'deductible'}</span>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border space-y-2 break-words">
            <p><strong>{isFr ? 'Description :' : 'Description:'}</strong> {activeDetailExpense.description}</p>
            <p><strong>{isFr ? 'Catégorie :' : 'Category:'}</strong> {(() => {
              const cat = EXPENSE_CATEGORIES.find(c => c.id === activeDetailExpense.category);
              return cat ? (isFr ? cat.labelFr : cat.labelEn) : activeDetailExpense.category;
            })()}</p>
            <p><strong>{isFr ? 'Date :' : 'Date:'}</strong> {activeDetailExpense.date}</p>
            <p><strong>{isFr ? 'Source de la dépense :' : 'Source:'}</strong> {activeDetailExpense.source === 'gps_triplog' ? '📍 GPS TripLog (Télémétrie Kilométrique)' : (activeDetailExpense.source || 'Manuel')}</p>
            {activeDetailExpense.sourceId && (
              <p><strong>{isFr ? 'N° Facture / Trajet :' : 'Invoice / Trip Ref #:'}</strong> <span className="font-mono font-bold text-blue-700">#{activeDetailExpense.sourceId}</span></p>
            )}
            {activeDetailExpense.notes && (
              <p><strong>{isFr ? 'Notes & Justification :' : 'Notes:'}</strong> {activeDetailExpense.notes}</p>
            )}

            {activeDetailExpense.source === 'gps_triplog' && (
              <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isFr ? 'Conformité Kilométrique Agence du Revenu (CRA / Revenu Québec)' : 'CRA / Revenu Québec Mileage Compliance'}</span>
                </div>
                <p className="text-emerald-700 leading-relaxed">
                  Taux kilométrique appliqué : <strong>0,70 $ / km</strong>. Ce déplacement a été tracé en temps réel par satellite GPS avec horodatage certifié pour les exigences fiscales.
                </p>
              </div>
            )}
          </div>

          {/* Audit Trail */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1.5 break-words">
            <h5 className="font-bold text-blue-950 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{isFr ? 'Traçabilité & Approbations' : 'Audit Trail & Approvals'}</span>
            </h5>
            <p className="text-slate-700">
              <strong>{isFr ? 'Statut actuel :' : 'Status:'}</strong> <span className="uppercase font-extrabold text-blue-800">{activeDetailExpense.status || 'pending_approval'}</span>
            </p>
            {activeDetailExpense.approvedAt && (
              <p className="text-slate-700">
                <strong>{isFr ? 'Approuvé le :' : 'Approved on:'}</strong> {new Date(activeDetailExpense.approvedAt).toLocaleString()} {isFr ? 'par' : 'by'} {activeDetailExpense.approvedBy || 'Admin'}
              </p>
            )}
            {activeDetailExpense.reimbursedAt && (
              <div className="mt-1 pt-1 border-t border-blue-200 text-emerald-800 font-semibold">
                ✓ {isFr ? 'Remboursé le' : 'Reimbursed on'} {new Date(activeDetailExpense.reimbursedAt).toLocaleString()} ({activeDetailExpense.reimbursementMethod || 'Direct Deposit'} - Réf: {activeDetailExpense.reimbursementRef})
              </div>
            )}
            {activeDetailExpense.rejectionReason && (
              <p className="text-rose-700">
                <strong>{isFr ? 'Motif de refus :' : 'Rejection Reason:'}</strong> {activeDetailExpense.rejectionReason}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isFr ? 'Fermer' : 'Close'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )}
</AnimatePresence>
</div>
);
};
export default BusinessExpenseManager;