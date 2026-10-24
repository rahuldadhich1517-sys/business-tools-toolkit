import { validateEmail, validateRequired, validateString } from '../shared/validation';
import type { TermsFormat, TermsInput, TermsOptions, TermsResult } from './types';

const LEGAL_DISCLAIMER =
  'LEGAL DISCLAIMER: This document is a customized draft prepared for informational purposes based on your provided inputs. It does not constitute legal advice, attorney-client representation, or guaranteed regulatory validity or enforceability. You must have these terms reviewed by qualified legal counsel in your operating jurisdiction before publishing.';

export function generateTerms(input: TermsInput, options: TermsOptions = {}): TermsResult {
  validateRequired(input, 'TermsInput');
  const businessName = validateString(input.businessName, 'businessName');
  const contactEmail = validateEmail(input.contactEmail, 'contactEmail');

  const format: TermsFormat = options.format ?? 'markdown';
  const usePlaceholders = options.usePlaceholders ?? false;
  const effectiveDate = input.effectiveDate?.trim() || new Date().toISOString().split('T')[0]!;

  const warnings: string[] = [];
  const sectionsIncluded: string[] = [];

  if (!input.governingLaw?.trim()) {
    warnings.push('Governing law and jurisdiction are not specified. It is critical to define governing state or country law.');
  }
  if (!input.serviceDescription?.trim()) {
    warnings.push('Specific service description is not provided. A clear scope of service is recommended.');
  }

  const sections: { title: string; content: string }[] = [];

  // 1. Acceptance of Terms
  const operatorText = input.operatorDetails ? ` ("${businessName}", operated by ${input.operatorDetails.trim()})` : ` ("${businessName}")`;
  const webText = input.websiteUrl ? ` at ${input.websiteUrl.trim()}` : '';
  const descText = input.serviceDescription ? ` We provide: ${input.serviceDescription.trim()}.` : '';
  sections.push({
    title: '1. Agreement to Terms',
    content: `These Terms of Service ("Terms") constitute a legally binding agreement between you and ${operatorText}${webText}.${descText} By accessing or using our services, you agree to be bound by these Terms. If you do not agree to these Terms, do not access or use the services.`,
  });
  sectionsIncluded.push('Agreement to Terms');

  // 2. Eligibility
  const minAge = input.eligibilityAge ?? 13;
  sections.push({
    title: '2. Eligibility',
    content: `You must be at least ${minAge} years of age to access or use our services. By using our services, you represent and warrant that you meet this requirement and possess the legal capacity to enter into these Terms.`,
  });
  sectionsIncluded.push('Eligibility');

  // 3. User Accounts (Conditional)
  if (input.userAccounts) {
    let accContent = 'You may be required to register for an account to access certain features. You agree to provide accurate, current, and complete information during registration and keep your account credentials confidential. You are solely responsible for all activities that occur under your account.';
    if (typeof input.userAccounts === 'object' && input.userAccounts.accountRules && input.userAccounts.accountRules.length > 0) {
      accContent += `\n\nAccount Rules:\n${input.userAccounts.accountRules.map((r) => `• ${r}`).join('\n')}`;
    }
    sections.push({ title: '3. User Accounts', content: accContent });
    sectionsIncluded.push('User Accounts');
  }

  // 4. Acceptable Use
  const defaultRules = [
    'Violate any applicable local, state, national, or international law or regulation.',
    'Infringe upon the intellectual property or privacy rights of any third party.',
    'Transmit malware, viruses, worms, or destructive code.',
    'Interfere with, compromise, or disrupt the integrity or security of our systems.',
  ];
  const rules = input.acceptableUse && input.acceptableUse.length > 0 ? input.acceptableUse : defaultRules;
  sections.push({
    title: '4. Acceptable Use Policy',
    content: `You agree not to engage in any prohibited conduct, including without limitation:\n${rules.map((r) => `• ${r}`).join('\n')}`,
  });
  sectionsIncluded.push('Acceptable Use');

  // 5. User-Generated Content (Conditional)
  if (input.userGeneratedContent) {
    let ugcContent = 'Our service may allow you to post, submit, or store content ("User Content"). You retain ownership of your User Content. By submitting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, host, reproduce, and display such content solely to operate and improve the service.';
    if (typeof input.userGeneratedContent === 'object') {
      if (input.userGeneratedContent.licenseGranted) {
        ugcContent = input.userGeneratedContent.licenseGranted;
      }
      if (input.userGeneratedContent.prohibitedContent && input.userGeneratedContent.prohibitedContent.length > 0) {
        ugcContent += `\n\nProhibited User Content:\n${input.userGeneratedContent.prohibitedContent.map((c) => `• ${c}`).join('\n')}`;
      }
    }
    sections.push({ title: '5. User-Generated Content', content: ugcContent });
    sectionsIncluded.push('User-Generated Content');
  }

  // 6. Subscriptions and Payments (Conditional)
  if (input.subscriptions) {
    let subContent = 'Certain services may require payment or paid subscriptions. By purchasing, you authorize us and our third-party payment processors to charge your selected payment method.';
    if (typeof input.subscriptions === 'object') {
      if (input.subscriptions.billingCycles && input.subscriptions.billingCycles.length > 0) {
        subContent += ` Billing cycles available: ${input.subscriptions.billingCycles.join(', ')}.`;
      }
      if (input.subscriptions.autoRenew) {
        subContent += ' Subscriptions renew automatically unless cancelled prior to the end of the current billing cycle.';
      }
      if (input.subscriptions.freeTrial) {
        subContent += ' Any free trial offered will convert to a paid subscription at the conclusion of the trial period unless cancelled.';
      }
      if (input.subscriptions.details?.trim()) {
        subContent += `\n\n${input.subscriptions.details.trim()}`;
      }
    }
    sections.push({ title: '6. Subscriptions and Billing', content: subContent });
    sectionsIncluded.push('Subscriptions and Billing');
  }

  // 7. Refund Policy (Conditional)
  if (input.refunds !== undefined) {
    let refundContent = '';
    if (typeof input.refunds === 'boolean') {
      refundContent = input.refunds
        ? 'Refunds may be requested within a reasonable period following purchase subject to verification.'
        : 'All payments and fees are strictly non-refundable except where required by applicable consumer law.';
    } else {
      if (input.refunds.allowed) {
        const days = input.refunds.periodDays ? ` within ${input.refunds.periodDays} days of purchase` : '';
        refundContent = `Refunds are available${days}. ${input.refunds.conditions ?? ''}`.trim();
      } else {
        refundContent = `All purchases are final and non-refundable. ${input.refunds.conditions ?? ''}`.trim();
      }
    }
    sections.push({ title: '7. Refund Policy', content: refundContent });
    sectionsIncluded.push('Refund Policy');
  }

  // 8. Intellectual Property
  const ipText = input.intellectualProperty?.trim() ||
    `All trademarks, service marks, logos, source code, designs, and content created by ${businessName} are our exclusive property or licensed to us, and are protected by applicable intellectual property laws.`;
  sections.push({ title: '8. Intellectual Property', content: ipText });
  sectionsIncluded.push('Intellectual Property');

  // 9. Termination
  const termText = input.termination?.trim() ||
    'We reserve the right to suspend or terminate your access to our services immediately, without prior notice or liability, for any breach of these Terms or fraudulent activity. Upon termination, your right to use the service ceases immediately.';
  sections.push({ title: '9. Termination', content: termText });
  sectionsIncluded.push('Termination');

  // 10. Disclaimers of Warranties
  const warrantyText = input.warrantyDisclaimer?.trim() ||
    'THE SERVICES ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.';
  sections.push({ title: '10. Disclaimer of Warranties', content: warrantyText });
  sectionsIncluded.push('Warranty Disclaimer');

  // 11. Limitation of Liability
  const liabilityText = input.limitationOfLiability?.trim() ||
    'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUE, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICES.';
  sections.push({ title: '11. Limitation of Liability', content: liabilityText });
  sectionsIncluded.push('Limitation of Liability');

  // 12. Governing Law and Dispute Resolution
  let govText = '';
  if (input.governingLaw?.trim()) {
    govText = `These Terms shall be governed by and construed in accordance with the laws of ${input.governingLaw.trim()}, without regard to its conflict of law principles.`;
  } else if (usePlaceholders) {
    govText = 'These Terms shall be governed by the laws of [Insert Governing State/Country], without regard to conflict of law principles.';
  } else {
    govText = 'These Terms shall be governed by and construed in accordance with applicable local laws.';
  }

  if (input.disputeResolution?.trim()) {
    govText += `\n\nDispute Resolution: ${input.disputeResolution.trim()}`;
  }
  sections.push({ title: '12. Governing Law and Dispute Resolution', content: govText });
  sectionsIncluded.push('Governing Law');

  // 13. Contact Information
  sections.push({
    title: '13. Contact Information',
    content: `For questions regarding these Terms of Service, please contact us at:\nEmail: ${contactEmail}`,
  });
  sectionsIncluded.push('Contact Information');

  // Format
  let formatted = '';
  if (format === 'markdown') {
    const header = `# Terms of Service for ${businessName}\n\n**Effective Date:** ${effectiveDate}\n\n> *${LEGAL_DISCLAIMER}*\n\n`;
    const body = sections
      .map((s) => `## ${s.title}\n\n${s.content}`)
      .join('\n\n');
    formatted = header + body;
  } else {
    const header = `TERMS OF SERVICE FOR ${businessName.toUpperCase()}\nEffective Date: ${effectiveDate}\n\n${LEGAL_DISCLAIMER}\n\n` + '='.repeat(60) + '\n\n';
    const body = sections
      .map((s) => `${s.title.toUpperCase()}\n${s.content}`)
      .join('\n\n' + '-'.repeat(40) + '\n\n');
    formatted = header + body;
  }

  return {
    content: formatted,
    format,
    warnings,
    disclaimer: LEGAL_DISCLAIMER,
    metadata: {
      businessName,
      effectiveDate,
      sectionsIncluded,
    },
  };
}
