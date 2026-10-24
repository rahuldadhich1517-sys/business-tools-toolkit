export interface InvoiceParty {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  taxId?: string; // VAT / GST / EIN
}

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number; // fixed discount amount or percentage
  discountType?: 'fixed' | 'percentage';
  taxRate?: number; // percentage (e.g. 10 for 10%)
}

export interface CalculatedInvoiceItem extends InvoiceItemInput {
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export interface InvoiceDiscount {
  value: number;
  type: 'fixed' | 'percentage';
}

export interface InvoiceTotals {
  subtotal: number;
  itemDiscountsTotal: number;
  invoiceDiscountTotal: number;
  taxableAmount: number;
  taxTotal: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  currency: string;
  items: CalculatedInvoiceItem[];
}

export interface InvoiceInput {
  invoiceNumber: string;
  seller: InvoiceParty;
  customer: InvoiceParty;
  issueDate: string;
  dueDate: string;
  currency?: string;
  items: InvoiceItemInput[];
  invoiceDiscount?: InvoiceDiscount;
  taxRate?: number; // global tax rate if line items don't have individual tax rates
  notes?: string;
  paymentInstructions?: string;
  purchaseOrderNumber?: string;
  amountPaid?: number;
  footer?: string;
}

export interface InvoicePdfOptions {
  pageSize?: [number, number];
  primaryColor?: { r: number; g: number; b: number };
}
