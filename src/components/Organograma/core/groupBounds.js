import { getNodeValue } from './normalizeData.js';

/**
 * Calcula bounding boxes por grupo (setor/departamento).
 */
export function computeGroupBounds({
  visibleIds,
  positions,
  nodes,
  keys = {},
  groupKey = 'department',
  padding = 20,
  colorOf = null,
  labelOf = null,
}) {
  const groups = new Map();

  for (const id of visibleIds) {
    const node = nodes.get(id);
    const pos = positions.get(id);
    if (!node || !pos) continue;

    const groupValue = getNodeValue(node, groupKey, keys) ?? 'Sem grupo';
    if (!groups.has(groupValue)) {
      groups.set(groupValue, {
        id: groupValue,
        label: labelOf ? labelOf(groupValue, node) : String(groupValue),
        color: colorOf ? colorOf(groupValue, node) : null,
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity,
        nodeIds: [],
      });
    }

    const group = groups.get(groupValue);
    group.minX = Math.min(group.minX, pos.x);
    group.minY = Math.min(group.minY, pos.y);
    group.maxX = Math.max(group.maxX, pos.x + pos.width);
    group.maxY = Math.max(group.maxY, pos.y + pos.height);
    group.nodeIds.push(id);
  }

  const result = [];
  for (const group of groups.values()) {
    if (!Number.isFinite(group.minX)) continue;
    result.push({
      ...group,
      x: group.minX - padding,
      y: group.minY - padding,
      width: group.maxX - group.minX + padding * 2,
      height: group.maxY - group.minY + padding * 2,
    });
  }

  return result;
}

/**
 * Hash determinístico para cor de grupo.
 */
export function hashString(str) {
  let hash = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function colorFromPalette(value, palette) {
  const idx = hashString(value) % palette.length;
  return palette[idx];
}
