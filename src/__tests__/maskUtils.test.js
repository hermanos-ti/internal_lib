import { describe, it, expect } from 'vitest';
import { maskCPF, maskPhone, maskCurrency, maskDate } from '../components/Input/maskUtils.js';

describe('maskCPF', () => {
  it('should format CPF digits', () => {
    expect(maskCPF('52998224725')).toBe('529.982.247-25');
  });

  it('should handle partial input', () => {
    expect(maskCPF('529')).toBe('529');
    expect(maskCPF('5299')).toBe('529.9');
    expect(maskCPF('529982')).toBe('529.982');
  });

  it('should strip non-digits', () => {
    expect(maskCPF('529.982.247-25')).toBe('529.982.247-25');
  });

  it('should handle null/undefined', () => {
    expect(maskCPF(null)).toBe('');
    expect(maskCPF(undefined)).toBe('');
  });

  it('should truncate at 11 digits', () => {
    expect(maskCPF('529982247251234')).toBe('529.982.247-25');
  });
});

describe('maskPhone', () => {
  it('should format 10-digit phone', () => {
    expect(maskPhone('1112345678')).toBe('(11) 1234-5678');
  });

  it('should format 11-digit phone', () => {
    expect(maskPhone('11912345678')).toBe('(11) 91234-5678');
  });

  it('should handle partial input', () => {
    expect(maskPhone('11')).toBe('11');
    expect(maskPhone('111')).toBe('(11) 1');
  });

  it('should handle null', () => {
    expect(maskPhone(null)).toBe('');
  });
});

describe('maskCurrency', () => {
  it('should format as BRL', () => {
    expect(maskCurrency('123456')).toBe('1.234,56');
  });

  it('should handle small values', () => {
    expect(maskCurrency('100')).toBe('1,00');
  });

  it('should return empty for empty input', () => {
    expect(maskCurrency('')).toBe('');
    expect(maskCurrency(null)).toBe('');
  });
});

describe('maskDate', () => {
  it('should format as dd/mm/yyyy', () => {
    expect(maskDate('15012024')).toBe('15/01/2024');
  });

  it('should handle partial input', () => {
    expect(maskDate('15')).toBe('15');
    expect(maskDate('1501')).toBe('15/01');
    expect(maskDate('150120')).toBe('15/01/20');
  });

  it('should handle null', () => {
    expect(maskDate(null)).toBe('');
  });
});
