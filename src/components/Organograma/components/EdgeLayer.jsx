import React, { memo } from 'react';
import styles from '../Organograma.module.css';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

function EdgeSegment({ segment, edgeConfig }) {
  const { type, x, y, width, height, side, dashed } = segment;

  if (type === 'line-v') {
    return (
      <div
        className={cn(styles.edgeSegment, styles.edgeSegment_lineV, dashed && styles.edgeSegment_dashed)}
        style={{
          left: x,
          top: y,
          height,
          ...(edgeConfig.color ? { '--org-edge-color': edgeConfig.color } : {}),
        }}
        aria-hidden="true"
      />
    );
  }

  if (type === 'line-h') {
    return (
      <div
        className={cn(styles.edgeSegment, styles.edgeSegment_lineH, dashed && styles.edgeSegment_dashed)}
        style={{
          left: x,
          top: y,
          width,
          ...(edgeConfig.color ? { '--org-edge-color': edgeConfig.color } : {}),
        }}
        aria-hidden="true"
      />
    );
  }

  if (type === 'elbow') {
    return (
      <div
        className={cn(
          styles.edgeSegment,
          styles.edgeSegment_elbow,
          styles[`edgeSegment_elbow_${side}`],
          dashed && styles.edgeSegment_dashed
        )}
        style={{
          left: x,
          top: y,
          width,
          height,
          ...(edgeConfig.color ? { '--org-edge-color': edgeConfig.color } : {}),
        }}
        aria-hidden="true"
      />
    );
  }

  return null;
}

export const EdgeLayer = memo(function EdgeLayer({ edges = [], edgeConfig = {} }) {
  if (!edges.length) return null;

  return (
    <div className={styles.edgeLayer} aria-hidden="true">
      {edges.map((segment) => (
        <EdgeSegment key={segment.id} segment={segment} edgeConfig={edgeConfig} />
      ))}
    </div>
  );
});
