import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveFallbackSize } from '../core/nodeSizing.js';

function roundSize(value) {
  return Math.round(value);
}

function modeSize(sizes) {
  if (sizes.length === 0) return null;
  const freq = new Map();
  for (const s of sizes) {
    const key = `${s.width}x${s.height}`;
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  let bestKey = null;
  let bestCount = -1;
  for (const [key, count] of freq) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }
  const [w, h] = bestKey.split('x').map(Number);
  return { width: w, height: h };
}

function measureSignature(map) {
  const parts = [];
  for (const [id, size] of map) {
    parts.push(`${id}:${size.width}x${size.height}`);
  }
  parts.sort();
  return parts.join('|');
}

function disconnectAll(observersRef) {
  for (const entry of observersRef.current.values()) {
    entry.observer?.disconnect();
  }
  observersRef.current.clear();
}

function getDensityMap(measuresRef, density) {
  if (!measuresRef.current.has(density)) {
    measuresRef.current.set(density, new Map());
  }
  return measuresRef.current.get(density);
}

export function useNodeMeasure({
  enabled = true,
  density = 'full',
  orientation = 'vertical',
  defaultSize = { width: 180, height: 172 },
  maxIterations = 1,
}) {
  const measuresRef = useRef(new Map());
  const [measureVersion, setMeasureVersion] = useState(0);
  const iterationRef = useRef(new Map());
  const pendingRef = useRef(null);
  const observersRef = useRef(new Map());
  const signatureRef = useRef(new Map());
  const stabilizedRef = useRef(new Set());
  const densityRef = useRef(density);
  const orientationRef = useRef(orientation);
  const defaultSizeRef = useRef(defaultSize);

  densityRef.current = density;
  orientationRef.current = orientation;
  defaultSizeRef.current = defaultSize;

  const scheduleUpdate = useCallback(() => {
    const currentDensity = densityRef.current;
    if (pendingRef.current || stabilizedRef.current.has(currentDensity)) return;

    pendingRef.current = requestAnimationFrame(() => {
      pendingRef.current = null;
      const d = densityRef.current;
      const iteration = iterationRef.current.get(d) ?? 0;

      if (stabilizedRef.current.has(d) || iteration >= maxIterations) {
        stabilizedRef.current.add(d);
        for (const [key, entry] of [...observersRef.current.entries()]) {
          if (entry.density === d) {
            entry.observer?.disconnect();
            observersRef.current.delete(key);
          }
        }
        return;
      }

      const densityMap = getDensityMap(measuresRef, d);
      const nextSignature = measureSignature(densityMap);
      const prevSignature = signatureRef.current.get(d) ?? '';

      if (nextSignature === prevSignature) return;

      signatureRef.current.set(d, nextSignature);
      iterationRef.current.set(d, iteration + 1);
      setMeasureVersion((v) => v + 1);

      if (iteration + 1 >= maxIterations) {
        stabilizedRef.current.add(d);
        for (const [key, entry] of [...observersRef.current.entries()]) {
          if (entry.density === d) {
            entry.observer?.disconnect();
            observersRef.current.delete(key);
          }
        }
      }
    });
  }, [maxIterations]);

  const registerNodeRef = useCallback(
    (nodeId, el) => {
      const d = densityRef.current;
      if (!enabled || stabilizedRef.current.has(d) || nodeId == null) return;

      const observerKey = `${d}:${nodeId}`;
      const existing = observersRef.current.get(observerKey);
      if (existing?.el === el) return;

      existing?.observer?.disconnect();
      observersRef.current.delete(observerKey);

      if (!el) return;

      const observer = new ResizeObserver((entries) => {
        if (stabilizedRef.current.has(densityRef.current)) return;

        const entry = entries[0];
        if (!entry) return;

        const width = roundSize(entry.contentRect.width);
        const height = roundSize(entry.contentRect.height);
        if (width < 1 || height < 1) return;

        const densityMap = getDensityMap(measuresRef, densityRef.current);
        const prev = densityMap.get(nodeId);
        const changed =
          !prev || Math.abs(prev.width - width) > 2 || Math.abs(prev.height - height) > 2;

        if (changed) {
          densityMap.set(nodeId, { width, height });
          scheduleUpdate();
        }
      });

      observer.observe(el);
      observersRef.current.set(observerKey, { el, observer, density: d });
    },
    [enabled, scheduleUpdate, density]
  );

  useEffect(() => {
    for (const [key, entry] of [...observersRef.current.entries()]) {
      if (entry.density !== density) {
        entry.observer?.disconnect();
        observersRef.current.delete(key);
      }
    }
  }, [density]);

  const resetIterations = useCallback(() => {
    iterationRef.current.clear();
    stabilizedRef.current.clear();
    signatureRef.current.clear();
    measuresRef.current.clear();
    disconnectAll(observersRef);
  }, []);

  const nodeSizeOf = useCallback(
    (id) => {
      const d = densityRef.current;
      const densityMap = getDensityMap(measuresRef, d);
      const measured = densityMap.get(id);
      if (measured) return measured;

      const all = [...densityMap.values()];
      const moda = modeSize(all);
      return (
        moda ??
        resolveFallbackSize(orientationRef.current, d, defaultSizeRef.current)
      );
    },
    []
  );

  return {
    registerNodeRef,
    nodeSizeOf,
    measureVersion,
    resetIterations,
  };
}
