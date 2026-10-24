import { describe, expect, it } from 'vitest';
import { generateEmailSignature } from '../src/email-signature';
import { ValidationError } from '../src/shared/errors';

describe('Email Signature Generator', () => {
  const fullInput = {
    name: 'Sarah Connor',
    jobTitle: 'Director of Operations',
    company: 'SkyNet Defense Systems <br>',
    email: 'sarah.c@skynet.example',
    phone: '+1-555-0144',
    website: 'https://skynet.example',
    address: '100 Cyberdyne Blvd, Los Angeles, CA',
    logoUrl: 'https://skynet.example/logo.png',
    socialLinks: [
      { platform: 'LinkedIn', url: 'https://linkedin.com/in/sarahconnor' },
      { platform: 'Twitter', url: 'https://twitter.com/sarahconnor' },
    ],
    brandColors: {
      primary: '#0284c7',
      secondary: '#475569',
      text: '#0f172a',
    },
    disclaimer: 'CONFIDENTIAL: The contents of this email are confidential.',
  };

  it('generates table-based HTML email signature with inline styling', () => {
    const sig = generateEmailSignature(fullInput);

    expect(sig.html).toContain('<table cellpadding="0" cellspacing="0" border="0"');
    expect(sig.html).toContain('Sarah Connor');
    expect(sig.html).toContain('Director of Operations | SkyNet Defense Systems &lt;br&gt;');
    expect(sig.html).toContain('href="mailto:sarah.c@skynet.example"');
    expect(sig.html).toContain('href="tel:+15550144"');
    expect(sig.html).toContain('href="https://skynet.example"');
    expect(sig.html).toContain('src="https://skynet.example/logo.png"');
    expect(sig.html).toContain('color:#0284c7');
    expect(sig.html).toContain('CONFIDENTIAL: The contents of this email are confidential.');
    expect(sig.metadata.hasLogo).toBe(true);
    expect(sig.metadata.hasDisclaimer).toBe(true);
  });

  it('generates plain-text alternative', () => {
    const sig = generateEmailSignature(fullInput);
    expect(sig.text).toContain('Sarah Connor');
    expect(sig.text).toContain('Director of Operations | SkyNet Defense Systems <br>');
    expect(sig.text).toContain('Email: sarah.c@skynet.example');
    expect(sig.text).toContain('Phone: +1-555-0144');
    expect(sig.text).toContain('CONFIDENTIAL: The contents of this email are confidential.');
  });

  it('generates minimal signature when optional fields are omitted', () => {
    const minimal = { name: 'Bob Vance' };
    const sig = generateEmailSignature(minimal);

    expect(sig.html).toContain('Bob Vance');
    expect(sig.html).not.toContain('<img');
    expect(sig.html).not.toContain('Email:');
    expect(sig.metadata.hasLogo).toBe(false);
    expect(sig.metadata.hasDisclaimer).toBe(false);
  });

  it('safely escapes HTML injection in all user-supplied fields', () => {
    const dangerous = {
      name: '<script>alert(1)</script>',
      jobTitle: '<b>Hacker</b>',
      company: 'Evil & "Co"',
      email: 'test@example.com',
      website: 'javascript:alert(document.cookie)', // Must be excluded from link
      logoUrl: 'javascript:alert(2)', // Must not be used as img src
      disclaimer: '<img src=x onerror=alert(1)>',
    };

    const sig = generateEmailSignature(dangerous);
    expect(sig.html).not.toContain('<script>');
    expect(sig.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(sig.html).toContain('&lt;b&gt;Hacker&lt;/b&gt;');
    expect(sig.html).toContain('Evil &amp; &quot;Co&quot;');
    expect(sig.html).not.toContain('javascript:alert');
    expect(sig.html).not.toContain('<img src=x');
    expect(sig.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('validates brand colors and falls back to safe defaults on invalid color values', () => {
    const badColors = {
      name: 'Alice',
      brandColors: {
        primary: 'red; background: url(evil.com)',
        secondary: 'invalid-css-color',
      },
    };
    const sig = generateEmailSignature(badColors);
    // Should fall back to safe default #1d4ed8
    expect(sig.html).toContain('#1d4ed8');
    expect(sig.html).not.toContain('evil.com');
  });

  it('validates missing required name', () => {
    expect(() => generateEmailSignature({ name: '' })).toThrow(ValidationError);
  });

  it('is deterministic for identical input', () => {
    const sig1 = generateEmailSignature(fullInput);
    const sig2 = generateEmailSignature(fullInput);
    expect(sig1.html).toBe(sig2.html);
    expect(sig1.text).toBe(sig2.text);
  });
});
