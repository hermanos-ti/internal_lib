import { describe, it, expect } from 'vitest';
import { toCSV, getExportFilename, prepareExportData } from '../components/Tabela/exportUtils.js';

describe('toCSV', () => {
  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'value', label: 'Valor' },
  ];

  it('should generate CSV with headers and rows', () => {
    const data = [{ name: 'A', value: '10' }];
    const csv = toCSV(data, columns);
    expect(csv).toContain('\uFEFF');
    expect(csv).toContain('Nome,Valor');
    expect(csv).toContain('A,10');
  });

  it('should escape fields with commas', () => {
    const data = [{ name: 'A, B', value: '10' }];
    const csv = toCSV(data, columns);
    expect(csv).toContain('"A, B"');
  });

  it('should prevent CSV formula injection', () => {
    const data = [{ name: '=SUM(A1)', value: '+cmd' }];
    const csv = toCSV(data, columns);
    expect(csv).toContain("\"'=SUM(A1)\"");
    expect(csv).toContain("\"'+cmd\"");
  });

  it('should handle null values', () => {
    const data = [{ name: null, value: undefined }];
    const csv = toCSV(data, columns);
    expect(csv).toContain('Nome,Valor');
  });
});

describe('getExportFilename', () => {
  it('should generate filename with timestamp', () => {
    const filename = getExportFilename('Tabela', 'csv');
    expect(filename).toMatch(/^Tabela-\d{4}-\d{2}-\d{2}-\d{6}\.csv$/);
  });

  it('should default to Tabela when baseName is null', () => {
    const filename = getExportFilename(null, 'csv');
    expect(filename).toMatch(/^Tabela-/);
  });

  it('should sanitize path traversal characters', () => {
    const filename = getExportFilename('../../../etc/passwd', 'csv');
    expect(filename).not.toContain('..');
    expect(filename).not.toContain('/');
  });

  it('should sanitize special characters from extension', () => {
    const filename = getExportFilename('file', 'csv"<>');
    expect(filename).not.toContain('"');
    expect(filename).not.toContain('<');
  });
});

describe('prepareExportData', () => {
  it('should return empty array for no data', () => {
    expect(prepareExportData([], [{ key: 'a' }])).toEqual([]);
    expect(prepareExportData(null, [{ key: 'a' }])).toEqual([]);
  });

  it('should format values using column format', () => {
    const data = [{ price: 1234.5 }];
    const columns = [{ key: 'price', format: 'money' }];
    const result = prepareExportData(data, columns, null, () => '0');
    expect(result[0].price).toContain('R$');
  });
});
