/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ExtractedFinancialItem, Employee } from '../types';
import { extractAndCategorizeFinancialDocument } from '../lib/taxableBenefits2025';
import { 
  FileSearch, 
  Sparkles, 
  CheckCheck, 
  FileText, 
  AlertTriangle, 
  ArrowRight, 
  Building2, 
  DollarSign, 
  Upload,
  Receipt,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Storage } from '../lib/storage';
import { useLanguage } from './LanguageContext';

interface DocumentExtractorProps {
  employees: Employee[];
  onImportComplete: () => void;
}

const SAMPLE_DOCUMENTS = [
  {
    titleFr: 'Rapport mensuel de dépenses & allocations employés',
    titleEn: 'Monthly Employee Expense & Allowance Claim',
    content: `2025-02-15 - Indemnité kilométrique d'affaires pour tournée commerciale (6 200 km) : 4 550,00 $
2025-02-18 - Allocation forfaitaire fixe pour utilisation de véhicule : 500,00 $
2025-02-20 - Repas d'affaires avec clients prospects au restaurant : 145,00 $
2025-02-22 - Repas fournis aux employés de l'hôtel (25 repas facturés 18 $ aux clients) : 450,00 $
2025-02-24 - Carte-cadeau en argent accordée à l'employé pour performance : 300,00 $
2025-02-25 - Cadeau non monétaire pour anniversaire de l'employé : 250,00 $
2025-02-26 - Abonnement logiciel de gestion de paie ApplepAI SaaS : 129,00 $`
  },
  {
    titleFr: 'Facture d\'avantages sociaux & automobile de fonction',
    titleEn: 'Employee Benefits & Company Auto Invoice',
    content: `2025-03-01 - Prime employeur régime privé d'assurance maladie (frais médicaux/dentaires) : 180,00 $
2025-03-01 - Prime employeur assurance-vie collective temporaire & maladies graves : 45,00 $
2025-03-05 - Droit d'usage pour automobile de fonction possédée (Coût d'achat 42 000 $) : 42 000,00 $
2025-03-08 - Frais de fonctionnement auto pour utilisation personnelle (1 200 km) : 408,00 $
2025-03-10 - Cotisation patronale versée au compte CELI de l'employé : 500,00 $`
  },
  {
    titleFr: 'Chantiers éloignés & Déménagement',
    titleEn: 'Remote Sites & Relocation Expenses',
    content: `2025-03-12 - Pension et hébergement sur chantier particulier situé à 140 km (zone éloignée) : 850,00 $
2025-03-15 - Allocation de départ en fin de semaine (check-out allowance) pour employé sur chantier : 200,00 $
2025-03-18 - Remboursement des frais réels de transport et déménagement d'un cadre muté : 1 450,00 $
2025-03-20 - Allocation forfaitaire non justifiable de réinstallation : 950,00 $
2025-03-22 - Prêt consenti à l'employé à taux réduit (Prescrit 4% T1 2025) : 50 000,00 $`
  }
];

export const DocumentExtractor: React.FC<DocumentExtractorProps> = ({ employees, onImportComplete }) => {
  const { isFr } = useLanguage();
  const [rawText, setRawText] = useState(SAMPLE_DOCUMENTS[0].content);
  const [extractedItems, setExtractedItems] = useState<ExtractedFinancialItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const handleExtract = () => {
    setIsProcessing(true);
    setImportSuccess(false);
    setTimeout(() => {
      const items = extractAndCategorizeFinancialDocument(rawText);
      setExtractedItems(items);
      setIsProcessing(false);
    }, 300);
  };

  const handleImportAll = async () => {
    if (extractedItems.length === 0) return;

    const emp = employees.find(e => e.id === selectedEmployeeId);
    const empName = emp ? `${emp.firstName} ${emp.lastName}` : undefined;

    for (const item of extractedItems) {
      if (item.type === 'business_expense' || item.type === 'non_taxable_reimbursement') {
        // Save to business expenses
        await Storage.saveExpense({
          date: item.date,
          category: item.expenseCategory || 'other',
          description: item.description,
          amount: item.totalAmount,
          deductibleAmount: item.deductibleAmount ?? item.totalAmount,
          notes: item.appliedRule
        });
      } else if (item.type === 'taxable_benefit') {
        // Save to taxable benefits
        await Storage.saveTaxableBenefit({
          employeeId: selectedEmployeeId || undefined,
          employeeName: empName || (isFr ? 'Général / Déclaré' : 'General / Logged'),
          date: item.date,
          category: item.taxableBenefitCategory || 'other_benefit',
          description: item.description,
          totalAmount: item.totalAmount,
          taxableAmount: item.taxableAmount || item.totalAmount,
          nonTaxableAmount: item.nonTaxableAmount || 0,
          rl1Box: item.rl1Box || 'A, L',
          t4Box: item.t4Box || '14, Code 40',
          subjectToQpp: true,
          subjectToQpip: false,
          subjectToEi: false,
          subjectToTax: true,
          calculationDetails: item.calculationDetails
        });
      }
    }

    setImportSuccess(true);
    onImportComplete();
  };

  const businessExpensesCount = extractedItems.filter(i => i.type === 'business_expense' || i.type === 'non_taxable_reimbursement').length;
  const taxableBenefitsCount = extractedItems.filter(i => i.type === 'taxable_benefit').length;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileSearch className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-tight">
                {isFr ? 'Extracteur de Dépenses & Avantages Imposables (Revenu Québec 2025)' : 'Expense & Taxable Benefit AI Extractor'}
              </h3>
              <p className="text-xs text-slate-500">
                {isFr 
                  ? 'Analyse automatiquement vos reçus, états de compte et feuilles de réclamations selon les barèmes 2025 (IN-253-V & T4130).' 
                  : 'Automatically extracts and routes submitted expenses to either Standard Expenses or Taxable Benefits.'}
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{isFr ? 'Modèles :' : 'Presets:'}</span>
            {SAMPLE_DOCUMENTS.map((doc, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setRawText(doc.content);
                  setExtractedItems([]);
                  setImportSuccess(false);
                }}
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg transition border border-gray-200 cursor-pointer"
              >
                {isFr ? doc.titleFr : doc.titleEn}
              </button>
            ))}
          </div>
        </div>

        {/* Input Text Area */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <label className="flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isFr ? 'Texte brut du document, rapport de dépenses ou journal kilométrique :' : 'Raw document text or expense claims:'}</span>
            </label>
            <span className="text-[10px] font-normal text-slate-400">
              {isFr ? 'Supporte dates, montants en $, distances en km et libellés' : 'Supports dates, amounts in $, km and labels'}
            </span>
          </div>

          <textarea
            rows={6}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder={isFr ? 'Collez ici le texte des factures, réclamations ou reçus...' : 'Paste invoice text, claims or receipt details here...'}
            className="w-full p-3.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                {isFr ? 'Attribuer à l\'employé :' : 'Assign to employee:'}
              </label>
              <select
                value={selectedEmployeeId}
                onChange={e => setSelectedEmployeeId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs outline-none cursor-pointer"
              >
                <option value="">{isFr ? '-- Général / Déclaré --' : '-- General / Logged --'}</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExtract}
              disabled={isProcessing || !rawText.trim()}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isProcessing ? (isFr ? 'Extraction en cours...' : 'Extracting...') : (isFr ? 'Analyser & Catégoriser (Règles 2025)' : 'Analyze & Categorize (2025 Rules)')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Extraction Results Breakdown */}
      {extractedItems.length > 0 && (
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  {isFr ? 'Extraction réussie' : 'Extraction complete'}
                </span>
                <span className="text-xs text-slate-300">
                  {extractedItems.length} {isFr ? 'éléments identifiés' : 'items detected'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isFr 
                  ? `${businessExpensesCount} dépenses acheminées vers la Page Principale et ${taxableBenefitsCount} avantages vers la Sous-Page Avantages Imposables.`
                  : `${businessExpensesCount} routed to Main Expenses and ${taxableBenefitsCount} to Taxable Benefits Sub-Page.`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleImportAll}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <CheckCheck className="w-4 h-4" />
                <span>{isFr ? 'Importer tout dans le système' : 'Commit & Import All to App'}</span>
              </button>
            </div>
          </div>

          {importSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>
                {isFr 
                  ? 'Tous les éléments ont été enregistrés avec succès dans les bases de données correspondantes.' 
                  : 'All items have been successfully saved into their respective databases.'}
              </span>
            </div>
          )}

          {/* Grouped Lists: Main Expenses vs Taxable Benefits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Main Expenses Page Items */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase">
                      {isFr ? '1. Page Principale des Dépenses' : '1. Main Expenses Page'}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {isFr ? 'Dépenses courantes & remboursements non imposables' : 'Standard business expenses & non-taxable reimbursements'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  {businessExpensesCount}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {extractedItems
                  .filter(i => i.type === 'business_expense' || i.type === 'non_taxable_reimbursement')
                  .map(item => (
                    <div key={item.id} className="p-3.5 bg-slate-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-800">{item.description}</span>
                        <span className="font-extrabold text-blue-700 whitespace-nowrap">{formatCurrency(item.totalAmount)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{item.explanation}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-gray-200/60">
                        <span className="font-medium bg-white px-2 py-0.5 rounded border border-gray-200">
                          Catégorie: {item.expenseCategory}
                        </span>
                        <span className="text-emerald-600 font-bold">
                          Déductible: {formatCurrency(item.deductibleAmount ?? item.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}

                {businessExpensesCount === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-8">
                    {isFr ? 'Aucune dépense standard dans ce document.' : 'No standard business expenses found.'}
                  </p>
                )}
              </div>
            </div>

            {/* 2. Taxable Benefits Sub-Page Items */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase">
                      {isFr ? '2. Sous-Page Avantages Imposables' : '2. Taxable Benefits Sub-Page'}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {isFr ? 'Éléments imposables selon le guide Revenu Québec 2025' : 'Taxable items under Revenu Québec 2025 rules'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  {taxableBenefitsCount}
                </span>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {extractedItems
                  .filter(i => i.type === 'taxable_benefit')
                  .map(item => (
                    <div key={item.id} className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-900">{item.description}</span>
                        <div className="text-right whitespace-nowrap">
                          <span className="font-extrabold text-red-600 block">{formatCurrency(item.taxableAmount || item.totalAmount)}</span>
                          {item.nonTaxableAmount ? (
                            <span className="text-[10px] text-emerald-600 font-medium">Exo: {formatCurrency(item.nonTaxableAmount)}</span>
                          ) : null}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-700">{item.explanation}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-indigo-100 text-[10px]">
                        <span className="font-bold text-indigo-800 bg-white px-2 py-0.5 rounded border border-indigo-200">
                          RL-1: {item.rl1Box}
                        </span>
                        <span className="font-medium text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200">
                          T4: {item.t4Box}
                        </span>
                        <span className="text-indigo-600 italic ml-auto">{item.appliedRule}</span>
                      </div>
                    </div>
                  ))}

                {taxableBenefitsCount === 0 && (
                  <p className="text-xs text-slate-400 italic text-center py-8">
                    {isFr ? 'Aucun avantage imposable détecté dans ce document.' : 'No taxable benefits detected.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
