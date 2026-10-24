import { describe, expect, it } from 'vitest';
import { buildPayPalLink } from '../src/paypal-link';
import { ValidationError } from '../src/shared/errors';

describe('PayPal Link Builder', () => {
  const standardInput = {
    merchant: 'merchant@business.example',
    amount: 149.99,
    currency: 'USD',
    description: 'Pro Subscription - Annual',
    reference: 'REF-12345',
    invoiceId: 'INV-9988',
    custom: 'user_id_456',
    returnUrl: 'https://business.example/checkout/success',
    cancelUrl: 'https://business.example/checkout/cancel',
    noShipping: true,
  };

  it('builds standard PayPal Web Payments checkout URL with encoded query parameters', () => {
    const result = buildPayPalLink(standardInput);

    expect(result.method).toBe('standard');
    expect(result.url).toContain('https://www.paypal.com/cgi-bin/webscr?');

    const params = result.targetUrl.searchParams;
    expect(params.get('cmd')).toBe('_xclick');
    expect(params.get('business')).toBe('merchant@business.example');
    expect(params.get('amount')).toBe('149.99');
    expect(params.get('currency_code')).toBe('USD');
    expect(params.get('item_name')).toBe('Pro Subscription - Annual');
    expect(params.get('item_number')).toBe('REF-12345');
    expect(params.get('invoice')).toBe('INV-9988');
    expect(params.get('custom')).toBe('user_id_456');
    expect(params.get('return')).toBe('https://business.example/checkout/success');
    expect(params.get('cancel_return')).toBe('https://business.example/checkout/cancel');
    expect(params.get('no_shipping')).toBe('1');
  });

  it('builds PayPal.Me URL with formatted amount and currency', () => {
    const result = buildPayPalLink(
      {
        merchant: 'rahuldadhich',
        amount: 50,
        currency: 'EUR',
      },
      { method: 'paypal.me' }
    );

    expect(result.method).toBe('paypal.me');
    expect(result.url).toBe('https://paypal.me/rahuldadhich/50.00EUR');
  });

  it('formats zero-decimal currencies like JPY appropriately in PayPal.Me links', () => {
    const result = buildPayPalLink(
      {
        merchant: 'tokyobusiness',
        amount: 2500,
        currency: 'JPY',
      },
      { method: 'paypal.me' }
    );
    expect(result.url).toBe('https://paypal.me/tokyobusiness/2500JPY');
  });

  it('validates negative or zero amount', () => {
    expect(() =>
      buildPayPalLink({
        merchant: 'test@example.com',
        amount: 0,
      })
    ).toThrow(ValidationError);

    expect(() =>
      buildPayPalLink({
        merchant: 'test@example.com',
        amount: -25,
      })
    ).toThrow(ValidationError);
  });

  it('validates 3-letter ISO currency code', () => {
    expect(() =>
      buildPayPalLink({
        merchant: 'test@example.com',
        amount: 10,
        currency: 'DOLLARS',
      })
    ).toThrow(ValidationError);
  });

  it('rejects unsafe schemes in redirect URLs', () => {
    expect(() =>
      buildPayPalLink({
        merchant: 'test@example.com',
        amount: 10,
        returnUrl: 'javascript:alert(1)',
      })
    ).toThrow(ValidationError);

    expect(() =>
      buildPayPalLink({
        merchant: 'test@example.com',
        amount: 10,
        cancelUrl: 'http://insecure-site.com/cancel', // must be https
      })
    ).toThrow(ValidationError);
  });

  it('rejects invalid PayPal.Me merchant handles with illegal characters', () => {
    expect(() =>
      buildPayPalLink(
        {
          merchant: 'bad handle with spaces!',
          amount: 10,
        },
        { method: 'paypal.me' }
      )
    ).toThrow(ValidationError);
  });

  it('never embeds private credentials or tokens in the URL', () => {
    const result = buildPayPalLink(standardInput);
    expect(result.url).not.toContain('secret');
    expect(result.url).not.toContain('token');
    expect(result.url).not.toContain('bearer');
  });

  it('is deterministic for identical input', () => {
    const res1 = buildPayPalLink(standardInput);
    const res2 = buildPayPalLink(standardInput);
    expect(res1.url).toBe(res2.url);
  });
});
