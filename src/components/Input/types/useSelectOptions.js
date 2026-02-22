import { useMemo } from 'react';

/**
 * Normalizes options to { value, label } format.
 */
export function normalizeOptions(options = []) {
  return options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );
}

/**
 * Filters options by search term (case-insensitive includes).
 */
export function filterOptions(options, searchTerm) {
  if (!searchTerm?.trim()) return options;
  const term = searchTerm.toLowerCase().trim();
  return options.filter((opt) =>
    String(opt?.label ?? opt?.value ?? '').toLowerCase().includes(term)
  );
}

/**
 * Hook for normalized options, filtered options, and select-all state.
 */
export function useSelectOptions(options = [], searchTerm, multiple, value) {
  const normalizedOptions = useMemo(
    () => normalizeOptions(options),
    [options]
  );

  const filteredOptions = useMemo(
    () => filterOptions(normalizedOptions, searchTerm),
    [normalizedOptions, searchTerm]
  );

  const selectedValues = useMemo(() => {
    if (multiple) {
      const arr = Array.isArray(value) ? value : value != null && value !== '' ? [value] : [];
      return new Set(arr);
    }
    return new Set(value != null && value !== '' ? [value] : []);
  }, [multiple, value]);

  const allSelected = useMemo(() => {
    if (!multiple || normalizedOptions.length === 0) return false;
    return normalizedOptions.every((opt) => selectedValues.has(opt.value));
  }, [multiple, normalizedOptions, selectedValues]);

  const someSelected = useMemo(() => {
    if (!multiple) return selectedValues.size > 0;
    return selectedValues.size > 0;
  }, [multiple, selectedValues]);

  return {
    normalizedOptions,
    filteredOptions,
    selectedValues,
    allSelected,
    someSelected,
  };
}
