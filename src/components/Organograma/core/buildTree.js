/**
 * Constrói metadados da árvore: depth, directChildCount, descendantCount.
 * descendantCount usa pós-ordem iterativa (sem recursão).
 */
export function buildTreeMeta(roots, childrenMap, collapsedSet = new Set()) {
  const depthMap = new Map();
  const directChildCountMap = new Map();
  const descendantCountMap = new Map();
  const visibleChildrenMap = new Map();

  const stack = roots.map((id) => ({ id, depth: 0 }));
  const visited = new Set();

  while (stack.length > 0) {
    const { id, depth } = stack.pop();
    if (visited.has(id)) continue;
    visited.add(id);

    depthMap.set(id, depth);

    const allChildren = childrenMap.get(id) ?? [];
    directChildCountMap.set(id, allChildren.length);

    const isCollapsed = collapsedSet.has(id);
    const visibleChildren = isCollapsed ? [] : allChildren;
    visibleChildrenMap.set(id, visibleChildren);

    for (let i = visibleChildren.length - 1; i >= 0; i -= 1) {
      stack.push({ id: visibleChildren[i], depth: depth + 1 });
    }
  }

  const postOrder = [];
  const postStack = [...roots];
  const postVisited = new Set();

  while (postStack.length > 0) {
    const id = postStack[postStack.length - 1];
    if (postVisited.has(id)) {
      postStack.pop();
      postOrder.push(id);
      continue;
    }
    postVisited.add(id);
    const children = childrenMap.get(id) ?? [];
    for (let i = children.length - 1; i >= 0; i -= 1) {
      postStack.push(children[i]);
    }
  }

  for (const id of postOrder) {
    const children = childrenMap.get(id) ?? [];
    let total = children.length;
    for (const childId of children) {
      total += descendantCountMap.get(childId) ?? 0;
    }
    descendantCountMap.set(id, total);
  }

  return {
    depthMap,
    directChildCountMap,
    descendantCountMap,
    visibleChildrenMap,
  };
}

/**
 * Retorna conjunto de IDs visíveis considerando colapsos.
 */
export function getVisibleNodeIds(roots, childrenMap, collapsedSet = new Set()) {
  const visible = new Set();
  const stack = [...roots];

  while (stack.length > 0) {
    const id = stack.pop();
    if (visible.has(id)) continue;
    visible.add(id);

    if (collapsedSet.has(id)) continue;

    const children = childrenMap.get(id) ?? [];
    for (const childId of children) {
      stack.push(childId);
    }
  }

  return visible;
}

/**
 * Expande nós até uma profundidade padrão.
 */
export function getDefaultExpandedIds(roots, childrenMap, maxDepth = 2) {
  const expanded = new Set();
  const stack = roots.map((id) => ({ id, depth: 0 }));

  while (stack.length > 0) {
    const { id, depth } = stack.pop();
    if (depth < maxDepth) {
      expanded.add(id);
      const children = childrenMap.get(id) ?? [];
      for (const childId of children) {
        stack.push({ id: childId, depth: depth + 1 });
      }
    }
  }

  return expanded;
}
