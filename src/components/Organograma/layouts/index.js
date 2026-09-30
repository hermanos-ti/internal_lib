import { layoutTree } from '../core/layoutTree.js';
import { getNodeValue } from '../core/normalizeData.js';

const layouts = new Map();

function createGroupSortChildren(nodes, keys, groupKey) {
  return (a, b) => {
    const nodeA = nodes.get(a);
    const nodeB = nodes.get(b);
    const groupA = getNodeValue(nodeA, groupKey, keys) ?? '';
    const groupB = getNodeValue(nodeB, groupKey, keys) ?? '';
    if (groupA < groupB) return -1;
    if (groupA > groupB) return 1;
    const nameA = getNodeValue(nodeA, 'name', keys) ?? '';
    const nameB = getNodeValue(nodeB, 'name', keys) ?? '';
    return String(nameA).localeCompare(String(nameB));
  };
}

function runTreeLayout(params, orientation) {
  const {
    roots,
    childrenMap,
    visibleIds,
    nodeSize,
    nodeSizeOf,
    spacing,
    nodes,
    keys,
    groups,
    compact,
  } = params;

  const sortChildren =
    groups?.enabled && groups?.cluster
      ? createGroupSortChildren(nodes, keys, groups.key ?? 'department')
      : null;

  return layoutTree({
    roots,
    childrenMap,
    visibleIds,
    nodeSize,
    nodeSizeOf,
    spacing,
    orientation,
    sortChildren,
    compact,
  });
}

export function registerLayout(key, fn) {
  layouts.set(key, fn);
}

export function getLayout(key) {
  return layouts.get(key);
}

export function getRegisteredLayoutKeys() {
  return [...layouts.keys()];
}

registerLayout('tree', (params) => runTreeLayout(params, 'vertical'));
registerLayout('treeHorizontal', (params) => runTreeLayout(params, 'horizontal'));

registerLayout('list', () => ({
  positions: new Map(),
  bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
  stub: true,
}));

registerLayout('matrix', () => ({
  positions: new Map(),
  bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
  stub: true,
}));

registerLayout('departments', () => ({
  positions: new Map(),
  bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
  stub: true,
}));

registerLayout('radial', () => ({
  positions: new Map(),
  bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
  stub: true,
}));

export function computeLayout(viewKey, params, additionalViews = []) {
  for (const custom of additionalViews) {
    if (custom.key === viewKey && typeof custom.layout === 'function') {
      return custom.layout(params);
    }
  }

  const layoutFn = getLayout(viewKey) ?? getLayout('tree');
  return layoutFn(params);
}

export function getViewOrientation(viewKey) {
  return viewKey === 'treeHorizontal' ? 'horizontal' : 'vertical';
}
