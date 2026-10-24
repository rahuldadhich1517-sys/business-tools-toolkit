export type TermsFormat = 'markdown' | 'text';

export interface TermsSubscriptionsConfig {
  enabled: boolean;
  billingCycles?: string[];
  autoRenew?: boolean;
  freeTrial?: boolean;
  details?: string;
}

export interface TermsRefundConfig {
  allowed: boolean;
  periodDays?: number;
  conditions?: string;
}

export interface TermsInput {
  businessName: string;
  contactEmail: string;
  websiteUrl?: string;
  serviceDescription?: string;
  operatorDetails?: string;
  eligibilityAge?: number;
  userAccounts?: boolean | { allowRegistration: boolean; accountRules?: string[] };
  acceptableUse?: string[];
  userGeneratedContent?: boolean | { allowed: boolean; licenseGranted?: string; prohibitedContent?: string[] };
  intellectualProperty?: string;
  subscriptions?: boolean | TermsSubscriptionsConfig;
  refunds?: boolean | TermsRefundConfig;
  termination?: string;
  serviceAvailability?: string;
  warrantyDisclaimer?: string;
  limitationOfLiability?: string;
  governingLaw?: string;
  disputeResolution?: string;
  effectiveDate?: string;
}

export interface TermsOptions {
  format?: TermsFormat;
  usePlaceholders?: boolean;
}

export interface TermsResult {
  content: string;
  format: TermsFormat;
  warnings: string[];
  disclaimer: string;
  metadata: {
    businessName: string;
    effectiveDate: string;
    sectionsIncluded: string[];
  };
}
