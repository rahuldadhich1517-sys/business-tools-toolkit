/**
 * Escapes HTML characters in text to prevent XSS / markup injection.
 */
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  const text = String(str);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escapes attribute values in HTML strings.
 */
export function escapeHtmlAttr(str: unknown): string {
  return escapeHtml(str);
}

/**
 * Validates that a URL is safe and uses an allowed protocol (e.g. https, mailto, tel).
 * Explicitly rejects dangerous schemes like javascript:, data:, vbscript:.
 */
export function isSafeUrl(url: string, allowedSchemes: string[] = ['https:', 'mailto:', 'tel:']): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Disallow control characters
  if (/[\u0000-\u001f\u007f-\u009f]/.test(trimmed)) {
    return false;
  }

  // Check mailto: or tel: prefixes
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('vbscript:') || lower.startsWith('data:')) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return allowedSchemes.includes(parsed.protocol.toLowerCase());
  } catch {
    // If it cannot be parsed as an absolute URL:
    // Check if it's a telephone or email without explicit scheme, or mailto:
    if (allowedSchemes.includes('tel:') && /^\+?[0-9\s\-().]{5,30}$/.test(trimmed)) {
      return true;
    }
    return false;
  }
}

/**
 * Validates a CSS color string (hex, rgb, hsl, or basic named colors).
 */
export function isValidCssColor(color: string): boolean {
  if (!color || typeof color !== 'string') return false;
  const trimmed = color.trim().toLowerCase();
  // Hex color #rgb, #rgba, #rrggbb, #rrggbbaa
  if (/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(trimmed)) {
    return true;
  }
  // rgb / rgba
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/.test(trimmed)) {
    return true;
  }
  // Safe basic CSS color names
  const safeNames = new Set([
    'transparent', 'currentcolor', 'black', 'white', 'gray', 'grey',
    'red', 'blue', 'green', 'yellow', 'purple', 'navy', 'teal', 'maroon',
    'silver', 'orange', 'cyan', 'magenta', 'indigo', 'violet'
  ]);
  return safeNames.has(trimmed);
}
