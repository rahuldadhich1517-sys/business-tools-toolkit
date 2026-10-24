import { escapeHtml, escapeHtmlAttr, isSafeUrl } from '../shared/html';
import { validateRequired, validateString } from '../shared/validation';
import type { DigitalBusinessCardResult, VCardInput, VCardOptions } from './types';
import { generateVCard, getVCardFilename, getVCardMimeType } from './vcard';

export function buildDigitalBusinessCard(
  input: VCardInput,
  options: VCardOptions = {}
): DigitalBusinessCardResult {
  validateRequired(input, 'VCardInput');
  const fullName = validateString(input.fullName, 'fullName');

  const vcard = generateVCard(input, options);
  const mimeType = getVCardMimeType(options.version ?? input.version ?? '4.0');
  const filename = getVCardFilename(fullName, options.filename);

  // Build clean, safely escaped HTML representation
  const htmlParts: string[] = [];
  htmlParts.push('<div class="business-card" style="max-width:420px;padding:24px;border:1px solid #e2e8f0;border-radius:12px;font-family:system-ui,-apple-system,sans-serif;background:#ffffff;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);color:#1a202c;">');

  if (input.photoUrl && isSafeUrl(input.photoUrl, ['https:'])) {
    htmlParts.push(`  <div style="text-align:center;margin-bottom:16px;">`);
    htmlParts.push(`    <img src="${escapeHtmlAttr(input.photoUrl)}" alt="${escapeHtmlAttr(fullName)}" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid #cbd5e1;" />`);
    htmlParts.push(`  </div>`);
  }

  htmlParts.push(`  <h2 style="margin:0 0 4px 0;font-size:20px;font-weight:700;color:#0f172a;text-align:center;">${escapeHtml(fullName)}</h2>`);

  if (input.jobTitle?.trim() || input.organization?.trim()) {
    const subtitle = [input.jobTitle?.trim(), input.organization?.trim()].filter(Boolean).map(escapeHtml).join(' at ');
    htmlParts.push(`  <p style="margin:0 0 16px 0;font-size:14px;color:#64748b;text-align:center;">${subtitle}</p>`);
  }

  htmlParts.push('  <hr style="border:0;border-top:1px solid #f1f5f9;margin:16px 0;" />');
  htmlParts.push('  <div style="font-size:13px;line-height:1.6;display:flex;flex-direction:column;gap:8px;">');

  // Emails
  if (input.email) {
    const emails = Array.isArray(input.email) ? input.email : [input.email];
    for (const em of emails) {
      const trimmed = em.trim();
      if (trimmed) {
        htmlParts.push(`    <div><strong>Email:</strong> <a href="mailto:${escapeHtmlAttr(trimmed)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(trimmed)}</a></div>`);
      }
    }
  }

  // Phones
  if (input.phone) {
    const phones = Array.isArray(input.phone) ? input.phone : [input.phone];
    for (const ph of phones) {
      const trimmed = ph.trim();
      if (trimmed) {
        const telHref = trimmed.replace(/[^0-9+]/g, '');
        htmlParts.push(`    <div><strong>Phone:</strong> <a href="tel:${escapeHtmlAttr(telHref)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(trimmed)}</a></div>`);
      }
    }
  }

  // Website
  if (input.website && isSafeUrl(input.website, ['https:'])) {
    htmlParts.push(`    <div><strong>Website:</strong> <a href="${escapeHtmlAttr(input.website.trim())}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;text-decoration:none;">${escapeHtml(input.website.trim())}</a></div>`);
  }

  // Address
  if (input.address) {
    const { street, city, state, postalCode, country } = input.address;
    const addr = [street, city, state, postalCode, country].filter(Boolean).map(escapeHtml).join(', ');
    if (addr) {
      htmlParts.push(`    <div><strong>Address:</strong> ${addr}</div>`);
    }
  }

  // Notes
  if (input.notes?.trim()) {
    htmlParts.push(`    <div style="margin-top:4px;padding:8px;background:#f8fafc;border-radius:6px;font-size:12px;color:#475569;">${escapeHtml(input.notes.trim())}</div>`);
  }

  // Social Links
  if (input.socialLinks && input.socialLinks.length > 0) {
    htmlParts.push('    <div style="margin-top:8px;display:flex;gap:12px;flex-wrap:wrap;">');
    for (const link of input.socialLinks) {
      if (link.url && isSafeUrl(link.url, ['https:'])) {
        htmlParts.push(`      <a href="${escapeHtmlAttr(link.url.trim())}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-size:12px;text-decoration:none;font-weight:500;">${escapeHtml(link.platform || 'Link')}</a>`);
      }
    }
    htmlParts.push('    </div>');
  }

  htmlParts.push('  </div>');
  htmlParts.push('</div>');

  return {
    vcard,
    html: htmlParts.join('\n'),
    data: input,
    filename,
    mimeType,
  };
}
