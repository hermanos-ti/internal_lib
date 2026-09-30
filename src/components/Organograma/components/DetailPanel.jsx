import React from 'react';
import styles from '../Organograma.module.css';
import { Button } from '../../Button/Button';
import { getNodeValue } from '../core/normalizeData.js';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

function DetailContent({ node, keys, detailFields = [], renderDetails, onClose }) {
  if (renderDetails) {
    return renderDetails(node, { close: onClose });
  }

  const role = getNodeValue(node, 'role', keys) ?? '';
  const department = getNodeValue(node, 'department', keys) ?? '';
  const photo = getNodeValue(node, 'photo', keys);

  return (
    <>
      {photo && <img className={styles.detailPanel__photo} src={photo} alt="" loading="lazy" />}
      {role && <p className={styles.detailPanel__meta}>{role}</p>}
      {department && <p className={styles.detailPanel__metaMuted}>{department}</p>}
      {detailFields.map((field) => {
        const value = node[field.key];
        if (value == null || value === '') return null;
        return (
          <div key={field.key} className={styles.detailPanel__field}>
            <span className={styles.detailPanel__fieldLabel}>{field.label}</span>
            <span className={styles.detailPanel__fieldValue}>{String(value)}</span>
          </div>
        );
      })}
    </>
  );
}

export function DetailPanel({ node, keys, detailFields = [], renderDetails, onClose }) {
  if (!node) return null;

  const name = getNodeValue(node, 'name', keys) ?? '';

  return (
    <div className={styles.detailPanel} role="dialog" aria-label="Detalhes do colaborador">
      <div className={styles.detailPanel__inner}>
        {!renderDetails && (
          <div className={styles.detailPanel__header}>
            <h3 className={styles.detailPanel__title}>{name}</h3>
            <Button variant="tertiary" size="sm" iconOnly onClick={onClose} tooltip="Fechar">
              <i className="far fa-xmark" />
            </Button>
          </div>
        )}
        <div className={styles.detailPanel__body}>
          {renderDetails ? (
            <DetailContent
              node={node}
              keys={keys}
              detailFields={detailFields}
              renderDetails={renderDetails}
              onClose={onClose}
            />
          ) : (
            <DetailContent
              node={node}
              keys={keys}
              detailFields={detailFields}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function DetailDrawer({ node, keys, detailFields = [], renderDetails, onClose, open }) {
  if (!open || !node) return null;

  const name = getNodeValue(node, 'name', keys) ?? 'Detalhes';

  return (
    <div className={cn(styles.detailDrawer, open && styles.detailDrawer_open)} role="dialog">
      <div className={styles.detailDrawer__backdrop} onClick={onClose} aria-hidden />
      <div className={styles.detailDrawer__panel}>
        <div className={styles.detailDrawer__header}>
          <h3>{name}</h3>
          <Button variant="tertiary" size="sm" iconOnly onClick={onClose} tooltip="Fechar">
            <i className="far fa-xmark" />
          </Button>
        </div>
        <div className={styles.detailDrawer__body}>
          <DetailContent
            node={node}
            keys={keys}
            detailFields={detailFields}
            renderDetails={renderDetails}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
