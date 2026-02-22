import React, { forwardRef } from 'react';
import styles from '../Input.module.css';

export const RadioGroupInput = forwardRef(
  ({ value, onChange, id, disabled, className, options = [], name: nameProp, radioDirection = 'horizontal', ...rest }, ref) => {
    const name = nameProp || id || `radio-${Math.random().toString(36).slice(2)}`;
    const normalizedOptions = options.map((opt) =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    );
    const isVertical = radioDirection === 'vertical';

    return (
      <div ref={ref} className={`${styles.input__radioGroup} ${isVertical ? styles.input__radioGroupVertical : ''} ${className || ''}`} role="radiogroup" {...rest}>
        {normalizedOptions.map((opt, index) => {
          const optId = id ? `${id}-${index}` : `${name}-${index}`;
          const isChecked = value === opt.value;
          return (
            <label
              key={opt.value}
              className={`${styles.input__radio} ${isChecked ? styles.input__radioChecked : ''} ${disabled ? styles.input__radioDisabled : ''}`}
              htmlFor={optId}
            >
              <input
                type="radio"
                id={optId}
                name={name}
                value={opt.value}
                checked={isChecked}
                onChange={onChange}
                disabled={disabled}
                className={styles.input__radioInput}
              />
              <span className={styles.input__radioCircle} />
              <span className={styles.input__radioLabel}>{opt.label}</span>
            </label>
          );
        })}
      </div>
    );
  }
);

RadioGroupInput.displayName = 'RadioGroupInput';
