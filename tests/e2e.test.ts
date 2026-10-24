import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';

// 1. Consume built ESM artifacts
import * as BTTK_ESM from '../dist/index.js';
import * as Browser_ESM from '../dist/browser.js';

// 2. Consume built CommonJS artifacts via createRequire
const require = createRequire(import.meta.url);
const BTTK_CJS = require(resolve(__dirname, '../dist/index.cjs'));
const Browser_CJS = require(resolve(__dirname, '../dist/browser.cjs'));

describe('End-to-End (E2E) Package Distribution Tests', () => {
  describe('Module Exports & Interoperability (ESM vs CJS)', () => {
    const expectedCoreExports = [
      'calculateInvoiceTotals',
      'generateInvoicePdf',
      'buildResume',
      'buildResumePdf',
      'generateCoverLetter',
      'generateVCard',
      'buildDigitalBusinessCard',
      'getVCardFilename',
      'getVCardMimeType',
      'generateEmailSignature',
      'buildPayPalLink',
      'generatePrivacyPolicy',
      'generateTerms',
      'serializeSignatureSvg',
      'createSignaturePad',
      'formatCurrency',
      'roundMoney',
      'getCurrencyDecimals',
      'escapeHtml',
      'escapeHtmlAttr',
      'isSafeUrl',
      'isValidCssColor',
      'sanitizeFilename',
      'ValidationError',
      'BusinessToolsError',
      'PdfContext',
      'A4_PAGE_SIZE',
      'LETTER_PAGE_SIZE',
    ];

    it('exports all expected core utilities in ESM', () => {
      for (const exp of expectedCoreExports) {
        expect(BTTK_ESM).toHaveProperty(exp);
        expect(typeof (BTTK_ESM as Record<string, unknown>)[exp]).toBeDefined();
      }
    });

    it('exports all expected core utilities in CommonJS', () => {
      for (const exp of expectedCoreExports) {
        expect(BTTK_CJS).toHaveProperty(exp);
        expect(typeof BTTK_CJS[exp]).toBeDefined();
      }
    });

    it('browser entrypoint exports browser helpers and all core utilities in ESM & CJS', () => {
      const browserOnlyExports = ['downloadBlob', 'downloadVCard', 'downloadPdf', 'downloadPng'];
      for (const exp of browserOnlyExports) {
        expect(typeof (Browser_ESM as Record<string, unknown>)[exp]).toBe('function');
        expect(typeof Browser_CJS[exp]).toBe('function');
      }
      for (const exp of expectedCoreExports) {
        expect(Browser_ESM).toHaveProperty(exp);
        expect(Browser_CJS).toHaveProperty(exp);
      }
    });
  });

  describe('Utility 1: Invoice Generator & PDF Export (E2E)', () => {
    const sampleInvoice: BTTK_ESM.InvoiceInput = {
      invoiceNumber: 'INV-2026-9001',
      issueDate: '2026-10-24',
      dueDate: '2026-11-24',
      currency: 'USD',
      seller: {
        name: 'Apex Solutions LLC',
        email: 'billing@apexsolutions.com',
        phone: '+1 (555) 019-2834',
        address: '100 Innovation Way, Suite 400, San Francisco, CA 94105, USA',
        taxId: 'US-EIN-987654321',
      },
      customer: {
        name: 'Globex Corporation',
        email: 'accounts@globex.corp',
        address: '456 Enterprise Blvd, Fl 12, New York, NY 10001, USA',
      },
      items: [
        {
          description: 'Cloud Infrastructure Architecture Review',
          quantity: 40,
          unitPrice: 150,
          discount: 10,
          discountType: 'percentage', // 40 * 150 = 6000, 10% off = 5400
          taxRate: 8.5, // 5400 * 8.5% = 459
        },
        {
          description: 'Zero Trust Security Audit',
          quantity: 1,
          unitPrice: 2500,
          discount: 200,
          discountType: 'fixed', // 2500 - 200 = 2300
          taxRate: 8.5, // 2300 * 8.5% = 195.50
        },
      ],
      invoiceDiscount: {
        type: 'fixed',
        value: 100, // 5400 + 2300 = 7700 - 100 = 7600
      },
      shipping: 50,
      amountPaid: 3000,
      notes: 'Net 30 payment terms. Direct wire instructions provided below.',
      terms: 'Interest of 1.5% per month will be assessed on late balances.',
    };

    it('calculates totals with high precision identical in ESM and CJS', () => {
      const totalsEsm = BTTK_ESM.calculateInvoiceTotals(sampleInvoice);
      const totalsCjs = BTTK_CJS.calculateInvoiceTotals(sampleInvoice);

      expect(totalsEsm).toEqual(totalsCjs);
      expect(totalsEsm.subtotal).toBe(8500); // 6000 + 2500
      expect(totalsEsm.itemDiscountsTotal).toBe(800); // 600 + 200
      expect(totalsEsm.invoiceDiscountTotal).toBe(100);
      expect(totalsEsm.taxableAmount).toBe(7600); // (6000 - 600) + (2500 - 200) - 100
      expect(totalsEsm.amountPaid).toBe(3000);
      expect(totalsEsm.total).toBeGreaterThan(0);
      expect(totalsEsm.balanceDue).toBe(totalsEsm.total - 3000);
    });

    it('generates a valid, readable PDF document byte stream', async () => {
      const pdfBytes = await BTTK_ESM.generateInvoicePdf(sampleInvoice, {
        primaryColor: { r: 0.1, g: 0.3, b: 0.6 },
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);

      // Verify PDF Magic Bytes %PDF-
      const header = String.fromCharCode(...pdfBytes.slice(0, 5));
      expect(header).toBe('%PDF-');

      // Verify that pdf-lib can parse and read the generated document
      const loadedDoc = await PDFDocument.load(pdfBytes);
      expect(loadedDoc.getPageCount()).toBeGreaterThanOrEqual(1);
      const page = loadedDoc.getPage(0);
      const { width, height } = page.getSize();
      expect(width).toBeGreaterThan(500);
      expect(height).toBeGreaterThan(700);
    });

    it('supports multi-page pagination for long invoices', async () => {
      const longInvoice: BTTK_ESM.InvoiceInput = {
        ...sampleInvoice,
        invoiceNumber: 'INV-LONG-100',
        items: Array.from({ length: 35 }, (_, i) => ({
          description: `Consulting Engagement Milestone Deliverable ${i + 1}`,
          quantity: i + 1,
          unitPrice: 75.5,
        })),
      };

      const pdfBytes = await BTTK_ESM.generateInvoicePdf(longInvoice);
      const loadedDoc = await PDFDocument.load(pdfBytes);
      expect(loadedDoc.getPageCount()).toBeGreaterThan(1);
    });
  });

  describe('Utility 2: Resume Builder & PDF Generation (E2E)', () => {
    const sampleResume: BTTK_ESM.ResumeInput = {
      fullName: 'Alexandra Chen',
      title: 'Staff Software Architect & Distributed Systems Specialist',
      contact: {
        email: 'alexandra.chen@techmail.example',
        phone: '+1 (555) 839-2041',
        location: 'Seattle, WA',
        website: 'https://alexandrachen.dev',
        linkedin: 'https://linkedin.com/in/alexandrachen',
        github: 'https://github.com/alexandrachen',
      },
      summary:
        'Staff Software Engineer with 12+ years designing resilient, mission-critical distributed systems, high-throughput message brokers, and enterprise payment backbones.',
      experience: [
        {
          company: 'HyperScale Cloud Inc',
          position: 'Staff Engineer & Tech Lead',
          location: 'Seattle, WA',
          startDate: '2021-03',
          current: true,
          description: 'Leading the transaction integrity and consensus core platform team.',
          highlights: [
            'Spearheaded migration to Raft-based distributed ledger processing 250k TPS.',
            'Reduced p99 tail latency from 85ms to 12ms under peak load.',
          ],
        },
        {
          company: 'Fintech Vanguard',
          position: 'Senior Backend Engineer',
          location: 'San Francisco, CA',
          startDate: '2017-06',
          endDate: '2021-02',
          highlights: [
            'Architected automated ACH and SEPA reconciliation pipelines.',
            'Mentored 8 mid-level engineers to senior promotions.',
          ],
        },
      ],
      education: [
        {
          institution: 'University of Washington',
          degree: 'B.S. in Computer Science & Mathematics',
          graduationDate: '2017',
          location: 'Seattle, WA',
        },
      ],
      skills: {
        Languages: ['TypeScript', 'Rust', 'Go', 'Python', 'SQL'],
        Infrastructure: ['Kubernetes', 'Kafka', 'PostgreSQL', 'Docker', 'AWS'],
      },
      certifications: [
        {
          name: 'AWS Certified Solutions Architect - Professional',
          issuer: 'Amazon Web Services',
          date: '2023',
        },
      ],
    };

    it('builds structured resume text and markdown representation', () => {
      const model = BTTK_ESM.buildResume(sampleResume);
      expect(model.content).toContain('Alexandra Chen');
      expect(model.content).toContain('Staff Software Architect');
      expect(model.content).toContain('HyperScale Cloud Inc');
      expect(model.content).toContain('Raft-based distributed ledger');
      expect(model.content).toContain('University of Washington');
      expect(model.metadata.sectionsCount).toBeGreaterThan(3);
    });

    it('builds a genuine loadable resume PDF', async () => {
      const pdfBytes = await BTTK_ESM.buildResumePdf(sampleResume, {
        pageSize: BTTK_ESM.A4_PAGE_SIZE,
        primaryColor: { r: 0.15, g: 0.2, b: 0.35 },
      });

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      const loadedDoc = await PDFDocument.load(pdfBytes);
      expect(loadedDoc.getPageCount()).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Utility 3: Cover Letter Generator (E2E)', () => {
    const candidate: BTTK_ESM.CoverLetterInput = {
      candidateName: 'David Kim',
      jobTitle: 'Principal Cloud Platform Engineer',
      companyName: 'NextGen Financial Systems',
      hiringManagerName: 'Sarah Jenkins',
      contactInfo: {
        email: 'david.kim@example.com',
        phone: '+1 (555) 749-3820',
        linkedin: 'https://linkedin.com/in/davidkim',
      },
      skills: ['Kubernetes Multi-Cluster', 'Go', 'Terraform', 'Service Mesh'],
      experienceYears: 10,
      education: 'Master of Science in Distributed Computing, Stanford University',
      projects: ['Engineered enterprise-wide zero-downtime multi-region failover'],
      additionalNotes: 'Security clearance active.',
    };

    it('generates cover letters across all supported tones and formats', () => {
      const tones: BTTK_ESM.CoverLetterTone[] = ['professional', 'formal', 'concise'];
      const formats: BTTK_ESM.CoverLetterFormat[] = ['text', 'markdown'];

      for (const tone of tones) {
        for (const format of formats) {
          const res = BTTK_ESM.generateCoverLetter(candidate, { tone, format, length: 'detailed' });
          expect(res.format).toBe(format);
          expect(res.metadata.tone).toBe(tone);
          expect(res.metadata.candidateName).toBe('David Kim');
          expect(res.metadata.companyName).toBe('NextGen Financial Systems');
          expect(res.content).toContain('David Kim');
          expect(res.content).toContain('NextGen Financial Systems');
          expect(res.content).toContain('Sarah Jenkins');

          if (format === 'markdown') {
            expect(res.content).toContain('# David Kim');
          }
        }
      }
    });

    it('validates required inputs and raises ValidationError on missing fields', () => {
      // @ts-expect-error test invalid input
      expect(() => BTTK_ESM.generateCoverLetter({})).toThrow(BTTK_ESM.ValidationError);
    });
  });

  describe('Utility 4: Digital Business Card & vCard (E2E)', () => {
    const contact: BTTK_ESM.VCardInput = {
      fullName: 'Marcus Aurelius Sterling',
      organization: 'Sterling & Partners Advisory',
      jobTitle: 'Managing Partner',
      email: ['marcus@sterling.example', 'm.sterling@personal.example'],
      phone: ['+1-555-908-1122', '+1-555-908-1123'],
      website: 'https://sterling.example',
      photoUrl: 'https://sterling.example/avatar.jpg',
      address: {
        street: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'United States',
      },
      notes: 'Available for strategic enterprise consultations.',
      socialLinks: [
        { platform: 'LinkedIn', url: 'https://linkedin.com/in/marcussterling' },
        { platform: 'Twitter', url: 'https://twitter.com/marcussterling' },
      ],
    };

    it('generates valid vCard 3.0 and 4.0 specifications', () => {
      const vcard3 = BTTK_ESM.generateVCard(contact, { version: '3.0' });
      expect(vcard3).toContain('BEGIN:VCARD');
      expect(vcard3).toContain('VERSION:3.0');
      expect(vcard3).toContain('FN:Marcus Aurelius Sterling');
      expect(vcard3).toContain('ORG:Sterling & Partners Advisory');
      expect(vcard3).toContain('EMAIL;TYPE=INTERNET,WORK:marcus@sterling.example');
      expect(vcard3).toContain('END:VCARD');

      const vcard4 = BTTK_ESM.generateVCard(contact, { version: '4.0' });
      expect(vcard4).toContain('BEGIN:VCARD');
      expect(vcard4).toContain('VERSION:4.0');
      expect(vcard4).toContain('FN:Marcus Aurelius Sterling');
      expect(vcard4).toContain('EMAIL;TYPE=work:marcus@sterling.example');
      expect(vcard4).toContain('END:VCARD');
    });

    it('builds a styled, safe HTML digital business card with downloadable metadata', () => {
      const card = BTTK_ESM.buildDigitalBusinessCard(contact);
      expect(card.html).toContain('Marcus Aurelius Sterling');
      expect(card.html).toContain('Managing Partner at Sterling &amp; Partners Advisory');
      expect(card.html).toContain('href="mailto:marcus@sterling.example"');
      expect(card.html).toContain('href="tel:+15559081122"');
      expect(card.html).toContain('742 Evergreen Terrace, Springfield, OR, 97477, United States');
      expect(card.mimeType).toBe('text/vcard; charset=utf-8');
      expect(card.filename).toMatch(/marcus_aurelius_sterling\.vcf$/i);
    });
  });

  describe('Utility 5: Email Signature Generator (E2E)', () => {
    const profile: BTTK_ESM.EmailSignatureInput = {
      name: 'Samantha Vance',
      jobTitle: 'VP of Customer Engineering',
      company: 'DataFlow Systems',
      email: 'samantha.vance@dataflow.example',
      phone: '+1 (555) 438-9201',
      website: 'https://dataflow.example',
      avatarUrl: 'https://dataflow.example/images/samantha.png',
      disclaimer: 'The contents of this email are confidential.',
      socialLinks: [
        { platform: 'LinkedIn', url: 'https://linkedin.com/in/samanthavance' },
        { platform: 'GitHub', url: 'https://github.com/samanthavance' },
      ],
    };

    it('generates table-based email signatures compatible with desktop and webmail clients', () => {
      const templates: Array<'modern' | 'compact' | 'minimal'> = ['modern', 'compact', 'minimal'];
      for (const template of templates) {
        const sig = BTTK_ESM.generateEmailSignature(profile, { template });
        expect(sig.html).toContain('<table');
        expect(sig.html).toContain('Samantha Vance');
        expect(sig.html).toContain('DataFlow Systems');
        expect(sig.html).toContain('href="mailto:samantha.vance@dataflow.example"');
        expect(sig.text).toContain('Samantha Vance');
        expect(sig.text).toContain('VP of Customer Engineering | DataFlow Systems');
      }
    });
  });

  describe('Utility 6: PayPal Payment Link Builder (E2E)', () => {
    it('builds RFC/URI compliant standard payment link with all attributes', () => {
      const link = BTTK_ESM.buildPayPalLink({
        merchant: 'merchant@store.example',
        amount: 149.95,
        currency: 'EUR',
        description: 'Annual SaaS Enterprise License',
        invoiceId: 'INV-EUR-7788',
        custom: 'Thank you for your business.',
      });

      expect(link.url).toContain('https://www.paypal.com/cgi-bin/webscr');
      expect(link.targetUrl.searchParams.get('business')).toBe('merchant@store.example');
      expect(link.targetUrl.searchParams.get('amount')).toBe('149.95');
      expect(link.targetUrl.searchParams.get('currency_code')).toBe('EUR');
      expect(link.targetUrl.searchParams.get('item_name')).toBe('Annual SaaS Enterprise License');
      expect(link.targetUrl.searchParams.get('invoice')).toBe('INV-EUR-7788');
      expect(link.targetUrl.searchParams.get('custom')).toBe('Thank you for your business.');
    });

    it('builds paypal.me link format when requested', () => {
      const link = BTTK_ESM.buildPayPalLink(
        {
          merchant: 'salesdept',
          amount: 50,
          currency: 'USD',
        },
        { method: 'paypal.me' }
      );

      expect(link.url).toBe('https://paypal.me/salesdept/50.00USD');
    });

    it('rejects invalid amounts or invalid ISO currency codes with ValidationError', () => {
      expect(() =>
        BTTK_ESM.buildPayPalLink({
          merchant: 'sales@example.com',
          amount: -10,
        })
      ).toThrow(BTTK_ESM.ValidationError);

      expect(() =>
        BTTK_ESM.buildPayPalLink({
          merchant: 'sales@example.com',
          amount: 50,
          currency: 'INVALID_CODE',
        })
      ).toThrow(BTTK_ESM.ValidationError);
    });
  });

  describe('Utility 7: Privacy Policy Generator (E2E)', () => {
    it('generates fully comprehensive policy reflecting GDPR, CCPA, cookies, and data retention', () => {
      const policy = BTTK_ESM.generatePrivacyPolicy({
        businessName: 'CloudMatrix Technologies Inc.',
        websiteUrl: 'https://cloudmatrix.example',
        contactEmail: 'privacy@cloudmatrix.example',
        effectiveDate: '2026-10-24',
        cookies: true,
        analytics: ['Google Analytics 4', 'Plausible Analytics'],
        paymentProcessors: ['Stripe', 'PayPal'],
        dataRetention: 'Personal data is retained for the lifetime of your active subscription plus 90 days.',
        userRights: ['Right to access and rectification (GDPR)', 'Right to opt-out of sale (CCPA)'],
      });

      expect(policy.content).toContain('CloudMatrix Technologies Inc.');
      expect(policy.content).toContain('privacy@cloudmatrix.example');
      expect(policy.content).toContain('Cookies and Tracking Technologies');
      expect(policy.content).toContain('Google Analytics 4');
      expect(policy.content).toContain('Plausible Analytics');
      expect(policy.content).toContain('Stripe');
      expect(policy.content).toContain('Right to access and rectification (GDPR)');
      expect(policy.content).toContain('Personal data is retained for the lifetime');
      expect(policy.content).toContain('LEGAL DISCLAIMER');
    });
  });

  describe('Utility 8: Terms & Conditions Generator (E2E)', () => {
    it('generates compliant Terms of Service incorporating all optional clauses', () => {
      const terms = BTTK_ESM.generateTerms({
        businessName: 'DevHub Cloud Inc.',
        websiteUrl: 'https://devhub.example',
        contactEmail: 'legal@devhub.example',
        governingLaw: 'State of Delaware, United States',
        userAccounts: true,
        userGeneratedContent: true,
        subscriptions: true,
        eligibilityAge: 16,
        limitationOfLiability: 'To the maximum extent permitted by applicable law, total liability is capped at $500.',
      });

      expect(terms.content).toContain('DevHub Cloud Inc.');
      expect(terms.content).toContain('legal@devhub.example');
      expect(terms.content).toContain('3. User Accounts');
      expect(terms.content).toContain('User-Generated Content');
      expect(terms.content).toContain('Subscriptions and Billing');
      expect(terms.content).toContain('at least 16 years of age');
      expect(terms.content).toContain('State of Delaware, United States');
    });
  });

  describe('Utility 9: Handwritten Signature Serialization & Pad (E2E)', () => {
    it('serializes strokes into valid XML SVG and handles bounding boxes', () => {
      const strokes: BTTK_ESM.SignatureStroke[] = [
        {
          points: [
            { x: 10, y: 10 },
            { x: 25, y: 30 },
            { x: 45, y: 15 },
          ],
          color: '#1e293b',
          width: 3,
        },
        {
          points: [{ x: 50, y: 12 }],
          color: '#0f172a',
          width: 2,
        },
      ];

      const svg = BTTK_ESM.serializeSignatureSvg(strokes, {
        backgroundColor: '#ffffff',
      });

      expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('<rect width="');
      expect(svg).toContain('fill="#ffffff"');
      expect(svg).toContain('<path d="M 10 10 L 25 30 L 45 15"');
      expect(svg).toContain('<circle cx="50" cy="12"');
    });
  });

  describe('Utility 10: Shared Helpers (Currency, HTML Sanitization, Errors) (E2E)', () => {
    it('formats currencies across multiple locales correctly', () => {
      expect(BTTK_ESM.formatCurrency(1234.56, 'USD')).toBe('USD 1,234.56');
      expect(BTTK_ESM.formatCurrency(5000, 'JPY')).toBe('JPY 5,000');
      expect(BTTK_ESM.roundMoney(12.3456, 2)).toBe(12.35);
      expect(BTTK_ESM.getCurrencyDecimals('BHD')).toBe(3);
    });

    it('escapes HTML strings and sanitizes URLs', () => {
      expect(BTTK_ESM.escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
      expect(BTTK_ESM.isSafeUrl('https://example.com')).toBe(true);
      expect(BTTK_ESM.isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(BTTK_ESM.isValidCssColor('#3b82f6')).toBe(true);
      expect(BTTK_ESM.isValidCssColor('rgba(255, 0, 0, 0.5)')).toBe(true);
      expect(BTTK_ESM.isValidCssColor('expression(alert(1))')).toBe(false);
    });

    it('instantiates custom ValidationError and preserves field and issue details', () => {
      const err = new BTTK_ESM.ValidationError('Invalid input', {
        field: 'currency',
        issues: ['Currency code must be 3 uppercase letters'],
      });
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(BTTK_ESM.BusinessToolsError);
      expect(err.name).toBe('ValidationError');
      expect(err.field).toBe('currency');
      expect(err.issues).toEqual(['Currency code must be 3 uppercase letters']);
    });
  });
});
