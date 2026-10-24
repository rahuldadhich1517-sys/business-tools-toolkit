import { sanitizeFilename, validateRequired, validateString } from '../shared/validation';
import type { VCardInput, VCardOptions, VCardVersion } from './types';

/**
 * Escapes characters for vCard property values according to RFC 6350 / RFC 2426.
 */
export function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Folds lines longer than 75 octets according to RFC specifications (CRLF + space).
 * Handles multi-byte UTF-8 boundaries safely.
 */
export function foldVCardLine(line: string, maxBytes = 75): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= maxBytes) {
    return line;
  }

  const decoder = new TextDecoder('utf-8');
  let result = '';
  let currentOffset = 0;
  let isFirstLine = true;

  while (currentOffset < bytes.length) {
    const limit = isFirstLine ? maxBytes : maxBytes - 1; // 1 byte for leading space
    let sliceEnd = currentOffset + limit;
    if (sliceEnd >= bytes.length) {
      sliceEnd = bytes.length;
    } else {
      // Avoid splitting in the middle of a multi-byte UTF-8 character
      // In UTF-8, continuation bytes have the pattern 10xxxxxx (0x80 to 0xBF)
      while (sliceEnd > currentOffset && (bytes[sliceEnd]! & 0xc0) === 0x80) {
        sliceEnd--;
      }
      if (sliceEnd === currentOffset) {
        // If single char is larger than limit (rare edge case), advance past the full sequence
        sliceEnd = currentOffset + limit;
        while (sliceEnd < bytes.length && (bytes[sliceEnd]! & 0xc0) === 0x80) {
          sliceEnd++;
        }
      }
    }

    const chunk = decoder.decode(bytes.subarray(currentOffset, sliceEnd));
    if (isFirstLine) {
      result += chunk;
      isFirstLine = false;
    } else {
      result += '\r\n ' + chunk;
    }
    currentOffset = sliceEnd;
  }

  return result;
}

export function generateVCard(input: VCardInput, options: VCardOptions = {}): string {
  validateRequired(input, 'VCardInput');
  const fullName = validateString(input.fullName, 'fullName');
  const version: VCardVersion = options.version ?? input.version ?? '4.0';

  const lines: string[] = [];
  lines.push('BEGIN:VCARD');
  lines.push(`VERSION:${version}`);

  // FN (Formatted Name)
  lines.push(`FN:${escapeVCardValue(fullName)}`);

  // N (Structured Name: Family;Given;Additional;Prefix;Suffix)
  let family = input.lastName?.trim() ?? '';
  let given = input.firstName?.trim() ?? '';
  if (!family && !given) {
    const parts = fullName.split(/\s+/);
    if (parts.length > 1) {
      given = parts[0] ?? '';
      family = parts.slice(1).join(' ');
    } else {
      given = fullName;
    }
  }
  lines.push(`N:${escapeVCardValue(family)};${escapeVCardValue(given)};;;`);

  // Organization
  if (input.organization?.trim()) {
    lines.push(`ORG:${escapeVCardValue(input.organization.trim())}`);
  }

  // Job Title
  if (input.jobTitle?.trim()) {
    lines.push(`TITLE:${escapeVCardValue(input.jobTitle.trim())}`);
  }

  // Emails
  if (input.email) {
    const emails = Array.isArray(input.email) ? input.email : [input.email];
    for (const em of emails) {
      const trimmed = em.trim();
      if (trimmed) {
        if (version === '4.0') {
          lines.push(`EMAIL;TYPE=work:${escapeVCardValue(trimmed)}`);
        } else {
          lines.push(`EMAIL;TYPE=INTERNET,WORK:${escapeVCardValue(trimmed)}`);
        }
      }
    }
  }

  // Phones
  if (input.phone) {
    const phones = Array.isArray(input.phone) ? input.phone : [input.phone];
    for (const ph of phones) {
      const trimmed = ph.trim();
      if (trimmed) {
        if (version === '4.0') {
          lines.push(`TEL;TYPE=work,voice:${escapeVCardValue(trimmed)}`);
        } else {
          lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCardValue(trimmed)}`);
        }
      }
    }
  }

  // Website
  if (input.website?.trim()) {
    lines.push(`URL:${escapeVCardValue(input.website.trim())}`);
  }

  // Address: ADR:;;street;city;state;postalCode;country
  if (input.address) {
    const { street = '', city = '', state = '', postalCode = '', country = '' } = input.address;
    lines.push(
      `ADR;TYPE=work:;;${escapeVCardValue(street)};${escapeVCardValue(city)};${escapeVCardValue(
        state
      )};${escapeVCardValue(postalCode)};${escapeVCardValue(country)}`
    );
  }

  // Notes
  if (input.notes?.trim()) {
    lines.push(`NOTE:${escapeVCardValue(input.notes.trim())}`);
  }

  // Social Links
  if (input.socialLinks && input.socialLinks.length > 0) {
    for (const link of input.socialLinks) {
      if (link.url?.trim()) {
        const platform = link.platform?.trim() ? `${link.platform.trim().toUpperCase()}: ` : '';
        lines.push(`X-SOCIALPROFILE;TYPE=${link.platform || 'other'}:${escapeVCardValue(link.url.trim())}`);
        lines.push(`NOTE:${escapeVCardValue(platform + link.url.trim())}`);
      }
    }
  }

  // Photo URL
  if (input.photoUrl?.trim()) {
    if (version === '4.0') {
      lines.push(`PHOTO;MEDIATYPE=image/jpeg:${escapeVCardValue(input.photoUrl.trim())}`);
    } else {
      lines.push(`PHOTO;VALUE=URI:${escapeVCardValue(input.photoUrl.trim())}`);
    }
  }

  // Revision timestamp (UTC)
  const revDate = options.revisionTimestamp ?? input.revisionTimestamp;
  const revStr = revDate
    ? revDate.replace(/[-:]/g, '').split('.')[0] + (revDate.endsWith('Z') ? '' : 'Z')
    : new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  lines.push(`REV:${revStr}`);

  lines.push('END:VCARD');

  // Fold and join with CRLF
  const foldedLines = lines.map((l) => foldVCardLine(l));
  return foldedLines.join('\r\n') + '\r\n';
}

export function getVCardMimeType(version: VCardVersion = '4.0'): string {
  return version === '4.0' ? 'text/vcard; charset=utf-8' : 'text/x-vcard; charset=utf-8';
}

export function getVCardFilename(fullName: string, customName?: string): string {
  if (customName?.trim()) {
    const cleaned = sanitizeFilename(customName);
    return cleaned.endsWith('.vcf') ? cleaned : `${cleaned}.vcf`;
  }
  const base = sanitizeFilename(fullName, 'contact');
  return `${base}.vcf`;
}
