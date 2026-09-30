import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import '../../styles/themes.css';
import styles from './Organograma.module.css';
import { mergeOptions } from './constants.js';
import { OrganogramaContext } from './OrganogramaContext.jsx';
import { useOrgTree, useCollapseState } from './hooks/useOrgTree.js';
import { usePanZoom } from './hooks/usePanZoom.js';
import { useViewportCulling } from './hooks/useViewportCulling.js';
import { useElementSize } from './hooks/useElementSize.js';
import { useNodeMeasure } from './hooks/useNodeMeasure.js';
import { Board } from './components/Board.jsx';
import { Toolbar } from './components/Toolbar.jsx';
import { DetailPanel, DetailDrawer } from './components/DetailPanel.jsx';
import { fitToView, centerOnNode, getLodLevel } from './core/viewportMath.js';
import { getNodeValue, normalizeData } from './core/normalizeData.js';
import { getViewOrientation } from './layouts/index.js';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

const EMPTY_DATA = [];
const EMPTY_OPTIONS = {};

export const Organograma = function Organograma({
  id,
  data = EMPTY_DATA,
  options,
  className,
  style,
}) {
  const mergedOptions = useMemo(
    () => mergeOptions(options ?? EMPTY_OPTIONS),
    [options]
  );
  const containerRef = useRef(null);
  const containerSize = useElementSize(containerRef);

  const normalized = useMemo(
    () => normalizeData(data, mergedOptions.keys),
    [data, mergedOptions.keys]
  );

  const collapse = useCollapseState(mergedOptions, normalized);

  const [internalGroupsEnabled, setInternalGroupsEnabled] = useState(mergedOptions.groups.enabled);
  const groupsEnabled = internalGroupsEnabled;

  const [focusedId, setFocusedId] = useState(null);
  const layoutRoots = focusedId ? [focusedId] : null;

  const [selectedId, setSelectedId] = useState(null);
  const [detailNode, setDetailNode] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [animateBoard, setAnimateBoard] = useState(false);
  const hasFitRef = useRef(false);
  const cullingApiRef = useRef(null);
  const pendingFitRef = useRef(false);

  const handleTransformChange = useCallback(() => {
    cullingApiRef.current?.updateCulling?.();
  }, []);

  const panZoom = usePanZoom({
    enabled: mergedOptions.interaction.pan || mergedOptions.interaction.zoom,
    panEnabled: mergedOptions.interaction.pan !== false,
    zoomEnabled: mergedOptions.interaction.zoom !== false,
    zoomRange: mergedOptions.interaction.zoomRange,
    zoomStep: mergedOptions.interaction.zoomStep,
    containerRef,
    onTransformChange: handleTransformChange,
  });

  const orientation = getViewOrientation(mergedOptions.view);

  const density = useMemo(
    () =>
      getLodLevel(
        panZoom.displayScale,
        mergedOptions.performance.lodThreshold,
        mergedOptions.performance.minimalThreshold
      ),
    [
      panZoom.displayScale,
      mergedOptions.performance.lodThreshold,
      mergedOptions.performance.minimalThreshold,
    ]
  );

  const nodeMeasure = useNodeMeasure({
    enabled: mergedOptions.autoSize !== false,
    density,
    orientation,
    defaultSize: mergedOptions.nodeSize,
  });

  const nodeSizeOfRef = useRef(nodeMeasure.nodeSizeOf);
  nodeSizeOfRef.current = nodeMeasure.nodeSizeOf;

  const stableNodeSizeOf = useCallback((nodeId) => nodeSizeOfRef.current(nodeId), []);

  const optionsWithMeasure = useMemo(
    () => ({
      ...mergedOptions,
      nodeSizeOf:
        mergedOptions.autoSize !== false ? stableNodeSizeOf : mergedOptions.nodeSizeOf,
    }),
    [mergedOptions, stableNodeSizeOf]
  );

  const orgTree = useOrgTree({
    data,
    options: optionsWithMeasure,
    collapsedSet: collapse.collapsedSet,
    groupsEnabled,
    layoutRoots,
    measureVersion: nodeMeasure.measureVersion,
    density,
  });

  const { treeMeta, layoutResult, edges, spatialIndex, groupBounds } = orgTree;

  const cullingEnabled = mergedOptions.performance.culling !== false;

  const culling = useViewportCulling({
    spatialIndex,
    positions: layoutResult.positions,
    edges,
    enabled: cullingEnabled,
    margin: mergedOptions.performance.cullingMargin,
    scale: panZoom.displayScale,
    lodThreshold: mergedOptions.performance.lodThreshold,
    minimalThreshold: mergedOptions.performance.minimalThreshold,
    getViewport: panZoom.getViewport,
  });

  cullingApiRef.current = culling;

  const visibleEdges = cullingEnabled ? culling.visibleEdges : edges;
  const visibleNodeIds = cullingEnabled
    ? culling.visibleNodeIds
    : [...layoutResult.positions.keys()];

  useEffect(() => {
    nodeMeasure.resetIterations();
    hasFitRef.current = false;
  }, [data, focusedId, nodeMeasure.resetIterations]);

  const fitView = useCallback(() => {
    if (containerSize.width <= 0 || containerSize.height <= 0) return;
    const next = fitToView(
      layoutResult.bounds,
      containerSize,
      mergedOptions.interaction.fitPadding,
      mergedOptions.interaction.zoomRange
    );
    panZoom.setTransform(next);
    setTimeout(() => culling.updateCulling(), 0);
  }, [containerSize, layoutResult.bounds, mergedOptions.interaction, panZoom, culling]);

  const centerView = useCallback(
    (nodeId) => {
      const targetId = nodeId ?? selectedId ?? layoutRoots?.[0] ?? normalized.roots[0];
      const pos = layoutResult.positions.get(targetId);
      if (!pos || containerSize.width <= 0) return;
      const t = panZoom.getTransform();
      const next = centerOnNode(pos, containerSize, t.scale);
      panZoom.setTransform(next);
      setTimeout(() => culling.updateCulling(), 0);
    },
    [selectedId, layoutRoots, normalized.roots, layoutResult.positions, containerSize, panZoom, culling]
  );

  const boundsKey = `${layoutResult.bounds.minX}|${layoutResult.bounds.minY}|${layoutResult.bounds.width}|${layoutResult.bounds.height}`;

  useEffect(() => {
    if (
      containerSize.width > 0 &&
      containerSize.height > 0 &&
      layoutResult.positions.size > 0 &&
      (!hasFitRef.current || pendingFitRef.current)
    ) {
      hasFitRef.current = true;
      pendingFitRef.current = false;
      fitView();
    }
  }, [
    containerSize.width,
    containerSize.height,
    layoutResult.positions.size,
    boundsKey,
    fitView,
  ]);

  const setFocus = useCallback(
    (nodeId) => {
      if (!mergedOptions.focus?.enabled) return;
      setFocusedId(nodeId);
      pendingFitRef.current = true;
      mergedOptions.onFocusChange?.(nodeId);
    },
    [mergedOptions]
  );

  const clearFocus = useCallback(() => {
    setFocusedId(null);
    pendingFitRef.current = true;
    mergedOptions.onFocusChange?.(null);
  }, [mergedOptions]);

  const handleNodeClick = useCallback(
    (nodeId, node) => {
      if (mergedOptions.interaction.selectable !== false) {
        setSelectedId(nodeId);
      }
      mergedOptions.onNodeClick?.(nodeId, node);

      if (mergedOptions.detailMode === 'none') return;

      setDetailNode(node);
      setDetailOpen(true);
    },
    [mergedOptions]
  );

  const handleNodeDoubleClick = useCallback(
    (nodeId, node) => {
      mergedOptions.onNodeDoubleClick?.(nodeId, node);

      if (mergedOptions.focus?.enabled && mergedOptions.focus?.trigger === 'doubleClick') {
        const children = normalized.childrenMap.get(nodeId) ?? [];
        if (children.length > 0) {
          setFocus(nodeId);
        }
      }
    },
    [mergedOptions, normalized.childrenMap, setFocus]
  );

  const handleSearch = useCallback(
    (query) => {
      const q = String(query ?? '').trim().toLowerCase();
      if (!q) return null;

      for (const [nodeId, node] of normalized.nodes) {
        const name = String(getNodeValue(node, 'name', mergedOptions.keys) ?? '').toLowerCase();
        const role = String(getNodeValue(node, 'role', mergedOptions.keys) ?? '').toLowerCase();
        if (name.includes(q) || role.includes(q)) {
          setSelectedId(nodeId);
          collapse.expand(nodeId);
          centerView(nodeId);
          return nodeId;
        }
      }
      return null;
    },
    [normalized.nodes, mergedOptions.keys, collapse, centerView]
  );

  const handleToggleCollapse = useCallback(
    (nodeId) => {
      const visibleCount = layoutResult.positions.size;
      setAnimateBoard(visibleCount < (mergedOptions.performance.maxAnimatedNodes ?? 200));
      collapse.toggleCollapse(nodeId);
    },
    [layoutResult.positions.size, mergedOptions.performance.maxAnimatedNodes, collapse]
  );

  const imperativeApi = useMemo(
    () => ({
      zoomIn: panZoom.zoomIn,
      zoomOut: panZoom.zoomOut,
      resetZoom: panZoom.resetZoom,
      fit: fitView,
      centerOn: centerView,
      expand: collapse.expand,
      collapse: collapse.collapse,
      expandAll: () => {
        setAnimateBoard(true);
        collapse.expandAll();
      },
      collapseAll: () => {
        setAnimateBoard(false);
        collapse.collapseAll();
      },
      select: (nodeId) => {
        setSelectedId(nodeId);
        const node = normalized.nodes.get(nodeId);
        if (node) {
          setDetailNode(node);
          setDetailOpen(true);
        }
      },
      find: handleSearch,
      focus: setFocus,
      clearFocus,
      getTransform: panZoom.getTransform,
      setTransform: panZoom.setTransform,
    }),
    [
      panZoom,
      fitView,
      centerView,
      collapse,
      normalized.nodes,
      handleSearch,
      setFocus,
      clearFocus,
    ]
  );

  useImperativeHandle(mergedOptions.orgRef, () => imperativeApi, [imperativeApi]);

  const contextValue = useMemo(
    () => ({
      options: optionsWithMeasure,
      imperativeApi,
    }),
    [optionsWithMeasure, imperativeApi]
  );

  if (mergedOptions.loading) {
    return (
      <div
        id={id}
        className={cn(styles.organograma, styles.organograma_loading, className)}
        style={style}
      >
        Carregando organograma...
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div
        id={id}
        className={cn(styles.organograma, styles.organograma_empty, className)}
        style={style}
      >
        {mergedOptions.emptyState ?? 'Nenhum dado para exibir.'}
      </div>
    );
  }

  if (layoutResult.stub) {
    return (
      <div
        id={id}
        className={cn(styles.organograma, styles.organograma_empty, className)}
        style={style}
      >
        Visualização &quot;{mergedOptions.view}&quot; ainda não implementada.
      </div>
    );
  }

  return (
    <OrganogramaContext.Provider value={contextValue}>
      <div
        id={id}
        className={cn(styles.organograma, mergedOptions.className, className)}
        style={{ ...mergedOptions.style, ...style }}
      >
        <Board
          ref={containerRef}
          boardRef={panZoom.boardRef}
          bounds={layoutResult.bounds}
          groupBounds={groupsEnabled ? groupBounds : []}
          edges={visibleEdges}
          visibleNodeIds={visibleNodeIds}
          nodes={normalized.nodes}
          positions={layoutResult.positions}
          treeMeta={treeMeta}
          collapsedSet={collapse.collapsedSet}
          selectedId={selectedId}
          density={density}
          orientation={orientation}
          edgeConfig={mergedOptions.edge}
          groupsRender={mergedOptions.groups.render}
          autoSize={mergedOptions.autoSize !== false}
          registerNodeRef={nodeMeasure.registerNodeRef}
          focusedId={mergedOptions.focus?.showBreadcrumb !== false ? focusedId : null}
          parentMap={normalized.parentMap}
          keys={mergedOptions.keys}
          onFocusNavigate={setFocus}
          onFocusClear={clearFocus}
          showBreadcrumb={mergedOptions.focus?.showBreadcrumb !== false}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onToggleCollapse={handleToggleCollapse}
          animate={animateBoard}
        />

        {mergedOptions.detailMode === 'panel' && detailOpen && detailNode && (
          <DetailPanel
            node={detailNode}
            keys={mergedOptions.keys}
            detailFields={mergedOptions.detailFields}
            renderDetails={mergedOptions.renderDetails}
            onClose={() => setDetailOpen(false)}
          />
        )}

        {mergedOptions.detailMode === 'drawer' && (
          <DetailDrawer
            open={detailOpen && !!detailNode}
            node={detailNode}
            keys={mergedOptions.keys}
            detailFields={mergedOptions.detailFields}
            renderDetails={mergedOptions.renderDetails}
            onClose={() => setDetailOpen(false)}
          />
        )}

        <Toolbar
          config={mergedOptions.toolbar}
          displayScale={panZoom.displayScale}
          groupsEnabled={groupsEnabled}
          onZoomIn={panZoom.zoomIn}
          onZoomOut={panZoom.zoomOut}
          onResetZoom={panZoom.resetZoom}
          onFit={fitView}
          onCenter={() => centerView()}
          onExpandAll={imperativeApi.expandAll}
          onCollapseAll={imperativeApi.collapseAll}
          onToggleGroups={() => setInternalGroupsEnabled((v) => !v)}
          onSearch={handleSearch}
        />
      </div>
    </OrganogramaContext.Provider>
  );
};
