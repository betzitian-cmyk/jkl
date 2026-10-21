/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Employee, 
  PayFrequency, 
  CompensationType, 
  PayStub,
  PermissionKey,
  PermissionsMap,
  ALL_PERMISSION_KEYS,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_MANAGER_PERMISSIONS,
  DEFAULT_EMPLOYEE_PERMISSIONS
} from '../types';
import { 
  UserPlus, User, Edit2, Trash2, Mail, Phone, Search, Download, 
  FileText, CheckCircle2, CreditCard, Sparkles, FileCheck, Send, 
  Eye, DollarSign, Calendar, Building, Briefcase, Calculator, AlertTriangle,
  ShieldCheck, Users, Lock, CheckSquare, Square, ChevronDown, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '../lib/utils';
import { useLanguage } from './LanguageContext';
import { EmployeeOnboardingForm } from './EmployeeOnboardingForm';
import { TaxDocumentsModal } from './TaxDocumentsModal';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { PayStubModal } from './PayStubModal';
import { BatchPayrollModal } from './BatchPayrollModal';
import { Storage } from '../lib/storage';

const PERMISSION_DOMAINS_META = [
  {
    id: 'domain_sys',
    titleFr: '1. Administration système & Sécurité',
    titleEn: '1. System Admin & Platform Security',
    icon: ShieldCheck,
    keys: [
      { key: 'SYS_ADMIN_DASHBOARD_ACCESS', labelFr: 'Accès au tableau de bord administrateur', labelEn: 'Access Admin / Executive Dashboard', descFr: 'Accès complet à l\'interface administrative et aux métriques financières.', descEn: 'Full administrative backend interface and financial metrics.' },
      { key: 'SYS_EMP_SELF_SERVICE_ACCESS', labelFr: 'Accès au portail libre-service employé', labelEn: 'Access Employee Self-Service Dashboard', descFr: 'Restreint l\'interface exclusivement au portail personnel de l\'employé.', descEn: 'Restricts interface exclusively to personal employee portal data.' },
      { key: 'SYS_MANAGE_ENV_API_KEYS', labelFr: 'Gérer les clés API et variables d\'environnement', labelEn: 'Manage System Environment Variables & API Keys', descFr: 'Privilège élevé pour consulter, éditer et pivoter les clés API (Gemini, Groq, etc.).', descEn: 'High-privilege access to view, edit, and rotate API keys.' },
      { key: 'SYS_ACCESS_DATABASE_CONSOLE', labelFr: 'Console de base de données & Schéma SQL', labelEn: 'Access Database Console & System Schema', descFr: 'Exécuter des requêtes SQL et gérer la base de données.', descEn: 'Run direct SQL queries and manage database migrations.' },
      { key: 'SYS_VIEW_DIAGNOSTICS_LOGS', labelFr: 'Journal de diagnostic & État du système', labelEn: 'View System Health & Diagnostic Logs', descFr: 'Surveiller l\'état des connexions et des journaux de sécurité.', descEn: 'Monitor database connection status and security audit logs.' },
      { key: 'SYS_TOGGLE_ROLE_PREVIEW', labelFr: 'Basculer le mode de prévisualisation des rôles', labelEn: 'Toggle Role Preview Mode', descFr: 'Changer la perspective UI entre Admin et Employé pour les tests.', descEn: 'Switch between Admin and Employee UI perspectives for testing.' },
      { key: 'SYS_CONFIGURE_COMPANY_SETTINGS', labelFr: 'Configurer les paramètres de l\'entreprise', labelEn: 'Configure Company Settings & Identifiers', descFr: 'Mettre à jour la raison sociale, les numéros d\'identification (NEQ, BN, RQ) et taux.', descEn: 'Update legal name, tax IDs (NEQ, BN, Revenu Québec), and statutory rates.' },
      { key: 'SYS_MANAGE_BILL96_COMPLIANCE', labelFr: 'Gestion de la conformité Loi 96 (Langue)', labelEn: 'Manage Bill 96 & Language Compliance', descFr: 'Gérer la langue d\'affichage et la langue officielle de communication.', descEn: 'Toggle application UI language and official communication preferences.' },
    ]
  },
  {
    id: 'domain_emp',
    titleFr: '2. Profils d\'employés & Contrôle de portée',
    titleEn: '2. Employee Profile & Scope Control',
    icon: Users,
    keys: [
      { key: 'EMP_MANAGE_ALL_PROFILES', labelFr: 'Gérer tous les profils d\'employés', labelEn: 'Create, Update, Archive, and Manage All Profiles', descFr: 'Accès complet pour ajouter, modifier ou archiver les dossiers d\'employés.', descEn: 'Full organizational access to employee master records.' },
      { key: 'EMP_ASSIGN_ROLES_PERMISSIONS', labelFr: 'Attribuer les rôles et permissions', labelEn: 'Assign Roles & Modify Access Permissions', descFr: 'Accorder ou révoquer les drapeaux de permissions granulaires.', descEn: 'Grant or revoke specific permission flags during onboarding.' },
      { key: 'EMP_OVERRIDE_CONTEXT_SELECT', labelFr: 'Sélecteur d\'employé global (Commutateur)', labelEn: 'Override Employee Context Selection (Global Switcher)', descFr: 'Si désactivé, l\'utilisateur est verrouillé à sa propre fiche dans tous les modules.', descEn: 'If unchecked, the user is strictly locked to their own profile across all modules.' },
      { key: 'EMP_VIEW_DIRECT_REPORTS_BASIC', labelFr: 'Consulter les informations des subordonnés directs', labelEn: 'View Basic Profile Details of Direct Reports Only', descFr: 'Portée managériale restreinte aux coordonnées des membres de l\'équipe.', descEn: 'Restricted managerial scope to view direct report details.' },
      { key: 'EMP_VIEW_SENSITIVE_PII', labelFr: 'Consulter les renseignements personnels (PII)', labelEn: 'View Sensitive Personal Identifiers (PII)', descFr: 'Accès aux données sensibles (NAS, adresse complète, contacts d\'urgence).', descEn: 'Access restricted employee data (SIN, full address, emergency contacts).' },
      { key: 'EMP_VIEW_OWN_PROFILE', labelFr: 'Consulter son propre profil', labelEn: 'View Own Personal Profile Details', descFr: 'Accès en libre-service à ses propres données personnelles.', descEn: 'Access self-service personal profile records.' },
      { key: 'EMP_EDIT_OWN_PROFILE', labelFr: 'Modifier son propre profil', labelEn: 'Edit Own Personal Profile Details', descFr: 'Mettre à jour son adresse, téléphone et contacts d\'urgence.', descEn: 'Self-service updates to home address and phone numbers.' },
      { key: 'EMP_MANAGE_COMPLIANCE_CONSENTS', labelFr: 'Gérer les consentements de conformité (NDA, Manuel)', labelEn: 'Manage Document Compliance Consents', descFr: 'Suivre les signatures du manuel d\'employé, NDA et vérification d\'intégrité.', descEn: 'Track signatures for NDAs, Employee Handbooks, and background checks.' },
    ]
  },
  {
    id: 'domain_pay',
    titleFr: '3. Paie, Rémunération & Dépôt direct',
    titleEn: '3. Payroll, Compensation & Direct Deposit',
    icon: DollarSign,
    keys: [
      { key: 'PAY_EXECUTE_GLOBAL_RUNS', labelFr: 'Exécuter les paies globales', labelEn: 'Execute Global Payroll Runs', descFr: 'Calculer les salaires nets, retenues et coûts patronaux pour tous.', descEn: 'Calculate net pay, statutory deductions, and employer costs across all staff.' },
      { key: 'PAY_SET_MODIFY_ALL_COMPENSATION', labelFr: 'Définir et modifier les taux de salaire', labelEn: 'Set & Modify All Employee Pay Rates & Compensation', descFr: 'Gérer les salaires annuels, taux horaires et majorations.', descEn: 'Manage hourly wages, annual salaries, bonuses, and overtime multipliers.' },
      { key: 'PAY_VIEW_DIRECT_REPORTS_COMPENSATION', labelFr: 'Consulter le salaire des subordonnés directs', labelEn: 'View Compensation Details of Direct Reports Only', descFr: 'Accès managérial aux informations de rémunération de son équipe.', descEn: 'Managerial access to wage information for assigned team members.' },
      { key: 'PAY_VIEW_OWN_COMPENSATION_HISTORY', labelFr: 'Consulter sa propre rémunération', labelEn: 'View Own Pay Rate & Compensation History', descFr: 'Consulter son propre taux horaire, salaire et historique de paie.', descEn: 'Self-service access to pay stubs, rate history, and wage progression.' },
      { key: 'PAY_CONFIGURE_COMMISSION_PARAMS', labelFr: 'Configurer les commissions (TD1X / TP-1015.R)', labelEn: 'Configure Commission Earner Parameters', descFr: 'Définir les revenus et dépenses estimées des commissionnaires.', descEn: 'Set estimated commission income and deductible expenses.' },
      { key: 'PAY_MANAGE_GLOBAL_BANKING', labelFr: 'Gérer les comptes bancaires d\'entreprise & dépôt direct', labelEn: 'Manage Global Bank Account Details', descFr: 'Gérer les numéros de transit, d\'institution et de compte de l\'équipe.', descEn: 'View and edit employee bank numbers for direct deposit.' },
      { key: 'PAY_GENERATE_CPA005_EFT', labelFr: 'Générer les fichiers de dépôt direct CPA 005', labelEn: 'Generate CPA Standard 005 Direct Deposit Files', descFr: 'Exporter les fichiers de paiement bancaire électroniques (EFT 1464 octets).', descEn: 'Export batch Electronic Funds Transfer payment files.' },
      { key: 'PAY_EDIT_OWN_DIRECT_DEPOSIT', labelFr: 'Modifier son propre compte de dépôt direct', labelEn: 'View & Edit Own Direct Deposit Details', descFr: 'Mettre à jour ses propres coordonnées bancaires.', descEn: 'Self-service updates to personal direct deposit bank accounts.' },
      { key: 'PAY_VIEW_ALL_HISTORICAL_STUBS', labelFr: 'Consulter tous les bulletins de paie historiques', labelEn: 'View All Historical Pay Stubs', descFr: 'Accéder à l\'ensemble des bulletins de paie de l\'organisation.', descEn: 'Access company-wide pay stub archive with filtering options.' },
      { key: 'PAY_VIEW_DOWNLOAD_OWN_STUBS', labelFr: 'Consulter et télécharger ses propres bulletins', labelEn: 'View & Download Own Pay Stubs', descFr: 'Téléchargement PDF de ses bulletins de paie personnels.', descEn: 'Self-service PDF download of personal pay stubs.' },
      { key: 'PAY_DELETE_REVERSE_STUBS', labelFr: 'Supprimer ou annuler des bulletins de paie', labelEn: 'Delete & Reverse Historical Pay Stubs', descFr: 'Annuler des bulletins de paie passés et recalculer les cumuls.', descEn: 'Void past pay stubs and recalculate year-to-date accumulators.' },
    ]
  },
  {
    id: 'domain_tax',
    titleFr: '4. Conformité fiscale, Retenues & Remises',
    titleEn: '4. Tax Compliance, Remittances & Statutory Filings',
    icon: FileText,
    keys: [
      { key: 'TAX_CONFIGURE_FEDERAL_PROVINCIAL_PARAMS', labelFr: 'Configurer les paramètres fiscaux (TD1 / TP-1015.3-V)', labelEn: 'Configure Federal & Provincial Tax Parameters', descFr: 'Ajuster les codes de crédit d\'impôt, montants de base et retenues additionnelles.', descEn: 'Modify TD1 and TP-1015.3-V tax codes and additional deductions.' },
      { key: 'TAX_CONFIGURE_EXEMPTION_FLAGS', labelFr: 'Configurer les exemptions légales (AE, RRQ, RQAP)', labelEn: 'Configure Statutory Exemption Flags', descFr: 'Définir les exemptions d\'assurance-emploi, RRQ et RQAP.', descEn: 'Set employee flags for EI, QPP, and QPIP exemptions.' },
      { key: 'TAX_APPLY_SOURCE_REDUCTIONS', labelFr: 'Appliquer les réductions d\'impôt à la source (T1213 / TP-1016)', labelEn: 'Apply CRA & Revenu Québec Source Tax Reductions', descFr: 'Saisir les lettres d\'autorisation de réduction d\'impôt officielles.', descEn: 'Record approved tax reduction letters (Form T1213 / Form TP-1016).' },
      { key: 'TAX_CONFIGURE_GARNISHMENTS', labelFr: 'Configurer les saisies-arrêts et ordonnances de la cour', labelEn: 'Configure Wage Garnishments & Court Orders', descFr: 'Configurer les pensions alimentaires et dettes fiscales.', descEn: 'Set up support payments, civil judgments, and tax arrears deductions.' },
      { key: 'TAX_CONFIGURE_PRE_POST_DEDUCTIONS', labelFr: 'Configurer les déductions pré/post-impôt (REER, Assurances)', labelEn: 'Configure Pre-Tax & Post-Tax Deductions', descFr: 'Gérer les cotisations REER collectif et primes d\'assurance.', descEn: 'Manage group RRSP pre-tax deductions and insurance premiums.' },
      { key: 'TAX_CALCULATE_EMPLOYER_CONTRIBUTIONS', labelFr: 'Calculer les cotisations patronales (FSS, CNESST, CNT)', labelEn: 'Calculate & Report Employer Statutory Contributions', descFr: 'Calculer les charges patronales du Québec.', descEn: 'Compute employer QPP, EI, QPIP, HSF (FSS), CNESST, and CNT dues.' },
      { key: 'TAX_GENERATE_MONTHLY_REMITTANCES', labelFr: 'Générer les rapports de remises mensuelles (PD7A / TPZ-1015)', labelEn: 'Generate Monthly Remittance Reports', descFr: 'Créer les échéanciers de remises à l\'ARC et à Revenu Québec.', descEn: 'Create CRA PD7A and Revenu Québec TPZ-1015 schedules.' },
      { key: 'TAX_GENERATE_ANNUAL_SLIPS_T4_RL1', labelFr: 'Générer les feuillets fiscaux annuels (T4 & RL-1 XML)', labelEn: 'Generate Annual Tax Slips (T4 & RL-1)', descFr: 'Émettre et transmettre les feuillets T4 et Relevé 1 en format XML.', descEn: 'Issue and transmit official year-end tax slips and batch XML files.' },
      { key: 'TAX_GENERATE_ROE', labelFr: 'Générer et transmettre les Relevés d\'emploi (RLE / ROE)', labelEn: 'Generate Records of Employment (ROE)', descFr: 'Calculer les gains assurables et transmettre via Service Canada API.', descEn: 'Compute insurable earnings and transmit via Service Canada Web API.' },
      { key: 'TAX_TRACK_WSDRF_TRAINING', labelFr: 'Suivi de la loi du 1% en formation (FDRCMT / WSDRF)', labelEn: 'Track WSDRF / FDRCMT 1% Training Compliance', descFr: 'Surveiller les exigences de formation pour la masse salariale > 2 M$.', descEn: 'Monitor skills development fund requirements for payrolls > $2M CAD.' },
      { key: 'TAX_VIEW_OWN_DECLARATIONS_SLIPS', labelFr: 'Consulter ses déclarations et télécharger ses feuillets T4/RL-1', labelEn: 'View Own Submitted Tax Declarations & Download Tax Slips', descFr: 'Accès personnel aux déclarations faites et aux feuillets T4/RL-1.', descEn: 'Personal access to filed tax declarations and year-end slips.' },
    ]
  },
  {
    id: 'domain_exp',
    titleFr: '5. Gestion des notes de frais & Remboursements',
    titleEn: '5. Expense Management & Reimbursements',
    icon: CreditCard,
    keys: [
      { key: 'EXP_APPROVE_REIMBURSE_REJECT_GLOBAL', labelFr: 'Approuver, rembourser ou rejeter les dépenses globales', labelEn: 'Approve, Reimburse & Reject Global Expenses', descFr: 'Approbation financière et remboursement de toutes les demandes de l\'entreprise.', descEn: 'Administrative review and financial approval of all employee claims.' },
      { key: 'EXP_MANAGE_GLOBAL_EXPENSES', labelFr: 'Gérer le catalogue des dépenses d\'entreprise', labelEn: 'Manage Global Business Expenses', descFr: 'Créer, modifier, catégoriser et supprimer des dépenses globales.', descEn: 'Create, edit, categorize, and delete expenses across all departments.' },
      { key: 'EXP_AUTOMATE_TAX_CREDIT_EXTRACTION', labelFr: 'Extraction automatique des crédits de taxe (CTI / RTI)', labelEn: 'Automate Sales Tax Credit Extraction', descFr: 'Calculer les crédits de taxe sur les intrants (TPS) et remboursements (TVQ).', descEn: 'Calculate Input Tax Credits (GST) and Input Tax Refunds (QST).' },
      { key: 'EXP_SUBMIT_OWN_CLAIMS', labelFr: 'Soumettre ses propres notes de frais', labelEn: 'Submit Own Expense Claims', descFr: 'Créer et soumettre ses pièces justificatives personnelles.', descEn: 'Create and submit personal expense items with receipt attachments.' },
      { key: 'EXP_MANAGE_OWN_PENDING_CLAIMS', labelFr: 'Gérer ses propres dépenses en attente', labelEn: 'View, Edit & Delete Own Pending Expenses', descFr: 'Modifier ou retirer ses propres dépenses avant approbation.', descEn: 'Manage personal expense requests prior to administrative approval.' },
    ]
  },
  {
    id: 'domain_time',
    titleFr: '6. Feuilles de temps, Présences & Congés',
    titleEn: '6. Timesheet, Attendance & Leave Management',
    icon: Calendar,
    keys: [
      { key: 'TIME_MANAGE_GLOBAL_TIMESHEETS', labelFr: 'Gérer les feuilles de temps globales', labelEn: 'Manage Global Timesheets & Time Entries', descFr: 'Modifier, approuver ou verrouiller les heures de tous les employés.', descEn: 'Edit, approve, or lock shift hours and overtime logs for all employees.' },
      { key: 'TIME_APPROVE_REJECT_GLOBAL_LEAVE', labelFr: 'Approuver ou rejeter les demandes de congé globales', labelEn: 'Approve & Reject Global Leave Requests', descFr: 'Examen et approbation managériale des demandes de congé.', descEn: 'Managerial review of vacation, sick leave, and personal time-off requests.' },
      { key: 'TIME_VIEW_ALL_APPROVED_ABSENCES', labelFr: 'Consulter le calendrier des absences approuvées', labelEn: 'View All Approved Employee Absence Requests', descFr: 'Visibilité globale en lecture seule sur le calendrier des congés.', descEn: 'Read-only global visibility into the approved leave calendar.' },
      { key: 'TIME_MANAGE_HOLIDAYS_LEAVE_BALANCES', labelFr: 'Gérer les jours fériés et banques de congés', labelEn: 'Manage Statutory Holiday Calendar & Leave Balances', descFr: 'Configurer les 8 jours fériés légaux du Québec et ajuster les banques.', descEn: 'Configure official Quebec statutory holidays and adjust accrual banks.' },
      { key: 'TIME_LOG_SUBMIT_OWN_HOURS', labelFr: 'Saisir et soumettre ses propres heures de travail', labelEn: 'Log & Submit Own Working Hours', descFr: 'Saisie personnelle des heures quotidiennes et des pauses.', descEn: 'Personal time-tracking and break logging.' },
      { key: 'TIME_MANAGE_OWN_LEAVE_REQUESTS', labelFr: 'Créer et gérer ses propres demandes de congé', labelEn: 'Create, Edit, View & Delete Own Leave Requests', descFr: 'Soumettre et suivre ses propres demandes de congé.', descEn: 'Submit and manage personal time-off requests.' },
    ]
  },
  {
    id: 'domain_tool',
    titleFr: '7. Outils IA, OCR & Suivi GPS',
    titleEn: '7. Specialized AI, OCR & Mobile Tracking Tools',
    icon: Sparkles,
    keys: [
      { key: 'TOOL_PROCESS_GLOBAL_DOCS_AI', labelFr: 'Traitement global des documents par OCR / IA', labelEn: 'Process Global Documents via AI & OCR Engine', descFr: 'Traitement massif par IA des factures fournisseurs et reçus.', descEn: 'Administrative bulk processing of vendor invoices, receipts, and timesheets.' },
      { key: 'TOOL_VERIFY_TAX_REGISTRATION_NUMBERS', labelFr: 'Vérification en temps réel des numéros de taxes (TPS/TVQ)', labelEn: 'Execute Real-Time Tax Registration Verification', descFr: 'Valider l\'authenticité des numéros de taxes fournisseurs auprès des registres.', descEn: 'Validate GST/QST/BN registration numbers against official tax registries.' },
      { key: 'TOOL_SUBMIT_OWN_INVOICE_AUDIT_EXPENSES', labelFr: 'Utiliser l\'application Auditeur de Factures (`/inv`)', labelEn: 'Submit Personal Expenses via Invoice Audit App (`/inv`)', descFr: 'Extraire des dépenses personnelles à partir de numérisations de reçus.', descEn: 'Restricts the AI invoice scanner to auto-populate personal expense claims.' },
      { key: 'TOOL_SUBMIT_OWN_GPS_TRIPS', labelFr: 'Utiliser l\'application GPS TripLog (`/gps`)', labelEn: 'Submit Personal Trips via GPS TripLog App (`/gps`)', descFr: 'Enregistrer ses trajets professionnels et les convertir en indemnité kilométrique (0,70 $/km).', descEn: 'Use GPS mileage tracking to convert business distance into reimbursement claims.' },
      { key: 'TOOL_MANAGE_GLOBAL_GPS_TRIP_LOGS', labelFr: 'Gérer les journaux de déplacements GPS globaux', labelEn: 'Manage Global Driving Trip Logs', descFr: 'Consulter et inspecter les trajets effectués par l\'ensemble des conducteurs.', descEn: 'View, inspect, and delete trip history logs across all company drivers.' },
    ]
  },
  {
    id: 'domain_corp',
    titleFr: '8. Distributions corporatives & Équité',
    titleEn: '8. Corporate Distributions & Shareholder Equity',
    icon: Building,
    keys: [
      { key: 'CORP_MANAGE_DISTRIBUTIONS_DIVIDENDS', labelFr: 'Gérer les dividendes et distributions corporatives', labelEn: 'Manage Corporate Distributions & Dividends', descFr: 'Calculer et autoriser les dividendes déterminés/non déterminés.', descEn: 'Calculate and authorize eligible/non-eligible dividends and capital gains.' },
      { key: 'CORP_GENERATE_SHAREHOLDER_SLIPS_T5_RL3', labelFr: 'Générer les feuillets fiscaux d\'actionnaires (T5 & Relevé 3)', labelEn: 'Generate Shareholder Tax Slips (T5 / RL-3)', descFr: 'Émettre les feuillets de dividendes T5 et Relevé 3 pour les actionnaires.', descEn: 'Issue federal T5 and Quebec RL-3 slips for corporate distributions.' },
      { key: 'CORP_TRACK_OWNER_CAPITAL_DRAWS', labelFr: 'Suivi des retraits de capital des propriétaires', labelEn: 'Track Owner Capital Draws', descFr: 'Enregistrer les retraits de capital non imposables du propriétaire.', descEn: 'Record non-taxable owner equity withdrawals and capital account adjustments.' },
    ]
  }
];

interface EmployeeManagerProps {
  employees: Employee[];
  payStubs?: PayStub[];
  onAdd: (employee: Omit<Employee, 'id'>) => void;
  onEdit: (id: string, updates: Partial<Employee>) => void;
  onDelete: (id: string) => void;
  onPayStubCreated?: (stub: PayStub) => void;
}

export const EmployeeManager: React.FC<EmployeeManagerProps> = ({ 
  employees, 
  payStubs = [],
  onAdd, 
  onEdit, 
  onDelete,
  onPayStubCreated 
}) => {
  const { t, language } = useLanguage();
  const isFr = language === 'fr';
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'onboarding'>('all');
  
  // Modals state
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [payStubModalEmployee, setPayStubModalEmployee] = useState<Employee | undefined>(undefined);
  const [isPayStubModalOpen, setIsPayStubModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [selectedEmployeeForQuestionnaire, setSelectedEmployeeForQuestionnaire] = useState<Employee | undefined>(undefined);
  
  // Tax Documents & Notification Modal State
  const [isTaxDocsOpen, setIsTaxDocsOpen] = useState(false);
  const [selectedEmployeeForTaxDocs, setSelectedEmployeeForTaxDocs] = useState<Employee | undefined>(undefined);
  const [taxDocsDefaultTab, setTaxDocsDefaultTab] = useState<'documents' | 'notify'>('documents');
  const [companyName, setCompanyName] = useState('ApplepAI Inc.');

  // Batch Payroll Simulation State
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [isBatchPayrollModalOpen, setIsBatchPayrollModalOpen] = useState(false);

  React.useEffect(() => {
    Storage.getSettings().then(settings => {
      if (settings?.companyName) {
        setCompanyName(settings.companyName);
      }
    });
  }, []);

  const defaultFormValues: Omit<Employee, 'id'> = {
    firstName: '',
    lastName: '',
    preferredName: '',
    sin: '',
    middleInitial: '',
    dob: '',
    address: '',
    city: '',
    postalCode: '',
    mailingAddress: '',
    phone: '',
    email: '',
    startDate: new Date().toISOString().split('T')[0],
    employmentType: 'full-time',
    compensationType: 'salary',
    department: 'Administration',
    jobTitle: 'Spécialiste',
    baseSalary: 60000,
    hourlyRate: 30,
    frequency: 'bi-weekly',
    vacationRate: 0.04,
    bankName: 'Desjardins',
    accountNumber: '',
    transitNumber: '',
    institutionNumber: '',
    paymentMethod: 'direct_deposit',
    status: 'active',
    onboardingStatus: 'incomplete',
    languagePreference: 'fr',
    province: 'QC',
    provinceOfEmployment: 'QC',
    claimFederalBasicPersonalAmount: true,
    hasMultipleEmployers: false,
    federalTd1ClaimAmount: 16129,
    federalAdditionalTax: 0,
    t1213Reduction: 0,
    eiExempt: false,
    qppExempt: false,
    claimProvincialBasicPersonalAmount: true,
    quebecTp1015Line10Code: 'A',
    qcAdditionalTax: 0,
    livesInNorthernZone: false,
    spouseCreditTransfer: false,
    tp1016Reduction: 0,
    qpipExempt: false,
    cnesstClassification: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    englishProficiency: 'fluent',
    frenchProficiency: 'fluent',
    otherLanguages: '',
    isCommissionEarner: false,
    commissionEstimatedIncome: 0,
    commissionEstimatedExpenses: 0,
    voluntaryPreTaxRrsp: 0,
    voluntaryPostTaxHealth: 0,
    groupInsuranceEnrollment: false,
    groupInsuranceCoverage: 'single',
    beneficiaryName: '',
    beneficiaryRelationship: '',
    beneficiaryShare: 100,
    hasTP1015: true,
    hasFederalTD1: true,
    hasDirectDepositAuth: true,
    electronicTaxSlipConsent: true,
    backgroundCheckConsent: true,
    ndaSigned: true,
    nonSolicitationSigned: true,
    handbookAcknowledged: true,
    notes: '',
    garnishments: [],
    permissions: DEFAULT_EMPLOYEE_PERMISSIONS,
  };

  const [formData, setFormData] = useState<Omit<Employee, 'id'>>(defaultFormValues);
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({
    domain_sys: true,
    domain_emp: true,
    domain_pay: false,
    domain_tax: false,
    domain_exp: false,
    domain_time: false,
    domain_tool: false,
    domain_corp: false,
  });

  const [inviteModalData, setInviteModalData] = useState<{
    inviteUrl: string;
    inviteToken: string;
    employeeName: string;
    workEmail: string;
  } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const resetForm = () => {
    setFormData(defaultFormValues);
  };

  const handleCreateWithInvite = async () => {
    try {
      const result = await Storage.createEmployeeWithInvite({
        firstName: formData.firstName,
        lastName: formData.lastName,
        workEmail: formData.email,
        jobTitle: formData.jobTitle || 'Spécialiste',
        departmentId: formData.department || 'Administration',
        employmentType: formData.employmentType || 'full-time',
        payFrequency: formData.frequency || 'bi-weekly',
        baseRate: formData.baseSalary || 60000,
        permissions: formData.permissions || DEFAULT_EMPLOYEE_PERMISSIONS
      });

      if (result.success) {
        setInviteModalData({
          inviteUrl: result.inviteUrl,
          inviteToken: result.inviteToken,
          employeeName: `${formData.firstName} ${formData.lastName}`,
          workEmail: formData.email
        });
        setIsAdding(false);
        resetForm();
        if (result.employee) {
          onAdd(result.employee);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Error creating invite');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEdit(editingId, formData);
      setEditingId(null);
    } else {
      onAdd(formData);
      setIsAdding(false);
    }
    resetForm();
  };

  const handleEdit = (employee: Employee) => {
    setFormData({
      ...defaultFormValues,
      ...employee,
      compensationType: employee.compensationType || (employee.hourlyRate && employee.hourlyRate > 0 ? 'hourly' : 'salary'),
      permissions: employee.permissions || DEFAULT_EMPLOYEE_PERMISSIONS
    });
    setEditingId(employee.id);
  };

  const filteredEmployees = employees
    .filter(e => activeTab === 'all' || e.onboardingStatus === 'incomplete')
    .filter(e => 
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.sin && e.sin.includes(searchTerm)) ||
      (e.jobTitle && e.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  const toggleSelectEmployee = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedEmployeeIds(prev => {
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
    const visibleIds = filteredEmployees.map(e => e.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedEmployeeIds.has(id));
    if (allSelected) {
      setSelectedEmployeeIds(new Set());
    } else {
      setSelectedEmployeeIds(new Set(visibleIds));
    }
  };

  const handleOpenBatchPayroll = () => {
    if (selectedEmployeeIds.size === 0) {
      // Auto-select all filtered employees if none selected for immediate 1-click convenience
      setSelectedEmployeeIds(new Set(filteredEmployees.map(e => e.id)));
    }
    setIsBatchPayrollModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full lg:w-auto">
          <div className="flex p-1 bg-gray-100 rounded-lg justify-center">
            <button 
              onClick={() => setActiveTab('all')}
              className={cn(
                "flex-1 sm:flex-initial px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all",
                activeTab === 'all' ? "bg-white text-slate-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t('all')} ({employees.length})
            </button>
            <button 
              onClick={() => setActiveTab('onboarding')}
              className={cn(
                "flex-1 sm:flex-initial px-4 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all",
                activeTab === 'onboarding' ? "bg-white text-slate-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t('onboarding')} ({employees.filter(e => e.onboardingStatus === 'incomplete').length})
            </button>
          </div>
          <div className="relative flex-grow sm:flex-grow-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder={isFr ? "Rechercher par nom, courriel, NAS..." : "Search name, email, SIN..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 outline-none w-full sm:w-64 shadow-sm"
            />
          </div>

          {/* Quick Select All Toggle */}
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-slate-700 shadow-sm transition cursor-pointer shrink-0"
            title={isFr ? "Sélectionner / Désélectionner tous les employés affichés" : "Select / Deselect all displayed employees"}
          >
            {filteredEmployees.length > 0 && filteredEmployees.every(e => selectedEmployeeIds.has(e.id)) ? (
              <>
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>{isFr ? 'Désélectionner tout' : 'Deselect All'}</span>
              </>
            ) : (
              <>
                <Square className="w-4 h-4 text-gray-400" />
                <span>{isFr ? `Tout sélectionner (${filteredEmployees.length})` : `Select All (${filteredEmployees.length})`}</span>
              </>
            )}
          </button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Batch Payroll Simulation Button */}
          <button
            onClick={handleOpenBatchPayroll}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
            title={isFr ? "Générer les simulations de paie pour les employés sélectionnés en 1 clic" : "Generate payroll simulation records for selected employees in 1 click"}
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>
              {selectedEmployeeIds.size > 0 
                ? (isFr ? `Simulation en lot (${selectedEmployeeIds.size})` : `Batch Simulation (${selectedEmployeeIds.size})`)
                : (isFr ? 'Simulation en lot' : 'Batch Simulation')}
            </span>
          </button>

          <button
            onClick={() => {
              setPayStubModalEmployee(undefined);
              setIsPayStubModalOpen(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-emerald-200" />
            {isFr ? 'Générer bulletin' : 'Generate Pay Stub'}
          </button>
          <button
            onClick={() => {
              setSelectedEmployeeForTaxDocs(undefined);
              setTaxDocsDefaultTab('documents');
              setIsTaxDocsOpen(true);
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <FileCheck className="w-4 h-4 text-blue-400" />
            {isFr ? 'Documents fiscaux' : 'Tax Documents'}
          </button>
          <button
            onClick={() => { setIsAdding(true); resetForm(); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            {t('new')}
          </button>
        </div>
      </div>

      {/* Interactive Batch Action Bar when employees are selected */}
      {selectedEmployeeIds.size > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-4 rounded-2xl shadow-xl border border-blue-500/30 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30">
              <CheckSquare className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-500 text-white text-[11px] font-mono">
                  {selectedEmployeeIds.size}
                </span>
                <span>
                  {isFr 
                    ? `${selectedEmployeeIds.size === 1 ? 'employé sélectionné' : 'employés sélectionnés'} pour simulation en lot` 
                    : `${selectedEmployeeIds.size === 1 ? 'employee' : 'employees'} selected for batch simulation`}
                </span>
              </p>
              <p className="text-[10px] text-blue-200/80 mt-0.5">
                {isFr 
                  ? 'Génération groupée automatique des retenues fiscales et cotisations provinciales/fédérales 2026' 
                  : 'Instant automated generation of CRA/Revenu Québec statutory deductions for 2026'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedEmployeeIds(new Set())}
              className="px-3 py-2 rounded-xl border border-white/20 text-white/80 hover:text-white hover:bg-white/10 text-xs font-semibold transition cursor-pointer"
            >
              {isFr ? 'Désélectionner tout' : 'Deselect all'}
            </button>
            <button
              onClick={handleOpenBatchPayroll}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-extrabold shadow-md flex items-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>
                {isFr 
                  ? `⚡ Simuler la paie en 1 clic (${selectedEmployeeIds.size})` 
                  : `⚡ 1-Click Batch Simulation (${selectedEmployeeIds.size})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Notice Banner */}
      {activeTab === 'onboarding' && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl shadow-xl border border-slate-700/60 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                    {isFr ? 'Conformité & Intégration' : 'Compliance & Onboarding'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Année fiscale 2026</span>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  {isFr ? 'Dossier d\'embauche du nouvel employé & Formulaires fiscaux (TD1 / TP-1015.3-V)' : 'New Hire Onboarding Package & Statutory Tax Withholding Forms'}
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  {isFr 
                    ? 'Tous les formulaires officiels (TD1, TP-1015, T4, RL-1) sont traduits dans notre assistant d\'embauche. Téléchargez le dossier PDF complet pour vos employés.'
                    : 'All regulatory tax forms (TD1, TP-1015, T4, RL-1) are integrated in our onboarding wizard. Download PDF copies for your employees.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedEmployeeForTaxDocs(undefined);
                    setTaxDocsDefaultTab('documents');
                    setIsTaxDocsOpen(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95"
                >
                  <FileCheck className="w-4 h-4" />
                  {isFr ? 'Dossier Fiscaux' : 'Tax Documents Hub'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <AnimatePresence>
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-2xl border border-gray-200 shadow-2xl max-w-5xl mx-auto space-y-6"
          >
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">
                    {editingId ? t('edit_employee') : t('add_employee')}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {isFr ? 'Complétez les informations personnelles, le salaire, la fréquence de paie et la fiscalité' : 'Enter personal info, salary rate, pay frequency and tax profile'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase">{t('onboarding_status')}</span>
                <select 
                  value={formData.onboardingStatus}
                  onChange={e => setFormData({...formData, onboardingStatus: e.target.value as 'incomplete' | 'completed'})}
                  className="px-3 py-1 bg-gray-100 border-none rounded-lg text-xs font-bold uppercase outline-none"
                >
                  <option value="incomplete">{t('incomplete')}</option>
                  <option value="completed">{t('completed')}</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Section A: Personal & Contact Information */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">1</div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase">{t('contact_info')} & NAS / SIN</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('first_name')} *</label>
                    <input required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('last_name')} *</label>
                    <input required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Courriel / Email *</label>
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="a.tremblay@entreprise.ca" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Téléphone / Phone *</label>
                    <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(514) 555-0199" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('sin')} (NAS) *</label>
                    <input required value={formData.sin} onChange={e => setFormData({...formData, sin: e.target.value})} placeholder="000 000 000" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('dob')}</label>
                    <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>

                  <div className="lg:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('address')} *</label>
                    <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="123 Rue de la Montagne" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{isFr ? 'Ville' : 'City'} *</label>
                    <input required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Montréal" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{isFr ? 'Code postal' : 'Postal Code'} *</label>
                    <input required value={formData.postalCode} onChange={e => setFormData({...formData, postalCode: e.target.value})} placeholder="H3G 1Z1" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm uppercase focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{isFr ? 'Langue (Loi 96)' : 'Language'}</label>
                    <select 
                      value={formData.languagePreference || 'fr'} 
                      onChange={e => setFormData({...formData, languagePreference: e.target.value as 'fr' | 'en'})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none font-medium"
                    >
                      <option value="fr">Français (Québec)</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{isFr ? 'Province d\'emploi' : 'Province'}</label>
                    <select 
                      value={formData.province || 'QC'} 
                      onChange={e => setFormData({...formData, province: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                    >
                      <option value="QC">Québec (QC)</option>
                      <option value="ON">Ontario (ON)</option>
                      <option value="BC">Colombie-Britannique (BC)</option>
                      <option value="AB">Alberta (AB)</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Section B: Employment & Pay Rate / Pay Frequency */}
              <section className="space-y-4 bg-blue-50/40 p-5 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-2 border-b border-blue-200 pb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">2</div>
                  <h4 className="text-xs font-bold text-blue-900 uppercase">
                    {isFr ? 'Emploi, Taux de Rémunération & Fréquence de Paie' : 'Employment, Pay Rate & Pay Frequency'}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">{isFr ? 'Titre du poste' : 'Job Title'}</label>
                    <input value={formData.jobTitle} onChange={e => setFormData({...formData, jobTitle: e.target.value})} placeholder="Analyste, Développeur..." className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">{isFr ? 'Département' : 'Department'}</label>
                    <input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="Opérations, Ventes..." className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">{t('start_date')}</label>
                    <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">{isFr ? 'Type de rémunération' : 'Compensation Type'}</label>
                    <select 
                      value={formData.compensationType || 'salary'} 
                      onChange={e => setFormData({
                        ...formData, 
                        compensationType: e.target.value as CompensationType
                      })}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-bold text-blue-900 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="salary">{isFr ? 'Salaire Annuel Fixe' : 'Annual Salary'}</option>
                      <option value="hourly">{isFr ? 'Taux Horaire ($ / h)' : 'Hourly Rate ($ / hr)'}</option>
                    </select>
                  </div>

                  {formData.compensationType === 'hourly' ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">{isFr ? 'Taux Horaire ($ / heure)' : 'Hourly Rate ($ / hr)'} *</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          step="0.01" 
                          value={formData.hourlyRate || ''} 
                          onChange={e => setFormData({...formData, hourlyRate: parseFloat(e.target.value) || 0})} 
                          placeholder="25.00" 
                          className="w-full pl-8 pr-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-bold text-emerald-900 focus:ring-1 focus:ring-emerald-500 outline-none" 
                        />
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">{isFr ? 'Salaire Annuel ($ / an)' : 'Annual Base Salary'} *</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={formData.baseSalary || ''} 
                          onChange={e => setFormData({...formData, baseSalary: parseFloat(e.target.value) || 0})} 
                          placeholder="60000" 
                          className="w-full pl-8 pr-3 py-2 bg-white border border-blue-300 rounded-xl text-sm font-bold text-blue-900 focus:ring-1 focus:ring-blue-500 outline-none" 
                        />
                        <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">{t('frequency')} *</label>
                    <select 
                      value={formData.frequency} 
                      onChange={e => setFormData({...formData, frequency: e.target.value as PayFrequency})}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                      <option value="weekly">{t('weekly')}</option>
                      <option value="bi-weekly">{t('bi_weekly')}</option>
                      <option value="semi-monthly">{t('semi_monthly')}</option>
                      <option value="monthly">{t('monthly')}</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Section C & D: Tax Profiles (Collapsible / Compact) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                    <div className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">3</div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase">{isFr ? 'Impôt Fédéral (TD1)' : 'Federal Tax (TD1)'}</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-slate-700">{isFr ? 'Montant personnel de base' : 'Basic claim'}</label>
                      <input type="checkbox" checked={formData.claimFederalBasicPersonalAmount} onChange={e => setFormData({...formData, claimFederalBasicPersonalAmount: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-slate-700">{isFr ? 'Plusieurs employeurs' : 'Multiple employers'}</label>
                      <input type="checkbox" checked={formData.hasMultipleEmployers} onChange={e => setFormData({...formData, hasMultipleEmployers: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    </div>
                  </div>
                </section>

                <section className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                    <div className="w-5 h-5 rounded-full bg-slate-700 text-white flex items-center justify-center text-[10px] font-bold">4</div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase">{isFr ? 'Impôt Québec (TP-1015.3)' : 'Quebec Tax (TP-1015.3)'}</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-slate-700">{isFr ? 'Montant de base Québec' : 'Quebec basic claim'}</label>
                      <input type="checkbox" checked={formData.claimProvincialBasicPersonalAmount} onChange={e => setFormData({...formData, claimProvincialBasicPersonalAmount: e.target.checked})} className="w-4 h-4 text-blue-600 rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-slate-700">{isFr ? 'Code Ligne 10 (TP-1015)' : 'Line 10 Code'}</label>
                      <input value={formData.quebecTp1015Line10Code || 'A'} onChange={e => setFormData({...formData, quebecTp1015Line10Code: e.target.value})} className="w-16 px-2 py-1 bg-white border border-gray-200 rounded text-center font-bold" />
                    </div>
                  </div>
                </section>
              </div>

              {/* Section E: Banking Info */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">5</div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase">{isFr ? 'Coordonnées Bancaires (Dépôt Direct)' : 'Banking Information'}</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">{isFr ? 'Méthode' : 'Method'}</label>
                    <select value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value as 'direct_deposit' | 'cheque'})} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                      <option value="direct_deposit">{isFr ? 'Dépôt direct' : 'Direct Deposit'}</option>
                      <option value="cheque">{isFr ? 'Chèque' : 'Cheque'}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">{isFr ? 'Banque' : 'Bank'}</label>
                    <input value={formData.bankName} onChange={e => setFormData({...formData, bankName: e.target.value})} placeholder="Desjardins, RBC..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">{isFr ? 'Compte' : 'Account'}</label>
                    <input value={formData.accountNumber} onChange={e => setFormData({...formData, accountNumber: e.target.value})} placeholder="1234567" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Transit / Inst.</label>
                    <input value={formData.transitNumber} onChange={e => setFormData({...formData, transitNumber: e.target.value})} placeholder="12345" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono" />
                  </div>
                </div>
              </section>

              {/* Section 6: Granular Access Rights & Permissions */}
              <section className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">6</div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                        {isFr ? 'Droits d\'accès et permissions granulaires' : 'Access Rights & Granular Permissions'}
                      </h4>
                      <p className="text-[11px] text-gray-500">
                        {isFr 
                          ? 'Cochez ou décochez les drapeaux de permission spécifiques par domaine fonctionnel.' 
                          : 'Check or uncheck explicit permission flags grouped across 8 functional domains.'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, permissions: { ...DEFAULT_EMPLOYEE_PERMISSIONS } })}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition-colors shadow-sm active:scale-95"
                    >
                      {isFr ? 'Appliquer profil employé standard' : 'Apply Standard Employee Preset'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, permissions: { ...DEFAULT_MANAGER_PERMISSIONS } })}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-300 transition-colors shadow-sm active:scale-95"
                    >
                      {isFr ? 'Appliquer profil gestionnaire' : 'Apply Manager Preset'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, permissions: { ...DEFAULT_ADMIN_PERMISSIONS } })}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg border border-purple-300 transition-colors shadow-sm active:scale-95"
                    >
                      {isFr ? 'Appliquer profil administrateur' : 'Apply Admin Preset'}
                    </button>
                  </div>
                </div>

                {/* 8 Collapsible Accordions */}
                <div className="space-y-3">
                  {PERMISSION_DOMAINS_META.map(domain => {
                    const DomainIcon = domain.icon;
                    const isExpanded = expandedDomains[domain.id];
                    const currentPerms = formData.permissions || DEFAULT_EMPLOYEE_PERMISSIONS;
                    const domainKeys = domain.keys.map(k => k.key);
                    const activeCount = domainKeys.filter(k => currentPerms[k]).length;
                    const isAllActive = activeCount === domainKeys.length;

                    const toggleDomainKey = (key: PermissionKey) => {
                      setFormData({
                        ...formData,
                        permissions: {
                          ...currentPerms,
                          [key]: !currentPerms[key]
                        }
                      });
                    };

                    const setAllDomainKeys = (val: boolean) => {
                      const updated = { ...currentPerms };
                      domainKeys.forEach(k => { updated[k as PermissionKey] = val; });
                      setFormData({ ...formData, permissions: updated });
                    };

                    return (
                      <div key={domain.id} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <div 
                          onClick={() => setExpandedDomains({ ...expandedDomains, [domain.id]: !isExpanded })}
                          className="px-4 py-3 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-between border-b border-slate-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                              <DomainIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-800">
                                {isFr ? domain.titleFr : domain.titleEn}
                              </h5>
                              <p className="text-[10px] text-slate-500 font-mono">
                                {activeCount} / {domainKeys.length} {isFr ? 'permissions activées' : 'permissions active'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAllDomainKeys(!isAllActive);
                              }}
                              className="text-[10px] font-bold uppercase text-blue-600 hover:text-blue-800 hover:underline"
                            >
                              {isAllActive ? (isFr ? 'Désélectionner tout' : 'Deselect All') : (isFr ? 'Sélectionner tout' : 'Select All')}
                            </button>
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white">
                            {domain.keys.map(k => {
                              const permKey = k.key as PermissionKey;
                              const isChecked = !!currentPerms[permKey];
                              const isGlobalSwitcher = permKey === 'EMP_OVERRIDE_CONTEXT_SELECT';
                              return (
                                <label 
                                  key={permKey} 
                                  className={cn(
                                    "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none",
                                    isChecked 
                                      ? (isGlobalSwitcher ? "bg-amber-50/70 border-amber-300 ring-1 ring-amber-400" : "bg-blue-50/50 border-blue-200") 
                                      : "bg-slate-50/50 border-slate-200 opacity-75 hover:opacity-100"
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleDomainKey(permKey)}
                                    className="mt-0.5 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-800">
                                        {isFr ? k.labelFr : k.labelEn}
                                      </span>
                                      {isGlobalSwitcher && (
                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-amber-500 text-white rounded">
                                          {isFr ? 'Sélecteur Global' : 'Global Switcher'}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 leading-normal">
                                      {isFr ? k.descFr : k.descEn}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-6 py-2.5 text-xs font-bold text-gray-500 uppercase hover:bg-gray-100 rounded-xl transition cursor-pointer">{t('cancel')}</button>
                {!editingId && (
                  <button 
                    type="button" 
                    onClick={handleCreateWithInvite} 
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isFr ? 'Créer & Envoyer l\'invitation' : 'Create & Send Invitation'}</span>
                  </button>
                )}
                <button type="submit" className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase rounded-xl hover:bg-blue-700 transition shadow-lg cursor-pointer">{t('save')}</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employees Roster Container (Responsive Cards on Mobile < md, Structured Table on Desktop >= md) */}
      <div className="space-y-4">
        {/* MOBILE VIEW (Card Stack for screens < md) */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {filteredEmployees.map((e, idx) => {
            const isSelected = selectedEmployeeIds.has(e.id);
            return (
              <div 
                key={`${e.id}-${idx}`} 
                className={cn(
                  "border rounded-2xl p-4 shadow-sm flex flex-col gap-3.5 transition-all w-full max-w-sm mx-auto",
                  isSelected
                    ? "bg-blue-50/20 border-blue-500 ring-2 ring-blue-500/20 shadow-blue-500/5"
                    : "bg-white border-gray-200 hover:border-blue-300"
                )}
              >
                {/* Selection & Status Bar */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <button
                    type="button"
                    onClick={(evt) => toggleSelectEmployee(e.id, evt)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-blue-600 transition cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <span className={isSelected ? "text-blue-700 font-extrabold" : "text-slate-600"}>
                      {isSelected 
                        ? (isFr ? 'Sélectionné pour la paie' : 'Selected for batch') 
                        : (isFr ? 'Sélectionner' : 'Select for batch')}
                    </span>
                  </button>
                  <span className={cn(
                    "text-[10px] font-bold uppercase px-2 py-0.5 rounded-md shrink-0",
                    e.onboardingStatus === 'completed' 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  )}>
                    {e.onboardingStatus === 'completed' ? (isFr ? 'Terminé' : 'Completed') : (isFr ? 'Incomplet' : 'Incomplete')}
                  </span>
                </div>

                {/* Profile Header */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg uppercase shrink-0 shadow-sm">
                    {e.firstName[0]}{e.lastName[0]}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <button 
                      onClick={() => setViewingEmployee(e)}
                      className="text-base font-bold text-slate-800 hover:text-blue-600 text-left truncate block cursor-pointer"
                    >
                      {e.firstName} {e.lastName}
                    </button>
                    <span className="text-xs text-gray-500 font-mono mt-0.5">
                      NAS: {e.sin ? e.sin.replace(/.(?=.{4})/g, '*') : '***'}
                    </span>
                  </div>
                </div>

              {/* Financial Highlight Banner */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{isFr ? 'Rémunération' : 'Compensation'}</span>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-slate-900 font-mono tracking-tight leading-none">
                    {e.compensationType === 'hourly' && e.hourlyRate
                      ? `${formatCurrency(e.hourlyRate)}/h`
                      : formatCurrency(e.baseSalary || 0)}
                  </p>
                  <p className="text-[10px] text-gray-400 capitalize mt-1">{e.frequency}</p>
                </div>
              </div>

              {/* Stacked Details Section */}
              <div className="flex flex-col gap-3.5">
                {/* Poste */}
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">{isFr ? 'Poste' : 'Position'}</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0",
                      e.employmentType === 'full-time' 
                        ? "bg-green-50 text-green-700 border border-green-200" 
                        : "bg-orange-50 text-orange-700 border border-orange-200"
                    )}>
                      {e.employmentType === 'full-time' ? (isFr ? 'Temps plein' : 'Full-time') : e.employmentType === 'part-time' ? (isFr ? 'Temps partiel' : 'Part-time') : (isFr ? 'Contrat' : 'Contract')}
                    </span>
                    <span className="font-medium text-sm text-slate-700 truncate">{e.jobTitle || (isFr ? 'Employé' : 'Employee')}</span>
                  </div>
                </div>

                {/* Coordonnées */}
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1.5">{isFr ? 'Coordonnées' : 'Contact'}</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <p className="truncate">{e.email || 'N/A'}</p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <p>{e.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex gap-2">
                <button 
                  onClick={() => setViewingEmployee(e)}
                  className="flex-1 flex justify-center py-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-100 bg-slate-50 rounded-xl transition active:scale-95 cursor-pointer" 
                  title={isFr ? "Voir le profil" : "View profile"}
                >
                  <Eye className="w-[18px] h-[18px] text-blue-600" />
                </button>
                <button 
                  onClick={() => {
                    setPayStubModalEmployee(e);
                    setIsPayStubModalOpen(true);
                  }}
                  className="flex-1 flex justify-center py-2.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-100 bg-slate-50 rounded-xl transition active:scale-95 cursor-pointer" 
                  title={isFr ? "Bulletin de paie" : "Pay stub"}
                >
                  <Calculator className="w-[18px] h-[18px] text-emerald-600" />
                </button>
                <button 
                  onClick={() => handleEdit(e)}
                  className="flex-1 flex justify-center py-2.5 text-slate-500 hover:text-blue-600 hover:bg-blue-100 bg-slate-50 rounded-xl transition active:scale-95 cursor-pointer" 
                  title={t('edit')}
                >
                  <Edit2 className="w-[18px] h-[18px]" />
                </button>
                <button 
                  onClick={() => setDeleteConfirmId(e.id)}
                  className="flex-1 flex justify-center py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-100 bg-red-50 rounded-xl transition active:scale-95 cursor-pointer" 
                  title={t('delete')}
                >
                  <Trash2 className="w-[18px] h-[18px] text-red-500" />
                </button>
              </div>
            </div>
          );
        })}

          {filteredEmployees.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400">
              <User className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-xs font-medium">{isFr ? 'Aucun employé trouvé.' : 'No employees found.'}</p>
            </div>
          )}
        </div>

        {/* DESKTOP TABLE VIEW (Shown for screens >= md) */}
        <div className="hidden md:block bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50/80 border-b border-gray-200">
              <tr className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                <th className="w-12 px-4 py-4 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="inline-flex items-center justify-center p-1 rounded-md hover:bg-gray-200/60 text-slate-600 transition cursor-pointer"
                    title={
                      filteredEmployees.length > 0 && filteredEmployees.every(e => selectedEmployeeIds.has(e.id))
                        ? (isFr ? 'Désélectionner tout' : 'Deselect all')
                        : (isFr ? 'Sélectionner tous les employés affichés' : 'Select all displayed employees')
                    }
                  >
                    {filteredEmployees.length > 0 && filteredEmployees.every(e => selectedEmployeeIds.has(e.id)) ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : selectedEmployeeIds.size > 0 ? (
                      <div className="w-4 h-4 rounded bg-blue-100 border border-blue-400 flex items-center justify-center text-blue-600 text-[10px] font-bold">
                        -
                      </div>
                    ) : (
                      <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </th>
                <th className="px-6 py-4">{t('employees')}</th>
                <th className="px-6 py-4">{t('contact_info')}</th>
                <th className="px-6 py-4">{t('employment')}</th>
                <th className="px-6 py-4">{t('salary')} / {isFr ? 'Taux' : 'Rate'}</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map((e, idx) => {
                const isSelected = selectedEmployeeIds.has(e.id);
                return (
                  <tr 
                    key={`${e.id}-${idx}`} 
                    className={cn(
                      "transition-colors group",
                      isSelected 
                        ? "bg-blue-50/40 hover:bg-blue-50/60 border-l-4 border-l-blue-600" 
                        : "hover:bg-blue-50/20"
                    )}
                  >
                    <td className="w-12 px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={(evt) => toggleSelectEmployee(e.id, evt)}
                        className="inline-flex items-center justify-center p-1 rounded-md hover:bg-blue-100/60 transition cursor-pointer"
                        title={isSelected ? (isFr ? 'Désélectionner' : 'Deselect') : (isFr ? 'Sélectionner' : 'Select')}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-300 group-hover:text-gray-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm uppercase shrink-0 shadow-sm">
                        {e.firstName[0]}{e.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <button 
                          onClick={() => setViewingEmployee(e)}
                          className="text-xs font-bold text-slate-800 hover:text-blue-600 hover:underline text-left truncate block cursor-pointer"
                        >
                          {e.firstName} {e.lastName}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400 font-mono">NAS: {e.sin ? e.sin.replace(/.(?=.{4})/g, '*') : '***'}</span>
                          <span className={cn(
                            "text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-md",
                            e.onboardingStatus === 'completed' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                          )}>
                            {e.onboardingStatus === 'completed' ? t('completed') : t('incomplete')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{e.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{e.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div>
                      <span className={cn(
                        "text-[9px] font-bold uppercase px-2 py-0.5 rounded-full",
                        e.employmentType === 'full-time' ? "bg-green-50 text-green-700 border border-green-200" : "bg-orange-50 text-orange-700 border border-orange-200"
                      )}>
                        {e.employmentType === 'full-time' ? (isFr ? 'Temps plein' : 'Full-time') : e.employmentType === 'part-time' ? (isFr ? 'Temps partiel' : 'Part-time') : (isFr ? 'Contrat' : 'Contract')}
                      </span>
                      <p className="text-[10px] text-slate-500 font-medium mt-1">{e.jobTitle || (isFr ? 'Employé' : 'Employee')}</p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <p className="text-xs font-extrabold text-slate-800 font-mono">
                      {e.compensationType === 'hourly' && e.hourlyRate
                        ? `${formatCurrency(e.hourlyRate)}/h`
                        : formatCurrency(e.baseSalary || 0)}
                    </p>
                    <p className="text-[10px] text-gray-400 capitalize">{e.frequency}</p>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-1">
                      <button 
                        onClick={() => setViewingEmployee(e)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title={isFr ? "Voir le profil complet" : "View Full Profile"}
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </button>
                      <button 
                        onClick={() => {
                          setPayStubModalEmployee(e);
                          setIsPayStubModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                        title={isFr ? "Générer un bulletin de paie" : "Generate Pay Stub"}
                      >
                        <Calculator className="w-4 h-4 text-emerald-600" />
                      </button>
                      <button 
                        onClick={() => handleEdit(e)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                        title={t('edit')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(e.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title={t('delete')}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>

          {filteredEmployees.length === 0 && (
            <div className="p-16 text-center text-gray-400">
              <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">{isFr ? 'Aucun employé trouvé.' : 'No employees found.'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold">{isFr ? 'Confirmer la suppression' : 'Confirm Deletion'}</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isFr ? 'Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible.' : 'Are you sure you want to delete this employee? This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-xs font-bold text-slate-600 uppercase">
                {t('cancel')}
              </button>
              <button 
                onClick={() => {
                  onDelete(deleteConfirmId);
                  setDeleteConfirmId(null);
                }} 
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-red-700 shadow-md"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Details View Modal */}
      <EmployeeDetailModal
        isOpen={!!viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        employee={viewingEmployee}
        employees={employees}
        payStubs={payStubs}
        onEdit={handleEdit}
        onDelete={onDelete}
        onPayStubCreated={onPayStubCreated}
      />

      {/* Pay Stub Generation Modal */}
      <PayStubModal
        isOpen={isPayStubModalOpen}
        onClose={() => setIsPayStubModalOpen(false)}
        employee={payStubModalEmployee}
        employees={employees}
        onPayStubCreated={onPayStubCreated}
      />

      {/* Tax Documents Modal */}
      <TaxDocumentsModal
        isOpen={isTaxDocsOpen}
        onClose={() => setIsTaxDocsOpen(false)}
        selectedEmployee={selectedEmployeeForTaxDocs}
        employees={employees}
        companyName={companyName}
        defaultTab={taxDocsDefaultTab}
      />

      {/* One-Click Batch Payroll Simulation Modal */}
      <BatchPayrollModal
        isOpen={isBatchPayrollModalOpen}
        onClose={() => setIsBatchPayrollModalOpen(false)}
        selectedEmployees={
          selectedEmployeeIds.size > 0
            ? employees.filter(e => selectedEmployeeIds.has(e.id))
            : filteredEmployees
        }
        allEmployees={employees}
        onBatchPayStubsCreated={(newStubs) => {
          if (onPayStubCreated) {
            newStubs.forEach(stub => onPayStubCreated(stub));
          }
        }}
      />
    </div>
  );
};
