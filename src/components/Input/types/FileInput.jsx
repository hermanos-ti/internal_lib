import React, { forwardRef, useRef } from 'react';
import styles from '../Input.module.css';

export const FileInput = forwardRef(
  ({ value, onChange, id, disabled, className, accept, multiple, ...rest }, ref) => {
    const inputRef = useRef(null);
    const mergedRef = (node) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    };

    const handleClick = () => {
      if (!disabled) inputRef.current?.click();
    };

    const handleKeyDown = (e) => {
      if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
        e.preventDefault();
        inputRef.current?.click();
      }
    };

    const displayValue = value
      ? Array.isArray(value) || value instanceof FileList
        ? [...(value instanceof FileList ? value : value)].map((f) => f?.name).filter(Boolean).join(', ')
        : value?.name || 'Arquivo selecionado'
      : '';

    return (
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={`${styles.input__file} ${disabled ? styles.input__fileDisabled : ''} ${className || ''}`}
        aria-label="Selecionar arquivo"
      >
        <input
          ref={mergedRef}
          type="file"
          id={id}
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          disabled={disabled}
          className={styles.input__fileInput}
          {...rest}
        />
        <span className={styles.input__fileText}>
          {displayValue || 'Arraste ou clique para selecionar'}
        </span>
      </div>
    );
  }
);

FileInput.displayName = 'FileInput';
