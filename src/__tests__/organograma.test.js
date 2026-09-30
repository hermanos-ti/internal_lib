import { describe, it, expect } from 'vitest';
import { normalizeData, getNodeValue } from '../components/Organograma/core/normalizeData.js';
import {
  buildTreeMeta,
  getVisibleNodeIds,
  getDefaultExpandedIds,
} from '../components/Organograma/core/buildTree.js';
import { layoutTree } from '../components/Organograma/core/layoutTree.js';
import { computeEdgeSegments } from '../components/Organograma/core/computeEdges.js';
import { getNodeStackZ } from '../components/Organograma/core/nodeStackZ.js';
import {
  resolveFallbackSize,
  getDefaultNodeSizeForView,
  DEFAULT_NODE_SIZES,
} from '../components/Organograma/core/nodeSizing.js';
import {
  createSpatialIndex,
  querySpatialIndex,
  filterVisibleNodes,
} from '../components/Organograma/core/spatialIndex.js';
import {
  computeGroupBounds,
  hashString,
  colorFromPalette,
} from '../components/Organograma/core/groupBounds.js';
import {
  fitToView,
  centerOnNode,
  getLodLevel,
  clamp,
} from '../components/Organograma/core/viewportMath.js';

const flatData = [
  { id: '1', name: 'CEO', parentId: null, department: 'Diretoria' },
  { id: '2', name: 'CTO', parentId: '1', department: 'Tech' },
  { id: '3', name: 'CFO', parentId: '1', department: 'Finance' },
  { id: '4', name: 'Dev 1', parentId: '2', department: 'Tech' },
  { id: '5', name: 'Dev 2', parentId: '2', department: 'Tech' },
];

const nestedData = [
  {
    id: '1',
    name: 'CEO',
    department: 'Diretoria',
    children: [
      {
        id: '2',
        name: 'CTO',
        department: 'Tech',
        children: [{ id: '4', name: 'Dev 1', department: 'Tech' }],
      },
      { id: '3', name: 'CFO', department: 'Finance' },
    ],
  },
];

function buildLeafCluster(size) {
  const data = [{ id: 'root', name: 'Root', parentId: null }];
  for (let i = 1; i <= size; i += 1) {
    data.push({ id: `leaf-${i}`, name: `Leaf ${i}`, parentId: 'root' });
  }
  return data;
}

describe('normalizeData', () => {
  it('should normalize flat data with parentId', () => {
    const result = normalizeData(flatData);
    expect(result.nodes.size).toBe(5);
    expect(result.roots).toEqual(['1']);
    expect(result.childrenMap.get('1')).toEqual(['2', '3']);
    expect(result.childrenMap.get('2')).toEqual(['4', '5']);
  });

  it('should normalize nested data with children', () => {
    const result = normalizeData(nestedData);
    expect(result.nodes.size).toBe(4);
    expect(result.roots).toEqual(['1']);
    expect(result.parentMap.get('4')).toBe('2');
  });

  it('should read node values via keys mapping', () => {
    const node = { id: 'x', nome: 'Ana' };
    expect(getNodeValue(node, 'name', { name: 'nome' })).toBe('Ana');
  });
});

describe('buildTree', () => {
  it('should compute descendant counts in post-order', () => {
    const { roots, childrenMap } = normalizeData(flatData);
    const meta = buildTreeMeta(roots, childrenMap);
    expect(meta.directChildCountMap.get('1')).toBe(2);
    expect(meta.descendantCountMap.get('1')).toBe(4);
    expect(meta.descendantCountMap.get('2')).toBe(2);
    expect(meta.descendantCountMap.get('5')).toBe(0);
  });

  it('should respect collapsed nodes for visibility', () => {
    const { roots, childrenMap } = normalizeData(flatData);
    const collapsed = new Set(['1']);
    const visible = getVisibleNodeIds(roots, childrenMap, collapsed);
    expect([...visible]).toEqual(['1']);
  });

  it('should expand nodes up to default depth', () => {
    const { roots, childrenMap } = normalizeData(flatData);
    const expanded = getDefaultExpandedIds(roots, childrenMap, 2);
    expect(expanded.has('1')).toBe(true);
    expect(expanded.has('2')).toBe(true);
    expect(expanded.has('4')).toBe(false);
  });
});

describe('layoutTree', () => {
  it('should assign positions without overlap for siblings', () => {
    const { roots, childrenMap } = normalizeData(flatData);
    const visibleIds = new Set(['1', '2', '3', '4', '5']);
    const { positions } = layoutTree({
      roots,
      childrenMap,
      visibleIds,
      nodeSize: { width: 260, height: 88 },
      spacing: { sibling: 24, level: 72 },
    });

    expect(positions.size).toBe(5);
    const p2 = positions.get('2');
    const p3 = positions.get('3');
    expect(p2.y).toBe(p3.y);
    expect(p2.x).not.toBe(p3.x);
    expect(p2.x + 260 + 24).toBeLessThanOrEqual(p3.x + 1);
  });

  it('should preserve real card dimensions in horizontal orientation', () => {
    const { roots, childrenMap } = normalizeData(flatData);
    const visibleIds = new Set(['1', '2', '3']);
    const { positions } = layoutTree({
      roots,
      childrenMap,
      visibleIds,
      nodeSize: { width: 260, height: 88 },
      orientation: 'horizontal',
    });

    for (const pos of positions.values()) {
      expect(pos.width).toBe(260);
      expect(pos.height).toBe(88);
    }
  });

  it('should layout only focused subtree when roots are narrowed', () => {
    const { roots, childrenMap } = normalizeData(flatData);
    const visibleIds = new Set(['2', '4', '5']);
    const { positions } = layoutTree({
      roots: ['2'],
      childrenMap,
      visibleIds,
    });

    expect(positions.has('1')).toBe(false);
    expect(positions.has('3')).toBe(false);
    expect(positions.size).toBe(3);
  });

  it('should compact leaf clusters into a grid', () => {
    const data = buildLeafCluster(12);
    const { roots, childrenMap } = normalizeData(data);
    const visibleIds = new Set(data.map((d) => d.id));
    const lineLayout = layoutTree({
      roots,
      childrenMap,
      visibleIds,
      nodeSize: { width: 200, height: 80 },
      spacing: { sibling: 20, level: 60 },
      compact: { enabled: false },
    });
    const gridLayout = layoutTree({
      roots,
      childrenMap,
      visibleIds,
      nodeSize: { width: 200, height: 80 },
      spacing: { sibling: 20, level: 60 },
      compact: { enabled: true, leafThreshold: 6, maxColumns: 4, columnGap: 16, rowGap: 12 },
    });

    expect(gridLayout.bounds.width).toBeLessThan(lineLayout.bounds.width);
  });

  it('should be deterministic for same input', () => {
    const { roots, childrenMap } = normalizeData(flatData);
    const visibleIds = new Set(['1', '2', '3']);
    const a = layoutTree({ roots, childrenMap, visibleIds });
    const b = layoutTree({ roots, childrenMap, visibleIds });
    expect(a.positions.get('2').x).toBe(b.positions.get('2').x);
  });
});

describe('nodeSizing', () => {
  it('should resolve fallback sizes by orientation and density', () => {
    expect(resolveFallbackSize('vertical', 'full', { width: 200, height: 160 })).toEqual({
      width: 200,
      height: 160,
    });
    expect(resolveFallbackSize('vertical', 'minimal')).toEqual(DEFAULT_NODE_SIZES.vertical.minimal);
    expect(resolveFallbackSize('horizontal', 'compact')).toEqual(DEFAULT_NODE_SIZES.horizontal.compact);
  });

  it('should derive default node size from view', () => {
    expect(getDefaultNodeSizeForView('tree')).toEqual(DEFAULT_NODE_SIZES.vertical.full);
    expect(getDefaultNodeSizeForView('treeHorizontal')).toEqual(DEFAULT_NODE_SIZES.horizontal.full);
  });

  it('should produce smaller layout bounds for minimal density sizes', () => {
    const { roots, childrenMap } = normalizeData(flatData);
    const visibleIds = new Set(['1', '2', '3', '4', '5']);
    const minimalSize = resolveFallbackSize('vertical', 'minimal');
    const fullSize = resolveFallbackSize('vertical', 'full');

    const fullLayout = layoutTree({
      roots,
      childrenMap,
      visibleIds,
      nodeSize: fullSize,
      nodeSizeOf: () => fullSize,
    });
    const minimalLayout = layoutTree({
      roots,
      childrenMap,
      visibleIds,
      nodeSize: minimalSize,
      nodeSizeOf: () => minimalSize,
    });

    expect(minimalLayout.bounds.width).toBeLessThan(fullLayout.bounds.width);
    expect(minimalLayout.bounds.height).toBeLessThan(fullLayout.bounds.height);
    for (const pos of minimalLayout.positions.values()) {
      expect(pos.width).toBe(52);
      expect(pos.height).toBe(52);
    }
  });
});

describe('computeEdgeSegments', () => {
  it('should generate CSS segments for visible parent-child pairs', () => {
    const { nodes, roots, childrenMap } = normalizeData(flatData);
    const visibleIds = new Set(['1', '2', '3']);
    const { positions } = layoutTree({ roots, childrenMap, visibleIds });
    const segments = computeEdgeSegments({
      visibleIds,
      childrenMap,
      positions,
      nodes,
    });
    expect(segments.length).toBeGreaterThan(0);
    expect(segments.some((s) => s.type === 'line-v' || s.type === 'elbow' || s.type === 'line-h')).toBe(true);
  });

  it('should create drop segments for aligned parent and child', () => {
    const positions = new Map([
      ['1', { x: 100, y: 0, width: 260, height: 88 }],
      ['2', { x: 100, y: 200, width: 260, height: 88 }],
    ]);
    const childrenMap = new Map([['1', ['2']]]);
    const visibleIds = new Set(['1', '2']);
    const segments = computeEdgeSegments({
      visibleIds,
      childrenMap,
      positions,
      nodes: new Map(),
    });
    expect(segments.some((s) => s.type === 'line-v' && s.id.includes('drop'))).toBe(true);
  });

  it('should create bridge and drop segments for offset child', () => {
    const positions = new Map([
      ['1', { x: 0, y: 0, width: 260, height: 88 }],
      ['2', { x: 400, y: 200, width: 260, height: 88 }],
    ]);
    const childrenMap = new Map([['1', ['2']]]);
    const visibleIds = new Set(['1', '2']);
    const segments = computeEdgeSegments({
      visibleIds,
      childrenMap,
      positions,
      nodes: new Map(),
    });
    expect(segments.some((s) => s.type === 'line-h' && s.id.includes('bridge'))).toBe(true);
    expect(segments.some((s) => s.type === 'line-v' && s.id.includes('drop'))).toBe(true);
    expect(segments.some((s) => s.type === 'elbow')).toBe(false);
  });

  it('should use bus and drops for multiple children without elbows', () => {
    const positions = new Map([
      ['1', { x: 200, y: 0, width: 260, height: 88 }],
      ['2', { x: 0, y: 200, width: 260, height: 88 }],
      ['3', { x: 400, y: 200, width: 260, height: 88 }],
    ]);
    const childrenMap = new Map([['1', ['2', '3']]]);
    const visibleIds = new Set(['1', '2', '3']);
    const segments = computeEdgeSegments({
      visibleIds,
      childrenMap,
      positions,
      nodes: new Map(),
    });
    expect(segments.some((s) => s.type === 'line-h' && s.id.includes('bus'))).toBe(true);
    expect(segments.filter((s) => s.type === 'line-v' && s.id.includes('drop')).length).toBe(2);
    expect(segments.some((s) => s.type === 'elbow')).toBe(false);
  });
});

describe('spatialIndex', () => {
  it('should query nodes in viewport', () => {
    const { roots, childrenMap } = normalizeData(flatData);
    const visibleIds = new Set(['1', '2', '3', '4', '5']);
    const { positions } = layoutTree({ roots, childrenMap, visibleIds });
    const index = createSpatialIndex(positions, 400);
    const viewport = { x: 0, y: 0, width: 2000, height: 2000 };
    const candidates = querySpatialIndex(index, viewport, 0);
    const visible = filterVisibleNodes(candidates, positions, viewport, 0);
    expect(visible.length).toBe(5);
  });
});

describe('groupBounds', () => {
  it('should compute group bounding boxes', () => {
    const { nodes, roots, childrenMap } = normalizeData(flatData);
    const visibleIds = new Set(['1', '2', '3', '4', '5']);
    const { positions } = layoutTree({ roots, childrenMap, visibleIds });
    const groups = computeGroupBounds({
      visibleIds,
      positions,
      nodes,
      groupKey: 'department',
    });
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].width).toBeGreaterThan(0);
    expect(groups[0].height).toBeGreaterThan(0);
  });

  it('should produce deterministic colors from palette', () => {
    const c1 = colorFromPalette('Tech', ['#aaa', '#bbb', '#ccc']);
    const c2 = colorFromPalette('Tech', ['#aaa', '#bbb', '#ccc']);
    expect(c1).toBe(c2);
    expect(hashString('Tech')).toBeGreaterThan(0);
  });
});

describe('getNodeStackZ', () => {
  it('should prioritize cards higher on screen', () => {
    const upper = getNodeStackZ({ x: 0, y: 100 });
    const lower = getNodeStackZ({ x: 0, y: 300 });
    expect(upper).toBeGreaterThan(lower);
  });

  it('should boost collapsed nodes with children', () => {
    const collapsed = getNodeStackZ(
      { x: 0, y: 200 },
      { collapsed: true, hasChildren: true }
    );
    const expanded = getNodeStackZ({ x: 0, y: 200 });
    expect(collapsed).toBeGreaterThan(expanded);
  });
});

describe('viewportMath', () => {
  it('should clamp values', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });

  it('should compute LOD levels from scale', () => {
    expect(getLodLevel(1)).toBe('full');
    expect(getLodLevel(0.4)).toBe('compact');
    expect(getLodLevel(0.2)).toBe('minimal');
  });

  it('should fit bounds into container', () => {
    const bounds = { minX: 0, minY: 0, maxX: 1000, maxY: 800, width: 1000, height: 800 };
    const result = fitToView(bounds, { width: 800, height: 600 }, 48);
    expect(result.scale).toBeGreaterThan(0);
    expect(result.scale).toBeLessThanOrEqual(1);
  });

  it('should center on a node', () => {
    const result = centerOnNode({ x: 100, y: 200, width: 260, height: 88 }, { width: 800, height: 600 }, 1);
    expect(result.x).toBeDefined();
    expect(result.y).toBeDefined();
  });
});
