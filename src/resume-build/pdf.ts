import { PDFDocument, rgb } from 'pdf-lib';
import { PdfContext } from '../shared/pdf-utils';
import { validateEmail, validateRequired, validateString } from '../shared/validation';
import type { ResumeInput, ResumePdfOptions } from './types';

export async function buildResumePdf(
  input: ResumeInput,
  options: ResumePdfOptions = {}
): Promise<Uint8Array> {
  validateRequired(input, 'ResumeInput');
  const fullName = validateString(input.fullName, 'fullName');
  validateRequired(input.contact, 'contact');
  const email = validateEmail(input.contact.email, 'contact.email');

  const doc = await PDFDocument.create();
  const pdfCtx = new PdfContext(doc, { pageSize: options.pageSize });
  await pdfCtx.initFonts();

  const primary = options.primaryColor ?? { r: 0.1, g: 0.25, b: 0.5 }; // Deep Navy
  const primaryRgb = rgb(primary.r, primary.g, primary.b);
  const textDark = rgb(0.12, 0.15, 0.18);
  const textMuted = rgb(0.38, 0.42, 0.48);
  const lineGrey = rgb(0.82, 0.85, 0.88);

  // 1. Header (Name, Title, Contact Info)
  pdfCtx.currentPage.drawText(fullName, {
    x: pdfCtx.marginLeft,
    y: pdfCtx.cursorY - 20,
    size: 20,
    font: pdfCtx.fontBold,
    color: primaryRgb,
  });
  pdfCtx.cursorY -= 26;

  if (input.title?.trim()) {
    pdfCtx.currentPage.drawText(input.title.trim(), {
      x: pdfCtx.marginLeft,
      y: pdfCtx.cursorY - 12,
      size: 11,
      font: pdfCtx.fontBold,
      color: textMuted,
    });
    pdfCtx.cursorY -= 16;
  }

  // Contact line
  const contactParts: string[] = [email];
  if (input.contact.phone?.trim()) contactParts.push(input.contact.phone.trim());
  if (input.contact.location?.trim()) contactParts.push(input.contact.location.trim());
  if (input.contact.website?.trim()) contactParts.push(input.contact.website.trim());
  if (input.contact.linkedin?.trim()) contactParts.push(input.contact.linkedin.trim());
  if (input.contact.github?.trim()) contactParts.push(input.contact.github.trim());

  const contactLine = contactParts.join('  •  ');
  pdfCtx.currentPage.drawText(contactLine, {
    x: pdfCtx.marginLeft,
    y: pdfCtx.cursorY - 10,
    size: 8.5,
    font: pdfCtx.fontRegular,
    color: textMuted,
  });
  pdfCtx.cursorY -= 18;

  // Header divider
  pdfCtx.currentPage.drawLine({
    start: { x: pdfCtx.marginLeft, y: pdfCtx.cursorY },
    end: { x: pdfCtx.pageWidth - pdfCtx.marginRight, y: pdfCtx.cursorY },
    thickness: 1,
    color: lineGrey,
  });
  pdfCtx.cursorY -= 14;

  const drawSectionHeader = (title: string) => {
    pdfCtx.ensureSpace(35);
    pdfCtx.currentPage.drawText(title.toUpperCase(), {
      x: pdfCtx.marginLeft,
      y: pdfCtx.cursorY - 11,
      size: 10,
      font: pdfCtx.fontBold,
      color: primaryRgb,
    });
    pdfCtx.cursorY -= 14;
    pdfCtx.currentPage.drawLine({
      start: { x: pdfCtx.marginLeft, y: pdfCtx.cursorY },
      end: { x: pdfCtx.pageWidth - pdfCtx.marginRight, y: pdfCtx.cursorY },
      thickness: 0.5,
      color: lineGrey,
    });
    pdfCtx.cursorY -= 10;
  };

  const defaultOrder: Array<
    'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'languages' | 'awards'
  > = ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'awards'];

  const order = input.sectionOrder ?? defaultOrder;

  for (const section of order) {
    if (section === 'summary' && input.summary?.trim()) {
      drawSectionHeader('Professional Summary');
      pdfCtx.drawParagraph(input.summary.trim(), { fontSize: 9.5, color: { r: 0.15, g: 0.15, b: 0.15 } });
      pdfCtx.cursorY -= 8;
    } else if (section === 'experience' && input.experience && input.experience.length > 0) {
      drawSectionHeader('Work Experience');
      for (const exp of input.experience) {
        pdfCtx.ensureSpace(45);

        // Position on left, Dates on right
        pdfCtx.currentPage.drawText(exp.position, {
          x: pdfCtx.marginLeft,
          y: pdfCtx.cursorY - 11,
          size: 10,
          font: pdfCtx.fontBold,
          color: textDark,
        });

        const dateRange = exp.current ? `${exp.startDate} - Present` : `${exp.startDate} - ${exp.endDate || ''}`;
        const dateWidth = pdfCtx.fontRegular.widthOfTextAtSize(dateRange, 8.5);
        pdfCtx.currentPage.drawText(dateRange, {
          x: pdfCtx.pageWidth - pdfCtx.marginRight - dateWidth,
          y: pdfCtx.cursorY - 11,
          size: 8.5,
          font: pdfCtx.fontRegular,
          color: textMuted,
        });
        pdfCtx.cursorY -= 13;

        // Company & location
        const compLoc = exp.location ? `${exp.company}  |  ${exp.location}` : exp.company;
        pdfCtx.currentPage.drawText(compLoc, {
          x: pdfCtx.marginLeft,
          y: pdfCtx.cursorY - 10,
          size: 9,
          font: pdfCtx.fontItalic,
          color: textMuted,
        });
        pdfCtx.cursorY -= 13;

        // Highlights
        if (exp.highlights && exp.highlights.length > 0) {
          for (const hl of exp.highlights) {
            pdfCtx.ensureSpace(16);
            pdfCtx.currentPage.drawText('•', {
              x: pdfCtx.marginLeft + 6,
              y: pdfCtx.cursorY - 9,
              size: 9,
              font: pdfCtx.fontRegular,
              color: textDark,
            });
            pdfCtx.drawParagraph(hl.trim(), {
              x: pdfCtx.marginLeft + 18,
              maxWidth: pdfCtx.contentWidth - 18,
              fontSize: 8.5,
              color: { r: 0.15, g: 0.15, b: 0.15 },
            });
            pdfCtx.cursorY -= 2;
          }
        }
        pdfCtx.cursorY -= 6;
      }
    } else if (section === 'education' && input.education && input.education.length > 0) {
      drawSectionHeader('Education');
      for (const edu of input.education) {
        pdfCtx.ensureSpace(30);
        pdfCtx.currentPage.drawText(edu.degree, {
          x: pdfCtx.marginLeft,
          y: pdfCtx.cursorY - 11,
          size: 9.5,
          font: pdfCtx.fontBold,
          color: textDark,
        });

        const dates = edu.endDate ? `${edu.startDate ? `${edu.startDate} - ` : ''}${edu.endDate}` : '';
        if (dates) {
          const dateWidth = pdfCtx.fontRegular.widthOfTextAtSize(dates, 8.5);
          pdfCtx.currentPage.drawText(dates, {
            x: pdfCtx.pageWidth - pdfCtx.marginRight - dateWidth,
            y: pdfCtx.cursorY - 11,
            size: 8.5,
            font: pdfCtx.fontRegular,
            color: textMuted,
          });
        }
        pdfCtx.cursorY -= 13;

        const inst = edu.location ? `${edu.institution}  |  ${edu.location}` : edu.institution;
        pdfCtx.currentPage.drawText(inst, {
          x: pdfCtx.marginLeft,
          y: pdfCtx.cursorY - 10,
          size: 9,
          font: pdfCtx.fontItalic,
          color: textMuted,
        });
        pdfCtx.cursorY -= 13;

        if (edu.honors && edu.honors.length > 0) {
          for (const honor of edu.honors) {
            pdfCtx.ensureSpace(14);
            pdfCtx.drawParagraph(`• ${honor.trim()}`, {
              x: pdfCtx.marginLeft + 10,
              maxWidth: pdfCtx.contentWidth - 10,
              fontSize: 8,
              color: { r: 0.2, g: 0.2, b: 0.2 },
            });
          }
        }
        pdfCtx.cursorY -= 4;
      }
    } else if (section === 'skills' && input.skills) {
      drawSectionHeader('Skills');
      pdfCtx.ensureSpace(20);
      if (Array.isArray(input.skills)) {
        pdfCtx.drawParagraph(input.skills.join(', '), { fontSize: 8.5, color: { r: 0.15, g: 0.15, b: 0.15 } });
      } else {
        for (const [cat, items] of Object.entries(input.skills)) {
          pdfCtx.ensureSpace(14);
          pdfCtx.drawParagraph(`${cat}: ${items.join(', ')}`, {
            fontSize: 8.5,
            color: { r: 0.15, g: 0.15, b: 0.15 },
          });
          pdfCtx.cursorY -= 2;
        }
      }
      pdfCtx.cursorY -= 6;
    } else if (section === 'projects' && input.projects && input.projects.length > 0) {
      drawSectionHeader('Projects');
      for (const proj of input.projects) {
        pdfCtx.ensureSpace(30);
        pdfCtx.currentPage.drawText(proj.name, {
          x: pdfCtx.marginLeft,
          y: pdfCtx.cursorY - 10,
          size: 9.5,
          font: pdfCtx.fontBold,
          color: textDark,
        });
        pdfCtx.cursorY -= 13;
        pdfCtx.drawParagraph(proj.description, { fontSize: 8.5, color: { r: 0.15, g: 0.15, b: 0.15 } });
        if (proj.technologies && proj.technologies.length > 0) {
          pdfCtx.drawParagraph(`Technologies: ${proj.technologies.join(', ')}`, {
            fontSize: 8,
            font: pdfCtx.fontItalic,
            color: textMuted,
          });
        }
        pdfCtx.cursorY -= 5;
      }
    } else if (section === 'certifications' && input.certifications && input.certifications.length > 0) {
      drawSectionHeader('Certifications');
      for (const cert of input.certifications) {
        pdfCtx.ensureSpace(14);
        const dateStr = cert.date ? ` (${cert.date})` : '';
        pdfCtx.drawParagraph(`• ${cert.name} - ${cert.issuer}${dateStr}`, {
          fontSize: 8.5,
          color: { r: 0.15, g: 0.15, b: 0.15 },
        });
      }
      pdfCtx.cursorY -= 6;
    } else if (section === 'languages' && input.languages && input.languages.length > 0) {
      drawSectionHeader('Languages');
      pdfCtx.ensureSpace(14);
      const langStr = input.languages
        .map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name))
        .join(', ');
      pdfCtx.drawParagraph(langStr, { fontSize: 8.5, color: { r: 0.15, g: 0.15, b: 0.15 } });
      pdfCtx.cursorY -= 6;
    } else if (section === 'awards' && input.awards && input.awards.length > 0) {
      drawSectionHeader('Honors & Awards');
      for (const aw of input.awards) {
        pdfCtx.ensureSpace(14);
        const date = aw.date ? ` (${aw.date})` : '';
        pdfCtx.drawParagraph(`• ${aw.title} - ${aw.issuer}${date}`, {
          fontSize: 8.5,
          color: { r: 0.15, g: 0.15, b: 0.15 },
        });
        if (aw.description) {
          pdfCtx.drawParagraph(`  ${aw.description}`, { fontSize: 8, color: textMuted });
        }
      }
      pdfCtx.cursorY -= 6;
    }
  }

  // Draw Page Numbers at bottom
  pdfCtx.drawPageNumbers(`${fullName} - Resume`);

  return await doc.save();
}
