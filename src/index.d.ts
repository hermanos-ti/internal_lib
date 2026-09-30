import { ComponentType, ReactNode, CSSProperties, Ref } from 'react';

// ============================================
// Components
// ============================================

export interface ActionBarProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const ActionBar: ComponentType<ActionBarProps>;

export interface BadgeProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  color?: string;
  variant?: string;
  [key: string]: unknown;
}
export declare const Badge: ComponentType<BadgeProps>;

export interface BreadcrumbProps {
  items?: Array<{ label: string; href?: string; onClick?: () => void }>;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Breadcrumb: ComponentType<BreadcrumbProps>;

export interface ButtonProps {
  children?: ReactNode;
  onClick?: (event: React.MouseEvent) => void;
  variant?: string;
  size?: string;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  className?: string;
  style?: CSSProperties;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: unknown;
}
export declare const Button: ComponentType<ButtonProps>;

export interface CardProps {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Card: ComponentType<CardProps>;

export interface ContainerProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Container: ComponentType<ContainerProps>;

export interface DetailsProps {
  children?: ReactNode;
  title?: string;
  open?: boolean;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Details: ComponentType<DetailsProps>;

export interface DrawerProps {
  children?: ReactNode;
  open?: boolean;
  onClose?: () => void;
  position?: 'left' | 'right';
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Drawer: ComponentType<DrawerProps>;

export interface FrameProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Frame: ComponentType<FrameProps>;

export interface HeaderProps {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Header: ComponentType<HeaderProps>;

export interface IconPickerProps {
  value?: string;
  onChange?: (icon: string) => void;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const IconPicker: ComponentType<IconPickerProps>;

export interface InputProps {
  type?: 'text' | 'number' | 'password' | 'email' | 'date' | 'datetime-local' | 'file' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'switch' | 'slider' | 'color';
  label?: string;
  value?: unknown;
  onChange?: (value: unknown, event?: React.ChangeEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string | boolean;
  options?: Array<{ value: unknown; label: string }>;
  mask?: (value: string) => string;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Input: ComponentType<InputProps>;

export declare function useInput(
  initialValue?: string,
  maskFn?: (value: string) => string
): {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement> | string) => void;
  reset: () => void;
  setValue: (value: string) => void;
};

export interface LoaderProps {
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Loader: ComponentType<LoaderProps>;

export interface MenuProps {
  children?: ReactNode;
  items?: Array<{
    key?: string;
    label: string;
    icon?: string;
    onClick?: () => void;
    disabled?: boolean;
  }>;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Menu: ComponentType<MenuProps>;

export interface ModalProps {
  children?: ReactNode;
  open?: boolean;
  onClose?: () => void;
  title?: string;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Modal: ComponentType<ModalProps>;

export interface PaginationProps {
  totalItems: number;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Pagination: ComponentType<PaginationProps>;

export interface PopupProps {
  children?: ReactNode;
  open?: boolean;
  onClose?: () => void;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Popup: ComponentType<PopupProps>;

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Skeleton: ComponentType<SkeletonProps>;

export interface TabelaColumn {
  key: string;
  title?: string;
  label?: string;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: Array<string | { value: unknown; label: string }>;
  format?: 'text' | 'money' | 'percentage' | 'number' | 'integer' | 'date' | 'datetime';
  visible?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  searchable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  groupable?: boolean;
  calculable?: boolean;
  editable?: boolean | { type: string; options?: unknown[] };
  render?: (value: unknown, row: Record<string, unknown>, column: TabelaColumn, rowIndex: number, colIndex: number) => ReactNode;
  sqlColumn?: string;
  subColumns?: TabelaColumn[];
  className?: string;
  style?: CSSProperties;
  cellClassName?: string;
  cellStyle?: CSSProperties;
  getExportValue?: (value: unknown, row: Record<string, unknown>, column: TabelaColumn) => string;
  [key: string]: unknown;
}

export type TabelaActionVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';

export interface TabelaAction {
  key: string;
  label: string;
  variant?: TabelaActionVariant;
  icon?: string;
  disabled?: boolean;
  onClick?: (payload: { selectedRows: Record<string, unknown>[] }) => void;
}

export interface TabelaOptions {
  showHeader?: boolean;
  showFooter?: boolean;
  showToolbar?: boolean;
  showPagination?: boolean;
  itensPerPage?: number;
  itensPerPageOptions?: number[];
  showTableTitle?: boolean;
  tableIcon?: string;
  tableName?: string;
  tableSubtitle?: string | null;
  columnMinWidth?: string;
  showSearch?: boolean;
  actions?: TabelaAction[];
  actionsMaxVisible?: number;
  showSorts?: boolean;
  showFilters?: boolean;
  showSettings?: boolean;
  showSettingsOptions?: string[];
  currentTableView?: string;
  showTableViews?: boolean;
  tableViews?: string[];
  filterMode?: 'internal' | string;
  onFilterChange?: (filters: unknown[], sqlWhere: string) => void;
  selectable?: boolean;
  selectionMode?: 'multiple' | 'single';
  onSelectionChange?: (selectedRows: Record<string, unknown>[]) => void;
  selectionRef?: Ref<unknown>;
  onClick?: (event: { row: Record<string, unknown>; column: TabelaColumn; cell: unknown; rowIndex: number; colIndex: number }) => void;
  onDoubleClick?: (event: { row: Record<string, unknown>; column: TabelaColumn; cell: unknown; rowIndex: number; colIndex: number }) => void;
  editable?: boolean;
  editRef?: Ref<unknown>;
  onEditChange?: (allData: Record<string, unknown>[], changedRow: Record<string, unknown>, changedColumn: string) => void;
  onSave?: (allData: Record<string, unknown>[], editedRows: Record<string, unknown>[]) => void;
  importConfig?: { columns: Array<{ key: string; label: string; format?: string; obrigatorio?: boolean; validator?: (value: unknown) => boolean | string }> } | null;
  onImportComplete?: (importedData: Record<string, unknown>[]) => void;
  [key: string]: unknown;
}

export interface TabelaProps {
  columns: TabelaColumn[];
  data: Record<string, unknown>[];
  footer?: Record<string, unknown>[];
  options?: TabelaOptions;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Tabela: ComponentType<TabelaProps>;

export interface OrganogramaNode {
  id?: string | number;
  parentId?: string | number | null;
  children?: OrganogramaNode[];
  name?: string;
  role?: string;
  department?: string;
  photo?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface OrganogramaOptions {
  view?: 'tree' | 'treeHorizontal' | 'list' | 'matrix' | 'departments' | 'radial' | string;
  additionalViews?: Array<{ key: string; label?: string; layout?: (params: unknown) => unknown }>;
  onViewChange?: (view: string) => void;
  keys?: Record<string, string>;
  nodeType?: string;
  nodeRender?: (node: OrganogramaNode, ctx: Record<string, unknown>) => ReactNode;
  nodeSize?: { width?: number; height?: number };
  nodeSizeOf?: (id: string | number) => { width?: number; height?: number };
  autoSize?: boolean;
  spacing?: { sibling?: number; subtree?: number; level?: number };
  edge?: {
    type?: 'orthogonal' | 'straight' | 'bezier';
    radius?: number;
    width?: number;
    color?: string | null;
    dashed?: ((source: OrganogramaNode, target: OrganogramaNode) => boolean) | null;
  };
  collapsible?: boolean;
  defaultExpandedDepth?: number;
  expandedIds?: Set<string | number> | null;
  showCounters?: boolean;
  counterMode?: 'direct' | 'total' | 'both';
  onToggle?: (id: string | number | null, expanded: boolean, expandedIds: Set<string | number> | null) => void;
  interaction?: {
    pan?: boolean;
    zoom?: boolean;
    zoomRange?: [number, number];
    zoomStep?: number;
    fitOnMount?: boolean;
    fitPadding?: number;
    selectable?: boolean;
  };
  detailMode?: 'panel' | 'drawer' | 'none';
  renderDetails?: (node: OrganogramaNode, ctx: { close: () => void }) => ReactNode;
  detailFields?: Array<{ key: string; label: string }>;
  onNodeClick?: (id: string | number, node: OrganogramaNode) => void;
  onNodeDoubleClick?: (id: string | number, node: OrganogramaNode) => void;
  toolbar?: {
    visible?: boolean;
    position?: 'bottom' | 'top';
    align?: 'center' | 'start' | 'end';
    items?: string[];
    additionalItems?: Array<{ key: string; label?: string; icon?: string; tooltip?: string; onClick?: () => void }>;
  };
  groups?: {
    enabled?: boolean;
    key?: string;
    label?: ((value: unknown, node: OrganogramaNode) => string) | null;
    color?: ((value: unknown, node?: OrganogramaNode) => unknown) | null;
    cluster?: boolean;
    padding?: number;
    render?: ((group: Record<string, unknown>) => ReactNode) | null;
  };
  compact?: {
    enabled?: boolean;
    leafThreshold?: number;
    maxColumns?: number | 'auto';
    columnGap?: number;
    rowGap?: number;
  };
  focus?: {
    enabled?: boolean;
    trigger?: 'doubleClick';
    showBreadcrumb?: boolean;
  };
  onFocusChange?: (id: string | number | null) => void;
  performance?: {
    culling?: boolean;
    cullingMargin?: number;
    lodThreshold?: number;
    minimalThreshold?: number;
    lazyPhotos?: boolean;
    maxAnimatedNodes?: number;
  };
  getPortalContainer?: () => HTMLElement;
  emptyState?: ReactNode;
  loading?: boolean;
  className?: string;
  style?: CSSProperties;
  orgRef?: Ref<OrganogramaRef>;
  [key: string]: unknown;
}

export interface OrganogramaRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  fit: () => void;
  centerOn: (id?: string | number) => void;
  expand: (id: string | number) => void;
  collapse: (id: string | number) => void;
  expandAll: () => void;
  collapseAll: () => void;
  select: (id: string | number) => void;
  find: (query: string) => string | number | null;
  focus: (id: string | number) => void;
  clearFocus: () => void;
  getTransform: () => { x: number; y: number; scale: number };
  setTransform: (transform: { x: number; y: number; scale: number }) => void;
}

export interface OrganogramaProps {
  id?: string;
  data?: OrganogramaNode[];
  options?: OrganogramaOptions;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

export declare const Organograma: ComponentType<OrganogramaProps>;
export declare function useOrganograma(): Ref<OrganogramaRef>;

export interface TabGroupProps {
  children?: ReactNode;
  tabs?: Array<{ key: string; label: string; icon?: string; content?: ReactNode }>;
  activeTab?: string;
  onChange?: (key: string) => void;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const TabGroup: ComponentType<TabGroupProps>;

export interface TagProps {
  children?: ReactNode;
  label?: string;
  color?: string;
  onRemove?: () => void;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Tag: ComponentType<TagProps>;

export interface TooltipProps {
  children: ReactNode;
  content?: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}
export declare const Tooltip: ComponentType<TooltipProps>;

// ============================================
// Functions / Utilities
// ============================================

export interface DialogButtonsText {
  confirm?: string;
  cancel?: string;
  close?: string;
}

export type DialogType =
  | 'default'
  | 'info'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error'
  | 'danger';

export interface DialogOptions {
  title?: string;
  message?: string;
  html?: string;
  type?: DialogType | 'critical';
  icon?: string;
  buttonsText?: DialogButtonsText;
  confirmText?: string;
  confirmHint?: string;
  critical?: boolean;
  criticalDelay?: number;
  position?: 'center' | 'top' | 'bottom';
  background?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  confirmButton?: boolean;
  onResult?: (result: boolean | null) => void;
  callback?: (result: boolean | null) => void;
  [key: string]: unknown;
}

export declare const DialogGlobal: ComponentType<Record<string, never>>;

export declare const DialogManagerInstance: {
  getState: () => { current: DialogOptions | null };
  resolveCurrent: (result: boolean | null) => void;
};

export declare const Dialog: {
  alert: (options?: DialogOptions) => Promise<void>;
  confirm: (options?: DialogOptions) => Promise<boolean>;
  show: (
    message: string,
    type?: DialogType | 'critical' | string,
    options?: DialogOptions,
    callback?: (result: boolean | null) => void
  ) => Promise<boolean | null | void>;
};

export interface ValidationError {
  code: string;
  message: string;
}

export interface ValidationFormat {
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string | RegExp;
  patternMessage?: string;
  custom?: (value: unknown) => boolean | string;
}

export declare function validate(value: unknown, format: string | ValidationFormat): ValidationError[];
export declare function validate(entries: Array<[unknown, string | ValidationFormat] | { value: unknown; format: string | ValidationFormat }>): ValidationError[][];

export declare const LoaderManager: {
  show: () => void;
  hide: () => void;
  [key: string]: unknown;
};
export declare const LoaderGlobal: ComponentType<Record<string, unknown>>;

export interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  [key: string]: unknown;
}
export declare const Toast: {
  show: (options: ToastOptions | string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  [key: string]: unknown;
};
