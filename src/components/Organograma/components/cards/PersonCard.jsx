import React, { memo } from 'react';
import styles from '../../Organograma.module.css';
import { getNodeValue } from '../../core/normalizeData.js';
import { hashString } from '../../core/groupBounds.js';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

function getInitials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

function avatarStyle(name) {
  const hue = hashString(name ?? '') % 360;
  return {
    '--org-avatar-hue': hue,
    background: `linear-gradient(135deg, hsl(${hue} 65% 92%), hsl(${(hue + 24) % 360} 60% 88%))`,
    color: `hsl(${hue} 45% 38%)`,
  };
}

export const PersonCard = memo(function PersonCard({
  node,
  keys,
  density = 'full',
  orientation = 'vertical',
  selected = false,
  lazyPhotos = true,
}) {
  const name = getNodeValue(node, 'name', keys) ?? 'Sem nome';
  const role = getNodeValue(node, 'role', keys) ?? '';
  const department = getNodeValue(node, 'department', keys) ?? '';
  const photo = getNodeValue(node, 'photo', keys);
  const isVertical = orientation === 'vertical';

  if (density === 'minimal') {
    return (
      <div
        className={cn(styles.orgCard, styles.orgCard_minimal, selected && styles.orgCard_selected)}
        title={name}
        style={avatarStyle(name)}
      >
        <span className={styles.orgCard__initials}>{getInitials(name)}</span>
      </div>
    );
  }

  if (density === 'compact') {
    return (
      <div
        className={cn(
          styles.orgCard,
          styles.orgCard_compact,
          isVertical && styles.orgCard_vertical,
          selected && styles.orgCard_selected
        )}
      >
        <div className={styles.orgCard__body}>
          <div className={styles.orgCard__photoWrap} style={avatarStyle(name)}>
            {photo && !isVertical ? (
              <img
                className={styles.orgCard__photo}
                src={photo}
                alt=""
                loading={lazyPhotos ? 'lazy' : undefined}
                decoding="async"
              />
            ) : (
              <span className={styles.orgCard__photoFallback}>{getInitials(name)}</span>
            )}
          </div>
          <div className={styles.orgCard__info}>
            <span className={styles.orgCard__name}>{name}</span>
            {role && <span className={styles.orgCard__role}>{role}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        styles.orgCard,
        isVertical && styles.orgCard_vertical,
        selected && styles.orgCard_selected
      )}
    >
      {!isVertical && <div className={styles.orgCard__accent} aria-hidden />}
      <div className={styles.orgCard__body}>
        <div className={styles.orgCard__photoWrap} style={avatarStyle(name)}>
          {photo ? (
            <img
              className={styles.orgCard__photo}
              src={photo}
              alt=""
              loading={lazyPhotos ? 'lazy' : undefined}
              decoding="async"
            />
          ) : (
            <span className={styles.orgCard__photoFallback}>{getInitials(name)}</span>
          )}
        </div>
        <div className={styles.orgCard__info}>
          <span className={styles.orgCard__name}>{name}</span>
          {role && <span className={styles.orgCard__role}>{role}</span>}
          {department && (
            <span className={styles.orgCard__departmentChip}>{department}</span>
          )}
        </div>
      </div>
    </div>
  );
});
