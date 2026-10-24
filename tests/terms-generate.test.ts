import { describe, expect, it } from 'vitest';
import { ValidationError } from '../src/shared/errors';
import { generateTerms } from '../src/terms-generate';

describe('Terms of Service Generator', () => {
  const fullTermsInput = {
    businessName: 'DevFlow SaaS',
    contactEmail: 'legal@devflow.example',
    websiteUrl: 'https://devflow.example',
    serviceDescription: 'developer productivity tools, cloud workspaces, and continuous deployment automation',
    operatorDetails: 'DevFlow Technologies Delaware Inc., 1209 Orange St, Wilmington, DE',
    eligibilityAge: 16,
    userAccounts: {
      allowRegistration: true,
      accountRules: ['One account per developer', 'OAuth or two-factor authentication required'],
    },
    acceptableUse: [
      'Do not perform denial-of-service testing without written authorization',
      'Do not reverse engineer platform APIs or runtime containers',
    ],
    userGeneratedContent: {
      allowed: true,
      licenseGranted: 'You retain full ownership of your code repositories and pipeline definitions.',
      prohibitedContent: ['Malicious binaries', 'Stolen proprietary code'],
    },
    subscriptions: {
      enabled: true,
      billingCycles: ['Monthly', 'Annual (15% discount)'],
      autoRenew: true,
      freeTrial: true,
    },
    refunds: {
      allowed: true,
      periodDays: 14,
      conditions: 'Refund requests must be submitted within 14 days of the initial subscription billing.',
    },
    intellectualProperty: 'DevFlow, the DevFlow logo, and proprietary orchestration engines are trademarks of DevFlow Inc.',
    governingLaw: 'the State of Delaware, United States',
    disputeResolution: 'Binding individual arbitration in New Castle County, Delaware under AAA rules.',
    effectiveDate: '2026-10-24',
  };

  it('generates complete terms of service with conditional clauses', () => {
    const terms = generateTerms(fullTermsInput, { format: 'markdown' });

    expect(terms.format).toBe('markdown');
    expect(terms.content).toContain('# Terms of Service for DevFlow SaaS');
    expect(terms.content).toContain('LEGAL DISCLAIMER');
    expect(terms.content).toContain('1. Agreement to Terms');
    expect(terms.content).toContain('2. Eligibility');
    expect(terms.content).toContain('at least 16 years of age');
    expect(terms.content).toContain('3. User Accounts');
    expect(terms.content).toContain('OAuth or two-factor authentication required');
    expect(terms.content).toContain('4. Acceptable Use Policy');
    expect(terms.content).toContain('5. User-Generated Content');
    expect(terms.content).toContain('6. Subscriptions and Billing');
    expect(terms.content).toContain('7. Refund Policy');
    expect(terms.content).toContain('14 days');
    expect(terms.content).toContain('12. Governing Law and Dispute Resolution');
    expect(terms.content).toContain('State of Delaware, United States');
    expect(terms.warnings.length).toBe(0);
    expect(terms.metadata.sectionsIncluded).toContain('Subscriptions and Billing');
  });

  it('omits subscription and refund clauses when not enabled', () => {
    const freeServiceInput = {
      businessName: 'OpenSource Community Hub',
      contactEmail: 'contact@hub.example',
      subscriptions: false,
    };
    const terms = generateTerms(freeServiceInput);

    expect(terms.content).not.toContain('Subscriptions and Billing');
    expect(terms.content).not.toContain('Refund Policy');
    expect(terms.warnings).toContain(
      'Governing law and jurisdiction are not specified. It is critical to define governing state or country law.'
    );
  });

  it('supports plain-text output format', () => {
    const textTerms = generateTerms(fullTermsInput, { format: 'text' });
    expect(textTerms.format).toBe('text');
    expect(textTerms.content).toContain('TERMS OF SERVICE FOR DEVFLOW SAAS');
    expect(textTerms.content).not.toContain('# Terms of Service');
  });

  it('validates required fields', () => {
    expect(() => generateTerms({ businessName: '', contactEmail: 'legal@example.com' })).toThrow(
      ValidationError
    );
    expect(() => generateTerms({ businessName: 'Test', contactEmail: 'invalid' })).toThrow(
      ValidationError
    );
  });

  it('includes legal disclaimer', () => {
    const terms = generateTerms(fullTermsInput);
    expect(terms.disclaimer).toContain('LEGAL DISCLAIMER');
    expect(terms.disclaimer).toContain('does not constitute legal advice');
    expect(terms.content).toContain('LEGAL DISCLAIMER');
  });

  it('is deterministic for identical input', () => {
    const res1 = generateTerms(fullTermsInput);
    const res2 = generateTerms(fullTermsInput);
    expect(res1.content).toBe(res2.content);
  });
});
