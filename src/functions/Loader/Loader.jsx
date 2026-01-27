import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Loader.module.css';

let loaderInstance = null;
let listeners = new Set();

const LoaderComponent = ({ visible, text, size, color, overlay }) => {
  if (!visible) return null;

  return createPortal(
    <div className={`${styles.loader__overlay} ${overlay ? styles.loader__overlay__blocking : ''}`}>
      <div className={styles.loader__container}>
        <div className={`${styles.loader__spinner} ${styles[`loader__${size}`] || styles.loader__large}`}>
          <div className={`${styles.loader__spinner__ring} ${styles[`loader__${color}`] || styles.loader__primary}`}></div>
          <div className={`${styles.loader__spinner__ring} ${styles[`loader__${color}`] || styles.loader__primary}`}></div>
          <div className={`${styles.loader__spinner__ring} ${styles[`loader__${color}`] || styles.loader__primary}`}></div>
        </div>
        {text && (
          <div className={styles.loader__text}>{text}</div>
        )}
      </div>
    </div>,
    document.body
  );
};

class LoaderManager {
  constructor() {
    this.state = {
      visible: false,
      text: null,
      size: 'large',
      color: 'primary',
      overlay: true,
    };
  }

  show(options = {}) {
    this.state = {
      visible: true,
      text: options.text || null,
      size: options.size || 'large',
      color: options.color || 'primary',
      overlay: options.overlay !== false,
    };
    this.notifyListeners();
  }

  hide() {
    this.state = {
      ...this.state,
      visible: false,
    };
    this.notifyListeners();
  }

  isVisible() {
    return this.state.visible;
  }

  subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  notifyListeners() {
    listeners.forEach(listener => listener(this.state));
  }

  getState() {
    return { ...this.state };
  }
}

loaderInstance = new LoaderManager();

export const LoaderGlobal = () => {
  const [state, setState] = useState(loaderInstance.getState());

  useEffect(() => {
    const unsubscribe = loaderInstance.subscribe((newState) => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  return (
    <LoaderComponent
      visible={state.visible}
      text={state.text}
      size={state.size}
      color={state.color}
      overlay={state.overlay}
    />
  );
};

export const LoaderManagerInstance = {
  show: (options) => loaderInstance.show(options),
  hide: () => loaderInstance.hide(),
  isVisible: () => loaderInstance.isVisible(),
};

