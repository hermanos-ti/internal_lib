import { describe, it, expect } from 'vitest';
import { validateFormat, runValidation, sortImportData } from '../components/Tabela/importUtils.js';

describe('validateFormat', () => {
  it('should return true for empty values', () => {
    expect(validateFormat(null, 'number')).toBe(true);
    expect(validateFormat('', 'date')).toBe(true);
  });

  it('should return true for any text', () => {
    expect(validateFormat('anything', 'text')).toBe(true);
  });

  it('should validate number format', () => {
    expect(validateFormat('123', 'number')).toBe(true);
    expect(validateFormat('abc', 'number')).toBe(false);
  });

  it('should validate money format', () => {
    expect(validateFormat('1234.56', 'money')).toBe(true);
  });
});

describe('runValidation', () => {
  const columns = [
    { key: 'name', format: 'text', obrigatorio: true },
    { key: 'value', format: 'number' },
  ];

  it('should return error for missing required field', () => {
    const result = runValidation({ name: '', value: '10' }, columns);
    expect(result.status).toBe('error');
    expect(result.columns.name).toBe('error');
  });

  it('should return success for valid data', () => {
    const result = runValidation({ name: 'Test', value: '10' }, columns);
    expect(result.status).toBe('success');
  });

  it('should return warning for invalid format', () => {
    const result = runValidation({ name: 'Test', value: 'abc' }, columns);
    expect(result.status).toBe('warning');
    expect(result.columns.value).toBe('warning');
  });

  it('should call custom validator', () => {
    const cols = [{ key: 'x', format: 'text', validator: (v) => v === 'valid' }];
    const result = runValidation({ x: 'invalid' }, cols);
    expect(result.status).toBe('error');
  });
});

describe('sortImportData', () => {
  const data = [
    { name: 'Charlie', value: '30' },
    { name: 'Alice', value: '10' },
    { name: 'Bob', value: '20' },
  ];
  const columns = [
    { key: 'name', format: 'text' },
    { key: 'value', format: 'number' },
  ];

  it('should sort text ascending', () => {
    const sorted = sortImportData(data, { key: 'name', direction: 'asc' }, columns);
    expect(sorted[0].name).toBe('Alice');
    expect(sorted[2].name).toBe('Charlie');
  });

  it('should sort numbers ascending', () => {
    const sorted = sortImportData(data, { key: 'value', direction: 'asc' }, columns);
    expect(sorted[0].value).toBe('10');
  });

  it('should sort descending', () => {
    const sorted = sortImportData(data, { key: 'name', direction: 'desc' }, columns);
    expect(sorted[0].name).toBe('Charlie');
  });

  it('should return copy when no sortBy', () => {
    const sorted = sortImportData(data, null, columns);
    expect(sorted).toEqual(data);
    expect(sorted).not.toBe(data);
  });
});
