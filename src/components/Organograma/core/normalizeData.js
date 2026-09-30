/**
 * Normaliza dados flat (parentId) ou nested (children) em estrutura indexada O(n).
 * @param {Array<object>} data
 * @param {object} keys
 * @returns {{ nodes: Map<string|number, object>, roots: Array<string|number>, childrenMap: Map<string|number, Array<string|number>>, parentMap: Map<string|number, string|number|null> }}
 */
export function normalizeData(data = [], keys = {}) {
  const idKey = keys.id ?? 'id';
  const parentIdKey = keys.parentId ?? 'parentId';
  const childrenKey = keys.children ?? 'children';

  const nodes = new Map();
  const childrenMap = new Map();
  const parentMap = new Map();

  const isNested = data.some((item) => Array.isArray(item?.[childrenKey]) && item[childrenKey].length > 0);

  if (isNested) {
    const walk = (items, parentId = null) => {
      for (const item of items) {
        const id = item[idKey];
        if (id == null) continue;

        nodes.set(id, item);
        parentMap.set(id, parentId);

        const childItems = item[childrenKey] ?? [];
        const childIds = childItems.map((c) => c[idKey]).filter((cid) => cid != null);
        childrenMap.set(id, childIds);

        if (childItems.length > 0) {
          walk(childItems, id);
        }
      }
    };
    walk(data);
  } else {
    for (const item of data) {
      const id = item[idKey];
      if (id == null) continue;
      nodes.set(id, item);
      childrenMap.set(id, []);
      parentMap.set(id, item[parentIdKey] ?? null);
    }

    for (const item of data) {
      const id = item[idKey];
      const parentId = item[parentIdKey] ?? null;
      if (parentId != null && nodes.has(parentId)) {
        const siblings = childrenMap.get(parentId) ?? [];
        siblings.push(id);
        childrenMap.set(parentId, siblings);
      }
    }
  }

  const roots = [];
  for (const [id, parentId] of parentMap) {
    if (parentId == null || !nodes.has(parentId)) {
      roots.push(id);
    }
  }

  if (roots.length === 0 && nodes.size > 0) {
    roots.push(nodes.keys().next().value);
  }

  return { nodes, roots, childrenMap, parentMap };
}

/**
 * Retorna valor de um nó usando a chave configurada.
 */
export function getNodeValue(node, key, keys = {}) {
  if (!node || !key) return undefined;
  const mappedKey = keys[key] ?? key;
  return node[mappedKey];
}
