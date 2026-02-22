import React, { forwardRef } from 'react';
import styles from '../Input.module.css';

export const SliderInput = forwardRef(
  ({ value = 0, onChange, id, disabled, className, min = 0, max = 100, step = 1, ...rest }, ref) => {
    const numValue = Number(value) || 0;
    const progress = ((numValue - min) / (max - min)) * 100;

    return (
      <div className={`${styles.input__sliderWrapper} ${className || ''}`}>
        <input
          ref={ref}
          type="range"
          id={id}
          value={numValue}
          onChange={onChange}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={styles.input__slider}
          style={{ '--slider-progress': `${progress}%` }}
          {...rest}
        />
        <span className={styles.input__sliderValue}>{numValue}</span>
      </div>
    );
  }
);

SliderInput.displayName = 'SliderInput';
