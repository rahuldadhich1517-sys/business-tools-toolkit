import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { calculateInvoiceTotals, generateInvoicePdf } from '../src/invoice-generate';
import { ValidationError } from '../src/shared/errors';

describe('Invoice Generator & PDF Export', () => {
  const baseInvoice = {
    invoiceNumber: 'INV-2026-001',
    issueDate: '2026-10-24',
    dueDate: '2026-11-24',
    currency: 'USD',
    seller: {
      name: 'Alpha Software LLC',
      address: '100 Market St, San Francisco, CA',
      email: 'billing@alphasoft.example',
      taxId: 'US-987654321',
    },
    customer: {
      name: 'Beta Global Industries',
      address: '500 5th Ave, New York, NY',
      email: 'ap@betaglobal.example',
    },
    items: [
      {
        description: 'Software Consulting - Architecture Phase',
        quantity: 40,
        unitPrice: 150,
      },
      {
        description: 'Cloud Infrastructure Setup & CI/CD',
        quantity: 1,
        unitPrice: 2500,
        discount: 250, // Fixed $250 discount
        taxRate: 10, // 10% tax
      },
    ],
    notes: 'Thank you for your business.',
    paymentInstructions: 'Wire transfer to Chase Bank, Routing 123456789, Acc 987654321.',
  };

  describe('calculateInvoiceTotals (Single Source of Truth)', () => {
    it('calculates totals accurately with line discounts and line taxes', () => {
      const totals = calculateInvoiceTotals(baseInvoice);

      // Item 1: 40 * 150 = 6000
      // Item 2: 1 * 2500 = 2500, discount 250 -> net 2250, tax 10% = 225, total = 2475
      // Gross Subtotal: 6000 + 2500 = 8500
      // Item Discounts: 250
      // Taxable: 8250
      // Tax total: 225
      // Total: 8475
      expect(totals.subtotal).toBe(8500);
      expect(totals.itemDiscountsTotal).toBe(250);
      expect(totals.taxableAmount).toBe(8250);
      expect(totals.taxTotal).toBe(225);
      expect(totals.total).toBe(8475);
      expect(totals.balanceDue).toBe(8475);
    });

    it('calculates invoice-level discount and payments', () => {
      const withDiscountAndPayment = {
        ...baseInvoice,
        invoiceDiscount: { type: 'percentage' as const, value: 10 }, // 10% off
        amountPaid: 2000,
      };

      const totals = calculateInvoiceTotals(withDiscountAndPayment);
      // Subtotal: 8500, item discounts: 250 -> base: 8250
      // 10% invoice discount = 825
      // Taxable = 8250 - 825 = 7425
      expect(totals.invoiceDiscountTotal).toBe(825);
      expect(totals.taxableAmount).toBe(7425);
      expect(totals.amountPaid).toBe(2000);
      expect(totals.balanceDue).toBe(totals.total - 2000);
    });

    it('handles zero tax and negative price validation', () => {
      const zeroTaxInvoice = {
        ...baseInvoice,
        items: [{ description: 'Exempt Service', quantity: 1, unitPrice: 100 }],
        taxRate: 0,
      };
      const totals = calculateInvoiceTotals(zeroTaxInvoice);
      expect(totals.taxTotal).toBe(0);
      expect(totals.total).toBe(100);

      // Negative unit price rejected
      expect(() =>
        calculateInvoiceTotals({
          ...baseInvoice,
          items: [{ description: 'Bad item', quantity: 1, unitPrice: -50 }],
        })
      ).toThrow(ValidationError);
    });

    it('validates required fields', () => {
      expect(() => calculateInvoiceTotals({ ...baseInvoice, invoiceNumber: '' })).toThrow(ValidationError);
      expect(() => calculateInvoiceTotals({ ...baseInvoice, items: [] })).toThrow(ValidationError);
      expect(() => calculateInvoiceTotals({ ...baseInvoice, seller: { name: '' } })).toThrow(ValidationError);
    });
  });

  describe('generateInvoicePdf (Genuine PDF Export)', () => {
    it('generates a valid binary PDF document readable by pdf-lib', async () => {
      const pdfBytes = await generateInvoicePdf(baseInvoice);

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);

      // Verify the PDF bytes can be loaded and parsed
      const loadedDoc = await PDFDocument.load(pdfBytes);
      expect(loadedDoc.getPageCount()).toBeGreaterThanOrEqual(1);
    });

    it('generates multi-page PDF when line items exceed one page', async () => {
      const manyItems = [];
      for (let i = 1; i <= 35; i++) {
        manyItems.push({
          description: `Detailed project milestone #${i}: Includes comprehensive requirements gathering, system architecture, integration tests, and verification.`,
          quantity: i,
          unitPrice: 100 + i * 5,
        });
      }

      const largeInvoice = {
        ...baseInvoice,
        items: manyItems,
      };

      const pdfBytes = await generateInvoicePdf(largeInvoice);
      const loadedDoc = await PDFDocument.load(pdfBytes);
      expect(loadedDoc.getPageCount()).toBeGreaterThan(1);
    });
  });
});
