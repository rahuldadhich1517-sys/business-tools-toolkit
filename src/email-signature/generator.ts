import { escapeHtml, escapeHtmlAttr, isSafeUrl, isValidCssColor } from '../shared/html';
import { validateRequired, validateString } from '../shared/validation';
import type {
  EmailSignatureInput,
  EmailSignatureOptions,
  EmailSignatureResult,
} from './types';

const DEFAULT_PRIMARY = '#1d4ed8';
const DEFAULT_SECONDARY = '#64748b';
const DEFAULT_TEXT = '#334155';

export function generateEmailSignature(
  input: EmailSignatureInput,
  _options: EmailSignatureOptions = {}
): EmailSignatureResult {
  validateRequired(input, 'EmailSignatureInput');
  const name = validateString(input.name, 'name');

  const primaryColor =
    input.brandColors?.primary && isValidCssColor(input.brandColors.primary)
      ? input.brandColors.primary.trim()
      : DEFAULT_PRIMARY;
  const secondaryColor =
    input.brandColors?.secondary && isValidCssColor(input.brandColors.secondary)
      ? input.brandColors.secondary.trim()
      : DEFAULT_SECONDARY;
  const textColor =
    input.brandColors?.text && isValidCssColor(input.brandColors.text)
      ? input.brandColors.text.trim()
      : DEFAULT_TEXT;

  // Build Table-Based HTML
  const rows: string[] = [];

  // Name and Title row
  let nameRow = `<span style="font-size:16px;font-weight:bold;color:${escapeHtmlAttr(primaryColor)};display:block;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(name)}</span>`;
  if (input.jobTitle?.trim() || input.company?.trim()) {
    const subtitle = [input.jobTitle?.trim(), input.company?.trim()].filter(Boolean).map(escapeHtml).join(' | ');
    nameRow += `<span style="font-size:13px;color:${escapeHtmlAttr(secondaryColor)};display:block;margin-top:2px;font-family:Arial,Helvetica,sans-serif;">${subtitle}</span>`;
  }
  rows.push(nameRow);

  // Contact details
  const contactItems: string[] = [];

  if (input.email?.trim()) {
    const em = input.email.trim();
    contactItems.push(
      `<strong>Email:</strong> <a href="mailto:${escapeHtmlAttr(em)}" style="color:${escapeHtmlAttr(primaryColor)};text-decoration:none;">${escapeHtml(em)}</a>`
    );
  }

  if (input.phone?.trim()) {
    const ph = input.phone.trim();
    const telHref = ph.replace(/[^0-9+]/g, '');
    contactItems.push(
      `<strong>Phone:</strong> <a href="tel:${escapeHtmlAttr(telHref)}" style="color:${escapeHtmlAttr(primaryColor)};text-decoration:none;">${escapeHtml(ph)}</a>`
    );
  }

  if (input.website?.trim() && isSafeUrl(input.website, ['https:'])) {
    const web = input.website.trim();
    contactItems.push(
      `<strong>Web:</strong> <a href="${escapeHtmlAttr(web)}" target="_blank" rel="noopener noreferrer" style="color:${escapeHtmlAttr(primaryColor)};text-decoration:none;">${escapeHtml(web)}</a>`
    );
  }

  if (input.address?.trim()) {
    contactItems.push(`<strong>Address:</strong> ${escapeHtml(input.address.trim())}`);
  }

  if (contactItems.length > 0) {
    const contactBlock = `<div style="font-size:12px;color:${escapeHtmlAttr(textColor)};line-height:1.5;margin-top:8px;font-family:Arial,Helvetica,sans-serif;">${contactItems.join('<br />')}</div>`;
    rows.push(contactBlock);
  }

  // Social Links
  if (input.socialLinks && input.socialLinks.length > 0) {
    const safeLinks: string[] = [];
    for (const link of input.socialLinks) {
      if (link.url && isSafeUrl(link.url, ['https:'])) {
        safeLinks.push(
          `<a href="${escapeHtmlAttr(link.url.trim())}" target="_blank" rel="noopener noreferrer" style="color:${escapeHtmlAttr(primaryColor)};text-decoration:none;font-weight:bold;margin-right:8px;font-size:11px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(link.platform || 'Link')}</a>`
        );
      }
    }
    if (safeLinks.length > 0) {
      rows.push(`<div style="margin-top:8px;">${safeLinks.join('')}</div>`);
    }
  }

  // Disclaimer
  if (input.disclaimer?.trim()) {
    rows.push(
      `<div style="font-size:10px;color:${escapeHtmlAttr(secondaryColor)};line-height:1.4;margin-top:12px;border-top:1px solid #e2e8f0;padding-top:6px;max-width:500px;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(input.disclaimer.trim())}</div>`
    );
  }

  let tableHtml = '';
  const hasLogo = Boolean(input.logoUrl && isSafeUrl(input.logoUrl, ['https:']));
  if (hasLogo && input.logoUrl) {
    tableHtml = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;background-color:transparent;line-height:1.4;">
  <tr>
    <td valign="top" style="padding-right:16px;border-right:2px solid ${escapeHtmlAttr(primaryColor)};">
      <img src="${escapeHtmlAttr(input.logoUrl.trim())}" alt="${escapeHtmlAttr(input.company || name)}" width="64" style="display:block;width:64px;height:auto;border-radius:4px;border:0;" />
    </td>
    <td valign="top" style="padding-left:16px;">
      ${rows.join('\n      ')}
    </td>
  </tr>
</table>`;
  } else {
    tableHtml = `<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;background-color:transparent;line-height:1.4;">
  <tr>
    <td valign="top" style="border-left:3px solid ${escapeHtmlAttr(primaryColor)};padding-left:12px;">
      ${rows.join('\n      ')}
    </td>
  </tr>
</table>`;
  }

  // Plain-text alternative
  const textParts: string[] = [];
  textParts.push(name);
  if (input.jobTitle?.trim() || input.company?.trim()) {
    textParts.push([input.jobTitle?.trim(), input.company?.trim()].filter(Boolean).join(' | '));
  }
  if (input.email?.trim()) textParts.push(`Email: ${input.email.trim()}`);
  if (input.phone?.trim()) textParts.push(`Phone: ${input.phone.trim()}`);
  if (input.website?.trim()) textParts.push(`Website: ${input.website.trim()}`);
  if (input.address?.trim()) textParts.push(`Address: ${input.address.trim()}`);
  if (input.socialLinks && input.socialLinks.length > 0) {
    const sLinks = input.socialLinks.filter((s) => s.url?.trim()).map((s) => `${s.platform}: ${s.url.trim()}`);
    if (sLinks.length > 0) textParts.push(sLinks.join(' | '));
  }
  if (input.disclaimer?.trim()) {
    textParts.push(`\n---\n${input.disclaimer.trim()}`);
  }

  return {
    html: tableHtml,
    text: textParts.join('\n'),
    metadata: {
      name,
      hasLogo,
      hasDisclaimer: Boolean(input.disclaimer?.trim()),
    },
  };
}
