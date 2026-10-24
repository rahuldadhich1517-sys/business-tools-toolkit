import { ValidationError } from './errors';
import { isSafeUrl } from './html';

export function validateRequired<T>(value: T | null | undefined, fieldName: string): T {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    throw new ValidationError(`${fieldName} is required`, { field: fieldName });
  }
  return value;
}

export function validateString(
  value: unknown,
  fieldName: string,
  options: { minLength?: number; maxLength?: number; allowEmpty?: boolean } = {}
): string {
  if (value === null || value === undefined) {
    if (options.allowEmpty) return '';
    throw new ValidationError(`${fieldName} is required`, { field: fieldName });
  }
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} must be a string`, { field: fieldName });
  }
  const str = value.trim();
  if (!options.allowEmpty && str.length === 0) {
    throw new ValidationError(`${fieldName} cannot be empty`, { field: fieldName });
  }
  if (options.minLength !== undefined && str.length < options.minLength) {
    throw new ValidationError(`${fieldName} must have at least ${options.minLength} characters`, { field: fieldName });
  }
  if (options.maxLength !== undefined && str.length > options.maxLength) {
    throw new ValidationError(`${fieldName} cannot exceed ${options.maxLength} characters`, { field: fieldName });
  }
  return str;
}

export function validateEmail(email: unknown, fieldName = 'email'): string {
  const str = validateString(email, fieldName, { minLength: 3, maxLength: 254 });
  // Standard email regex (HTML5 specification regex)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(str)) {
    throw new ValidationError(`${fieldName} must be a valid email address`, { field: fieldName });
  }
  return str.toLowerCase();
}

export function validateUrl(
  url: unknown,
  fieldName = 'url',
  allowedSchemes: string[] = ['https:', 'mailto:', 'tel:']
): string {
  const str = validateString(url, fieldName);
  if (!isSafeUrl(str, allowedSchemes)) {
    throw new ValidationError(
      `${fieldName} must be a valid URL using one of the allowed schemes: ${allowedSchemes.join(', ')}`,
      { field: fieldName }
    );
  }
  return str;
}

export function validateNumber(
  value: unknown,
  fieldName: string,
  options: { min?: number; max?: number; allowZero?: boolean } = {}
): number {
  if (value === null || value === undefined || typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(`${fieldName} must be a finite number`, { field: fieldName });
  }
  const allowZero = options.allowZero ?? false;
  const min = options.min ?? (allowZero ? 0 : 0.000001);
  if (value < min) {
    throw new ValidationError(`${fieldName} must be at least ${min}`, { field: fieldName });
  }
  if (options.max !== undefined && value > options.max) {
    throw new ValidationError(`${fieldName} cannot exceed ${options.max}`, { field: fieldName });
  }
  return value;
}

export function validateDate(dateStr: unknown, fieldName = 'date'): string {
  const str = validateString(dateStr, fieldName);
  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date string`, { field: fieldName });
  }
  return str;
}

export function sanitizeFilename(name: string, fallback = 'document'): string {
  if (!name || typeof name !== 'string') return fallback;
  const cleaned = name
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, '_');
  return cleaned.length > 0 ? cleaned : fallback;
}
