import React, { memo } from 'react';
import { NodeCard } from './NodeCard.jsx';
import { getNodeStackZ } from '../core/nodeStackZ.js';

export const NodeLayer = memo(function NodeLayer({
  visibleNodeIds,
  nodes,
  positions,
  treeMeta,
  collapsedSet,
  selectedId,
  density,
  orientation = 'vertical',
  autoSize = true,
  registerNodeRef,
  onNodeClick,
  onNodeDoubleClick,
  onToggleCollapse,
}) {
  return (
    <div aria-label="Nós do organograma">
      {visibleNodeIds.map((nodeId) => {
        const node = nodes.get(nodeId);
        const pos = positions.get(nodeId);
        if (!node || !pos) return null;

        const directCount = treeMeta.directChildCountMap.get(nodeId) ?? 0;

        return (
          <NodeCard
            key={nodeId}
            nodeId={nodeId}
            node={node}
            x={pos.x}
            y={pos.y}
            width={pos.width}
            height={pos.height}
            stackZ={getNodeStackZ(pos, {
              selected: selectedId === nodeId,
              collapsed: collapsedSet.has(nodeId),
              hasChildren: directCount > 0,
            })}
            selected={selectedId === nodeId}
            collapsed={collapsedSet.has(nodeId)}
            directCount={directCount}
            totalCount={treeMeta.descendantCountMap.get(nodeId) ?? 0}
            density={density}
            orientation={orientation}
            autoSize={autoSize}
            registerNodeRef={registerNodeRef}
            onClick={onNodeClick}
            onDoubleClick={onNodeDoubleClick}
            onToggleCollapse={() => onToggleCollapse(nodeId)}
          />
        );
      })}
    </div>
  );
});
