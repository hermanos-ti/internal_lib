import { useMemo, useRef, useState, useCallback, useEffect } from 'react';

import { querySpatialIndex, filterVisibleNodes } from '../core/spatialIndex.js';

import { cullEdgeSegments } from '../core/computeEdges.js';

import { getLodLevel } from '../core/viewportMath.js';



function arraysEqual(a, b) {

  if (a === b) return true;

  if (!a || !b || a.length !== b.length) return false;

  for (let i = 0; i < a.length; i += 1) {

    if (a[i] !== b[i]) return false;

  }

  return true;

}



export function useViewportCulling({

  spatialIndex,

  positions,

  edges,

  enabled = true,

  margin = 400,

  scale = 1,

  lodThreshold = 0.55,

  minimalThreshold = 0.3,

  getViewport,

}) {

  const bucketRef = useRef({ minCellX: 0, maxCellX: 0, minCellY: 0, maxCellY: 0, scale: 1 });

  const inputsRef = useRef({ positions: null, edges: null });

  const [visibleNodeIds, setVisibleNodeIds] = useState([]);

  const [visibleEdges, setVisibleEdges] = useState([]);



  const lod = useMemo(

    () => getLodLevel(scale, lodThreshold, minimalThreshold),

    [scale, lodThreshold, minimalThreshold]

  );



  const updateCulling = useCallback(() => {

    if (!enabled) {

      const allIds = [...positions.keys()];

      setVisibleNodeIds((prev) => (arraysEqual(prev, allIds) ? prev : allIds));

      setVisibleEdges((prev) => (prev === edges ? prev : edges));

      inputsRef.current = { positions, edges };

      return;

    }



    const viewport = getViewport();

    const { cellSize } = spatialIndex;

    const minCellX = Math.floor((viewport.x - margin) / cellSize);

    const maxCellX = Math.floor((viewport.x + viewport.width + margin) / cellSize);

    const minCellY = Math.floor((viewport.y - margin) / cellSize);

    const maxCellY = Math.floor((viewport.y + viewport.height + margin) / cellSize);



    const inputsChanged =

      inputsRef.current.positions !== positions || inputsRef.current.edges !== edges;



    const prev = bucketRef.current;

    const sameBuckets =

      prev.minCellX === minCellX &&

      prev.maxCellX === maxCellX &&

      prev.minCellY === minCellY &&

      prev.maxCellY === maxCellY &&

      prev.scale === scale;



    if (!inputsChanged && sameBuckets) {

      return;

    }



    bucketRef.current = { minCellX, maxCellX, minCellY, maxCellY, scale };

    inputsRef.current = { positions, edges };



    const candidates = querySpatialIndex(spatialIndex, viewport, margin);

    const visible = filterVisibleNodes(candidates, positions, viewport, margin);

    const nextEdges = cullEdgeSegments(edges, viewport, margin);



    setVisibleNodeIds((prev) => (arraysEqual(prev, visible) ? prev : visible));

    setVisibleEdges((prev) => (prev === nextEdges ? prev : nextEdges));

  }, [enabled, spatialIndex, positions, edges, margin, getViewport, scale]);



  useEffect(() => {

    updateCulling();

  }, [updateCulling]);



  return {

    visibleNodeIds,

    visibleEdges,

    lod,

    updateCulling,

  };

}


