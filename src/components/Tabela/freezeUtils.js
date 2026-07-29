export const FREEZE_MAX_RATIO = 0.55;
export const FREEZE_MOBILE_MAX_WIDTH = 768;
export const SELECTION_COLUMN_WIDTH_PX = 40;

/**
 * Frozen columns require an explicit numeric width (%) or minWidth (px).
 */
export function columnHasExplicitWidth(column) {
  const hasWidth = typeof column?.width === 'number' && Number.isFinite(column.width) && column.width > 0;
  const hasMinWidth = typeof column?.minWidth === 'number' && Number.isFinite(column.minWidth) && column.minWidth > 0;
  return hasWidth || hasMinWidth;
}

/**
 * Resolve a stable px width for sticky left offsets.
 * Ignores tiny measured values (layout thrash / pre-paint) that would collapse offsets to ~0.
 */
export function estimateColumnWidthPx(column, measuredWidth, columnMinWidth) {
  const MIN_TRUSTED_MEASURE = 32;
  if (typeof measuredWidth === 'number' && measuredWidth >= MIN_TRUSTED_MEASURE) {
    return measuredWidth;
  }
  if (typeof column?.minWidth === 'number' && column.minWidth > 0) return column.minWidth;
  if (typeof columnMinWidth === 'number' && columnMinWidth > 0) return columnMinWidth;
  if (typeof column?.width === 'number' && column.width > 0) {
    // width is stored as % in the table; use a conservative px fallback for limit checks
    return Math.max(80, column.width * 8);
  }
  return 120;
}

/**
 * Frozen keys in the same order they appear after pin-left (natural leaf order).
 * Always use natural (pre-pin) leaf columns — never the already-reordered header leaves.
 */
export function getFrozenKeysInVisualOrder(frozenKeys, naturalLeafColumns) {
  if (!frozenKeys?.length) return [];
  const frozenSet = new Set(frozenKeys);
  return naturalLeafColumns
    .filter((col) => frozenSet.has(col.key))
    .map((col) => col.key);
}

/**
 * Leaves that must freeze/unfreeze together (same immediate parent).
 */
export function getSiblingGroupLeafKeys(columnKey, leafColumns) {
  const column = leafColumns.find((c) => c.key === columnKey);
  if (!column) return [columnKey];
  if (!column.parentKey) return [columnKey];
  return leafColumns
    .filter((c) => c.parentKey === column.parentKey)
    .map((c) => c.key);
}

/**
 * Expand a set of keys so every nested group is fully included; preserve leaf order.
 */
export function expandFrozenKeysWithGroups(keys, leafColumns) {
  const set = new Set();
  for (const key of keys) {
    getSiblingGroupLeafKeys(key, leafColumns).forEach((k) => set.add(k));
  }
  return leafColumns.filter((c) => set.has(c.key)).map((c) => c.key);
}

/**
 * Pin frozen leaves to the left; keep relative order within each partition.
 */
export function orderLeafColumns(leafColumns, frozenKeys) {
  if (!frozenKeys?.length) return leafColumns;
  const frozenSet = new Set(frozenKeys);
  const frozen = [];
  const unfrozen = [];
  for (const col of leafColumns) {
    if (frozenSet.has(col.key)) frozen.push(col);
    else unfrozen.push(col);
  }
  return [...frozen, ...unfrozen];
}

export function computeFrozenLeftOffsets(frozenKeysInOrder, widthByKey, selectionWidth = 0) {
  const offsets = {};
  let left = selectionWidth;
  for (const key of frozenKeysInOrder) {
    offsets[key] = left;
    left += widthByKey[key] || 0;
  }
  return { offsets, totalFrozenWidth: left };
}

export function wouldExceedFreezeLimit({
  nextFrozenKeys,
  widthByKey,
  containerWidth,
  selectionWidth = 0,
  maxRatio = FREEZE_MAX_RATIO,
}) {
  if (!containerWidth || containerWidth <= 0) return false;
  const sum =
    selectionWidth +
    nextFrozenKeys.reduce((acc, key) => acc + (widthByKey[key] || 0), 0);
  return sum > containerWidth * maxRatio;
}

export function getFreezeBlockReason(column, {
  isMobile,
  leafColumns,
  frozenKeys,
  widthByKey,
  containerWidth,
  selectionWidth,
  columnMinWidth,
}) {
  if (isMobile) {
    return 'Congelar colunas não está disponível em telas pequenas';
  }
  const groupKeys = getSiblingGroupLeafKeys(column.key, leafColumns);
  const groupColumns = leafColumns.filter((c) => groupKeys.includes(c.key));
  const missingWidth = groupColumns.find((c) => !columnHasExplicitWidth(c));
  if (missingWidth) {
    return `Defina width ou minWidth na coluna "${missingWidth.label ?? missingWidth.key}" para congelar`;
  }

  const alreadyFrozen = frozenKeys.includes(column.key);
  if (alreadyFrozen) return null;

  const nextKeys = expandFrozenKeysWithGroups([...frozenKeys, ...groupKeys], leafColumns);
  const widths = { ...widthByKey };
  for (const col of groupColumns) {
    if (!widths[col.key]) {
      widths[col.key] = estimateColumnWidthPx(col, null, columnMinWidth);
    }
  }
  if (
    wouldExceedFreezeLimit({
      nextFrozenKeys: nextKeys,
      widthByKey: widths,
      containerWidth,
      selectionWidth,
    })
  ) {
    return 'A soma das colunas congeladas não pode ultrapassar ~55% da largura da tabela';
  }
  return null;
}
