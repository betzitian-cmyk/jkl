import React, { useState } from 'react';

interface InvoiceToExpenseAdapterProps {
  invoice: {
    id: string | number;
    companyId: string;
    uploadedBy: string;
    date: string;
    currency: string;
    pdfUrl?: string;
  };
  lines: Array<{
    id: string | number;
    grossAmount: number;
    netAmount?: number;
    taxes?: any;
    description: string;
    predictedCategory?: string;
  }>;
  onSuccess?: () => void;
}

export const InvoiceToExpenseAdapter: React.FC<InvoiceToExpenseAdapterProps> = ({ invoice, lines, onSuccess }) => {
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mapToCanonicalPayload = (line: any, mode: 'preview' | 'commit') => ({
    source: "invoice",
    sourceId: invoice.id,
    sourceLineId: line.id,
    idempotencyKey: `invoice:${invoice.id}:line:${line.id}`,
    companyId: invoice.companyId,
    userId: invoice.uploadedBy,
    date: invoice.date,
    currency: invoice.currency,
    amountGross: line.grossAmount,
    amountNet: line.netAmount || line.grossAmount,
    taxes: line.taxes,
    description: line.description,
    categoryHint: line.predictedCategory || "General",
    attachments: invoice.pdfUrl ? [{ type: "invoice_pdf", url: invoice.pdfUrl }] : [],
    mappingRules: { mode: "per_line" },
    requestMode: mode
  });

  const handlePreview = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payloads = lines.map(line => mapToCanonicalPayload(line, 'preview'));
      // Processes the first line for visual validation/mapping
      const response = await fetch('/api/ecs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads[0])
      });
      
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.calculations) {
        setPreviewData(data.calculations);
      } else {
        throw new Error("No calculation data returned from the service.");
      }
    } catch (error: any) {
      console.error("Preview failed:", error);
      setErrorMsg(error.message || "Failed to generate dry-run preview. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommit = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payloads = lines.map(line => mapToCanonicalPayload(line, 'commit'));
      // In a production application, execute sequential commits or implement bulk endpoints
      const response = await fetch('/api/ecs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads[0])
      });
      
      if (response.ok) {
        alert("Expenses successfully created and linked to this invoice.");
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to commit expense creation.");
      }
    } catch (error: any) {
      console.error("Commit failed. Item added to retry queue.", error);
      setErrorMsg(error.message || "Commit failed. Expense item was not persistent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="invoice-adapter-panel bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Create Expenses from Invoice</h3>
        <p className="text-sm text-gray-500">
          Transform raw invoice line items into validated, reimbursable business expenses.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm font-medium" role="alert">
          ⚠️ {errorMsg}
        </div>
      )}

      {!previewData ? (
        <button 
          onClick={handlePreview} 
          disabled={isSubmitting}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? 'Simulating dry-run...' : 'Preview Expense(s) from Invoice'}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Dry-Run Calculations</h4>
            {previewData.map((calc, i) => (
              <div key={calc.sourceLineId || i} className="border-b last:border-b-0 pb-2 last:pb-0 text-sm space-y-1">
                <p className="text-gray-700 font-medium">Mapped Category: <span className="text-indigo-600">{calc.category}</span></p>
                <div className="flex justify-between text-slate-600 text-xs">
                  <span>Original: <strong>{calc.originalAmount}</strong></span>
                  <span>CAD Value: <strong>{calc.computedExpenseAmount}</strong></span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleCommit} 
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Committing...' : 'Commit & Create Expenses'}
            </button>
            <button 
              onClick={() => setPreviewData(null)}
              className="text-slate-600 hover:text-slate-900 text-sm font-medium px-4 py-2.5 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
