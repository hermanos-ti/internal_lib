import '../../styles/themes.css';
import styles from './Tabela.module.css';
import { useEffect, useState, useMemo, useCallback, useRef, useContext } from 'react';
import { Pagination } from '../Pagination/Pagination';
import { createPortal } from 'react-dom';

import { DEFAULT_OPTIONS, DEFAULT_COLUMN_CONFIG, DEFAULT_FOOTER_CONFIG, DEFAULT_FILTER, DEFAULT_FILTER_GROUP, TABLE_VIEWS, FILTER_CONDITIONS, filtersToSQL, getFilterDisplayText } from './constants';
import { prepareExportData, toCSV, downloadFile, getExportFilename } from './exportUtils';
import { ColumnSelectionMenu, SortMenu, FilterMenu, AdvancedFilterMenu, SettingsMenu, CalculationModal, ImportModal } from './components';
import { PortalTargetContext } from './PortalTargetContext';
import { GridView, ListView, KanbanView, CalendarView } from './components/views';

export const Tabela = ({ id, columns, data, footer, options = {} }) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  const onFilterChangeRef = useRef(mergedOptions.onFilterChange);
  const filterModeRef = useRef(mergedOptions.filterMode);

  useEffect(() => {
    onFilterChangeRef.current = mergedOptions.onFilterChange;
    filterModeRef.current = mergedOptions.filterMode;
  }, [mergedOptions.onFilterChange, mergedOptions.filterMode]);

  const [tableColumns, setTableColumns] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [tableFooter, setTableFooter] = useState([]);

  const [columnVisibility, setColumnVisibility] = useState({});
  const [footerVisibility, setFooterVisibility] = useState({});

  const leafKeysMap = useMemo(() => {
    const map = new Map();
    const leaves = tableColumns.filter(c => !c.hasSubColumns);
    leaves.forEach(leaf => {
      map.set(leaf.key, [leaf.key]);
      let key = leaf.parentKey;
      while (key) {
        const parent = tableColumns.find(c => c.key === key);
        if (!parent) break;
        if (!map.has(parent.key)) map.set(parent.key, []);
        map.get(parent.key).push(leaf.key);
        key = parent?.parentKey;
      }
    });
    return map;
  }, [tableColumns]);

  const visibleColumns = useMemo(() => {
    return tableColumns.filter(col =>
      !col.hasSubColumns
        ? columnVisibility[col.key] !== false
        : (leafKeysMap.get(col.key) || []).some(leafKey => columnVisibility[leafKey] !== false)
    );
  }, [tableColumns, columnVisibility, leafKeysMap]);

  const visibleFooter = useMemo(() => {
    return tableFooter.filter(item => footerVisibility[item.key] !== false);
  }, [tableFooter, footerVisibility]);

  const [isSorting, setIsSorting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sortVersion, setSortVersion] = useState(0);

  const sortAbortController = useRef(null);
  const sortedDataRef = useRef([]);
  const tableBodyRef = useRef(null);
  const expectedRowCountRef = useRef(0);
  const tableWrapperRef = useRef(null);
  const containerRef = useRef(null);

  const [itensPerPage, setItensPerPage] = useState(mergedOptions.itensPerPage);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [filters, setFilters] = useState([]);
  const [sorts, setSorts] = useState([]);
  const [tempFilters, setTempFilters] = useState([]);
  const [tempSorts, setTempSorts] = useState([]);
  const [isEditingToolbar, setIsEditingToolbar] = useState(false);
  const [hasScroll, setHasScroll] = useState(false);
  const [maxWidth, setMaxWidth] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [selectedKeys, setSelectedKeys] = useState(() => new Set());
  const onSelectionChangeRef = useRef(mergedOptions.onSelectionChange);

  useEffect(() => {
    onSelectionChangeRef.current = mergedOptions.onSelectionChange;
  }, [mergedOptions.onSelectionChange]);

  const [editedData, setEditedData] = useState(() => new Map());
  const [editedKeys, setEditedKeys] = useState(() => new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [rowStatuses, setRowStatuses] = useState(() => new Map());
  const [editViewFilter, setEditViewFilter] = useState('all');
  const [editViewDropdownOpen, setEditViewDropdownOpen] = useState(false);
  const onEditChangeRef = useRef(mergedOptions.onEditChange);
  const onSaveRef = useRef(mergedOptions.onSave);

  useEffect(() => {
    onEditChangeRef.current = mergedOptions.onEditChange;
  }, [mergedOptions.onEditChange]);

  useEffect(() => {
    onSaveRef.current = mergedOptions.onSave;
  }, [mergedOptions.onSave]);

  const rowKeyMap = useMemo(() => {
    const map = new WeakMap();
    originalData.forEach((item, index) => {
      map.set(item, item.key ?? `__row_${index}`);
    });
    return map;
  }, [originalData]);

  const getRowKey = useCallback((item) => rowKeyMap.get(item) ?? '', [rowKeyMap]);

  const columnSelectionMenuRef = useRef(null);
  const sortMenuRef = useRef(null);
  const filterMenuRef = useRef(null);
  const advancedFilterMenuRef = useRef(null);
  const settingsMenuRef = useRef(null);
  const toolbarFilterButtonRef = useRef(null);
  const toolbarSortButtonRef = useRef(null);
  const toolbarSettingsButtonRef = useRef(null);
  const sortButtonRef = useRef(null);
  const filterButtonRefs = useRef(new Map());
  const sortMenuColumnSelectRef = useRef(null);

  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const wasSearchFocusedRef = useRef(false);
  const viewsContainerRef = useRef(null);
  const viewIndicatorRef = useRef(null);

  const [currentEditingFilter, setCurrentEditingFilter] = useState(null);
  const [currentAdvancedFilterGroup, setCurrentAdvancedFilterGroup] = useState(null);
  const [groupByColumnKey, setGroupByColumnKey] = useState(null);
  const [calculationByColumn, setCalculationByColumn] = useState(mergedOptions.initialCalculationByColumn ?? {});

  const [currentTableView, setCurrentTableView] = useState(mergedOptions.currentTableView ?? 'grid');
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    if (mergedOptions.onTableViewChange) {
      mergedOptions.onTableViewChange(currentTableView);
    }
  }, [currentTableView]);

  useEffect(() => {
    const container = viewsContainerRef.current;
    const indicator = viewIndicatorRef.current;
    if (!container || !indicator) return;

    const activeBtn = container.querySelector(`[data-view-active="true"]`);
    if (!activeBtn) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    indicator.style.left = `${btnRect.left - containerRect.left}px`;
    indicator.style.width = `${btnRect.width}px`;
    indicator.style.opacity = '1';
  }, [currentTableView]);

  const [menuState, setMenuState] = useState({
    isOpen: false,
    type: null,
    position: { top: 0, left: 0 },
    sessionId: null,
  });

  const [subMenuState, setSubMenuState] = useState({
    isOpen: false,
    type: null,
    position: { top: 0, left: 0 },
    sessionId: null,
  });

  const [sortMenuEditingIndex, setSortMenuEditingIndex] = useState(-1);

  const currentMenuSessionRef = useRef(null);
  const currentSubMenuSessionRef = useRef(null);

  const processColumns = useCallback((cols, parentKey = null, level = 0) => {
    const processed = [];

    for (const column of cols) {
      const columnConfig = { ...DEFAULT_COLUMN_CONFIG, ...column };

      if (columnConfig.subColumns && Array.isArray(columnConfig.subColumns) && columnConfig.subColumns.length > 0) {
        const subProcessed = processColumns(columnConfig.subColumns, columnConfig.key, level + 1);

        const parentColumn = {
          ...columnConfig,
          parentKey: parentKey,
          level: level,
          hasSubColumns: true,
          subColumnsCount: subProcessed.filter(col => !col.hasSubColumns).length,
        };
        processed.push(parentColumn);
        processed.push(...subProcessed);
      } else {
        processed.push({
          ...columnConfig,
          parentKey: parentKey,
          level: level,
          hasSubColumns: false,
        });
      }
    }

    return processed;
  }, []);

  useEffect(() => {
    if (columns) {
      const columnsConfig = processColumns(columns);
      setTableColumns(columnsConfig);
      const nextVisibility = {};
      columnsConfig.forEach(c => {
        nextVisibility[c.key] = c?.visible ?? true;
      });
      setColumnVisibility(nextVisibility);
    }
  }, [columns, processColumns]);

  const checkRowsRendered = useCallback(() => {
    if (!tableBodyRef.current) return false;

    const rows = tableBodyRef.current.querySelectorAll('tr');
    const expectedCount = expectedRowCountRef.current;

    if (rows.length !== expectedCount) {
      return false;
    }

    let allVisible = true;
    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect();
      if (rect.height === 0) {
        allVisible = false;
        break;
      }
    }

    return allVisible;
  }, []);

  useEffect(() => {
    if (isLoading && originalData.length > 0) {
      expectedRowCountRef.current = originalData.length;

      const checkRender = () => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (checkRowsRendered()) {
              setIsLoading(false);
            } else {
              setTimeout(checkRender, 16);
            }
          });
        });
      };

      const timeoutId = setTimeout(checkRender, 0);

      const safetyTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 2000);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(safetyTimeout);
      };
    }
  }, [isLoading, originalData.length, checkRowsRendered]);

  useEffect(() => {
    if (data) {
      setIsLoading(true);
      setOriginalData(data);
      setFilteredData(data);
      sortedDataRef.current = data;
      setSorts([]);
      setFilters([]);
      setSelectedKeys(new Set());
    }
  }, [data]);

  const renderFlags = useMemo(() => {
    const columnRenders = new Map();
    visibleColumns.forEach((column) => {
      if (column.render && typeof column.render === 'function') {
        columnRenders.set(column.key, true);
      }
    });
    return { columnRenders };
  }, [visibleColumns]);

  useEffect(() => {
    if (footer) {
      const footerConfig = [];

      for (const item of footer) {
        footerConfig.push({ ...DEFAULT_FOOTER_CONFIG, ...item });
      }

      setTableFooter(footerConfig);
      const nextFooterVisibility = {};
      footerConfig.forEach(item => {
        nextFooterVisibility[item.key] = item.visible !== false;
      });
      setFooterVisibility(nextFooterVisibility);
    }
  }, [footer]);

  const getPortalContainerFromContext = useContext(PortalTargetContext);
  const getPortalContainerFn = mergedOptions.getPortalContainer ?? getPortalContainerFromContext;
  const getPortalContainerResolved = useCallback(() => (typeof getPortalContainerFn === 'function' ? getPortalContainerFn() : getPortalContainerFn) ?? document.body, [getPortalContainerFn]);

  /** Converte posição (em coordenadas de documento) para coordenadas relativas ao container do portal quando não for body */
  const positionToPortalCoordinates = useCallback((position, portalContainer) => {
    if (!position || portalContainer === document.body) return position;
    const rect = portalContainer.getBoundingClientRect?.();
    if (!rect) return position;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    const viewportHeight = window.innerHeight;
    const left = position.left - (rect.left + scrollX);
    if (position.verticalAnchor === 'bottom' && position.bottom != null) {
      const bottom = rect.bottom - viewportHeight + position.bottom;
      return { ...position, left, bottom, top: undefined };
    }
    const top = position.top != null ? position.top - (rect.top + scrollY) : undefined;
    return { ...position, left, top };
  }, []);

  const calculateMenuPosition = useCallback((buttonElement, options = {}) => {
    const config = {
      menuWidth: options.menuWidth ?? 280,
      menuHeight: options.menuHeight ?? 320,
      offset: options.offset ?? 8,        // Espaçamento entre botão e menu
      padding: options.padding ?? 16,     // Margem da borda da viewport
      preferredPosition: options.preferredPosition ?? 'bottom-start', // bottom-start, bottom-end, top-start, top-end
    };

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
      scrollX: window.scrollX || window.pageXOffset,
      scrollY: window.scrollY || window.pageYOffset,
    }

    const buttonRect = buttonElement.getBoundingClientRect();
    const button = {
      top: buttonRect.top,
      bottom: buttonRect.bottom,
      left: buttonRect.left,
      right: buttonRect.right,
      width: buttonRect.width,
      height: buttonRect.height,
      absoluteTop: buttonRect.top + viewport.scrollY,
      absoluteLeft: buttonRect.left + viewport.scrollX,
    }

    const availableSpaces = {
      above: button.top - config.padding,
      below: viewport.height - button.bottom - config.padding,
      left: button.left - config.padding,
      right: viewport.width - button.right - config.padding,
    }

    let top = 0;
    let bottom;
    let verticalAnchor = 'top';

    if (config.preferredPosition.startsWith('bottom')) {
      if (availableSpaces.below >= config.menuHeight) {
        top = button.absoluteTop + button.height + config.offset;
      } else if (availableSpaces.above >= config.menuHeight) {
        verticalAnchor = 'bottom';
        bottom = viewport.height - (button.top - config.offset);
      } else {
        if (availableSpaces.below >= availableSpaces.above) {
          top = button.absoluteTop + button.height + config.offset;
        } else {
          verticalAnchor = 'bottom';
          bottom = viewport.height - (button.top - config.offset);
        }
      }
    } else {
      if (availableSpaces.above >= config.menuHeight) {
        verticalAnchor = 'bottom';
        bottom = viewport.height - (button.top - config.offset);
      } else if (availableSpaces.below >= config.menuHeight) {
        top = button.absoluteTop + button.height + config.offset;
      } else {
        if (availableSpaces.above >= availableSpaces.below) {
          verticalAnchor = 'bottom';
          bottom = viewport.height - (button.top - config.offset);
        } else {
          top = button.absoluteTop + button.height + config.offset;
        }
      }
    }

    let left = 0;

    if (config.preferredPosition.endsWith('start')) {
      left = button.absoluteLeft - 1;

      if (left + config.menuWidth > viewport.width + viewport.scrollX - config.padding) {
        left = viewport.width + viewport.scrollX - config.menuWidth - config.padding - 1;
      }
    } else {
      left = button.absoluteLeft - config.menuWidth + config.offset + 1;

      if (left < viewport.scrollX + config.padding) {
        left = viewport.scrollX + config.padding + 1;
      }
    }

    if (verticalAnchor === 'top') {
      top = Math.max(viewport.scrollY + config.padding, top);
    } else if (bottom != null) {
      bottom = Math.max(config.padding, Math.min(bottom, viewport.height - config.padding));
    }
    left = Math.max(viewport.scrollX + config.padding, left)

    return verticalAnchor === 'bottom'
      ? { top: undefined, left, bottom, verticalAnchor: 'bottom' }
      : { top, left, verticalAnchor: 'top' };
  });

  const closeMenu = useCallback((closingSessionId = null) => {
    if (closingSessionId !== null && closingSessionId !== currentMenuSessionRef.current) {
      return;
    }

    currentMenuSessionRef.current = null;

    if (subMenuState.isOpen) {
      currentSubMenuSessionRef.current = null;
      setSubMenuState({
        isOpen: false,
        type: null,
        position: { top: 0, left: 0 },
        sessionId: null,
      });
      setSortMenuEditingIndex(-1);
    }
    setMenuState({
      isOpen: false,
      type: null,
      position: { top: 0, left: 0 },
      sessionId: null,
    });
  }, [menuState.type, subMenuState.isOpen]);

  const openMenu = useCallback((menuType, buttonRef, options = {}) => {
    if (!buttonRef?.current) return;

    if (subMenuState.isOpen) {
      setSubMenuState({
        isOpen: false,
        type: null,
        position: { top: 0, left: 0 },
        sessionId: null,
      });
      setSortMenuEditingIndex(-1);
    }

    if (menuState.type === menuType && menuState.isOpen) {
      if (menuType === 'sort-menu') {
        sortMenuRef.current?.close();
      } else if (menuType === 'filter-menu') {
        filterMenuRef.current?.close();
      } else if (menuType === 'settings-menu') {
        settingsMenuRef.current?.close();
      } else {
        columnSelectionMenuRef.current?.close();
      }
      return;
    }

    if (menuType === 'sort-selection' || menuType === 'filter-selection') {
      if (!isEditingToolbar) {
        setTempFilters([...filters]);
        setTempSorts([...sorts]);
      } else {
        if (menuType === 'filter-selection') {
          if (tempFilters.length === 0) {
            setTempFilters([...filters]);
          }
          // Preservar tempSorts
        } else {
          if (tempSorts.length === 0) {
            setTempSorts([...sorts]);
          }
          // Preservar tempFilters
        }
      }
    } else if (menuType === 'sort-menu') {
      if (tempSorts.length === 0 && !options.skipTempReset) {
        setTempSorts([...sorts]);
      }
      // Preservar tempFilters
    } else if (menuType === 'filter-menu') {
      // Não inicializar tempFilters/tempSorts aqui - apenas abrir o menu não deve alterar estados
      // Os estados temporários serão inicializados apenas quando o usuário começar a editar (handleFilterUpdate)
      // skipTempReset evita sobrescrever tempFilters quando chamado de dentro do onSelect
      if (tempFilters.length === 0 && !options.skipTempReset && isEditingToolbar) {
        // Só inicializar se já estiver em modo de edição
        setTempFilters([...filters]);
      }
      // Preservar tempSorts apenas se já estiver em modo de edição
      if (tempSorts.length === 0 && sorts.length > 0 && isEditingToolbar) {
        setTempSorts([...sorts]);
      }
    }

    const defaultWidth = menuType === 'sort-menu' ? 320 : 280;
    const defaultHeight = menuType === 'sort-menu' ? 380 : 320;

    const rawPosition = calculateMenuPosition(buttonRef.current, {
      menuWidth: options.menuWidth ?? defaultWidth,
      menuHeight: options.menuHeight ?? defaultHeight,
      preferredPosition: options.preferredPosition ?? 'bottom-start',
      offset: options.offset ?? 8,
      padding: options.padding ?? 16,
    });

    const portalContainer = getPortalContainerResolved();
    const position = positionToPortalCoordinates(rawPosition, portalContainer);

    const newSessionId = Date.now() + Math.random();

    currentMenuSessionRef.current = newSessionId;

    setMenuState({
      isOpen: true,
      type: menuType,
      position: { ...position },
      sessionId: newSessionId,
    });
  }, [calculateMenuPosition, getPortalContainerResolved, positionToPortalCoordinates, menuState, filters, sorts, tempFilters, tempSorts, subMenuState.isOpen, isEditingToolbar]);

  const closeSubMenu = useCallback((closingSessionId = null) => {

    if (closingSessionId !== null && closingSessionId !== currentSubMenuSessionRef.current) {
      return;
    }

    currentSubMenuSessionRef.current = null;

    setSubMenuState({
      isOpen: false,
      type: null,
      position: { top: 0, left: 0 },
      sessionId: null,
    });
    setSortMenuEditingIndex(-1);
  }, [menuState.isOpen, menuState.type]);

  const openSortMenuColumnSelection = useCallback((columnItemOrNull, index, buttonElement) => {
    if (!buttonElement || typeof buttonElement.getBoundingClientRect !== 'function') return;

    if (subMenuState.isOpen && sortMenuColumnSelectRef.current === buttonElement) {
      closeSubMenu();
      return;
    }

    sortMenuColumnSelectRef.current = buttonElement;
    setSortMenuEditingIndex(index);

    const rawPosition = calculateMenuPosition(buttonElement, {
      menuWidth: 280,
      menuHeight: 320,
      preferredPosition: 'right-start',
      offset: 0,
      padding: 16,
    });

    const portalContainer = getPortalContainerResolved();
    const position = positionToPortalCoordinates(rawPosition, portalContainer);

    const newSessionId = Date.now() + Math.random();

    currentSubMenuSessionRef.current = newSessionId;

    setSubMenuState({
      isOpen: true,
      type: 'sort-menu-column-selection',
      position: { ...position },
      sessionId: newSessionId,
    });
  }, [calculateMenuPosition, getPortalContainerResolved, positionToPortalCoordinates, subMenuState.isOpen, closeSubMenu]);

  const areFiltersEqual = useCallback((filters1, filters2) => {
    if (filters1.length !== filters2.length) return false;

    const map1 = new Map();
    const map2 = new Map();

    filters1.forEach(f => {
      const key = f.key || f.id;
      if (key) map1.set(key, f);
    });

    filters2.forEach(f => {
      const key = f.key || f.id;
      if (key) map2.set(key, f);
    });

    if (map1.size !== map2.size) return false;

    for (const [key, filter1] of map1) {
      const filter2 = map2.get(key);
      if (!filter2) return false;

      // Comparar propriedades relevantes
      if (filter1.key !== filter2.key ||
        filter1.condition !== filter2.condition ||
        filter1.value !== filter2.value ||
        filter1.valueTo !== filter2.valueTo ||
        filter1.isAdvanced !== filter2.isAdvanced) {
        return false;
      }

      // Se for filtro avançado, comparar regras
      if (filter1.isAdvanced && filter2.isAdvanced) {
        const rules1 = JSON.stringify(filter1.rules || []);
        const rules2 = JSON.stringify(filter2.rules || []);
        if (rules1 !== rules2) return false;
      }
    }

    return true;
  }, []);

  const areSortsEqual = useCallback((sorts1, sorts2) => {
    if (sorts1.length !== sorts2.length) return false;

    const map1 = new Map();
    const map2 = new Map();

    sorts1.forEach(s => {
      if (s.key) map1.set(s.key, s);
    });

    sorts2.forEach(s => {
      if (s.key) map2.set(s.key, s);
    });

    if (map1.size !== map2.size) return false;

    for (const [key, sort1] of map1) {
      const sort2 = map2.get(key);
      if (!sort2) return false;

      // Comparar propriedades relevantes
      if (sort1.key !== sort2.key || sort1.direction !== sort2.direction) {
        return false;
      }
    }

    return true;
  }, []);

  const handleSortMenuUpdateSorts = useCallback((newSorts) => {
    setIsEditingToolbar(true);
    setTempSorts(newSorts);
  }, []);

  const handleSortMenuClearSorts = useCallback(() => {
    sortMenuRef.current?.close();

    setTempSorts([]);
    setSorts([]);
  }, []);

  const handleOpenFilterMenu = useCallback((filter, buttonRef) => {
    if (filter.isAdvanced) {
      setCurrentAdvancedFilterGroup(filter);
      const buttonElement = buttonRef?.current || filterButtonRefs.current.get(filter.key);
      if (buttonElement) {
        const rawPosition = calculateMenuPosition(buttonElement, {
          menuWidth: 580,
          menuHeight: 450,
          preferredPosition: 'bottom-start',
          offset: 8,
          padding: 16,
        });

        const portalContainer = getPortalContainerResolved();
        const position = positionToPortalCoordinates(rawPosition, portalContainer);

        const newSessionId = Date.now() + Math.random();
        currentSubMenuSessionRef.current = newSessionId;

        setSubMenuState({
          isOpen: true,
          type: 'advanced-filter-menu',
          position: { ...position },
          sessionId: newSessionId,
        });
      }
      return;
    }

    const column = visibleColumns.find(col => col.key === filter.key);
    const editingFilter = {
      ...DEFAULT_FILTER,
      ...filter,
      type: column?.type || 'text',
      condition: filter.condition || FILTER_CONDITIONS[column?.type || 'text'][0]?.value || 'is',
    };

    setCurrentEditingFilter(editingFilter);
    openMenu('filter-menu', buttonRef, {
      preferredPosition: 'bottom-start',
      menuWidth: 320,
      menuHeight: 350
    });
  }, [visibleColumns, openMenu, calculateMenuPosition, getPortalContainerResolved, positionToPortalCoordinates, isEditingToolbar, sorts, tempSorts, filters, tempFilters]);

  const handleFilterUpdate = useCallback((updatedFilter) => {
    setIsEditingToolbar(true);
    
    setTempFilters(prev => {
      if (prev.length === 0 && filters.length > 0) {
        return filters.map(f => f.key === updatedFilter.key ? updatedFilter : f);
      }
      return prev.map(f => f.key === updatedFilter.key ? updatedFilter : f);
    });
    
    if (tempSorts.length === 0 && sorts.length > 0) {
      setTempSorts([...sorts]);
    }

    if (menuState.type === 'filter-menu' && menuState.isOpen && currentEditingFilter?.key === updatedFilter.key) {
      setCurrentEditingFilter(updatedFilter);
    } else {
      if (!menuState.isOpen) {
        setCurrentEditingFilter(null);
      }
    }
  }, [currentEditingFilter, menuState.type, menuState.isOpen, isEditingToolbar, tempSorts, sorts, tempFilters, filters]);

  const handleFilterRemove = useCallback((filterId) => {
    setIsEditingToolbar(true);
    setTempFilters(prev => {
      const filtered = prev.filter(f => f.id !== filterId && f.key !== filterId);
      return filtered;
    });
    setFilters(prev => {
      const filtered = prev.filter(f => f.id !== filterId && f.key !== filterId);
      return filtered;
    });
    setCurrentEditingFilter(null);
  }, [sorts, tempSorts, filters]);

  const handleOpenAdvancedFilter = useCallback((filterItem) => {
    const newGroup = currentAdvancedFilterGroup ? {
      ...currentAdvancedFilterGroup,
      rules: [
        ...currentAdvancedFilterGroup.rules,
        { type: 'rule', id: `rule-${Date.now()}`, ...filterItem }
      ]
    } : {
      ...DEFAULT_FILTER_GROUP,
      id: `advanced-${Date.now()}`,
      label: 'Filtro Avançado',
      rules: [{ type: 'rule', id: `rule-${Date.now()}`, ...filterItem }]
    };

    setCurrentAdvancedFilterGroup(newGroup);
    filterMenuRef.current?.close();
    const buttonElement = filterButtonRefs.current.get(filterItem.key);
    if (buttonElement) {
      const position = calculateMenuPosition(buttonElement, {
        menuWidth: 580,
        menuHeight: 450,
        preferredPosition: 'bottom-start',
        offset: 8,
        padding: 16,
      });

      const newSessionId = Date.now() + Math.random();
      currentSubMenuSessionRef.current = newSessionId;

      setSubMenuState({
        isOpen: true,
        type: 'advanced-filter-menu',
        position: { ...position },
        sessionId: newSessionId,
      });
    }
  }, [currentAdvancedFilterGroup, calculateMenuPosition]);

  const handleAdvancedFilterUpdate = useCallback((updatedGroup) => {
    setCurrentAdvancedFilterGroup(updatedGroup);
  }, []);

  const handleAdvancedFilterSave = useCallback((filterGroup) => {
    setIsEditingToolbar(true);

    const advancedFilterItem = {
      ...filterGroup,
      key: filterGroup.id,
    };

    setTempFilters(prev => {
      // Se tempFilters está vazio (ex: após "Salvar" da toolbar), usar filters comprometidos como base
      const base = prev.length > 0 ? prev : filters;

      // Coletar IDs dos filtros simples que agora são regras do filtro avançado
      const ruleIds = new Set(filterGroup.rules?.map(r => r.id) || []);

      // Remover filtros simples que foram incorporados ao filtro avançado
      const withoutConvertedSimple = base.filter(f => f.isAdvanced || !ruleIds.has(f.id));

      // Verificar se já existe um filtro avançado com o mesmo ID
      const existingIndex = withoutConvertedSimple.findIndex(f => f.id === filterGroup.id);
      if (existingIndex >= 0) {
        const newFilters = [...withoutConvertedSimple];
        newFilters[existingIndex] = advancedFilterItem;
        return newFilters;
      }
      return [...withoutConvertedSimple, advancedFilterItem];
    });

    setCurrentAdvancedFilterGroup(null);
  }, [filters]);

  const handleAdvancedFilterCancel = useCallback(() => {
    setCurrentAdvancedFilterGroup(null);
  }, []);

  const handleAdvancedFilterDelete = useCallback(() => {
    if (!currentAdvancedFilterGroup) return;

    setTempFilters(prev => prev.filter(f => f.id !== currentAdvancedFilterGroup.id));
    setFilters(prev => prev.filter(f => f.id !== currentAdvancedFilterGroup.id));
    setCurrentAdvancedFilterGroup(null);
  }, [currentAdvancedFilterGroup]);

  const handleOpenNewAdvancedFilter = useCallback((buttonRef) => {
    columnSelectionMenuRef.current?.close();
    
    setIsEditingToolbar(true);

    // Criar novo grupo vazio
    const newGroup = {
      ...DEFAULT_FILTER_GROUP,
      id: `advanced-${Date.now()}`,
      label: 'Filtro Avançado',
      rules: []
    };

    const advancedFilterItem = {
      ...newGroup,
      key: newGroup.id,
    };

    setTempFilters(prev => [...prev, advancedFilterItem]);
    setCurrentAdvancedFilterGroup(newGroup);

    setTimeout(() => {
      const newFilterButton = filterButtonRefs.current.get(newGroup.id);
      
      if (newFilterButton) {
        const rawPosition = calculateMenuPosition(newFilterButton, {
          menuWidth: 580,
          menuHeight: 450,
          preferredPosition: 'bottom-start',
          offset: 8,
          padding: 16,
        });

        const portalContainer = getPortalContainerResolved();
        const position = positionToPortalCoordinates(rawPosition, portalContainer);

        const newSessionId = Date.now() + Math.random();
        currentSubMenuSessionRef.current = newSessionId;

        setSubMenuState({
          isOpen: true,
          type: 'advanced-filter-menu',
          position: { ...position },
          sessionId: newSessionId,
        });
      }
    }, 0);
  }, [calculateMenuPosition, getPortalContainerResolved, positionToPortalCoordinates]);

  const evaluateFilterCondition = useCallback((value, filter) => {
    const { condition, value: filterValue, valueTo } = filter;

    if (condition === 'isEmpty') {
      return value === null || value === undefined || value === '';
    }
    if (condition === 'isNotEmpty') {
      return value !== null && value !== undefined && value !== '';
    }

    if (filterValue === '' || filterValue === null || filterValue === undefined) {
      return true;
    }

    const normalizedValue = value?.toString?.()?.toLowerCase?.() ?? '';
    const normalizedFilterValue = filterValue?.toString?.()?.toLowerCase?.() ?? '';

    switch (condition) {
      case 'is':
        return normalizedValue === normalizedFilterValue;
      case 'isNot':
        return normalizedValue !== normalizedFilterValue;
      case 'contains':
        return normalizedValue.includes(normalizedFilterValue);
      case 'notContains':
        return !normalizedValue.includes(normalizedFilterValue);
      case 'startsWith':
        return normalizedValue.startsWith(normalizedFilterValue);
      case 'endsWith':
        return normalizedValue.endsWith(normalizedFilterValue);

      case 'equals':
        return Number(value) === Number(filterValue);
      case 'notEquals':
        return Number(value) !== Number(filterValue);
      case 'greaterThan':
        return Number(value) > Number(filterValue);
      case 'lessThan':
        return Number(value) < Number(filterValue);
      case 'greaterOrEqual':
        return Number(value) >= Number(filterValue);
      case 'lessOrEqual':
        return Number(value) <= Number(filterValue);

      case 'isBefore': {
        const dateValue = new Date(value);
        const dateFilter = new Date(filterValue);
        return dateValue < dateFilter;
      }
      case 'isAfter': {
        const dateValue = new Date(value);
        const dateFilter = new Date(filterValue);
        return dateValue > dateFilter;
      }
      case 'isOnOrBefore': {
        const dateValue = new Date(value);
        const dateFilter = new Date(filterValue);
        return dateValue <= dateFilter;
      }
      case 'isOnOrAfter': {
        const dateValue = new Date(value);
        const dateFilter = new Date(filterValue);
        return dateValue >= dateFilter;
      }
      case 'isBetween': {
        if (!valueTo) return true;
        const dateValue = new Date(value);
        const dateFrom = new Date(filterValue);
        const dateTo = new Date(valueTo);
        return dateValue >= dateFrom && dateValue <= dateTo;
      }

      default:
        return true;
    }
  }, []);

  const evaluateFilterGroup = useCallback((row, group) => {
    if (!group || !group.rules || group.rules.length === 0) {
      return true;
    }

    const { logic, rules } = group;

    if (logic === 'AND') {
      return rules.every(rule => {
        if (rule.type === 'group') {
          return evaluateFilterGroup(row, rule);
        }
        const value = row[rule.key]?.sortableValue ?? row[rule.key];
        return evaluateFilterCondition(value, rule);
      });
    } else {
      // OR
      return rules.some(rule => {
        if (rule.type === 'group') {
          return evaluateFilterGroup(row, rule);
        }
        const value = row[rule.key]?.sortableValue ?? row[rule.key];
        return evaluateFilterCondition(value, rule);
      });
    }
  }, [evaluateFilterCondition]);

  const normalizeString = useCallback((str) => {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const normalizedDataCache = useRef(new Map());

  const searchableColumns = useMemo(() => {
    return visibleColumns.filter(col => col.searchable !== false);
  }, [visibleColumns]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!originalData.length || !searchableColumns.length) {
      normalizedDataCache.current.clear();
      return;
    }

    const cache = new Map();
    const searchableKeys = searchableColumns.map(col => col.key);

    originalData.forEach((row, index) => {
      const normalizedRow = {};
      searchableKeys.forEach(key => {
        const value = row[key]?.sortableValue ?? row[key];
        normalizedRow[key] = normalizeString(value);
      });
      cache.set(index, normalizedRow);
    });

    normalizedDataCache.current = cache;
  }, [originalData, searchableColumns, normalizeString]);

  const searchDataAsync = useCallback((data, searchTerm, searchableColumns) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return data;
    }

    const normalizedSearchTerm = normalizeString(searchTerm);
    if (!normalizedSearchTerm) {
      return data;
    }

    const searchableKeys = searchableColumns.map(col => col.key);
    const cache = normalizedDataCache.current;

    return data.filter((row, index) => {
      const normalizedRow = cache.get(index);
      if (!normalizedRow) {
        return searchableKeys.some(key => {
          const value = row[key]?.sortableValue ?? row[key];
          const normalizedValue = normalizeString(value);
          return normalizedValue.includes(normalizedSearchTerm);
        });
      }

      return searchableKeys.some(key => {
        const normalizedValue = normalizedRow[key] || '';
        return normalizedValue.includes(normalizedSearchTerm);
      });
    });
  }, [normalizeString]);

  const filterDataAsync = useCallback((data, activeFilters) => {
    if (!activeFilters || activeFilters.length === 0) {
      return data;
    }

    return data.filter(row => {
      return activeFilters.every(filter => {
        if (filter.isAdvanced) {
          return evaluateFilterGroup(row, filter);
        } else {
          const value = row[filter.key]?.sortableValue ?? row[filter.key];
          return evaluateFilterCondition(value, filter);
        }
      });
    });
  }, [evaluateFilterCondition, evaluateFilterGroup]);

  const [filteredData, setFilteredData] = useState(originalData);

  useEffect(() => {
    const activeFilters = isEditingToolbar ? tempFilters : filters;
    const isExternalMode = filterModeRef.current === 'external';


    requestAnimationFrame(() => {
      let result = originalData;

      if (debouncedSearchTerm && debouncedSearchTerm.trim() !== '') {
        result = searchDataAsync(result, debouncedSearchTerm, searchableColumns);
      }

      if (isExternalMode) {
        setFilteredData(result);
        return;
      }

      if (activeFilters && activeFilters.length > 0) {
        result = filterDataAsync(result, activeFilters);
      }

      setFilteredData(result);
    });
  }, [originalData, filters, tempFilters, isEditingToolbar, filterDataAsync, debouncedSearchTerm, searchDataAsync, searchableColumns]);

  useEffect(() => {
    if (isEditingToolbar || !onFilterChangeRef.current) return;

    const sqlWhere = filtersToSQL(filters, tableColumns, 'AND', true);

    onFilterChangeRef.current(filters, sqlWhere);
  }, [filters, tableColumns, isEditingToolbar]);

  useEffect(() => {
    if (!isEditingToolbar) return;

    const filtersEqual = areFiltersEqual(tempFilters, filters);
    const sortsEqual = areSortsEqual(tempSorts, sorts);

    if (filtersEqual && sortsEqual) {
      setIsEditingToolbar(false);
    }
  }, [isEditingToolbar, filters, sorts, tempFilters, tempSorts, areFiltersEqual, areSortsEqual]);

  const compareValues = useCallback((aValue, bValue, direction) => {
    if (aValue === null || aValue === undefined) {
      return direction === 'asc' ? 1 : -1;
    }
    if (bValue === null || bValue === undefined) {
      return direction === 'asc' ? -1 : 1;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const result = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
      return direction === 'asc' ? result : -result;
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  }, []);

  const sortDataMultiColumnAsync = useCallback(async (data, sorts, signal) => {
    if (!sorts || sorts.length === 0) {
      return [...data];
    }

    const compareMultiColumn = (a, b) => {
      if (signal?.aborted) return 0;

      for (const sort of sorts) {
        const aValue = a[sort.key]?.sortableValue ?? a[sort.key];
        const bValue = b[sort.key]?.sortableValue ?? b[sort.key];
        const comparison = compareValues(aValue, bValue, sort.direction);

        if (comparison !== 0) {
          return comparison;
        }
      }

      return 0;
    };

    if (signal?.aborted) {
      return [...data];
    }

    const sorted = [...data];
    sorted.sort(compareMultiColumn);

    return sorted;
  }, [compareValues]);

  useEffect(() => {
    if (sortAbortController.current) {
      sortAbortController.current.abort();
    }

    const activeSorts = isEditingToolbar ? tempSorts : sorts;
    const dataToSort = filteredData.length > 0 ? filteredData : originalData;

    if (!activeSorts || activeSorts.length === 0) {
      sortedDataRef.current = dataToSort;
      setIsSorting(false);
      return;
    }

    sortAbortController.current = new AbortController();
    const signal = sortAbortController.current.signal;
    setIsSorting(true);

    sortDataMultiColumnAsync(dataToSort, activeSorts, signal)
      .then((sortedData) => {
        if (!signal.aborted) {
          sortedDataRef.current = sortedData;
          setIsSorting(false);
          setSortVersion(prev => prev + 1);
        }
      })
      .catch(() => {
        if (!signal.aborted) {
          setIsSorting(false);
        }
      });

    return () => {
      sortAbortController.current?.abort();
    };
  }, [sorts, tempSorts, isEditingToolbar, originalData, filteredData, sortDataMultiColumnAsync]);

  const headerStructure = useMemo(() => {
    if (!tableColumns.length) return { headerRows: [], leafColumns: [] };

    const leafColumns = visibleColumns.filter(col => !col.hasSubColumns && (col.visible !== false));

    const maxLevel = tableColumns.length > 0
      ? Math.max(...tableColumns.map(col => col.level || 0))
      : 0;

    if (maxLevel === 0) {
      return {
        headerRows: [{ columns: leafColumns.map(col => ({ ...col, rowspan: 1, colSpan: 1 })) }],
        leafColumns,
        totalRows: 1
      };
    }

    const getAncestors = (column) => {
      const ancestors = [];
      let current = column;
      while (current && current.parentKey) {
        const parent = visibleColumns.find(col => col.key === current.parentKey);
        if (parent) {
          ancestors.unshift(parent);
          current = parent;
        } else {
          break;
        }
      }
      return ancestors;
    };

    const countLeafColumns = (parentKey) => {
      const directChildren = visibleColumns.filter(
        col => col.parentKey === parentKey && (col.visible !== false)
      );

      let count = 0;
      directChildren.forEach(child => {
        if (child.hasSubColumns) {
          count += countLeafColumns(child.key);
        } else {
          count += 1;
        }
      });
      return count;
    };

    const headerRows = [];

    const leafPositionMap = new Map();
    leafColumns.forEach((col, index) => {
      leafPositionMap.set(col.key, index);
    });

    const getColumnPosition = (column) => {
      if (!column.hasSubColumns) {
        return leafPositionMap.get(column.key) ?? Infinity;
      }
      const firstLeafChild = leafColumns.find(leaf => {
        const leafAncestors = getAncestors(leaf);
        return leafAncestors.some(anc => anc.key === column.key);
      });
      return firstLeafChild ? leafPositionMap.get(firstLeafChild.key) : Infinity;
    };

    const maxLeafLevel = leafColumns.length > 0
      ? Math.max(...leafColumns.map(col => col.level || 0))
      : 0;

    const totalRows = maxLeafLevel + 1;

    const renderedWithRowspan = new Set();

    for (let level = 0; level <= maxLeafLevel; level++) {
      const rowColumns = [];
      const processedKeys = new Set();

      if (level === maxLeafLevel) {
        // Última linha: apenas colunas folha que NÃO foram renderizadas anteriormente com rowspan > 1
        leafColumns.forEach(col => {
          if (!renderedWithRowspan.has(col.key)) {
            rowColumns.push({ ...col, rowspan: 1, colSpan: 1, position: leafPositionMap.get(col.key) });
          }
        });
      } else {
        // Para linhas intermediárias, construir baseado nas colunas folha na ordem
        if (level === 0) {
          // Linha 0: colunas pai do nível 0 e colunas normais (sem pai)
          leafColumns.forEach(leafCol => {
            const ancestors = getAncestors(leafCol);
            const ancestorAtLevel = ancestors.find(anc => anc.level === level);

            if (ancestorAtLevel && !processedKeys.has(ancestorAtLevel.key)) {
              // Esta é uma coluna pai do nível 0 - aparece apenas nesta linha (rowspan=1)
              const colSpan = countLeafColumns(ancestorAtLevel.key);
              rowColumns.push({
                ...ancestorAtLevel,
                rowspan: 1, // Colunas pai aparecem apenas na sua linha
                colSpan,
                isParent: true,
                position: getColumnPosition(ancestorAtLevel)
              });
              processedKeys.add(ancestorAtLevel.key);
            } else if (!leafCol.parentKey && !processedKeys.has(leafCol.key)) {
              // Coluna normal (sem pai) - se estende por todas as linhas
              rowColumns.push({
                ...leafCol,
                rowspan: totalRows,
                colSpan: 1,
                isNormal: true,
                position: leafPositionMap.get(leafCol.key)
              });
              processedKeys.add(leafCol.key);
              // Marcar como renderizada com rowspan > 1 para não aparecer na última linha
              renderedWithRowspan.add(leafCol.key);
            }
          });
        } else {
          // Linhas intermediárias (level > 0): apenas subcolunas intermediárias deste nível
          visibleColumns.forEach(col => {
            if (col.visible === false) return;
            if (col.level !== level) return;

            // Se é uma folha (sem subcolunas), não deve aparecer aqui, apenas na última linha
            if (!col.hasSubColumns) return;

            if (!processedKeys.has(col.key)) {
              const colSpan = countLeafColumns(col.key);
              const depthBelow = maxLeafLevel - level;
              // Subcolunas intermediárias aparecem apenas na sua linha (rowspan=1)
              const rowspan = 1;

              rowColumns.push({
                ...col,
                rowspan,
                colSpan,
                isSubColumn: true,
                position: getColumnPosition(col)
              });
              processedKeys.add(col.key);
            }
          });

          leafColumns.forEach(leafCol => {
            if (leafCol.level === level && leafCol.level < maxLeafLevel && !processedKeys.has(leafCol.key)) {
              // Esta é uma folha que aparece em uma linha intermediária (não é do nível máximo)
              const depthBelow = maxLeafLevel - level;
              const rowspan = depthBelow > 0 ? depthBelow + 1 : 1;

              rowColumns.push({
                ...leafCol,
                rowspan,
                colSpan: 1,
                isSubColumn: true,
                position: leafPositionMap.get(leafCol.key)
              });
              processedKeys.add(leafCol.key);
              // Marcar como renderizada com rowspan > 1 para não aparecer na última linha
              renderedWithRowspan.add(leafCol.key);
            }
          });
        }

        rowColumns.sort((a, b) => (a.position ?? Infinity) - (b.position ?? Infinity));
      }

      if (rowColumns.length > 0) {
        headerRows.push({ columns: rowColumns, level });
      }
    }
    return { headerRows, leafColumns, totalRows: maxLeafLevel + 1 };
  }, [tableColumns, visibleColumns]);

  const sortedData = useMemo(() => {
    const activeSorts = isEditingToolbar ? tempSorts : sorts;
    const dataSource = filteredData.length > 0 || (isEditingToolbar ? tempFilters : filters).length > 0 || debouncedSearchTerm.trim() !== ''
      ? filteredData
      : originalData;

    if (!activeSorts || activeSorts.length === 0 || dataSource.length === 0) {
      return dataSource.slice((currentPage - 1) * itensPerPage, currentPage * itensPerPage);
    }

    const hasValidSortedData = sortedDataRef.current.length > 0 && sortedDataRef.current.length === dataSource.length;

    return hasValidSortedData
      ? sortedDataRef.current.slice((currentPage - 1) * itensPerPage, currentPage * itensPerPage)
      : dataSource.slice((currentPage - 1) * itensPerPage, currentPage * itensPerPage);
  }, [originalData, filteredData, filters, tempFilters, sorts, tempSorts, isEditingToolbar, isSorting, sortVersion, currentPage, itensPerPage, sortedDataRef, debouncedSearchTerm]);

  const fullDataForGrouping = useMemo(() => {
    const activeSorts = isEditingToolbar ? tempSorts : sorts;
    const dataSource = filteredData.length > 0 || (isEditingToolbar ? tempFilters : filters).length > 0 || debouncedSearchTerm.trim() !== ''
      ? filteredData
      : originalData;

    if (!dataSource || dataSource.length === 0) return [];
    if (!activeSorts || activeSorts.length === 0) return dataSource;

    const hasValidSortedData = sortedDataRef.current.length > 0 && sortedDataRef.current.length === dataSource.length;
    return hasValidSortedData ? sortedDataRef.current : dataSource;
  }, [originalData, filteredData, filters, tempFilters, sorts, tempSorts, isEditingToolbar, sortedDataRef, debouncedSearchTerm]);

  // ── Selection logic ──

  const selectionMode = mergedOptions.selectionMode ?? 'multiple';

  const toggleRowSelection = useCallback((item) => {
    const key = getRowKey(item);
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (selectionMode === 'single') {
        next.clear();
      }
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, [getRowKey, selectionMode]);


  useEffect(() => {
    if (!mergedOptions.selectable || !onSelectionChangeRef.current) return;
    const selected = originalData.filter(item => selectedKeys.has(getRowKey(item)));
    onSelectionChangeRef.current(selected);
  }, [selectedKeys, mergedOptions.selectable, originalData, getRowKey]);

  useEffect(() => {
    if (!mergedOptions.selectable || !mergedOptions.selectionRef) return;
    const ref = mergedOptions.selectionRef;
    const mode = mergedOptions.selectionMode ?? 'multiple';
    ref.current = {
      select(keys) {
        if (keys === 'all') {
          if (mode === 'single') {
            const firstKey = originalData.length > 0 ? getRowKey(originalData[0]) : null;
            setSelectedKeys(firstKey != null ? new Set([firstKey]) : new Set());
          } else {
            setSelectedKeys(new Set(originalData.map(getRowKey)));
          }
        } else {
          const arr = Array.isArray(keys) ? keys : [keys];
          setSelectedKeys(prev => {
            const next = new Set(prev);
            arr.forEach(k => next.add(String(k)));
            return next;
          });
        }
      },
      deselect(keys) {
        if (keys === 'all') {
          setSelectedKeys(new Set());
        } else {
          const arr = Array.isArray(keys) ? keys : [keys];
          setSelectedKeys(prev => {
            const next = new Set(prev);
            arr.forEach(k => next.delete(String(k)));
            return next;
          });
        }
      },
      getSelected() {
        return originalData.filter(item => selectedKeys.has(getRowKey(item)));
      },
    };
  }, [mergedOptions.selectable, mergedOptions.selectionRef, mergedOptions.selectionMode, originalData, selectedKeys, getRowKey]);

  // ── End selection logic ──

  // ── Edit logic ──

  const handleCellClick = useCallback((row, column, rowIndex, colIndex) => {
    if (!mergedOptions.editable) return;
    const rowKey = getRowKey(row);
    setEditingCell({ rowKey, colKey: column.key, rowIndex, colIndex });
  }, [mergedOptions.editable, getRowKey]);

  const clickDelayTimerRef = useRef(null);
  const clickPendingRef = useRef(null);
  const CLICK_DELAY_MS = 300;

  const handleCellClickWithDbl = useCallback((event) => {
    const { row, column, cell, rowIndex, colIndex } = event;
    const cellKey = `${rowIndex}-${colIndex}`;
    const now = Date.now();

    const pending = clickPendingRef.current;
    if (pending && pending.cellKey === cellKey && now - pending.time < CLICK_DELAY_MS) {
      if (clickDelayTimerRef.current) clearTimeout(clickDelayTimerRef.current);
      clickPendingRef.current = null;
      mergedOptions.onDoubleClick?.(event);
      return;
    }

    if (pending) {
      if (clickDelayTimerRef.current) clearTimeout(clickDelayTimerRef.current);
      mergedOptions.onClick?.(pending.event);
      if (mergedOptions.editable && pending.event.column?.editable) {
        handleCellClick(pending.event.row, pending.event.column, pending.event.rowIndex, pending.event.colIndex);
      }
    }

    const timerId = setTimeout(() => {
      clickPendingRef.current = null;
      mergedOptions.onClick?.(event);
      if (mergedOptions.editable && column?.editable) {
        handleCellClick(row, column, rowIndex, colIndex);
      }
    }, CLICK_DELAY_MS);

    clickDelayTimerRef.current = timerId;
    clickPendingRef.current = { cellKey, time: now, event };
  }, [mergedOptions.onClick, mergedOptions.onDoubleClick, mergedOptions.editable, handleCellClick]);

  const handleCellCommit = useCallback((row, colKey, newValue) => {
    const rowKey = getRowKey(row);
    const originalValue = row[colKey];

    const valueChanged = Array.isArray(originalValue) || Array.isArray(newValue)
      ? JSON.stringify(originalValue) !== JSON.stringify(newValue)
      : !Object.is(originalValue, newValue);

    if (!valueChanged) {
      setEditingCell(null);
      return;
    }

    setEditedData(prev => {
      const next = new Map(prev);
      const existing = next.get(rowKey) || {};
      next.set(rowKey, { ...existing, [colKey]: newValue });
      return next;
    });
    setEditedKeys(prev => {
      const next = new Set(prev);
      next.add(rowKey);
      return next;
    });
    setEditingCell(null);

    if (onEditChangeRef.current) {
      const allData = originalData.map(item => {
        const key = getRowKey(item);
        const edits = key === rowKey
          ? { ...(editedData.get(key) || {}), [colKey]: newValue }
          : editedData.get(key);
        return edits ? { ...item, ...edits } : item;
      });
      const changedRow = { ...row, [colKey]: newValue };
      onEditChangeRef.current(allData, changedRow, colKey);
    }
  }, [getRowKey, originalData, editedData]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
  }, []);

  const handleEditNavigate = useCallback((direction, rowIndex, colIndex) => {
    const leafColumns = headerStructure.leafColumns.filter(col => col.visible !== false && col.editable);
    if (leafColumns.length === 0) {
      setEditingCell(null);
      return;
    }

    const allVisibleLeafs = headerStructure.leafColumns.filter(col => col.visible !== false);
    const editableIndices = allVisibleLeafs
      .map((col, idx) => col.editable ? idx : -1)
      .filter(idx => idx >= 0);

    if (editableIndices.length === 0) {
      setEditingCell(null);
      return;
    }

    const currentEditableIdx = editableIndices.indexOf(colIndex);
    let nextRowIndex = rowIndex;
    let nextColEditableIdx = currentEditableIdx >= 0 ? currentEditableIdx : 0;

    switch (direction) {
      case 'down':
        nextRowIndex = rowIndex + 1;
        break;
      case 'up':
        nextRowIndex = rowIndex - 1;
        break;
      case 'right':
        nextColEditableIdx = currentEditableIdx + 1;
        if (nextColEditableIdx >= editableIndices.length) {
          nextColEditableIdx = 0;
          nextRowIndex = rowIndex + 1;
        }
        break;
      case 'left':
        nextColEditableIdx = currentEditableIdx - 1;
        if (nextColEditableIdx < 0) {
          nextColEditableIdx = editableIndices.length - 1;
          nextRowIndex = rowIndex - 1;
        }
        break;
      default:
        break;
    }

    if (nextRowIndex < 0 || nextRowIndex >= sortedData.length) {
      setEditingCell(null);
      return;
    }

    const nextColIndex = editableIndices[nextColEditableIdx];
    const nextColumn = allVisibleLeafs[nextColIndex];
    const nextRow = sortedData[nextRowIndex];
    if (!nextRow || !nextColumn) {
      setEditingCell(null);
      return;
    }

    const nextRowKey = getRowKey(nextRow);
    setEditingCell({ rowKey: nextRowKey, colKey: nextColumn.key, rowIndex: nextRowIndex, colIndex: nextColIndex });
  }, [headerStructure, sortedData, getRowKey]);

  useEffect(() => {
    if (!mergedOptions.editable || !mergedOptions.editRef) return;
    const ref = mergedOptions.editRef;
    ref.current = {
      getData() {
        return originalData.map(item => {
          const key = getRowKey(item);
          const edits = editedData.get(key);
          return edits ? { ...item, ...edits } : { ...item };
        });
      },
      getEditedRows() {
        return originalData
          .filter(item => editedKeys.has(getRowKey(item)))
          .map(item => {
            const key = getRowKey(item);
            const edits = editedData.get(key) || {};
            return {
              original: item,
              edited: { ...item, ...edits },
              changes: edits,
            };
          });
      },
      resetEdits(keys) {
        if (!keys) {
          setEditedData(new Map());
          setEditedKeys(new Set());
        } else {
          const arr = Array.isArray(keys) ? keys : [keys];
          setEditedData(prev => {
            const next = new Map(prev);
            arr.forEach(k => next.delete(String(k)));
            return next;
          });
          setEditedKeys(prev => {
            const next = new Set(prev);
            arr.forEach(k => next.delete(String(k)));
            return next;
          });
        }
        setEditingCell(null);
      },
      setRowStatus(keys, status, columns) {
        const arr = Array.isArray(keys) ? keys : [keys];
        const cols = columns
          ? (Array.isArray(columns) ? columns : [columns])
          : undefined;
        setRowStatuses(prev => {
          const next = new Map(prev);
          arr.forEach(k => {
            next.set(String(k), { status, columns: cols });
          });
          return next;
        });
      },
      clearRowStatus(keys) {
        if (!keys) {
          setRowStatuses(new Map());
        } else {
          const arr = Array.isArray(keys) ? keys : [keys];
          setRowStatuses(prev => {
            const next = new Map(prev);
            arr.forEach(k => next.delete(String(k)));
            return next;
          });
        }
      },
    };
  }, [mergedOptions.editable, mergedOptions.editRef, originalData, editedData, editedKeys, getRowKey]);

  const displayData = useMemo(() => {
    if (!mergedOptions.editable || editViewFilter === 'all') return sortedData;
    if (editViewFilter === 'edited') {
      return sortedData.filter(item => editedKeys.has(getRowKey(item)));
    }
    return sortedData.filter(item => {
      const status = rowStatuses.get(getRowKey(item));
      return status?.status === editViewFilter;
    });
  }, [sortedData, editViewFilter, editedKeys, rowStatuses, getRowKey, mergedOptions.editable]);

  const handleRevertEdits = useCallback(() => {
    setEditedData(new Map());
    setEditedKeys(new Set());
    setEditingCell(null);
    setEditViewFilter('all');
  }, []);

  const handleSaveEdits = useCallback(() => {
    if (!onSaveRef.current) return;
    const allData = originalData.map(item => {
      const key = getRowKey(item);
      const edits = editedData.get(key);
      return edits ? { ...item, ...edits } : { ...item };
    });
    const editedRows = originalData
      .filter(item => editedKeys.has(getRowKey(item)))
      .map(item => {
        const key = getRowKey(item);
        const edits = editedData.get(key) || {};
        return { original: item, edited: { ...item, ...edits }, changes: edits };
      });
    onSaveRef.current(allData, editedRows);
  }, [originalData, editedData, editedKeys, getRowKey]);

  // ── End edit logic ──

  const groupedBodyItems = useMemo(() => {
    if (!groupByColumnKey || fullDataForGrouping.length === 0) return null;
    const column = headerStructure.leafColumns.find(c => c.key === groupByColumnKey);
    const columnLabel = column ? (column.label ?? column.key) : groupByColumnKey;
    const EMPTY_GROUP = '__empty__';
    const getGroupKey = (value) => (value == null || value === '') ? EMPTY_GROUP : value;

    const order = [];
    const map = new Map();
    for (const item of fullDataForGrouping) {
      const raw = item[groupByColumnKey];
      const key = getGroupKey(raw);
      const groupLabel = key === EMPTY_GROUP ? `Sem ${columnLabel}` : String(raw);
      if (!map.has(key)) {
        order.push(key);
        map.set(key, { groupLabel, rows: [] });
      }
      map.get(key).rows.push(item);
    }

    return order.map((groupKey) => {
      const { groupLabel, rows } = map.get(groupKey);
      return { groupKey, groupLabel, rows };
    });
  }, [fullDataForGrouping, groupByColumnKey, headerStructure.leafColumns]);

  const [groupCurrentPage, setGroupCurrentPage] = useState({});
  const [collapsedGroupKeys, setCollapsedGroupKeys] = useState({});
  const [groupItemsPerPage, setGroupItemsPerPage] = useState({});

  const groupItemsPerPageOptions = [5, 10, 25, 50];
  const defaultItemsPerGroup = 5;

  useEffect(() => {
    setGroupCurrentPage({});
    setCollapsedGroupKeys({});
    setGroupItemsPerPage({});
  }, [groupByColumnKey]);

  const handleGroupItemsPerPageChange = useCallback((groupKey, newSize) => {
    setGroupItemsPerPage((prev) => ({ ...prev, [groupKey]: newSize }));
    setGroupCurrentPage((prev) => ({ ...prev, [groupKey]: 1 }));
  }, []);

  const getVisiblePageKeys = useCallback(() => {
    if (groupedBodyItems != null && groupedBodyItems.length > 0) {
      const keys = [];
      for (const group of groupedBodyItems) {
        if (collapsedGroupKeys[group.groupKey]) continue;
        const perGroup = groupItemsPerPage[group.groupKey] ?? defaultItemsPerGroup;
        const page = groupCurrentPage[group.groupKey] ?? 1;
        const visibleRows = group.rows.slice((page - 1) * perGroup, page * perGroup);
        keys.push(...visibleRows.map(getRowKey));
      }
      return keys;
    }
    return sortedData.map(getRowKey);
  }, [groupedBodyItems, collapsedGroupKeys, groupItemsPerPage, groupCurrentPage, defaultItemsPerGroup, sortedData, getRowKey]);

  const selectionState = useMemo(() => {
    if (!mergedOptions.selectable) return { allPageSelected: false, allTableSelected: false, someSelected: false };
    const pageKeys = getVisiblePageKeys();
    const allKeys = fullDataForGrouping.map(getRowKey);
    const allPageSelected = pageKeys.length > 0 && pageKeys.every(k => selectedKeys.has(k));
    const allTableSelected = allKeys.length > 0 && allKeys.every(k => selectedKeys.has(k));
    const someSelected = selectedKeys.size > 0;
    return { allPageSelected, allTableSelected, someSelected };
  }, [mergedOptions.selectable, getVisiblePageKeys, fullDataForGrouping, selectedKeys, getRowKey, groupedBodyItems]);

  const handleHeaderCheckboxClick = useCallback(() => {
    const pageKeys = getVisiblePageKeys();
    const allKeys = fullDataForGrouping.map(getRowKey);
    const allPageSelected = pageKeys.length > 0 && pageKeys.every(k => selectedKeys.has(k));
    const allTableSelected = allKeys.length > 0 && allKeys.every(k => selectedKeys.has(k));

    if (!allPageSelected) {
      setSelectedKeys(prev => {
        const next = new Set(prev);
        pageKeys.forEach(k => next.add(k));
        return next;
      });
    } else if (!allTableSelected) {
      setSelectedKeys(new Set(allKeys));
    } else {
      setSelectedKeys(new Set());
    }
  }, [getVisiblePageKeys, fullDataForGrouping, selectedKeys, getRowKey]);

  useEffect(() => {
    const activeFilters = isEditingToolbar ? tempFilters : filters;
    const dataSource = filteredData.length > 0 || activeFilters.length > 0 || debouncedSearchTerm.trim() !== ''
      ? filteredData
      : originalData;
    setTotalItems(dataSource.length);
    setTotalPages(Math.ceil(dataSource.length / itensPerPage));
  }, [originalData, filteredData, filters, tempFilters, isEditingToolbar, itensPerPage, debouncedSearchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itensPerPage, debouncedSearchTerm])

  useEffect(() => {
    const calculateMaxWidth = () => {
      if (containerRef.current) {
        const parentElement = containerRef.current.parentElement;
        if (parentElement) {
          const computedStyle = window.getComputedStyle(parentElement);
          const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
          const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
          const parentWidth = parentElement.offsetWidth - paddingLeft - paddingRight;
          setMaxWidth(parentWidth);
        }
      }
    };

    calculateMaxWidth();
    
    const timeoutId = setTimeout(() => {
      calculateMaxWidth();
    }, 100);

    const resizeObserver = new ResizeObserver(() => {
      calculateMaxWidth();
    });

    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    window.addEventListener('resize', calculateMaxWidth);

    return () => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', calculateMaxWidth);
    };
  }, []);

  useEffect(() => {
    const checkScroll = () => {
      if (tableWrapperRef.current) {
        const hasVerticalScroll = tableWrapperRef.current.scrollHeight > tableWrapperRef.current.clientHeight;
        const hasHorizontalScroll = tableWrapperRef.current.scrollWidth > tableWrapperRef.current.clientWidth;
        setHasScroll(hasVerticalScroll || hasHorizontalScroll);
      }
    };

    checkScroll();
    
    const resizeObserver = new ResizeObserver(checkScroll);
    if (tableWrapperRef.current) {
      resizeObserver.observe(tableWrapperRef.current);
    }

    const scrollHandler = () => checkScroll();
    const wrapperEl = tableWrapperRef.current;
    if (wrapperEl) {
      wrapperEl.addEventListener('scroll', scrollHandler);
    }

    return () => {
      resizeObserver.disconnect();
      if (wrapperEl) {
        wrapperEl.removeEventListener('scroll', scrollHandler);
      }
    };
  }, [sortedData, originalData, filters, tempFilters, visibleColumns, groupedBodyItems, groupCurrentPage, collapsedGroupKeys]);

  const renderTableHead = () => (
    mergedOptions.showHeader && (
      <thead className={`${styles.tabela__header} ${headerStructure.headerRows.length > 1 ? styles.isNastedHeader : ''}`}>
        {headerStructure.leafColumns.length === 0 ? (
          <tr className={styles.tabela__header__row}>
            {mergedOptions.selectable && (
              <th className={styles.tabela__selection__headerCell} />
            )}
            <th colSpan={1} className={styles.tabela__header__cell} style={{ width: '100%' }}>
              <span className={styles.tabela__header__label}>Nenhuma coluna encontrada/selecionada</span>
            </th>
          </tr>
        ) : headerStructure.headerRows && headerStructure.headerRows.map((headerRow, rowIndex) => (
          <tr className={styles.tabela__header__row} key={`header-row-${rowIndex}`}>
            {mergedOptions.selectable && rowIndex === 0 && (
              <th
                className={styles.tabela__selection__headerCell}
                rowSpan={headerStructure.headerRows.length}
              >
                {selectionMode !== 'single' && (
                  <button
                    type="button"
                    className={`${styles.tabela__selection__headerBtn} ${
                      selectionState.allTableSelected
                        ? styles.tabela__selection__headerBtn__allSelected
                        : selectionState.someSelected
                          ? styles.tabela__selection__headerBtn__partial
                          : ''
                    }`}
                    onClick={handleHeaderCheckboxClick}
                    aria-label={
                      selectionState.allTableSelected
                        ? 'Remover todas as seleções'
                        : selectionState.allPageSelected
                          ? 'Selecionar todas as linhas da tabela'
                          : 'Selecionar todas as linhas da página'
                    }
                  >
                    <i className={`far ${
                      selectionState.allTableSelected
                        ? 'fa-square-check'
                        : selectionState.someSelected
                          ? 'fa-square-minus'
                          : 'fa-square'
                    }`} />
                  </button>
                )}
              </th>
            )}
            {headerRow.columns.map((column) => {
              const colSpan = column.colSpan || 1;
              const rowspan = column.rowspan || 1;
              const cellClasses = [
                styles.tabela__header__cell,
                column.level > 0 ? styles.tabela__header__intern__cell : '',
                column.sortable && !column.isParent ? styles.tabela__header__cell__sortable : '',
                column.className || ''
              ].filter(Boolean).join(' ');
              const cellStyles = {
                minWidth: typeof mergedOptions.columnMinWidth === 'number' ? `${mergedOptions.columnMinWidth}px` : 'auto',
                width: column?.width == 'auto' ? 'auto' : `${column?.width}%`,
                textAlign: column?.align || 'left',
                ...column?.style,
              };
              return (
                <th
                  key={column.key}
                  className={cellClasses}
                  style={cellStyles}
                  colSpan={colSpan > 1 ? colSpan : undefined}
                  rowSpan={rowspan > 1 ? rowspan : undefined}
                >
                  <span className={styles.tabela__header__label}>{column.label}</span>
                  {column.sortable && !column.isParent && (() => {
                    const activeSorts = isEditingToolbar ? tempSorts : sorts;
                    const sortItem = activeSorts.find(s => s.key === column.key);
                    return (
                      <i
                        className={`fas ${sortItem ? sortItem.direction === 'asc' ? 'fa-arrow-up' : 'fa-arrow-down' : ''} ${styles.tabela__header__sortable__icon}`}
                      />
                    );
                  })()}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
    )
  );

  const hasCalculationRow =
    currentTableView === 'grid' &&
    Object.keys(calculationByColumn).some(
      (key) =>
        calculationByColumn[key]?.calculationId &&
        calculationByColumn[key].calculationId !== 'none' &&
        (calculationByColumn[key].calculationId !== 'pctByGroup' || calculationByColumn[key].groupValue !== undefined)
    );

  const handleApplyCalculation = useCallback((columnKey, config) => {
    setCalculationByColumn((prev) => {
      const next = { ...prev };
      if (config == null || config.calculationId === 'none') {
        delete next[columnKey];
      } else {
        next[columnKey] = config;
      }
      return next;
    });
  }, []);

  const openCalculationSubmenu = useCallback(
    (columnKey, buttonRef) => {
      if (!buttonRef?.current || typeof buttonRef.current.getBoundingClientRect !== 'function') return;
      const rawPosition = calculateMenuPosition(buttonRef.current, {
        menuWidth: 280,
        menuHeight: 360,
        preferredPosition: 'top-start',
        offset: 0,
        padding: 16,
      });
      const portalContainer = getPortalContainerResolved();
      const position = positionToPortalCoordinates(rawPosition, portalContainer);
      const newSessionId = Date.now() + Math.random();
      currentSubMenuSessionRef.current = newSessionId;
      setSubMenuState({
        isOpen: true,
        type: 'calculation-submenu',
        position: { ...position },
        sessionId: newSessionId,
        columnKey,
      });
    },
    [calculateMenuPosition, getPortalContainerResolved, positionToPortalCoordinates]
  );

  const tableContent = useMemo(() => {
    switch (currentTableView) {
      case 'grid':
        return (
          <GridView
            groupedBodyItems={groupedBodyItems}
            sortedData={displayData}
            headerStructure={headerStructure}
            renderFlags={renderFlags}
            calculationByColumn={calculationByColumn}
            fullDataForGrouping={fullDataForGrouping}
            hasCalculationRow={hasCalculationRow}
            hasScroll={hasScroll}
            visibleFooter={visibleFooter}
            isSorting={isSorting}
            isLoading={isLoading}
            renderTableHead={renderTableHead}
            tableWrapperRef={tableWrapperRef}
            tableBodyRef={tableBodyRef}
            groupCurrentPage={groupCurrentPage}
            collapsedGroupKeys={collapsedGroupKeys}
            setCollapsedGroupKeys={setCollapsedGroupKeys}
            groupItemsPerPage={groupItemsPerPage}
            setGroupCurrentPage={setGroupCurrentPage}
            groupItemsPerPageOptions={groupItemsPerPageOptions}
            defaultItemsPerGroup={defaultItemsPerGroup}
            handleGroupItemsPerPageChange={handleGroupItemsPerPageChange}
            openCalculationSubmenu={openCalculationSubmenu}
            selectable={mergedOptions.selectable}
            selectionMode={selectionMode}
            selectedKeys={selectedKeys}
            getRowKey={getRowKey}
            toggleRowSelection={toggleRowSelection}
            editable={mergedOptions.editable}
            editingCell={editingCell}
            editedData={editedData}
            rowStatuses={rowStatuses}
            onCellClickWithDbl={(mergedOptions.onClick || mergedOptions.onDoubleClick || mergedOptions.editable) ? handleCellClickWithDbl : undefined}
            onCellClick={handleCellClick}
            onCellCommit={handleCellCommit}
            onCellCancel={handleCellCancel}
            onEditNavigate={handleEditNavigate}
          />
        );
      case 'list':
        return <ListView sortedData={sortedData} headerStructure={headerStructure} />;
      case 'kanban':
        return <KanbanView sortedData={sortedData} headerStructure={headerStructure} />;
      case 'calendar':
        return <CalendarView sortedData={sortedData} headerStructure={headerStructure} />;
      default:
        return null;
    }
  }, [currentTableView, visibleColumns, displayData, sortedData, groupedBodyItems, groupByColumnKey, groupCurrentPage, collapsedGroupKeys, groupItemsPerPage, renderFlags, sorts, tempSorts, isEditingToolbar, isSorting, isLoading, headerStructure, hasCalculationRow, calculationByColumn, fullDataForGrouping, openCalculationSubmenu, hasScroll, visibleFooter, renderTableHead, handleGroupItemsPerPageChange, mergedOptions.selectable, selectionMode, selectedKeys, getRowKey, toggleRowSelection, mergedOptions.editable, editingCell, editedData, rowStatuses, handleCellClickWithDbl, handleCellClick, handleCellCommit, handleCellCancel, handleEditNavigate]);

  const footerRowRef = useRef(null);
  const [footerCellMeta, setFooterCellMeta] = useState({});

  useEffect(() => {
    const row = footerRowRef.current;
    if (!row) return;

    const computeLayout = () => {
      const cells = Array.from(row.children);
      if (cells.length === 0) { setFooterCellMeta({}); return; }

      const visualRows = [];
      let currentRowTop = null;
      let currentRow = [];
      for (const cell of cells) {
        if (cell.offsetTop !== currentRowTop) {
          if (currentRow.length > 0) visualRows.push(currentRow);
          currentRow = [cell];
          currentRowTop = cell.offsetTop;
        } else {
          currentRow.push(cell);
        }
      }
      if (currentRow.length > 0) visualRows.push(currentRow);

      const firstRow = visualRows[0];
      const lastRow = visualRows[visualRows.length - 1];
      const meta = {};

      for (let ri = 0; ri < visualRows.length; ri++) {
        for (let ci = 0; ci < visualRows[ri].length; ci++) {
          const key = visualRows[ri][ci].dataset.key;
          if (!key) continue;
          meta[key] = {
            topLeft: ri === 0 && ci === 0,
            topRight: ri === 0 && ci === firstRow.length - 1,
            bottomLeft: ri === visualRows.length - 1 && ci === 0,
            bottomRight: ri === visualRows.length - 1 && ci === lastRow.length - 1,
            notFirstInRow: ci > 0,
            notFirstRow: ri > 0,
          };
        }
      }

      setFooterCellMeta(prev => {
        if (JSON.stringify(prev) === JSON.stringify(meta)) return prev;
        return meta;
      });
    };

    const observer = new ResizeObserver(computeLayout);
    observer.observe(row);
    computeLayout();

    return () => observer.disconnect();
  }, [visibleFooter]);

  const tableFooterContent = useMemo(() => {
    switch (currentTableView) {
      case 'grid':
        return (
          <div className={`${styles.tabela__footer} ${hasCalculationRow ? styles.hasCalculationFooter : ''}`}>
            {visibleFooter.length > 0 && (
              <div className={styles.tabela__footer__row} ref={footerRowRef}>
                {visibleFooter.map((footerItem) => {
                  const content = footerItem.render && typeof footerItem.render === 'function' ? footerItem.render(sortedData, footerItem) : footerItem.value || '';
                  const meta = footerCellMeta[footerItem.key] || {};
                  const cellClasses = [
                    styles.tabela__footer__cell,
                    footerItem.className || '',
                    meta.topLeft && styles.footerCell__topLeft,
                    meta.topRight && styles.footerCell__topRight,
                    meta.bottomLeft && styles.footerCell__bottomLeft,
                    meta.bottomRight && styles.footerCell__bottomRight,
                    meta.notFirstInRow && styles.footerCell__notFirstInRow,
                    meta.notFirstRow && styles.footerCell__notFirstRow,
                  ].filter(Boolean).join(' ');
                  return (
                    <div key={footerItem.key} data-key={footerItem.key} className={cellClasses} style={footerItem.style}>
                      {footerItem.label ? footerItem.label + ' ' : ''}{content}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'list':
      case 'kanban':
      case 'calendar':
      default:
        return null;
    }
  }, [currentTableView, visibleFooter, footerCellMeta, hasCalculationRow, sortedData]);

  const paginationContent = useMemo(() => {
    return (
      <div className={styles.tabela__pagination}>
        <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} itemsPerPageOptions={mergedOptions.itensPerPageOptions} itemsPerPage={itensPerPage} onItemsPerPageChange={setItensPerPage} />
      </div>
    );
  }, [totalPages, currentPage, mergedOptions.itensPerPageOptions, itensPerPage, setItensPerPage]);

  const handleSearchToggle = useCallback((e) => {
    const searchEl = searchInputRef.current;
    const clickedOnInput = e.target === searchEl ||
                          searchEl?.contains?.(e.target);

    if (clickedOnInput) {
      return;
    }

    const isCurrentlyFocused = document.activeElement === searchEl;
    const wasFocused = isCurrentlyFocused || wasSearchFocusedRef.current;

    if (wasFocused) {
      searchEl?.blur?.();
      wasSearchFocusedRef.current = false;
    } else {
      searchInputRef.current?.focus?.();
      wasSearchFocusedRef.current = true;
    }
  }, []);

  const toolbarContent = useMemo(() => {
    return (
      <div className={styles.tabela__toolbar}>
        <div className={`${styles.tabela__toolbar__top} ${sorts.length > 0 || filters.length > 0 || isEditingToolbar ? styles.tabela__toolbar__top_with_buttons : ''}`}>
          <div className={styles.tabela__toolbar__top__left}>
            {mergedOptions.showTableViews && (
              <div ref={viewsContainerRef} className={styles.tabela__toolbar__tableViews}>
                {/* <div ref={viewIndicatorRef} className={styles.tabela__toolbar__tableViews__indicator} /> */}
                {Object.values(TABLE_VIEWS).filter(view => mergedOptions.tableViews.includes(view.key)).map((view) => (
                  <button
                    key={view.key}
                    type="button"
                    className={`${styles.tabela__toolbar__tableViews__button} ${currentTableView === view.key ? styles.tabela__toolbar__tableViews__button__active : ''}`}
                    onClick={() => setCurrentTableView(view.key)}
                    aria-label={view.label}
                    aria-pressed={currentTableView === view.key}
                    data-view-active={currentTableView === view.key ? 'true' : 'false'}
                    title={view.label}
                  >
                    <i className={view.icon} />
                    <span className={styles.tabela__toolbar__tableViews__button__label}>{view.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={styles.tabela__toolbar__top__right}>
            {mergedOptions.showSearch && (
              <div 
                ref={searchContainerRef}
                className={`${styles.tabela__toolbar__search} ${searchTerm ? styles.tabela__toolbar__search_expanded : ''}`}
                onClick={handleSearchToggle}
              >
                <i className={`far fa-search ${styles.tabela__toolbar__search__icon}`} />
                <input
                  ref={searchInputRef}
                  className={styles.tabela__toolbar__search__input}
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    wasSearchFocusedRef.current = true;
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      const searchEl = searchInputRef.current;
                      if (document.activeElement !== searchEl) {
                        wasSearchFocusedRef.current = false;
                      }
                    }, 100);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  title="Pesquisar em todas as colunas visíveis"
                />
              </div>
            )}
            {mergedOptions.showSearch && (mergedOptions.showSorts || mergedOptions.showFilters || mergedOptions.showSettings) && (
              <span className={styles.tabela__toolbar__top__right__divider} aria-hidden="true" />
            )}
            {(mergedOptions.showSorts || mergedOptions.showFilters || mergedOptions.showSettings) && (
              <div className={styles.tabela__toolbar__actionGroup}>
                {mergedOptions.showSorts && (
                  <button
                    ref={toolbarSortButtonRef}
                    type="button"
                    className={styles.tabela__toolbar__button}
                    onClick={() => openMenu('sort-selection', toolbarSortButtonRef, { preferredPosition: 'bottom-end' })}
                    aria-label="Ordenar colunas"
                    title="Ordenar colunas"
                  >
                    <i className={`far fa-arrow-down-arrow-up ${styles.tabela__toolbar__button__icon}`} />
                  </button>
                )}
                {mergedOptions.showFilters && (
                  <button
                    ref={toolbarFilterButtonRef}
                    type="button"
                    className={styles.tabela__toolbar__button}
                    onClick={() => openMenu('filter-selection', toolbarFilterButtonRef, { preferredPosition: 'bottom-end' })}
                    aria-label="Filtrar dados"
                    title="Filtrar dados"
                  >
                    <i className={`far fa-bars-filter ${styles.tabela__toolbar__button__icon}`} />
                  </button>
                )}
                {mergedOptions.showSettings && (
                  <button
                    ref={toolbarSettingsButtonRef}
                    type="button"
                    className={styles.tabela__toolbar__button}
                    onClick={() => openMenu('settings-menu', toolbarSettingsButtonRef, { preferredPosition: 'bottom-end' })}
                    aria-label="Configurações da tabela"
                    title="Configurações da tabela"
                  >
                    <i className={`far fa-sliders ${styles.tabela__toolbar__button__icon}`} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {(sorts.length > 0 || filters.length > 0 || isEditingToolbar) && (
          <div className={styles.tabela__toolbar__bottom}>
            <div className={styles.tabela__toolbar__bottom__left}>
              {(sorts.length > 0 || tempSorts.length > 0) && (
                <div className={`${styles.tabela__toolbar__bottom__left__first_item} ${filters.length > 0 || tempFilters.length > 0 ? '' : styles.without_border}`}>
                  <button
                    ref={sortButtonRef}
                    type="button"
                    className={`${styles.tabela__toolbar__button} ${styles.tabela__toolbar__button_with_label} ${styles.tabela__toolbar__button_active}`}
                    onClick={() => openMenu('sort-menu', sortButtonRef, { preferredPosition: 'bottom-start' })}
                    title="Editar ordenação ativa"
                  >
                    <i className={`far fa-arrow-down-arrow-up ${styles.tabela__toolbar__button__icon}`} />
                    <span className={styles.tabela__toolbar__button__label}>
                    {(() => {
                      if (isEditingToolbar) {
                        if (tempSorts.length === 0) return '';
                        return tempSorts.length > 1 ? `${tempSorts.length} colunas` : (tempSorts[0]?.label ?? tempSorts[0]?.key ?? '');
                      }
                      if (sorts.length === 0) return '';
                      return sorts.length > 1 ? `${sorts.length} colunas` : (sorts[0]?.label ?? sorts[0]?.key ?? '');
                    })()}
                    </span>
                  </button>
                </div>
              )}
              {(filters.length > 0 || tempFilters.length > 0) && (
                isEditingToolbar ?
                  tempFilters.map((filter) => {
                    return (
                      <button
                        key={filter.key}
                        ref={(el) => {
                          if (el) filterButtonRefs.current.set(filter.key, el);
                          else filterButtonRefs.current.delete(filter.key);
                        }}
                        type="button"
                        className={`${styles.tabela__toolbar__button} ${styles.tabela__toolbar__button_with_label} ${styles.tabela__toolbar__button_active} ${filter.isAdvanced ? styles.advanced : ''}`}
                        onClick={() => {
                          const buttonRef = { current: filterButtonRefs.current.get(filter.key) };
                          handleOpenFilterMenu(filter, buttonRef);
                        }}
                        title="Editar filtro"
                      >
                        <i className={`far ${filter.isAdvanced ? 'fa-layer-group' : 'fa-bars-filter'} ${styles.tabela__toolbar__button__icon}`} />
                        <span className={styles.tabela__toolbar__button__label}>
                          {getFilterDisplayText(filter, visibleColumns)}
                        </span>
                      </button>
                    );
                  }) : filters.map((filter) => {
                    return (
                      <button
                        key={filter.key}
                        ref={(el) => {
                          if (el) filterButtonRefs.current.set(filter.key, el);
                          else filterButtonRefs.current.delete(filter.key);
                        }}
                        type="button"
                        className={`${styles.tabela__toolbar__button} ${styles.tabela__toolbar__button_with_label} ${styles.tabela__toolbar__button_active} ${filter.isAdvanced ? styles.advanced : ''}`}
                        onClick={() => {
                          const buttonRef = { current: filterButtonRefs.current.get(filter.key) };
                          handleOpenFilterMenu(filter, buttonRef);
                        }}
                        title="Editar filtro"
                      >
                        <i className={`far ${filter.isAdvanced ? 'fa-layer-group' : 'fa-bars-filter'} ${styles.tabela__toolbar__button__icon}`} />
                        <span className={styles.tabela__toolbar__button__label}>
                          {getFilterDisplayText(filter, visibleColumns)}
                        </span>
                      </button>
                    );
                  })
              )}
            </div>
            <div className={styles.tabela__toolbar__bottom__right}>
              {isEditingToolbar && (
                <>
                  <button
                    type="button"
                    className={`${styles.tabela__toolbar__button} ${styles.without_border} ${styles.tabela__toolbar__button_with_label}`}
                    onClick={() => {
                      setIsEditingToolbar(false);
                      setTempSorts([]);
                      setTempFilters([]);
                    }}
                    title="Descartar alterações de ordenação e filtros"
                  >
                    <i className={`far fa-rotate-left ${styles.tabela__toolbar__button__icon}`} />
                    <span className={styles.tabela__toolbar__button__label}>Reverter</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.tabela__toolbar__button} ${styles.tabela__toolbar__button_with_label} ${styles.tabela__toolbar__editRow__saveBtn}`}
                    onClick={() => {
                      if (menuState.type === 'sort-menu' && menuState.isOpen) {
                        sortMenuRef.current?.close();
                      }
                      setIsEditingToolbar(false);
                      setSorts([...tempSorts]);
                      setFilters([...tempFilters]);
                      setTempSorts([]);
                      setTempFilters([]);
                    }}
                  >
                    <i className={`far fa-floppy-disk ${styles.tabela__toolbar__button__icon}`} />
                    <span className={styles.tabela__toolbar__button__label}>Salvar</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        {mergedOptions.editable && editedKeys.size > 0 && (
          <div className={styles.tabela__toolbar__editRow}>
            <div className={styles.tabela__toolbar__editRow__left}>
              <span className={styles.tabela__toolbar__editRow__counter}>
                <i className={`far fa-pen-to-square ${styles.tabela__toolbar__editRow__counter__icon}`} />
                {editedKeys.size} {editedKeys.size === 1 ? 'alteração' : 'alterações'}
              </span>
              <div className={styles.tabela__toolbar__editRow__filterGroup}>
                <button
                  type="button"
                  className={`${styles.tabela__toolbar__button} ${styles.tabela__toolbar__button_with_label}`}
                  onClick={() => setEditViewDropdownOpen(prev => !prev)}
                  title="Filtrar linhas por status de edição"
                >
                  <i className={`far fa-eye ${styles.tabela__toolbar__button__icon}`} />
                  <span className={styles.tabela__toolbar__button__label}>
                    {editViewFilter === 'all' ? 'Todas' : editViewFilter === 'edited' ? 'Editadas' : editViewFilter === 'success' ? 'Sucesso' : editViewFilter === 'warning' ? 'Alerta' : 'Erro'}
                  </span>
                  <i className={`far fa-chevron-${editViewDropdownOpen ? 'up' : 'down'} ${styles.tabela__toolbar__editRow__chevron}`} />
                </button>
                {editViewDropdownOpen && (
                  <div className={styles.tabela__toolbar__editRow__dropdown}>
                    <button
                      type="button"
                      className={`${styles.tabela__toolbar__editRow__dropdown__option} ${editViewFilter === 'all' ? styles.tabela__toolbar__editRow__dropdown__optionActive : ''}`}
                      onClick={() => { setEditViewFilter('all'); setEditViewDropdownOpen(false); }}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      className={`${styles.tabela__toolbar__editRow__dropdown__option} ${editViewFilter === 'edited' ? styles.tabela__toolbar__editRow__dropdown__optionActive : ''}`}
                      onClick={() => { setEditViewFilter('edited'); setEditViewDropdownOpen(false); }}
                    >
                      Editadas
                    </button>
                    {[...rowStatuses.values()].some(s => s.status === 'success') && (
                      <button
                        type="button"
                        className={`${styles.tabela__toolbar__editRow__dropdown__option} ${editViewFilter === 'success' ? styles.tabela__toolbar__editRow__dropdown__optionActive : ''}`}
                        onClick={() => { setEditViewFilter('success'); setEditViewDropdownOpen(false); }}
                      >
                        <span className={styles.tabela__toolbar__editRow__statusDot__success} />
                        Sucesso
                      </button>
                    )}
                    {[...rowStatuses.values()].some(s => s.status === 'warning') && (
                      <button
                        type="button"
                        className={`${styles.tabela__toolbar__editRow__dropdown__option} ${editViewFilter === 'warning' ? styles.tabela__toolbar__editRow__dropdown__optionActive : ''}`}
                        onClick={() => { setEditViewFilter('warning'); setEditViewDropdownOpen(false); }}
                      >
                        <span className={styles.tabela__toolbar__editRow__statusDot__warning} />
                        Alerta
                      </button>
                    )}
                    {[...rowStatuses.values()].some(s => s.status === 'error') && (
                      <button
                        type="button"
                        className={`${styles.tabela__toolbar__editRow__dropdown__option} ${editViewFilter === 'error' ? styles.tabela__toolbar__editRow__dropdown__optionActive : ''}`}
                        onClick={() => { setEditViewFilter('error'); setEditViewDropdownOpen(false); }}
                      >
                        <span className={styles.tabela__toolbar__editRow__statusDot__error} />
                        Erro
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.tabela__toolbar__editRow__right}>
              <button
                type="button"
                className={`${styles.tabela__toolbar__button} ${styles.without_border} ${styles.tabela__toolbar__button_with_label}`}
                onClick={handleRevertEdits}
                title="Descartar todas as alterações nas células"
              >
                <i className={`far fa-rotate-left ${styles.tabela__toolbar__button__icon}`} />
                <span className={styles.tabela__toolbar__button__label}>Reverter</span>
              </button>
              <button
                type="button"
                className={`${styles.tabela__toolbar__button} ${styles.tabela__toolbar__button_with_label} ${styles.tabela__toolbar__editRow__saveBtn}`}
                onClick={handleSaveEdits}
                title="Salvar alterações nas células"
              >
                <i className={`far fa-floppy-disk ${styles.tabela__toolbar__button__icon}`} />
                <span className={styles.tabela__toolbar__button__label}>Salvar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }, [mergedOptions.tableIcon, mergedOptions.tableName, sorts, filters, openMenu, tempSorts, tempFilters, isEditingToolbar, handleOpenFilterMenu, currentTableView, mergedOptions.editable, editedKeys, editViewFilter, editViewDropdownOpen, rowStatuses, handleRevertEdits, handleSaveEdits]);

  const portalContainer = getPortalContainerResolved();
  const portalTargetIsBody = portalContainer === document.body;
  const detectedTheme = portalTargetIsBody ? (containerRef.current?.closest?.('[data-theme]')?.getAttribute?.('data-theme') ?? 'light') : null;

  return (
    <div
      ref={containerRef}
      className={styles.tabela__container}
      style={maxWidth !== null ? { maxWidth: `${maxWidth}px` } : undefined}
    >
      {mergedOptions.showTableTitle && (
        <div className={styles.tabela__title}>
          <div className={styles.tabela__title__icon}>
            <i className={mergedOptions.tableIcon} />
          </div>
          <div className={styles.tabela__title__content}>
            <h1 className={styles.tabela__title__content__title}>{mergedOptions.tableName}</h1>
            <span className={styles.tabela__title__content__subtitle}>{mergedOptions.tableSubtitle}</span>
          </div>
        </div>
      )}
      {mergedOptions.showToolbar && toolbarContent}
      {tableContent}
      {mergedOptions.showFooter && tableFooterContent}
      {mergedOptions.showPagination && !groupByColumnKey && paginationContent}

      {menuState.isOpen && (() => {
        const menuContent = (
          <>
          {(menuState.type === 'sort-selection' || menuState.type === 'filter-selection') && (
            <ColumnSelectionMenu
              ref={columnSelectionMenuRef}
              menuState={menuState}
              columns={visibleColumns.filter(col =>
                menuState.type === 'filter-selection' ? col.filterable && !col.hasSubColumns : col.sortable && !col.hasSubColumns
              )}
              selectedItems={menuState.type === 'filter-selection' ? filters.concat(tempFilters) : sorts.concat(tempSorts)}
              onClose={closeMenu}
              onSelect={(column) => {
                setIsEditingToolbar(true);
                if (menuState.type === 'filter-selection') {
                  const existingFilter = tempFilters.find(f => f.key === column.key) || filters.find(f => f.key === column.key);

                  if (existingFilter) {
                    setTempFilters(prev => prev.filter(item => item.key !== column.key));
                  } else {
                    const newFilter = {
                      ...DEFAULT_FILTER,
                      id: `filter-${column.key}-${Date.now()}`,
                      key: column.key,
                      label: column.label ?? column.key,
                      type: column.type || 'text',
                      condition: FILTER_CONDITIONS[column.type || 'text'][0]?.value || 'is',
                    };

                    setTempFilters(prev => [...prev, newFilter]);
                    columnSelectionMenuRef.current?.close();

                    setTimeout(() => {
                      const buttonElement = filterButtonRefs.current.get(column.key);
                      if (buttonElement) {
                        setCurrentEditingFilter(newFilter);
                        openMenu('filter-menu', { current: buttonElement }, {
                          preferredPosition: 'bottom-start',
                          menuWidth: 280,
                          menuHeight: 300,
                          skipTempReset: true
                        });
                      }
                    }, 50);
                  }
                } else {
                  const existingSort = tempSorts.find(s => s.key === column.key) || sorts.find(s => s.key === column.key);

                  if (existingSort) {
                    setTempSorts(prev => prev.filter(item => item.key !== column.key));
                  } else {
                    const newSort = { key: column.key, direction: 'asc', label: column.label ?? column.key };
                    setTempSorts(prev => [...prev, newSort]);
                    columnSelectionMenuRef.current?.close();

                    setTimeout(() => {
                      const buttonElement = sortButtonRef.current;
                      if (buttonElement) {
                        openMenu('sort-menu', { current: buttonElement }, {
                          preferredPosition: 'bottom-start',
                          menuWidth: 320,
                          menuHeight: 380,
                          skipTempReset: true
                        });
                      }
                    }, 50);
                  }
                }
              }}
              refList={[toolbarFilterButtonRef.current, toolbarSortButtonRef.current]}
              onAddAdvancedFilter={() => handleOpenNewAdvancedFilter(toolbarFilterButtonRef)}
            />
          )}

          {menuState.type === 'sort-menu' && (
            <SortMenu
              ref={sortMenuRef}
              menuState={menuState}
              sortItems={isEditingToolbar ? tempSorts : sorts}
              columns={visibleColumns.filter(col => col.sortable && !col.hasSubColumns)}
              onClose={closeMenu}
              onUpdateSorts={handleSortMenuUpdateSorts}
              onOpenColumnSelection={openSortMenuColumnSelection}
              onClearSorts={handleSortMenuClearSorts}
              refList={[sortButtonRef.current]}
              getExtraRefs={() => [
                columnSelectionMenuRef.current?.getElement?.()
              ]}
            />
          )}

          {menuState.type === 'filter-menu' && currentEditingFilter && (
            <FilterMenu
              ref={filterMenuRef}
              menuState={menuState}
              filterItem={currentEditingFilter}
              onClose={(closingSessionId) => {
                closeMenu(closingSessionId);
                setCurrentEditingFilter(null);
              }}
              onUpdateFilter={handleFilterUpdate}
              onRemoveFilter={handleFilterRemove}
              onOpenAdvancedFilter={handleOpenAdvancedFilter}
              refList={[
                filterButtonRefs.current.get(currentEditingFilter?.key)
              ]}
              getExtraRefs={() => [
                advancedFilterMenuRef.current?.getElement?.()
              ]}
            />
          )}

          {menuState.type === 'settings-menu' && (
            <SettingsMenu
              ref={settingsMenuRef}
              menuState={menuState}
              onClose={closeMenu}
              refList={[toolbarSettingsButtonRef.current]}
              headerColumns={tableColumns.filter(c => !c.hasSubColumns && c.calculable !== false)}
              footerItems={tableFooter}
              columnVisibility={columnVisibility}
              footerVisibility={footerVisibility}
              onApplyColumns={(nextCol, nextFoot) => {
                setColumnVisibility(nextCol);
                setFooterVisibility(nextFoot);
              }}
              groupByColumnKey={groupByColumnKey}
              onApplyGroupBy={setGroupByColumnKey}
              calculationByColumn={calculationByColumn}
              onApplyCalculation={handleApplyCalculation}
              dataForCalculation={fullDataForGrouping}
              showSettingsOptions={mergedOptions.showSettingsOptions}
              additionalSettingsOptions={mergedOptions.additionalSettingsOptions}
              importConfig={mergedOptions.importConfig}
              onImportClick={(sessionId) => {
                closeMenu(sessionId);
                setImportModalOpen(true);
              }}
              onExport={(format) => {
                const exportColumns = headerStructure.leafColumns.filter((c) => columnVisibility[c.key] !== false);
                const prepared = prepareExportData(
                  fullDataForGrouping,
                  exportColumns,
                  editedData,
                  getRowKey
                );
                const tableName = mergedOptions.tableName ?? 'Tabela';
                if (format === 'csv') {
                  const csv = toCSV(prepared, exportColumns);
                  downloadFile(csv, getExportFilename(tableName, 'csv'));
                }
              }}
            />
          )}
          </>
        );
        return createPortal(
          portalTargetIsBody ? <div data-theme={detectedTheme || 'light'} style={{ display: 'contents' }}>{menuContent}</div> : menuContent,
          portalContainer
        );
      })()}

      {subMenuState.isOpen && (() => {
        const subMenuContent = (
        <>
          {subMenuState.type === 'sort-menu-column-selection' && (
            <ColumnSelectionMenu
              ref={columnSelectionMenuRef}
              menuState={subMenuState}
              columns={visibleColumns.filter(col => col.sortable && !col.hasSubColumns)}
              selectedItems={isEditingToolbar ? tempSorts : sorts}
              onClose={closeSubMenu}
              onSelect={(column) => {
                setIsEditingToolbar(true);
                if (sortMenuEditingIndex === -1) {
                  const newSorts = [
                    ...(isEditingToolbar ? tempSorts : sorts),
                    { key: column.key, direction: 'asc', label: column.label ?? column.key }
                  ];
                  setTempSorts(newSorts);
                  sortMenuRef.current?.updateItems(newSorts);
                } else {
                  const currentSorts = isEditingToolbar ? tempSorts : sorts;
                  const newSorts = [...currentSorts];
                  newSorts[sortMenuEditingIndex] = {
                    ...newSorts[sortMenuEditingIndex],
                    key: column.key,
                    label: column.label ?? column.key
                  };
                  setTempSorts(newSorts);
                  sortMenuRef.current?.updateItems(newSorts);
                }
                closeSubMenu();
              }}
              refList={[
                sortMenuColumnSelectRef.current,
                sortMenuRef.current?.getElement?.(),
                toolbarSortButtonRef.current,
                toolbarFilterButtonRef.current,
                sortButtonRef.current
              ]}
            />
          )}

          {subMenuState.type === 'calculation-submenu' && subMenuState.columnKey && (() => {
            const leafColumns = tableColumns.filter((c) => !c.hasSubColumns && c.calculable !== false);
            const hasColumn = leafColumns.some((c) => c.key === subMenuState.columnKey);
            return hasColumn ? (
              <CalculationModal
                key={subMenuState.columnKey + '-' + subMenuState.sessionId}
                headerColumns={leafColumns}
                calculationByColumn={calculationByColumn ?? {}}
                onApplyCalculation={handleApplyCalculation}
                dataForCalculation={fullDataForGrouping}
                initialColumnKey={subMenuState.columnKey}
                onClose={closeSubMenu}
                embedded={false}
                menuState={subMenuState}
              />
            ) : null;
          })()}

          {subMenuState.type === 'advanced-filter-menu' && currentAdvancedFilterGroup && (
            <AdvancedFilterMenu
              ref={advancedFilterMenuRef}
              menuState={subMenuState}
              filterGroup={currentAdvancedFilterGroup}
              columns={visibleColumns.filter(col => !col.hasSubColumns)}
              onClose={(closingSessionId) => {
                closeSubMenu(closingSessionId);
                setCurrentAdvancedFilterGroup(null);
              }}
              onUpdateFilterGroup={handleAdvancedFilterUpdate}
              onSaveFilterGroup={handleAdvancedFilterSave}
              onDeleteFilter={handleAdvancedFilterDelete}
              onCancel={handleAdvancedFilterCancel}
              refList={[
                filterMenuRef.current?.getElement?.(),
                ...Array.from(filterButtonRefs.current.values())
              ]}
            />
          )}
        </>
        );
        return createPortal(
          portalTargetIsBody ? <div data-theme={detectedTheme || 'light'} style={{ display: 'contents' }}>{subMenuContent}</div> : subMenuContent,
          portalContainer
        );
      })()}

      {importModalOpen && mergedOptions.importConfig?.columns?.length && (
        <ImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          importConfig={mergedOptions.importConfig}
          onImportComplete={mergedOptions.onImportComplete}
          portalContainer={portalContainer}
        />
      )}
    </div>
  );
};