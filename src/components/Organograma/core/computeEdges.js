/**
 * Gera segmentos geométricos para arestas CSS (trunk, bus, elbow, drop, tick).
 */

function getAnchors(parentPos, childPos, orientation) {
  if (orientation === 'horizontal') {
    return {
      parent: { x: parentPos.x + parentPos.width, y: parentPos.y + parentPos.height / 2 },
      child: { x: childPos.x, y: childPos.y + childPos.height / 2 },
    };
  }
  return {
    parent: { x: parentPos.x + parentPos.width / 2, y: parentPos.y + parentPos.height },
    child: { x: childPos.x + childPos.width / 2, y: childPos.y },
  };
}

function pushSegment(segments, segment) {
  segments.push(segment);
}

function addVerticalLine(segments, id, x, y, length, meta = {}) {
  if (length <= 0) return;
  pushSegment(segments, {
    id,
    type: 'line-v',
    x,
    y,
    width: 0,
    height: length,
    ...meta,
  });
}

function addHorizontalLine(segments, id, x, y, length, meta = {}) {
  if (length <= 0) return;
  pushSegment(segments, {
    id,
    type: 'line-h',
    x,
    y,
    width: length,
    height: 0,
    ...meta,
  });
}

function addElbow(segments, id, x, y, width, height, side, meta = {}) {
  if (width <= 0 || height <= 0) return;
  pushSegment(segments, {
    id,
    type: 'elbow',
    x,
    y,
    width,
    height,
    side,
    ...meta,
  });
}

function connectParentChildren({
  segments,
  parentId,
  parentAnchor,
  childAnchors,
  orientation,
  nodes,
  edgeConfig,
}) {
  if (childAnchors.length === 0) return;

  const isH = orientation === 'horizontal';
  const dashedFn = edgeConfig?.dashed;
  const parentNode = nodes.get(parentId);

  const getDashed = (childId) => {
    if (typeof dashedFn !== 'function') return false;
    return dashedFn(parentNode, nodes.get(childId));
  };

  if (isH) {
    const childXs = childAnchors.map((c) => c.anchor.x);
    const busX =
      childXs.length === 1
        ? (parentAnchor.x + childXs[0]) / 2
        : (parentAnchor.x + Math.min(...childXs)) / 2 + (Math.max(...childXs) - Math.min(...childXs)) / 4;

    addHorizontalLine(segments, `${parentId}-trunk`, parentAnchor.x, parentAnchor.y, busX - parentAnchor.x, {
      sourceId: parentId,
      targetId: parentId,
    });

    if (childAnchors.length > 1) {
      const minY = Math.min(...childAnchors.map((c) => c.anchor.y));
      const maxY = Math.max(...childAnchors.map((c) => c.anchor.y));
      addVerticalLine(segments, `${parentId}-bus`, busX, minY, maxY - minY, {
        sourceId: parentId,
        targetId: childAnchors.map((c) => c.id).join(','),
        merged: true,
      });

      for (const { id, anchor } of childAnchors) {
        const dashed = getDashed(id);
        addHorizontalLine(segments, `${parentId}-${id}-drop`, busX, anchor.y, anchor.x - busX, {
          sourceId: parentId,
          targetId: id,
          dashed,
        });
      }
      return;
    }

    const { id, anchor } = childAnchors[0];
    const dashed = getDashed(id);
    if (Math.abs(anchor.y - parentAnchor.y) < 1) {
      addHorizontalLine(segments, `${parentId}-${id}-drop`, busX, anchor.y, anchor.x - busX, {
        sourceId: parentId,
        targetId: id,
        dashed,
      });
    } else {
      const topY = Math.min(parentAnchor.y, anchor.y);
      addVerticalLine(
        segments,
        `${parentId}-${id}-bridge`,
        busX,
        topY,
        Math.abs(anchor.y - parentAnchor.y),
        { sourceId: parentId, targetId: id, dashed }
      );
      addHorizontalLine(segments, `${parentId}-${id}-drop`, busX, anchor.y, anchor.x - busX, {
        sourceId: parentId,
        targetId: id,
        dashed,
      });
    }
    return;
  }

  const childYs = childAnchors.map((c) => c.anchor.y);
  const busY =
    childYs.length === 1
      ? (parentAnchor.y + childYs[0]) / 2
      : parentAnchor.y + (Math.min(...childYs) - parentAnchor.y) / 2;

  addVerticalLine(segments, `${parentId}-trunk`, parentAnchor.x, parentAnchor.y, busY - parentAnchor.y, {
    sourceId: parentId,
    targetId: parentId,
  });

  if (childAnchors.length > 1) {
    const xs = childAnchors.map((c) => c.anchor.x).sort((a, b) => a - b);
    addHorizontalLine(segments, `${parentId}-bus`, xs[0], busY, xs[xs.length - 1] - xs[0], {
      sourceId: parentId,
      targetId: childAnchors.map((c) => c.id).join(','),
      merged: true,
    });

    for (const { id, anchor } of childAnchors) {
      const dashed = getDashed(id);
      addVerticalLine(segments, `${parentId}-${id}-drop`, anchor.x, busY, anchor.y - busY, {
        sourceId: parentId,
        targetId: id,
        dashed,
      });
    }
    return;
  }

  const { id, anchor } = childAnchors[0];
  const dashed = getDashed(id);
  if (Math.abs(anchor.x - parentAnchor.x) < 1) {
    addVerticalLine(segments, `${parentId}-${id}-drop`, anchor.x, busY, anchor.y - busY, {
      sourceId: parentId,
      targetId: id,
      dashed,
    });
  } else {
    const leftX = Math.min(parentAnchor.x, anchor.x);
    addHorizontalLine(
      segments,
      `${parentId}-${id}-bridge`,
      leftX,
      busY,
      Math.abs(anchor.x - parentAnchor.x),
      { sourceId: parentId, targetId: id, dashed }
    );
    addVerticalLine(segments, `${parentId}-${id}-drop`, anchor.x, busY, anchor.y - busY, {
      sourceId: parentId,
      targetId: id,
      dashed,
    });
  }
}

/**
 * @returns {Array<object>} segmentos posicionados para renderização CSS
 */
export function computeEdgeSegments({
  visibleIds,
  childrenMap,
  positions,
  edgeConfig = {},
  orientation = 'vertical',
  nodes = new Map(),
}) {
  const segments = [];

  for (const [parentId, childIds] of childrenMap) {
    if (!visibleIds.has(parentId)) continue;

    const parentPos = positions.get(parentId);
    if (!parentPos) continue;

    const visibleChildren = childIds.filter((cid) => visibleIds.has(cid));
    if (visibleChildren.length === 0) continue;

    const parentAnchor =
      orientation === 'horizontal'
        ? { x: parentPos.x + parentPos.width, y: parentPos.y + parentPos.height / 2 }
        : { x: parentPos.x + parentPos.width / 2, y: parentPos.y + parentPos.height };

    const childAnchors = visibleChildren
      .map((childId) => {
        const childPos = positions.get(childId);
        if (!childPos) return null;
        return { id: childId, anchor: getAnchors(parentPos, childPos, orientation).child };
      })
      .filter(Boolean);

    connectParentChildren({
      segments,
      parentId,
      parentAnchor,
      childAnchors,
      orientation,
      nodes,
      edgeConfig,
    });
  }

  return segments;
}

/** @deprecated use computeEdgeSegments */
export function computeEdges(params) {
  return computeEdgeSegments(params);
}

function segmentIntersectsViewport(segment, viewport, margin) {
  const { x, y, width, height } = viewport;
  const minX = x - margin;
  const minY = y - margin;
  const maxX = x + width + margin;
  const maxY = y + height + margin;

  const segMaxX = segment.x + Math.max(segment.width, 1);
  const segMaxY = segment.y + Math.max(segment.height, 1);

  return segMaxX >= minX && segment.x <= maxX && segMaxY >= minY && segment.y <= maxY;
}

export function cullEdgeSegments(segments, viewport, margin = 400) {
  return segments.filter((segment) => segmentIntersectsViewport(segment, viewport, margin));
}

/** @deprecated use cullEdgeSegments */
export function cullEdges(segments, positions, viewport, margin = 400) {
  return cullEdgeSegments(segments, viewport, margin);
}
