import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, FileText, CheckCircle, Loader2, 
  Download, Building, Receipt, FileSpreadsheet,
  AlertCircle, ChevronDown, ArrowLeft, ShieldCheck, Sparkles,
  Tag, Calendar, Clock, DollarSign, Folder, Info, ShieldAlert, FileCheck, Database
} from 'lucide-react';
import { ParsedInvoice, TaxBreakdown, validateInvoice } from './types.ts';
import { cleanJsonResponse, parseCleanJson, safeParseJson } from './lib/utils.ts';
import { type ExtractedInvoiceData } from './lib/pipeline.ts';
import { getInvTranslation, type InvLanguage } from './lib/i18n.ts';

// ============================================================================
// 1b. AI CLASSIFICATION HELPER
// ============================================================================
function getAICategory(description: string, categoryFromBackend?: string | null, categoryReasonFromBackend?: string | null, lang: string = 'fr') {
  const isFr = lang === 'fr';
  if (categoryFromBackend) {
    return {
      category: categoryFromBackend,
      reason: categoryReasonFromBackend || (isFr ? "Classifié via l'intelligence du pipeline actif." : "Classified via active pipeline intelligence.")
    };
  }
  const desc = description.toLowerCase();
  if (desc.includes("cloud") || desc.includes("server") || desc.includes("node") || desc.includes("ai") || desc.includes("processing") || desc.includes("matrix") || desc.includes("architecture")) {
    return {
      category: isFr ? "Infrastructure Cloud & IA" : "Cloud & AI Infrastructure",
      reason: isFr ? "Correspondance d'architecture infonuagique, nœuds de calcul ou matrices de données." : "Matched cloud architecture, processing nodes, or data matrix keywords."
    };
  }
  if (desc.includes("shipping") || desc.includes("freight") || desc.includes("delivery") || desc.includes("transport") || desc.includes("logistics")) {
    return {
      category: isFr ? "Expédition & Logistique" : "Shipping & Logistics",
      reason: isFr ? "Frais d'exécution des commandes, fret lourd ou transport logistique." : "Identified fulfillment charges, heavy freight, or supply chain services."
    };
  }
  if (desc.includes("consulting") || desc.includes("review") || desc.includes("audit") || desc.includes("service") || desc.includes("professional")) {
    return {
      category: isFr ? "Services Professionnels" : "Professional Services",
      reason: isFr ? "Classifié comme mission de conseil technique ou d'expertise comptable/audit." : "Classified as specialized technical consulting or advisory engagement."
    };
  }
  if (desc.includes("recycle") || desc.includes("environmental") || desc.includes("ehf") || desc.includes("fee") || desc.includes("handling")) {
    return {
      category: isFr ? "Frais Réglementaires & Écologiques" : "Regulatory & Compliance Fee",
      reason: isFr ? "Frais environnementaux de recyclage ou éco-contribution publique." : "Identified public agency environmental recycling surcharge or eco-fee."
    };
  }
  return {
    category: isFr ? "Opérations TI Générales" : "General IT Operations",
    reason: isFr ? "Classification par défaut basée sur les dépenses opérationnelles générales." : "Default classification based on general operational expenditures."
  };
}

// Sample demo invoice for quick dashboard preview
const SAMPLE_INVOICE: ParsedInvoice = validateInvoice({
  invoiceNumber: "INV-2026-089",
  poNumber: "PO-98412-CA",
  date: "2026-08-01",
  dueDate: "2026-08-31",
  paymentTerms: "Net 30",
  vendorName: "ApplechAI Logistics Canada Inc.",
  vendorAddress: "123 Innovation Blvd, Montreal, QC H3B 2Y5",
  customerName: "Acme Enterprise Solutions Ltd.",
  customerAddress: "456 Corporate Way, Toronto, ON M5V 2T6",
  subtotal: 1450.00,
  shipping: 50.00,
  tax: 224.63,
  total: 1724.63,
  currency: "CAD",
  province: "QC",
  taxGroup: "GST+QST",
  taxBreakdown: {
    gst: 75.00,
    pst: null,
    hst: null,
    qst: 149.63,
    rst: null,
  },
  vendorTaxNumbers: {
    businessNumber: "892341092",
    gstHst: "892341092RT0001",
    qst: "1234567890TQ0001",
    pst: null,
    rst: null,
    validation_results: {
      GST: { status: "VALID", message: "Valid GST registration active." },
      QST: { status: "VALID", message: "Valid QST registration active." }
    }
  },
  items: [
    {
      description: "Enterprise Cloud AI Processing - Server Node Alpha",
      quantity: 2,
      unitPrice: 500.00,
      amount: 1000.00,
      taxabilityGroup: "Taxable",
      taxRate: 0.14975,
      tax: 149.75,
      taxBreakdown: { gst: 50.00, pst: null, hst: null, qst: 99.75, rst: null },
      category: "Cloud Infrastructure",
      categoryReason: "Server hosting and compute resources"
    },
    {
      description: "Data Extraction Layout Matrix & Document Partitioning",
      quantity: 1,
      unitPrice: 450.00,
      amount: 450.00,
      taxabilityGroup: "Taxable",
      taxRate: 0.14975,
      tax: 67.39,
      taxBreakdown: { gst: 22.50, pst: null, hst: null, qst: 44.89, rst: null },
      category: "Software Services",
      categoryReason: "AI document layout parsing and extraction"
    },
    {
      description: "Shipping Fee",
      quantity: 1,
      unitPrice: 50.00,
      amount: 50.00,
      taxabilityGroup: "Taxable",
      taxRate: 0.14975,
      tax: 7.49,
      taxBreakdown: { gst: 2.50, pst: null, hst: null, qst: 4.99, rst: null },
      category: "Shipping & Freight",
      categoryReason: "Document transport and delivery logistics"
    }
  ],
  summary: "Canadian B2B IT & Cloud Logistics services subject to Quebec GST/QST tax compliance rules."
});

// ============================================================================
// 2. MAIN APPLICATION COMPONENT
// ============================================================================

function ApplechAIInvoiceDashboard({ 
  language = 'fr', 
  user, 
  onNavigateToExpenses 
}: { 
  language?: string; 
  user?: any; 
  onNavigateToExpenses?: () => void; 
} = {}) {
  const [currentLang, setCurrentLang] = useState<InvLanguage>(() => (language === 'en' ? 'en' : 'fr'));
  const [appState, setAppState] = useState<'IDLE' | 'PROCESSING' | 'DASHBOARD'>('IDLE');
  const [progressStep, setProgressStep] = useState(0);

  useEffect(() => {
    if (language === 'en' || language === 'fr') {
      setCurrentLang(language as InvLanguage);
    }
  }, [language]);

  const t = (key: keyof typeof import('./lib/i18n.ts').invTranslations['fr']) => getInvTranslation(currentLang, key);
  const isFr = currentLang === 'fr';
  const [invoiceData, setInvoiceData] = useState<ParsedInvoice | null>(null);
  const [taxValidation, setTaxValidation] = useState<{ gstStatus: string; qstStatus: string; gstDetails?: any; qstDetails?: any; validation_results?: any }>({ gstStatus: 'IDLE', qstStatus: 'IDLE' });
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [isPassingToExpenses, setIsPassingToExpenses] = useState(false);
  const [transferSuccessMessage, setTransferSuccessMessage] = useState<string | null>(null);
  const [employeesList, setEmployeesList] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');

  const activeVerificationController = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch('/api/employees')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmployeesList(data);
          const currentUserId = user?.id || user?.uid;
          const matched = data.find(e => e.id === currentUserId || e.email === user?.email);
          if (matched) {
            setSelectedEmployeeId(matched.id);
          } else if (data.length > 0) {
            setSelectedEmployeeId(data[0].id);
          }
        }
      })
      .catch(err => console.error("Error loading employees in auditor:", err));
  }, [user]);

  const handleTransferInvoiceToExpenses = async () => {
    if (!invoiceData) return;
    setIsPassingToExpenses(true);
    try {
      const selectedEmp = employeesList.find(e => e.id === selectedEmployeeId);
      const empName = selectedEmp 
        ? `${selectedEmp.firstName} ${selectedEmp.lastName}`
        : (user?.name || user?.displayName || user?.email?.split('@')[0] || 'Alexandre Tremblay');
      const empId = selectedEmployeeId || user?.id || user?.uid || 'emp_001';
      const empEmail = selectedEmp?.email || user?.email || 'a.tremblay@applepai.ca';

      const itemsToTransfer = invoiceData.items && invoiceData.items.length > 0 
        ? invoiceData.items 
        : [{
            description: `Consolidated Invoice #${invoiceData.invoiceNumber || 'INV'}`,
            amount: invoiceData.total || (invoiceData.subtotal ? invoiceData.subtotal + (invoiceData.taxBreakdown?.gst || 0) + (invoiceData.taxBreakdown?.qst || 0) : 0),
            quantity: 1,
            unitPrice: invoiceData.total || invoiceData.subtotal || 0,
            taxBreakdown: invoiceData.taxBreakdown,
            category: 'Office Supplies',
            categoryReason: 'Consolidated invoice total'
          }];

      let transferredCount = 0;
      
      for (let idx = 0; idx < itemsToTransfer.length; idx++) {
        const item = itemsToTransfer[idx];
        const itemAmount = item.amount || 0;
        const catDetails = getAICategory(item.description || "Line Item", item.category, item.categoryReason);

        const payload = {
          id: `exp_inv_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
          date: invoiceData.date || new Date().toISOString().split('T')[0],
          category: catDetails.category || 'Office Supplies',
          description: `${invoiceData.vendorName || 'Facture'} - ${item.description || 'Item'}`,
          amount: itemAmount,
          deductibleAmount: itemAmount,
          notes: `Élément ${idx + 1}/${itemsToTransfer.length} audité de la facture #${invoiceData.invoiceNumber || 'INV'}. Qty: ${item.quantity || 1}, Prix unitaire: ${item.unitPrice || itemAmount} $. Taxes: ${JSON.stringify(item.taxBreakdown || {})}.`,
          employeeId: empId,
          employeeName: empName,
          employeeEmail: empEmail,
          source: 'invoice_audit',
          sourceId: invoiceData.invoiceNumber || 'INV-AUDIT',
          sourceLineId: String(idx + 1),
          taxBreakdown: item.taxBreakdown || invoiceData.taxBreakdown || {},
          status: 'pending_approval'
        };

        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          transferredCount++;
        }
      }

      if (transferredCount === 0) {
        throw new Error('Aucun élément n\'a pu être transféré.');
      }

      setTransferSuccessMessage(`${transferredCount} note(s) de frais issue(s) de la facture #${invoiceData.invoiceNumber || ''} ont été créées avec succès au nom de ${empName} ! Statut : En attente d'approbation.`);

      setTimeout(() => {
        if (onNavigateToExpenses) {
          onNavigateToExpenses();
        } else {
          window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: 'expenses' }));
        }
      }, 2000);

    } catch (err: any) {
      alert(err.message || 'Erreur lors du transfert');
    } finally {
      setIsPassingToExpenses(false);
    }
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileView = windowWidth < 576;

  const normalizeTaxNumber = (raw: string | null | undefined): string | null => {
    if (!raw) return null;
    const clean = String(raw).replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return clean.length > 0 ? clean : null;
  };

  const verifyTaxIdentifiers = async (gstNumber: string | null, qstNumber: string | null) => {
    if (activeVerificationController.current) {
      activeVerificationController.current.abort();
    }

    const controller = new AbortController();
    activeVerificationController.current = controller;

    setTaxValidation({
      gstStatus: gstNumber ? 'VERIFYING' : 'IDLE',
      qstStatus: qstNumber ? 'VERIFYING' : 'IDLE'
    });

    try {
      const response = await fetch('/api/tax/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ gstNumber, qstNumber }),
      });

      if (!response.ok) throw new Error('Tax validation failed');

      const result = await response.json();
      console.log('[Tax Verification Result]', result);

      setTaxValidation(result);

      setInvoiceData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          vendorTaxNumbers: {
            ...prev.vendorTaxNumbers,
            gstHst: gstNumber || prev.vendorTaxNumbers?.gstHst || null,
            qst: qstNumber || prev.vendorTaxNumbers?.qst || null,
            validation_results: {
              ...(prev.vendorTaxNumbers?.validation_results || {}),
              ...(result.validation_results || {
                ...(result.gstDetails ? { GST: result.gstDetails } : {}),
                ...(result.qstDetails ? { QST: result.qstDetails } : {})
              })
            }
          }
        };
      });
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'The user aborted a request.') {
        console.log('[Tax Verification Aborted] Stale request cancelled.');
      } else {
        console.error('[Tax Verification Error]', err);
        setTaxValidation({ gstStatus: 'ERROR', qstStatus: 'ERROR' });
      }
    } finally {
      if (activeVerificationController.current === controller) {
        activeVerificationController.current = null;
      }
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    e.preventDefault();

    if (activeVerificationController.current) {
      activeVerificationController.current.abort();
      activeVerificationController.current = null;
    }

    setErrorMessage(null);
    setAppState('PROCESSING');
    setProgressStep(0);
    setTaxValidation({ gstStatus: 'IDLE', qstStatus: 'IDLE' });
    
    let file: File | null = null;
    if ('dataTransfer' in e) {
      file = e.dataTransfer.files[0];
    } else if (e.target.files) {
      file = e.target.files[0];
    }
    
    if (!file) {
      setAppState('IDLE');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const progressInterval = setInterval(() => {
      setProgressStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 2000);

    try {
      const response = await fetch('/api/v1/extract', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgressStep(4);

      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      let resData: any = null;

      if (!isJson) {
        console.error(`[API Error] Received non-JSON response from /api/v1/extract. Status: ${response.status}`);
        resData = {
          error: "Invalid Response Format",
          details: `The server returned an HTML error page or unexpected format (HTTP ${response.status}).`
        };
        throw new Error(resData.details);
      } else {
        const rawText = await response.text();
        try {
          const cleanedText = cleanJsonResponse(rawText);
          resData = JSON.parse(cleanedText);
        } catch (e) {
          try {
            resData = safeParseJson(rawText, {} as any);
          } catch (cleanErr) {
            console.error(`[API Error] Failed to parse JSON from /api/v1/extract. Status: ${response.status}`);
            resData = {
              error: "JSON Parsing Error",
              details: "The server returned an invalid JSON payload."
            };
            throw new Error(resData.details);
          }
        }
      }

      if (!response.ok) {
        const errorDetail = resData?.details || resData?.error || resData?.message || `HTTP ${response.status}`;
        console.error(`[API Error] Extraction failed with status ${response.status}: ${errorDetail}`);
        throw new Error(`Extraction failed: ${errorDetail}`);
      }

      const dataPayload = resData?.data || resData;
      let currentData: any = dataPayload;

      if (typeof currentData === 'string') {
        currentData = safeParseJson<ParsedInvoice>(currentData, {} as any);
      }
      
      try {
        currentData = validateInvoice(currentData);
      } catch (validationErr: any) {
        console.error("Zod validation warnings:", validationErr);
      }

      setInvoiceData(currentData);
      setAppState('DASHBOARD');
      setProgressStep(0);

      const gstNumber = normalizeTaxNumber(currentData?.vendorTaxNumbers?.gstHst);
      const qstNumber = normalizeTaxNumber(currentData?.vendorTaxNumbers?.qst);
      if (gstNumber || qstNumber) {
        verifyTaxIdentifiers(gstNumber, qstNumber);
      }

      if (currentData.enrichmentStatus === 'pending' && currentData.jobId) {
        const pollInterval = setInterval(async () => {
          try {
            const pollRes = await fetch(`/api/v1/jobs/${currentData.jobId}`);
            if (pollRes.ok) {
              const updatedJob = await pollRes.json();
              if (updatedJob.enrichmentStatus !== 'pending') {
                clearInterval(pollInterval);
                try {
                  const validated = validateInvoice(updatedJob);
                  setInvoiceData(validated);
                  const newGst = normalizeTaxNumber(validated?.vendorTaxNumbers?.gstHst);
                  const newQst = normalizeTaxNumber(validated?.vendorTaxNumbers?.qst);
                  if (newGst !== gstNumber || newQst !== qstNumber) {
                     verifyTaxIdentifiers(newGst, newQst);
                  }
                } catch (e) {
                  setInvoiceData(updatedJob);
                }
              }
            }
          } catch(e) {
            console.error("Polling error", e);
          }
        }, 2500);
      }

    } catch (err: any) {
      clearInterval(progressInterval);
      console.error("Extraction error:", err);
      setErrorMessage(err.message || "Pipeline failed to process document.");
      setAppState('IDLE');
      setProgressStep(0);
    }
  };

  const loadDemoData = async () => {
    if (activeVerificationController.current) {
      activeVerificationController.current.abort();
      activeVerificationController.current = null;
    }

    const gstNumber = normalizeTaxNumber(SAMPLE_INVOICE.vendorTaxNumbers?.gstHst);
    const qstNumber = normalizeTaxNumber(SAMPLE_INVOICE.vendorTaxNumbers?.qst);

    console.log('[Tax ID Extracted]', { gstNumber, qstNumber });

    setInvoiceData(SAMPLE_INVOICE);
    setAppState('DASHBOARD');

    if (gstNumber || qstNumber) {
      verifyTaxIdentifiers(gstNumber, qstNumber);
    }
  };

  const resetToUpload = () => {
    if (appState === 'DASHBOARD' || invoiceData) {
      const confirmed = window.confirm('Are you sure you want to start a new upload? Current audit results will be lost.');
      if (!confirmed) return;
    }
    if (activeVerificationController.current) {
      activeVerificationController.current.abort();
      activeVerificationController.current = null;
    }
    setAppState('IDLE');
    setInvoiceData(null);
    setTaxValidation({ gstStatus: 'IDLE', qstStatus: 'IDLE' });
    setErrorMessage(null);
  };

  const triggerExport = async (format: string) => {
    if (!invoiceData) return;
    const invNum = invoiceData.invoiceNumber || 'invoice';
    const apiUrl = `/api/v1/invoices/${encodeURIComponent(invNum)}/export?format=${format}`;
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      if (!response.ok) {
        throw new Error(`Export failed with HTTP status ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `ApplechAI_export_${invNum}.${format === 'csv-summary' || format === 'csv-items' ? 'csv' : format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export error:", err);
      setErrorMessage(err.message || "Failed to export invoice data.");
    }
    
    setExportMenuOpen(false);
  };

  // ==========================================================================
  // RENDER: UPLOAD & PROCESSING
  // ==========================================================================
  if (appState === 'IDLE' || appState === 'PROCESSING') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-0 sm:p-2 md:p-8 font-sans text-gray-900" style={{ paddingTop: '0px', paddingBottom: '0px' }}>
        <div className="max-w-2xl sm:max-w-3xl w-full bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl p-2 sm:p-0 md:p-12 border border-gray-100 transition-all">
          <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {isFr ? 'Extraction de factures' : 'Invoice Extraction'}
            </span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentLang('fr')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  currentLang === 'fr' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => setCurrentLang('en')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  currentLang === 'en' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">{t('appTitle')}</h1>
            <p className="text-sm sm:text-base text-gray-500 mt-2 font-medium">{t('appSubtitle')}</p>
          </div>

          {errorMessage && (
            <div className="mb-6 sm:mb-8 p-4 sm:p-5 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3.5 text-red-800 text-sm shadow-2xs">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold">{t('processingIssue')}</p>
                <p className="text-red-700 mt-0.5 break-words text-xs sm:text-sm">{errorMessage}</p>
              </div>
              <button 
                onClick={() => setErrorMessage(null)} 
                className="text-red-400 hover:text-red-600 font-bold text-xs px-2 py-1 rounded-lg hover:bg-red-100/50 transition-colors shrink-0"
              >
                {t('dismiss')}
              </button>
            </div>
          )}

          {appState === 'IDLE' ? (
            <div className="space-y-6">
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleUpload}
                className="border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-2xl p-8 sm:p-14 md:p-16 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100/80 transition-all cursor-pointer group shadow-2xs"
              >
                <div className="p-4 sm:p-5 bg-white rounded-2xl shadow-sm group-hover:shadow group-hover:scale-105 mb-4 sm:mb-5 transition-all">
                  <UploadCloud className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600" />
                </div>
                <p className="text-gray-800 font-semibold text-lg sm:text-xl text-center">{t('dragDropTitle')}</p>
                <p className="text-gray-400 text-xs sm:text-sm mt-1 mb-6 text-center font-medium">{t('dragDropSubtitle')}</p>
                
                <label className="bg-blue-600 hover:bg-blue-700 text-white px-7 sm:px-8 py-3 rounded-xl font-bold text-sm sm:text-base cursor-pointer transition-all shadow-md hover:shadow-lg active:scale-95 inline-flex items-center">
                  <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
                  {t('selectFile')}
                  <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleUpload} />
                </label>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={loadDemoData}
                  className="inline-flex items-center text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition-all py-3 px-5 sm:px-6 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-2xs hover:shadow-xs active:scale-98"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
                  {t('loadSample')}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-6 sm:py-10 space-y-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">{t('processingDocument')}</span>
                <span className="text-sm font-bold text-gray-600 font-mono bg-gray-100 px-2.5 py-1 rounded-md">{progressStep * 25}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-8 overflow-hidden p-0.5 border border-gray-200">
                <div 
                  className="bg-blue-600 h-2 sm:h-2.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progressStep * 25}%` }}
                ></div>
              </div>

              <div className="space-y-4 pt-2">
                {[
                  { step: 1, label: t('step1') },
                  { step: 2, label: t('step2') },
                  { step: 3, label: t('step3') },
                  { step: 4, label: t('step4') }
                ].map((item) => (
                  <div key={item.step} className="flex items-center text-sm sm:text-base font-semibold p-3.5 bg-gray-50 rounded-xl border border-gray-100/80">
                    {progressStep >= item.step ? (
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 mr-3.5 shrink-0" />
                    ) : progressStep === item.step - 1 ? (
                      <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mr-3.5 shrink-0 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-300 mr-3.5 shrink-0" />
                    )}
                    <span className={progressStep >= item.step ? "text-gray-900 font-bold" : "text-gray-400 font-medium"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER: DASHBOARD VIEW
  // ==========================================================================
  if (!invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow border border-gray-200 text-center max-w-md">
          <p className="text-gray-600 mb-6 text-base font-medium">{t('noDataAvailable')}</p>
          <button onClick={resetToUpload} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md">
            {t('uploadDocument')}
          </button>
        </div>
      </div>
    );
  }

  const itemsList = invoiceData.items || [];
  const taxBreakdownObj = invoiceData.taxBreakdown || {};

  return (
    <div className="w-full min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8 font-sans text-slate-900 flex flex-col gap-0" style={{ paddingLeft: '5px', paddingRight: '5px', paddingTop: '0px', paddingBottom: '0px' }}>
      {/* Transfer Notification Toast */}
      <AnimatePresence>
        {transferSuccessMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-5xl mx-auto w-full bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-sm sm:text-base text-emerald-900 flex items-center justify-between shadow-2xs"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 shrink-0" />
              <span className="font-bold">{transferSuccessMessage}</span>
            </div>
            <span className="text-xs uppercase font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-lg shrink-0">
              {t('redirectingToExpenses')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Wrapper */}
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-0">
        
        {/* Header & Metadata Stack */}
        <header className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between">
              <button 
                onClick={resetToUpload}
                className="inline-flex items-center text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('newUpload')}
              </button>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentLang('fr')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    currentLang === 'fr' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  FR
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentLang('en')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    currentLang === 'en' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {invoiceData.vendorName || (isFr ? "Facture extraite" : "Extracted Invoice")}
                </h1>
                <span className="inline-flex items-center self-start px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  {t('auditedAndVerified')}
                </span>
              </div>

              {(invoiceData.vendorClassification?.business_type || invoiceData.vendorClassification?.main_product) && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {invoiceData.vendorClassification?.business_type && (
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-semibold border border-blue-100">
                      {invoiceData.vendorClassification.business_type}
                    </span>
                  )}
                  {invoiceData.vendorClassification?.main_product && (
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                      {invoiceData.vendorClassification.main_product}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Vertical Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('invoiceNumber')}</span>
              <span className="font-semibold text-slate-800 font-mono">{invoiceData.invoiceNumber || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('poNumber')}</span>
              <span className="font-semibold text-slate-800 font-mono">{invoiceData.poNumber || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('invoiceDate')}</span>
              <span className="font-semibold text-slate-800">{invoiceData.date || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('dueDate')}</span>
              <span className="font-semibold text-amber-700">{invoiceData.dueDate || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('terms')}</span>
              <span className="font-semibold text-slate-800">{invoiceData.paymentTerms || 'N/A'}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('region')}</span>
              <span className="font-semibold text-slate-800">{invoiceData.province ? `${invoiceData.province} (${t('supply')})` : 'Canada'}</span>
            </div>
            {(invoiceData.customerName || invoiceData.vendorAddress) && (
              <div className="flex flex-col gap-1 col-span-2 md:col-span-3 pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('billedTo')}</span>
                <span className="font-semibold text-slate-800">
                  {invoiceData.customerName || 'N/A'}
                  {invoiceData.customerAddress && <span className="font-normal text-slate-500 text-xs ml-2">• {invoiceData.customerAddress}</span>}
                </span>
              </div>
            )}
          </div>
        </header>

        {invoiceData.summary && (
          <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 sm:p-6 text-sm text-blue-900 flex items-start gap-3 shadow-2xs">
            <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-950 text-xs uppercase tracking-wider mb-0.5">{t('auditSummary')}</p>
              <p className="text-blue-800 leading-relaxed">{invoiceData.summary}</p>
            </div>
          </div>
        )}

        {/* Two Column Layout for Desktop, Stacked for Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" style={{ paddingTop: '10px', paddingBottom: '10px' }}>
          
          {/* Compliance Guard */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3">{t('complianceGuardStatus')}</h2>
            <div className="flex flex-col gap-3">
              {/* GST / HST Registration */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">{t('craGstHstRegistration')}</span>
                <span className="font-mono text-sm font-bold text-slate-800">
                  {invoiceData.vendorTaxNumbers?.gstHst || (invoiceData.vendorTaxNumbers?.businessNumber ? `${invoiceData.vendorTaxNumbers.businessNumber} RT0001` : t('notDetected'))}
                </span>
                <AnimatePresence mode="wait">
                  {taxValidation.gstStatus === 'VERIFYING' ? (
                    <motion.div 
                      key="audit-gst-verifying"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md self-start"
                    >
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 text-blue-600 animate-spin shrink-0" />
                      <span>{t('verifyingGst')}</span>
                    </motion.div>
                  ) : (invoiceData.vendorTaxNumbers?.validation_results?.GST?.status === 'VALID' || taxValidation.gstStatus === 'VALID') ? (
                    <motion.div 
                      key="audit-gst-valid"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md self-start"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                      <span>{t('validGst')}</span>
                    </motion.div>
                  ) : (invoiceData.vendorTaxNumbers?.validation_results?.GST?.status === 'INVALID' || taxValidation.gstStatus === 'INVALID') ? (
                    <motion.div 
                      key="audit-gst-invalid"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md self-start"
                    >
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-red-600 shrink-0" />
                      <span>{t('invalidGst')}</span>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="audit-gst-extracted"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md self-start"
                    >
                      <Info className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0" />
                      <span>{invoiceData.vendorTaxNumbers?.gstHst ? t('extractedGst') : t('noGstOnDoc')}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* QST Registration */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">{t('rqQstRegistration')}</span>
                <span className="font-mono text-sm font-bold text-slate-800">
                  {invoiceData.vendorTaxNumbers?.qst || t('notDetected')}
                </span>
                <AnimatePresence mode="wait">
                  {taxValidation.qstStatus === 'VERIFYING' ? (
                    <motion.div 
                      key="audit-qst-verifying"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md self-start"
                    >
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 text-blue-600 animate-spin shrink-0" />
                      <span>{t('verifyingQst')}</span>
                    </motion.div>
                  ) : (invoiceData.vendorTaxNumbers?.validation_results?.QST?.status === 'VALID' || taxValidation.qstStatus === 'VALID') ? (
                    <motion.div 
                      key="audit-qst-valid"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md self-start"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-emerald-600 shrink-0" />
                      <span>{t('validQst')}</span>
                    </motion.div>
                  ) : (invoiceData.vendorTaxNumbers?.validation_results?.QST?.status === 'INVALID' || taxValidation.qstStatus === 'INVALID') ? (
                    <motion.div 
                      key="audit-qst-invalid"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md self-start"
                    >
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-red-600 shrink-0" />
                      <span>{t('invalidQst')}</span>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="audit-qst-extracted"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md self-start"
                    >
                      <Info className="w-3.5 h-3.5 mr-1.5 text-amber-600 shrink-0" />
                      <span>{invoiceData.vendorTaxNumbers?.qst ? t('extractedQst') : t('noQstOnDoc')}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Financial Ledger */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-3">{t('financialLedger')}</h2>
            <div className="flex flex-col gap-3 mt-1 text-sm">
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>{t('subtotal')}</span>
                <span className="font-bold text-slate-900 font-mono">${invoiceData.subtotal != null ? invoiceData.subtotal.toFixed(2) : '0.00'}</span>
              </div>

              {/* Extra fee line items if present */}
              {[
                { label: t('shippingFee'), val: invoiceData.shipping },
                { label: t('freightCharge'), val: invoiceData.freight },
                { label: t('deliveryFee'), val: invoiceData.delivery },
                { label: t('handlingFee'), val: invoiceData.handling },
                { label: t('recyclingFee'), val: invoiceData.recycleFee },
                { label: t('fuelSurcharge'), val: invoiceData.fuelSurcharge },
                { label: t('additionalSurcharge'), val: invoiceData.surcharge },
                { label: t('depositFee'), val: invoiceData.deposit },
                { label: t('containerFee'), val: invoiceData.containerFee },
                { label: t('environmentalFee'), val: invoiceData.environmentalFee },
                { label: t('serviceFee'), val: invoiceData.serviceFee }
              ].filter(c => c.val != null && c.val > 0).map((c, idx) => (
                <div key={idx} className="flex justify-between text-xs text-slate-500 pl-2">
                  <span>+ {c.label}</span>
                  <span className="font-semibold text-slate-700 font-mono">${c.val!.toFixed(2)}</span>
                </div>
              ))}

              <div className="flex justify-between items-center text-slate-600 font-medium pb-3 border-b border-slate-100">
                <span>{t('totalTax')}</span>
                <span className="font-bold text-slate-900 font-mono">${invoiceData.tax != null ? invoiceData.tax.toFixed(2) : '0.00'}</span>
              </div>

              {/* Tax split breakdown */}
              {(Object.entries(taxBreakdownObj) as [string, number | null | undefined][])
                .filter(([_, v]) => typeof v === 'number' && v > 0)
                .map(([type, val]) => (
                  <div key={type} className="flex justify-between text-xs text-slate-400 pl-2 italic font-mono">
                    <span className="uppercase">{type} ({t('component')})</span>
                    <span>${val!.toFixed(2)}</span>
                  </div>
              ))}

              <div className="flex justify-between items-end pt-2">
                <span className="text-base font-bold text-slate-800">{t('total')} ({invoiceData.currency || 'CAD'})</span>
                <span className="text-2xl font-extrabold text-slate-900 font-mono">
                  ${invoiceData.total != null ? invoiceData.total.toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Item Ledger (Vertically Stacked Cards) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">{t('lineItems')}</h2>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-md">
                {itemsList.length}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">{t('autoCategorized')}</span>
          </div>
          
          <div className="flex flex-col divide-y divide-slate-100">
            {itemsList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                {t('noLineItems')}
              </div>
            ) : (
              itemsList.map((item, idx) => {
                const catDetails = getAICategory(item.description || "Line Item", item.category, item.categoryReason, currentLang);
                return (
                  <div key={idx} className="p-5 flex flex-col gap-3.5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col gap-2">
                      <p className="font-bold text-slate-900 text-sm leading-snug break-words">
                        {item.description || (isFr ? 'Ligne de facture' : 'Line Item')}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.taxabilityGroup && (
                          <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                            item.taxabilityGroup === 'Exempt' 
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : item.taxabilityGroup === 'Zero-Rated'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {item.taxabilityGroup === 'Exempt' ? t('exempt') : item.taxabilityGroup === 'Zero-Rated' ? t('zeroRated') : t('taxable')}
                          </span>
                        )}
                        <span className="inline-flex items-center text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-100" title={catDetails.reason}>
                          <Folder className="w-3 h-3 mr-1 text-blue-600 shrink-0" />
                          {catDetails.category}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Qty, Unit Price, Amount */}
                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400">{t('qty')}</span>
                        <span className="font-mono text-sm font-semibold text-slate-700">
                          {item.quantity != null ? item.quantity : 1}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400">{t('unitPrice')}</span>
                        <span className="font-mono text-sm font-semibold text-slate-700">
                          ${item.unitPrice != null ? item.unitPrice.toFixed(2) : '0.00'}
                        </span>
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400">{t('amount')}</span>
                        <span className="font-mono text-base font-bold text-slate-900">
                          ${item.amount != null ? item.amount.toFixed(2) : '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Workflow Area (Stacked at bottom) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-end gap-4 mt-2">
          {/* Employee Selector */}
          <div className="flex flex-col gap-1.5 flex-1">
            <label htmlFor="assignee" className="text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
              {t('assignTo')}
            </label>
            <select 
              id="assignee" 
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            >
              {employeesList.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Direct Transfer to Expense Tab */}
          <button 
            onClick={handleTransferInvoiceToExpenses}
            disabled={isPassingToExpenses}
            className="flex-1 sm:flex-none flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
            title={isFr ? "Transférer les résultats de cet audit vers l'onglet Dépenses pour approbation et remboursement" : "Transfer audit results to the Expenses tab for approval and reimbursement"}
          >
            <Receipt className="w-4 h-4 mr-2 shrink-0" />
            <span>{isPassingToExpenses ? t('transferring') : t('transferToExpenses')}</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative flex-1 sm:flex-none">
            <button 
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="w-full flex items-center justify-center bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4 mr-2 shrink-0" />
              <span>{t('export')}</span>
              <ChevronDown className="w-4 h-4 ml-1.5 shrink-0" />
            </button>

            {exportMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-30">
                <button onClick={() => triggerExport('json')} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center transition-colors">
                  <FileText className="w-4 h-4 mr-3 text-slate-400" /> {t('jsonPayload')}
                </button>
                <button onClick={() => triggerExport('csv-summary')} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center transition-colors">
                  <FileSpreadsheet className="w-4 h-4 mr-3 text-slate-400" /> {t('csvSummary')}
                </button>
                <button onClick={() => triggerExport('csv-items')} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center transition-colors">
                  <FileSpreadsheet className="w-4 h-4 mr-3 text-slate-400" /> {t('csvLineItems')}
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button onClick={() => triggerExport('iif')} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center transition-colors">
                  <FileText className="w-4 h-4 mr-3 text-emerald-600" /> {t('quickbooksIif')}
                </button>
                <button onClick={() => triggerExport('xml')} className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center transition-colors">
                  <FileText className="w-4 h-4 mr-3 text-blue-600" /> {t('enterpriseXml')}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ApplechAIInvoiceApp({ 
  language = 'fr', 
  user, 
  onNavigateToExpenses 
}: { 
  language?: string; 
  user?: any; 
  onNavigateToExpenses?: () => void; 
} = {}) {
  return (
    <ApplechAIInvoiceDashboard 
      language={language} 
      user={user} 
      onNavigateToExpenses={onNavigateToExpenses} 
    />
  );
}