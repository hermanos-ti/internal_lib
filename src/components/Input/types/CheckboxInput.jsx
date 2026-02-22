import React, { forwardRef } from 'react';
import styles from '../Input.module.css';

export const CheckboxInput = forwardRef(({ value = false, onChange, id, disabled, className, ...rest }, ref) => (
  <label
    className={`${styles.input__checkbox} ${value ? styles.input__checkboxChecked : ''} ${disabled ? styles.input__checkboxDisabled : ''} ${className || ''}`}
    htmlFor={id}
  >
    <input
      ref={ref}
      type="checkbox"
      id={id}
      checked={!!value}
      onChange={onChange}
      disabled={disabled}
      className={styles.input__checkboxInput}
      {...rest}
    />
    <span className={styles.input__checkboxCheckmark}>
      <i className={`far ${value ? 'fa-square-check' : 'fa-square'}`} />
    </span>
  </label>
));

CheckboxInput.displayName = 'CheckboxInput';
