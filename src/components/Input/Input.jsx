import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import styles from './Input.module.css';
import { getInputByType, isDateType } from './types';
import { Tooltip } from '../Tooltip/Tooltip';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

export const Input = forwardRef(function Input(
  {
    label,
    id,
    type = 'text',
    icon,
    iconPosition = 'left',
    buttonsLeft = [],
    buttonsRight = [],
    hint,
    error,
    disabled = false,
    value,
    onChange,
    options,
    rows,
    placeholder,
    min,
    max,
    step,
    accept,
    multiple,
    range,
    name,
    status: statusProp,
    resize,
    autoExpand,
    radioDirection,
    tooltip,
    size = 'lg',
    className: classNameProp,
    ...rest
  },
  ref
) {
  const [statusState, setStatusState] = useState(null);
  const status = statusProp ?? statusState;
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    setStatus: (s) => setStatusState(s),
    focus: () => inputRef.current?.focus(),
    select: () => inputRef.current?.select(),
    get element() {
      return inputRef.current;
    },
  }));

  const InputComponent = getInputByType(type);
  const controlId = id || `input-${Math.random().toString(36).slice(2)}`;

  const isControlType = ['text', 'number', 'date', 'password', 'textarea'].includes(
    String(type).toLowerCase()
  ) && !isDateType(type);
  const isSelectType = String(type).toLowerCase() === 'select';
  const isDateInputType = isDateType(type);
  const isPasswordType = String(type).toLowerCase() === 'password';

  let controlClassName = '';
  if (isControlType) {
    controlClassName =
      type === 'textarea'
        ? `${styles.input__control} ${styles.input__controlTextarea}`
        : styles.input__control;
    if (type === 'textarea' && resize === false) controlClassName += ` ${styles.input__controlTextareaNoResize}`;
    if (type === 'textarea' && autoExpand) controlClassName += ` ${styles.input__controlTextareaAutoExpand}`;
  } else if (isSelectType || isDateInputType) {
    controlClassName = styles.input__select;
  }

  const showIconLeft = icon && iconPosition === 'left';
  const showIconRight = icon && iconPosition === 'right' && !isPasswordType;

  const hasButtonsLeft = Array.isArray(buttonsLeft) && buttonsLeft.length > 0;
  const hasButtonsRight = Array.isArray(buttonsRight) && buttonsRight.length > 0;

  if (showIconLeft) {
    controlClassName += ` ${styles.input__controlWithIconLeft}`;
  }
  if (showIconRight) {
    controlClassName += ` ${styles.input__controlWithIconRight}`;
  }
  if (isPasswordType) {
    controlClassName += ` ${styles.input__controlWithPasswordToggle}`;
  }
  if (hasButtonsLeft) {
    controlClassName += ` ${styles.input__controlConnectedLeft}`;
  }
  if (hasButtonsRight) {
    controlClassName += ` ${styles.input__controlConnectedRight}`;
  }

  const inputProps = {
    value,
    onChange,
    ref: inputRef,
    id: controlId,
    disabled,
    placeholder,
    className: cn(controlClassName, classNameProp),
    ...rest,
  };

  if (isSelectType) {
    inputProps.options = options;
    inputProps.multiple = multiple;
  }
  if (type === 'textarea') {
    inputProps.rows = rows;
    inputProps.resize = resize;
    inputProps.autoExpand = autoExpand;
  }
  if (['number', 'slider'].includes(String(type).toLowerCase())) {
    inputProps.min = min;
    inputProps.max = max;
    inputProps.step = step;
  }
  if (type === 'file') {
    inputProps.accept = accept;
    inputProps.multiple = multiple;
  }
  if (type === 'radio' || type === 'radio group') {
    inputProps.options = options;
    inputProps.name = name;
    inputProps.radioDirection = radioDirection;
  }
  if (isDateInputType) {
    inputProps.value = value;
    inputProps.min = min;
    inputProps.max = max;
    inputProps.format = type === 'date' ? 'data' : String(type).toLowerCase();
    inputProps.range = range ?? false;
  }

  const hasControlWrapper = isControlType || isSelectType || isDateInputType;

  const renderButton = (btn, index, side, total) => {
    const { label: btnLabel, icon: btnIcon, action, iconOnly, disabled: btnDisabled } = btn;
    const isFirst = index === 0;
    const isLast = index === total - 1;
    const buttonClass = cn(
      styles.input__button,
      iconOnly && styles.input__buttonIconOnly,
      side === 'left' && isFirst && styles.input__buttonFirstLeft,
      side === 'left' && isLast && total > 1 && styles.input__buttonLastLeft,
      side === 'left' && !isFirst && !isLast && styles.input__buttonMiddleLeft,
      side === 'right' && isFirst && total > 1 && styles.input__buttonFirstRight,
      side === 'right' && isLast && styles.input__buttonLastRight,
      side === 'right' && !isFirst && !isLast && styles.input__buttonMiddleRight
    );
    const buttonEl = (
      <button
        key={index}
        type="button"
        className={buttonClass}
        onClick={action}
        disabled={disabled || btnDisabled}
        aria-label={btnLabel}
      >
        {btnIcon && <span className={styles.input__buttonIcon}>{btnIcon}</span>}
        {btnLabel && !iconOnly && <span className={styles.input__buttonLabel}>{btnLabel}</span>}
      </button>
    );
    return btnLabel ? (
      <Tooltip key={index} content={btnLabel} placement="top">
        {buttonEl}
      </Tooltip>
    ) : (
      <React.Fragment key={index}>{buttonEl}</React.Fragment>
    );
  };

  return (
    <div
      className={cn(
        styles.input,
        styles[`input_size_${size}`],
        error && styles.inputError,
        disabled && styles.inputDisabled,
        status === 'success' && styles.inputStatusSuccess,
        status === 'warning' && styles.inputStatusWarning,
        status === 'error' && styles.inputStatusError
      )}
    >
      {label && (
        <div className={styles.input__labelRow}>
          <label htmlFor={controlId} className={styles.input__label}>
            {label}
          </label>
          {tooltip && (
            <Tooltip content={tooltip} placement="top">
              <button
                type="button"
                className={styles.input__tooltipTrigger}
                aria-label={`Informação sobre ${label}`}
                tabIndex={-1}
              >
                <i className="far fa-circle-question" />
              </button>
            </Tooltip>
          )}
        </div>
      )}
      <div
        className={cn(
          styles.input__field,
          (hasButtonsLeft || hasButtonsRight) && styles.input__fieldConnected
        )}
      >
        {hasButtonsLeft && (
          <div className={styles.input__buttonsLeft} role="group">
            {buttonsLeft.map((btn, i) => renderButton(btn, i, 'left', buttonsLeft.length))}
          </div>
        )}
        {hasControlWrapper ? (
          <div className={styles.input__controlWrapper}>
            {showIconLeft && (
              <span className={cn(styles.input__icon, styles.input__iconLeft)}>{icon}</span>
            )}
            <InputComponent {...inputProps} />
            {showIconRight && (
              <span className={cn(styles.input__icon, styles.input__iconRight)}>{icon}</span>
            )}
          </div>
        ) : (
          <InputComponent {...inputProps} />
        )}
        {hasButtonsRight && (
          <div className={styles.input__buttonsRight} role="group">
            {buttonsRight.map((btn, i) => renderButton(btn, i, 'right', buttonsRight.length))}
          </div>
        )}
      </div>
      {hint && !error && <span className={styles.input__hint}>{hint}</span>}
      {error && (
        <span className={styles.input__error} role="alert">
          <i className={`far fa-circle-exclamation ${styles.input__errorIcon}`} aria-hidden="true" />
          {error}
        </span>
      )}
    </div>
  );
});
