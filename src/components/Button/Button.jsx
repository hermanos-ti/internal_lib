import React, { forwardRef } from 'react';
import styles from './Button.module.css';
import { Tooltip } from '../Tooltip/Tooltip';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

/**
 * Botão reutilizável com hierarquia visual (primário/secundário/terciário/danger),
 * estados claros (hover, focus, active, disabled, loading) e suporte a ícones + tooltip.
 */
export const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    iconLeft,
    iconRight,
    iconOnly = false,
    loading = false,
    disabled = false,
    tooltip,
    fullWidth = false,
    type = 'button',
    className,
    children,
    'aria-label': ariaLabelProp,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || loading;
  const isSimpleLabel = typeof children === 'string' || typeof children === 'number';
  const ariaLabel =
    ariaLabelProp ||
    (iconOnly ? tooltip || (typeof children === 'string' ? children : undefined) : undefined);

  const buttonEl = (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      className={cn(
        styles.button,
        styles[`button_${variant}`],
        styles[`button_${size}`],
        iconOnly && styles.button_iconOnly,
        loading && styles.button_loading,
        fullWidth && styles.button_fullWidth,
        className
      )}
      {...rest}
    >
      {loading && (
        <span className={styles.button__spinner} aria-hidden="true">
          <span className={styles.button__spinnerRing} />
        </span>
      )}
      {!loading && iconLeft && (
        <span className={cn(styles.button__icon, styles.button__iconLeft)}>{iconLeft}</span>
      )}
      {iconOnly && !iconLeft && !iconRight && children && (
        <span className={styles.button__icon}>{children}</span>
      )}
      {!iconOnly && children && (
        isSimpleLabel ? (
          <span className={styles.button__label}>{children}</span>
        ) : (
          children
        )
      )}
      {!loading && iconRight && (
        <span className={cn(styles.button__icon, styles.button__iconRight)}>{iconRight}</span>
      )}
    </button>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} placement="top">
        {buttonEl}
      </Tooltip>
    );
  }

  return buttonEl;
});
