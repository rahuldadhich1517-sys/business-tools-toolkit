import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import {
  buildDigitalBusinessCard,
  buildPayPalLink,
  buildResume,
  buildResumePdf,
  calculateInvoiceTotals,
  generateCoverLetter,
  generateEmailSignature,
  generateInvoicePdf,
  generatePrivacyPolicy,
  generateTerms,
  generateVCard,
  serializeSignatureSvg,
} from '../src';

describe('Cross-Utility Integration Tests', () => {
  it('1. Digital business card and vCard contact field representation', () => {
    const contact = {
      fullName: 'Rahul Dadhich',
      organization: 'Tech Innovations',
      jobTitle: 'Principal Engineer',
      email: 'rahul@example.com',
      phone: '+1-555-0100',
      website: 'https://example.com',
      revisionTimestamp: '2026-10-24T12:00:00Z',
    };

    const card = buildDigitalBusinessCard(contact);
    expect(card.vcard).toContain('FN:Rahul Dadhich');
    expect(card.vcard).toContain('ORG:Tech Innovations');
    expect(card.html).toContain('Rahul Dadhich');
    expect(card.html).toContain('Principal Engineer at Tech Innovations');
    expect(card.mimeType).toBe('text/vcard; charset=utf-8');

    const vcardDirect = generateVCard(contact);
    expect(vcardDirect).toBe(card.vcard);
  });

  it('2. Email signature renders escaped contact details with inline layout', () => {
    const contact = {
      name: 'Jane & Doe',
      company: 'Acme <Systems>',
      email: 'jane@example.com',
      website: 'https://example.com',
    };

    const sig = generateEmailSignature(contact);
    expect(sig.html).toContain('Jane &amp; Doe');
    expect(sig.html).toContain('Acme &lt;Systems&gt;');
    expect(sig.html).toContain('href="mailto:jane@example.com"');
    expect(sig.text).toContain('Jane & Doe');
    expect(sig.text).toContain('Acme <Systems>');
  });

  it('3. Invoice calculation matches PDF generation and PDF load verification', async () => {
    const invoice = {
      invoiceNumber: 'INV-CROSS-01',
      issueDate: '2026-10-24',
      dueDate: '2026-11-24',
      currency: 'USD',
      seller: { name: 'DevStudio Inc.' },
      customer: { name: 'Client LLC' },
      items: [
        { description: 'Consulting', quantity: 10, unitPrice: 200, taxRate: 10 },
      ],
      amountPaid: 500,
    };

    const totals = calculateInvoiceTotals(invoice);
    expect(totals.subtotal).toBe(2000);
    expect(totals.taxTotal).toBe(200);
    expect(totals.total).toBe(2200);
    expect(totals.balanceDue).toBe(1700);

    const pdfBytes = await generateInvoicePdf(invoice);
    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    expect(pdfDoc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('4. Resume model builds and exports a verified multi-page capable PDF', async () => {
    const resume = {
      fullName: 'John Senior Developer',
      contact: { email: 'john@example.com' },
      summary: 'Experienced distributed systems engineer.',
      experience: [
        {
          position: 'Lead Engineer',
          company: 'BigTech Corp',
          startDate: '2020',
          current: true,
          highlights: ['Built high-throughput payment rails'],
        },
      ],
    };

    const model = buildResume(resume);
    expect(model.content).toContain('John Senior Developer');
    expect(model.content).toContain('Built high-throughput payment rails');

    const pdfBytes = await buildResumePdf(resume);
    const doc = await PDFDocument.load(pdfBytes);
    expect(doc.getPageCount()).toBeGreaterThanOrEqual(1);
  });

  it('5. Cover letter preserves provided facts without inventing qualifications', () => {
    const candidate = {
      candidateName: 'Maria Garcia',
      jobTitle: 'Security Architect',
      companyName: 'SecureBank',
      skills: ['AppSec', 'Threat Modeling'],
    };

    const letter = generateCoverLetter(candidate);
    expect(letter.content).toContain('Maria Garcia');
    expect(letter.content).toContain('SecureBank');
    expect(letter.content).toContain('Security Architect');
    expect(letter.content).toContain('AppSec, Threat Modeling');
    expect(letter.content).not.toContain('patents');
    expect(letter.content).not.toContain('revenue increased');
  });

  it('6. Privacy policy reflects provided questionnaire options accurately', () => {
    const policy = generatePrivacyPolicy({
      businessName: 'MySaaS',
      contactEmail: 'support@mysaas.example',
      cookies: true,
      analytics: ['PrivacyAnalytics'],
      dataRetention: 'Data retained for 90 days.',
    });

    expect(policy.content).toContain('MySaaS');
    expect(policy.content).toContain('Cookies and Tracking Technologies');
    expect(policy.content).toContain('PrivacyAnalytics');
    expect(policy.content).toContain('Data retained for 90 days.');
    expect(policy.content).toContain('LEGAL DISCLAIMER');
  });

  it('7. Terms of service respects conditional clauses', () => {
    const terms = generateTerms({
      businessName: 'CommunityApp',
      contactEmail: 'admin@community.example',
      subscriptions: false,
      userAccounts: true,
    });

    expect(terms.content).toContain('CommunityApp');
    expect(terms.content).toContain('User Accounts');
    expect(terms.content).not.toContain('Subscriptions and Billing');
  });

  it('8. PayPal link builder encodes amount, currency, and reference correctly', () => {
    const link = buildPayPalLink({
      merchant: 'payments@company.example',
      amount: 49.99,
      currency: 'USD',
      invoiceId: 'INV-1001',
    });

    expect(link.targetUrl.searchParams.get('business')).toBe('payments@company.example');
    expect(link.targetUrl.searchParams.get('amount')).toBe('49.99');
    expect(link.targetUrl.searchParams.get('currency_code')).toBe('USD');
    expect(link.targetUrl.searchParams.get('invoice')).toBe('INV-1001');
  });

  it('9. Signature stroke data serializes to safe valid SVG paths', () => {
    const svg = serializeSignatureSvg([
      {
        points: [
          { x: 10, y: 15 },
          { x: 25, y: 35 },
        ],
        color: '#000000',
        width: 2,
      },
    ]);

    expect(svg).toContain('<svg');
    expect(svg).toContain('<path d="M 10 15 L 25 35"');
    expect(svg).toContain('stroke="#000000"');
  });
});
