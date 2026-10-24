export interface ResumeContact {
  email: string;
  phone?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface ResumeExperience {
  position: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  highlights: string[];
}

export interface ResumeEducation {
  degree: string;
  institution: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  honors?: string[];
}

export interface ResumeProject {
  name: string;
  description: string;
  technologies?: string[];
  url?: string;
}

export interface ResumeCertification {
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

export interface ResumeLanguage {
  name: string;
  proficiency?: string; // e.g. Native, Fluent, Intermediate
}

export interface ResumeAward {
  title: string;
  issuer: string;
  date?: string;
  description?: string;
}

export interface ResumeInput {
  fullName: string;
  title?: string; // e.g. "Senior Software Engineer"
  contact: ResumeContact;
  summary?: string;
  skills?: string[] | Record<string, string[]>;
  experience?: ResumeExperience[];
  education?: ResumeEducation[];
  projects?: ResumeProject[];
  certifications?: ResumeCertification[];
  languages?: ResumeLanguage[];
  awards?: ResumeAward[];
  sectionOrder?: Array<
    'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'awards'
  >;
}

export interface ResumeOptions {
  format?: 'markdown' | 'text';
}

export interface ResumeResult {
  content: string;
  format: 'markdown' | 'text';
  data: ResumeInput;
  metadata: {
    fullName: string;
    sectionsCount: number;
    experienceCount: number;
    educationCount: number;
  };
}

export interface ResumePdfOptions {
  pageSize?: [number, number]; // Default A4
  primaryColor?: { r: number; g: number; b: number };
}
