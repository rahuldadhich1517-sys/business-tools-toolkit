import { getCurrencyDecimals, roundMoney } from '../shared/currency';
import { ValidationError } from '../shared/errors';
import { validateDate, validateNumber, validateRequired, validateString } from '../shared/validation';
import type {
  CalculatedInvoiceItem,
  InvoiceInput,
  InvoiceTotals,
} from './types';

export function calculateInvoiceTotals(invoice: InvoiceInput): InvoiceTotals {
  validateRequired(invoice, 'InvoiceInput');
  validateString(invoice.invoiceNumber, 'invoiceNumber');
  validateRequired(invoice.seller, 'seller');
  validateString(invoice.seller.name, 'seller.name');
  validateRequired(invoice.customer, 'customer');
  validateString(invoice.customer.name, 'customer.name');
  validateDate(invoice.issueDate, 'issueDate');
  validateDate(invoice.dueDate, 'dueDate');

  if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
    throw new ValidationError('Invoice must contain at least one line item', { field: 'items' });
  }

  const currency = (invoice.currency ?? 'USD').toUpperCase().trim();
  const decimals = getCurrencyDecimals(currency);

  let grossSubtotal = 0;
  let lineDiscountsTotal = 0;
  let lineTaxesTotal = 0;
  let hasLineSpecificTax = false;

  const calculatedItems: CalculatedInvoiceItem[] = [];

  for (let idx = 0; idx < invoice.items.length; idx++) {
    const item = invoice.items[idx]!;
    const desc = validateString(item.description, `items[${idx}].description`);
    const qty = validateNumber(item.quantity, `items[${idx}].quantity`, { min: 0.0001 });
    const unitPrice = validateNumber(item.unitPrice, `items[${idx}].unitPrice`, { min: 0, allowZero: true });

    const gross = roundMoney(qty * unitPrice, decimals);
    grossSubtotal += gross;

    // Line Discount
    let discountAmt = 0;
    if (item.discount !== undefined) {
      validateNumber(item.discount, `items[${idx}].discount`, { min: 0, allowZero: true });
      if (item.discountType === 'percentage') {
        if (item.discount > 100) {
          throw new ValidationError(`items[${idx}].discount percentage cannot exceed 100%`);
        }
        discountAmt = roundMoney(gross * (item.discount / 100), decimals);
      } else {
        discountAmt = roundMoney(Math.min(item.discount, gross), decimals);
      }
    }
    lineDiscountsTotal += discountAmt;

    const net = roundMoney(Math.max(0, gross - discountAmt), decimals);

    // Line Tax
    let taxAmt = 0;
    const effectiveTaxRate = item.taxRate !== undefined ? item.taxRate : invoice.taxRate;
    if (effectiveTaxRate !== undefined) {
      validateNumber(effectiveTaxRate, `taxRate for item ${idx}`, { min: 0, max: 100, allowZero: true });
      if (item.taxRate !== undefined) {
        hasLineSpecificTax = true;
      }
      taxAmt = roundMoney(net * (effectiveTaxRate / 100), decimals);
    }
    lineTaxesTotal += taxAmt;

    const itemTotal = roundMoney(net + taxAmt, decimals);

    calculatedItems.push({
      ...item,
      description: desc,
      quantity: qty,
      unitPrice,
      grossAmount: gross,
      discountAmount: discountAmt,
      netAmount: net,
      taxAmount: taxAmt,
      totalAmount: itemTotal,
    });
  }

  // Invoice-level Discount
  let invoiceDiscountTotal = 0;
  if (invoice.invoiceDiscount) {
    const invDisc = invoice.invoiceDiscount;
    validateNumber(invDisc.value, 'invoiceDiscount.value', { min: 0, allowZero: true });
    const baseForInvoiceDisc = Math.max(0, grossSubtotal - lineDiscountsTotal);
    if (invDisc.type === 'percentage') {
      if (invDisc.value > 100) {
        throw new ValidationError('invoiceDiscount percentage cannot exceed 100%');
      }
      invoiceDiscountTotal = roundMoney(baseForInvoiceDisc * (invDisc.value / 100), decimals);
    } else {
      invoiceDiscountTotal = roundMoney(Math.min(invDisc.value, baseForInvoiceDisc), decimals);
    }
  }

  const taxableAmount = roundMoney(
    Math.max(0, grossSubtotal - lineDiscountsTotal - invoiceDiscountTotal),
    decimals
  );

  // If there's an invoice-level global tax and no line-specific taxes were set
  let finalTaxTotal = 0;
  if (!hasLineSpecificTax && invoice.taxRate !== undefined && invoice.taxRate > 0) {
    validateNumber(invoice.taxRate, 'taxRate', { min: 0, max: 100, allowZero: true });
    finalTaxTotal = roundMoney(taxableAmount * (invoice.taxRate / 100), decimals);
  } else {
    // If invoice discount is present alongside line taxes, proportionally scale tax down
    if (invoiceDiscountTotal > 0 && grossSubtotal - lineDiscountsTotal > 0) {
      const ratio = taxableAmount / (grossSubtotal - lineDiscountsTotal);
      finalTaxTotal = roundMoney(lineTaxesTotal * ratio, decimals);
    } else {
      finalTaxTotal = roundMoney(lineTaxesTotal, decimals);
    }
  }

  const total = roundMoney(taxableAmount + finalTaxTotal, decimals);

  const amountPaid = invoice.amountPaid !== undefined
    ? roundMoney(validateNumber(invoice.amountPaid, 'amountPaid', { min: 0, allowZero: true }), decimals)
    : 0;

  const balanceDue = roundMoney(Math.max(0, total - amountPaid), decimals);

  return {
    subtotal: roundMoney(grossSubtotal, decimals),
    itemDiscountsTotal: roundMoney(lineDiscountsTotal, decimals),
    invoiceDiscountTotal,
    taxableAmount,
    taxTotal: finalTaxTotal,
    total,
    amountPaid,
    balanceDue,
    currency,
    items: calculatedItems,
  };
}
