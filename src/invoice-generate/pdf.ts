import { PDFDocument, rgb } from 'pdf-lib';
import { formatCurrency } from '../shared/currency';
import { PdfContext } from '../shared/pdf-utils';
import { calculateInvoiceTotals } from './calculator';
import type { InvoiceInput, InvoicePdfOptions } from './types';

export async function generateInvoicePdf(
  invoice: InvoiceInput,
  options: InvoicePdfOptions = {}
): Promise<Uint8Array> {
  const totals = calculateInvoiceTotals(invoice);

  const doc = await PDFDocument.create();
  const pdfCtx = new PdfContext(doc, { pageSize: options.pageSize });
  await pdfCtx.initFonts();

  const primary = options.primaryColor ?? { r: 0.08, g: 0.38, b: 0.74 }; // #1462bd
  const primaryRgb = rgb(primary.r, primary.g, primary.b);
  const textDark = rgb(0.12, 0.15, 0.18);
  const textMuted = rgb(0.4, 0.45, 0.5);
  const borderGrey = rgb(0.85, 0.88, 0.91);
  const bgLight = rgb(0.96, 0.97, 0.99);

  // 1. Header: "INVOICE" Title and Metadata
  pdfCtx.currentPage.drawText('INVOICE', {
    x: pdfCtx.marginLeft,
    y: pdfCtx.cursorY - 24,
    size: 24,
    font: pdfCtx.fontBold,
    color: primaryRgb,
  });

  // Invoice # and Dates on the right
  const rightX = pdfCtx.pageWidth - pdfCtx.marginRight - 160;
  let metaY = pdfCtx.cursorY - 10;
  const drawMetaLine = (label: string, value: string) => {
    pdfCtx.currentPage.drawText(label, {
      x: rightX,
      y: metaY,
      size: 9,
      font: pdfCtx.fontBold,
      color: textDark,
    });
    pdfCtx.currentPage.drawText(value, {
      x: rightX + 75,
      y: metaY,
      size: 9,
      font: pdfCtx.fontRegular,
      color: textDark,
    });
    metaY -= 14;
  };

  drawMetaLine('Invoice No:', invoice.invoiceNumber);
  drawMetaLine('Issue Date:', invoice.issueDate);
  drawMetaLine('Due Date:', invoice.dueDate);
  if (invoice.purchaseOrderNumber) {
    drawMetaLine('PO Number:', invoice.purchaseOrderNumber);
  }

  pdfCtx.cursorY -= 65;

  // Horizontal divider
  pdfCtx.currentPage.drawLine({
    start: { x: pdfCtx.marginLeft, y: pdfCtx.cursorY },
    end: { x: pdfCtx.pageWidth - pdfCtx.marginRight, y: pdfCtx.cursorY },
    thickness: 1,
    color: borderGrey,
  });
  pdfCtx.cursorY -= 15;

  // 2. Seller and Customer Details (Two Columns)
  const colWidth = (pdfCtx.contentWidth - 20) / 2;
  const col1X = pdfCtx.marginLeft;
  const col2X = pdfCtx.marginLeft + colWidth + 20;
  const partyTopY = pdfCtx.cursorY;

  // Seller
  pdfCtx.currentPage.drawText('FROM / SELLER', {
    x: col1X,
    y: partyTopY,
    size: 8,
    font: pdfCtx.fontBold,
    color: textMuted,
  });
  pdfCtx.currentPage.drawText(invoice.seller.name, {
    x: col1X,
    y: partyTopY - 13,
    size: 11,
    font: pdfCtx.fontBold,
    color: textDark,
  });
  let sellerLinesY = partyTopY - 26;
  if (invoice.seller.address) {
    for (const line of pdfCtx.wrapText(invoice.seller.address, colWidth, 9, pdfCtx.fontRegular)) {
      pdfCtx.currentPage.drawText(line, { x: col1X, y: sellerLinesY, size: 9, font: pdfCtx.fontRegular, color: textDark });
      sellerLinesY -= 12;
    }
  }
  if (invoice.seller.email) {
    pdfCtx.currentPage.drawText(invoice.seller.email, { x: col1X, y: sellerLinesY, size: 9, font: pdfCtx.fontRegular, color: textDark });
    sellerLinesY -= 12;
  }
  if (invoice.seller.phone) {
    pdfCtx.currentPage.drawText(invoice.seller.phone, { x: col1X, y: sellerLinesY, size: 9, font: pdfCtx.fontRegular, color: textDark });
    sellerLinesY -= 12;
  }
  if (invoice.seller.taxId) {
    pdfCtx.currentPage.drawText(`Tax ID: ${invoice.seller.taxId}`, { x: col1X, y: sellerLinesY, size: 8, font: pdfCtx.fontRegular, color: textMuted });
    sellerLinesY -= 12;
  }

  // Customer
  pdfCtx.currentPage.drawText('BILLED TO / CUSTOMER', {
    x: col2X,
    y: partyTopY,
    size: 8,
    font: pdfCtx.fontBold,
    color: textMuted,
  });
  pdfCtx.currentPage.drawText(invoice.customer.name, {
    x: col2X,
    y: partyTopY - 13,
    size: 11,
    font: pdfCtx.fontBold,
    color: textDark,
  });
  let custLinesY = partyTopY - 26;
  if (invoice.customer.address) {
    for (const line of pdfCtx.wrapText(invoice.customer.address, colWidth, 9, pdfCtx.fontRegular)) {
      pdfCtx.currentPage.drawText(line, { x: col2X, y: custLinesY, size: 9, font: pdfCtx.fontRegular, color: textDark });
      custLinesY -= 12;
    }
  }
  if (invoice.customer.email) {
    pdfCtx.currentPage.drawText(invoice.customer.email, { x: col2X, y: custLinesY, size: 9, font: pdfCtx.fontRegular, color: textDark });
    custLinesY -= 12;
  }
  if (invoice.customer.phone) {
    pdfCtx.currentPage.drawText(invoice.customer.phone, { x: col2X, y: custLinesY, size: 9, font: pdfCtx.fontRegular, color: textDark });
    custLinesY -= 12;
  }
  if (invoice.customer.taxId) {
    pdfCtx.currentPage.drawText(`Tax ID: ${invoice.customer.taxId}`, { x: col2X, y: custLinesY, size: 8, font: pdfCtx.fontRegular, color: textMuted });
    custLinesY -= 12;
  }

  pdfCtx.cursorY = Math.min(sellerLinesY, custLinesY) - 15;

  // 3. Line Items Table Header
  const colDescWidth = pdfCtx.contentWidth - (40 + 75 + 50 + 75);
  const colQtyWidth = 40;
  const colPriceWidth = 75;
  const colTaxWidth = 50;

  const drawTableHeader = () => {
    pdfCtx.currentPage.drawRectangle({
      x: pdfCtx.marginLeft,
      y: pdfCtx.cursorY - 18,
      width: pdfCtx.contentWidth,
      height: 22,
      color: bgLight,
    });

    let currentX = pdfCtx.marginLeft + 6;
    pdfCtx.currentPage.drawText('Description', { x: currentX, y: pdfCtx.cursorY - 13, size: 9, font: pdfCtx.fontBold, color: textDark });
    currentX += colDescWidth;

    pdfCtx.currentPage.drawText('Qty', { x: currentX, y: pdfCtx.cursorY - 13, size: 9, font: pdfCtx.fontBold, color: textDark });
    currentX += colQtyWidth;

    pdfCtx.currentPage.drawText('Unit Price', { x: currentX, y: pdfCtx.cursorY - 13, size: 9, font: pdfCtx.fontBold, color: textDark });
    currentX += colPriceWidth;

    pdfCtx.currentPage.drawText('Tax', { x: currentX, y: pdfCtx.cursorY - 13, size: 9, font: pdfCtx.fontBold, color: textDark });
    currentX += colTaxWidth;

    pdfCtx.currentPage.drawText('Total', { x: currentX, y: pdfCtx.cursorY - 13, size: 9, font: pdfCtx.fontBold, color: textDark });

    pdfCtx.cursorY -= 24;
  };

  drawTableHeader();

  // 4. Render Items
  for (const item of totals.items) {
    const descLines = pdfCtx.wrapText(item.description, colDescWidth - 12, 9, pdfCtx.fontRegular);
    const rowHeight = Math.max(18, descLines.length * 13 + 6);

    if (pdfCtx.cursorY - rowHeight < pdfCtx.marginBottom + 120) {
      pdfCtx.addNewPage();
      drawTableHeader();
    }

    const itemY = pdfCtx.cursorY;
    let descY = itemY - 11;
    for (const dLine of descLines) {
      pdfCtx.currentPage.drawText(dLine, {
        x: pdfCtx.marginLeft + 6,
        y: descY,
        size: 9,
        font: pdfCtx.fontRegular,
        color: textDark,
      });
      descY -= 12;
    }

    let colX = pdfCtx.marginLeft + colDescWidth;
    pdfCtx.currentPage.drawText(String(item.quantity), {
      x: colX,
      y: itemY - 11,
      size: 9,
      font: pdfCtx.fontRegular,
      color: textDark,
    });
    colX += colQtyWidth;

    pdfCtx.currentPage.drawText(formatCurrency(item.unitPrice, totals.currency), {
      x: colX,
      y: itemY - 11,
      size: 9,
      font: pdfCtx.fontRegular,
      color: textDark,
    });
    colX += colPriceWidth;

    const taxStr = item.taxRate !== undefined ? `${item.taxRate}%` : '-';
    pdfCtx.currentPage.drawText(taxStr, {
      x: colX,
      y: itemY - 11,
      size: 9,
      font: pdfCtx.fontRegular,
      color: textDark,
    });
    colX += colTaxWidth;

    pdfCtx.currentPage.drawText(formatCurrency(item.totalAmount, totals.currency), {
      x: colX,
      y: itemY - 11,
      size: 9,
      font: pdfCtx.fontBold,
      color: textDark,
    });

    pdfCtx.cursorY -= rowHeight;
    pdfCtx.currentPage.drawLine({
      start: { x: pdfCtx.marginLeft, y: pdfCtx.cursorY },
      end: { x: pdfCtx.pageWidth - pdfCtx.marginRight, y: pdfCtx.cursorY },
      thickness: 0.5,
      color: borderGrey,
    });
  }

  // 5. Totals Section (Right-Aligned)
  pdfCtx.ensureSpace(140);
  pdfCtx.cursorY -= 15;

  const totalsBoxWidth = 220;
  const totalsX = pdfCtx.pageWidth - pdfCtx.marginRight - totalsBoxWidth;
  let totalsY = pdfCtx.cursorY;

  const drawTotalLine = (label: string, value: string, isBold = false, isAccent = false) => {
    pdfCtx.currentPage.drawText(label, {
      x: totalsX,
      y: totalsY,
      size: isBold ? 10 : 9,
      font: isBold ? pdfCtx.fontBold : pdfCtx.fontRegular,
      color: isAccent ? primaryRgb : textDark,
    });
    const valWidth = (isBold ? pdfCtx.fontBold : pdfCtx.fontRegular).widthOfTextAtSize(value, isBold ? 10 : 9);
    pdfCtx.currentPage.drawText(value, {
      x: pdfCtx.pageWidth - pdfCtx.marginRight - valWidth,
      y: totalsY,
      size: isBold ? 10 : 9,
      font: isBold ? pdfCtx.fontBold : pdfCtx.fontRegular,
      color: isAccent ? primaryRgb : textDark,
    });
    totalsY -= 16;
  };

  drawTotalLine('Subtotal:', formatCurrency(totals.subtotal, totals.currency));
  if (totals.itemDiscountsTotal > 0) {
    drawTotalLine('Item Discounts:', `-${formatCurrency(totals.itemDiscountsTotal, totals.currency)}`);
  }
  if (totals.invoiceDiscountTotal > 0) {
    drawTotalLine('Invoice Discount:', `-${formatCurrency(totals.invoiceDiscountTotal, totals.currency)}`);
  }
  drawTotalLine('Taxable Amount:', formatCurrency(totals.taxableAmount, totals.currency));
  drawTotalLine('Tax Total:', formatCurrency(totals.taxTotal, totals.currency));

  // Double line before Grand Total
  totalsY += 2;
  pdfCtx.currentPage.drawLine({
    start: { x: totalsX, y: totalsY },
    end: { x: pdfCtx.pageWidth - pdfCtx.marginRight, y: totalsY },
    thickness: 1,
    color: borderGrey,
  });
  totalsY -= 14;

  drawTotalLine('Total Payable:', formatCurrency(totals.total, totals.currency), true, true);

  if (totals.amountPaid > 0) {
    drawTotalLine('Amount Paid:', `-${formatCurrency(totals.amountPaid, totals.currency)}`);
    drawTotalLine('Balance Due:', formatCurrency(totals.balanceDue, totals.currency), true);
  }

  pdfCtx.cursorY = Math.min(pdfCtx.cursorY, totalsY) - 15;

  // 6. Notes & Payment Instructions (Left Side)
  if (invoice.notes || invoice.paymentInstructions) {
    pdfCtx.ensureSpace(60);
    if (invoice.notes) {
      pdfCtx.drawParagraph(`Notes: ${invoice.notes}`, { fontSize: 8, color: { r: 0.35, g: 0.35, b: 0.35 } });
      pdfCtx.cursorY -= 4;
    }
    if (invoice.paymentInstructions) {
      pdfCtx.drawParagraph(`Payment Instructions: ${invoice.paymentInstructions}`, { fontSize: 8, color: { r: 0.35, g: 0.35, b: 0.35 } });
      pdfCtx.cursorY -= 4;
    }
  }

  // 7. Page numbering & footer
  pdfCtx.drawPageNumbers(invoice.footer ?? 'Generated by @rahul_dadhich15/business-tools-toolkit');

  return await doc.save();
}
