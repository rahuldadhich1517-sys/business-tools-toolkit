import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  downloadBlob,
  downloadPdf,
  downloadPng,
  downloadVCard,
} from '../src/browser';

describe('Browser Utilities (Unit)', () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  afterEach(() => {
    // Restore global state
    if (originalWindow !== undefined) {
      globalThis.window = originalWindow;
    } else {
      // @ts-expect-error cleanup mock
      delete globalThis.window;
    }
    if (originalDocument !== undefined) {
      globalThis.document = originalDocument;
    } else {
      // @ts-expect-error cleanup mock
      delete globalThis.document;
    }
    vi.restoreAllMocks();
  });

  describe('Non-browser environment guards', () => {
    beforeEach(() => {
      // @ts-expect-error simulate Node environment
      delete globalThis.window;
      // @ts-expect-error simulate Node environment
      delete globalThis.document;
    });

    it('downloadBlob throws helpful error in Node.js', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      expect(() => downloadBlob(blob, 'test.txt')).toThrow(
        'downloadBlob is only supported in browser environments'
      );
    });

    it('downloadVCard throws helpful error in Node.js', () => {
      expect(() => downloadVCard('BEGIN:VCARD\nEND:VCARD')).toThrow(
        'downloadBlob is only supported in browser environments'
      );
    });

    it('downloadPdf throws helpful error in Node.js', () => {
      expect(() => downloadPdf(new Uint8Array([1, 2, 3]))).toThrow(
        'downloadBlob is only supported in browser environments'
      );
    });

    it('downloadPng throws helpful error in Node.js', () => {
      expect(() => downloadPng('data:image/png;base64,abc')).toThrow(
        'downloadPng is only supported in browser environments'
      );
    });
  });

  describe('Simulated browser environment', () => {
    let mockAnchor: {
      href: string;
      download: string;
      click: ReturnType<typeof vi.fn>;
    };
    let appendedChild: unknown;
    let removedChild: unknown;

    beforeEach(() => {
      mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      // @ts-expect-error mock window
      globalThis.window = {};
      // @ts-expect-error mock document
      globalThis.document = {
        createElement: vi.fn((tag: string) => {
          if (tag === 'a') return mockAnchor;
          return {};
        }),
        body: {
          appendChild: vi.fn((child) => {
            appendedChild = child;
          }),
          removeChild: vi.fn((child) => {
            removedChild = child;
          }),
        },
      };

      globalThis.URL.createObjectURL = vi.fn(() => 'blob:https://example.com/mock-uuid');
      globalThis.URL.revokeObjectURL = vi.fn();
    });

    it('downloadBlob creates anchor, clicks it, and revokes URL', () => {
      const blob = new Blob(['hello'], { type: 'text/plain' });
      downloadBlob(blob, 'sample.txt');

      expect(mockAnchor.download).toBe('sample.txt');
      expect(mockAnchor.href).toBe('blob:https://example.com/mock-uuid');
      expect(mockAnchor.click).toHaveBeenCalledOnce();
      expect(appendedChild).toBe(mockAnchor);
      expect(removedChild).toBe(mockAnchor);
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(
        'blob:https://example.com/mock-uuid'
      );
    });

    it('downloadVCard appends .vcf extension if missing', () => {
      downloadVCard('BEGIN:VCARD\nVERSION:4.0\nEND:VCARD', 'contact');
      expect(mockAnchor.download).toBe('contact.vcf');
      expect(mockAnchor.click).toHaveBeenCalledOnce();
    });

    it('downloadVCard keeps .vcf extension if provided', () => {
      downloadVCard('BEGIN:VCARD\nVERSION:4.0\nEND:VCARD', 'john.vcf');
      expect(mockAnchor.download).toBe('john.vcf');
    });

    it('downloadPdf appends .pdf extension if missing', () => {
      downloadPdf(new Uint8Array([37, 80, 68, 70]), 'invoice');
      expect(mockAnchor.download).toBe('invoice.pdf');
      expect(mockAnchor.click).toHaveBeenCalledOnce();
    });

    it('downloadPng triggers download with png extension', () => {
      downloadPng('data:image/png;base64,dummy', 'signature');
      expect(mockAnchor.href).toBe('data:image/png;base64,dummy');
      expect(mockAnchor.download).toBe('signature.png');
      expect(mockAnchor.click).toHaveBeenCalledOnce();
    });
  });
});
