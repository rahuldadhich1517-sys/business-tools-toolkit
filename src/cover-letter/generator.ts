import { validateRequired, validateString } from '../shared/validation';
import type {
  CoverLetterFormat,
  CoverLetterInput,
  CoverLetterLength,
  CoverLetterOptions,
  CoverLetterResult,
  CoverLetterTone,
} from './types';

export function generateCoverLetter(
  input: CoverLetterInput,
  options: CoverLetterOptions = {}
): CoverLetterResult {
  validateRequired(input, 'CoverLetterInput');
  const candidateName = validateString(input.candidateName, 'candidateName');
  const jobTitle = validateString(input.jobTitle, 'jobTitle');
  const companyName = validateString(input.companyName, 'companyName');

  const format: CoverLetterFormat = options.format ?? 'text';
  const tone: CoverLetterTone = options.tone ?? input.tone ?? 'professional';
  const length: CoverLetterLength = options.length ?? input.length ?? 'medium';

  const dateStr = input.date?.trim() || new Date().toISOString().split('T')[0]!;
  const managerGreeting = input.hiringManagerName?.trim()
    ? `Dear ${input.hiringManagerName.trim()},`
    : tone === 'formal'
    ? `Dear Hiring Committee at ${companyName},`
    : `Dear Hiring Team at ${companyName},`;

  const sections: string[] = [];

  // 1. Header (Candidate Contact Info)
  const contactLines: string[] = [candidateName];
  if (input.contactInfo) {
    const { email, phone, address, website, linkedin } = input.contactInfo;
    if (email) contactLines.push(`Email: ${email.trim()}`);
    if (phone) contactLines.push(`Phone: ${phone.trim()}`);
    if (address) contactLines.push(`Address: ${address.trim()}`);
    if (website) contactLines.push(`Website: ${website.trim()}`);
    if (linkedin) contactLines.push(`LinkedIn: ${linkedin.trim()}`);
  }

  if (format === 'markdown') {
    sections.push(`# ${candidateName}\n${contactLines.slice(1).join(' | ')}`);
  } else {
    sections.push(contactLines.join('\n'));
  }

  // 2. Date and Recipient Header
  const recipientBlock = [
    `Date: ${dateStr}`,
    `Hiring Team`,
    companyName,
  ].join('\n');
  sections.push(recipientBlock);

  // 3. Salutation
  sections.push(managerGreeting);

  // 4. Opening Paragraph
  let intro = '';
  if (input.customIntro?.trim()) {
    intro = input.customIntro.trim();
  } else if (tone === 'concise') {
    intro = `I am writing to express my strong interest in the ${jobTitle} position at ${companyName}.`;
  } else if (tone === 'formal') {
    intro = `I am writing to formally submit my application for the ${jobTitle} role currently open at ${companyName}. Having followed ${companyName}'s work, I believe my background aligns directly with the objectives of this role.`;
  } else {
    intro = `I am excited to submit my application for the ${jobTitle} opportunity at ${companyName}. My professional background and practical skills make me well-suited to contribute effectively to your team.`;
  }
  sections.push(intro);

  // 5. Relevant Experience & Achievements (strictly user-supplied facts)
  const bodyParagraphs: string[] = [];

  // Experience
  if (input.relevantExperience) {
    if (Array.isArray(input.relevantExperience)) {
      const items = input.relevantExperience.map((e) => e.trim()).filter(Boolean);
      if (items.length > 0) {
        if (format === 'markdown') {
          bodyParagraphs.push(
            `### Relevant Experience\n${items.map((i) => `- ${i}`).join('\n')}`
          );
        } else {
          bodyParagraphs.push(`Relevant Experience:\n${items.map((i) => `• ${i}`).join('\n')}`);
        }
      }
    } else if (typeof input.relevantExperience === 'string' && input.relevantExperience.trim()) {
      bodyParagraphs.push(input.relevantExperience.trim());
    }
  }

  // Skills (if provided, incorporate strictly user-supplied list)
  if (input.skills && input.skills.length > 0) {
    const validSkills = input.skills.map((s) => s.trim()).filter(Boolean);
    if (validSkills.length > 0) {
      if (length === 'short') {
        bodyParagraphs.push(`Key areas of expertise include: ${validSkills.join(', ')}.`);
      } else {
        bodyParagraphs.push(
          `Throughout my work, I have developed and applied competencies in ${validSkills.join(', ')}.`
        );
      }
    }
  }

  // Achievements
  if (input.achievements && input.achievements.length > 0) {
    const validAchievements = input.achievements.map((a) => a.trim()).filter(Boolean);
    if (validAchievements.length > 0) {
      if (format === 'markdown') {
        bodyParagraphs.push(
          `### Key Achievements\n${validAchievements.map((a) => `- ${a}`).join('\n')}`
        );
      } else {
        bodyParagraphs.push(`Key Achievements:\n${validAchievements.map((a) => `• ${a}`).join('\n')}`);
      }
    }
  }

  // Projects (if detailed or medium)
  if (input.projects && input.projects.length > 0 && length !== 'short') {
    const projectLines = input.projects
      .map((p) => {
        if (typeof p === 'string') return p.trim();
        return `${p.title.trim()}: ${p.description.trim()}`;
      })
      .filter(Boolean);

    if (projectLines.length > 0) {
      if (format === 'markdown') {
        bodyParagraphs.push(`### Relevant Projects\n${projectLines.map((p) => `- ${p}`).join('\n')}`);
      } else {
        bodyParagraphs.push(`Relevant Projects:\n${projectLines.map((p) => `• ${p}`).join('\n')}`);
      }
    }
  }

  // Education
  if (input.education && length === 'detailed') {
    const eduList = Array.isArray(input.education) ? input.education : [input.education];
    const validEdu = eduList.map((e) => e.trim()).filter(Boolean);
    if (validEdu.length > 0) {
      bodyParagraphs.push(`Educational background: ${validEdu.join('; ')}.`);
    }
  }

  // Additional notes
  if (input.additionalNotes?.trim()) {
    bodyParagraphs.push(input.additionalNotes.trim());
  }

  if (bodyParagraphs.length > 0) {
    sections.push(bodyParagraphs.join('\n\n'));
  }

  // 6. Closing Statement
  let closing = '';
  if (input.closingStatement?.trim()) {
    closing = input.closingStatement.trim();
  } else if (tone === 'concise') {
    closing = `Thank you for your time and consideration. I welcome the opportunity to discuss how I can support ${companyName}.`;
  } else if (tone === 'formal') {
    closing = `Thank you for reviewing my application materials. I welcome the opportunity to speak with you regarding this position and look forward to your response.`;
  } else {
    closing = `Thank you for your consideration. I look forward to the possibility of discussing this role in more detail.`;
  }
  sections.push(closing);

  // 7. Sign-off
  const signoff = tone === 'formal' ? 'Respectfully,' : 'Sincerely,';
  sections.push(`${signoff}\n${candidateName}`);

  const content = sections.join('\n\n');
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return {
    content,
    format,
    metadata: {
      candidateName,
      jobTitle,
      companyName,
      wordCount,
      tone,
      length,
    },
  };
}
