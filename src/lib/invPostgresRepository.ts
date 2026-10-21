import { db } from "../db/index";
import { invVendors, invCustomers, invInvoices, invInvoiceItems } from "../db/schema";

export async function insertInvoiceWithDrizzle(invoiceData: any, userId?: string) {
  return await db.transaction(async (tx) => {
    // 1. Insert Vendor
    let vendorId: number;
    const vendorRes = await tx.insert(invVendors).values({
      userId: userId || null,
      name: invoiceData?.vendorName || null,
      address: invoiceData?.vendorAddress || null,
      businessNumber: invoiceData?.vendorTaxNumbers?.businessNumber || null,
      gstHstNumber: invoiceData?.vendorTaxNumbers?.gstHst || null,
      qstNumber: invoiceData?.vendorTaxNumbers?.qst || null,
      pstNumber: invoiceData?.vendorTaxNumbers?.pst || null,
      rstNumber: invoiceData?.vendorTaxNumbers?.rst || null,
      businessType: invoiceData?.vendorClassification?.business_type || null,
      mainProduct: invoiceData?.vendorClassification?.main_product || null,
      productExamples: invoiceData?.vendorClassification?.examples || null,
    }).returning({ id: invVendors.id });

    vendorId = vendorRes[0].id;

    // 2. Insert Customer
    let customerId: number;
    const customerRes = await tx.insert(invCustomers).values({
      userId: userId || null,
      name: invoiceData?.customerName || null,
      address: invoiceData?.customerAddress || null,
    }).returning({ id: invCustomers.id });

    customerId = customerRes[0].id;

    // 3. Insert Invoice
    const taxBreakdown = invoiceData?.taxBreakdown || {};
    let parsedDate = null;
    if (invoiceData?.date) {
      try { parsedDate = new Date(invoiceData.date).toISOString().split('T')[0]; } catch(e) {}
    }
    let parsedDueDate = null;
    if (invoiceData?.dueDate) {
      try { parsedDueDate = new Date(invoiceData.dueDate).toISOString().split('T')[0]; } catch(e) {}
    }

    const invoiceRes = await tx.insert(invInvoices).values({
      userId: userId || null,
      vendorId,
      customerId,
      invoiceNumber: invoiceData?.invoiceNumber || null,
      poNumber: invoiceData?.poNumber || null,
      invoiceDate: parsedDate,
      dueDate: parsedDueDate,
      language: invoiceData?.language || "en",
      currency: invoiceData?.currency || "CAD",
      paymentTerms: invoiceData?.paymentTerms || null,
      subtotal: String(invoiceData?.subtotal || 0),
      zeroRatedSubtotal: String(invoiceData?.zeroRatedSubtotal || 0),
      exemptSubtotal: String(invoiceData?.exemptSubtotal || 0),
      shipping: String(invoiceData?.shipping || 0),
      freight: String(invoiceData?.freight || 0),
      delivery: String(invoiceData?.delivery || 0),
      handling: String(invoiceData?.handling || 0),
      recycleFee: String(invoiceData?.recycleFee || 0),
      fuelSurcharge: String(invoiceData?.fuelSurcharge || 0),
      surcharge: String(invoiceData?.surcharge || 0),
      deposit: String(invoiceData?.deposit || 0),
      containerFee: String(invoiceData?.containerFee || 0),
      environmentalFee: String(invoiceData?.environmentalFee || 0),
      serviceFee: String(invoiceData?.serviceFee || 0),
      taxTotal: String(invoiceData?.tax || 0),
      totalAmount: String(invoiceData?.total || 0),
      taxGst: String(taxBreakdown?.gst || 0),
      taxPst: String(taxBreakdown?.pst || 0),
      taxHst: String(taxBreakdown?.hst || 0),
      taxQst: String(taxBreakdown?.qst || 0),
      taxRst: String(taxBreakdown?.rst || 0),
      province: invoiceData?.province || null,
      taxGroup: invoiceData?.taxGroup || null,
      summary: invoiceData?.summary || null,
    }).returning({ id: invInvoices.id });

    const invoiceId = invoiceRes[0].id;

    // 4. Insert Invoice Items
    const items = Array.isArray(invoiceData?.items) ? invoiceData.items : [];
    if (items.length > 0) {
      const itemsToInsert = items.map((item: any) => {
        const itemTaxBreakdown = item?.taxBreakdown || {};
        return {
          userId: userId || null,
          invoiceId,
          description: item?.description || "Line Item",
          quantity: String(item?.quantity || 1),
          unitPrice: String(item?.unitPrice || 0),
          amount: String(item?.amount || 0),
          tax: String(item?.tax || 0),
          taxRate: String(item?.taxRate || 0),
          isTaxExempt: Boolean(item?.isTaxExempt),
          taxabilityGroup: item?.taxabilityGroup || "Taxable",
          taxGst: String(itemTaxBreakdown?.gst || 0),
          taxPst: String(itemTaxBreakdown?.pst || 0),
          taxHst: String(itemTaxBreakdown?.hst || 0),
          taxQst: String(itemTaxBreakdown?.qst || 0),
          taxRst: String(itemTaxBreakdown?.rst || 0),
          category: item?.category || null,
          categoryReason: item?.categoryReason || null,
        };
      });

      await tx.insert(invInvoiceItems).values(itemsToInsert);
    }

    return { success: true, vendorId, customerId, invoiceId, itemCount: items.length };
  });
}
