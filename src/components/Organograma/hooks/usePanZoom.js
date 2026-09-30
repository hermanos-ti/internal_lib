import { useCallback, useEffect, useRef, useState } from 'react';
import { getBoardViewport, zoomAtPoint, clamp } from '../core/viewportMath.js';
import styles from '../Organograma.module.css';

const IDLE_MS = 180;

function applyTransform(boardEl, containerEl, transform) {
  if (boardEl) {
    boardEl.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
    boardEl.style.setProperty('--org-scale', String(transform.scale));
  }
  if (containerEl) {
    containerEl.style.setProperty('--org-grid-offset-x', `${transform.x}px`);
    containerEl.style.setProperty('--org-grid-offset-y', `${transform.y}px`);
  }
}

export function usePanZoom({
  enabled = true,
  panEnabled = true,
  zoomEnabled = true,
  zoomRange = [0.2, 2],
  zoomStep = 0.15,
  containerRef,
  onTransformChange,
}) {
  const transformRef = useRef({ x: 0, y: 0, scale: 1 });
  const boardRef = useRef(null);
  const rafRef = useRef(null);
  const idleTimerRef = useRef(null);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const [displayScale, setDisplayScale] = useState(1);

  const markInteracting = useCallback(() => {
    const board = boardRef.current;
    if (board) {
      board.classList.add(styles.board_interacting);
    }
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      boardRef.current?.classList.remove(styles.board_interacting);
    }, IDLE_MS);
  }, []);

  const scheduleTransform = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      applyTransform(boardRef.current, containerRef.current, transformRef.current);
      onTransformChange?.(transformRef.current);
    });
  }, [containerRef, onTransformChange]);

  const setTransform = useCallback(
    (next, { notifyScale = true, interacting = false } = {}) => {
      transformRef.current = {
        x: next.x,
        y: next.y,
        scale: clamp(next.scale, zoomRange[0], zoomRange[1]),
      };
      if (interacting) {
        markInteracting();
      }
      scheduleTransform();
      if (notifyScale) {
        setDisplayScale((prev) =>
          prev === transformRef.current.scale ? prev : transformRef.current.scale
        );
      }
    },
    [zoomRange, scheduleTransform, markInteracting]
  );

  const getTransform = useCallback(() => ({ ...transformRef.current }), []);

  const zoomIn = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const point = { x: rect.width / 2, y: rect.height / 2 };
    markInteracting();
    setTransform(zoomAtPoint(transformRef.current, zoomStep, point, zoomRange));
  }, [containerRef, setTransform, zoomStep, zoomRange, markInteracting]);

  const zoomOut = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const point = { x: rect.width / 2, y: rect.height / 2 };
    markInteracting();
    setTransform(zoomAtPoint(transformRef.current, -zoomStep, point, zoomRange));
  }, [containerRef, setTransform, zoomStep, zoomRange, markInteracting]);

  const resetZoom = useCallback(() => {
    setTransform({ ...transformRef.current, scale: 1 });
  }, [setTransform]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return undefined;

    const onWheel = (e) => {
      if (!zoomEnabled) return;
      e.preventDefault();
      markInteracting();
      const rect = container.getBoundingClientRect();
      const point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const delta = e.deltaY < 0 ? zoomStep : -zoomStep;
      setTransform(zoomAtPoint(transformRef.current, delta, point, zoomRange), {
        notifyScale: true,
        interacting: true,
      });
    };

    const onPointerDown = (e) => {
      if (!panEnabled || e.button !== 0) return;
      if (e.target.closest('[data-org-node]')) return;
      draggingRef.current = true;
      markInteracting();
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      container.setPointerCapture?.(e.pointerId);
      container.style.cursor = 'grabbing';
    };

    const onPointerMove = (e) => {
      if (!draggingRef.current) return;
      markInteracting();
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      const t = transformRef.current;
      setTransform({ x: t.x + dx, y: t.y + dy, scale: t.scale }, { notifyScale: false, interacting: true });
    };

    const onPointerUp = (e) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      container.releasePointerCapture?.(e.pointerId);
      container.style.cursor = '';
      onTransformChange?.(transformRef.current);
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [
    containerRef,
    enabled,
    panEnabled,
    zoomEnabled,
    zoomRange,
    zoomStep,
    setTransform,
    onTransformChange,
    markInteracting,
  ]);

  useEffect(() => {
    applyTransform(boardRef.current, containerRef.current, transformRef.current);
  }, [containerRef]);

  const getViewport = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0, width: 0, height: 0 };
    const { width, height } = container.getBoundingClientRect();
    return getBoardViewport({ width, height }, transformRef.current);
  }, [containerRef]);

  return {
    boardRef,
    getTransform,
    setTransform,
    getViewport,
    zoomIn,
    zoomOut,
    resetZoom,
    displayScale,
  };
}
