# @rahul_dadhich15/business-tools-toolkit

A lightweight, production-ready, modular TypeScript toolkit for generating business documents, digital business cards (vCard 3.0 & 4.0), HTML email signatures, invoices with genuine PDF export, PayPal payment links, privacy policies, terms of service drafts, resumes with multi-page PDF export, and canvas signature capture.

[![CI](https://github.com/rahuldadhich1517-sys/business-tools-toolkit/actions/workflows/ci.yml/badge.svg)](https://github.com/rahuldadhich1517-sys/business-tools-toolkit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node: >=18](https://img.shields.io/badge/Node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

---

## Table of Contents

1. [Overview](#1-package-overview)
2. [Features](#2-features)
3. [Installation](#3-installation)
4. [Quick Start](#4-quick-start)
5. [Core Utilities](#5-all-nine-utility-modules)
   - [Cover Letter Generator](#1-cover-letter-generator)
   - [Digital Business Card & vCard](#2-digital-business-card--vcard)
   - [Email Signature Generator](#3-email-signature-generator)
   - [Signature Drawing & Export](#4-signature-drawing--export)
   - [Invoice Generator with PDF Export](#5-invoice-generator-with-pdf-export)
   - [PayPal Payment Link Builder](#6-paypal-payment-link-builder)
   - [Privacy Policy Generator](#7-privacy-policy-generator)
   - [Resume Builder with PDF Export](#8-resume-builder-with-pdf-export)
   - [Terms of Service Generator](#9-terms-of-service-generator)
6. [TypeScript Interfaces](#6-typescript-interfaces)
7. [Validation and Error Handling](#7-validation-and-error-handling)
8. [Browser and Node Compatibility](#8-browser-and-node-compatibility)
9. [Security and Privacy Safeguards](#9-security-and-privacy-safeguards)
10. [Legal-Document Limitations](#10-legal-document-limitations)
11. [PDF Output Limitations](#11-pdf-output-limitations)
12. [Development Setup](#12-development-setup)
13. [Tests and Coverage](#13-tests-and-coverage)
14. [Build and Packaging](#14-build-and-packaging)
15. [Supported Environments](#15-supported-environments)
16. [Known Limitations](#16-known-limitations)
17. [Contributing](#17-contributing)
18. [License](#18-license)
19. [Changelog](#19-changelog)

---

## 1. Package Overview

`@rahul_dadhich15/business-tools-toolkit` provides 9 independent, framework-agnostic utilities designed for backend services, full-stack Node.js servers, and client-side browser applications. It emphasizes standard web APIs, minimal dependencies, strict input validation, and genuine document generation (including standards-compliant vCards and real binary PDFs via `pdf-lib`).

---

## 2. Features

- **Zero Over-engineering**: Built with lean standard library helpers and one mature runtime dependency (`pdf-lib`).
- **Framework Independent**: Works seamlessly in Node.js, Next.js, Express, Fastify, Remix, or vanilla browser applications.
- **Strictly Typed**: Written in 100% strict TypeScript with declaration maps and full ESM/CommonJS distribution.
- **Real PDF Generation**: True vector PDFs with clean typography, automatic pagination, and right-aligned calculations.
- **XSS & Injection Immune**: Strictly escapes HTML metacharacters and attributes; sanitizes URLs against dangerous schemes (`javascript:`, `vbscript:`, `data:`).
- **Standards Compliant**: RFC 6350 (vCard 4.0) and RFC 2426 (vCard 3.0) compliant with UTF-8 safe line folding.

---

## 3. Installation

```bash
npm install @rahul_dadhich15/business-tools-toolkit
```

Or using Yarn / pnpm:

```bash
yarn add @rahul_dadhich15/business-tools-toolkit
# or
pnpm add @rahul_dadhich15/business-tools-toolkit
```

---

## 4. Quick Start

```typescript
import {
  generateCoverLetter,
  calculateInvoiceTotals,
  generateInvoicePdf,
  buildPayPalLink
} from '@rahul_dadhich15/business-tools-toolkit';

// 1. Generate an invoice calculation & PDF
const invoice = {
  invoiceNumber: 'INV-2026-001',
  issueDate: '2026-10-24',
  dueDate: '2026-11-24',
  currency: 'USD',
  seller: { name: 'Acme Cloud Inc.', email: 'billing@acme.example' },
  customer: { name: 'Enterprise Corp' },
  items: [
    { description: 'Cloud Architecture Consulting', quantity: 20, unitPrice: 150 },
    { description: 'Migration Retainer', quantity: 1, unitPrice: 1200, discount: 200 }
  ]
};

const totals = calculateInvoiceTotals(invoice);
console.log(`Total Payable: ${totals.currency} ${totals.total}`);

const pdfBytes = await generateInvoicePdf(invoice);
// pdfBytes is a Uint8Array containing genuine PDF binary data
```

---

## 5. All Nine Utility Modules

### 1. Cover Letter Generator

Creates structured cover letters strictly tailored from candidate facts. **Never hallucinates or fabricates qualifications.**

```typescript
import { generateCoverLetter } from '@rahul_dadhich15/business-tools-toolkit';

const letter = generateCoverLetter({
  candidateName: 'Jane Doe',
  jobTitle: 'Principal Software Engineer',
  companyName: 'Stripe',
  contactInfo: {
    email: 'jane.doe@example.com',
    phone: '+1 (555) 0199',
    website: 'https://janedoe.dev'
  },
  skills: ['TypeScript', 'Kubernetes', 'High-Throughput Systems'],
  relevantExperience: [
    'Led migration of core transaction pipeline handling $10B+ volume',
    'Reduced p99 database query latency by 42%'
  ],
  tone: 'professional', // 'formal' | 'professional' | 'concise'
  length: 'medium'      // 'short' | 'medium' | 'detailed'
}, { format: 'markdown' });

console.log(letter.content);
```

### 2. Digital Business Card & vCard

Generates valid vCard 3.0 / 4.0 contact strings with line folding (RFC 6350) and clean HTML representations.

```typescript
import { buildDigitalBusinessCard, generateVCard } from '@rahul_dadhich15/business-tools-toolkit';

const contactData = {
  fullName: 'Rahul Dadhich',
  organization: 'Acme Technologies Inc.',
  jobTitle: 'Lead Software Architect',
  email: 'rahul@example.com',
  phone: '+1-555-0100',
  website: 'https://example.com',
  address: {
    street: '123 Market St',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94105',
    country: 'USA'
  }
};

// Generate shareable card result
const card = buildDigitalBusinessCard(contactData);
console.log(card.vcard);    // vCard 4.0 string with CRLF
console.log(card.html);     // Sanitized HTML card representation
console.log(card.filename); // "Rahul_Dadhich.vcf"
```

### 3. Email Signature Generator

Produces client-compatible table-based HTML email signatures with conservative inline CSS and plain-text fallbacks.

```typescript
import { generateEmailSignature } from '@rahul_dadhich15/business-tools-toolkit';

const signature = generateEmailSignature({
  name: 'Sarah Connor',
  jobTitle: 'Director of Operations',
  company: 'Defense Systems Inc.',
  email: 'sarah@defensesystems.example',
  phone: '+1-555-0144',
  website: 'https://defensesystems.example',
  brandColors: {
    primary: '#0284c7',
    secondary: '#475569',
    text: '#0f172a'
  },
  disclaimer: 'CONFIDENTIAL: This transmission is intended solely for the recipient.'
});

console.log(signature.html);
console.log(signature.text);
```

### 4. Signature Drawing & Export

Framework-independent capture for touch, mouse, and stylus inputs. Provides headless SVG serialization and browser canvas management.

**Headless SVG Serializer (Universal):**
```typescript
import { serializeSignatureSvg } from '@rahul_dadhich15/business-tools-toolkit';

const svg = serializeSignatureSvg([
  {
    points: [{ x: 10, y: 15 }, { x: 30, y: 45 }, { x: 80, y: 120 }],
    color: '#000000',
    width: 2.5
  }
]);
```

**Interactive Browser Pad:**
```typescript
import { createSignaturePad } from '@rahul_dadhich15/business-tools-toolkit/browser';

const canvas = document.querySelector('canvas')!;
const pad = createSignaturePad(canvas, {
  strokeColor: '#0f172a',
  strokeWidth: 2.5
});

// Pad operations
pad.undoSignature();
pad.clearSignature();
console.log(pad.isEmpty());

// Export as PNG data URL or SVG markup
const pngData = pad.exportSignaturePng();
const svgMarkup = pad.exportSignatureSvg();

// Clean up listeners when component unmounts
pad.destroy();
```

### 5. Invoice Generator with PDF Export

Single source of truth for financial line calculations and genuine PDF rendering.

```typescript
import { calculateInvoiceTotals, generateInvoicePdf } from '@rahul_dadhich15/business-tools-toolkit';

const invoiceData = {
  invoiceNumber: 'INV-2026-001',
  issueDate: '2026-10-24',
  dueDate: '2026-11-24',
  currency: 'USD',
  seller: {
    name: 'DevServices LLC',
    address: '100 Innovation Blvd, Austin, TX',
    email: 'billing@devservices.example',
    taxId: 'US-123456789'
  },
  customer: {
    name: 'Client Corporation',
    address: '500 5th Ave, New York, NY'
  },
  items: [
    { description: 'Full-Stack Development', quantity: 40, unitPrice: 125 },
    { description: 'DevOps Pipeline Configuration', quantity: 1, unitPrice: 1500, discount: 200, taxRate: 8.25 }
  ],
  invoiceDiscount: { type: 'percentage', value: 5 },
  amountPaid: 1000,
  notes: 'Payment due within 30 days.'
};

// 1. Calculate totals
const totals = calculateInvoiceTotals(invoiceData);

// 2. Generate PDF bytes
const pdfBytes = await generateInvoicePdf(invoiceData);
```

### 6. PayPal Payment Link Builder

Generates official, standard PayPal web checkout links or modern `PayPal.Me` payment URLs.

```typescript
import { buildPayPalLink } from '@rahul_dadhich15/business-tools-toolkit';

// Standard Web Payments Standard checkout URL:
const checkoutLink = buildPayPalLink({
  merchant: 'merchant@company.example',
  amount: 89.99,
  currency: 'USD',
  description: 'Enterprise License',
  invoiceId: 'INV-1092',
  returnUrl: 'https://company.example/checkout/success',
  cancelUrl: 'https://company.example/checkout/cancel'
});
console.log(checkoutLink.url);

// PayPal.Me direct link:
const paypalMe = buildPayPalLink({
  merchant: 'rahuldadhich',
  amount: 25.00,
  currency: 'EUR'
}, { method: 'paypal.me' });
console.log(paypalMe.url); // "https://paypal.me/rahuldadhich/25.00EUR"
```

### 7. Privacy Policy Generator

Drafts a tailored privacy policy based strictly on user data collection questionnaire responses.

```typescript
import { generatePrivacyPolicy } from '@rahul_dadhich15/business-tools-toolkit';

const policy = generatePrivacyPolicy({
  businessName: 'CloudMetrics SaaS',
  contactEmail: 'privacy@cloudmetrics.example',
  websiteUrl: 'https://cloudmetrics.example',
  jurisdiction: 'State of California, United States',
  personalDataCollected: ['Name', 'Email address', 'IP address'],
  processingPurposes: ['Deliver and optimize cloud monitoring', 'Process monthly subscription payments'],
  cookies: { enabled: true, types: ['essential', 'analytics'] },
  paymentProcessors: ['Stripe'],
  analytics: ['Plausible Analytics'],
  dataRetention: 'Data is retained for the lifetime of the active account plus 90 days.',
  userRights: ['Access personal data', 'Request deletion (erasure)', 'Export data']
}, { format: 'markdown' });

console.log(policy.content);
console.log(policy.warnings); // Any missing critical legal parameters
```

### 8. Resume Builder with PDF Export

Builds structured resume summaries and renders clean multi-page vector PDFs with selectable text and automatic page numbering.

```typescript
import { buildResume, buildResumePdf } from '@rahul_dadhich15/business-tools-toolkit';

const resumeData = {
  fullName: 'Alexander Wright',
  title: 'Staff Systems Architect',
  contact: {
    email: 'alex@example.com',
    location: 'Seattle, WA',
    website: 'https://alexwright.dev',
    github: 'https://github.com/alexwright'
  },
  summary: 'Staff Architect with 10+ years specializing in distributed systems and cloud platforms.',
  skills: {
    'Core': ['TypeScript', 'Go', 'Distributed Systems'],
    'Cloud': ['AWS', 'Kubernetes', 'Terraform']
  },
  experience: [
    {
      position: 'Staff Engineer',
      company: 'Global Scale Inc.',
      startDate: '2021',
      current: true,
      highlights: [
        'Architected multi-region platform handling 15M daily requests.',
        'Mentored 12 mid-level engineers in reliability practices.'
      ]
    }
  ],
  education: [
    {
      degree: 'B.S. in Computer Science',
      institution: 'University of Washington',
      endDate: '2016'
    }
  ]
};

// Build text / markdown summary
const textSummary = buildResume(resumeData, { format: 'markdown' });

// Generate multi-page vector PDF
const pdfBytes = await buildResumePdf(resumeData);
```

### 9. Terms of Service Generator

Generates customizable service agreement drafts based strictly on actual business operations.

```typescript
import { generateTerms } from '@rahul_dadhich15/business-tools-toolkit';

const terms = generateTerms({
  businessName: 'DevSync Platform',
  contactEmail: 'legal@devsync.example',
  websiteUrl: 'https://devsync.example',
  serviceDescription: 'collaborative code editors and cloud execution environments',
  eligibilityAge: 16,
  userAccounts: {
    allowRegistration: true,
    accountRules: ['One account per user', 'Two-factor authentication required for production keys']
  },
  subscriptions: {
    enabled: true,
    billingCycles: ['Monthly', 'Annual'],
    autoRenew: true
  },
  refunds: {
    allowed: true,
    periodDays: 14,
    conditions: 'Refund requests must be filed within 14 days of initial billing.'
  },
  governingLaw: 'the State of Delaware, United States'
}, { format: 'markdown' });

console.log(terms.content);
```

---

## 6. TypeScript Interfaces

The package exports rich, documented TypeScript interfaces for all configuration models:

- `CoverLetterInput`, `CoverLetterOptions`, `CoverLetterResult`
- `VCardInput`, `VCardOptions`, `DigitalBusinessCardResult`
- `EmailSignatureInput`, `EmailSignatureOptions`, `EmailSignatureResult`
- `SignatureStroke`, `SignaturePoint`, `SignaturePadOptions`, `SignaturePadInstance`
- `InvoiceInput`, `InvoiceItemInput`, `InvoiceTotals`, `InvoicePdfOptions`
- `PayPalLinkInput`, `PayPalLinkOptions`, `PayPalLinkResult`
- `PrivacyPolicyInput`, `PrivacyPolicyOptions`, `PrivacyPolicyResult`
- `ResumeInput`, `ResumeExperience`, `ResumeEducation`, `ResumePdfOptions`
- `TermsInput`, `TermsOptions`, `TermsResult`

---

## 7. Validation and Error Handling

All validation failures throw explicit, typed `ValidationError` instances containing the offending field name and clear diagnostic messages:

```typescript
import { ValidationError } from '@rahul_dadhich15/business-tools-toolkit';

try {
  calculateInvoiceTotals(invalidInvoice);
} catch (err) {
  if (err instanceof ValidationError) {
    console.error(`Validation failed on field "${err.field}": ${err.message}`);
  }
}
```

---

## 8. Browser and Node Compatibility

This package is designed for maximum runtime versatility:

| Environment | Supported Entry Point | Notes |
|:---|:---|:---|
| **Node.js (18+)** | `@rahul_dadhich15/business-tools-toolkit` | PDF rendering, text generation, URL construction, vCards. Universal import never touches DOM or canvas globals. |
| **Browser (ESM)** | `@rahul_dadhich15/business-tools-toolkit` | Full in-memory generation, PDF export, vCard generation. |
| **Browser (DOM/Canvas)** | `@rahul_dadhich15/business-tools-toolkit/browser` | Re-exports all universal utilities plus `createSignaturePad`, `downloadBlob`, `downloadPdf`, `downloadVCard`, and `downloadPng`. |

---

## 9. Security and Privacy Safeguards

1. **Untrusted Input Treatment**: All user-provided strings are treated as untrusted. HTML output is built with strict character escaping (`&`, `<`, `>`, `"`, `'`).
2. **URL Sanitization**: Links in email signatures and business cards are checked against permitted schemes (`https:`, `mailto:`, `tel:`). Dangerous protocols like `javascript:`, `vbscript:`, and `data:` are rejected.
3. **SVG Safety**: Signature SVG outputs are generated strictly from validated numeric coordinates (`Number.isFinite`), eliminating arbitrary XML/SVG injection.
4. **Secret Protection**: PayPal payment link builders never request or accept client secrets, bearer tokens, or private API credentials.
5. **Zero Remote Exfiltration**: All document processing, text formatting, and PDF rendering executes 100% locally in-memory. Candidate data and business information is never sent to external AI or telemetry services.

---

## 10. Legal-Document Limitations

> **IMPORTANT DISCLAIMER**
> Privacy policies and Terms of Service documents produced by this toolkit are **customized drafts for informational purposes only**.
> - They do **not** constitute legal advice or attorney representation.
> - They do **not** guarantee regulatory compliance under GDPR, CCPA/CPRA, or national consumer protection statutes.
> - You **must** have all generated legal documents reviewed and approved by a qualified attorney in your operating jurisdiction before deployment.

---

## 11. PDF Output Limitations

- Generated invoices and resumes use vector rendering with standard Helvetica fonts via `pdf-lib`.
- Invoices are formatted financial records, not legally certified fiscal invoices or tax authority filings.
- Resumes are structured for readability; compatibility with every legacy applicant tracking system (ATS) parser cannot be guaranteed.

---

## 12. Development Setup

```bash
# Clone the repository
git clone https://github.com/rahuldadhich1517-sys/business-tools-toolkit.git
cd business-tools-toolkit

# Install dependencies
npm install

# Run typecheck
npm run typecheck

# Run test suite
npm run test:run

# Build dual ESM/CommonJS distribution
npm run build
```

---

## 13. Tests and Coverage

The package is verified by a 93-test Vitest test suite covering unit behaviors, edge cases, XSS attempts, decimal rounding boundaries, and cross-utility integrations:

```bash
npm run test:coverage
```

Current test metrics:
- **Test Files**: 11 passed (100%)
- **Tests**: 93 passed (100%)
- **Lines Coverage**: >90%
- **Functions Coverage**: >92%

---

## 14. Build and Packaging

Built using `tsup` targeting ES2022 with dual output:
- `dist/index.js` (ESM) & `dist/index.cjs` (CJS)
- `dist/browser.js` (ESM) & `dist/browser.cjs` (CJS)
- Full TypeScript declaration files (`.d.ts` and `.d.cts`)

Pack dry-run verification ensures only build artifacts, package metadata, and documentation are included in the published tarball:

```bash
npm pack --dry-run
```

---

## 15. Supported Environments

- **Node.js**: >= 18.0.0
- **Browsers**: Modern evergreen browsers supporting ES2022 (Chrome, Firefox, Safari, Edge)

---

## 16. Known Limitations

- **Signature Pad**: Drawing requires a DOM `HTMLCanvasElement` context. In non-browser environments, use the headless `serializeSignatureSvg` utility.
- **Embedded Fonts**: PDF rendering currently uses built-in StandardFonts (Helvetica, Helvetica-Bold, Helvetica-Oblique) for zero-dependency portability and small bundle footprint.
- **Payment Link Verification**: PayPal link generation constructs URLs only; it does not verify payment processing or merchant authorization.

---

## 17. Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub:
[https://github.com/rahuldadhich1517-sys/business-tools-toolkit](https://github.com/rahuldadhich1517-sys/business-tools-toolkit)

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Run tests and typecheck (`npm run typecheck && npm run test:run`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 18. License

This project is licensed under the [MIT License](LICENSE).

---

## 19. Changelog

### 0.1.0 (2026-10-24)

- **Initial Production Release**
- Implemented 9 core business utilities:
  - `cover-letter`: Strictly factual cover letter generator.
  - `digital-business-card`: vCard 3.0 / 4.0 generation and escaped HTML business cards.
  - `email-signature`: Table-based HTML signature with conservative inline CSS.
  - `signature-draw`: Canvas pointer capture pad and headless SVG serializer.
  - `invoice-generate`: Single-truth invoice calculation engine and vector PDF export.
  - `paypal-link`: Secure standard web checkout and PayPal.Me link builder.
  - `privacy-policy`: Customizable privacy policy draft generator.
  - `resume-build`: Structured resume builder with multi-page vector PDF export.
  - `terms-generate`: Terms of service draft generator with conditional clauses.
- Added browser entry point (`@rahul_dadhich15/business-tools-toolkit/browser`) with file download helpers.
- Comprehensive test suite with 93 passing tests and >90% coverage.
