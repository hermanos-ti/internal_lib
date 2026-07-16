import React, { useEffect, useRef, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';
import { Button } from '../Button/Button';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

/** Cabeçalho do modal: título, subtítulo opcional e botão fechar (X). */
function ModalHeader({ title, subtitle, onClose, children, className }) {
  return (
    <div className={cn(styles.modal__header, className)}>
      <div className={styles.modal__headerContent}>
        {title && <h2 className={styles.modal__title}>{title}</h2>}
        {subtitle && <p className={styles.modal__subtitle}>{subtitle}</p>}
        {children}
      </div>
      {onClose && (
        <Button
          variant="tertiary"
          size="sm"
          iconOnly
          tooltip="Fechar"
          onClick={onClose}
          aria-label="Fechar"
        >
          <i className="far fa-xmark" />
        </Button>
      )}
    </div>
  );
}

/** Corpo scrollável com padding generoso para respiro visual. */
function ModalBody({ children, className }) {
  return <div className={cn(styles.modal__body, className)}>{children}</div>;
}

/**
 * Rodapé com ações: secundário (cancelar/voltar) à esquerda,
 * primário (confirmar) à direita — hierarquia visual clara.
 */
function ModalFooter({ secondary, primary, children, className }) {
  return (
    <div className={cn(styles.modal__footer, className)}>
      <div className={styles.modal__footerLeft}>
        {secondary && (
          <Button
            variant={secondary.variant || 'secondary'}
            size={secondary.size || 'md'}
            onClick={secondary.onClick}
            disabled={secondary.disabled}
            loading={secondary.loading}
            iconLeft={secondary.iconLeft}
            tooltip={secondary.tooltip}
          >
            {secondary.label}
          </Button>
        )}
      </div>
      <div className={styles.modal__footerRight}>
        {primary && (
          <Button
            variant={primary.variant || 'primary'}
            size={primary.size || 'md'}
            onClick={primary.onClick}
            disabled={primary.disabled}
            loading={primary.loading}
            tooltip={primary.tooltip}
            iconLeft={primary.iconLeft}
          >
            {primary.label}
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}

/**
 * Modal acessível com backdrop blur, focus trap, ESC e retorno de foco ao trigger.
 */
export function Modal({
  isOpen,
  onClose,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEsc = true,
  portalContainer,
  children,
  className,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
}) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const animateClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    window.setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      previousFocusRef.current?.focus?.();
    }, 180);
  }, [isClosing]);

  const requestClose = useCallback(() => {
    animateClose();
    onClose?.();
  }, [animateClose, onClose]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      setIsVisible(true);
      setIsClosing(false);
    } else if (isVisible && !isClosing) {
      animateClose();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isVisible || isClosing) return;
    const el = modalRef.current;
    if (!el) return;

    const getFocusable = () =>
      el.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

    const focusable = getFocusable();
    focusable[0]?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closeOnEsc) {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = getFocusable();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isClosing, closeOnEsc, requestClose]);

  if (!isVisible) return null;

  const container = portalContainer ?? document.body;

  return createPortal(
    <div
      className={cn(styles.modal__overlay, isClosing && styles.modal__overlay_closing)}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) requestClose();
      }}
      onKeyDown={() => {}}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        className={cn(
          styles.modal,
          styles[`modal_${size}`],
          isClosing && styles.modal_closing,
          className
        )}
      >
        {children}
      </div>
    </div>,
    container
  );
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export { ModalHeader, ModalBody, ModalFooter };
