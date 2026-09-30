import { getDefaultNodeSizeForView } from './core/nodeSizing.js';

export const DEFAULT_KEYS = {
  id: 'id',
  parentId: 'parentId',
  children: 'children',
  name: 'name',
  role: 'role',
  department: 'department',
  photo: 'photo',
  group: 'department',
};

export const GROUP_COLOR_PALETTE = [
  'rgba(79, 70, 229, 0.12)',
  'rgba(16, 185, 129, 0.12)',
  'rgba(245, 158, 11, 0.12)',
  'rgba(219, 39, 119, 0.12)',
  'rgba(124, 58, 237, 0.12)',
  'rgba(14, 165, 233, 0.12)',
  'rgba(234, 88, 12, 0.12)',
  'rgba(20, 184, 166, 0.12)',
];

export const GROUP_BORDER_PALETTE = [
  'rgba(79, 70, 229, 0.35)',
  'rgba(16, 185, 129, 0.35)',
  'rgba(245, 158, 11, 0.35)',
  'rgba(219, 39, 119, 0.35)',
  'rgba(124, 58, 237, 0.35)',
  'rgba(14, 165, 233, 0.35)',
  'rgba(234, 88, 12, 0.35)',
  'rgba(20, 184, 166, 0.35)',
];

export const DEFAULT_DETAIL_FIELDS = [
  { key: 'email', label: 'E-mail' },
  { key: 'phone', label: 'Telefone' },
  { key: 'location', label: 'Localização' },
];

export const DEFAULT_OPTIONS = {
  view: 'tree',
  additionalViews: [],
  onViewChange: null,
  keys: { ...DEFAULT_KEYS },
  nodeType: 'person',
  nodeRender: null,
  nodeSize: getDefaultNodeSizeForView('tree'),
  nodeSizeOf: null,
  autoSize: true,
  spacing: { sibling: 24, subtree: 56, level: 72 },
  edge: {
    type: 'orthogonal',
    radius: 10,
    width: 1.5,
    color: null,
    dashed: null,
  },
  collapsible: true,
  defaultExpandedDepth: 2,
  expandedIds: null,
  showCounters: true,
  counterMode: 'both',
  onToggle: null,
  interaction: {
    pan: true,
    zoom: true,
    zoomRange: [0.2, 2],
    zoomStep: 0.15,
    fitOnMount: true,
    fitPadding: 48,
    selectable: true,
  },
  detailMode: 'panel',
  renderDetails: null,
  detailFields: [...DEFAULT_DETAIL_FIELDS],
  onNodeClick: null,
  onNodeDoubleClick: null,
  toolbar: {
    visible: true,
    position: 'bottom',
    align: 'center',
    items: [
      'zoomOut',
      'zoomLevel',
      'zoomIn',
      'fit',
      'center',
      'expandAll',
      'collapseAll',
      'groups',
      'search',
    ],
    additionalItems: [],
  },
  groups: {
    enabled: false,
    key: 'department',
    label: null,
    color: null,
    cluster: true,
    padding: 20,
    render: null,
  },
  compact: {
    enabled: true,
    leafThreshold: 6,
    maxColumns: 'auto',
    columnGap: 16,
    rowGap: 12,
  },
  focus: {
    enabled: true,
    trigger: 'doubleClick',
    showBreadcrumb: true,
  },
  onFocusChange: null,
  performance: {
    culling: true,
    cullingMargin: 400,
    lodThreshold: 0.55,
    minimalThreshold: 0.3,
    lazyPhotos: true,
    maxAnimatedNodes: 200,
  },
  getPortalContainer: null,
  emptyState: null,
  loading: false,
  className: '',
  style: null,
  orgRef: null,
};

export function mergeOptions(options = {}) {
  const view = options.view ?? DEFAULT_OPTIONS.view;
  const defaultNodeSize = getDefaultNodeSizeForView(view);

  return {
    ...DEFAULT_OPTIONS,
    ...options,
    keys: { ...DEFAULT_KEYS, ...(options.keys || {}) },
    nodeSize: { ...defaultNodeSize, ...(options.nodeSize || {}) },
    spacing: { ...DEFAULT_OPTIONS.spacing, ...(options.spacing || {}) },
    edge: { ...DEFAULT_OPTIONS.edge, ...(options.edge || {}) },
    interaction: { ...DEFAULT_OPTIONS.interaction, ...(options.interaction || {}) },
    toolbar: {
      ...DEFAULT_OPTIONS.toolbar,
      ...(options.toolbar || {}),
      items: options.toolbar?.items ?? DEFAULT_OPTIONS.toolbar.items,
      additionalItems: options.toolbar?.additionalItems ?? [],
    },
    groups: { ...DEFAULT_OPTIONS.groups, ...(options.groups || {}) },
    compact: { ...DEFAULT_OPTIONS.compact, ...(options.compact || {}) },
    focus: { ...DEFAULT_OPTIONS.focus, ...(options.focus || {}) },
    performance: { ...DEFAULT_OPTIONS.performance, ...(options.performance || {}) },
    detailFields: options.detailFields ?? DEFAULT_OPTIONS.detailFields,
  };
}
