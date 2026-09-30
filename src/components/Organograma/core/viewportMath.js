/**
 * Utilitários de viewport: fit, center, clamp de zoom.
 */

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getLodLevel(scale, lodThreshold = 0.55, minimalThreshold = 0.3) {
  if (scale < minimalThreshold) return 'minimal';
  if (scale < lodThreshold) return 'compact';
  return 'full';
}

/**
 * Calcula transform para enquadrar bounds no container.
 */
export function fitToView(bounds, containerSize, padding = 48, zoomRange = [0.2, 2]) {
  const { width: contentW, height: contentH, minX, minY } = bounds;
  const { width: containerW, height: containerH } = containerSize;

  if (contentW <= 0 || contentH <= 0 || containerW <= 0 || containerH <= 0) {
    return { x: padding, y: padding, scale: 1 };
  }

  const scaleX = (containerW - padding * 2) / contentW;
  const scaleY = (containerH - padding * 2) / contentH;
  const scale = clamp(Math.min(scaleX, scaleY), zoomRange[0], zoomRange[1]);

  const x = (containerW - contentW * scale) / 2 - minX * scale;
  const y = (containerH - contentH * scale) / 2 - minY * scale;

  return { x, y, scale };
}

/**
 * Centraliza um nó específico no container.
 */
export function centerOnNode(nodePos, containerSize, scale = 1) {
  const { width: containerW, height: containerH } = containerSize;
  const centerX = nodePos.x + nodePos.width / 2;
  const centerY = nodePos.y + nodePos.height / 2;

  return {
    x: containerW / 2 - centerX * scale,
    y: containerH / 2 - centerY * scale,
    scale,
  };
}

/**
 * Converte coordenadas de tela para coordenadas do board.
 */
export function screenToBoard(screenX, screenY, transform) {
  const { x, y, scale } = transform;
  return {
    x: (screenX - x) / scale,
    y: (screenY - y) / scale,
  };
}

/**
 * Calcula viewport visível em coordenadas do board.
 */
export function getBoardViewport(containerSize, transform) {
  const { x, y, scale } = transform;
  const { width, height } = containerSize;

  return {
    x: -x / scale,
    y: -y / scale,
    width: width / scale,
    height: height / scale,
  };
}

export function zoomAtPoint(transform, delta, point, zoomRange = [0.2, 2]) {
  const newScale = clamp(transform.scale + delta, zoomRange[0], zoomRange[1]);
  const scaleRatio = newScale / transform.scale;

  const newX = point.x - (point.x - transform.x) * scaleRatio;
  const newY = point.y - (point.y - transform.y) * scaleRatio;

  return { x: newX, y: newY, scale: newScale };
}
