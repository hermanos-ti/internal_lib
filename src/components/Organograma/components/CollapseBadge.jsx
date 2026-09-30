import React from 'react';
import styles from '../Organograma.module.css';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

export function CollapseBadge({
  directCount = 0,
  totalCount = 0,
  collapsed = false,
  showCounters = true,
  counterMode = 'both',
  onToggle,
}) {
  if (directCount === 0) return null;

  let label = '';
  if (counterMode === 'direct') label = String(directCount);
  else if (counterMode === 'total') label = String(totalCount);
  else label = `${directCount} · ${totalCount}`;

  return (
    <button
      type="button"
      className={styles.collapseBadge}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      aria-expanded={!collapsed}
      aria-label={collapsed ? 'Expandir galho' : 'Recolher galho'}
    >
      <i
        className={cn('fas', collapsed ? 'fa-chevron-down' : 'fa-chevron-up')}
        aria-hidden
      />
      {showCounters && <span className={styles.collapseBadge__count}>{label}</span>}
    </button>
  );
}
