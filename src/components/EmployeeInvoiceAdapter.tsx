import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';

interface EmployeeInvoiceAdapterProps {
  invoice: any;
  lines: any[];
  currentUser: any;
  onNavigateToExpenses?: () => void;
}

export const EmployeeInvoiceAdapter: React.FC<EmployeeInvoiceAdapterProps> = ({ 
  invoice, 
  lines, 
  currentUser,
  onNavigateToExpenses 
}) => {
  const { language } = useLanguage();
  const isFr = language === 'fr';
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mapToCanonicalPayload = (line: any, mode: 'preview' | 'commit') => ({
    source: "invoice_audit",
    sourceId: String(invoice.id),
    sourceLineId: String(line.id),
    idempotencyKey: `invoice:${invoice.id}:line:${line.id}`,
    companyId: invoice.companyId || 'comp_1',
    userId: currentUser.id,
    date: invoice.date,
    currency: invoice.currency,
    amountGross: line.grossAmount,
    taxes: line.taxes,
    description: line.description,
    categoryHint: line.predictedCategory,
    attachments: [{ type: "invoice_pdf", url: invoice.pdfUrl }],
    mappingRules: { mode: "per_line" },
    requestMode: mode
  });

  const handlePreview = async () => {
    setIsSubmitting(true);
    try {
      const results: any[] = [];
      for (const line of lines) {
        const payload = mapToCanonicalPayload(line, 'preview');
        try {
          const response = await fetch('/api/ecs/create', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'x-user-id': currentUser.id,
              'x-user-role': currentUser.role || 'Employee'
            },
            body: JSON.stringify(payload)
          });
          const data = await response.json();
          if (data.calculations && data.calculations.length > 0) {
            results.push(...data.calculations);
          } else {
            results.push({
              sourceLineId: String(line.id),
              category: line.predictedCategory || 'General',
              computedExpenseAmount: line.grossAmount,
              description: line.description
            });
          }
        } catch (err) {
          results.push({
            sourceLineId: String(line.id),
            category: line.predictedCategory || 'General',
            computedExpenseAmount: line.grossAmount,
            description: line.description
          });
        }
      }
      setPreviewData(results);
    } catch (e) {
      console.error(e);
      setPreviewData(lines.map(line => ({
        sourceLineId: String(line.id),
        category: line.predictedCategory || 'General',
        computedExpenseAmount: line.grossAmount,
        description: line.description
      })));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommit = async () => {
    setIsSubmitting(true);
    try {
      let committedCount = 0;
      for (const line of lines) {
        const payload = mapToCanonicalPayload(line, 'commit');
        
        // Post to ECS service
        fetch('/api/ecs/create', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': currentUser.id,
            'x-user-role': currentUser.role || 'Employee'
          },
          body: JSON.stringify(payload)
        }).catch(console.error);

        // Also ensure it is committed to /api/expenses with all required metadata
        const expenseItem = {
          id: `exp_inv_${invoice.id}_${line.id}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          date: invoice.date || new Date().toISOString().split('T')[0],
          category: line.predictedCategory || 'Office Supplies',
          description: `Facture #${invoice.id} - ${line.description}`,
          amount: line.grossAmount,
          deductibleAmount: line.grossAmount,
          employeeId: currentUser.id,
          employeeName: currentUser.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'Employé',
          employeeEmail: currentUser.email,
          source: 'invoice_audit',
          sourceId: String(invoice.id),
          sourceLineId: String(line.id),
          taxBreakdown: line.taxes,
          status: 'pending_approval',
          notes: `Ligne de facture transférée de l'auditeur. TPS: $${line.taxes?.gst || 0}, TVQ: $${line.taxes?.qst || 0}`
        };

        const resp = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(expenseItem)
        });

        if (resp.ok) {
          committedCount++;
        }
      }

      setSuccessMessage(`${committedCount} note(s) de frais soumise(s) avec succès ! Elles sont maintenant en attente d'approbation par l'administrateur.`);

      setTimeout(() => {
        if (onNavigateToExpenses) {
          onNavigateToExpenses();
        } else {
          window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'expenses' }));
        }
      }, 1500);

    } catch (e: any) {
      alert(isFr ? `Erreur: ${e.message}` : `Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-slate-900">
          {isFr ? 'Soumettre la Facture comme Note de Frais' : 'Submit Invoice as Expense Claim'}
        </h3>
        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">
          {currentUser.name || currentUser.email}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        {isFr
          ? 'Transférez directement les lignes analysées de cette facture dans le registre des dépenses pour remboursement.'
          : 'Directly transfer the parsed invoice lines into the business expense registry for managerial review and reimbursement.'}
      </p>

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <span>✓ {successMessage}</span>
          <span className="text-[10px] text-emerald-600 font-bold uppercase">
            {isFr ? "Redirection vers l'onglet Dépenses..." : 'Redirecting to Expenses tab...'}
          </span>
        </div>
      )}

      {!previewData ? (
        <button 
          onClick={handlePreview} 
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
        >
          {isSubmitting 
            ? (isFr ? 'Analyse en cours...' : 'Analyzing...') 
            : (isFr ? 'Aperçu du Transfert de Dépense (Preview)' : 'Preview Expense Claim Transfer')}
        </button>
      ) : (
        <div className="bg-slate-50 p-4 border border-gray-200 rounded-xl space-y-3">
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">
            {isFr ? 'Détails de la Note de Frais Générée' : 'Generated Expense Claim Details'}
          </h4>
          {previewData.map(calc => (
            <div key={calc.sourceLineId} className="flex justify-between py-2 border-b border-gray-200 text-xs">
              <span className="text-slate-600">{isFr ? 'Catégorie :' : 'Category:'} <strong className="text-slate-900">{calc.category}</strong></span>
              <span className="text-slate-600">{isFr ? 'Montant à rembourser :' : 'Reimbursement amount:'} <strong className="text-blue-700">{calc.computedExpenseAmount} $ CAD</strong></span>
            </div>
          ))}
          <div className="mt-4 flex gap-2">
            <button 
              onClick={handleCommit} 
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {isSubmitting 
                ? (isFr ? 'Envoi...' : 'Submitting...') 
                : (isFr ? 'Transférer à l\'Administrateur pour Remboursement' : 'Transfer to Manager for Reimbursement')}
            </button>
            <button 
              onClick={() => setPreviewData(null)}
              className="text-gray-600 hover:text-gray-900 px-4 py-2 text-xs font-medium cursor-pointer"
            >
              {isFr ? 'Annuler' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default EmployeeInvoiceAdapter;
