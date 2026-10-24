import { validateEmail, validateRequired, validateString } from '../shared/validation';
import type {
  PrivacyPolicyFormat,
  PrivacyPolicyInput,
  PrivacyPolicyOptions,
  PrivacyPolicyResult,
} from './types';

const LEGAL_DISCLAIMER =
  'LEGAL DISCLAIMER: This document is a customized draft prepared for informational purposes based on your provided inputs. It does not constitute legal advice, attorney-client representation, or guaranteed regulatory compliance (e.g., GDPR, CCPA/CPRA, or national data protection laws). You must have this policy reviewed by qualified legal counsel in your operating jurisdiction before publishing.';

export function generatePrivacyPolicy(
  input: PrivacyPolicyInput,
  options: PrivacyPolicyOptions = {}
): PrivacyPolicyResult {
  validateRequired(input, 'PrivacyPolicyInput');
  const businessName = validateString(input.businessName, 'businessName');
  const contactEmail = validateEmail(input.contactEmail, 'contactEmail');

  const format: PrivacyPolicyFormat = options.format ?? 'markdown';
  const usePlaceholders = options.usePlaceholders ?? false;
  const effectiveDate = input.effectiveDate?.trim() || new Date().toISOString().split('T')[0]!;

  const warnings: string[] = [];
  const sectionsIncluded: string[] = [];

  if (!input.jurisdiction?.trim()) {
    warnings.push('Operating jurisdiction is not specified. Certain regional disclosures (GDPR/CCPA/DPA) may require explicit jurisdiction.');
  }
  if (!input.dataRetention?.trim()) {
    warnings.push('Data retention period is not explicitly defined. It is recommended to specify precise retention windows.');
  }
  if (!input.userRights || input.userRights.length === 0) {
    warnings.push('No individual user rights (e.g. access, erasure, objection) were explicitly specified.');
  }

  const sections: { title: string; content: string }[] = [];

  // 1. Introduction
  const entityDesc = input.ownerName ? `${businessName} (operated by ${input.ownerName.trim()})` : businessName;
  const webDesc = input.websiteUrl ? ` on our website at ${input.websiteUrl.trim()}` : '';
  const introText = `This Privacy Policy outlines how ${entityDesc} ("we", "us", or "our") collects, uses, protects, and handles your personal information when you use our services${webDesc}. By accessing or using our services, you acknowledge that you have read and understood this policy.`;
  sections.push({ title: '1. Introduction', content: introText });
  sectionsIncluded.push('Introduction');

  // 2. Information We Collect
  const dataParts: string[] = [];
  if (input.personalDataCollected && input.personalDataCollected.length > 0) {
    const list = input.personalDataCollected.map((d) => d.trim()).filter(Boolean);
    if (list.length > 0) {
      dataParts.push(`Personal Information you directly provide:\n${list.map((i) => `• ${i}`).join('\n')}`);
    }
  } else if (usePlaceholders) {
    dataParts.push('[Specify categories of personal information collected, e.g. name, email, billing address]');
  }

  if (input.sensitiveDataCollected && input.sensitiveDataCollected.length > 0) {
    const sensitive = input.sensitiveDataCollected.map((s) => s.trim()).filter(Boolean);
    if (sensitive.length > 0) {
      dataParts.push(`Sensitive Personal Data:\n${sensitive.map((s) => `• ${s}`).join('\n')}\nWe only process sensitive personal information with your explicit consent or as permitted by applicable law.`);
    }
  }

  if (input.collectionMethods && input.collectionMethods.length > 0) {
    const methods = input.collectionMethods.map((m) => m.trim()).filter(Boolean);
    if (methods.length > 0) {
      dataParts.push(`How We Collect Your Information:\n${methods.map((m) => `• ${m}`).join('\n')}`);
    }
  }

  if (dataParts.length > 0) {
    sections.push({ title: '2. Information We Collect', content: dataParts.join('\n\n') });
    sectionsIncluded.push('Information Collected');
  }

  // 3. How We Use Your Information (Processing Purposes)
  if (input.processingPurposes && input.processingPurposes.length > 0) {
    const purposes = input.processingPurposes.map((p) => p.trim()).filter(Boolean);
    if (purposes.length > 0) {
      sections.push({
        title: '3. How We Use Your Information',
        content: `We process your information for the following specific business purposes:\n${purposes.map((p) => `• ${p}`).join('\n')}`,
      });
      sectionsIncluded.push('Processing Purposes');
    }
  } else if (usePlaceholders) {
    sections.push({
      title: '3. How We Use Your Information',
      content: '[Specify explicit purposes for collecting and processing personal information]',
    });
  }

  // 4. Cookies and Tracking Technologies
  if (input.cookies) {
    let cookieText = '';
    if (typeof input.cookies === 'boolean') {
      cookieText = 'We use cookies and similar tracking technologies to enhance user experience, remember preferences, and analyze service traffic.';
    } else {
      const types = input.cookies.types?.join(', ') || 'essential and analytical';
      cookieText = `We use cookies (${types}) to ensure the proper functionality of our website and services.`;
      if (input.cookies.details?.trim()) {
        cookieText += `\n${input.cookies.details.trim()}`;
      }
    }
    sections.push({ title: '4. Cookies and Tracking Technologies', content: cookieText });
    sectionsIncluded.push('Cookies');
  }

  // 5. Third-Party Services and Processors
  const thirdPartyParts: string[] = [];
  if (input.paymentProcessors && input.paymentProcessors.length > 0) {
    thirdPartyParts.push(`Payment Processors: We utilize third-party payment gateways (${input.paymentProcessors.join(', ')}). Your payment details are submitted directly to these processors and are subject to their respective privacy terms.`);
  }
  if (input.analytics) {
    if (Array.isArray(input.analytics) && input.analytics.length > 0) {
      thirdPartyParts.push(`Analytics Providers: We use ${input.analytics.join(', ')} to analyze user interactions and improve service stability.`);
    } else if (input.analytics === true) {
      thirdPartyParts.push('Analytics Providers: We use privacy-compliant analytics tools to monitor website performance.');
    }
  }
  if (input.advertising) {
    if (Array.isArray(input.advertising) && input.advertising.length > 0) {
      thirdPartyParts.push(`Advertising Partners: We partner with ${input.advertising.join(', ')} for tailored marketing.`);
    }
  }
  if (input.thirdParties && input.thirdParties.length > 0) {
    thirdPartyParts.push(`Other Service Providers: ${input.thirdParties.join(', ')}.`);
  }

  if (thirdPartyParts.length > 0) {
    sections.push({
      title: '5. Third-Party Services and Data Sharing',
      content: `We do not sell your personal data. We share information only with authorized third-party vendors who assist us in operating our platform under confidentiality obligations:\n\n${thirdPartyParts.join('\n\n')}`,
    });
    sectionsIncluded.push('Third-Party Services');
  }

  // 6. Data Retention
  if (input.dataRetention?.trim()) {
    sections.push({ title: '6. Data Retention', content: input.dataRetention.trim() });
    sectionsIncluded.push('Data Retention');
  } else if (usePlaceholders) {
    sections.push({
      title: '6. Data Retention',
      content: '[Define specific retention periods for user account data and logs]',
    });
  }

  // 7. Security Measures
  if (input.securityMeasures && input.securityMeasures.length > 0) {
    const measures = input.securityMeasures.map((m) => m.trim()).filter(Boolean);
    if (measures.length > 0) {
      sections.push({
        title: '7. Data Security',
        content: `We implement technical and organizational safeguards designed to protect personal data from unauthorized access or destruction:\n${measures.map((m) => `• ${m}`).join('\n')}\nHowever, no transmission over the Internet can be guaranteed to be completely secure.`,
      });
      sectionsIncluded.push('Security');
    }
  }

  // 8. User Rights
  if (input.userRights && input.userRights.length > 0) {
    const rights = input.userRights.map((r) => r.trim()).filter(Boolean);
    if (rights.length > 0) {
      sections.push({
        title: '8. Your Rights',
        content: `Depending on your location and applicable law, you may have the following rights regarding your personal data:\n${rights.map((r) => `• ${r}`).join('\n')}\nTo exercise any of these rights, please contact us at ${contactEmail}.`,
      });
      sectionsIncluded.push('User Rights');
    }
  }

  // 9. Children's Privacy
  if (input.childrenData) {
    const childrenText = typeof input.childrenData === 'string'
      ? input.childrenData
      : 'Our services are not intended for or directed toward children under 13 (or under 16 where required by regional law). We do not knowingly collect personal data from minors. If you believe a child has provided us personal data, contact us immediately.';
    sections.push({ title: "9. Children's Privacy", content: childrenText });
    sectionsIncluded.push("Children's Privacy");
  }

  // 10. International Transfers
  if (input.internationalTransfers) {
    const transferText = typeof input.internationalTransfers === 'string'
      ? input.internationalTransfers
      : 'Your information may be transferred to and processed in countries other than the one where you reside, where data protection standards may differ. Appropriate safeguards are maintained for such cross-border transfers.';
    sections.push({ title: '10. International Data Transfers', content: transferText });
    sectionsIncluded.push('International Transfers');
  }

  // 11. Contact Information
  let contactBody = `If you have questions, feedback, or complaints regarding this Privacy Policy, please reach us at:\nEmail: ${contactEmail}`;
  if (input.dpoContact?.trim()) {
    contactBody += `\nData Protection Officer: ${input.dpoContact.trim()}`;
  }
  if (input.jurisdiction?.trim()) {
    contactBody += `\nGoverning Jurisdiction: ${input.jurisdiction.trim()}`;
  }
  sections.push({ title: '11. Contact Us', content: contactBody });
  sectionsIncluded.push('Contact Information');

  // Format Content
  let formatted = '';
  if (format === 'markdown') {
    const header = `# Privacy Policy for ${businessName}\n\n**Effective Date:** ${effectiveDate}\n\n> *${LEGAL_DISCLAIMER}*\n\n`;
    const body = sections
      .map((s) => `## ${s.title}\n\n${s.content}`)
      .join('\n\n');
    formatted = header + body;
  } else {
    const header = `PRIVACY POLICY FOR ${businessName.toUpperCase()}\nEffective Date: ${effectiveDate}\n\n${LEGAL_DISCLAIMER}\n\n` + '='.repeat(60) + '\n\n';
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
