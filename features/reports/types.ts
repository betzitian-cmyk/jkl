export type ReportType = 'expenses' | 'payroll';

export type ExpenseColumn = 
  | 'date'
  | 'amount'
  | 'taxAmount'
  | 'taxRate'
  | 'description'
  | 'referenceNumber'
  | 'status'
  | 'category'
  | 'vendor'
  | 'paymentMethod'
  | 'deductibleAmount'
  | 'notes'
  | 'employeeName'
  | 'source'
  | 'taxStatus'
  | 'itcGst'
  | 'itrQst'
  | 'approvedBy'
  | 'reimbursementMethod'
  | 'reimbursementRef'
  | 'invoiceNumber'
  | 'poNumber'
  | 'dueDate'
  | 'paymentTerms'
  | 'vendorAddress'
  | 'customerName'
  | 'customerAddress'
  | 'subtotal'
  | 'zeroRatedSubtotal'
  | 'exemptSubtotal'
  | 'shipping'
  | 'freight'
  | 'delivery'
  | 'handling'
  | 'recycleFee'
  | 'fuelSurcharge'
  | 'surcharge'
  | 'deposit'
  | 'containerFee'
  | 'environmentalFee'
  | 'serviceFee'
  | 'tax'
  | 'total'
  | 'currency'
  | 'province'
  | 'taxGroup'
  | 'gst'
  | 'qst'
  | 'pst'
  | 'hst'
  | 'vendorBusinessNumber'
  | 'vendorGstHst'
  | 'vendorQst'
  | 'summary';

export type PayrollColumn = 
  | 'employeeName'
  | 'payPeriod'
  | 'payDate'
  | 'grossPay'
  | 'netPay'
  | 'totalTaxes'
  | 'totalDeductions'
  | 'totalEarnings'
  | 'employerContributions'
  | 'department'
  | 'location'
  | 'checkNumber'
  | 'ytdEarnings'
  | 'ytdWithholding'
  | 'status'
  | 'frequency'
  | 'vacationPay'
  | 'overtimePay'
  | 'bonusPay'
  | 'commissionPay'
  | 'rrspContribution'
  | 'taxableBenefitsFederal'
  | 'taxableBenefitsProvincial'
  | 'federalTax'
  | 'quebecTax'
  | 'qpp'
  | 'qpip'
  | 'ei'
  | 'hsf'
  | 'cnesst'
  | 'employerQPP'
  | 'employerQPIP'
  | 'employerEI'
  | 'employerCNESST'
  | 'totalEmployerCost';

export type FilterOperator = '=' | '!=' | 'IN' | 'NOT IN' | 'CONTAINS' | 'STARTS WITH' | 'BETWEEN' | '>' | '<' | '>=' | '<=';

export interface FilterRule {
  id: string;
  field: string;
  operator: FilterOperator;
  value: any;
  secondValue?: any; // For BETWEEN
}

export type GroupByType = 'none' | string;

export type SortDirection = 'asc' | 'desc';

export interface SortRule {
  field: string;
  direction: SortDirection;
}

export interface ReportConfig {
  type: ReportType;
  title: string;
  columns: string[];
  filters: FilterRule[];
  groupBy: GroupByType;
  sortBy: SortRule[];
}

export interface ExpenseItem {
  id: string;
  date: string;
  amount: number;
  taxAmount?: number;
  taxRate?: number;
  description?: string;
  referenceNumber?: string;
  status?: string; // 'Paid' | 'Open' | 'On Hold' | 'Partial'
  category?: string;
  account?: string;
  vendor?: string;
  paymentMethod?: string;
  deductibleAmount?: number;
  notes?: string;
  employeeName?: string;
  source?: string;
  taxStatus?: string;
  itcGst?: number;
  itrQst?: number;
  approvedBy?: string;
  reimbursementMethod?: string;
  reimbursementRef?: string;
  invoiceNumber?: string;
  poNumber?: string;
  dueDate?: string;
  paymentTerms?: string;
  vendorAddress?: string;
  customerName?: string;
  customerAddress?: string;
  subtotal?: number;
  zeroRatedSubtotal?: number;
  exemptSubtotal?: number;
  shipping?: number;
  freight?: number;
  delivery?: number;
  handling?: number;
  recycleFee?: number;
  fuelSurcharge?: number;
  surcharge?: number;
  deposit?: number;
  containerFee?: number;
  environmentalFee?: number;
  serviceFee?: number;
  tax?: number;
  total?: number;
  currency?: string;
  province?: string;
  taxGroup?: string;
  gst?: number;
  qst?: number;
  pst?: number;
  hst?: number;
  vendorBusinessNumber?: string;
  vendorGstHst?: string;
  vendorQst?: string;
  summary?: string;
  [key: string]: any;
}

export interface PayrollItem {
  id: string;
  employeeName: string;
  payPeriod: string;
  payDate: string;
  grossPay: number;
  netPay: number;
  totalTaxes: number;
  totalDeductions: number;
  totalEarnings: number;
  employerContributions: number;
  department?: string;
  location?: string;
  checkNumber?: string;
  ytdEarnings?: number;
  ytdWithholding?: number;
  status?: string; // 'Paid' | 'Unpaid' | 'Void'
  frequency?: string;
  vacationPay?: number;
  overtimePay?: number;
  bonusPay?: number;
  commissionPay?: number;
  rrspContribution?: number;
  taxableBenefitsFederal?: number;
  taxableBenefitsProvincial?: number;
  federalTax?: number;
  quebecTax?: number;
  qpp?: number;
  qpip?: number;
  ei?: number;
  hsf?: number;
  cnesst?: number;
  employerQPP?: number;
  employerQPIP?: number;
  employerEI?: number;
  employerCNESST?: number;
  totalEmployerCost?: number;
  [key: string]: any;
}
