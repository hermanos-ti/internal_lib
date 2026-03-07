import { describe, it, expect } from 'vitest';
import { CONDITION_TO_SQL, filterToSQL, filtersToSQL } from '../components/Tabela/constants.js';

describe('CONDITION_TO_SQL', () => {
  describe('text conditions', () => {
    it('should escape single quotes in text values', () => {
      const sql = CONDITION_TO_SQL.is('[col]', "O'Brien");
      expect(sql).toContain("O''Brien");
    });

    it('should escape LIKE wildcards in contains', () => {
      const sql = CONDITION_TO_SQL.contains('[col]', '100%');
      expect(sql).toContain('[%]');
    });

    it('should escape LIKE wildcards in startsWith', () => {
      const sql = CONDITION_TO_SQL.startsWith('[col]', 'test_value');
      expect(sql).toContain('[_]');
    });
  });

  describe('number conditions - SQL injection prevention', () => {
    it('should sanitize numeric values', () => {
      const sql = CONDITION_TO_SQL.equals('[col]', '42');
      expect(sql).toContain('42');
    });

    it('should reject non-numeric injection attempts', () => {
      const sql = CONDITION_TO_SQL.equals('[col]', '1; DROP TABLE users;--');
      expect(sql).not.toContain('DROP');
      expect(sql).toContain('0');
    });

    it('should handle NaN values safely', () => {
      const sql = CONDITION_TO_SQL.greaterThan('[col]', 'not-a-number');
      expect(sql).toContain('0');
    });

    it('should handle valid negative numbers', () => {
      const sql = CONDITION_TO_SQL.lessThan('[col]', '-5');
      expect(sql).toContain('-5');
    });

    it('should handle valid decimal numbers', () => {
      const sql = CONDITION_TO_SQL.greaterOrEqual('[col]', '3.14');
      expect(sql).toContain('3.14');
    });
  });

  describe('date conditions - escaping', () => {
    it('should escape single quotes in date values preventing SQL breakout', () => {
      const sql = CONDITION_TO_SQL.isBefore('[col]', "2024-01-01'; DROP TABLE users;--");
      expect(sql).toContain("2024-01-01''; DROP TABLE users;--");
      expect(sql).not.toMatch(/< '2024-01-01'; DROP/);
    });

    it('should escape isBetween values', () => {
      const sql = CONDITION_TO_SQL.isBetween('[col]', "2024-01-01'", "2024-12-31'");
      expect(sql).toContain("2024-01-01''");
      expect(sql).toContain("2024-12-31''");
    });
  });

  describe('empty conditions', () => {
    it('should generate IS NULL OR empty check', () => {
      const sql = CONDITION_TO_SQL.isEmpty('[col]');
      expect(sql).toContain('IS NULL');
      expect(sql).toContain("= ''");
    });

    it('should generate IS NOT NULL AND not empty check', () => {
      const sql = CONDITION_TO_SQL.isNotEmpty('[col]');
      expect(sql).toContain('IS NOT NULL');
      expect(sql).toContain("<> ''");
    });
  });
});

describe('filterToSQL', () => {
  const columns = [
    { key: 'name', type: 'text', sqlColumn: 'user_name' },
    { key: 'age', type: 'number', sqlColumn: 'user_age' },
  ];

  it('should return empty for empty filter group', () => {
    expect(filterToSQL(null)).toBe('');
    expect(filterToSQL({ rules: [] })).toBe('');
  });

  it('should generate WHERE clause', () => {
    const filter = {
      logic: 'AND',
      rules: [
        { key: 'name', condition: 'contains', value: 'João' },
      ],
    };
    const sql = filterToSQL(filter, columns);
    expect(sql).toMatch(/^WHERE /);
    expect(sql).toContain('LIKE');
  });

  it('should skip WHERE when includeWhere is false', () => {
    const filter = {
      logic: 'AND',
      rules: [
        { key: 'name', condition: 'is', value: 'Test' },
      ],
    };
    const sql = filterToSQL(filter, columns, false);
    expect(sql).not.toMatch(/^WHERE /);
  });
});

describe('filtersToSQL', () => {
  it('should return empty for no filters', () => {
    expect(filtersToSQL([])).toBe('');
    expect(filtersToSQL(null)).toBe('');
  });

  it('should join multiple filters with logic', () => {
    const filters = [
      { key: 'name', condition: 'is', value: 'Test' },
      { key: 'name', condition: 'isNot', value: 'Other' },
    ];
    const sql = filtersToSQL(filters, [], 'OR');
    expect(sql).toContain('OR');
  });
});
