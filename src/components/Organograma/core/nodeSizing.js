export const DEFAULT_NODE_SIZES = {
  vertical: {
    full: { width: 180, height: 172 },
    compact: { width: 148, height: 132 },
    minimal: { width: 52, height: 52 },
  },
  horizontal: {
    full: { width: 260, height: 88 },
    compact: { width: 200, height: 72 },
    minimal: { width: 52, height: 52 },
  },
};

export function resolveFallbackSize(orientation, density, nodeSize) {
  if (density === 'full' && nodeSize) {
    return {
      width: nodeSize.width ?? DEFAULT_NODE_SIZES.vertical.full.width,
      height: nodeSize.height ?? DEFAULT_NODE_SIZES.vertical.full.height,
    };
  }

  return (
    DEFAULT_NODE_SIZES[orientation]?.[density] ??
    DEFAULT_NODE_SIZES.vertical.full
  );
}

export function getDefaultNodeSizeForView(view) {
  const orientation = view === 'treeHorizontal' ? 'horizontal' : 'vertical';
  return { ...DEFAULT_NODE_SIZES[orientation].full };
}
