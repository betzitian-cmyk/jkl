/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Employee, PayStub } from '../types';
import { useLanguage } from './LanguageContext';
import { 
  FileText, 
  Download, 
  Mail, 
  Copy, 
  Check, 
  Send, 
  Sparkles, 
  X, 
  Building2, 
  UserCheck, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  ExternalLink,
  CreditCard,
  Layers,
  Paperclip,
  FileCheck,
  Search,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import { generateT4SlipPDF, generateRL1SlipPDF } from '../lib/pdfTaxSlips';
import { calculateEmployeeTaxSlip } from '../lib/taxSlips';

export interface TaxDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEmployee?: Employee;
  employees?: Employee[];
  stubs?: PayStub[];
  companyName?: string;
  defaultTab?: 'documents' | 'notify';
}

export type DocumentType = 't4' | 'rl1';

export const TaxDocumentsModal: React.FC<TaxDocumentsModalProps> = ({
  isOpen,
  onClose,
  selectedEmployee: initialSelectedEmployee,
  employees = [],
  stubs = [],
  companyName = 'Entreprise Démo Inc.',
  defaultTab = 'documents'
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';

  const [activeTab, setActiveTab] = useState<'documents' | 'notify'>(defaultTab);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    initialSelectedEmployee?.id || (employees.length > 0 ? employees[0].id : 'blank')
  );
  const [searchFilter, setSearchFilter] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'onboarding' | 'annual' | 'statutory'>('all');
  
  // Notification State
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationSentSuccess, setNotificationSentSuccess] = useState(false);
  const [lastSentTimestamp, setLastSentTimestamp] = useState<string | null>(null);
  const [customSubject, setCustomSubject] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [ccEmail, setCcEmail] = useState('hr@company.com');

  // Update selected employee when prop changes
  React.useEffect(() => {
    if (initialSelectedEmployee) {
      setSelectedEmpId(initialSelectedEmployee.id);
      setRecipientEmail(initialSelectedEmployee.email);
    } else if (employees.length > 0 && selectedEmpId === 'blank') {
      // keep blank if chosen, otherwise first employee
    }
  }, [initialSelectedEmployee, employees]);

  const activeEmployee = useMemo(() => {
    if (selectedEmpId === 'blank') return undefined;
    return employees.find(e => e.id === selectedEmpId) || initialSelectedEmployee;
  }, [selectedEmpId, employees, initialSelectedEmployee]);

  // Keep recipient email in sync when activeEmployee changes
  React.useEffect(() => {
    if (activeEmployee) {
      setRecipientEmail(activeEmployee.email);
      setCustomSubject(
        isFr
          ? `Action requise : Bienvenue dans l'équipe ! Remplissez votre dossier d'embauche`
          : `Action Required: Welcome to the Team! Complete Your Onboarding Questionnaire`
      );
    } else {
      setRecipientEmail('');
      setCustomSubject(
        isFr
          ? `Dossier de formulaires fiscaux et d'embauche Canada & Québec`
          : `Canada & Quebec Onboarding & Statutory Tax Package`
      );
    }
  }, [activeEmployee, isFr]);

  if (!isOpen) return null;

  // Compute tax slip for selected employee
  const employeeTaxSlipData = activeEmployee ? (() => {
    const empStubs = stubs.filter(s => s.employeeId === activeEmployee.id);
    return calculateEmployeeTaxSlip(activeEmployee, empStubs, 2026, {
      companyName,
      federalId: '123456789 RP 0001',
      neq: '1234567890 RS 0001'
    });
  })() : null;

  // Handler for individual PDF downloads
  const handleDownload = (type: DocumentType) => {
    const empPrefix = activeEmployee ? `${activeEmployee.lastName}_${activeEmployee.firstName}` : 'Vierge_Blank';
    
    switch (type) {
      case 't4': {
        if (employeeTaxSlipData) {
          const doc = generateT4SlipPDF(employeeTaxSlipData, language);
          doc.save(`Feuillet_T4_2026_${empPrefix}.pdf`);
        } else {
          // Generate with fallback dummy slip if blank
          const fallbackSlip = calculateEmployeeTaxSlip(
            activeEmployee || {
              id: 'sample',
              firstName: 'Nouveau',
              lastName: 'Employé',
              sin: '000-000-000',
              dob: '1990-01-01',
              address: '123 Rue Principale, Montréal QC',
              phone: '514-555-0100',
              email: 'employe@example.com',
              startDate: '2026-01-01',
              employmentType: 'full-time',
              baseSalary: 65000,
              frequency: 'bi-weekly',
              vacationRate: 0.04
            },
            [],
            2026,
            { companyName, federalId: '123456789 RP 0001', neq: '1234567890 RS 0001' }
          );
          const doc = generateT4SlipPDF(fallbackSlip, language);
          doc.save(`Feuillet_T4_2026_Modele.pdf`);
        }
        break;
      }
      case 'rl1': {
        if (employeeTaxSlipData) {
          const doc = generateRL1SlipPDF(employeeTaxSlipData, language);
          doc.save(`Releve_1_RL1_2026_${empPrefix}.pdf`);
        } else {
          const fallbackSlip = calculateEmployeeTaxSlip(
            activeEmployee || {
              id: 'sample',
              firstName: 'Nouveau',
              lastName: 'Employé',
              sin: '000-000-000',
              dob: '1990-01-01',
              address: '123 Rue Principale, Montréal QC',
              phone: '514-555-0100',
              email: 'employe@example.com',
              startDate: '2026-01-01',
              employmentType: 'full-time',
              baseSalary: 65000,
              frequency: 'bi-weekly',
              vacationRate: 0.04
            },
            [],
            2026,
            { companyName, federalId: '123456789 RP 0001', neq: '1234567890 RS 0001' }
          );
          const doc = generateRL1SlipPDF(fallbackSlip, language);
          doc.save(`Releve_1_RL1_2026_Modele.pdf`);
        }
        break;
      }
    }
  };

  // Handle Send Notification Simulation
  const handleSendNotification = () => {
    setIsSendingNotification(true);
    setTimeout(() => {
      setIsSendingNotification(false);
      setNotificationSentSuccess(true);
      setLastSentTimestamp(new Date().toLocaleTimeString(isFr ? 'fr-CA' : 'en-CA', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 900);
  };

  // Copy Email Body to clipboard
  const handleCopyEmail = () => {
    const firstName = activeEmployee ? activeEmployee.firstName : '[Prénom / First Name]';
    const startDate = activeEmployee ? activeEmployee.startDate : '[Date de début / Start Date]';
    const emailText = isFr 
      ? `Bonjour ${firstName},\n\nBienvenue dans notre équipe ! Nous sommes ravis de vous compter parmi nous.\n\nAfin de finaliser votre intégration et de vous assurer que vos structures de paie et d'impôt provincial sont correctement configurées, veuillez remplir le Questionnaire d'embauche ci-joint.\n\nCe dont nous avons besoin de votre part :\n1. Remplir et signer le questionnaire PDF ci-joint (11 sections).\n2. Fournir un spécimen de chèque ou formulaire de dépôt direct.\n3. Remplir le formulaire fédéral TD1 et le formulaire provincial TP-1015.3-V (Revenu Québec).\n\nVeuillez répondre à ce courriel avec vos documents complétés avant votre date d'entrée en fonction le ${startDate}.\n\nCordialement,\nL'équipe des Opérations RH - ${companyName}`
      : `Hi ${firstName},\n\nWelcome to the team! We are thrilled to have you join us.\n\nTo finalize your onboarding and ensure your payroll and provincial tax structures are set up correctly, please complete the attached New Hire Questionnaire.\n\nWhat we need from you:\n1. Fill out and sign the attached questionnaire PDF (11 sections).\n2. Provide a VOID cheque or Direct Deposit Form.\n3. Complete the federal TD1 form and provincial tax forms (TP-1015.3-V for Quebec).\n\nPlease reply to this email with your completed documents before your start date on ${startDate}.\n\nBest regards,\nThe HR Operations Team - ${companyName}`;

    navigator.clipboard.writeText(emailText);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const documentCards = [
    {
      id: 't4' as DocumentType,
      code: 'Feuillet T4 (2026)',
      title: isFr ? 'État de la rémunération payée (T4 Fédéral)' : 'Statement of Remuneration Paid (T4 Federal Slip)',
      authority: 'ARC / CRA',
      category: 'annual',
      desc: isFr
        ? 'Feuillet fiscal annuel officiel pour la déclaration de revenus de l\'employé (Cases 14, 16, 18, 20, 22, 24, 26, 40, 85).'
        : 'Annual statutory tax slip summarizing employment earnings, CPP/QPP, EI, RPP, and federal income tax withheld.',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      iconColor: 'text-emerald-600',
      isAnnual: true,
      isOnboarding: false
    },
    {
      id: 'rl1' as DocumentType,
      code: 'Relevé 1 (RL-1 2026)',
      title: isFr ? 'Revenus d\'emploi et revenus divers (Relevé 1 Québec)' : 'Employment and Other Income (Quebec RL-1 Slip)',
      authority: 'Revenu Québec',
      category: 'annual',
      desc: isFr
        ? 'Relevé fiscal provincial officiel prescrit pour la déclaration québécoise (Cases A, B, C, E, G, H, I, J, M, U).'
        : 'Official Quebec year-end tax statement reporting provincial gross salary, QPP, RQAP/QPIP, CNESST, and Quebec income tax deducted.',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60',
      iconColor: 'text-indigo-600',
      isAnnual: true,
      isOnboarding: false
    }
  ];

  const filteredCards = documentCards.filter(card => {
    const matchesSearch = 
      card.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      card.code.toLowerCase().includes(searchFilter.toLowerCase()) ||
      card.desc.toLowerCase().includes(searchFilter.toLowerCase()) ||
      card.authority.toLowerCase().includes(searchFilter.toLowerCase());

    if (!matchesSearch) return false;
    if (filterCategory === 'all') return true;
    if (filterCategory === 'onboarding') return card.isOnboarding;
    if (filterCategory === 'annual') return card.isAnnual;
    if (filterCategory === 'statutory') return card.category === 'statutory';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isFr ? 'Dossier de documents fiscaux & d\'embauche' : 'Tax Documents & Onboarding Package'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 uppercase">
                  Canada & Québec 2026
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isFr 
                  ? 'Téléchargement des formulaires officiels (TD1, TP-1015, T4, RL-1) et transmission aux nouveaux employés'
                  : 'Download official PDF forms (TD1, TP-1015, T4, RL-1) and dispatch onboarding notification packages to new hires'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Employee Context Selector */}
        <div className="px-6 py-3.5 bg-slate-100/70 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <button
              onClick={() => setActiveTab('documents')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all",
                activeTab === 'documents'
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Layers className="w-3.5 h-3.5" />
              {isFr ? 'Formulaires & Téléchargements (PDF)' : 'Available PDF Forms (6)'}
            </button>
            <button
              onClick={() => setActiveTab('notify')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all relative",
                activeTab === 'notify'
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <Mail className="w-3.5 h-3.5" />
              {isFr ? 'Aviser le nouvel employé' : 'Notify New Hire (Email)'}
              {activeEmployee && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Target Employee Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {isFr ? 'Cible :' : 'Context :'}
            </span>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="blank">📄 {isFr ? 'Modèle vierge / Blank Template' : 'Blank Template (Unassigned)'}</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  👤 {emp.lastName}, {emp.firstName} ({emp.email || 'Pas de courriel'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'documents' ? (
            <div className="space-y-5">
              {/* Filter and Top Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder={isFr ? 'Rechercher un formulaire (ex. TD1, TP-1015, T4, RL-1)...' : 'Search form (e.g. TD1, TP-1015, T4, RL-1)...'}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Category Pills & Bundle Download */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <button
                      onClick={() => setFilterCategory('all')}
                      className={cn("px-2.5 py-1 rounded-md transition-all", filterCategory === 'all' && "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-xs")}
                    >
                      {isFr ? 'Tous (6)' : 'All (6)'}
                    </button>
                    <button
                      onClick={() => setFilterCategory('onboarding')}
                      className={cn("px-2.5 py-1 rounded-md transition-all", filterCategory === 'onboarding' && "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-xs")}
                    >
                      {isFr ? 'Embauche (4)' : 'Onboarding (4)'}
                    </button>
                    <button
                      onClick={() => setFilterCategory('annual')}
                      className={cn("px-2.5 py-1 rounded-md transition-all", filterCategory === 'annual' && "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-xs")}
                    >
                      {isFr ? 'Feuillets fiscaux (2)' : 'Tax Slips T4/RL1 (2)'}
                    </button>
                  </div>

                  <button
                    onClick={() => {}}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                    title="Télécharger l'ensemble des formulaires d'embauche"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-400" />
                    {isFr ? 'Télécharger Tout (Package)' : 'Download All Package'}
                  </button>
                </div>
              </div>

              {/* Employee Summary Card if Selected */}
              {activeEmployee && (
                <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/80 dark:border-blue-800/60 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {activeEmployee.firstName[0]}{activeEmployee.lastName[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {activeEmployee.lastName.toUpperCase()}, {activeEmployee.firstName}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-mono">
                          NAS : {activeEmployee.sin || '000-000-000'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {activeEmployee.email}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isFr 
                          ? `Date de début : ${activeEmployee.startDate || '2026-01-01'} • Statut d'intégration : ${activeEmployee.onboardingStatus || 'Non complété'}`
                          : `Start Date : ${activeEmployee.startDate || '2026-01-01'} • Onboarding Status : ${activeEmployee.onboardingStatus || 'Incomplete'}`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('notify')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {isFr ? 'Envoyer l\'avis d\'embauche' : 'Send Onboarding Email'}
                  </button>
                </div>
              )}

              {/* Grid of Documents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCards.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4.5 hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border", doc.badgeColor)}>
                            {doc.code}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {doc.authority}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 rounded">
                          PDF • 2026
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        <FileText className={cn("w-4 h-4 shrink-0", doc.iconColor)} />
                        {doc.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {doc.desc}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 italic">
                        {activeEmployee 
                          ? (isFr ? `Pré-rempli pour ${activeEmployee.firstName}` : `Pre-filled for ${activeEmployee.firstName}`)
                          : (isFr ? 'Modèle officiel vierge' : 'Official Blank Form')}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(doc.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95"
                          title={isFr ? `Télécharger ${doc.code} en PDF` : `Download ${doc.code} PDF`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          {isFr ? 'Télécharger PDF' : 'Download PDF'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Tab: HR Notification & Email Dispatcher */
            <div className="space-y-5">
              {/* Notification Banner */}
              <div className="bg-slate-900 text-white p-4.5 rounded-xl border border-slate-700 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
                      {isFr ? 'Centre d\'avis d\'embauche automatisé' : 'Automated Onboarding Dispatcher'}
                    </span>
                    <span className="text-xs text-slate-400">AppSheet / Bot Notification Workflow</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {isFr ? 'Transmettre le dossier d\'embauche et les formulaires fiscaux' : 'Notify New Hire & Send Statutory Onboarding Documents'}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    {isFr
                      ? 'Générez et envoyez instantanément le courriel d\'accueil officiel avec le questionnaire d\'embauche en pièce jointe, les formulaires TD1 / TP-1015 et la demande de spécimen de chèque.'
                      : 'Generate and send the welcome onboarding email with the attached 11-section questionnaire PDF, TD1 / TP-1015 tax forms, and direct deposit instructions.'}
                  </p>
                </div>

                <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[11px] text-slate-400">
                    {isFr ? 'Date d\'embauche :' : 'Start Date :'}
                  </span>
                  <span className="text-xs font-bold text-blue-300 font-mono">
                    {activeEmployee?.startDate || '2026-09-01'}
                  </span>
                </div>
              </div>

              {/* Status Alert if Sent */}
              <AnimatePresence>
                {notificationSentSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                          {isFr 
                            ? `Avis d'embauche envoyé avec succès à ${recipientEmail || activeEmployee?.email} !`
                            : `Onboarding notification successfully sent to ${recipientEmail || activeEmployee?.email}!`}
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          {isFr ? `Horodatage de livraison : ${lastSentTimestamp} • Statut : En attente de signature` : `Delivered at: ${lastSentTimestamp} • Status: Awaiting signature`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotificationSentSuccess(false)}
                      className="text-xs text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 font-semibold"
                    >
                      {isFr ? 'Fermer' : 'Dismiss'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Form Configuration */}
              <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isFr ? 'Destinataire (Courriel de l\'employé)' : 'Recipient (Employee Email)'}
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="nom.employe@courriel.com"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {isFr ? 'Copie conforme (CC)' : 'Carbon Copy (CC)'}
                    </label>
                    <input
                      type="email"
                      value={ccEmail}
                      onChange={(e) => setCcEmail(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isFr ? 'Objet du courriel' : 'Email Subject'}
                  </label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                {/* Email Body Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isFr ? 'Corps du message (Aperçu du modèle)' : 'Message Body (Template Preview)'}
                    </label>
                    <button
                      onClick={handleCopyEmail}
                      className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                    >
                      {copiedEmail ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">{isFr ? 'Copié !' : 'Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          {isFr ? 'Copier le texte' : 'Copy Text'}
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {isFr ? (
`Bonjour ${activeEmployee ? activeEmployee.firstName : '<<[Prénom]>>'},

Bienvenue dans notre équipe ! Nous sommes ravis de vous compter parmi nous.

Afin de finaliser votre intégration et de vous assurer que vos structures de paie et d'impôt provincial sont correctement configurées, veuillez remplir le Questionnaire d'embauche ci-joint.

Ce dont nous avons besoin de votre part :
1. Remplir et signer le questionnaire PDF ci-joint (11 sections).
2. Fournir un spécimen de chèque ou formulaire de dépôt direct de votre institution financière.
3. Remplir le formulaire fédéral TD1 et le formulaire provincial TP-1015.3-V (Revenu Québec).

Veuillez répondre à ce courriel avec vos documents complétés avant votre date d'entrée en fonction le ${activeEmployee?.startDate || '<<[Date de début]>>'}.

« Une fois ce formulaire rempli, signez-le, datez-le et remettez-le aux RH ! Nous nous occupons des calculs à partir d'ici. »

Cordialement,
L'équipe des Opérations RH
${companyName}`
                    ) : (
`Hi ${activeEmployee ? activeEmployee.firstName : '<<[First Name]>>'},

Welcome to the team! We are thrilled to have you join us.

To finalize your onboarding and ensure your payroll and provincial tax structures are set up correctly, please complete the attached New Hire Questionnaire.

What we need from you:
1. Fill out and sign the attached questionnaire PDF (11 sections).
2. Provide a VOID cheque or Direct Deposit Form from your financial institution.
3. Complete the federal TD1 form and provincial tax forms (TP-1015.3-V if you are based in Quebec).

Please reply to this email with your completed documents before your start date on ${activeEmployee?.startDate || '<<[Start Date]>>'}.

"Once you've filled this out, sign and date it, and hand it back to HR! We'll take care of the math from here."

Best regards,
The HR Operations Team
${companyName}`
                    )}
                  </div>
                </div>

                {/* Attached Files List */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    {isFr ? 'Pièces jointes incluses au courriel (4 fichiers PDF) :' : 'Attached Files Included with Email (4 PDF files):'}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate font-medium">
                          Questionnaire_Embauche_{activeEmployee ? `${activeEmployee.lastName}_${activeEmployee.firstName}` : '2026'}.pdf
                        </span>
                      </div>
                      <button
                        onClick={() => {}}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Télécharger"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="truncate font-medium">Formulaire_TD1_Federal_2026.pdf</span>
                      </div>
                      <button
                        onClick={() => {}}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Télécharger"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate font-medium">Formulaire_TP1015_3_Quebec_2026.pdf</span>
                      </div>
                      <button
                        onClick={() => {}}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Télécharger"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="truncate font-medium">Autorisation_Depot_Direct_2026.pdf</span>
                      </div>
                      <button
                        onClick={() => {}}
                        className="text-blue-600 hover:text-blue-700 p-1"
                        title="Télécharger"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
                  >
                    <Download className="w-4 h-4 text-slate-500" />
                    {isFr ? 'Télécharger le dossier complet (.PDF)' : 'Download Full Package (.PDF)'}
                  </button>

                  <button
                    type="button"
                    disabled={isSendingNotification}
                    onClick={handleSendNotification}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95",
                      isSendingNotification ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500"
                    )}
                  >
                    {isSendingNotification ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {isFr ? 'Transmission en cours...' : 'Dispatching notification...'}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {isFr ? 'Envoyer l\'avis au nouvel employé' : 'Dispatch Email to New Hire'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isFr ? 'Conformité légale Canada (ARC) & Québec (Revenu Québec) 2026' : 'Statutory Compliance for Canada (CRA) & Quebec (Revenu Quebec) 2026'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isFr ? 'Fermer' : 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
