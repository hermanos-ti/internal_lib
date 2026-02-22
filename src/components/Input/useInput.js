import { useState, useRef, useCallback, useMemo } from 'react';

/**
 * Hook para gerenciar estado de inputs com suporte a máscaras.
 * @param {*} initialValue - Valor inicial
 * @param {Function|Function[]} mask - Função ou array de funções de máscara (value) => formattedValue. Aplicadas em sequência. Ignorada para tipos não-texto.
 * @returns {[Object, Function]} [{ value, onChange, ref }, setValue]
 */
export function useInput(initialValue = '', mask = null) {
  const [value, setValue] = useState(initialValue);
  const ref = useRef(null);

  const masks = useMemo(
    () => (Array.isArray(mask) ? mask : mask ? [mask] : []),
    [mask]
  );

  const applyMasks = useCallback(
    (rawValue) => {
      if (masks.length === 0) return rawValue;
      if (typeof rawValue !== 'string' && typeof rawValue !== 'number') return rawValue;
      const str = String(rawValue);
      return masks.reduce((acc, fn) => (typeof fn === 'function' ? fn(acc) : acc), str);
    },
    [masks]
  );

  const handleChange = useCallback(
    (eventOrValue) => {
      let newValue;

      if (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
        const { target } = eventOrValue;
        if (target.type === 'checkbox' || target.type === 'radio') {
          newValue = target.type === 'checkbox' ? target.checked : target.value;
        } else if (target.type === 'file') {
          newValue = target.files?.length ? (target.multiple ? target.files : target.files[0]) : null;
        } else {
          newValue = applyMasks(target.value);
        }
      } else {
        newValue = typeof eventOrValue === 'string' || typeof eventOrValue === 'number'
          ? applyMasks(eventOrValue)
          : eventOrValue;
      }

      setValue(newValue);
    },
    [applyMasks]
  );

  return [
    {
      value,
      onChange: handleChange,
      ref,
    },
    setValue,
  ];
}
