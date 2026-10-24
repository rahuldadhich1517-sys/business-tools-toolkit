import { Color, PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';

export interface PageLayoutOptions {
  pageSize?: [number, number]; // [width, height], default A4 [595.28, 841.89]
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

export const A4_PAGE_SIZE: [number, number] = [595.28, 841.89];
export const LETTER_PAGE_SIZE: [number, number] = [612.0, 792.0];

export class PdfContext {
  public doc: PDFDocument;
  public fontRegular!: PDFFont;
  public fontBold!: PDFFont;
  public fontItalic!: PDFFont;
  public pages: PDFPage[] = [];
  public currentPage!: PDFPage;
  public cursorY = 0;
  public readonly pageWidth: number;
  public readonly pageHeight: number;
  public readonly marginTop: number;
  public readonly marginBottom: number;
  public readonly marginLeft: number;
  public readonly marginRight: number;
  public readonly contentWidth: number;

  constructor(doc: PDFDocument, options: PageLayoutOptions = {}) {
    this.doc = doc;
    const size = options.pageSize ?? A4_PAGE_SIZE;
    this.pageWidth = size[0];
    this.pageHeight = size[1];
    this.marginTop = options.marginTop ?? 40;
    this.marginBottom = options.marginBottom ?? 40;
    this.marginLeft = options.marginLeft ?? 40;
    this.marginRight = options.marginRight ?? 40;
    this.contentWidth = this.pageWidth - this.marginLeft - this.marginRight;
  }

  public async initFonts(): Promise<void> {
    this.fontRegular = await this.doc.embedFont(StandardFonts.Helvetica);
    this.fontBold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.fontItalic = await this.doc.embedFont(StandardFonts.HelveticaOblique);
    this.addNewPage();
  }

  public addNewPage(): PDFPage {
    const page = this.doc.addPage([this.pageWidth, this.pageHeight]);
    this.pages.push(page);
    this.currentPage = page;
    this.cursorY = this.pageHeight - this.marginTop;
    return page;
  }

  public ensureSpace(neededHeight: number): void {
    if (this.cursorY - neededHeight < this.marginBottom) {
      this.addNewPage();
    }
  }

  public wrapText(text: string, maxWidth: number, fontSize: number, font: PDFFont): string[] {
    const sanitized = text.replace(/[\r\n]+/g, ' ').trim();
    if (!sanitized) return [];

    const words = sanitized.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) lines.push(currentLine);
        // If single word exceeds maxWidth, break it down
        if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
          let chunk = '';
          for (const char of word) {
            if (font.widthOfTextAtSize(chunk + char, fontSize) <= maxWidth) {
              chunk += char;
            } else {
              lines.push(chunk);
              chunk = char;
            }
          }
          currentLine = chunk;
        } else {
          currentLine = word;
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines;
  }

  public drawParagraph(
    text: string,
    options: {
      fontSize?: number;
      font?: PDFFont;
      color?: Color | { r: number; g: number; b: number };
      lineSpacing?: number;
      x?: number;
      maxWidth?: number;
    } = {}
  ): number {
    const fontSize = options.fontSize ?? 10;
    const font = options.font ?? this.fontRegular;
    const rawColor = options.color ?? { r: 0.15, g: 0.15, b: 0.15 };
    const color: Color = 'type' in rawColor ? rawColor : rgb(rawColor.r, rawColor.g, rawColor.b);
    const lineSpacing = options.lineSpacing ?? 1.3;
    const lineHeight = fontSize * lineSpacing;
    const x = options.x ?? this.marginLeft;
    const maxWidth = options.maxWidth ?? this.contentWidth;

    const lines = this.wrapText(text, maxWidth, fontSize, font);
    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.currentPage.drawText(line, {
        x,
        y: this.cursorY - fontSize,
        size: fontSize,
        font,
        color,
      });
      this.cursorY -= lineHeight;
    }
    return lines.length * lineHeight;
  }

  public drawPageNumbers(footerText?: string): void {
    const total = this.pages.length;
    for (let i = 0; i < total; i++) {
      const page = this.pages[i]!;
      const numStr = `Page ${i + 1} of ${total}`;
      const size = 8;
      const width = this.fontRegular.widthOfTextAtSize(numStr, size);
      const y = this.marginBottom / 2;

      // Draw footer text on left if provided
      if (footerText) {
        page.drawText(footerText, {
          x: this.marginLeft,
          y,
          size,
          font: this.fontRegular,
          color: rgb(0.4, 0.4, 0.4),
        });
      }

      // Draw page number on right
      page.drawText(numStr, {
        x: this.pageWidth - this.marginRight - width,
        y,
        size,
        font: this.fontRegular,
        color: rgb(0.4, 0.4, 0.4),
      });
    }
  }
}
