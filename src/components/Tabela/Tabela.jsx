import styles from './Tabela.module.css';
import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Loader } from '../Loader/Loader';
import { Pagination } from '../Pagination/Pagination';
import { createPortal } from 'react-dom';

import { DEFAULT_OPTIONS, DEFAULT_COLUMN_CONFIG, DEFAULT_FOOTER_CONFIG, DEFAULT_FILTER, DEFAULT_FILTER_GROUP, FILTER_CONDITIONS, filtersToSQL, getFilterDisplayText } from './constants';
import { TableCell, ColumnSelectionMenu, SortMenu, FilterMenu, AdvancedFilterMenu, SettingsMenu } from './components';

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

  const [currentEditingFilter, setCurrentEditingFilter] = useState(null);
  const [currentAdvancedFilterGroup, setCurrentAdvancedFilterGroup] = useState(null);

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

    if (config.preferredPosition.startsWith('bottom')) {
      if (availableSpaces.below >= config.menuHeight) {
        top = button.absoluteTop + button.height + config.offset;
      } else if (availableSpaces.above >= config.menuHeight) {
        top = button.absoluteTop - config.menuHeight - config.offset;
      } else {
        if (availableSpaces.below >= availableSpaces.above) {
          top = button.absoluteTop + button.height + config.offset;
        } else {
          top = button.absoluteTop - config.menuHeight - config.offset;
        }
      }
    } else {
      if (availableSpaces.above >= config.menuHeight) {
        top = button.absoluteTop - config.menuHeight - config.offset;
      } else if (availableSpaces.below >= config.menuHeight) {
        top = button.absoluteTop + button.height + config.offset;
      } else {
        if (availableSpaces.above >= availableSpaces.below) {
          top = button.absoluteTop - config.menuHeight - config.offset;
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

    top = Math.max(viewport.scrollY + config.padding, top)
    left = Math.max(viewport.scrollX + config.padding, left)

    return { top, left };
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
      if (tempSorts.length === 0) {
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

    const position = calculateMenuPosition(buttonRef.current, {
      menuWidth: options.menuWidth ?? defaultWidth,
      menuHeight: options.menuHeight ?? defaultHeight,
      preferredPosition: options.preferredPosition ?? 'bottom-start',
      offset: options.offset ?? 8,
      padding: options.padding ?? 16,
    });

    const newSessionId = Date.now() + Math.random();

    currentMenuSessionRef.current = newSessionId;

    setMenuState({
      isOpen: true,
      type: menuType,
      position: {
        top: position.top,
        left: position.left,
      },
      sessionId: newSessionId,
    });
  }, [calculateMenuPosition, menuState, filters, sorts, tempFilters, tempSorts, subMenuState.isOpen, isEditingToolbar]);

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

  const openSortMenuColumnSelection = useCallback((index, buttonElement) => {
    if (subMenuState.isOpen && sortMenuColumnSelectRef.current === buttonElement) {
      closeSubMenu();
      return;
    }

    sortMenuColumnSelectRef.current = buttonElement;
    setSortMenuEditingIndex(index);

    const position = calculateMenuPosition(buttonElement, {
      menuWidth: 280,
      menuHeight: 320,
      preferredPosition: 'right-start',
      offset: 0,
      padding: 16,
    });

    const newSessionId = Date.now() + Math.random();

    currentSubMenuSessionRef.current = newSessionId;

    setSubMenuState({
      isOpen: true,
      type: 'sort-menu-column-selection',
      position: {
        top: position.top,
        left: position.left,
      },
      sessionId: newSessionId,
    });
  }, [calculateMenuPosition, subMenuState.isOpen, closeSubMenu]);

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
          position: {
            top: position.top,
            left: position.left,
          },
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
  }, [visibleColumns, openMenu, calculateMenuPosition, isEditingToolbar, sorts, tempSorts, filters, tempFilters]);

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
        position: {
          top: position.top,
          left: position.left,
        },
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
      // Verificar se já existe um filtro avançado com o mesmo ID
      const existingIndex = prev.findIndex(f => f.id === filterGroup.id);
      if (existingIndex >= 0) {
        const newFilters = [...prev];
        newFilters[existingIndex] = advancedFilterItem;
        return newFilters;
      }
      return [...prev, advancedFilterItem];
    });

    setCurrentAdvancedFilterGroup(null);
  }, []);

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
        const position = calculateMenuPosition(newFilterButton, {
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
          position: {
            top: position.top,
            left: position.left,
          },
          sessionId: newSessionId,
        });
      }
    }, 0);
  }, [calculateMenuPosition]);

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
    if (tableWrapperRef.current) {
      tableWrapperRef.current.addEventListener('scroll', scrollHandler);
    }

    return () => {
      resizeObserver.disconnect();
      if (tableWrapperRef.current) {
        tableWrapperRef.current.removeEventListener('scroll', scrollHandler);
      }
    };
  }, [sortedData, originalData, filters, tempFilters, visibleColumns]);

  const tableContent = useMemo(() => {
    if (mergedOptions.currentMode === 'grid') {
      return (
        <div 
          ref={tableWrapperRef}
          className={`${styles.tabela__wrapper} ${hasScroll ? styles.hasScroll : ''}`}
        >
          <table className={`${styles.tabela} ${visibleFooter.length > 0 ? styles.hasFooter : ''}`}>
            {mergedOptions.showHeader && (
              <thead className={`${styles.tabela__header} ${headerStructure.headerRows.length > 1 ? styles.isNastedHeader : ''}`}>
                {!headerStructure.headerRows.length > 0 && (
                  <tr>
                    <td colSpan={headerStructure.leafColumns.length} className={styles.tabela__header__cell}>
                      <span className={styles.tabela__header__label}>Nenhum header encontrado</span>
                    </td>
                  </tr>
                )}
                {headerStructure.headerRows && headerStructure.headerRows.map((headerRow, rowIndex) => {
                  return (
                    <tr className={styles.tabela__header__row} key={`header-row-${rowIndex}`}>
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
                          minWidth: typeof mergedOptions.columnMinWidth === 'number'
                            ? `${mergedOptions.columnMinWidth}px`
                            : 'auto',
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
                                  className={`fas ${sortItem
                                    ? sortItem.direction === 'asc'
                                      ? 'fa-arrow-up'
                                      : 'fa-arrow-down'
                                    : ''
                                    } ${styles.tabela__header__sortable__icon}`}
                                ></i>
                              );
                            })()}
                          </th>
                        );
                      })}
                    </tr>
                  );
                })}
              </thead>
            )}
            <tbody className={styles.tabela__body} ref={tableBodyRef}>
              {sortedData.length === 0 || !headerStructure.leafColumns.filter(col => col.visible !== false).length > 0 && (
                <tr className={styles.tabela__body__row}>
                  <td colSpan={headerStructure.leafColumns.length} className={styles.tabela__body__cell}>
                    <span className={styles.tabela__body__label}>Nenhum dado encontrado</span>
                  </td>
                </tr>
              )}
              {(isSorting || isLoading) && (
                <div className={styles.tabela__loader}>
                  <Loader
                    loading={true}
                    size="medium"
                    text={isSorting ? "Ordenando..." : "Carregando..."}
                  />
                </div>
              )}
              {sortedData.map((item, rowIndex) => (
                <tr className={styles.tabela__body__row} key={item.key}>
                  {headerStructure.leafColumns
                    .filter(col => col.visible !== false)
                    .map((column, colIndex) => {
                      const cellValue = item[column.key];
                      const hasColumnRender = renderFlags.columnRenders.get(column.key) || false;

                      return (
                        <TableCell
                          key={column.key}
                          cellValue={cellValue}
                          row={item}
                          column={column}
                          rowIndex={rowIndex}
                          colIndex={colIndex}
                          hasColumnRender={hasColumnRender}
                        />
                      );
                    })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
  }, [mergedOptions.currentMode, visibleColumns, sortedData, renderFlags, sorts, tempSorts, isEditingToolbar, isSorting, isLoading, headerStructure]);

  const tableFooterContent = useMemo(() => {
    if (mergedOptions.currentMode === 'grid') {
      return (
        <div className={styles.tabela__footer}>
          {visibleFooter.length > 0 && (
            <div className={styles.tabela__footer__row}>
              {visibleFooter.map((footerItem) => {
                const content = footerItem.render && typeof footerItem.render === 'function' ? footerItem.render(sortedData, footerItem) : footerItem.value || '';
                return (
                  <div key={footerItem.key} className={`${styles.tabela__footer__cell} ${footerItem.className || ''}`} style={footerItem.style}>
                    {footerItem.label ? footerItem.label + ' ' : ''}{content}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
  }, [mergedOptions.currentMode, visibleFooter]);

  const paginationContent = useMemo(() => {
    return (
      <div className={styles.tabela__pagination}>
        <Pagination totalPages={totalPages} currentPage={currentPage} onPageChange={setCurrentPage} itemsPerPageOptions={mergedOptions.itensPerPageOptions} itemsPerPage={itensPerPage} onItemsPerPageChange={setItensPerPage} />
      </div>
    );
  }, [totalPages, currentPage, mergedOptions.itensPerPageOptions, itensPerPage, setItensPerPage]);

  const handleSearchToggle = useCallback((e) => {
    const clickedOnInput = e.target === searchInputRef.current || 
                          searchInputRef.current?.contains(e.target);
    
    if (clickedOnInput) {
      return;
    }
    
    const isCurrentlyFocused = document.activeElement === searchInputRef.current;
    const wasFocused = isCurrentlyFocused || wasSearchFocusedRef.current;
    
    if (wasFocused) {
      searchInputRef.current?.blur();
      wasSearchFocusedRef.current = false;
    } else {
      searchInputRef.current?.focus();
      wasSearchFocusedRef.current = true;
    }
  }, []);

  const toolbarContent = useMemo(() => {
    return (
      <div className={styles.tabela__toolbar}>
        <div className={`${styles.tabela__toolbar__top} ${sorts.length > 0 || filters.length > 0 || isEditingToolbar ? styles.tabela__toolbar__top_with_buttons : ''}`}>
          <div className={styles.tabela__toolbar__top__left}>
            <i className={`${mergedOptions.tableIcon} ${styles.tabela__toolbar__icon}`} />
            <span className={styles.tabela__toolbar__label}>{mergedOptions.tableName}</span>
          </div>
          <div className={styles.tabela__toolbar__top__right}>
            {mergedOptions.showSearch && (
              <div 
                ref={searchContainerRef}
                className={styles.tabela__toolbar__search} 
                onClick={handleSearchToggle}
              >
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
                      if (document.activeElement !== searchInputRef.current) {
                        wasSearchFocusedRef.current = false;
                      }
                    }, 100);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <i className={`far fa-search ${styles.tabela__toolbar__search__icon}`} />
              </div>
            )}
            {mergedOptions.showSorts && (
              <button
                ref={toolbarSortButtonRef}
                className={styles.tabela__toolbar__button}
                onClick={() => openMenu('sort-selection', toolbarSortButtonRef, { preferredPosition: 'bottom-end' })}
              >
                <i className={`far fa-arrow-down-arrow-up ${styles.tabela__toolbar__button__icon}`} />
              </button>
            )}
            {mergedOptions.showFilters && (
              <button
                ref={toolbarFilterButtonRef}
                className={styles.tabela__toolbar__button}
                onClick={() => openMenu('filter-selection', toolbarFilterButtonRef, { preferredPosition: 'bottom-end' })}
              >
                <i className={`far fa-bars-filter ${styles.tabela__toolbar__button__icon}`} />
              </button>
            )}
            <button
              ref={toolbarSettingsButtonRef}
              className={styles.tabela__toolbar__button}
              onClick={() => openMenu('settings-menu', toolbarSettingsButtonRef, { preferredPosition: 'bottom-end' })}
            >
              <i className={`far fa-sliders ${styles.tabela__toolbar__button__icon}`} />
            </button>
          </div>
        </div>
        {(sorts.length > 0 || filters.length > 0 || isEditingToolbar) && (
          <div className={styles.tabela__toolbar__bottom}>
            <div className={styles.tabela__toolbar__bottom__left}>
              {(sorts.length > 0 || tempSorts.length > 0) && (
                <div className={`${styles.tabela__toolbar__bottom__left__first_item} ${filters.length > 0 || tempFilters.length > 0 ? '' : styles.without_border}`}>
                  <button
                    className={`${styles.tabela__toolbar__button} ${styles.tabela__toolbar__button_with_label}`}
                    ref={sortButtonRef}
                    onClick={() => openMenu('sort-menu', sortButtonRef, { preferredPosition: 'bottom-start' })}
                  >
                    <i className={`far fa-arrow-down-arrow-up ${styles.tabela__toolbar__button__icon}`} />
                    <span className={styles.tabela__toolbar__button__label}>
                      {(() => {
                        if (isEditingToolbar) {
                          if (tempSorts.length === 0) return '';
                          return tempSorts.length > 1 ? `${tempSorts.length} colunas` : (tempSorts[0]?.label ?? tempSorts[0]?.key ?? '');
                        } else {
                          if (sorts.length === 0) return '';
                          return sorts.length > 1 ? `${sorts.length} colunas` : (sorts[0]?.label ?? sorts[0]?.key ?? '');
                        }
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
                        className={`${styles.tabela__toolbar__button} ${styles.tabela__toolbar__button_with_label} ${filter.isAdvanced ? styles.advanced : ''}`}
                        onClick={() => {
                          const buttonRef = { current: filterButtonRefs.current.get(filter.key) };
                          handleOpenFilterMenu(filter, buttonRef);
                        }}
                        key={filter.key}
                        ref={(el) => {
                          if (el) filterButtonRefs.current.set(filter.key, el);
                          else filterButtonRefs.current.delete(filter.key);
                        }}
                      >
                        <i className={`far ${filter.isAdvanced ? 'fa-layer-group' : 'fa-bars-filter'} ${styles.tabela__toolbar__button__icon}`} />
                      <span className={styles.tabela__toolbar__button__label}>{getFilterDisplayText(filter, visibleColumns)}</span>
                      </button>
                    );
                  }) : filters.map((filter) => {
                    return (
                      <button
                        className={`${styles.tabela__toolbar__button} ${styles.tabela__toolbar__button_with_label} ${filter.isAdvanced ? styles.advanced : ''}`}
                        onClick={() => {
                          const buttonRef = { current: filterButtonRefs.current.get(filter.key) };
                          handleOpenFilterMenu(filter, buttonRef);
                        }}
                        key={filter.key}
                        ref={(el) => {
                          if (el) filterButtonRefs.current.set(filter.key, el);
                          else filterButtonRefs.current.delete(filter.key);
                        }}
                      >
                        <i className={`far ${filter.isAdvanced ? 'fa-layer-group' : 'fa-bars-filter'} ${styles.tabela__toolbar__button__icon}`} />
                        <span className={styles.tabela__toolbar__button__label}>{getFilterDisplayText(filter, visibleColumns)}</span>
                      </button>
                    );
                  })
              )}
            </div>
            <div className={styles.tabela__toolbar__bottom__right}>
              {isEditingToolbar && (
                <>
                  <button className={`${styles.tabela__toolbar__button} ${styles.without_border} ${styles.tabela__toolbar__button_with_label}`} onClick={() => {
                    setIsEditingToolbar(false);
                    setTempSorts([]);
                    setTempFilters([]);
                  }}>
                    <span className={styles.tabela__toolbar__button__label}>Reverter</span>
                  </button>
                  <button className={`${styles.tabela__toolbar__button} ${styles.tabela__toolbar__button_with_label}`} onClick={() => {
                    if (menuState.type === 'sort-menu' && menuState.isOpen) {
                      sortMenuRef.current?.close();
                    }
                    setIsEditingToolbar(false);
                    setSorts([...tempSorts]);
                    setFilters([...tempFilters]);
                    setTempSorts([]);
                    setTempFilters([]);
                  }}>
                    <span className={styles.tabela__toolbar__button__label}>Salvar</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }, [mergedOptions.tableIcon, mergedOptions.tableName, sorts, filters, openMenu, tempSorts, tempFilters, isEditingToolbar, handleOpenFilterMenu]);

  return (
    <div 
      ref={containerRef}
      className={styles.tabela__container}
      style={maxWidth !== null ? { maxWidth: `${maxWidth}px` } : undefined}
    >
      {mergedOptions.showToolbar && toolbarContent}
      {tableContent}
      {mergedOptions.showFooter && tableFooterContent}
      {mergedOptions.showPagination && paginationContent}

      {menuState.isOpen && createPortal(
        <>
          {(menuState.type === 'sort-selection' || menuState.type === 'filter-selection') && (
            <ColumnSelectionMenu
              ref={columnSelectionMenuRef}
              menuState={menuState}
              columns={visibleColumns.filter(col =>
                menuState.type === 'filter-selection' ? col.filterable : col.sortable
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
                  setTempSorts(prev =>
                    prev.some(item => item.key === column.key)
                      ? prev.filter(item => item.key !== column.key)
                      : [...prev, { key: column.key, direction: 'asc', label: column.label ?? column.key }]
                  );
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
              columns={visibleColumns.filter(col => col.sortable)}
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
              headerColumns={tableColumns.filter(c => !c.hasSubColumns)}
              footerItems={tableFooter}
              columnVisibility={columnVisibility}
              footerVisibility={footerVisibility}
              onApplyColumns={(nextCol, nextFoot) => {
                setColumnVisibility(nextCol);
                setFooterVisibility(nextFoot);
              }}
            />
          )}
        </>
        , document.body
      )}

      {subMenuState.isOpen && createPortal(
        <>
          {subMenuState.type === 'sort-menu-column-selection' && (
            <ColumnSelectionMenu
              ref={columnSelectionMenuRef}
              menuState={subMenuState}
              columns={visibleColumns.filter(col => col.sortable)}
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

          {subMenuState.type === 'advanced-filter-menu' && currentAdvancedFilterGroup && (
            <AdvancedFilterMenu
              ref={advancedFilterMenuRef}
              menuState={subMenuState}
              filterGroup={currentAdvancedFilterGroup}
              columns={visibleColumns}
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
        , document.body
      )}
    </div>
  );
};