import { escapeHtmlAttr, isValidCssColor } from '../shared/html';
import type { SignatureStroke, SignatureSvgOptions } from './types';

/**
 * Headlessly serializes structured signature strokes into a clean, safe SVG string.
 * Strictly validates coordinates to prevent SVG/XML injection.
 */
export function serializeSignatureSvg(
  strokes: SignatureStroke[],
  options: SignatureSvgOptions = {}
): string {
  if (!Array.isArray(strokes) || strokes.length === 0) {
    const width = options.width ?? 300;
    const height = options.height ?? 150;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"></svg>`;
  }

  // Calculate bounding box if width/height not provided
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    for (const pt of stroke.points) {
      if (Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
        if (pt.x < minX) minX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y > maxY) maxY = pt.y;
      }
    }
  }

  const padding = 10;
  const computedWidth = Number.isFinite(minX) ? Math.max(10, Math.ceil(maxX - minX + padding * 2)) : 300;
  const computedHeight = Number.isFinite(minY) ? Math.max(10, Math.ceil(maxY - minY + padding * 2)) : 150;

  const width = options.width ?? computedWidth;
  const height = options.height ?? computedHeight;
  const viewBox = `0 0 ${width} ${height}`;

  const elements: string[] = [];

  // Optional background
  if (options.backgroundColor && isValidCssColor(options.backgroundColor) && options.backgroundColor !== 'transparent') {
    elements.push(
      `<rect width="${width}" height="${height}" fill="${escapeHtmlAttr(options.backgroundColor)}" />`
    );
  }

  for (const stroke of strokes) {
    if (!stroke.points || stroke.points.length === 0) continue;
    const color = isValidCssColor(stroke.color) ? stroke.color : '#000000';
    const strokeWidth = Number.isFinite(stroke.width) && stroke.width > 0 ? stroke.width : 2;

    if (stroke.points.length === 1) {
      const pt = stroke.points[0]!;
      if (Number.isFinite(pt.x) && Number.isFinite(pt.y)) {
        elements.push(
          `<circle cx="${pt.x}" cy="${pt.y}" r="${strokeWidth / 2}" fill="${escapeHtmlAttr(color)}" />`
        );
      }
      continue;
    }

    // Build smooth SVG path
    let d = '';
    for (let i = 0; i < stroke.points.length; i++) {
      const pt = stroke.points[i]!;
      if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) continue;

      if (i === 0) {
        d += `M ${pt.x} ${pt.y}`;
      } else {
        d += ` L ${pt.x} ${pt.y}`;
      }
    }

    if (d) {
      elements.push(
        `<path d="${d}" fill="none" stroke="${escapeHtmlAttr(color)}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />`
      );
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">\n  ${elements.join('\n  ')}\n</svg>`;
}
