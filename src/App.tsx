/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import { PayrollSummary } from './components/PayrollSummary.tsx';
import { EmployeeManager } from './components/EmployeeManager';
import { PayStubHistory } from './components/PayStubHistory';
import { TimesheetManager } from './components/TimesheetManager';
import { ReportsManager } from './components/ReportsManager';
import { BusinessExpenseManager } from './components/BusinessExpenseManager';
import { CorporateDistributionsManager } from './components/CorporateDistributionsManager';
import { DatabaseStatus } from './components/DatabaseStatus';
import { EmployeeOnboardingForm } from './components/EmployeeOnboardingForm';
import { BenefitsManager } from './components/BenefitsManager';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { calculatePayroll } from './lib/calculations';
import { PayFrequency, Employee, PayStub, Garnishment, BenefitContributions } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Calculator, Users, FileText, LayoutDashboard, Database, Clock, BarChart3, ChevronDown, Receipt, Settings as SettingsIcon, Coins, Scale, Mail, X, Navigation, FileDown } from 'lucide-react';
import { Storage } from './lib/storage';
import { calculatePayPeriod, cn } from './lib/utils';
import { FREQUENCY_WEEKS, CNESST_SECTORS } from './lib/constants';
import { TaxabilityStatus, TaxCalculationMode } from './services/salesTaxCalculator';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { ApplepAILogo } from './components/ApplepAILogo';
import { exportPayrollCalculationPDF } from './lib/exportPayrollPdf';

import { fetchTaxConstants, QcTaxConstants } from './services/taxConstantsService';
import { ApplechaiAuditWrapper } from './components/ApplechaiAuditWrapper';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/AuthModal';
import { UserAuthBadge } from './components/UserAuthBadge';
import { AccessDeniedCard } from './components/AccessDeniedCard';
import { Lock } from 'lucide-react';
import { PayrollForm } from './components/PayrollForm.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AcceptInviteView } from './components/AcceptInviteView';
import { HireQuestionnaireView } from './components/HireQuestionnaireView';

type View = 'calculator' | 'employees' | 'history' | 'timesheets' | 'reports' | 'expenses' | 'gpsTriplog' | 'distributions' | 'database' | 'dashboard' | 'settings' | 'onboarding' | 'invoiceAudit';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </AuthProvider>
    </LanguageProvider>
  );
}

function AppContent() {
  const { language, setLanguage, t } = useLanguage();
  const { role, isAdmin, isEmployee, openAuthModal, user, hasPermission, canOverrideContextSelect, userEmployeeRecord } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [grossPay, setGrossPay] = useState<number>(2500);
  const [frequency, setFrequency] = useState<PayFrequency>('bi-weekly');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payStubs, setPayStubs] = useState<PayStub[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [fiscalYear, setFiscalYear] = useState<2024 | 2025 | 2026>(2026);
  const [qcTaxConstants, setQcTaxConstants] = useState<QcTaxConstants | null>(null);
  const [vacationPay, setVacationPay] = useState<number>(0);
  const [overtimePay, setOvertimePay] = useState<number>(0);
  const [bonusPay, setBonusPay] = useState<number>(0);
  const [commissionPay, setCommissionPay] = useState<number>(0);
  const [commissionExpenses, setCommissionExpenses] = useState<number>(0);
  const [rrspContribution, setRrspContribution] = useState<number>(0);
  const [taxableBenefitsFederal, setTaxableBenefitsFederal] = useState<number>(0);
  const [taxableBenefitsProvincial, setTaxableBenefitsProvincial] = useState<number>(0);
  const [garnishments, setGarnishments] = useState<Garnishment[]>([]);
  // YTD Statutory Accumulations & Automated Caps
  const [ytdQPP, setYtdQPP] = useState<number>(0);
  const [ytdEI, setYtdEI] = useState<number>(0);
  const [ytdQPIP, setYtdQPIP] = useState<number>(0);
  const [ytdCnesstInsurable, setYtdCnesstInsurable] = useState<number>(0);
  // CNESST Sector & Dues
  const [cnesstSectorCode, setCnesstSectorCode] = useState<string>('15000');
  const [cnesstEmployerRate, setCnesstEmployerRate] = useState<number>(1.50);
  const [includeCnesstInDeductions, setIncludeCnesstInDeductions] = useState<boolean>(false);
  // GST & QST Taxable vs Non-Taxable Services / Goods
  const [taxableSupplyAmount, setTaxableSupplyAmount] = useState<number>(0);
  const [nonTaxableSupplyAmount, setNonTaxableSupplyAmount] = useState<number>(0);
  const [supplyTaxability, setSupplyTaxability] = useState<TaxabilityStatus>('taxable');
  const [supplyTaxMode, setSupplyTaxMode] = useState<TaxCalculationMode>('exclusive');
  // Statutory Forms & Voluntary Deductions
  const [hasMultipleEmployers, setHasMultipleEmployers] = useState<boolean>(false);
  const [claimFederalBasicPersonalAmount, setClaimFederalBasicPersonalAmount] = useState<boolean>(true);
  const [federalTd1ClaimAmount, setFederalTd1ClaimAmount] = useState<number | undefined>(undefined);
  const [t1213FederalReduction, setT1213FederalReduction] = useState<number>(0);
  const [claimProvincialBasicPersonalAmount, setClaimProvincialBasicPersonalAmount] = useState<boolean>(true);
  const [quebecTp1015Line10Code, setQuebecTp1015Line10Code] = useState<string>('A');
  const [tp1016QuebecReduction, setTp1016QuebecReduction] = useState<number>(0);
  const [voluntaryPreTaxRrsp, setVoluntaryPreTaxRrsp] = useState<number>(0);
  const [voluntaryPostTaxHealth, setVoluntaryPostTaxHealth] = useState<number>(0);
  const [benefits, setBenefits] = useState<BenefitContributions>({
    health: 0,
    lifeInsurance: 0,
    disability: 0,
    isDisabilityEmployerPaid: false
  });
  const [loading, setLoading] = useState(true);
  const [mockEmail, setMockEmail] = useState<{ employeeName: string, netPay: number, date: string } | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [fetchError, setFetchError] = useState<boolean>(false);

  const [inviteToken, setInviteToken] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token') || (window.location.pathname === '/accept-invite' ? params.get('token') : null);
  });

  const isPendingOnboarding = useMemo(() => {
    if (isAdmin) return false; // Admins never locked
    if (!user) return false;   // Unauthenticated guests never locked
    if (userEmployeeRecord) {
      return userEmployeeRecord.isFirstLogin === true || 
             userEmployeeRecord.status === 'invited' || 
             userEmployeeRecord.status === 'pending_questionnaire' || 
             userEmployeeRecord.status === 'questionnaire_in_progress' || 
             userEmployeeRecord.onboardingStatus === 'incomplete';
    }
    return false;
  }, [isAdmin, user, userEmployeeRecord]);

  const loadData = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const [emps, stubs, constants] = await Promise.all([
        Storage.getEmployees(),
        Storage.getPayStubs(),
        fetchTaxConstants(fiscalYear)
      ]);
      setEmployees(emps || []);
      setPayStubs(stubs || []);
      setQcTaxConstants(constants);
      if (!emps.length && !stubs.length && !constants) {
        setFetchError(true);
      }
    } catch (error) {
      console.error("Error loading data", error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      loadData();
    };
    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleNavigate = (e: any) => {
      if (e.detail) {
        setCurrentView(e.detail as View);
      }
    };
    window.addEventListener('navigate-to-tab', handleNavigate);

    loadData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('navigate-to-tab', handleNavigate);
    };
  }, [fiscalYear]);

  // Lock body scroll when mobile navigation drawer is active
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Context Locking Safeguard: If EMP_OVERRIDE_CONTEXT_SELECT is false, hard lock selected employee to logged-in user
  useEffect(() => {
    if (!canOverrideContextSelect) {
      const matchedId = userEmployeeRecord?.id || user?.id || employees[0]?.id;
      if (matchedId && selectedEmployeeId !== matchedId) {
        setSelectedEmployeeId(matchedId);
      }
    }
  }, [canOverrideContextSelect, userEmployeeRecord, user, employees, selectedEmployeeId]);

  const payrollResult = useMemo(() => {
    return calculatePayroll({
      grossPay,
      frequency,
      year: fiscalYear,
      employeeId: selectedEmployeeId,
      vacationPay,
      overtimePay,
      bonusPay,
      commissionPay,
      commissionExpenses,
      rrspContribution,
      taxableBenefitsFederal,
      taxableBenefitsProvincial,
      garnishments,
      benefitContributions: benefits,
      ytdQPP,
      ytdEI,
      ytdQPIP,
      ytdCnesstInsurable,
      cnesstSectorCode,
      cnesstEmployerRate,
      includeCnesstInDeductions,
      taxableSupplyAmount,
      nonTaxableSupplyAmount,
      supplyTaxability,
      supplyTaxMode,
      hasMultipleEmployers,
      claimFederalBasicPersonalAmount,
      federalTd1ClaimAmount,
      t1213FederalReduction,
      claimProvincialBasicPersonalAmount,
      quebecTp1015Line10Code,
      tp1016QuebecReduction,
      voluntaryPreTaxRrsp,
      voluntaryPostTaxHealth,
      qcTaxConstants,
    });
  }, [
    grossPay, frequency, selectedEmployeeId, fiscalYear, vacationPay, overtimePay, bonusPay, 
    commissionPay, commissionExpenses, rrspContribution, taxableBenefitsFederal, taxableBenefitsProvincial,
    garnishments, benefits, ytdQPP, ytdEI, ytdQPIP, ytdCnesstInsurable, cnesstSectorCode, cnesstEmployerRate,
    includeCnesstInDeductions, taxableSupplyAmount, nonTaxableSupplyAmount, supplyTaxability, supplyTaxMode,
    hasMultipleEmployers, claimFederalBasicPersonalAmount,
    federalTd1ClaimAmount, t1213FederalReduction, claimProvincialBasicPersonalAmount, quebecTp1015Line10Code,
    tp1016QuebecReduction, voluntaryPreTaxRrsp, voluntaryPostTaxHealth, qcTaxConstants
  ]);

  const currentPayPeriod = useMemo(() => {
    return calculatePayPeriod(new Date().toLocaleDateString('fr-CA'), frequency);
  }, [frequency]);

  // Granular Permission Checks
  const canAccessAdminDashboard = isAdmin || hasPermission('SYS_ADMIN_DASHBOARD_ACCESS');
  const canAccessEmployees = isAdmin || hasPermission('EMP_MANAGE_ALL_PROFILES') || canAccessAdminDashboard;
  const canAccessReports = isAdmin || canAccessAdminDashboard;
  const canAccessDistributions = isAdmin || hasPermission('CORP_MANAGE_DISTRIBUTIONS_DIVIDENDS') || canAccessAdminDashboard;
  const canAccessDatabase = isAdmin || hasPermission('SYS_ACCESS_DATABASE_CONSOLE') || canAccessAdminDashboard;
  const canAccessSettings = isAdmin || hasPermission('SYS_CONFIGURE_COMPANY_SETTINGS') || canAccessAdminDashboard;

  const isViewAuthorized = (view: View) => {
    switch (view) {
      case 'calculator': return canAccessAdminDashboard;
      case 'employees': return canAccessEmployees;
      case 'reports': return canAccessReports;
      case 'distributions': return canAccessDistributions;
      case 'database': return canAccessDatabase;
      case 'settings': return canAccessSettings;
      default: return true;
    }
  };

  const handleFormChange = (updates: { 
    grossPay?: number | string; 
    frequency?: PayFrequency;
    bonusPay?: number | string;
    vacationPay?: number | string;
    overtimePay?: number | string;
    commissionPay?: number | string;
    commissionExpenses?: number | string;
    rrspContribution?: number | string;
    taxableBenefitsFederal?: number | string;
    taxableBenefitsProvincial?: number | string;
    garnishments?: Garnishment[];
    ytdQPP?: number | string;
    ytdEI?: number | string;
    ytdQPIP?: number | string;
    ytdCnesstInsurable?: number | string;
    cnesstSectorCode?: string;
    cnesstEmployerRate?: number | string;
    includeCnesstInDeductions?: boolean;
    taxableSupplyAmount?: number | string;
    nonTaxableSupplyAmount?: number | string;
    supplyTaxability?: TaxabilityStatus;
    supplyTaxMode?: TaxCalculationMode;
    hasMultipleEmployers?: boolean;
    claimFederalBasicPersonalAmount?: boolean;
    federalTd1ClaimAmount?: number | string;
    t1213FederalReduction?: number | string;
    claimProvincialBasicPersonalAmount?: boolean;
    quebecTp1015Line10Code?: string;
    tp1016QuebecReduction?: number | string;
    voluntaryPreTaxRrsp?: number | string;
    voluntaryPostTaxHealth?: number | string;
  }) => {
    if (updates.grossPay !== undefined) setGrossPay(Number(updates.grossPay) || 0);
    if (updates.frequency !== undefined) setFrequency(updates.frequency);
    if (updates.bonusPay !== undefined) setBonusPay(Number(updates.bonusPay) || 0);
    if (updates.vacationPay !== undefined) setVacationPay(Number(updates.vacationPay) || 0);
    if (updates.overtimePay !== undefined) setOvertimePay(Number(updates.overtimePay) || 0);
    if (updates.commissionPay !== undefined) setCommissionPay(Number(updates.commissionPay) || 0);
    if (updates.commissionExpenses !== undefined) setCommissionExpenses(Number(updates.commissionExpenses) || 0);
    if (updates.rrspContribution !== undefined) setRrspContribution(Number(updates.rrspContribution) || 0);
    if (updates.taxableBenefitsFederal !== undefined) setTaxableBenefitsFederal(Number(updates.taxableBenefitsFederal) || 0);
    if (updates.taxableBenefitsProvincial !== undefined) setTaxableBenefitsProvincial(Number(updates.taxableBenefitsProvincial) || 0);
    if (updates.garnishments !== undefined) setGarnishments(updates.garnishments);
    if (updates.ytdQPP !== undefined) setYtdQPP(Number(updates.ytdQPP) || 0);
    if (updates.ytdEI !== undefined) setYtdEI(Number(updates.ytdEI) || 0);
    if (updates.ytdQPIP !== undefined) setYtdQPIP(Number(updates.ytdQPIP) || 0);
    if (updates.ytdCnesstInsurable !== undefined) setYtdCnesstInsurable(Number(updates.ytdCnesstInsurable) || 0);
    if (updates.cnesstSectorCode !== undefined) setCnesstSectorCode(updates.cnesstSectorCode);
    if (updates.cnesstEmployerRate !== undefined) setCnesstEmployerRate(Number(updates.cnesstEmployerRate) || 0);
    if (updates.includeCnesstInDeductions !== undefined) setIncludeCnesstInDeductions(updates.includeCnesstInDeductions);
    if (updates.taxableSupplyAmount !== undefined) setTaxableSupplyAmount(Number(updates.taxableSupplyAmount) || 0);
    if (updates.nonTaxableSupplyAmount !== undefined) setNonTaxableSupplyAmount(Number(updates.nonTaxableSupplyAmount) || 0);
    if (updates.supplyTaxability !== undefined) setSupplyTaxability(updates.supplyTaxability);
    if (updates.supplyTaxMode !== undefined) setSupplyTaxMode(updates.supplyTaxMode);
    if (updates.hasMultipleEmployers !== undefined) setHasMultipleEmployers(updates.hasMultipleEmployers);
    if (updates.claimFederalBasicPersonalAmount !== undefined) setClaimFederalBasicPersonalAmount(updates.claimFederalBasicPersonalAmount);
    if (updates.federalTd1ClaimAmount !== undefined) setFederalTd1ClaimAmount(updates.federalTd1ClaimAmount !== undefined && updates.federalTd1ClaimAmount !== '' ? Number(updates.federalTd1ClaimAmount) : undefined);
    if (updates.t1213FederalReduction !== undefined) setT1213FederalReduction(Number(updates.t1213FederalReduction) || 0);
    if (updates.claimProvincialBasicPersonalAmount !== undefined) setClaimProvincialBasicPersonalAmount(updates.claimProvincialBasicPersonalAmount);
    if (updates.quebecTp1015Line10Code !== undefined) setQuebecTp1015Line10Code(updates.quebecTp1015Line10Code);
    if (updates.tp1016QuebecReduction !== undefined) setTp1016QuebecReduction(Number(updates.tp1016QuebecReduction) || 0);
    if (updates.voluntaryPreTaxRrsp !== undefined) setVoluntaryPreTaxRrsp(Number(updates.voluntaryPreTaxRrsp) || 0);
    if (updates.voluntaryPostTaxHealth !== undefined) setVoluntaryPostTaxHealth(Number(updates.voluntaryPostTaxHealth) || 0);
  };

  const handleAddEmployee = async (data: Omit<Employee, 'id'>) => {
    const id = await Storage.saveEmployee(data);
    setEmployees([...employees, { ...data, id } as Employee]);
  };

  const handleEditEmployee = async (id: string, updates: Partial<Employee>) => {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;
    const updatedEmployee = { ...employee, ...updates };
    await Storage.saveEmployee(updatedEmployee);
    setEmployees(employees.map(e => e.id === id ? updatedEmployee : e));
  };

  const handleDeleteEmployee = async (id: string) => {
    await Storage.deleteEmployee(id);
    setEmployees(employees.filter(e => e.id !== id));
  };

  const handleGeneratePayStub = async () => {
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) return;

    const date = new Date().toLocaleDateString('fr-CA');
    const { startDate, endDate } = calculatePayPeriod(date, frequency);

    const newStub: Omit<PayStub, 'id'> = {
      ...payrollResult,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      date,
      payPeriod: `${startDate} - ${endDate}`,
    };

    await Storage.addPayStub(newStub);
    loadData();

    setMockEmail({
      employeeName: newStub.employeeName,
      netPay: newStub.netPay,
      date,
    });
    
    setTimeout(() => setMockEmail(null), 5000);
  };

  if (inviteToken) {
    return (
      <AcceptInviteView 
        token={inviteToken} 
        onAccepted={() => {
          setInviteToken(null);
          // Strip token from query parameters smoothly
          window.history.replaceState({}, document.title, "/");
          loadData();
        }} 
      />
    );
  }

  if (isPendingOnboarding && userEmployeeRecord) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-between">
        {/* Simple locked header */}
        <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-1">
            <ApplepAILogo size="md" variant="dark" showWordmark={true} name="ApplepAI" />
            <span className="text-[10px] text-slate-400 pl-2 border-l border-slate-800 uppercase tracking-widest font-semibold">onboarding portal</span>
          </div>
          <UserAuthBadge variant="header" />
        </header>

        {/* Locked body scroll with form */}
        <main className="flex-grow overflow-y-auto bg-slate-950 p-6 flex items-center justify-center">
          <div className="max-w-4xl w-full">
            <HireQuestionnaireView 
              employeeId={userEmployeeRecord.id} 
              onComplete={() => {
                loadData();
                window.location.reload();
              }}
            />
          </div>
        </main>

        {/* Branded footer */}
        <footer className="bg-slate-950 border-t border-slate-900 p-4 text-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} ApplepAI &bull; Solutions d'intégration intelligentes propulsées par ApplechAI</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-hidden bg-gray-50 text-slate-900 font-sans relative">
      {/* Mobile Sidebar Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav className={cn(
        "bg-slate-900 flex-shrink-0 flex flex-col border-r border-slate-800 transition-transform duration-300 z-50 w-60 h-full",
        "fixed inset-y-0 left-0 transform sm:static sm:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/40 flex justify-between items-center sm:block">
          <div className="flex flex-col gap-1">
            <ApplepAILogo 
              size="md" 
              variant="dark" 
              showWordmark={true}
              name="ApplepAI"
            />
            <div className="flex items-center gap-1.5 pl-0.5 mt-0.5 select-none">
              <span className="text-[10px] font-normal text-slate-400">
                powered by
              </span>
              <span className="text-[10px] font-bold tracking-tight text-blue-400">
                ApplechAI
              </span>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="sm:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Sidebar Navigation */}
        <div className="flex-grow px-4 space-y-4 overflow-y-auto">
          {/* Employee Self-Service Section */}
          <div className="space-y-1">
            <div className="text-slate-500 px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest flex items-center justify-between">
              <span>{language === 'fr' ? 'Portail Employé' : 'Employee Portal'}</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-blue-950 text-blue-400 border border-blue-800 rounded font-normal">
                {isEmployee ? (language === 'fr' ? 'Actif' : 'Active') : (language === 'fr' ? 'Accès' : 'Access')}
              </span>
            </div>

            <button 
              onClick={() => { setCurrentView('dashboard'); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full px-3 py-2 rounded text-sm flex items-center font-medium transition-colors outline-none",
                currentView === 'dashboard' ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800"
              )}
            >
              <LayoutDashboard className="w-4 h-4 mr-3" /> {t('dashboard')}
            </button>

            <button 
              onClick={() => { setCurrentView('history'); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full px-3 py-2 rounded text-sm flex items-center font-medium transition-colors outline-none",
                currentView === 'history' ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800"
              )}
            >
              <FileText className="w-4 h-4 mr-3" />
              {language === 'fr' ? 'Mes Fiches de Paie' : 'My Pay Stubs'}
            </button>

            <button 
              onClick={() => { setCurrentView('timesheets'); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full px-3 py-2 rounded text-sm flex items-center font-medium transition-colors outline-none",
                currentView === 'timesheets' ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800"
              )}
            >
              <Clock className="w-4 h-4 mr-3" />
              {t('timesheets')}
            </button>

            <button 
              onClick={() => { setCurrentView('expenses'); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full px-3 py-2 rounded text-sm flex items-center font-medium transition-colors outline-none",
                currentView === 'expenses' ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800"
              )}
            >
              <Receipt className="w-4 h-4 mr-3" />
              {t('expenses')}
            </button>

            <button 
              onClick={() => { setCurrentView('invoiceAudit'); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full px-3 py-2 rounded text-sm flex items-center font-medium transition-colors outline-none",
                currentView === 'invoiceAudit' ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800"
              )}
            >
              <Receipt className="w-4 h-4 mr-3 text-blue-400" />
              {language === 'fr' ? 'Audit Facture' : 'Invoice Audit'}
            </button>

            <button 
              onClick={() => { setCurrentView('gpsTriplog'); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full px-3 py-2 rounded text-sm flex items-center font-medium transition-colors outline-none",
                currentView === 'gpsTriplog' ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800"
              )}
            >
              <Navigation className="w-4 h-4 mr-3 text-emerald-400" />
              {language === 'fr' ? 'Registre GPS (TripLog)' : 'GPS TripLog'}
            </button>

            <button 
              onClick={() => { setCurrentView('onboarding'); setIsMobileMenuOpen(false); }}
              className={cn(
                "w-full px-3 py-2 rounded text-sm flex items-center font-medium transition-colors outline-none",
                currentView === 'onboarding' ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800"
              )}
            >
              <FileText className="w-4 h-4 mr-3 text-amber-400" />
              {language === 'fr' ? 'Questionnaire Embauche' : 'Hire Questionnaire'}
            </button>
          </div>

          {/* Admin Management Section */}
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <div className="text-slate-500 px-3 py-1 rounded text-[10px] uppercase font-bold tracking-widest flex items-center justify-between">
              <span>{language === 'fr' ? 'Administration RH' : 'HR Administration'}</span>
              {!canAccessAdminDashboard && (
                <span className="flex items-center gap-1 text-[9px] text-amber-400/80">
                  <Lock className="w-2.5 h-2.5" />
                  <span>{language === 'fr' ? 'Restreint' : 'Restricted'}</span>
                </span>
              )}
            </div>

            <button 
              onClick={() => { if (canAccessAdminDashboard) { setCurrentView('calculator'); setIsMobileMenuOpen(false); } }}
              disabled={!canAccessAdminDashboard}
              title={!canAccessAdminDashboard ? (language === 'fr' ? 'Accès restreint aux administrateurs (SYS_ADMIN_DASHBOARD_ACCESS requis)' : 'Restricted to admins (SYS_ADMIN_DASHBOARD_ACCESS required)') : undefined}
              className={cn(
                "w-full px-3 py-2 rounded text-sm flex items-center justify-between font-medium transition-colors outline-none",
                currentView === 'calculator' ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800",
                !canAccessAdminDashboard && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center">
                <div className={cn("w-2 h-2 rounded-full mr-3", currentView === 'calculator' ? "bg-blue-500" : "bg-transparent")}></div>
                {t('calculator')}
              </div>
              {!canAccessAdminDashboard && <Lock className="w-3 h-3 text-slate-500" />}
            </button>
            
            <button 
              onClick={() => { if (canAccessEmployees) { setCurrentView('employees'); setIsMobileMenuOpen(false); } }}
              disabled={!canAccessEmployees}
              title={!canAccessEmployees ? (language === 'fr' ? 'Accès restreint' : 'Restricted access') : undefined}
              className={cn(
                "w-full px-3 py-2 rounded text-sm flex items-center justify-between font-medium transition-colors outline-none",
                currentView === 'employees' ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800",
                !canAccessEmployees && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-3" />
                {t('employees')}
              </div>
              {!canAccessEmployees && <Lock className="w-3 h-3 text-slate-500" />}
            </button>

            <button 
              onClick={() => { if (canAccessReports) { setCurrentView('reports'); setIsMobileMenuOpen(false); } }}
              disabled={!canAccessReports}
              title={!canAccessReports ? (language === 'fr' ? 'Accès restreint (SYS_ADMIN_DASHBOARD_ACCESS requis)' : 'Restricted access (SYS_ADMIN_DASHBOARD_ACCESS required)') : undefined}
              className={cn(
                "w-full px-3 py-2 rounded text-sm flex items-center justify-between font-medium transition-colors outline-none",
                currentView === 'reports' ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800",
                !canAccessReports && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center">
                <BarChart3 className="w-4 h-4 mr-3" />
                {t('reports')}
              </div>
              {!canAccessReports && <Lock className="w-3 h-3 text-slate-500" />}
            </button>

            <button 
              onClick={() => { if (canAccessDistributions) { setCurrentView('distributions'); setIsMobileMenuOpen(false); } }}
              disabled={!canAccessDistributions}
              title={!canAccessDistributions ? (language === 'fr' ? 'Accès restreint' : 'Restricted access') : undefined}
              className={cn(
                "w-full px-3 py-2 rounded text-sm flex items-center justify-between font-medium transition-colors outline-none",
                currentView === 'distributions' ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800",
                !canAccessDistributions && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center">
                <Scale className="w-4 h-4 mr-3" />
                {t('distributions')}
              </div>
              {!canAccessDistributions && <Lock className="w-3 h-3 text-slate-500" />}
            </button>

            <button 
              onClick={() => { if (canAccessDatabase) { setCurrentView('database'); setIsMobileMenuOpen(false); } }}
              disabled={!canAccessDatabase}
              title={!canAccessDatabase ? (language === 'fr' ? 'Accès restreint (SYS_ADMIN_DASHBOARD_ACCESS requis)' : 'Restricted access (SYS_ADMIN_DASHBOARD_ACCESS required)') : undefined}
              className={cn(
                "w-full px-3 py-2 rounded text-sm flex items-center justify-between font-medium transition-colors outline-none",
                currentView === 'database' ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800",
                !canAccessDatabase && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center">
                <Database className="w-4 h-4 mr-3" />
                {t('database')}
              </div>
              {!canAccessDatabase && <Lock className="w-3 h-3 text-slate-500" />}
            </button>

            <button 
              onClick={() => { if (canAccessSettings) { setCurrentView('settings'); setIsMobileMenuOpen(false); } }}
              disabled={!canAccessSettings}
              title={!canAccessSettings ? (language === 'fr' ? 'Accès restreint' : 'Restricted access') : undefined}
              className={cn(
                "w-full px-3 py-2 rounded text-sm flex items-center justify-between font-medium transition-colors outline-none",
                currentView === 'settings' ? "text-white bg-slate-800" : "text-slate-400 hover:bg-slate-800",
                !canAccessSettings && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center">
                <SettingsIcon className="w-4 h-4 mr-3" />
                {t('settings')}
              </div>
              {!canAccessSettings && <Lock className="w-3 h-3 text-slate-500" />}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-3">
          {/* Language Switcher */}
          <div className="flex items-center justify-between p-2 bg-slate-800 rounded-lg border border-slate-700">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Lang</span>
            <div className="flex gap-1">
              <button
                onClick={() => setLanguage('fr')}
                className={cn(
                  "px-3 py-1 rounded text-[10px] font-bold uppercase transition-all",
                  language === 'fr' ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                )}
              >
                FR
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-3 py-1 rounded text-[10px] font-bold uppercase transition-all",
                  language === 'en' ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"
                )}
              >
                EN
              </button>
            </div>
          </div>

          {/* User Auth Badge in Sidebar */}
          <UserAuthBadge variant="sidebar" />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0 mr-2">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="sm:hidden p-1.5 -ml-1 rounded-md hover:bg-gray-100 text-slate-700 outline-none shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-base sm:text-xl font-semibold capitalize truncate">
              {currentView === 'calculator' ? t('simulation_title') : 
               currentView === 'employees' ? t('employees') : 
               currentView === 'history' ? t('history') :
               currentView === 'timesheets' ? t('timesheets') :
               currentView === 'expenses' ? t('expenses') : 
               currentView === 'gpsTriplog' ? (language === 'fr' ? 'Registre GPS (TripLog)' : 'GPS TripLog') :
               currentView === 'distributions' ? t('distributions') : 
               currentView === 'dashboard' ? t('dashboard') :
               currentView === 'settings' ? t('settings') :
               currentView === 'database' ? t('database') : t('reports')}
            </h2>
            <div className="flex items-center gap-1 sm:gap-2 bg-slate-100 p-0.5 sm:p-1 rounded-lg">
              <button 
                onClick={() => setFiscalYear(2024)}
                className={cn(
                  "px-1.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase rounded-md transition-all",
                  fiscalYear === 2024 ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                2024
              </button>
              <button 
                onClick={() => setFiscalYear(2025)}
                className={cn(
                  "px-1.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase rounded-md transition-all",
                  fiscalYear === 2025 ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                2025
              </button>
              <button 
                onClick={() => setFiscalYear(2026)}
                className={cn(
                  "px-1.5 sm:px-3 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase rounded-md transition-all",
                  fiscalYear === 2026 ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                2026
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Header User Auth & Role Control */}
            <UserAuthBadge variant="header" />

            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500 uppercase font-semibold">{language === 'fr' ? 'Région' : 'Region'}</p>
              <p className="text-sm font-medium">Québec, Canada</p>
            </div>
            {currentView === 'calculator' && isAdmin && (
              <button 
                onClick={handleGeneratePayStub}
                disabled={!selectedEmployeeId}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('generate_bulletin')}
              </button>
            )}
          </div>
        </header>

        {/* Connection Status & Offline Mode Banner */}
        {(isOffline || fetchError) && (
          <div className={cn(
            "px-6 py-3 border-b flex flex-col sm:flex-row items-center justify-between gap-3 text-sm transition-all duration-300",
            isOffline 
              ? "bg-amber-50 border-amber-100 text-amber-800" 
              : "bg-red-50 border-red-100 text-red-800"
          )}>
            <div className="flex items-center gap-3">
              <span className="flex h-2 w-2 relative">
                <span className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  isOffline ? "bg-amber-400" : "bg-red-400"
                )}></span>
                <span className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  isOffline ? "bg-amber-500" : "bg-red-500"
                )}></span>
              </span>
              <p className="font-medium">
                {isOffline 
                  ? (language === 'fr' 
                      ? "Vous visualisez actuellement l'application en mode hors-ligne. Certaines fonctionnalités de synchronisation avec la base de données peuvent être restreintes."
                      : "You are currently viewing the application in offline mode. Some database synchronization features may be restricted.")
                  : (language === 'fr'
                      ? "Une erreur est survenue lors de la récupération des données de paie. L'application fonctionne en mode hors-ligne dégradé."
                      : "An error occurred while fetching payroll data. The application is running in a degraded offline mode.")
                }
              </p>
            </div>
            <button
              onClick={() => {
                setIsOffline(!navigator.onLine);
                loadData();
              }}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-1.5",
                isOffline
                  ? "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200"
                  : "bg-red-100 hover:bg-red-200 text-red-900 border border-red-200"
              )}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
              </svg>
              {language === 'fr' ? 'Réessayer' : 'Retry'}
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="flex-grow overflow-y-auto bg-gray-50 p-6 mx-[10px]" style={{ paddingLeft: '0px', paddingRight: '0px', paddingTop: '15px', paddingBottom: '15px', marginLeft: '10px', marginRight: '10px' }}>
          <div className="max-w-7xl mx-auto">
            {/* Role & Granular Permission-Based Access Guard for Admin Modules */}
            {!isViewAuthorized(currentView) ? (
              <AccessDeniedCard 
                requiredRole="admin"
                featureName={
                  currentView === 'calculator' ? t('calculator') :
                  currentView === 'employees' ? t('employees') :
                  currentView === 'reports' ? t('reports') :
                  currentView === 'distributions' ? t('distributions') :
                  currentView === 'database' ? t('database') : t('settings')
                }
                onNavigateAllowed={() => setCurrentView('history')}
              />
            ) : (
              <>
            {currentView === 'calculator' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-4 space-y-6" style={{ paddingLeft: '5px', paddingRight: '5px' }}>
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                      {t('select_employee')}
                    </label>
                      <select 
                        value={selectedEmployeeId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSelectedEmployeeId(id);
                          const emp = employees.find(emp => emp.id === id);
                          if (emp) {
                            setGrossPay(Number(emp.baseSalary) || 0);
                            setFrequency((emp.frequency as PayFrequency) || 'bi-weekly');
                            setGarnishments(Array.isArray(emp.garnishments) ? emp.garnishments : []);
                            if (emp.benefitContributions) setBenefits(emp.benefitContributions);
                            if (emp.hasMultipleEmployers !== undefined) setHasMultipleEmployers(Boolean(emp.hasMultipleEmployers));
                            if (emp.federalTd1ClaimAmount !== undefined) setFederalTd1ClaimAmount(Number(emp.federalTd1ClaimAmount));
                            if (emp.t1213Reduction !== undefined) setT1213FederalReduction(Number(emp.t1213Reduction) || 0);
                            if (emp.quebecTp1015Line10Code !== undefined) setQuebecTp1015Line10Code(emp.quebecTp1015Line10Code);
                            if (emp.tp1016Reduction !== undefined) setTp1016QuebecReduction(Number(emp.tp1016Reduction) || 0);
                            if (emp.voluntaryPreTaxRrsp !== undefined) setVoluntaryPreTaxRrsp(Number(emp.voluntaryPreTaxRrsp) || 0);
                            if (emp.voluntaryPostTaxHealth !== undefined) setVoluntaryPostTaxHealth(Number(emp.voluntaryPostTaxHealth) || 0);

                            // Calculate YTD from past paystubs if available
                            const empStubs = payStubs.filter(s => s.employeeId === id);
                            const cumulativeQPP = empStubs.reduce((acc, s) => acc + (Number(s.qpp) || 0), 0);
                            const cumulativeEI = empStubs.reduce((acc, s) => acc + (Number(s.ei) || 0), 0);
                            const cumulativeQPIP = empStubs.reduce((acc, s) => acc + (Number(s.qpip) || 0), 0);
                            const cumulativeGross = empStubs.reduce((acc, s) => acc + (Number(s.grossPay) || 0), 0);
                            setYtdQPP(cumulativeQPP);
                            setYtdEI(cumulativeEI);
                            setYtdQPIP(cumulativeQPIP);
                            setYtdCnesstInsurable(cumulativeGross);
                            if (emp.cnesstClassification) {
                              const matchedSec = CNESST_SECTORS.find(sec => sec.code === emp.cnesstClassification);
                              if (matchedSec) {
                                setCnesstSectorCode(matchedSec.code);
                                setCnesstEmployerRate(matchedSec.rate);
                              }
                            }
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
                      >
                        <option value="">{t('free_simulation')}</option>
                        {employees.map((e, idx) => (
                          <option key={`${e.id}-${idx}`} value={e.id}>{e.firstName} {e.lastName}</option>
                        ))}
                      </select>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <PayrollForm 
                      grossPay={grossPay}
                      frequency={frequency}
                      bonusPay={bonusPay}
                      vacationPay={vacationPay}
                      overtimePay={overtimePay}
                      commissionPay={commissionPay}
                      commissionExpenses={commissionExpenses}
                      rrspContribution={rrspContribution}
                      taxableBenefitsFederal={taxableBenefitsFederal}
                      taxableBenefitsProvincial={taxableBenefitsProvincial}
                      garnishments={garnishments}
                      ytdQPP={ytdQPP}
                      ytdEI={ytdEI}
                      ytdQPIP={ytdQPIP}
                      ytdCnesstInsurable={ytdCnesstInsurable}
                      cnesstSectorCode={cnesstSectorCode}
                      cnesstEmployerRate={cnesstEmployerRate}
                      includeCnesstInDeductions={includeCnesstInDeductions}
                      taxableSupplyAmount={taxableSupplyAmount}
                      nonTaxableSupplyAmount={nonTaxableSupplyAmount}
                      supplyTaxability={supplyTaxability}
                      supplyTaxMode={supplyTaxMode}
                      hasMultipleEmployers={hasMultipleEmployers}
                      claimFederalBasicPersonalAmount={claimFederalBasicPersonalAmount}
                      federalTd1ClaimAmount={federalTd1ClaimAmount}
                      t1213FederalReduction={t1213FederalReduction}
                      claimProvincialBasicPersonalAmount={claimProvincialBasicPersonalAmount}
                      quebecTp1015Line10Code={quebecTp1015Line10Code}
                      tp1016QuebecReduction={tp1016QuebecReduction}
                      voluntaryPreTaxRrsp={voluntaryPreTaxRrsp}
                      voluntaryPostTaxHealth={voluntaryPostTaxHealth}
                      onChange={handleFormChange}
                    />

                    <BenefitsManager 
                      benefits={benefits}
                      onChange={setBenefits}
                    />
                    
                    <div className="mt-6 bg-slate-900 text-white p-5 rounded-lg shadow-sm border border-slate-800">
                      <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        {language === 'fr' ? 'Note Fiscale' : 'Tax Note'}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {language === 'fr'
                          ? "Le Québec applique un abattement de 16,5 % de l'impôt fédéral de base pour les résidents. Ce calcul est automatiquement inclus dans vos résultats."
                          : "Quebec applies a 16.5% abatement of basic federal tax for residents. This calculation is automatically included in your results."}
                      </p>
                    </div>
                  </motion.div>
                </div>

                <div className="xl:col-span-8 space-y-6">
                  <PayrollSummary 
                    result={payrollResult} 
                    employee={employees.find(e => e.id === selectedEmployeeId)}
                    fiscalYear={fiscalYear}
                    payPeriod={currentPayPeriod}
                  />
                  <div className="mt-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-7 sm:p-8 rounded-2xl text-white shadow-xl shadow-blue-200 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="relative z-10">
                      <h4 className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('net_pay')}</h4>
                      <div className="text-4xl font-black mt-2 font-mono tracking-tight">
                        {payrollResult.netPay.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA', { style: 'currency', currency: 'CAD' })}
                      </div>
                      <p className="text-xs font-medium mt-3 opacity-80">
                        {language === 'fr' ? `Calcul officiel basé sur la période ${frequency}` : `Official calculation based on ${frequency} period`}
                      </p>
                    </div>

                    <div className="relative z-10 shrink-0">
                      <button
                        onClick={async () => {
                          let companySettings: any = null;
                          try {
                            companySettings = await Storage.getSettings();
                          } catch {
                            // fallback
                          }

                          const activeEmp = employees.find(e => e.id === selectedEmployeeId);
                          exportPayrollCalculationPDF({
                            result: payrollResult,
                            employee: activeEmp,
                            fiscalYear,
                            frequency,
                            payPeriod: currentPayPeriod,
                            language: language as 'fr' | 'en',
                            companyInfo: {
                              name: companySettings?.companyName,
                              address: companySettings?.address,
                              employerNumber: companySettings?.revenuQuebecId,
                              neq: companySettings?.neq,
                              federalId: companySettings?.federalId,
                            }
                          });
                        }}
                        className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all active:scale-95 cursor-pointer"
                        title={language === 'fr' ? 'Exporter les résultats actuels en PDF via jsPDF' : 'Export current calculation results to PDF via jsPDF'}
                      >
                        <FileDown className="w-4 h-4 text-blue-600" />
                        <span>{language === 'fr' ? 'Exporter en PDF (jsPDF)' : 'Export to PDF (jsPDF)'}</span>
                      </button>
                    </div>

                    <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
                      <Calculator className="w-40 h-40" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'dashboard' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Dashboard 
                  employees={employees} 
                  payStubs={payStubs} 
                  onNavigate={setCurrentView} 
                />
              </motion.div>
            )}

            {currentView === 'settings' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Settings />
              </motion.div>
            )}

            {currentView === 'employees' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EmployeeManager 
                  employees={employees}
                  payStubs={payStubs}
                  onAdd={handleAddEmployee}
                  onEdit={handleEditEmployee}
                  onDelete={handleDeleteEmployee}
                  onPayStubCreated={loadData}
                />
              </motion.div>
            )}

            {currentView === 'history' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <PayStubHistory 
                  stubs={payStubs} 
                  employees={employees} 
                  onPayStubCreated={loadData}
                />
              </motion.div>
            )}

            {currentView === 'timesheets' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <TimesheetManager 
                  employees={employees}
                  onApplyHours={(empId, reg, ot) => {
                    setSelectedEmployeeId(empId);
                    const emp = employees.find(e => e.id === empId);
                    if (emp) {
                      const regPay = reg * (emp.hourlyRate || emp.baseSalary / (FREQUENCY_WEEKS[emp.frequency] * 40)); // rough estimate if no hourly rate
                      const otPay = ot * (emp.hourlyRate || emp.baseSalary / (FREQUENCY_WEEKS[emp.frequency] * 40)) * 1.5;
                      setGrossPay(regPay);
                      setOvertimePay(otPay);
                      setVacationPay(regPay * emp.vacationRate);
                      setFrequency(emp.frequency);
                      setCurrentView('calculator');
                    }
                  }}
                />
              </motion.div>
            )}

            {currentView === 'reports' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ReportsManager 
                  stubs={payStubs} 
                  employees={employees} 
                  activePayrollResult={payrollResult} 
                  activeGrossPay={grossPay} 
                  fiscalYear={fiscalYear} 
                />
              </motion.div>
            )}

            {currentView === 'expenses' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BusinessExpenseManager employees={employees} />
              </motion.div>
            )}

            {currentView === 'gpsTriplog' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BusinessExpenseManager employees={employees} initialTab="gps_triplog" />
              </motion.div>
            )}

            {currentView === 'distributions' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CorporateDistributionsManager employees={employees} />
              </motion.div>
            )}

            {currentView === 'database' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <DatabaseStatus />
              </motion.div>
            )}

            {currentView === 'onboarding' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EmployeeOnboardingForm />
              </motion.div>
            )}

            {currentView === 'invoiceAudit' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ApplechaiAuditWrapper onNavigateToExpenses={() => setCurrentView('expenses')} />
              </motion.div>
            )}
              </>
            )}
          </div>
        </div>

        {/* Auth Modal for Login / Signup / Role Switcher */}
        <AuthModal />

        {/* Mock Email Notification Toast */}
        <AnimatePresence>
          {mockEmail && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: 50 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 50, x: 50 }}
              className="fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl border border-gray-100 p-4 max-w-sm flex items-start space-x-4"
            >
              <div className="bg-blue-100 text-blue-600 rounded-full p-2 flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {language === 'fr' ? 'Courriel Envoyé' : 'Email Sent'}
                  </p>
                  <button onClick={() => setMockEmail(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {language === 'fr' ? 'À :' : 'To:'} {mockEmail.employeeName}
                </p>
                <div className="mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                  <p className="text-xs text-gray-700">
                    <strong>{language === 'fr' ? 'Objet :' : 'Subject:'}</strong> {language === 'fr' ? 'Votre nouvelle fiche de paie est prête' : 'Your New Pay Stub is Ready'}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {language === 'fr' 
                      ? `Votre fiche de paie pour le ${mockEmail.date} a été générée. Votre salaire net de `
                      : `Your pay stub for ${mockEmail.date} has been generated. Your net pay of `}
                    <strong>${mockEmail.netPay.toFixed(2)}</strong> {language === 'fr' ? 'a été traité.' : 'has been processed.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
