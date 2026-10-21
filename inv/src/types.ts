import { z } from 'zod';

export const TaxBreakdownSchema = z.object({
  gst: z.number().nullable().optional().default(null),
  pst: z.number().nullable().optional().default(null),
  hst: z.number().nullable().optional().default(null),
  qst: z.number().nullable().optional().default(null),
  rst: z.number().nullable().optional().default(null),
});

export const LineItemSchema = z.object({
  description: z.string().default("Line Item"),
  quantity: z.number().nullable().optional().default(null),
  unitPrice: z.number().nullable().optional().default(null),
  amount: z.number().nullable().optional().default(null),
  taxabilityGroup: z.string().nullable().optional().default(null),
  taxRate: z.number().nullable().optional().default(null),
  tax: z.number().nullable().optional().default(null),
  taxBreakdown: TaxBreakdownSchema.nullable().optional().default(null),
  category: z.string().nullable().optional().default(null),
  categoryReason: z.string().nullable().optional().default(null),
});

export const VendorTaxNumbersSchema = z.object({
  businessNumber: z.string().nullable().optional().default(null),
  gstHst: z.string().nullable().optional().default(null),
  qst: z.string().nullable().optional().default(null),
  pst: z.string().nullable().optional().default(null),
  rst: z.string().nullable().optional().default(null),
  validation_results: z.record(
    z.string(),
    z.object({
      status: z.string(),
      message: z.string(),
      details: z.any().optional(),
    })
  ).nullable().optional().default(null),
});

export const ParsedInvoiceSchema = z.object({
  invoiceNumber: z.string().nullable().optional().default(null),
  poNumber: z.string().nullable().optional().default(null),
  date: z.string().nullable().optional().default(null),
  dueDate: z.string().nullable().optional().default(null),
  paymentTerms: z.string().nullable().optional().default(null),
  vendorName: z.string().nullable().optional().default(null),
  vendorAddress: z.string().nullable().optional().default(null),
  customerName: z.string().nullable().optional().default(null),
  customerAddress: z.string().nullable().optional().default(null),
  subtotal: z.number().nullable().optional().default(null),
  zeroRatedSubtotal: z.number().nullable().optional().default(null),
  exemptSubtotal: z.number().nullable().optional().default(null),
  shipping: z.number().nullable().optional().default(null),
  freight: z.number().nullable().optional().default(null),
  delivery: z.number().nullable().optional().default(null),
  handling: z.number().nullable().optional().default(null),
  recycleFee: z.number().nullable().optional().default(null),
  fuelSurcharge: z.number().nullable().optional().default(null),
  surcharge: z.number().nullable().optional().default(null),
  deposit: z.number().nullable().optional().default(null),
  containerFee: z.number().nullable().optional().default(null),
  environmentalFee: z.number().nullable().optional().default(null),
  serviceFee: z.number().nullable().optional().default(null),
  tax: z.number().nullable().optional().default(null),
  total: z.number().nullable().optional().default(null),
  currency: z.string().nullable().optional().default(null),
  province: z.string().nullable().optional().default(null),
  taxGroup: z.string().nullable().optional().default(null),
  taxBreakdown: TaxBreakdownSchema.nullable().optional().default(null),
  vendorTaxNumbers: VendorTaxNumbersSchema.nullable().optional().default(null),
  items: z.array(LineItemSchema).nullable().optional().default(null),
  summary: z.string().nullable().optional().default(null),
  vendorClassification: z.any().nullable().optional().default(null),
});

export type TaxBreakdown = z.infer<typeof TaxBreakdownSchema>;
export type LineItem = z.infer<typeof LineItemSchema>;
export type ParsedInvoice = z.infer<typeof ParsedInvoiceSchema>;

const roundCurrency = (val: number | null | undefined): number | null => {
  if (val === null || val === undefined) return null;
  return Number(val.toFixed(2));
};

export function validateInvoice(data: any): ParsedInvoice {
  // Use safeParse to avoid hard crashes if something unexpected comes from AI
  let parsed: ParsedInvoice;
  const result = ParsedInvoiceSchema.safeParse(data);
  if (!result.success) {
    console.warn("Zod validation warnings (using raw data fallback for invalid fields):", result.error);
    // Best-effort safe object construction without throwing ZodError
    const raw = (typeof data === 'object' && data !== null) ? data : {};
    parsed = {
      invoiceNumber: raw.invoiceNumber ? String(raw.invoiceNumber) : null,
      poNumber: raw.poNumber ? String(raw.poNumber) : null,
      date: raw.date ? String(raw.date) : null,
      dueDate: raw.dueDate ? String(raw.dueDate) : null,
      paymentTerms: raw.paymentTerms ? String(raw.paymentTerms) : null,
      vendorName: raw.vendorName ? String(raw.vendorName) : (raw.vendor || 'Unknown Vendor'),
      vendorAddress: raw.vendorAddress ? String(raw.vendorAddress) : null,
      customerName: raw.customerName ? String(raw.customerName) : null,
      customerAddress: raw.customerAddress ? String(raw.customerAddress) : null,
      subtotal: typeof raw.subtotal === 'number' ? raw.subtotal : (parseFloat(raw.subtotal) || null),
      zeroRatedSubtotal: null,
      exemptSubtotal: null,
      shipping: typeof raw.shipping === 'number' ? raw.shipping : null,
      freight: null,
      delivery: null,
      handling: null,
      recycleFee: null,
      fuelSurcharge: null,
      surcharge: null,
      deposit: null,
      containerFee: null,
      environmentalFee: null,
      serviceFee: null,
      tax: typeof raw.tax === 'number' ? raw.tax : (parseFloat(raw.tax) || null),
      total: typeof raw.total === 'number' ? raw.total : (parseFloat(raw.total) || null),
      currency: raw.currency ? String(raw.currency) : 'CAD',
      province: raw.province ? String(raw.province) : 'QC',
      taxGroup: raw.taxGroup ? String(raw.taxGroup) : null,
      taxBreakdown: raw.taxBreakdown || { gst: null, pst: null, hst: null, qst: null, rst: null },
      vendorTaxNumbers: raw.vendorTaxNumbers || null,
      items: Array.isArray(raw.items) ? raw.items : [],
      summary: raw.summary ? String(raw.summary) : null,
      vendorClassification: raw.vendorClassification || null,
    };
  } else {
    parsed = result.data;
  }

  // Ensure numeric precision for currency fields
  const numericFields = [
    'subtotal', 'zeroRatedSubtotal', 'exemptSubtotal', 'shipping', 'freight',
    'delivery', 'handling', 'recycleFee', 'fuelSurcharge', 'surcharge', 
    'deposit', 'containerFee', 'environmentalFee', 'serviceFee', 'tax', 'total'
  ] as const;

  for (const field of numericFields) {
    if (parsed[field] !== null && parsed[field] !== undefined) {
      parsed[field] = roundCurrency(parsed[field] as number);
    }
  }

  // Handle null defaults for tax breakdowns
  if (!parsed.taxBreakdown) {
    parsed.taxBreakdown = { gst: null, pst: null, hst: null, qst: null, rst: null };
  } else {
    parsed.taxBreakdown.gst = roundCurrency(parsed.taxBreakdown.gst);
    parsed.taxBreakdown.pst = roundCurrency(parsed.taxBreakdown.pst);
    parsed.taxBreakdown.hst = roundCurrency(parsed.taxBreakdown.hst);
    parsed.taxBreakdown.qst = roundCurrency(parsed.taxBreakdown.qst);
    parsed.taxBreakdown.rst = roundCurrency(parsed.taxBreakdown.rst);
  }

  if (parsed.items) {
    parsed.items = parsed.items.map((item: any) => {
      let taxBreakdown = item.taxBreakdown;
      if (!taxBreakdown) {
        taxBreakdown = { gst: null, pst: null, hst: null, qst: null, rst: null };
      } else {
        taxBreakdown.gst = roundCurrency(taxBreakdown.gst);
        taxBreakdown.pst = roundCurrency(taxBreakdown.pst);
        taxBreakdown.hst = roundCurrency(taxBreakdown.hst);
        taxBreakdown.qst = roundCurrency(taxBreakdown.qst);
        taxBreakdown.rst = roundCurrency(taxBreakdown.rst);
      }
      return {
        ...item,
        quantity: item.quantity !== null && item.quantity !== undefined ? Number(item.quantity) : null,
        unitPrice: roundCurrency(item.unitPrice),
        amount: roundCurrency(item.amount),
        taxRate: item.taxRate !== null && item.taxRate !== undefined ? Number(item.taxRate) : null,
        tax: roundCurrency(item.tax),
        taxBreakdown
      };
    });
  }

  return parsed;
}
