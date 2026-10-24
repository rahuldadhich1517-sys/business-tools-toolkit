export const CURRENCY_DECIMALS: Record<string, number> = {
  BHD: 3,
  BIF: 0,
  CLF: 4,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  IQD: 3,
  ISK: 0,
  JOD: 3,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  PYG: 0,
  RWF: 0,
  TND: 3,
  UGX: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
};

export function getCurrencyDecimals(currency = 'USD'): number {
  const code = currency.toUpperCase().trim();
  return CURRENCY_DECIMALS[code] ?? 2;
}

/**
 * Rounds a monetary amount to the required decimal places using standard half-up rounding.
 * Avoids standard JS floating point precision issues.
 */
export function roundMoney(amount: number, decimals?: number): number {
  const dec = decimals ?? 2;
  if (!Number.isFinite(amount)) return 0;
  const factor = 10 ** dec;
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

/**
 * Formats a monetary number into a display string with appropriate decimal places.
 */
export function formatCurrency(amount: number, currency = 'USD', explicitDecimals?: number): string {
  const decimals = explicitDecimals ?? getCurrencyDecimals(currency);
  const rounded = roundMoney(amount, decimals);
  const parts = rounded.toFixed(decimals).split('.');
  const integerPart = parts[0] ?? '0';
  const decimalPart = parts[1];

  // Group thousands
  const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const code = currency.toUpperCase().trim();
  return decimalPart !== undefined ? `${code} ${withCommas}.${decimalPart}` : `${code} ${withCommas}`;
}
