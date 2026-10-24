import { validateEmail, validateRequired, validateString } from '../shared/validation';
import type { ResumeInput, ResumeOptions, ResumeResult } from './types';

export function buildResume(input: ResumeInput, options: ResumeOptions = {}): ResumeResult {
  validateRequired(input, 'ResumeInput');
  const fullName = validateString(input.fullName, 'fullName');
  validateRequired(input.contact, 'contact');
  const email = validateEmail(input.contact.email, 'contact.email');

  const format = options.format ?? 'text';
  const lines: string[] = [];

  // Header
  lines.push(fullName);
  if (input.title?.trim()) {
    lines.push(input.title.trim());
  }

  const contactItems: string[] = [email];
  if (input.contact.phone) contactItems.push(input.contact.phone.trim());
  if (input.contact.location) contactItems.push(input.contact.location.trim());
  if (input.contact.website) contactItems.push(input.contact.website.trim());
  if (input.contact.linkedin) contactItems.push(input.contact.linkedin.trim());
  if (input.contact.github) contactItems.push(input.contact.github.trim());
  lines.push(contactItems.join(' | '));
  lines.push('');

  const defaultOrder: Array<
    'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'awards'
  > = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'awards'];

  const order = input.sectionOrder ?? defaultOrder;
  let sectionsCount = 0;

  for (const section of order) {
    if (section === 'summary' && input.summary?.trim()) {
      sectionsCount++;
      lines.push(format === 'markdown' ? '## Professional Summary' : 'PROFESSIONAL SUMMARY');
      lines.push(input.summary.trim());
      lines.push('');
    } else if (section === 'experience' && input.experience && input.experience.length > 0) {
      sectionsCount++;
      lines.push(format === 'markdown' ? '## Work Experience' : 'WORK EXPERIENCE');
      for (const exp of input.experience) {
        const dateRange = exp.current ? `${exp.startDate} - Present` : `${exp.startDate} - ${exp.endDate || ''}`;
        const loc = exp.location ? ` | ${exp.location}` : '';
        lines.push(`${exp.position} at ${exp.company} (${dateRange}${loc})`);
        if (exp.highlights && exp.highlights.length > 0) {
          for (const h of exp.highlights) {
            lines.push(`• ${h.trim()}`);
          }
        }
        lines.push('');
      }
    } else if (section === 'education' && input.education && input.education.length > 0) {
      sectionsCount++;
      lines.push(format === 'markdown' ? '## Education' : 'EDUCATION');
      for (const edu of input.education) {
        const dates = edu.endDate ? ` (${edu.startDate ? `${edu.startDate} - ` : ''}${edu.endDate})` : '';
        const loc = edu.location ? ` | ${edu.location}` : '';
        lines.push(`${edu.degree} - ${edu.institution}${dates}${loc}`);
        if (edu.gpa) lines.push(`GPA: ${edu.gpa}`);
        if (edu.honors && edu.honors.length > 0) {
          for (const honor of edu.honors) {
            lines.push(`• ${honor.trim()}`);
          }
        }
        lines.push('');
      }
    } else if (section === 'skills' && input.skills) {
      sectionsCount++;
      lines.push(format === 'markdown' ? '## Skills' : 'SKILLS');
      if (Array.isArray(input.skills)) {
        lines.push(input.skills.join(', '));
      } else {
        for (const [category, items] of Object.entries(input.skills)) {
          lines.push(`${category}: ${items.join(', ')}`);
        }
      }
      lines.push('');
    } else if (section === 'projects' && input.projects && input.projects.length > 0) {
      sectionsCount++;
      lines.push(format === 'markdown' ? '## Projects' : 'PROJECTS');
      for (const proj of input.projects) {
        const link = proj.url ? ` (${proj.url})` : '';
        lines.push(`${proj.name}${link}`);
        lines.push(proj.description);
        if (proj.technologies && proj.technologies.length > 0) {
          lines.push(`Technologies: ${proj.technologies.join(', ')}`);
        }
        lines.push('');
      }
    } else if (section === 'certifications' && input.certifications && input.certifications.length > 0) {
      sectionsCount++;
      lines.push(format === 'markdown' ? '## Certifications' : 'CERTIFICATIONS');
      for (const cert of input.certifications) {
        const date = cert.date ? ` (${cert.date})` : '';
        lines.push(`• ${cert.name} - ${cert.issuer}${date}`);
      }
      lines.push('');
    } else if (section === 'languages' && input.languages && input.languages.length > 0) {
      sectionsCount++;
      lines.push(format === 'markdown' ? '## Languages' : 'LANGUAGES');
      const langItems = input.languages.map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name));
      lines.push(langItems.join(', '));
      lines.push('');
    } else if (section === 'awards' && input.awards && input.awards.length > 0) {
      sectionsCount++;
      lines.push(format === 'markdown' ? '## Honors & Awards' : 'HONORS & AWARDS');
      for (const aw of input.awards) {
        const date = aw.date ? ` (${aw.date})` : '';
        lines.push(`• ${aw.title} - ${aw.issuer}${date}`);
        if (aw.description) lines.push(`  ${aw.description}`);
      }
      lines.push('');
    }
  }

  return {
    content: lines.join('\n').trim(),
    format,
    data: input,
    metadata: {
      fullName,
      sectionsCount,
      experienceCount: input.experience?.length ?? 0,
      educationCount: input.education?.length ?? 0,
    },
  };
}
