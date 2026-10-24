export type PayPalLinkMethod = 'standard' | 'paypal.me';

export interface PayPalLinkInput {
  merchant: string; // PayPal email or PayPal.Me username/handle
  amount: number;
  currency?: string; // e.g. 'USD'
  description?: string; // Item name / payment description
  reference?: string; // Item number or invoice ID
  invoiceId?: string;
  custom?: string; // Custom tracking string
  returnUrl?: string; // Safe return URL upon payment completion
  cancelUrl?: string; // Safe cancel URL
  noShipping?: boolean;
}

export interface PayPalLinkOptions {
  method?: PayPalLinkMethod; // Default 'standard'
}

export interface PayPalLinkResult {
  url: string;
  method: PayPalLinkMethod;
  targetUrl: URL;
}
