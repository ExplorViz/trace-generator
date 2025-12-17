import { describe, expect, it } from 'vitest';
import {
  capitalizeString,
  getHostIP,
  getHostname,
  isValidInteger,
  isValidNumber,
  sanitizeJavaIdentifier,
} from '../../src/backend/utils';

describe('capitalizeString', () => {
  it('should capitalize the first character of a string', () => {
    expect(capitalizeString('hello')).toBe('Hello');
    expect(capitalizeString('world')).toBe('World');
  });

  it('should handle already capitalized strings', () => {
    expect(capitalizeString('Hello')).toBe('Hello');
  });

  it('should handle single character strings', () => {
    expect(capitalizeString('a')).toBe('A');
    expect(capitalizeString('Z')).toBe('Z');
  });

  it('should handle empty strings', () => {
    expect(capitalizeString('')).toBe('');
  });

  it('should only capitalize the first character', () => {
    expect(capitalizeString('hello world')).toBe('Hello world');
  });

  it('should handle strings with numbers', () => {
    expect(capitalizeString('123abc')).toBe('123abc');
  });
});

describe('isValidNumber', () => {
  it('should return true for valid numbers', () => {
    expect(isValidNumber('123')).toBe(true);
    expect(isValidNumber('123.456')).toBe(true);
    expect(isValidNumber('-123')).toBe(true);
    expect(isValidNumber('-123.456')).toBe(true);
    expect(isValidNumber('0')).toBe(true);
    expect(isValidNumber('0.0')).toBe(true);
  });

  it('should return false for invalid numbers', () => {
    expect(isValidNumber('abc')).toBe(false);
    expect(isValidNumber('123abc')).toBe(false);
    expect(isValidNumber('abc123')).toBe(false);
    expect(isValidNumber('')).toBe(false);
    expect(isValidNumber(' ')).toBe(false);
  });

  it('should handle scientific notation', () => {
    expect(isValidNumber('1e10')).toBe(true);
    expect(isValidNumber('1.5e-10')).toBe(true);
  });

  it('should handle edge cases', () => {
    expect(isValidNumber('Infinity')).toBe(true);
    expect(isValidNumber('-Infinity')).toBe(true);
    expect(isValidNumber('NaN')).toBe(false);
  });
});

describe('isValidInteger', () => {
  it('should return true for valid integers', () => {
    expect(isValidInteger('123')).toBe(true);
    expect(isValidInteger('-123')).toBe(true);
    expect(isValidInteger('0')).toBe(true);
  });

  it('should return false for non-integers', () => {
    expect(isValidInteger('123.456')).toBe(false);
    expect(isValidInteger('-123.456')).toBe(false);
    expect(isValidInteger('0.5')).toBe(false);
  });

  it('should return false for invalid inputs', () => {
    expect(isValidInteger('abc')).toBe(false);
    expect(isValidInteger('123abc')).toBe(false);
    expect(isValidInteger('')).toBe(false);
  });

  it('should handle edge cases', () => {
    expect(isValidInteger('1e10')).toBe(true); // 10000000000
    expect(isValidInteger('1.5e10')).toBe(true); // 15000000000
    expect(isValidInteger('1e-10')).toBe(false); // 0.0000000001
  });
});

describe('sanitizeJavaIdentifier', () => {
  it('should return valid identifiers unchanged', () => {
    expect(sanitizeJavaIdentifier('validIdentifier')).toBe('validIdentifier');
    expect(sanitizeJavaIdentifier('ValidClass')).toBe('ValidClass');
    expect(sanitizeJavaIdentifier('myVariable123')).toBe('myVariable123');
    expect(sanitizeJavaIdentifier('_privateVar')).toBe('_privateVar');
    expect(sanitizeJavaIdentifier('$jquery')).toBe('$jquery');
  });

  it('should remove invalid characters', () => {
    expect(sanitizeJavaIdentifier('my-variable')).toBe('myvariable');
    expect(sanitizeJavaIdentifier('my.variable')).toBe('myvariable');
    expect(sanitizeJavaIdentifier('my variable')).toBe('myvariable');
    expect(sanitizeJavaIdentifier('my@variable')).toBe('myvariable');
  });

  it('should remove leading numbers', () => {
    expect(sanitizeJavaIdentifier('123variable')).toBe('variable');
    expect(sanitizeJavaIdentifier('99problems')).toBe('problems');
  });

  it('should return fallback for reserved keywords', () => {
    expect(sanitizeJavaIdentifier('class')).toBe('fallbackIdentifier');
    expect(sanitizeJavaIdentifier('public')).toBe('fallbackIdentifier');
    expect(sanitizeJavaIdentifier('private')).toBe('fallbackIdentifier');
    expect(sanitizeJavaIdentifier('if')).toBe('fallbackIdentifier');
    expect(sanitizeJavaIdentifier('while')).toBe('fallbackIdentifier');
    expect(sanitizeJavaIdentifier('true')).toBe('fallbackIdentifier');
    expect(sanitizeJavaIdentifier('false')).toBe('fallbackIdentifier');
    expect(sanitizeJavaIdentifier('null')).toBe('fallbackIdentifier');
  });

  it('should return fallback for empty or invalid results', () => {
    expect(sanitizeJavaIdentifier('')).toBe('fallbackIdentifier');
    expect(sanitizeJavaIdentifier('123')).toBe('fallbackIdentifier');
    expect(sanitizeJavaIdentifier('---')).toBe('fallbackIdentifier');
    expect(sanitizeJavaIdentifier('   ')).toBe('fallbackIdentifier');
  });

  it('should handle mixed case keywords', () => {
    // Note: The function is case-sensitive, so 'Class' is valid but 'class' is not
    expect(sanitizeJavaIdentifier('Class')).toBe('Class');
    expect(sanitizeJavaIdentifier('PUBLIC')).toBe('PUBLIC');
  });
});

describe('getHostname', () => {
  it('should return a non-empty string', () => {
    const hostname = getHostname();
    expect(hostname).toBeTruthy();
    expect(typeof hostname).toBe('string');
    expect(hostname.length).toBeGreaterThan(0);
  });
});

describe('getHostIP', () => {
  it('should return an IP address or fallback', () => {
    const ip = getHostIP();
    expect(ip).toBeTruthy();
    expect(typeof ip).toBe('string');

    // Should be a valid IP format or the fallback
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    expect(ipPattern.test(ip)).toBe(true);
  });

  it('should return a string that looks like an IPv4 address', () => {
    const ip = getHostIP();
    const parts = ip.split('.');

    expect(parts).toHaveLength(4);
    parts.forEach((part) => {
      const num = parseInt(part, 10);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThanOrEqual(255);
    });
  });
});
