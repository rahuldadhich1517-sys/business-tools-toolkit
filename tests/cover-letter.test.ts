import { describe, expect, it } from 'vitest';
import { generateCoverLetter } from '../src/cover-letter';
import { ValidationError } from '../src/shared/errors';

describe('Cover Letter Generator', () => {
  const baseInput = {
    candidateName: 'Jane Doe',
    jobTitle: 'Principal Software Engineer',
    companyName: 'Acme Corp',
    contactInfo: {
      email: 'jane.doe@example.com',
      phone: '+1 555-0199',
      website: 'https://janedoe.dev',
    },
    skills: ['TypeScript', 'Distributed Systems', 'Cloud Architecture'],
    relevantExperience: [
      'Led architecture of microservices scaling to 10M DAU',
      'Reduced p99 API latency by 45%',
    ],
    achievements: ['Recipient of 2025 Tech Leadership Award'],
  };

  it('generates a complete professional cover letter', () => {
    const result = generateCoverLetter(baseInput);

    expect(result.content).toContain('Jane Doe');
    expect(result.content).toContain('Acme Corp');
    expect(result.content).toContain('Principal Software Engineer');
    expect(result.content).toContain('jane.doe@example.com');
    expect(result.content).toContain('TypeScript, Distributed Systems, Cloud Architecture');
    expect(result.content).toContain('Reduced p99 API latency by 45%');
    expect(result.content).toContain('Recipient of 2025 Tech Leadership Award');
    expect(result.content).toContain('Sincerely,');
    expect(result.metadata.wordCount).toBeGreaterThan(50);
  });

  it('generates minimal valid input without optional fields', () => {
    const minimal = {
      candidateName: 'John Smith',
      jobTitle: 'Frontend Engineer',
      companyName: 'Beta Inc',
    };
    const result = generateCoverLetter(minimal);

    expect(result.content).toContain('John Smith');
    expect(result.content).toContain('Frontend Engineer');
    expect(result.content).toContain('Beta Inc');
    // Does not invent experience or skills
    expect(result.content).not.toContain('Key Achievements');
    expect(result.content).not.toContain('Relevant Experience:');
  });

  it('validates missing required candidate name', () => {
    expect(() =>
      generateCoverLetter({
        candidateName: '',
        jobTitle: 'Developer',
        companyName: 'Acme',
      })
    ).toThrow(ValidationError);
  });

  it('validates missing required job title', () => {
    expect(() =>
      generateCoverLetter({
        candidateName: 'Jane',
        jobTitle: '',
        companyName: 'Acme',
      })
    ).toThrow(ValidationError);
  });

  it('validates missing required company name', () => {
    expect(() =>
      generateCoverLetter({
        candidateName: 'Jane',
        jobTitle: 'Developer',
        companyName: '',
      })
    ).toThrow(ValidationError);
  });

  it('supports different tones: formal, professional, concise', () => {
    const formal = generateCoverLetter(baseInput, { tone: 'formal' });
    expect(formal.content).toContain('Dear Hiring Committee at Acme Corp,');
    expect(formal.content).toContain('Respectfully,');

    const concise = generateCoverLetter(baseInput, { tone: 'concise' });
    expect(concise.content).toContain('I am writing to express my strong interest in the Principal Software Engineer position at Acme Corp.');
  });

  it('supports Markdown formatting', () => {
    const md = generateCoverLetter(baseInput, { format: 'markdown' });
    expect(md.content).toContain('# Jane Doe');
    expect(md.content).toContain('### Relevant Experience');
    expect(md.content).toContain('- Led architecture of microservices');
  });

  it('preserves Unicode and special characters without corruption', () => {
    const unicodeInput = {
      candidateName: 'Søren Kierkegaard & ñoño',
      jobTitle: 'Senior Dev — Cloud & AI 🚀',
      companyName: 'München Tech GmbH',
    };
    const res = generateCoverLetter(unicodeInput);
    expect(res.content).toContain('Søren Kierkegaard & ñoño');
    expect(res.content).toContain('Senior Dev — Cloud & AI 🚀');
    expect(res.content).toContain('München Tech GmbH');
  });

  it('is strictly deterministic for identical inputs', () => {
    const res1 = generateCoverLetter(baseInput);
    const res2 = generateCoverLetter(baseInput);
    expect(res1.content).toBe(res2.content);
    expect(res1.metadata).toEqual(res2.metadata);
  });

  it('does not invent qualifications or achievements not provided', () => {
    const inputWithoutAchievements = {
      candidateName: 'Alice',
      jobTitle: 'QA Lead',
      companyName: 'TestCo',
      skills: ['Vitest', 'Playwright'],
    };
    const res = generateCoverLetter(inputWithoutAchievements);
    expect(res.content).not.toContain('Award');
    expect(res.content).not.toContain('increased revenue');
    expect(res.content).not.toContain('patented');
    expect(res.content).toContain('Vitest, Playwright');
  });
});
