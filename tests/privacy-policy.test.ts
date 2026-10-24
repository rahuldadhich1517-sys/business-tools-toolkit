import { describe, expect, it } from 'vitest';
import { generatePrivacyPolicy } from '../src/privacy-policy';
import { ValidationError } from '../src/shared/errors';

describe('Privacy Policy Generator', () => {
  const fullInput = {
    businessName: 'NovaCloud Analytics',
    contactEmail: 'privacy@novacloud.example',
    websiteUrl: 'https://novacloud.example',
    ownerName: 'Nova Technologies Ltd.',
    jurisdiction: 'State of California, United States',
    effectiveDate: '2026-10-24',
    personalDataCollected: ['Full Name', 'Email Address', 'Billing Address', 'IP Address'],
    sensitiveDataCollected: ['Payment card tokens (handled by PCI-DSS compliant processor)'],
    collectionMethods: ['Direct account registration', 'Automated server logging', 'Support ticket forms'],
    processingPurposes: [
      'Provide, maintain, and upgrade our cloud analytics services',
      'Process invoices and monthly subscription payments',
      'Send transactional notifications and security alerts',
    ],
    cookies: {
      enabled: true,
      types: ['essential' as const, 'analytics' as const],
      details: 'We do not sell personal data collected through cookies.',
    },
    analytics: ['Plausible Analytics (privacy-focused)'],
    paymentProcessors: ['Stripe'],
    dataRetention: 'We retain active user account data for the duration of the account plus 12 months after termination.',
    securityMeasures: [
      'TLS 1.3 encryption in transit',
      'AES-256 encryption at rest',
      'Role-based least-privilege access control',
    ],
    userRights: [
      'Right to access personal data',
      'Right to correct inaccurate data',
      'Right to request deletion (erasure)',
      'Right to data portability',
    ],
    childrenData: false,
    internationalTransfers: 'Data is hosted in US and EU AWS regions under Standard Contractual Clauses (SCCs).',
    dpoContact: 'dpo@novacloud.example',
  };

  it('generates a complete Markdown privacy policy with all specified sections', () => {
    const policy = generatePrivacyPolicy(fullInput, { format: 'markdown' });

    expect(policy.format).toBe('markdown');
    expect(policy.content).toContain('# Privacy Policy for NovaCloud Analytics');
    expect(policy.content).toContain('LEGAL DISCLAIMER');
    expect(policy.content).toContain('2. Information We Collect');
    expect(policy.content).toContain('Full Name');
    expect(policy.content).toContain('3. How We Use Your Information');
    expect(policy.content).toContain('4. Cookies and Tracking Technologies');
    expect(policy.content).toContain('5. Third-Party Services and Data Sharing');
    expect(policy.content).toContain('Stripe');
    expect(policy.content).toContain('Plausible Analytics');
    expect(policy.content).toContain('6. Data Retention');
    expect(policy.content).toContain('7. Data Security');
    expect(policy.content).toContain('8. Your Rights');
    expect(policy.content).toContain('11. Contact Us');
    expect(policy.content).toContain('dpo@novacloud.example');
    expect(policy.warnings.length).toBe(0);
    expect(policy.metadata.sectionsIncluded).toContain('Cookies');
  });

  it('generates plain-text formatting when requested', () => {
    const textPolicy = generatePrivacyPolicy(fullInput, { format: 'text' });
    expect(textPolicy.format).toBe('text');
    expect(textPolicy.content).toContain('PRIVACY POLICY FOR NOVACLOUD ANALYTICS');
    expect(textPolicy.content).not.toContain('# Privacy Policy');
  });

  it('omits optional sections when they are not configured', () => {
    const minimal = {
      businessName: 'TinyApp',
      contactEmail: 'contact@tinyapp.example',
    };
    const policy = generatePrivacyPolicy(minimal);

    expect(policy.content).toContain('TinyApp');
    expect(policy.content).toContain('contact@tinyapp.example');
    // Does not invent cookies or payment processors
    expect(policy.content).not.toContain('Payment Processors:');
    expect(policy.content).not.toContain('Analytics Providers:');
    expect(policy.warnings.length).toBeGreaterThan(0); // Jurisdiction, retention warnings
  });

  it('provides placeholders when configured for incomplete questionnaires', () => {
    const minimal = {
      businessName: 'Startup Inc',
      contactEmail: 'legal@startup.example',
    };
    const policy = generatePrivacyPolicy(minimal, { usePlaceholders: true });
    expect(policy.content).toContain('[Specify categories of personal information collected');
    expect(policy.content).toContain('[Define specific retention periods');
  });

  it('validates required fields', () => {
    expect(() => generatePrivacyPolicy({ businessName: '', contactEmail: 'test@example.com' })).toThrow(
      ValidationError
    );
    expect(() => generatePrivacyPolicy({ businessName: 'Test', contactEmail: 'invalid-email' })).toThrow(
      ValidationError
    );
  });

  it('includes clear legal disclaimer that output is a draft and not legal advice', () => {
    const policy = generatePrivacyPolicy(fullInput);
    expect(policy.disclaimer).toContain('LEGAL DISCLAIMER');
    expect(policy.disclaimer).toContain('does not constitute legal advice');
    expect(policy.content).toContain('LEGAL DISCLAIMER');
  });

  it('is deterministic for identical input', () => {
    const res1 = generatePrivacyPolicy(fullInput);
    const res2 = generatePrivacyPolicy(fullInput);
    expect(res1.content).toBe(res2.content);
    expect(res1.warnings).toEqual(res2.warnings);
  });
});
