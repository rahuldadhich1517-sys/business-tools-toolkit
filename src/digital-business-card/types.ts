export type VCardVersion = '3.0' | '4.0';

export interface VCardAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface VCardSocialLink {
  platform: string;
  url: string;
}

export interface VCardInput {
  fullName: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  jobTitle?: string;
  email?: string | string[];
  phone?: string | string[];
  website?: string;
  address?: VCardAddress;
  notes?: string;
  socialLinks?: VCardSocialLink[];
  photoUrl?: string;
  version?: VCardVersion;
  revisionTimestamp?: string;
}

export interface VCardOptions {
  version?: VCardVersion;
  filename?: string;
  revisionTimestamp?: string;
}

export interface DigitalBusinessCardResult {
  vcard: string;
  html: string;
  data: VCardInput;
  filename: string;
  mimeType: string;
}
