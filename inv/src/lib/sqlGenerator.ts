export interface SqlGeneratorOptions {
  userId?: string;
  tableNameVendors?: string;
  tableNameCustomers?: string;
  tableNameInvoices?: string;
  tableNameItems?: string;
}

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  return `'${String(val).replace(/'/g, "''")}'`;
}

export function generatePostgresInsert(invoice: any, options: SqlGeneratorOptions = {}): string {
  const userId = options.userId || null;
  const vendorName = invoice?.vendorName || "Unknown Vendor";
  const vendorAddress = invoice?.vendorAddress || null;
  const vtn = invoice?.vendorTaxNumbers || {};
  const items = Array.isArray(invoice?.items) ? invoice.items : [];

  let sql = `-- PostgreSQL Invoice Insert Script\n-- Generated on: ${new Date().toISOString()}\n\nBEGIN;\n\n`;

  sql += `-- 1. Insert Vendor\n`;
  sql += `INSERT INTO inv_vendors (user_id, name, address, business_number, gst_hst_number, qst_number, pst_number, rst_number)\n`;
  sql += `VALUES (${escapeSql(userId)}, ${escapeSql(vendorName)}, ${escapeSql(vendorAddress)}, ${escapeSql(vtn.businessNumber)}, ${escapeSql(vtn.gstHst)}, ${escapeSql(vtn.qst)}, ${escapeSql(vtn.pst)}, ${escapeSql(vtn.rst)});\n\n`;

  sql += `-- 2. Insert Invoice\n`;
  sql += `INSERT INTO inv_invoices (user_id, invoice_number, po_number, invoice_date, due_date, currency, subtotal, tax_total, total_amount, province)\n`;
  sql += `VALUES (${escapeSql(userId)}, ${escapeSql(invoice?.invoiceNumber)}, ${escapeSql(invoice?.poNumber)}, ${escapeSql(invoice?.date)}, ${escapeSql(invoice?.dueDate)}, ${escapeSql(invoice?.currency || 'CAD')}, ${escapeSql(invoice?.subtotal || 0)}, ${escapeSql(invoice?.tax || 0)}, ${escapeSql(invoice?.total || 0)}, ${escapeSql(invoice?.province)});\n\n`;

  if (items.length > 0) {
    sql += `-- 3. Insert Items\n`;
    for (const item of items) {
      sql += `INSERT INTO inv_invoice_items (user_id, description, quantity, unit_price, amount, tax, tax_rate, is_tax_exempt, category)\n`;
      sql += `VALUES (${escapeSql(userId)}, ${escapeSql(item?.description || 'Item')}, ${escapeSql(item?.quantity || 1)}, ${escapeSql(item?.unitPrice || 0)}, ${escapeSql(item?.amount || 0)}, ${escapeSql(item?.tax || 0)}, ${escapeSql(item?.taxRate || 0)}, ${escapeSql(item?.isTaxExempt || false)}, ${escapeSql(item?.category)});\n`;
    }
    sql += `\n`;
  }

  sql += `COMMIT;\n`;
  return sql;
}

