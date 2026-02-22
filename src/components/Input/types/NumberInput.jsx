import React, { forwardRef } from 'react';
import styles from '../Input.module.css';

export const NumberInput = forwardRef(({ value = '', onChange, id, disabled, className, min, max, step = 1, ...rest }, ref) => {
  const numValue = value === '' || value == null ? '' : Number(value);
  const stepNum = Number(step) || 1;
  const minNum = min != null ? Number(min) : -Infinity;
  const maxNum = max != null ? Number(max) : Infinity;

  const clamp = (v) => {
    if (v === '' || isNaN(v)) return minNum !== -Infinity ? minNum : 0;
    let n = Number(v);
    if (minNum !== -Infinity && n < minNum) n = minNum;
    if (maxNum !== Infinity && n > maxNum) n = maxNum;
    return n;
  };

  const handleStep = (delta) => {
    const current = numValue === '' ? (minNum !== -Infinity ? minNum : 0) : numValue;
    const next = clamp(current + delta * stepNum);
    onChange?.({ target: { value: String(next), id } });
  };

  return (
    <div className={`${styles.input__numberWrapper} ${className || ''}`.trim()}>
      <input
        ref={ref}
        type="number"
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={styles.input__numberInput}
        {...rest}
      />
      <div className={styles.input__numberButtons}>
        <button
          type="button"
          className={styles.input__numberBtn}
          onClick={() => handleStep(1)}
          disabled={disabled || (numValue !== '' && numValue >= maxNum)}
          aria-label="Aumentar"
        >
          <i className="fas fa-chevron-up" />
        </button>
        <button
          type="button"
          className={styles.input__numberBtn}
          onClick={() => handleStep(-1)}
          disabled={disabled || (numValue !== '' && numValue <= minNum)}
          aria-label="Diminuir"
        >
          <i className="fas fa-chevron-down" />
        </button>
      </div>
    </div>
  );
});

NumberInput.displayName = 'NumberInput';
