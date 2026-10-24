import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { buildResume, buildResumePdf } from '../src/resume-build';
import { ValidationError } from '../src/shared/errors';

describe('Resume Builder & PDF Export', () => {
  const fullResume = {
    fullName: 'Alexander Wright',
    title: 'Staff Infrastructure Engineer',
    contact: {
      email: 'alex.wright@example.com',
      phone: '+1 (555) 234-5678',
      location: 'Seattle, WA',
      website: 'https://alexwright.dev',
      github: 'https://github.com/alexwright',
      linkedin: 'https://linkedin.com/in/alexwright',
    },
    summary:
      'Staff Infrastructure Engineer with 12+ years of experience leading site reliability, Kubernetes platforms, and distributed systems. Expert in zero-downtime migrations.',
    skills: {
      'Cloud & Platforms': ['AWS', 'GCP', 'Kubernetes', 'Terraform'],
      Languages: ['Go', 'TypeScript', 'Python', 'Rust'],
      Observability: ['Prometheus', 'Grafana', 'OpenTelemetry'],
    },
    experience: [
      {
        position: 'Staff Infrastructure Engineer',
        company: 'Stripe / FinTech Platforms',
        location: 'Seattle, WA',
        startDate: '2021',
        current: true,
        highlights: [
          'Architected global multi-region Kubernetes platform handling 25B+ daily requests.',
          'Reduced infrastructure costs by $4.2M annually via automated bin-packing.',
        ],
      },
      {
        position: 'Senior DevOps Engineer',
        company: 'CloudScale Systems',
        location: 'San Francisco, CA',
        startDate: '2016',
        endDate: '2021',
        highlights: [
          'Led migration of 200+ monolith services to containerized microservices.',
          'Maintained 99.995% SLA across production clusters.',
        ],
      },
    ],
    education: [
      {
        degree: 'B.S. in Computer Science',
        institution: 'University of Washington',
        location: 'Seattle, WA',
        endDate: '2016',
        honors: ['Magna Cum Laude', 'Dean’s List'],
      },
    ],
    projects: [
      {
        name: 'OpenKube-Autoscaler',
        description: 'Open-source predictive autoscaler for large-scale Kubernetes workloads.',
        technologies: ['Go', 'Kubernetes API', 'Prometheus'],
        url: 'https://github.com/alexwright/openkube-autoscaler',
      },
    ],
    certifications: [
      {
        name: 'Certified Kubernetes Administrator (CKA)',
        issuer: 'Cloud Native Computing Foundation (CNCF)',
        date: '2023',
      },
    ],
    languages: [
      { name: 'English', proficiency: 'Native' },
      { name: 'German', proficiency: 'Professional Working' },
    ],
    awards: [
      {
        title: 'Outstanding Technical Contribution',
        issuer: 'FinTech Platforms',
        date: '2024',
      },
    ],
  };

  describe('buildResume (Structured Model & Text/Markdown)', () => {
    it('builds structured resume text preserving all provided facts', () => {
      const res = buildResume(fullResume, { format: 'text' });

      expect(res.content).toContain('Alexander Wright');
      expect(res.content).toContain('Staff Infrastructure Engineer');
      expect(res.content).toContain('alex.wright@example.com');
      expect(res.content).toContain('Stripe / FinTech Platforms');
      expect(res.content).toContain('Architected global multi-region Kubernetes platform');
      expect(res.content).toContain('University of Washington');
      expect(res.content).toContain('OpenKube-Autoscaler');
      expect(res.metadata.experienceCount).toBe(2);
      expect(res.metadata.educationCount).toBe(1);
    });

    it('supports custom section ordering', () => {
      const customOrder = {
        ...fullResume,
        sectionOrder: ['skills' as const, 'experience' as const, 'education' as const],
      };
      const res = buildResume(customOrder, { format: 'markdown' });
      const skillsIdx = res.content.indexOf('## Skills');
      const expIdx = res.content.indexOf('## Work Experience');
      expect(skillsIdx).toBeLessThan(expIdx);
    });

    it('generates minimal resume without optional sections', () => {
      const minimal = {
        fullName: 'John Doe',
        contact: { email: 'john@example.com' },
      };
      const res = buildResume(minimal);
      expect(res.content).toContain('John Doe');
      expect(res.content).toContain('john@example.com');
      expect(res.content).not.toContain('WORK EXPERIENCE');
      expect(res.content).not.toContain('PROJECTS');
    });

    it('validates required fields', () => {
      expect(() => buildResume({ fullName: '', contact: { email: 'test@example.com' } })).toThrow(
        ValidationError
      );
      expect(() => buildResume({ fullName: 'John', contact: { email: 'not-an-email' } })).toThrow(
        ValidationError
      );
    });
  });

  describe('buildResumePdf (Genuine PDF Export)', () => {
    it('generates valid binary PDF document loadable by pdf-lib', async () => {
      const pdfBytes = await buildResumePdf(fullResume);

      expect(pdfBytes).toBeInstanceOf(Uint8Array);
      expect(pdfBytes.length).toBeGreaterThan(1000);

      const loadedDoc = await PDFDocument.load(pdfBytes);
      expect(loadedDoc.getPageCount()).toBeGreaterThanOrEqual(1);
    });

    it('supports multi-page resume when experience and projects are long', async () => {
      const longExperience = [];
      for (let i = 1; i <= 8; i++) {
        longExperience.push({
          position: `Senior Engineering Lead - Phase ${i}`,
          company: `Enterprise Tech ${i}`,
          location: 'San Francisco, CA',
          startDate: `201${i}`,
          endDate: `202${i}`,
          highlights: [
            'Architected distributed microservices handling heavy transactional loads across multiple cloud regions.',
            'Mentored 15 junior and mid-level engineers in distributed system design, clean architecture, and testing.',
            'Spearheaded site reliability engineering practices, achieving 99.99% uptime for core customer transactions.',
          ],
        });
      }

      const multiPageResume = {
        ...fullResume,
        experience: longExperience,
      };

      const pdfBytes = await buildResumePdf(multiPageResume);
      const loadedDoc = await PDFDocument.load(pdfBytes);
      expect(loadedDoc.getPageCount()).toBeGreaterThan(1);
    });
  });
});
