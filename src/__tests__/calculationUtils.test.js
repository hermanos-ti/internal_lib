import { describe, it, expect } from 'vitest';
import { computeCalculation, getCellValues, isEmpty } from '../components/Tabela/calculationUtils.js';

describe('getCellValues', () => {
  it('should return empty array for null/undefined/empty', () => {
    expect(getCellValues(null)).toEqual([]);
    expect(getCellValues(undefined)).toEqual([]);
    expect(getCellValues('')).toEqual([]);
  });

  it('should wrap single value in array', () => {
    expect(getCellValues('hello')).toEqual(['hello']);
    expect(getCellValues(42)).toEqual([42]);
  });

  it('should filter null/empty from arrays', () => {
    expect(getCellValues(['a', null, '', 'b'])).toEqual(['a', 'b']);
  });
});

describe('isEmpty', () => {
  it('should return true for empty values', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty('')).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
  });

  it('should return false for non-empty values', () => {
    expect(isEmpty('hello')).toBe(false);
    expect(isEmpty(0)).toBe(false);
  });
});

describe('computeCalculation', () => {
  const data = [
    { value: 10, name: 'A' },
    { value: 20, name: 'B' },
    { value: 30, name: 'A' },
    { value: null, name: '' },
  ];

  const numberCol = { key: 'value', type: 'number', format: 'number' };
  const textCol = { key: 'name', type: 'text', format: 'text' };

  it('should return empty for no data', () => {
    expect(computeCalculation([], numberCol, 'sum').formatted).toBe('—');
  });

  it('should return empty for no calculationId', () => {
    expect(computeCalculation(data, numberCol, 'none').formatted).toBe('—');
    expect(computeCalculation(data, numberCol, null).formatted).toBe('—');
  });

  it('should count all rows', () => {
    const result = computeCalculation(data, numberCol, 'countAll');
    expect(result.value).toBe(4);
  });

  it('should count non-empty values', () => {
    const result = computeCalculation(data, numberCol, 'countNonEmpty');
    expect(result.value).toBe(3);
  });

  it('should count empty values', () => {
    const result = computeCalculation(data, numberCol, 'countEmpty');
    expect(result.value).toBe(1);
  });

  it('should count unique values', () => {
    const result = computeCalculation(data, textCol, 'countUnique');
    expect(result.value).toBe(2);
  });

  it('should calculate sum for number columns', () => {
    const result = computeCalculation(data, numberCol, 'sum');
    expect(result.value).toBe(60);
  });

  it('should calculate average for number columns', () => {
    const result = computeCalculation(data, numberCol, 'average');
    expect(result.value).toBe(20);
  });

  it('should calculate median for number columns', () => {
    const result = computeCalculation(data, numberCol, 'median');
    expect(result.value).toBe(20);
  });

  it('should calculate min for number columns', () => {
    const result = computeCalculation(data, numberCol, 'min');
    expect(result.value).toBe(10);
  });

  it('should calculate max for number columns', () => {
    const result = computeCalculation(data, numberCol, 'max');
    expect(result.value).toBe(30);
  });

  it('should calculate range for number columns', () => {
    const result = computeCalculation(data, numberCol, 'range');
    expect(result.value).toBe(20);
  });

  it('should calculate percentage of empty', () => {
    const result = computeCalculation(data, numberCol, 'pctEmpty');
    expect(result.value).toBe(25);
  });

  it('should calculate percentage of non-empty', () => {
    const result = computeCalculation(data, numberCol, 'pctNonEmpty');
    expect(result.value).toBe(75);
  });
});
