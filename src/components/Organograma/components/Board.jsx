import React, { forwardRef } from 'react';
import styles from '../Organograma.module.css';
import { GroupLayer, GroupLabelLayer } from './GroupLayer.jsx';
import { EdgeLayer } from './EdgeLayer.jsx';
import { NodeLayer } from './NodeLayer.jsx';
import { FocusBreadcrumb } from './FocusBreadcrumb.jsx';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

export const Board = forwardRef(function Board(
  {
    boardRef,
    bounds,
    groupBounds,
    edges,
    visibleNodeIds,
    nodes,
    positions,
    treeMeta,
    collapsedSet,
    selectedId,
    density,
    orientation = 'vertical',
    edgeConfig,
    groupsRender,
    onNodeClick,
    onNodeDoubleClick,
    onToggleCollapse,
    animate = false,
    autoSize = true,
    registerNodeRef,
    focusedId,
    parentMap,
    keys,
    onFocusNavigate,
    onFocusClear,
    showBreadcrumb = true,
    className,
  },
  ref
) {
  const contentWidth = Math.max(bounds.width, 1);
  const contentHeight = Math.max(bounds.height, 1);

  return (
    <div ref={ref} className={cn(styles.boardViewport, className)} role="tree">
      {showBreadcrumb && focusedId && (
        <FocusBreadcrumb
          focusedId={focusedId}
          nodes={nodes}
          parentMap={parentMap}
          keys={keys}
          onNavigate={onFocusNavigate}
          onClear={onFocusClear}
        />
      )}

      <div
        ref={boardRef}
        className={cn(styles.board, animate && styles.board_animated)}
        style={{
          width: contentWidth,
          height: contentHeight,
          transformOrigin: '0 0',
          '--org-scale': 1,
        }}
      >
        <GroupLayer groups={groupBounds} customRender={groupsRender} />
        <EdgeLayer edges={edges} edgeConfig={edgeConfig} />
        <NodeLayer
          visibleNodeIds={visibleNodeIds}
          nodes={nodes}
          positions={positions}
          treeMeta={treeMeta}
          collapsedSet={collapsedSet}
          selectedId={selectedId}
          density={density}
          orientation={orientation}
          autoSize={autoSize}
          registerNodeRef={registerNodeRef}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onToggleCollapse={onToggleCollapse}
        />
        <GroupLabelLayer groups={groupBounds} customRender={groupsRender} />
      </div>
    </div>
  );
});
