import { describe, expect, it } from 'vitest';
import {
  CURRENCY_DECIMALS,
  formatCurrency,
  getCurrencyDecimals,
  roundMoney,
} from '../src/shared/currency';
import { ValidationError } from '../src/shared/errors';
import { escapeHtml, escapeHtmlAttr, isSafeUrl, isValidCssColor } from '../src/shared/html';
import {
  sanitizeFilename,
  validateDate,
  validateEmail,
  validateNumber,
  validateRequired,
  validateString,
  validateUrl,
} from '../src/shared/validation';

describe('Shared Utilities', () => {
  describe('HTML escaping and safety', () => {
    it('escapes special characters', () => {
      expect(escapeHtml('<script>alert("XSS & \'attack\'")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS &amp; &#39;attack&#39;&quot;)&lt;/script&gt;'
      );
    });

    it('handles null and undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtmlAttr(null)).toBe('');
    });

    it('identifies safe and unsafe URLs', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
      expect(isSafeUrl('mailto:test@example.com')).toBe(true);
      expect(isSafeUrl('tel:+1234567890')).toBe(true);
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeUrl('https://example.com/\u0000bad')).toBe(false);
    });

    it('validates CSS colors', () => {
      expect(isValidCssColor('#fff')).toBe(true);
      expect(isValidCssColor('#1d4ed8')).toBe(true);
      expect(isValidCssColor('#1d4ed880')).toBe(true);
      expect(isValidCssColor('rgb(255, 0, 0)')).toBe(true);
      expect(isValidCssColor('rgba(255, 0, 0, 0.5)')).toBe(true);
      expect(isValidCssColor('blue')).toBe(true);
      expect(isValidCssColor('transparent')).toBe(true);
      expect(isValidCssColor('expression(alert(1))')).toBe(false);
      expect(isValidCssColor('red; background: url(evil.com)')).toBe(false);
    });
  });

  describe('Validation', () => {
    it('validates required fields', () => {
      expect(validateRequired('hello', 'test')).toBe('hello');
      expect(() => validateRequired('', 'test')).toThrow(ValidationError);
      expect(() => validateRequired(null, 'test')).toThrow(ValidationError);
      expect(() => validateRequired(undefined, 'test')).toThrow(ValidationError);
    });

    it('validates strings and lengths', () => {
      expect(validateString('  abc  ', 'test')).toBe('abc');
      expect(() => validateString(123, 'test')).toThrow(ValidationError);
      expect(() => validateString('short', 'test', { minLength: 10 })).toThrow(ValidationError);
      expect(() => validateString('long string', 'test', { maxLength: 5 })).toThrow(ValidationError);
      expect(validateString('', 'test', { allowEmpty: true })).toBe('');
    });

    it('validates emails', () => {
      expect(validateEmail('test@example.com')).toBe('test@example.com');
      expect(validateEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
      expect(() => validateEmail('invalid-email')).toThrow(ValidationError);
      expect(() => validateEmail('@domain.com')).toThrow(ValidationError);
      expect(() => validateEmail('test@.com')).toThrow(ValidationError);
    });

    it('validates URLs', () => {
      expect(validateUrl('https://example.com/api')).toBe('https://example.com/api');
      expect(() => validateUrl('javascript:alert(1)')).toThrow(ValidationError);
    });

    it('validates numbers', () => {
      expect(validateNumber(10, 'qty')).toBe(10);
      expect(validateNumber(0, 'qty', { allowZero: true })).toBe(0);
      expect(() => validateNumber(0, 'qty', { allowZero: false })).toThrow(ValidationError);
      expect(() => validateNumber(-5, 'qty')).toThrow(ValidationError);
      expect(() => validateNumber(NaN, 'qty')).toThrow(ValidationError);
      expect(() => validateNumber(Infinity, 'qty')).toThrow(ValidationError);
    });

    it('validates dates', () => {
      expect(validateDate('2026-10-24')).toBe('2026-10-24');
      expect(() => validateDate('not-a-date')).toThrow(ValidationError);
    });

    it('sanitizes filenames', () => {
      expect(sanitizeFilename('my/invoice:2026?.pdf')).toBe('myinvoice2026.pdf');
      expect(sanitizeFilename('   ')).toBe('document');
    });
  });

  describe('Currency and rounding', () => {
    it('returns standard ISO currency decimal counts', () => {
      expect(getCurrencyDecimals('USD')).toBe(2);
      expect(getCurrencyDecimals('EUR')).toBe(2);
      expect(getCurrencyDecimals('JPY')).toBe(0);
      expect(getCurrencyDecimals('BHD')).toBe(3);
      expect(CURRENCY_DECIMALS.KRW).toBe(0);
    });

    it('rounds money without floating point drift', () => {
      expect(roundMoney(1.005, 2)).toBe(1.01);
      expect(roundMoney(10.1234, 2)).toBe(10.12);
      expect(roundMoney(100.5, 0)).toBe(101);
    });

    it('formats currency strings correctly', () => {
      expect(formatCurrency(1250.5, 'USD')).toBe('USD 1,250.50');
      expect(formatCurrency(5000, 'JPY')).toBe('JPY 5,000');
      expect(formatCurrency(45.123, 'BHD')).toBe('BHD 45.123');
    });
  });
});
