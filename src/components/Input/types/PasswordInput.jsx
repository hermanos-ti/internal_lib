import React, { forwardRef, useState } from 'react';
import styles from '../Input.module.css';

export const PasswordInput = forwardRef(
  ({ value = '', onChange, id, disabled, className, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className={styles.input__passwordWrapper}>
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={className}
          {...rest}
        />
        <button
          type="button"
          tabIndex={-1}
          className={styles.input__passwordToggle}
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          title={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? (
            <i className="fas fa-eye-slash" aria-hidden />
          ) : (
            <i className="fas fa-eye" aria-hidden />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
