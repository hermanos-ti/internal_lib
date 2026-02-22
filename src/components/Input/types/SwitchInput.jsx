import React, { forwardRef } from 'react';
import styles from '../Input.module.css';

export const SwitchInput = forwardRef(({ value = false, onChange, id, disabled, className, ...rest }, ref) => (
  <label
    className={`${styles.input__switch} ${value ? styles.input__switchActive : ''} ${disabled ? styles.input__switchDisabled : ''} ${className || ''}`}
    htmlFor={id}
  >
    <input
      ref={ref}
      type="checkbox"
      id={id}
      role="switch"
      checked={!!value}
      onChange={onChange}
      disabled={disabled}
      className={styles.input__switchInput}
      aria-checked={!!value}
      {...rest}
    />
    <span className={styles.input__switchTrack}>
      <span className={styles.input__switchThumb} />
    </span>
  </label>
));

SwitchInput.displayName = 'SwitchInput';
