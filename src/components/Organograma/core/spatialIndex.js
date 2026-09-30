/**
 * Índice espacial em grid uniforme para culling O(k).
 */

export function createSpatialIndex(positions, cellSize = 400) {
  const buckets = new Map();

  for (const [id, pos] of positions) {
    const minCellX = Math.floor(pos.x / cellSize);
    const maxCellX = Math.floor((pos.x + pos.width) / cellSize);
    const minCellY = Math.floor(pos.y / cellSize);
    const maxCellY = Math.floor((pos.y + pos.height) / cellSize);

    for (let cx = minCellX; cx <= maxCellX; cx += 1) {
      for (let cy = minCellY; cy <= maxCellY; cy += 1) {
        const key = `${cx},${cy}`;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(id);
      }
    }
  }

  return { buckets, cellSize };
}

export function querySpatialIndex(index, viewport, margin = 400) {
  const { buckets, cellSize } = index;
  const { x, y, width, height } = viewport;

  const minX = x - margin;
  const minY = y - margin;
  const maxX = x + width + margin;
  const maxY = y + height + margin;

  const minCellX = Math.floor(minX / cellSize);
  const maxCellX = Math.floor(maxX / cellSize);
  const minCellY = Math.floor(minY / cellSize);
  const maxCellY = Math.floor(maxY / cellSize);

  const result = new Set();

  for (let cx = minCellX; cx <= maxCellX; cx += 1) {
    for (let cy = minCellY; cy <= maxCellY; cy += 1) {
      const key = `${cx},${cy}`;
      const ids = buckets.get(key);
      if (!ids) continue;
      for (const id of ids) {
        result.add(id);
      }
    }
  }

  return result;
}

export function filterVisibleNodes(candidateIds, positions, viewport, margin = 400) {
  const { x, y, width, height } = viewport;
  const minX = x - margin;
  const minY = y - margin;
  const maxX = x + width + margin;
  const maxY = y + height + margin;

  const visible = [];
  for (const id of candidateIds) {
    const pos = positions.get(id);
    if (!pos) continue;
    const nodeMaxX = pos.x + pos.width;
    const nodeMaxY = pos.y + pos.height;
    if (nodeMaxX >= minX && pos.x <= maxX && nodeMaxY >= minY && pos.y <= maxY) {
      visible.push(id);
    }
  }
  return visible;
}
