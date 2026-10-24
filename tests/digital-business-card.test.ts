import { describe, expect, it } from 'vitest';
import {
  buildDigitalBusinessCard,
  escapeVCardValue,
  foldVCardLine,
  generateVCard,
  getVCardFilename,
  getVCardMimeType,
} from '../src/digital-business-card';
import { ValidationError } from '../src/shared/errors';

describe('Digital Business Card & vCard Generator', () => {
  const completeInput = {
    fullName: 'Rahul Dadhich',
    firstName: 'Rahul',
    lastName: 'Dadhich',
    organization: 'Acme Technologies Inc.',
    jobTitle: 'Lead Software Architect',
    email: ['rahul@example.com', 'rahul.personal@example.com'],
    phone: ['+1-555-0199', '+1-555-0200'],
    website: 'https://rahuldadhich.dev',
    address: {
      street: '123 Innovation Way',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'USA',
    },
    notes: 'Available for technical consulting and open-source collaborations.',
    socialLinks: [
      { platform: 'GitHub', url: 'https://github.com/rahuldadhich1517-sys' },
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/rahuldadhich' },
    ],
    photoUrl: 'https://example.com/avatar.jpg',
  };

  it('escapes commas, semicolons, backslashes, and newlines in vCard values', () => {
    const raw = 'Text with \\ backslash; semicolon, comma and\nnewline';
    const escaped = escapeVCardValue(raw);
    expect(escaped).toBe('Text with \\\\ backslash\\; semicolon\\, comma and\\nnewline');
  });

  it('folds lines longer than 75 octets according to RFC specifications', () => {
    const longLine = 'NOTE:' + 'A'.repeat(120);
    const folded = foldVCardLine(longLine);
    expect(folded).toContain('\r\n ');
    const parts = folded.split('\r\n ');
    expect(new TextEncoder().encode(parts[0]!).length).toBeLessThanOrEqual(75);
  });

  it('generates standard vCard 4.0 format', () => {
    const vcard = generateVCard(completeInput, { version: '4.0' });

    expect(vcard).toContain('BEGIN:VCARD\r\n');
    expect(vcard).toContain('VERSION:4.0\r\n');
    expect(vcard).toContain('FN:Rahul Dadhich\r\n');
    expect(vcard).toContain('N:Dadhich;Rahul;;;\r\n');
    expect(vcard).toContain('ORG:Acme Technologies Inc.\r\n');
    expect(vcard).toContain('TITLE:Lead Software Architect\r\n');
    expect(vcard).toContain('EMAIL;TYPE=work:rahul@example.com\r\n');
    expect(vcard).toContain('TEL;TYPE=work,voice:+1-555-0199\r\n');
    expect(vcard).toContain('URL:https://rahuldadhich.dev\r\n');
    expect(vcard).toContain('ADR;TYPE=work:;;123 Innovation Way;San Francisco;CA;94105;USA\r\n');
    expect(vcard).toContain('END:VCARD\r\n');
  });

  it('generates standard vCard 3.0 format when requested', () => {
    const vcard = generateVCard(completeInput, { version: '3.0' });
    expect(vcard).toContain('VERSION:3.0\r\n');
    expect(vcard).toContain('EMAIL;TYPE=INTERNET,WORK:rahul@example.com\r\n');
    expect(vcard).toContain('TEL;TYPE=WORK,VOICE:+1-555-0199\r\n');
  });

  it('generates minimal vCard with just fullName', () => {
    const vcard = generateVCard({ fullName: 'Alice Johnson' });
    expect(vcard).toContain('FN:Alice Johnson\r\n');
    expect(vcard).toContain('N:Johnson;Alice;;;\r\n');
    expect(vcard).not.toContain('ORG:');
    expect(vcard).not.toContain('TEL;');
  });

  it('validates missing required fullName', () => {
    expect(() => generateVCard({ fullName: '' })).toThrow(ValidationError);
  });

  it('correctly provides MIME types and filenames', () => {
    expect(getVCardMimeType('4.0')).toBe('text/vcard; charset=utf-8');
    expect(getVCardMimeType('3.0')).toBe('text/x-vcard; charset=utf-8');
    expect(getVCardFilename('Rahul Dadhich')).toBe('Rahul_Dadhich.vcf');
    expect(getVCardFilename('Rahul Dadhich', 'custom-card')).toBe('custom-card.vcf');
  });

  it('builds digital business card with safely escaped HTML', () => {
    const maliciousInput = {
      fullName: '<script>alert("hacked")</script>',
      organization: 'Evil Corp & Associates',
      jobTitle: '<img src=x onerror=alert(1)>',
      email: 'test@example.com',
      website: 'javascript:alert(1)', // should be excluded from HTML links
    };

    const card = buildDigitalBusinessCard(maliciousInput);
    expect(card.html).not.toContain('<script>');
    expect(card.html).toContain('&lt;script&gt;alert(&quot;hacked&quot;)&lt;/script&gt;');
    expect(card.html).toContain('&amp; Associates');
    expect(card.html).not.toContain('javascript:alert(1)');
    expect(card.mimeType).toBe('text/vcard; charset=utf-8');
  });
});
