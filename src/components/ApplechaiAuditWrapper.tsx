import React from 'react';
import ApplechAIInvoiceApp from '../../inv/src/App';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from './LanguageContext';
import { EmployeeInvoiceAdapter } from './EmployeeInvoiceAdapter.tsx';

interface ApplechaiAuditWrapperProps {
  onNavigateToExpenses?: () => void;
}

export function ApplechaiAuditWrapper({ onNavigateToExpenses }: ApplechaiAuditWrapperProps) {
  const { user, userProfile, isEmployee } = useAuth();
  const { language } = useLanguage();

  const currentUser = {
    id: user?.uid || 'emp_001',
    name: user?.displayName || userProfile?.displayName || 'Alexandre Tremblay',
    email: user?.email || 'a.tremblay@applepai.ca',
    role: isEmployee ? 'Employee' : 'Admin'
  };

  const sampleInvoice = {
    id: 101,
    companyId: 'comp_1',
    date: new Date().toISOString().split('T')[0],
    currency: 'CAD',
    pdfUrl: '/uploads/sample-invoice.pdf',
    vendor: 'Resto Le Filet Montréal'
  };

  const sampleLines = [
    { id: 1, grossAmount: 184.50, taxes: { gst: 8.02, qst: 16.00 }, description: 'Client Q1 Lunch Meeting (Affaires)', predictedCategory: 'Meals & Entertainment' },
    { id: 2, grossAmount: 150.00, taxes: { gst: 7.5, qst: 14.96 }, description: 'Office Software License & Cloud Hosting', predictedCategory: 'Office & SaaS Software' }
  ];

  return (
    <div className="w-full h-full min-h-[calc(100vh-4rem)] bg-gray-50 overflow-auto p-2 space-y-2" style={{ paddingLeft: '0px', paddingRight: '0px' }}>
      {/* Banner indicating direct connection to Expense workflow */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mx-[10px]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {isEmployee ? (language === 'fr' ? 'Portail Employé' : 'Employee Portal') : (language === 'fr' ? 'Supervision Direction / RH' : 'Management / HR Oversight')}
            </span>
            <span className="text-xs text-blue-300">• {language === 'fr' ? 'Connexion Directe Dépenses & Paie' : 'Direct Link to Expenses & Payroll'}</span>
          </div>
          <h2 className="text-lg font-extrabold mt-1">
            {language === 'fr' ? 'Invoice Audit & Transfert de Notes de Frais' : 'Invoice Audit & Expense Reimbursement Bridge'}
          </h2>
          <p className="text-xs text-blue-200/90 mt-0.5 max-w-2xl">
            {language === 'fr'
              ? 'Importez ou auditez des factures pour extraire automatiquement les montants, taxes TPS/TVQ, et les transférer en un clic dans l\'onglet Dépenses sous le nom de l\'employé pour approbation et remboursement.'
              : 'Import or audit invoices to automatically extract totals, GST/QST sales tax splits, and seamlessly transfer them to the Business Expenses tab for managerial sign-off and reimbursement.'}
          </p>
        </div>

        {onNavigateToExpenses && (
          <button
            onClick={onNavigateToExpenses}
            className="self-start sm:self-center px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl font-bold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            {language === 'fr' ? "Consulter l'Onglet Dépenses →" : 'View Expenses Tab →'}
          </button>
        )}
      </div>

      {isEmployee && (
        <div className="max-w-4xl mx-auto mx-[10px]">
          <EmployeeInvoiceAdapter 
            invoice={sampleInvoice} 
            lines={sampleLines} 
            currentUser={currentUser}
            onNavigateToExpenses={onNavigateToExpenses}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xs border border-gray-200 mx-[5px] px-[5px] py-[10px]" style={{ marginLeft: '5px', marginRight: '5px', paddingLeft: '5px', paddingRight: '5px', paddingTop: '10px', paddingBottom: '10px' }}>
        <h3 className="text-sm font-bold text-slate-800 mb-[5px] flex items-center justify-between">
          <span>
            {isEmployee 
              ? (language === 'fr' ? 'Toutes les Factures & Outil d\'Audit' : 'All Invoices & Audit Tool') 
              : (language === 'fr' ? 'Moteur d\'Audit des Factures & Réconciliation Fiscale (TPS/TVQ)' : 'Invoice Audit Engine & Tax Reconciliation (GST/QST)')}
          </span>
          <span className="text-xs font-semibold text-blue-600 ml-[4px]">
            {language === 'fr' ? 'Conforme Revenu Québec & ARC' : 'Revenu Québec & CRA Compliant'}
          </span>
        </h3>
        
        <ApplechAIInvoiceApp
          language={language}
          user={user ? {
            id: user.uid,
            uid: user.uid,
            email: user.email || '',
            name: user.displayName || userProfile?.displayName || user.email?.split('@')[0] || 'Alexandre Tremblay'
          } : {
            id: 'emp_001',
            uid: 'emp_001',
            email: 'a.tremblay@applepai.ca',
            name: 'Alexandre Tremblay'
          }}
          onNavigateToExpenses={onNavigateToExpenses}
        />
      </div>
    </div>
  );
}
