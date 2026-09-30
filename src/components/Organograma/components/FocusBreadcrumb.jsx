import React from 'react';
import styles from '../Organograma.module.css';
import { getNodeValue } from '../core/normalizeData.js';

export function FocusBreadcrumb({ focusedId, nodes, parentMap, keys, onNavigate, onClear }) {
  if (!focusedId) return null;

  const trail = [];
  let current = focusedId;

  while (current != null) {
    const node = nodes.get(current);
    if (!node) break;
    trail.unshift({ id: current, label: getNodeValue(node, 'name', keys) ?? String(current) });
    current = parentMap.get(current) ?? null;
  }

  return (
    <nav className={styles.focusBreadcrumb} aria-label="Navegação do organograma">
      <button type="button" className={styles.focusBreadcrumb__root} onClick={onClear}>
        <i className="fas fa-sitemap" aria-hidden />
        <span>Raiz</span>
      </button>
      {trail.map((item, index) => (
        <React.Fragment key={item.id}>
          <span className={styles.focusBreadcrumb__sep} aria-hidden>
            /
          </span>
          <button
            type="button"
            className={styles.focusBreadcrumb__item}
            onClick={() => onNavigate(item.id)}
            aria-current={index === trail.length - 1 ? 'page' : undefined}
          >
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}
