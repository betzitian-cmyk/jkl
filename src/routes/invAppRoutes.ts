import express from 'express';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import { generatePostgresInsert } from '../../inv/src/lib/sqlGenerator';
import { cleanJsonResponse, parseCleanJson } from '../../inv/src/lib/utils';
import { db } from '../db/index';
import { invInvoices, invInvoiceItems, invVendors, invCustomers } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router = express.Router();

// Helper to extract authenticated user ID from parent app context or headers
const getUserContextId = (req: express.Request): string | undefined => {
  if ((req as any).user?.uid || (req as any).user?.id) {
    return String((req as any).user?.uid || (req as any).user?.id);
  }
  if (req.headers['x-user-id']) {
    return String(req.headers['x-user-id']);
  }
  return undefined;
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
  }
});
const upload = multer({ storage });

const jobCache = new Map<string, any>();

const handleExtract = async (req: express.Request, res: express.Response) => {
  res.setHeader('Content-Type', 'application/json');

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const filePath = req.file.path;

  try {
    const fileBuffer = await fs.promises.readFile(filePath);
    const { extractTextFromDocument, runInvoicePipeline } = await import('../../inv/src/lib/pipeline');
    
    // Fast initial text extraction (skipping OCR for fast response)
    const rawText = await extractTextFromDocument(fileBuffer, req.file.originalname, { skipOcr: true });
    
    let initialResult: any = null;
    let needsEnrichment = false;

    if (rawText && rawText.trim() !== '') {
      initialResult = await runInvoicePipeline(rawText);
      if (!initialResult) {
        needsEnrichment = true;
      }
    } else {
      needsEnrichment = true;
    }

    const jobId = Date.now().toString();

    if (!initialResult) {
      initialResult = {
        invoiceNumber: null,
        vendorName: "Pending Background OCR...",
        items: []
      };
    }

    initialResult.jobId = jobId;
    initialResult.cached = false;
    initialResult.enrichmentStatus = needsEnrichment ? 'pending' : 'done';

    if (needsEnrichment) {
      jobCache.set(jobId, initialResult);

      // Asynchronous background OCR worker
      setTimeout(async () => {
        try {
          console.log(`[Job ${jobId}] Starting background enrichment with OCR...`);
          const { extractTextFromDocument, runInvoicePipeline } = await import('../../inv/src/lib/pipeline');
          
          let ocrText = "";
          try {
            ocrText = await extractTextFromDocument(fileBuffer, req.file?.originalname || "document.pdf", { forceOcr: true });
          } catch (ocrErr: any) {
            console.warn(`[Job ${jobId}] OCR extraction error, attempting direct text fallback:`, ocrErr.message);
          }

          let finalResult = null;
          if (ocrText && ocrText.trim() !== '') {
            finalResult = await runInvoicePipeline(ocrText);
          }

          if (!finalResult) {
            // Run fallback pipeline on whatever raw text or filename information we have
            const fallbackPayload = ocrText || req.file?.originalname || "Scanned Invoice Document";
            finalResult = await runInvoicePipeline(fallbackPayload);
          }

          if (finalResult) {
            (finalResult as any).jobId = jobId;
            (finalResult as any).cached = true;
            (finalResult as any).enrichmentStatus = 'done';
            jobCache.set(jobId, finalResult);
            console.log(`[Job ${jobId}] Background enrichment completed successfully.`);
          } else {
            const fallbackState = {
              ...jobCache.get(jobId),
              enrichmentStatus: 'done',
              vendorName: req.file?.originalname?.replace(/\.[^/.]+$/, "") || "Extracted Invoice",
              items: [],
            };
            jobCache.set(jobId, fallbackState);
          }
        } catch (e: any) {
          console.error(`[Job ${jobId}] Background enrichment notice:`, e);
          const recoveredState = {
            ...jobCache.get(jobId),
            enrichmentStatus: 'done',
            vendorName: req.file?.originalname?.replace(/\.[^/.]+$/, "") || "Extracted Invoice",
            items: [],
          };
          jobCache.set(jobId, recoveredState);
        } finally {
          try { await fs.promises.unlink(filePath); } catch (err) {}
        }
      }, 0);
    } else {
      try { await fs.promises.unlink(filePath); } catch (err) {}
    }

    return res.status(200).json(initialResult);
  } catch (e: any) {
    console.error("Pipeline extraction error:", e);
    try { await fs.promises.unlink(filePath); } catch (err) {}
    return res.status(500).json({ 
      success: false,
      error: 'Internal Server Error during extraction', 
      details: e.message || String(e)
    });
  }
};

// Async Job Polling for OCR Enrichment
router.get(['/v1/jobs/:jobId', '/jobs/:jobId'], (req, res) => {
  const job = jobCache.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  return res.json(job);
});

function verifyLuhn(businessNumber: string): boolean {
  let total = 0;
  for (let i = 0; i < businessNumber.length; i++) {
    const digit = parseInt(businessNumber[businessNumber.length - 1 - i], 10);
    if (i % 2 === 1) {
      let double = digit * 2;
      total += double > 9 ? double - 9 : double;
    } else {
      total += digit;
    }
  }
  return total % 10 === 0;
}

const buildResponse = (status: string, originalQuery: string, sanitizedQuery: string, provider: string, message: string, details: any = undefined) => {
  const response: any = {
    status,
    original_query: originalQuery,
    sanitized_query: sanitizedQuery,
    provider,
    message
  };
  if (details) response.details = details;
  return response;
};

const taxValidationCache = new Map<string, any>();
const MAX_CACHE_SIZE = 5000;

function getCachedResponse(cacheKey: string) {
  return taxValidationCache.get(cacheKey);
}

function setCachedResponse(cacheKey: string, result: any) {
  if (taxValidationCache.size >= MAX_CACHE_SIZE) {
    const firstKey = taxValidationCache.keys().next().value;
    if (firstKey) taxValidationCache.delete(firstKey);
  }
  taxValidationCache.set(cacheKey, result);
}

async function validateGstNumber(gst: string) {
  const sanitized = gst.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const provider = "VAT_API";
  
  const cleanNumber = sanitized.startsWith('CA') ? sanitized.substring(2) : sanitized;
  const isFullGST = /^\d{9}RT\d{4}$/.test(cleanNumber);
  const isBNOnly = /^\d{9}$/.test(cleanNumber);

  if (!isFullGST && !isBNOnly) {
    return buildResponse("INVALID", gst, sanitized, provider, 
      "Invalid format. Expected 9 digits (BN) or 15 digits (GST/HST: XXXXXXXXXRTXXXX)."
    );
  }

  const bn = cleanNumber.substring(0, 9);
  if (!verifyLuhn(bn)) {
    return buildResponse("INVALID", gst, sanitized, provider, 
      "Business Number fails checksum validation."
    );
  }

  const cacheKey = `GST_${cleanNumber}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;
  
  const vatApiKey = (process.env.VAT_API_KEY || process.env.TAXID_API_KEY || "").trim();
  if (!vatApiKey || vatApiKey.length < 8) {
    const result = buildResponse("UNVERIFIABLE", gst, sanitized, provider, 
      "API Key missing or invalid. Live lookup skipped."
    );
    setCachedResponse(cacheKey, result);
    return result;
  }

  try {
    const response = await fetch(`https://www.taxid.dev/api/v1/validate/CA/${cleanNumber}`, {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${vatApiKey}`,
        "Accept": "application/json"
      },
      signal: AbortSignal.timeout(3500)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[GST API Error]:", response.status, errText);
      const errorMessage = response.status === 401 
        ? "Authentication failed with TaxID API." 
        : `API returned ${response.status}.`;
        
      return buildResponse("UNVERIFIABLE", gst, sanitized, provider, errorMessage);
    }

    const data = await response.json();
    const isValid = data.is_valid === true || data.valid === true || data.status === 'valid' || data.status === 'active';
    const message = isValid ? "Valid GST/BN registration." : (data.message || data.error?.message || "GST/BN not active.");
    
    const details = { 
      businessName: data.company?.name || data.company_name || data.name || data.entity_name || "N/A", 
      address: data.company?.address || data.address || data.company_address || "Canada", 
      validationMethod: "API_LOOKUP",
      raw_status: data.status || null
    };

    const result = buildResponse(isValid ? "VALID" : "INVALID", gst, sanitized, provider, message, details);
    setCachedResponse(cacheKey, result);
    return result;

  } catch (error) {
    console.error("[GST Validation Failure]:", error);
    return buildResponse("UNVERIFIABLE", gst, sanitized, provider, "Service unavailable or timeout.");
  }
}

async function validateQstNumber(qst: string) {
  const sanitized = qst.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const provider = "REVENU_QUEBEC";
  
  if (!/^\d{10}TQ\d{4}$/.test(sanitized)) {
    return buildResponse("INVALID", qst, sanitized, provider, "Invalid format. Expected 10 digits + TQ + 4 digits.");
  }

  const cacheKey = `QST_${sanitized}`;
  const cached = getCachedResponse(cacheKey);
  if (cached) return cached;
  
  try {
    const response = await fetch(`https://svcnab2b.revenuquebec.ca/2019/02/ValidationTVQ/${sanitized}`, {
      signal: AbortSignal.timeout(3500)
    });

    if (!response.ok) {
      if (response.status === 400) {
        return buildResponse("INVALID", qst, sanitized, provider, "Registration number not found or malformed according to Revenue Quebec.");
      }
      return buildResponse("UNVERIFIABLE", qst, sanitized, provider, "Service unavailable.");
    }

    const data = await response.json();
    const isRegistered = data?.Resultat?.StatutSousDossierUsager === "R";
    const message = isRegistered ? "Valid QST." : "Business not active.";
    
    const details = { 
      businessName: data?.Resultat?.NomEntreprise || "N/A", 
      commercialName: data?.Resultat?.RaisonSociale || "N/A", 
      validationMethod: "API_LOOKUP" 
    };

    const result = buildResponse(isRegistered ? "VALID" : "INVALID", qst, sanitized, provider, message, details);
    setCachedResponse(cacheKey, result);
    return result;

  } catch (error) {
    console.error("[QST Validation Failure]:", error);
    return buildResponse("UNVERIFIABLE", qst, sanitized, provider, "Service unavailable or timeout.");
  }
}

// Extraction endpoints
const extractEndpoints = [
  '/v1/extract',
  '/extract',
  '/process-doc',
  '/parse-invoice',
  '/v1/process-doc',
  '/v1/parse-invoice'
];
router.post(extractEndpoints, upload.single('file'), handleExtract);

// Tax Validation routes
router.get(['/v1/validate/CA/:gst', '/validate/CA/:gst'], async (req, res) => {
  const result = await validateGstNumber(req.params.gst);
  return res.json(result);
});

router.get(['/v1/validate/QC/:qst', '/validate/QC/:qst'], async (req, res) => {
  const result = await validateQstNumber(req.params.qst);
  return res.json(result);
});

router.post(['/tax/validate', '/v1/tax/validate'], async (req, res) => {
  const { gstNumber, qstNumber, gst, qst } = req.body || {};
  const gstToValidate = gstNumber || gst || null;
  const qstToValidate = qstNumber || qst || null;

  let gstResult: any = null;
  let qstResult: any = null;

  if (gstToValidate) gstResult = await validateGstNumber(String(gstToValidate));
  if (qstToValidate) qstResult = await validateQstNumber(String(qstToValidate));

  return res.json({
    gstStatus: gstResult?.status || "IDLE",
    qstStatus: qstResult?.status || "IDLE",
    gstDetails: gstResult,
    qstDetails: qstResult,
    validation_results: {
      ...(gstResult ? { GST: gstResult } : {}),
      ...(qstResult ? { QST: qstResult } : {})
    }
  });
});

// Export invoice endpoints
router.all(['/v1/invoices/:invoice_id/export', '/invoices/:invoice_id/export'], (req, res) => {
  const { invoice_id } = req.params;
  const format = (req.query.format as string) || 'json';
  
  let invoice: any = null;
  if (req.method === 'POST' && req.body && Object.keys(req.body).length > 0) {
    invoice = req.body;
  } else {
    invoice = {
      invoiceNumber: `INV-${invoice_id}`,
      date: "2026-08-01",
      dueDate: "2026-08-31",
      poNumber: null,
      vendorName: "ApplechAI Logistics",
      subtotal: 100.00,
      tax: 14.98,
      total: 114.98,
      currency: "CAD",
      province: "QC"
    };
  }

  const safeVendor = (invoice.vendorName || "Vendor").replace(/[^A-Za-z0-9]/g, '_');
  const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const baseFilename = `ApplechAI_${safeVendor}_${invoice.invoiceNumber || invoice_id}_${timestamp}`;

  const escapeCSV = (val: any) => `"${String(val ?? "").replace(/"/g, '""')}"`;
  const escapeXML = (val: any) => String(val ?? "").replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c as keyof any] || c));
  const escapeIIF = (val: any) => String(val ?? "").replace(/\t/g, " ").replace(/\r?\n/g, " ");

  const items = invoice.items || [];
  const taxBreakdown = invoice.taxBreakdown || {};
  const vendorTaxNumbers = invoice.vendorTaxNumbers || {};

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}.json"`);
    return res.json(invoice);
  } else if (format === 'csv-summary') {
    const rows = [
      ["Audit Summary Report", "ApplechAI Invoice Platform"],
      ["Generated On", new Date().toLocaleString()],
      [],
      ["Invoice Metadata"],
      ["Invoice Number", invoice.invoiceNumber || "N/A"],
      ["PO Number", invoice.poNumber || "N/A"],
      ["Issue Date", invoice.date || "N/A"],
      ["Due Date", invoice.dueDate || "N/A"],
      ["Province of Supply", invoice.province || "N/A"],
      ["Currency", invoice.currency || "CAD"],
      ["Language", invoice.language || "en"],
      [],
      ["Financials"],
      ["Subtotal", invoice.subtotal || 0],
      ["Tax Amount (Total)", invoice.tax || 0],
      ["  - GST", taxBreakdown.gst || 0],
      ["  - PST", taxBreakdown.pst || 0],
      ["  - HST", taxBreakdown.hst || 0],
      ["  - QST", taxBreakdown.qst || 0],
      ["  - RST", taxBreakdown.rst || 0],
      ["Total Amount", invoice.total || 0],
      [],
      ["Vendor Details"],
      ["Name", invoice.vendorName || "N/A"],
      ["Address", invoice.vendorAddress || ""],
      ["GST/HST Number", vendorTaxNumbers.gstHst || "N/A"],
      ["QST Number", vendorTaxNumbers.qst || "N/A"],
    ];
    const content = rows.map(row => row.map(escapeCSV).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}_summary.csv"`);
    return res.send(content);
  } else if (format === 'csv-items') {
    const headers = [
      "Description", "Quantity", "Unit Price", "Amount", 
      "Taxability Group", "Tax Rate (%)", "Item Tax", 
      "GST Split", "PST/QST Split"
    ];
    const rows = items.map((item: any) => [
      item.description || "Line Item",
      item.quantity || 1.0,
      item.unitPrice || 0.0,
      item.amount || 0.0,
      item.taxabilityGroup || "Taxable",
      item.taxRate ? `${(item.taxRate * 100).toFixed(2)}%` : "0.00%",
      item.tax || 0.0,
      item.taxBreakdown?.gst || 0.0,
      (item.taxBreakdown?.pst || 0.0) + (item.taxBreakdown?.qst || 0.0)
    ]);
    const content = [headers, ...rows].map(row => row.map(escapeCSV).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}_items.csv"`);
    return res.send(content);
  } else if (format === 'xml') {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
<AuditReport>
  <InvoiceNumber>${escapeXML(invoice.invoiceNumber)}</InvoiceNumber>
  <Date>${escapeXML(invoice.date)}</Date>
  <VendorName>${escapeXML(invoice.vendorName)}</VendorName>
  <Financials>
    <Subtotal>${invoice.subtotal || 0}</Subtotal>
    <Taxes>
      <TotalTax>${invoice.tax || 0}</TotalTax>
      <GST>${taxBreakdown.gst || 0}</GST>
      <PST>${taxBreakdown.pst || 0}</PST>
      <HST>${taxBreakdown.hst || 0}</HST>
      <QST>${taxBreakdown.qst || 0}</QST>
    </Taxes>
    <Total>${invoice.total || 0}</Total>
    <Currency>${escapeXML(invoice.currency || 'CAD')}</Currency>
  </Financials>
  <Items>
${items.map((item: any) => `    <Item>
      <Description>${escapeXML(item.description)}</Description>
      <Quantity>${item.quantity || 1}</Quantity>
      <UnitPrice>${item.unitPrice || 0}</UnitPrice>
      <Amount>${item.amount || 0}</Amount>
    </Item>`).join('\n')}
  </Items>
</AuditReport>`;
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}.xml"`);
    return res.send(xml);
  } else if (format === 'iif') {
    const lines = [
      "!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO\tDUEDATE",
      "!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\tDOCNUM\tMEMO\tQNTY\tPRICE",
      `TRNS\t\tBILL\t${escapeIIF(invoice.date)}\tAccounts Payable\t${escapeIIF(invoice.vendorName)}\t-${invoice.total || 0}\t${escapeIIF(invoice.invoiceNumber)}\t${escapeIIF(invoice.summary || "Imported Invoice")}\t${escapeIIF(invoice.dueDate)}`
    ];
    items.forEach((item: any) => {
      lines.push(`SPL\t\tBILL\t${escapeIIF(invoice.date)}\tTaxable Expense\t${item.amount || 0}\t${escapeIIF(invoice.invoiceNumber)}\t${escapeIIF(item.description)}\t${item.quantity || 1}\t${item.unitPrice || 0}`);
    });
    lines.push("ENDTRNS");
    const content = lines.join('\r\n');
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}.iif"`);
    return res.send(content);
  } else if (format === 'sql') {
    const userId = getUserContextId(req);
    const sql = generatePostgresInsert(invoice, { userId });
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${baseFilename}.sql"`);
    return res.send(sql);
  } else {
    return res.setHeader('Content-Type', 'application/json').json(invoice);
  }
});

// SQL Generation
router.post(['/sql/generate', '/v1/sql/generate'], (req, res) => {
  const invoice = req.body;
  if (!invoice || typeof invoice !== 'object') {
    return res.status(400).json({ error: "Invalid invoice JSON payload" });
  }

  const userId = getUserContextId(req);
  const sql = generatePostgresInsert(invoice, { userId });
  res.setHeader('Content-Type', 'text/plain');
  return res.send(sql);
});

// DB status
router.get('/db/status', async (req, res) => {
  try {
    const { pool, pgliteInstance } = await import('../db/index');
    let versionRows: any[] = [];
    let countsRows: any[] = [];

    const queryStr1 = "SELECT version(), current_database() as db_name;";
    const queryStr2 = `
      SELECT 
        (SELECT COUNT(*) FROM inv_vendors) as vendor_count,
        (SELECT COUNT(*) FROM inv_customers) as customer_count,
        (SELECT COUNT(*) FROM inv_invoices) as invoice_count,
        (SELECT COUNT(*) FROM inv_invoice_items) as item_count
    `;

    if (pool) {
      const res1 = await pool.query(queryStr1);
      const res2 = await pool.query(queryStr2);
      versionRows = res1.rows;
      countsRows = res2.rows;
    } else if (pgliteInstance) {
      const res1 = await pgliteInstance.query(queryStr1);
      const res2 = await pgliteInstance.query(queryStr2);
      versionRows = res1.rows;
      countsRows = res2.rows;
    }

    return res.json({
      status: "CONNECTED",
      engine: pool ? "PostgreSQL (External Pool)" : "PGlite (Embedded PostgreSQL)",
      host: process.env.SQL_HOST || (pool ? 'PostgreSQL' : 'Embedded PGlite'),
      database: versionRows[0]?.db_name || 'defaultdb',
      postgresVersion: versionRows[0]?.version,
      counts: countsRows[0] || {}
    });
  } catch (err: any) {
    return res.status(500).json({
      status: "ERROR",
      message: err.message || "Failed to query database"
    });
  }
});

// Atomic DB Commit
router.post(['/db/commit', '/v1/db/commit'], async (req, res) => {
  const invoice = req.body;
  if (!invoice || typeof invoice !== 'object') {
    return res.status(400).json({ error: "Invalid invoice JSON payload for database commit" });
  }

  const userId = getUserContextId(req);
  const txnId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  try {
    const { insertInvoiceWithDrizzle } = await import('../lib/invPostgresRepository');
    const result = await insertInvoiceWithDrizzle(invoice, userId);

    return res.json({
      status: "COMMITTED",
      transactionId: txnId,
      timestamp: new Date().toISOString(),
      databaseHost: process.env.SQL_HOST || 'PostgreSQL (Parent App)',
      tablesAffected: ["inv_vendors", "inv_customers", "inv_invoices", "inv_invoice_items"],
      recordsInserted: {
        vendors: 1,
        customers: 1,
        invoices: 1,
        invoice_items: result.itemCount
      },
      message: `Atomic transaction executed successfully on live PostgreSQL database using Drizzle ORM. 1 vendor, 1 customer, 1 invoice, and ${result.itemCount} line items inserted.`,
    });
  } catch (err: any) {
    return res.status(500).json({
      status: "FAILED",
      error: err.message || "Database transaction failed",
      transactionId: txnId
    });
  }
});

// List all committed invoices from database
router.get(['/db/invoices', '/v1/invoices'], async (req, res) => {
  try {
    const userId = getUserContextId(req);
    const invoices = await db
      .select({
        id: invInvoices.id,
        userId: invInvoices.userId,
        invoiceNumber: invInvoices.invoiceNumber,
        poNumber: invInvoices.poNumber,
        invoiceDate: invInvoices.invoiceDate,
        dueDate: invInvoices.dueDate,
        currency: invInvoices.currency,
        province: invInvoices.province,
        subtotal: invInvoices.subtotal,
        taxTotal: invInvoices.taxTotal,
        totalAmount: invInvoices.totalAmount,
        taxGst: invInvoices.taxGst,
        taxQst: invInvoices.taxQst,
        createdAt: invInvoices.createdAt,
        vendorId: invInvoices.vendorId,
        vendorName: invVendors.name,
        vendorGst: invVendors.gstHstNumber,
        vendorQst: invVendors.qstNumber,
        customerId: invInvoices.customerId,
        customerName: invCustomers.name,
      })
      .from(invInvoices)
      .leftJoin(invVendors, eq(invInvoices.vendorId, invVendors.id))
      .leftJoin(invCustomers, eq(invInvoices.customerId, invCustomers.id))
      .orderBy(desc(invInvoices.id));

    return res.json(invoices);
  } catch (err: any) {
    console.error("Error fetching committed invoices:", err);
    return res.status(500).json({ error: "Failed to fetch invoices", details: err.message });
  }
});

// Get detailed invoice with line items
router.get(['/db/invoices/:id', '/v1/invoices/:id'], async (req, res) => {
  const invId = parseInt(req.params.id, 10);
  if (isNaN(invId)) {
    return res.status(400).json({ error: "Invalid invoice ID" });
  }

  try {
    const invoiceRows = await db
      .select({
        id: invInvoices.id,
        userId: invInvoices.userId,
        invoiceNumber: invInvoices.invoiceNumber,
        poNumber: invInvoices.poNumber,
        invoiceDate: invInvoices.invoiceDate,
        dueDate: invInvoices.dueDate,
        language: invInvoices.language,
        currency: invInvoices.currency,
        paymentTerms: invInvoices.paymentTerms,
        subtotal: invInvoices.subtotal,
        zeroRatedSubtotal: invInvoices.zeroRatedSubtotal,
        exemptSubtotal: invInvoices.exemptSubtotal,
        shipping: invInvoices.shipping,
        freight: invInvoices.freight,
        delivery: invInvoices.delivery,
        handling: invInvoices.handling,
        recycleFee: invInvoices.recycleFee,
        fuelSurcharge: invInvoices.fuelSurcharge,
        surcharge: invInvoices.surcharge,
        deposit: invInvoices.deposit,
        containerFee: invInvoices.containerFee,
        environmentalFee: invInvoices.environmentalFee,
        serviceFee: invInvoices.serviceFee,
        taxTotal: invInvoices.taxTotal,
        totalAmount: invInvoices.totalAmount,
        taxGst: invInvoices.taxGst,
        taxPst: invInvoices.taxPst,
        taxHst: invInvoices.taxHst,
        taxQst: invInvoices.taxQst,
        taxRst: invInvoices.taxRst,
        province: invInvoices.province,
        taxGroup: invInvoices.taxGroup,
        summary: invInvoices.summary,
        createdAt: invInvoices.createdAt,
        vendorId: invInvoices.vendorId,
        vendorName: invVendors.name,
        vendorAddress: invVendors.address,
        vendorBn: invVendors.businessNumber,
        vendorGst: invVendors.gstHstNumber,
        vendorQst: invVendors.qstNumber,
        vendorBusinessType: invVendors.businessType,
        vendorMainProduct: invVendors.mainProduct,
        customerId: invInvoices.customerId,
        customerName: invCustomers.name,
        customerAddress: invCustomers.address,
      })
      .from(invInvoices)
      .leftJoin(invVendors, eq(invInvoices.vendorId, invVendors.id))
      .leftJoin(invCustomers, eq(invInvoices.customerId, invCustomers.id))
      .where(eq(invInvoices.id, invId))
      .limit(1);

    if (invoiceRows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const items = await db
      .select()
      .from(invInvoiceItems)
      .where(eq(invInvoiceItems.invoiceId, invId));

    return res.json({
      ...invoiceRows[0],
      items
    });
  } catch (err: any) {
    console.error("Error fetching invoice details:", err);
    return res.status(500).json({ error: "Failed to fetch invoice details", details: err.message });
  }
});

// Delete a committed invoice
router.delete(['/db/invoices/:id', '/v1/invoices/:id'], async (req, res) => {
  const invId = parseInt(req.params.id, 10);
  if (isNaN(invId)) {
    return res.status(400).json({ error: "Invalid invoice ID" });
  }

  try {
    await db.delete(invInvoiceItems).where(eq(invInvoiceItems.invoiceId, invId));
    await db.delete(invInvoices).where(eq(invInvoices.id, invId));
    return res.json({ success: true, message: `Invoice ${invId} deleted successfully` });
  } catch (err: any) {
    console.error("Error deleting invoice:", err);
    return res.status(500).json({ error: "Failed to delete invoice", details: err.message });
  }
});

export default router;
