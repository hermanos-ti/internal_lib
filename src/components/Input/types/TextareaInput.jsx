import React, { forwardRef, useEffect, useRef, useCallback } from 'react';

function useAutoExpand(textareaRef, value, autoExpand) {
  useEffect(() => {
    if (!autoExpand || !textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value, autoExpand]);
}

export const TextareaInput = forwardRef(({ value = '', onChange, id, disabled, className, rows = 3, autoExpand = false, ...rest }, ref) => {
  const internalRef = useRef(null);
  const setRef = useCallback(
    (el) => {
      internalRef.current = el;
      if (ref) {
        if (typeof ref === 'function') ref(el);
        else ref.current = el;
      }
    },
    [ref]
  );

  useAutoExpand(internalRef, value, autoExpand);

  const handleChange = (e) => {
    onChange?.(e);
    if (autoExpand && internalRef.current) {
      const el = internalRef.current;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  return (
    <textarea
      ref={setRef}
      id={id}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      rows={rows}
      className={className}
      {...rest}
    />
  );
});

TextareaInput.displayName = 'TextareaInput';
