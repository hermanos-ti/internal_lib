import { Select } from './Select';
import { FilterDateInput } from './FilterDateInput';
import { toSelectFilterValue } from '../filterValueUtils';

export function FilterValueField({
  type = 'text',
  value,
  onChange,
  id,
  className = '',
  placeholder,
  title,
  selectOptions = [],
}) {
  if (type === 'date') {
    return (
      <FilterDateInput
        id={id}
        value={typeof value === 'string' ? value : ''}
        onChange={onChange}
        className={className}
        placeholder={placeholder || 'dd/mm/aaaa'}
        title={title}
      />
    );
  }

  if (type === 'select') {
    return (
      <Select
        multiple
        value={toSelectFilterValue(value)}
        onChange={onChange}
        options={selectOptions}
        placeholder={placeholder || 'Selecione...'}
        className={className}
      />
    );
  }

  return (
    <input
      id={id}
      className={className}
      type={type === 'number' ? 'number' : 'text'}
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder || 'Digite um valor...'}
      title={title}
    />
  );
}
