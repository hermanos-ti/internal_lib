import { describe, it, expect } from 'vitest';
import { formatDisplayValue } from '../components/Tabela/formatUtils.js';

describe('formatDisplayValue', () => {
  it('should return empty display for null/undefined/empty', () => {
    expect(formatDisplayValue(null)).toBe('—');
    expect(formatDisplayValue(undefined)).toBe('—');
    expect(formatDisplayValue('')).toBe('—');
  });

  it('should use custom emptyDisplay', () => {
    expect(formatDisplayValue(null, 'text', { emptyDisplay: '-' })).toBe('-');
  });

  it('should format money as BRL currency', () => {
    const result = formatDisplayValue(1234.5, 'money');
    expect(result).toContain('1.234,50');
    expect(result).toContain('R$');
  });

  it('should format percentage with %', () => {
    const result = formatDisplayValue(42.5, 'percentage');
    expect(result).toContain('42,5');
    expect(result).toContain('%');
  });

  it('should format number with pt-BR locale', () => {
    const result = formatDisplayValue(1234.56, 'number');
    expect(result).toBe('1.234,56');
  });

  it('should format integer without decimals', () => {
    const result = formatDisplayValue(1234.7, 'integer');
    expect(result).toBe('1.235');
  });

  it('should format date as dd/mm/yyyy', () => {
    const result = formatDisplayValue('2024-01-15T12:00:00', 'date');
    expect(result).toMatch(/15\/01\/2024/);
  });

  it('should return empty display for invalid number', () => {
    expect(formatDisplayValue('abc', 'money')).toBe('—');
    expect(formatDisplayValue('abc', 'number')).toBe('—');
  });

  it('should format text as string', () => {
    expect(formatDisplayValue('hello', 'text')).toBe('hello');
    expect(formatDisplayValue(123, 'text')).toBe('123');
  });

  it('should format arrays by joining formatted values', () => {
    const result = formatDisplayValue([1234, 5678], 'money');
    expect(result).toContain('R$');
    expect(result).toContain(',');
  });

  it('should return empty display for empty array', () => {
    expect(formatDisplayValue([], 'text')).toBe('—');
    expect(formatDisplayValue([null, ''], 'text')).toBe('—');
  });
});
