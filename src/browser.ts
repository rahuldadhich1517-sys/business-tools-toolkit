export * from './index';

/**
 * Initiates a browser file download from a Blob object.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('downloadBlob is only supported in browser environments');
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a vCard string as a .vcf file in the browser.
 */
export function downloadVCard(vcard: string, filename = 'contact.vcf'): void {
  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  downloadBlob(blob, filename.endsWith('.vcf') ? filename : `${filename}.vcf`);
}

/**
 * Downloads PDF bytes as a .pdf file in the browser.
 */
export function downloadPdf(pdfBytes: Uint8Array, filename = 'document.pdf'): void {
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  downloadBlob(blob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Downloads a PNG data URL as an image file in the browser.
 */
export function downloadPng(dataUrl: string, filename = 'signature.png'): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('downloadPng is only supported in browser environments');
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
