export type PrivacyPolicyFormat = 'markdown' | 'text';

export interface PrivacyPolicyCookiesConfig {
  enabled: boolean;
  types?: Array<'essential' | 'analytics' | 'advertising' | 'preferences'>;
  details?: string;
}

export interface PrivacyPolicyInput {
  businessName: string;
  contactEmail: string;
  websiteUrl?: string;
  ownerName?: string;
  jurisdiction?: string;
  effectiveDate?: string;
  personalDataCollected?: string[];
  sensitiveDataCollected?: string[];
  collectionMethods?: string[];
  processingPurposes?: string[];
  cookies?: boolean | PrivacyPolicyCookiesConfig;
  analytics?: boolean | string[];
  advertising?: boolean | string[];
  paymentProcessors?: string[];
  thirdParties?: string[];
  dataRetention?: string;
  userRights?: string[];
  childrenData?: boolean | string;
  securityMeasures?: string[];
  internationalTransfers?: boolean | string;
  dpoContact?: string;
}

export interface PrivacyPolicyOptions {
  format?: PrivacyPolicyFormat; // Default 'markdown'
  usePlaceholders?: boolean; // Default false
}

export interface PrivacyPolicyResult {
  content: string;
  format: PrivacyPolicyFormat;
  warnings: string[];
  disclaimer: string;
  metadata: {
    businessName: string;
    effectiveDate: string;
    sectionsIncluded: string[];
  };
}
