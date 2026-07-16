import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Dialog.module.css';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

const DIALOG_TYPE_CONFIG = {
  default: { icon: 'far fa-comment-dots' },
  info: { icon: 'far fa-info-circle' },
  primary: { icon: 'far fa-circle-info' },
  success: { icon: 'far fa-check-circle' },
  warning: { icon: 'far fa-exclamation-triangle' },
  error: { icon: 'far fa-times-circle' },
  danger: { icon: 'far fa-trash-can' },
};

const DEFAULT_OPTIONS = {
  type: 'default',
  position: 'center',
  background: true,
  closeOnBackdrop: false,
  closeOnEsc: true,
  critical: false,
  criticalDelay: 5,
  buttonsText: {
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    close: 'OK',
  },
};

function normalizeOptions(rawOptions = {}, mode = 'confirm') {
  let options = { ...rawOptions };

  if (options.type === 'critical') {
    options = {
      ...options,
      type: 'warning',
      critical: true,
    };
  }

  const type = options.type && DIALOG_TYPE_CONFIG[options.type] ? options.type : 'default';
  let effectiveType = type;

  if (effectiveType === 'danger' && mode === 'confirm' && !options.confirmText) {
    console.warn(
      '[Dialog] type "danger" em modo confirmação requer options.confirmText. Usando type "error".'
    );
    effectiveType = 'error';
  }

  const merged = {
    ...DEFAULT_OPTIONS,
    ...options,
    type: effectiveType,
    buttonsText: {
      ...DEFAULT_OPTIONS.buttonsText,
      ...options.buttonsText,
    },
  };

  return merged;
}

let dialogEntryId = 0;

class DialogManager {
  constructor() {
    this.queue = [];
    this.current = null;
    this.listeners = new Set();
  }

  enqueue(entry) {
    return new Promise((resolve) => {
      this.queue.push({ ...entry, id: ++dialogEntryId, resolve });
      this.processQueue();
    });
  }

  processQueue() {
    if (this.current || this.queue.length === 0) return;
    this.current = this.queue.shift();
    this.notifyListeners();
  }

  resolveCurrent(result) {
    if (!this.current) return;

    const { resolve, callback, onResult } = this.current;
    resolve(result);
    callback?.(result);
    onResult?.(result);

    this.current = null;
    this.notifyListeners();
    this.processQueue();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  getState() {
    return { current: this.current ? { ...this.current, resolve: undefined, callback: undefined } : null };
  }
}

const dialogManager = new DialogManager();

function DialogView({ entry, onClose }) {
  const dialogRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [dangerInput, setDangerInput] = useState('');
  const [countdown, setCountdown] = useState(
    entry.critical && entry.mode === 'confirm' ? entry.criticalDelay : 0
  );

  const {
    mode,
    type,
    icon,
    title,
    message,
    html,
    buttonsText,
    confirmText,
    confirmHint,
    critical,
    criticalDelay,
    position,
    background,
    closeOnBackdrop,
    closeOnEsc,
  } = entry;

  const typeConfig = DIALOG_TYPE_CONFIG[type] || DIALOG_TYPE_CONFIG.default;
  const iconClass = icon || typeConfig.icon;
  const isDangerConfirm = type === 'danger' && mode === 'confirm' && confirmText;
  const dangerMatch = isDangerConfirm && dangerInput === confirmText;
  const countdownActive = critical && mode === 'confirm' && countdown > 0;
  const confirmDisabled =
    mode === 'confirm' && ((isDangerConfirm && !dangerMatch) || countdownActive);

  const confirmLabel =
    countdownActive
      ? `${buttonsText.confirm} (${countdown}s)`
      : buttonsText.confirm;

  const handleClose = useCallback(
    (result) => {
      if (isClosing) return;
      setIsClosing(true);
      window.setTimeout(() => onClose(result), 180);
    },
    [isClosing, onClose]
  );

  useEffect(() => {
    if (!critical || mode !== 'confirm' || criticalDelay <= 0) return undefined;

    setCountdown(criticalDelay);
    const timer = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [critical, criticalDelay, mode]);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return undefined;

    const getFocusable = () =>
      el.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

    const focusable = getFocusable();
    focusable[0]?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && closeOnEsc) {
        e.preventDefault();
        handleClose(mode === 'confirm' ? false : null);
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
  }, [closeOnEsc, handleClose, mode]);

  const hint =
    confirmHint ||
    (isDangerConfirm ? `Digite "${confirmText}" para confirmar` : undefined);

  return createPortal(
    <div
      className={cn(
        styles.dialog__overlay,
        styles[`dialog__overlay_${position}`],
        !background && styles.dialog__overlay_noBackground,
        isClosing && styles.dialog__overlay_closing
      )}
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) {
          handleClose(mode === 'confirm' ? false : null);
        }
      }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-body"
        className={cn(
          styles.dialog,
          styles[`dialog_type_${type}`],
          isClosing && styles.dialog_closing
        )}
      >
        <div className={styles.dialog__header}>
          <div className={styles.dialog__iconWrap} aria-hidden="true">
            <i className={iconClass} />
          </div>
          {title && (
            <h2 id="dialog-title" className={styles.dialog__title}>
              {title}
            </h2>
          )}
        </div>

        <div id="dialog-body" className={styles.dialog__body}>
          {html ? (
            <div
              className={styles.dialog__htmlBody}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : message ? (
            <p className={styles.dialog__message}>{message}</p>
          ) : null}

          {isDangerConfirm && (
            <div className={styles.dialog__confirmInput}>
              <Input
                label={hint}
                value={dangerInput}
                onChange={(e) => setDangerInput(e.target.value)}
                placeholder={confirmText}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          )}
        </div>

        <div className={styles.dialog__footer}>
          {mode === 'confirm' ? (
            <>
              <Button
                variant="tertiary"
                className={styles.dialog__btnSecondary}
                onClick={() => handleClose(false)}
              >
                {buttonsText.cancel}
              </Button>
              <Button
                variant="tertiary"
                className={styles.dialog__btnPrimary}
                disabled={confirmDisabled}
                onClick={() => handleClose(true)}
              >
                {confirmLabel}
              </Button>
            </>
          ) : (
            <Button
              variant="tertiary"
              className={styles.dialog__btnPrimary}
              onClick={() => handleClose(null)}
            >
              {buttonsText.close}
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function DialogGlobalInner() {
  const [state, setState] = useState(dialogManager.getState());

  useEffect(() => dialogManager.subscribe(setState), []);

  if (!state.current) return null;

  return (
    <DialogView
      key={state.current.id}
      entry={state.current}
      onClose={(result) => dialogManager.resolveCurrent(result)}
    />
  );
}

function openDialog(options, mode) {
  const normalized = normalizeOptions(options, mode);
  return dialogManager.enqueue({
    ...normalized,
    mode,
    callback: options.callback,
    onResult: options.onResult,
  });
}

export const DialogGlobal = DialogGlobalInner;

export const DialogManagerInstance = {
  getState: () => dialogManager.getState(),
  resolveCurrent: (result) => dialogManager.resolveCurrent(result),
};

export const Dialog = {
  alert(options = {}) {
    return openDialog(options, 'alert').then(() => undefined);
  },

  confirm(options = {}) {
    return openDialog(options, 'confirm').then((result) => result === true);
  },

  show(message, type, options = {}, callback) {
    let opts = options;
    let cb = callback;

    if (typeof options === 'function') {
      cb = options;
      opts = {};
    }

    const confirmButton = opts.confirmButton !== false;
    const merged = {
      ...opts,
      message: opts.message ?? message,
      type: opts.type ?? type ?? 'default',
      callback: cb,
    };

    if (confirmButton) {
      return Dialog.confirm(merged);
    }
    return Dialog.alert(merged).then(() => null);
  },
};
