import { describe, it, expect } from 'vitest';
import { format, parse, getMonthName, isValidDate } from '../functions/Formatter/dateFormat.js';

describe('dateFormat', () => {
  describe('getMonthName', () => {
    it('should return full month name', () => {
      expect(getMonthName(0)).toBe('janeiro');
      expect(getMonthName(11)).toBe('dezembro');
    });

    it('should return short month name', () => {
      expect(getMonthName(0, true)).toBe('jan');
      expect(getMonthName(11, true)).toBe('dez');
    });

    it('should clamp out-of-range months', () => {
      expect(getMonthName(-1)).toBe('janeiro');
      expect(getMonthName(99)).toBe('dezembro');
    });
  });

  describe('format', () => {
    const date = new Date(2024, 0, 15, 14, 30);

    it('should format as dd/mm/yyyy by default', () => {
      expect(format(date)).toBe('15/01/2024');
    });

    it('should format data-curto as dd/mm/yy', () => {
      expect(format(date, 'data-curto')).toBe('15/01/24');
    });

    it('should format data-hora with time', () => {
      expect(format(date, 'data-hora')).toBe('15/01/2024 14:30');
    });

    it('should format hora only', () => {
      expect(format(date, 'hora')).toBe('14:30');
    });

    it('should format dia-mes', () => {
      expect(format(date, 'dia-mes')).toBe('15/01');
    });

    it('should format mes-ano', () => {
      expect(format(date, 'mes-ano')).toBe('01/2024');
    });

    it('should return empty string for invalid date', () => {
      expect(format(null)).toBe('');
      expect(format(new Date('invalid'))).toBe('');
    });

    it('should fallback to default for unknown format', () => {
      expect(format(date, 'unknown-format')).toBe('15/01/2024');
    });
  });

  describe('parse', () => {
    it('should parse dd/mm/yyyy', () => {
      const d = parse('15/01/2024', 'data');
      expect(d.getDate()).toBe(15);
      expect(d.getMonth()).toBe(0);
      expect(d.getFullYear()).toBe(2024);
    });

    it('should parse dd/mm/yy (data-curto)', () => {
      const d = parse('15/01/24', 'data-curto');
      expect(d.getFullYear()).toBe(2024);
    });

    it('should parse hora', () => {
      const d = parse('14:30', 'hora');
      expect(d.getHours()).toBe(14);
      expect(d.getMinutes()).toBe(30);
    });

    it('should return null for invalid input', () => {
      expect(parse(null)).toBeNull();
      expect(parse('')).toBeNull();
      expect(parse('invalid', 'data')).toBeNull();
    });

    it('should accept Date objects', () => {
      const d = new Date(2024, 0, 15);
      expect(parse(d)).toEqual(d);
    });

    it('should return null for invalid Date objects', () => {
      expect(parse(new Date('invalid'))).toBeNull();
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid date within range', () => {
      const d = new Date(2024, 5, 15);
      expect(isValidDate(d, '01/01/2024', '31/12/2024')).toBe(true);
    });

    it('should return false for date before min', () => {
      const d = new Date(2023, 0, 1);
      expect(isValidDate(d, '01/01/2024', null)).toBe(false);
    });

    it('should return false for null or invalid date', () => {
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(new Date('invalid'))).toBe(false);
    });
  });
});
