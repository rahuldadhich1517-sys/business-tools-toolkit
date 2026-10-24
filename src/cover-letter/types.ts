export type CoverLetterTone = 'formal' | 'professional' | 'concise';
export type CoverLetterLength = 'short' | 'medium' | 'detailed';
export type CoverLetterFormat = 'text' | 'markdown';

export interface CoverLetterContactInfo {
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  linkedin?: string;
}

export interface CoverLetterProject {
  title: string;
  description: string;
}

export interface CoverLetterInput {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  contactInfo?: CoverLetterContactInfo;
  hiringManagerName?: string;
  jobDescription?: string;
  relevantExperience?: string | string[];
  skills?: string[];
  achievements?: string[];
  projects?: Array<string | CoverLetterProject>;
  education?: string | string[];
  tone?: CoverLetterTone;
  length?: CoverLetterLength;
  closingStatement?: string;
  customIntro?: string;
  additionalNotes?: string;
  date?: string;
}

export interface CoverLetterOptions {
  format?: CoverLetterFormat;
  tone?: CoverLetterTone;
  length?: CoverLetterLength;
}

export interface CoverLetterResult {
  content: string;
  format: CoverLetterFormat;
  metadata: {
    candidateName: string;
    jobTitle: string;
    companyName: string;
    wordCount: number;
    tone: CoverLetterTone;
    length: CoverLetterLength;
  };
}
