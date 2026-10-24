import { getCurrencyDecimals, roundMoney } from '../shared/currency';
import { ValidationError } from '../shared/errors';
import { isSafeUrl } from '../shared/html';
import { validateNumber, validateRequired, validateString } from '../shared/validation';
import type {
  PayPalLinkInput,
  PayPalLinkMethod,
  PayPalLinkOptions,
  PayPalLinkResult,
} from './types';

export function buildPayPalLink(
  input: PayPalLinkInput,
  options: PayPalLinkOptions = {}
): PayPalLinkResult {
  validateRequired(input, 'PayPalLinkInput');
  const merchant = validateString(input.merchant, 'merchant');
  const amount = validateNumber(input.amount, 'amount', { min: 0.01 });

  const currency = (input.currency ?? 'USD').toUpperCase().trim();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new ValidationError('currency must be a valid 3-letter ISO-4217 currency code', {
      field: 'currency',
    });
  }

  // Validate redirect URLs if supplied
  if (input.returnUrl && !isSafeUrl(input.returnUrl, ['https:'])) {
    throw new ValidationError('returnUrl must be a valid secure HTTPS URL', { field: 'returnUrl' });
  }
  if (input.cancelUrl && !isSafeUrl(input.cancelUrl, ['https:'])) {
    throw new ValidationError('cancelUrl must be a valid secure HTTPS URL', { field: 'cancelUrl' });
  }

  const decimals = getCurrencyDecimals(currency);
  const formattedAmount = roundMoney(amount, decimals).toFixed(decimals);

  const method: PayPalLinkMethod = options.method ?? 'standard';

  let targetUrl: URL;

  if (method === 'paypal.me') {
    // Sanitize handle: letters, numbers, hyphens, underscores
    const cleanHandle = merchant.replace(/^@/, '').trim();
    if (!/^[a-zA-Z0-9_\-.]+$/.test(cleanHandle)) {
      throw new ValidationError(
        'PayPal.Me merchant handle can only contain letters, numbers, periods, hyphens, and underscores',
        { field: 'merchant' }
      );
    }

    targetUrl = new URL(`https://paypal.me/${cleanHandle}/${formattedAmount}${currency}`);
  } else {
    // Standard PayPal Web Payments Standard URL
    targetUrl = new URL('https://www.paypal.com/cgi-bin/webscr');
    targetUrl.searchParams.set('cmd', '_xclick');
    targetUrl.searchParams.set('business', merchant);
    targetUrl.searchParams.set('amount', formattedAmount);
    targetUrl.searchParams.set('currency_code', currency);

    if (input.description?.trim()) {
      targetUrl.searchParams.set('item_name', input.description.trim());
    }
    if (input.reference?.trim()) {
      targetUrl.searchParams.set('item_number', input.reference.trim());
    }
    if (input.invoiceId?.trim()) {
      targetUrl.searchParams.set('invoice', input.invoiceId.trim());
    }
    if (input.custom?.trim()) {
      targetUrl.searchParams.set('custom', input.custom.trim());
    }
    if (input.returnUrl?.trim()) {
      targetUrl.searchParams.set('return', input.returnUrl.trim());
    }
    if (input.cancelUrl?.trim()) {
      targetUrl.searchParams.set('cancel_return', input.cancelUrl.trim());
    }
    if (input.noShipping !== undefined) {
      targetUrl.searchParams.set('no_shipping', input.noShipping ? '1' : '0');
    }
  }

  return {
    url: targetUrl.toString(),
    method,
    targetUrl,
  };
}
