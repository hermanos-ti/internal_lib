import React, { memo, useCallback, useRef } from 'react';
import styles from '../Organograma.module.css';
import { CollapseBadge } from './CollapseBadge.jsx';
import { getCard } from './cards/index.js';
import { useOrganogramaContextSafe } from '../OrganogramaContext.jsx';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

function areEqual(prev, next) {
  return (
    prev.nodeId === next.nodeId &&
    prev.x === next.x &&
    prev.y === next.y &&
    prev.stackZ === next.stackZ &&
    prev.selected === next.selected &&
    prev.collapsed === next.collapsed &&
    prev.density === next.density &&
    prev.orientation === next.orientation &&
    prev.directCount === next.directCount &&
    prev.totalCount === next.totalCount &&
    prev.autoSize === next.autoSize
  );
}

export const NodeCard = memo(function NodeCard({
  nodeId,
  node,
  x,
  y,
  width,
  height,
  stackZ = 3,
  selected,
  collapsed,
  directCount,
  totalCount,
  density,
  orientation = 'vertical',
  autoSize = true,
  registerNodeRef,
  onClick,
  onDoubleClick,
  onToggleCollapse,
}) {
  const ctx = useOrganogramaContextSafe();
  const options = ctx?.options ?? {};
  const keys = options.keys ?? {};
  const innerRef = useRef(null);

  const CardComponent = getCard(options.nodeType ?? 'person');
  const customRender = options.nodeRender;

  const setRef = useCallback(
    (el) => {
      innerRef.current = el;
      registerNodeRef?.(nodeId, el);
    },
    [nodeId, registerNodeRef]
  );

  return (
    <div
      className={cn(
        styles.nodeCard,
        autoSize && styles.nodeCard_autoSize,
        density === 'minimal' && styles.nodeCard_minimal
      )}
      data-org-node
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
        zIndex: stackZ,
        ...(autoSize
          ? density === 'minimal'
            ? { width, height }
            : { minWidth: width }
          : { width, minHeight: height }),
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(nodeId, node);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onDoubleClick?.(nodeId, node);
      }}
      role="treeitem"
      aria-selected={selected || undefined}
    >
      <div
        ref={setRef}
        className={cn(
          styles.nodeCard__inner,
          selected && styles.nodeCard__inner_selected
        )}
      >
        {customRender ? (
          customRender(node, { density, selected, collapsed, nodeId })
        ) : (
          <CardComponent
            node={node}
            keys={keys}
            density={density}
            orientation={orientation}
            selected={selected}
            lazyPhotos={options.performance?.lazyPhotos !== false}
          />
        )}
      </div>

      {options.collapsible !== false && directCount > 0 && density !== 'minimal' && (
        <CollapseBadge
          directCount={directCount}
          totalCount={totalCount}
          collapsed={collapsed}
          showCounters={options.showCounters !== false}
          counterMode={options.counterMode ?? 'both'}
          onToggle={onToggleCollapse}
        />
      )}
    </div>
  );
}, areEqual);
