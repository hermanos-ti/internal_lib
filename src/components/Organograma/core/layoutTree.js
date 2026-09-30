/**
 * Layout hierárquico O(n) com eixos parametrizados, suporte horizontal
 * e empacotamento em grade para clusters de folhas.
 */

function getNodeSize(id, nodeSize, nodeSizeOf) {
  const size = nodeSizeOf ? nodeSizeOf(id) : nodeSize;
  return {
    width: size.width ?? 260,
    height: size.height ?? 88,
  };
}

function buildVisibleForest(roots, childrenMap, visibleIds, sortChildren) {
  const forest = [];

  const build = (id, depth, parent) => {
    const node = { id, depth, parent, children: [] };
    let childIds = (childrenMap.get(id) ?? []).filter((cid) => visibleIds.has(cid));
    if (sortChildren) {
      childIds = [...childIds].sort(sortChildren);
    }
    for (const childId of childIds) {
      node.children.push(build(childId, depth + 1, node));
    }
    return node;
  };

  for (const rootId of roots) {
    if (visibleIds.has(rootId)) {
      forest.push(build(rootId, 0, null));
    }
  }

  return forest;
}

function collectDepthSizes(forest, nodeSize, nodeSizeOf, isHorizontal) {
  const levelMain = new Map();
  const levelCross = new Map();

  const walk = (node) => {
    const size = getNodeSize(node.id, nodeSize, nodeSizeOf);
    const main = isHorizontal ? size.width : size.height;
    const cross = isHorizontal ? size.height : size.width;

    levelMain.set(node.depth, Math.max(levelMain.get(node.depth) ?? 0, main));
    levelCross.set(node.depth, Math.max(levelCross.get(node.depth) ?? 0, cross));

    for (const child of node.children) {
      walk(child);
    }
  };

  for (const root of forest) {
    walk(root);
  }

  return { levelMain, levelCross };
}

function getMainPosition(depth, levelMain, spacing) {
  let pos = 0;
  const levelGap = spacing.level ?? 72;
  for (let d = 0; d < depth; d += 1) {
    pos += (levelMain.get(d) ?? 88) + levelGap;
  }
  return pos;
}

function isLeafCluster(node, childrenMap, visibleIds) {
  return node.children.every((child) => {
    const grandchildren = (childrenMap.get(child.id) ?? []).filter((cid) => visibleIds.has(cid));
    return grandchildren.length === 0;
  });
}

function layoutLeafGrid(node, positions, nodeSize, nodeSizeOf, spacing, compact, isHorizontal, levelMain, crossStart) {
  const childIds = node.children.map((c) => c.id);
  const n = childIds.length;
  const cols =
    compact.maxColumns === 'auto' || compact.maxColumns == null
      ? Math.ceil(Math.sqrt(n))
      : compact.maxColumns;
  const rows = Math.ceil(n / cols);
  const columnGap = compact.columnGap ?? 16;
  const rowGap = compact.rowGap ?? 12;

  const sizes = childIds.map((id) => getNodeSize(id, nodeSize, nodeSizeOf));
  const maxW = Math.max(...sizes.map((s) => s.width));
  const maxH = Math.max(...sizes.map((s) => s.height));

  const gridCrossSpan = cols * maxW + Math.max(0, cols - 1) * columnGap;

  for (let i = 0; i < n; i += 1) {
    const col = Math.floor(i / rows);
    const row = i % rows;
    const size = sizes[i];
    const childDepth = node.depth + 1;

    const crossOffset = crossStart + col * (maxW + columnGap);
    const mainOffset = getMainPosition(childDepth, levelMain, spacing) + row * (maxH + rowGap);

    if (isHorizontal) {
      positions.set(childIds[i], {
        x: mainOffset,
        y: crossOffset,
        width: size.width,
        height: size.height,
        depth: childDepth,
      });
    } else {
      positions.set(childIds[i], {
        x: crossOffset,
        y: mainOffset,
        width: size.width,
        height: size.height,
        depth: childDepth,
      });
    }
  }

  return {
    left: crossStart,
    right: crossStart + gridCrossSpan,
    center: crossStart + gridCrossSpan / 2,
  };
}

function layoutForest(
  forest,
  childrenMap,
  visibleIds,
  nodeSize,
  nodeSizeOf,
  spacing,
  orientation,
  compact
) {
  const positions = new Map();
  const isHorizontal = orientation === 'horizontal';
  const siblingGap = spacing.sibling ?? 24;
  const subtreeGap = spacing.subtree ?? 56;
  let nextCross = 0;

  const { levelMain } = collectDepthSizes(forest, nodeSize, nodeSizeOf, isHorizontal);

  const layoutNode = (node) => {
    const size = getNodeSize(node.id, nodeSize, nodeSizeOf);

    if (node.children.length === 0) {
      const mainPos = getMainPosition(node.depth, levelMain, spacing);
      const crossPos = nextCross;
      nextCross += (isHorizontal ? size.height : size.width) + siblingGap;

      if (isHorizontal) {
        positions.set(node.id, { x: mainPos, y: crossPos, width: size.width, height: size.height, depth: node.depth });
      } else {
        positions.set(node.id, { x: crossPos, y: mainPos, width: size.width, height: size.height, depth: node.depth });
      }

      return { left: crossPos, right: crossPos + (isHorizontal ? size.height : size.width), center: crossPos + (isHorizontal ? size.height : size.width) / 2 };
    }

    const useGrid =
      compact?.enabled &&
      isLeafCluster(node, childrenMap, visibleIds) &&
      node.children.length >= (compact.leafThreshold ?? 6);

    let bounds;
    if (useGrid) {
      const gridStart = nextCross;
      bounds = layoutLeafGrid(
        node,
        positions,
        nodeSize,
        nodeSizeOf,
        spacing,
        compact,
        isHorizontal,
        levelMain,
        gridStart
      );
      nextCross = bounds.right + siblingGap;
    } else {
      const childBounds = node.children.map((child) => layoutNode(child));
      const left = Math.min(...childBounds.map((b) => b.left));
      const right = Math.max(...childBounds.map((b) => b.right));
      bounds = { left, right, center: (left + right) / 2 };
    }

    const mainPos = getMainPosition(node.depth, levelMain, spacing);
    const crossCenter = bounds.center;
    const crossPos = crossCenter - (isHorizontal ? size.height : size.width) / 2;

    if (isHorizontal) {
      positions.set(node.id, {
        x: mainPos,
        y: crossPos,
        width: size.width,
        height: size.height,
        depth: node.depth,
      });
    } else {
      positions.set(node.id, {
        x: crossPos,
        y: mainPos,
        width: size.width,
        height: size.height,
        depth: node.depth,
      });
    }

    return {
      left: Math.min(crossPos, bounds.left),
      right: Math.max(crossPos + (isHorizontal ? size.height : size.width), bounds.right),
      center: bounds.center,
    };
  };

  for (const root of forest) {
    layoutNode(root);
    nextCross += subtreeGap;
  }

  return positions;
}

export function layoutTree({
  roots = [],
  childrenMap = new Map(),
  visibleIds = new Set(),
  nodeSize = { width: 260, height: 88 },
  nodeSizeOf = null,
  spacing = { sibling: 24, subtree: 56, level: 72 },
  orientation = 'vertical',
  sortChildren = null,
  compact = null,
}) {
  const forest = buildVisibleForest(roots, childrenMap, visibleIds, sortChildren);
  const positions = layoutForest(
    forest,
    childrenMap,
    visibleIds,
    nodeSize,
    nodeSizeOf,
    spacing,
    orientation,
    compact
  );

  if (positions.size === 0) {
    return {
      positions,
      bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
    };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pos of positions.values()) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + pos.width);
    maxY = Math.max(maxY, pos.y + pos.height);
  }

  return {
    positions,
    bounds: {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
}
