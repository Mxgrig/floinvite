/**
 * Input Validators
 * Centralized validation logic for guest, host, and CSV data
 */

import { VALIDATION_RULES, ERROR_MESSAGES } from './constants';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate guest name
 */
export const validateGuestName = (name: string): ValidationResult => {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push(ERROR_MESSAGES.guest.noName);
    return { isValid: false, errors };
  }

  const minLength = VALIDATION_RULES.guest.name.minLength;
  const maxLength = VALIDATION_RULES.guest.name.maxLength;
  const pattern = VALIDATION_RULES.guest.name.pattern;

  if (name.length < minLength || name.length > maxLength) {
    errors.push(`Name must be between ${minLength} and ${maxLength} characters`);
  }

  if (!pattern.test(name)) {
    errors.push('Name can only contain letters, spaces, hyphens, and apostrophes');
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate email address
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    // Email is optional
    return { isValid: true, errors };
  }

  const pattern = VALIDATION_RULES.guest.email.pattern;

  if (!pattern.test(email)) {
    errors.push(ERROR_MESSAGES.guest.invalidEmail);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate phone number
 */
export const validatePhone = (phone: string): ValidationResult => {
  const errors: string[] = [];

  if (!phone || phone.trim().length === 0) {
    // Phone is optional
    return { isValid: true, errors };
  }

  const pattern = VALIDATION_RULES.guest.phone.pattern;
  const minLength = VALIDATION_RULES.guest.phone.minLength;

  if (!pattern.test(phone)) {
    errors.push(ERROR_MESSAGES.guest.invalidPhone);
  }

  if (phone.replace(/\D/g, '').length < minLength) {
    errors.push(`Phone number must have at least ${minLength} digits`);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate host name
 */
export const validateHostName = (name: string): ValidationResult => {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Host name is required');
    return { isValid: false, errors };
  }

  const minLength = VALIDATION_RULES.host.name.minLength;
  const maxLength = VALIDATION_RULES.host.name.maxLength;

  if (name.length < minLength || name.length > maxLength) {
    errors.push(`Name must be between ${minLength} and ${maxLength} characters`);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate host email
 */
export const validateHostEmail = (email: string): ValidationResult => {
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    errors.push('Email is required for notifications');
    return { isValid: false, errors };
  }

  const pattern = VALIDATION_RULES.host.email.pattern;

  if (!pattern.test(email)) {
    errors.push(ERROR_MESSAGES.guest.invalidEmail);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate CSV file structure
 */
export const validateCSVStructure = (
  headers: string[]
): ValidationResult => {
  const errors: string[] = [];
  const requiredColumns = VALIDATION_RULES.csv.requiredColumns;

  const headerLower = headers.map(h => h.toLowerCase());
  const hasRequired = requiredColumns.every(col =>
    headerLower.includes(col.toLowerCase())
  );

  if (!hasRequired) {
    errors.push(ERROR_MESSAGES.csv.missingColumns);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate CSV row data
 */
export const validateCSVRow = (
  row: Record<string, string>,
  rowNumber: number
): ValidationResult => {
  const errors: string[] = [];

  // Validate name
  const nameValidation = validateGuestName(row.Name || '');
  if (!nameValidation.isValid) {
    errors.push(`Row ${rowNumber}: ${nameValidation.errors[0]}`);
  }

  // Validate email
  const emailValidation = validateEmail(row.Email || '');
  if (!emailValidation.isValid) {
    errors.push(`Row ${rowNumber}: ${emailValidation.errors[0]}`);
  }

  // Validate phone if provided
  if (row.Phone) {
    const phoneValidation = validatePhone(row.Phone);
    if (!phoneValidation.isValid) {
      errors.push(`Row ${rowNumber}: ${phoneValidation.errors[0]}`);
    }
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate complete CSV import
 */
export const validateCSVImport = (
  headers: string[],
  rows: Record<string, string>[]
): ValidationResult => {
  const errors: string[] = [];

  // Validate structure
  const structureValidation = validateCSVStructure(headers);
  if (!structureValidation.isValid) {
    return structureValidation;
  }

  // Check row count
  const maxRows = VALIDATION_RULES.csv.maxRows;
  if (rows.length === 0) {
    errors.push(ERROR_MESSAGES.csv.noData);
    return { isValid: false, errors };
  }

  if (rows.length > maxRows) {
    errors.push(ERROR_MESSAGES.csv.tooManyRows);
    return { isValid: false, errors };
  }

  // Validate each row
  const rowErrors: string[] = [];
  rows.forEach((row, index) => {
    const rowValidation = validateCSVRow(row, index + 1);
    if (!rowValidation.isValid) {
      rowErrors.push(...rowValidation.errors);
    }
  });

  if (rowErrors.length > 0) {
    errors.push(...rowErrors);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Sanitize text input
 * Remove harmful characters while preserving readability
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/&/g, '&amp;')
    .substring(0, 500); // Limit length
};

/**
 * Normalize phone number
 * Removes spaces, dashes, parentheses
 */
export const normalizePhone = (phone: string): string => {
  return phone.replace(/[\s\-\(\)]/g, '');
};

/**
 * Normalize email to lowercase
 */
export const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

/**
 * Check if guest data is complete for check-in
 */
export const isCheckInReady = (
  guestName: string,
  hostId: string
): ValidationResult => {
  const errors: string[] = [];

  const nameValidation = validateGuestName(guestName);
  if (!nameValidation.isValid) {
    errors.push(...nameValidation.errors);
  }

  if (!hostId) {
    errors.push(ERROR_MESSAGES.guest.noHost);
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Check for duplicate email in hosts list
 */
export const hasDuplicateEmail = (
  email: string,
  existingEmails: string[],
  excludeEmail?: string
): boolean => {
  const normalized = normalizeEmail(email);
  const excluded = excludeEmail ? normalizeEmail(excludeEmail) : null;

  return existingEmails.some(
    existing =>
      normalizeEmail(existing) === normalized &&
      normalizeEmail(existing) !== excluded
  );
};

/**
 * Validate file type for upload
 */
export const isValidCSVFile = (file: File): boolean => {
  const validTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];
  const validExtensions = ['.csv', '.txt'];

  const hasValidType = validTypes.includes(file.type);
  const hasValidExtension = validExtensions.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );

  return hasValidType || hasValidExtension;
};

/**
 * Parse and normalize CSV file text
 */
export const parseCSVText = (text: string): Record<string, string>[] => {
  const lines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) {
    return [];
  }

  // Parse header
  const headers = lines[0]
    .split(',')
    .map(h => h.trim())
    .map(h => h.replace(/^["']|["']$/g, '')); // Remove quotes

  // Parse rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i]
      .split(',')
      .map(cell => cell.trim())
      .map(cell => cell.replace(/^["']|["']$/g, '')); // Remove quotes

    if (cells.length === headers.length) {
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = cells[idx] || '';
      });
      rows.push(row);
    }
  }

  return rows;
};

/**
 * Batch validate multiple emails (for CSV import)
 */
export const validateEmailBatch = (emails: string[]): ValidationResult => {
  const errors: string[] = [];

  emails.forEach((email, index) => {
    const validation = validateEmail(email);
    if (!validation.isValid) {
      errors.push(`Row ${index + 1}: ${validation.errors[0]}`);
    }
  });

  return { isValid: errors.length === 0, errors };
};
