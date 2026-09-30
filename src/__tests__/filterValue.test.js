import { describe, expect, it } from 'vitest';
import { filtersToSQL, getFilterDisplayText } from '../components/Tabela/constants';
import {
  isoToDisplay,
  maskDateInput,
  resolveSelectOptions,
  toIsoDate,
  toSelectFilterValue,
  valueFromCell,
} from '../components/Tabela/filterValueUtils';

describe('filter value helpers', () => {
  it('formats and parses dates as ISO while showing dd/mm/yyyy', () => {
    expect(maskDateInput('15031990')).toBe('15/03/1990');
    expect(toIsoDate('15/03/1990')).toBe('1990-03-15');
    expect(toIsoDate('1990-03-15')).toBe('1990-03-15');
    expect(isoToDisplay('1990-03-15')).toBe('15/03/1990');
    expect(toIsoDate('31/02/2020')).toBe('');
  });

  it('builds select options from column.options or distinct row values', () => {
    expect(resolveSelectOptions({
      key: 'status',
      options: ['Ativo', { value: 'inativo', label: 'Inativo' }],
    }, [])).toEqual([
      { value: 'Ativo', label: 'Ativo' },
      { value: 'inativo', label: 'Inativo' },
    ]);

    expect(resolveSelectOptions({ key: 'status' }, [
      { status: 'Inativo' },
      { status: 'Ativo' },
      { status: 'Ativo' },
      { status: '' },
    ])).toEqual([
      { value: 'Ativo', label: 'Ativo' },
      { value: 'Inativo', label: 'Inativo' },
    ]);
  });

  it('keeps a legacy select string as a single option', () => {
    expect(toSelectFilterValue('Ativo')).toEqual(['Ativo']);
    expect(toSelectFilterValue(['Ativo', 'Inativo'])).toEqual(['Ativo', 'Inativo']);
    expect(toSelectFilterValue('')).toEqual([]);
  });

  it('shapes a cell value for a new filter', () => {
    expect(valueFromCell('select', 'Ativo')).toEqual({ empty: false, value: ['Ativo'] });
    expect(valueFromCell('date', '1990-03-15')).toEqual({ empty: false, value: '1990-03-15' });
    expect(valueFromCell('number', 42)).toEqual({ empty: false, value: '42' });
    expect(valueFromCell('text', '')).toEqual({ empty: true, value: '' });
  });

  it('renders select chips and SQL IN clauses', () => {
    const filter = {
      key: 'status',
      label: 'Status',
      type: 'select',
      condition: 'is',
      value: ['Ativo', 'Inativo'],
    };
    const columns = [{ key: 'status', type: 'select', title: 'Status' }];
    expect(getFilterDisplayText(filter, columns)).toBe('Status é Ativo, Inativo');
    expect(filtersToSQL([filter], columns, 'AND', false)).toBe("[status] IN ('Ativo', 'Inativo')");
  });
});
