import React, { memo } from 'react';
import styles from '../Organograma.module.css';

const LABEL_OFFSET_X = 12;
const LABEL_OFFSET_Y = 8;

function groupColors(group) {
  const fill =
    typeof group.color === 'object' ? group.color.fill : group.color ?? 'rgba(79, 70, 229, 0.08)';
  const border =
    typeof group.color === 'object' ? group.color.border : 'rgba(79, 70, 229, 0.25)';
  return { fill, border };
}

export const GroupLayer = memo(function GroupLayer({ groups, customRender }) {
  if (!groups?.length) return null;

  if (customRender) {
    return (
      <div className={styles.groupLayer} aria-hidden="true">
        {groups.map((group) => (
          <div key={group.id}>{customRender(group)}</div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.groupLayer} aria-hidden="true">
      {groups.map((group) => {
        const { fill, border } = groupColors(group);

        return (
          <div
            key={group.id}
            className={styles.groupLayer__box}
            style={{
              transform: `translate3d(${group.x}px, ${group.y}px, 0)`,
              width: group.width,
              height: group.height,
              background: fill,
              borderColor: border,
            }}
          />
        );
      })}
    </div>
  );
});

export const GroupLabelLayer = memo(function GroupLabelLayer({ groups, customRender }) {
  if (!groups?.length || customRender) return null;

  return (
    <div className={styles.groupLabelLayer} aria-hidden="true">
      {groups.map((group) => (
        <span
          key={group.id}
          className={styles.groupLayer__label}
          style={{
            transform: `translate3d(${group.x + LABEL_OFFSET_X}px, ${group.y + LABEL_OFFSET_Y}px, 0)`,
          }}
        >
          {group.label}
        </span>
      ))}
    </div>
  );
});

