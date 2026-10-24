export interface EmailSignatureSocialLink {
  platform: string;
  url: string;
}

export interface EmailSignatureBrandColors {
  primary?: string; // Accent color for name, icons, links (default: #1d4ed8)
  secondary?: string; // Border or subtitle color (default: #64748b)
  text?: string; // Main text color (default: #334155)
}

export interface EmailSignatureInput {
  name: string;
  jobTitle?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  logoUrl?: string;
  socialLinks?: EmailSignatureSocialLink[];
  brandColors?: EmailSignatureBrandColors;
  disclaimer?: string;
}

export interface EmailSignatureOptions {
  includePlainText?: boolean;
}

export interface EmailSignatureResult {
  html: string;
  text: string;
  metadata: {
    name: string;
    hasLogo: boolean;
    hasDisclaimer: boolean;
  };
}
