import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeData } from '../core/normalizeData.js';
import {
  buildTreeMeta,
  getDefaultExpandedIds,
  getVisibleNodeIds,
} from '../core/buildTree.js';
import { computeEdgeSegments } from '../core/computeEdges.js';
import { computeGroupBounds, colorFromPalette } from '../core/groupBounds.js';
import { createSpatialIndex } from '../core/spatialIndex.js';
import { computeLayout, getViewOrientation } from '../layouts/index.js';
import { GROUP_COLOR_PALETTE, GROUP_BORDER_PALETTE } from '../constants.js';
import { resolveFallbackSize } from '../core/nodeSizing.js';

export function useOrgTree({
  data,
  options,
  collapsedSet,
  groupsEnabled,
  layoutRoots = null,
  measureVersion = 0,
  density = 'full',
}) {
  const keys = options.keys;

  const normalized = useMemo(() => normalizeData(data, keys), [data, keys]);

  const effectiveRoots = layoutRoots ?? normalized.roots;

  const treeMeta = useMemo(
    () => buildTreeMeta(normalized.roots, normalized.childrenMap, collapsedSet),
    [normalized.roots, normalized.childrenMap, collapsedSet]
  );

  const visibleIds = useMemo(
    () => getVisibleNodeIds(effectiveRoots, normalized.childrenMap, collapsedSet),
    [effectiveRoots, normalized.childrenMap, collapsedSet]
  );

  const orientation = getViewOrientation(options.view);

  const layoutResult = useMemo(() => {
    const groups = groupsEnabled
      ? { ...options.groups, enabled: true }
      : { ...options.groups, enabled: false };

    const nodeSize = resolveFallbackSize(orientation, density, options.nodeSize);

    return computeLayout(
      options.view,
      {
        roots: effectiveRoots,
        childrenMap: normalized.childrenMap,
        visibleIds,
        nodeSize,
        nodeSizeOf: options.nodeSizeOf,
        spacing: options.spacing,
        nodes: normalized.nodes,
        keys,
        groups,
        compact: options.compact,
      },
      options.additionalViews
    );
  }, [
    options.view,
    options.additionalViews,
    options.nodeSize,
    options.nodeSizeOf,
    options.spacing,
    options.groups,
    options.compact,
    effectiveRoots,
    normalized.childrenMap,
    normalized.nodes,
    visibleIds,
    keys,
    groupsEnabled,
    measureVersion,
    density,
    orientation,
  ]);

  const edges = useMemo(
    () =>
      computeEdgeSegments({
        visibleIds,
        childrenMap: normalized.childrenMap,
        positions: layoutResult.positions,
        edgeConfig: options.edge,
        orientation,
        nodes: normalized.nodes,
      }),
    [
      visibleIds,
      normalized.childrenMap,
      normalized.nodes,
      layoutResult.positions,
      options.edge,
      orientation,
    ]
  );

  const spatialIndex = useMemo(
    () =>
      createSpatialIndex(
        layoutResult.positions,
        (resolveFallbackSize(orientation, density, options.nodeSize).width ?? 180) * 2
      ),
    [layoutResult.positions, options.nodeSize, orientation, density]
  );

  const groupBounds = useMemo(() => {
    if (!groupsEnabled) return [];
    return computeGroupBounds({
      visibleIds,
      positions: layoutResult.positions,
      nodes: normalized.nodes,
      keys,
      groupKey: options.groups.key ?? 'department',
      padding: options.groups.padding ?? 20,
      colorOf: (value) => {
        if (typeof options.groups.color === 'function') {
          return options.groups.color(value);
        }
        return {
          fill: colorFromPalette(value, GROUP_COLOR_PALETTE),
          border: colorFromPalette(value, GROUP_BORDER_PALETTE),
        };
      },
      labelOf: options.groups.label,
    });
  }, [groupsEnabled, visibleIds, layoutResult.positions, normalized.nodes, keys, options.groups]);

  return {
    normalized,
    treeMeta,
    visibleIds,
    layoutResult,
    edges,
    spatialIndex,
    groupBounds,
    orientation,
    effectiveRoots,
  };
}

export function useCollapseState(options, normalized) {
  const isControlled = options.expandedIds != null;
  const [internalCollapsed, setInternalCollapsed] = useState(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    if (isControlled || initializedRef.current || normalized.nodes.size === 0) return;

    const expanded = getDefaultExpandedIds(
      normalized.roots,
      normalized.childrenMap,
      options.defaultExpandedDepth
    );
    const collapsed = new Set();
    for (const [id] of normalized.nodes) {
      const children = normalized.childrenMap.get(id) ?? [];
      if (children.length > 0 && !expanded.has(id)) {
        collapsed.add(id);
      }
    }
    setInternalCollapsed(collapsed);
    initializedRef.current = true;
  }, [
    normalized.roots,
    normalized.childrenMap,
    normalized.nodes,
    options.defaultExpandedDepth,
    isControlled,
  ]);

  const collapsedSet = useMemo(() => {
    if (!isControlled) return internalCollapsed;
    const collapsed = new Set();
    for (const [id] of normalized.nodes) {
      const children = normalized.childrenMap.get(id) ?? [];
      if (children.length > 0 && !options.expandedIds.has(id)) {
        collapsed.add(id);
      }
    }
    return collapsed;
  }, [isControlled, internalCollapsed, normalized.nodes, normalized.childrenMap, options.expandedIds]);

  const toggleCollapse = (id) => {
    const children = normalized.childrenMap.get(id) ?? [];
    if (children.length === 0) return;

    if (isControlled) {
      const nextExpanded = new Set(options.expandedIds);
      if (nextExpanded.has(id)) {
        nextExpanded.delete(id);
      } else {
        nextExpanded.add(id);
      }
      options.onToggle?.(id, nextExpanded.has(id), nextExpanded);
      return;
    }

    setInternalCollapsed((prev) => {
      const next = new Set(prev);
      const willExpand = next.has(id);
      if (willExpand) {
        next.delete(id);
      } else {
        next.add(id);
      }
      options.onToggle?.(id, willExpand, null);
      return next;
    });
  };

  const expandAll = () => {
    if (isControlled) {
      options.onToggle?.(null, true, new Set(normalized.nodes.keys()));
      return;
    }
    setInternalCollapsed(new Set());
  };

  const collapseAll = () => {
    const allWithChildren = new Set();
    for (const [id, children] of normalized.childrenMap) {
      if (children.length > 0) allWithChildren.add(id);
    }
    if (isControlled) {
      options.onToggle?.(null, false, new Set());
      return;
    }
    setInternalCollapsed(allWithChildren);
  };

  const expand = (id) => {
    if (isControlled) {
      const next = new Set(options.expandedIds);
      next.add(id);
      options.onToggle?.(id, true, next);
      return;
    }
    setInternalCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const collapse = (id) => {
    if (isControlled) {
      const next = new Set(options.expandedIds);
      next.delete(id);
      options.onToggle?.(id, false, next);
      return;
    }
    setInternalCollapsed((prev) => new Set(prev).add(id));
  };

  return {
    collapsedSet,
    toggleCollapse,
    expandAll,
    collapseAll,
    expand,
    collapse,
    isControlled,
  };
}
