import { memo, forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import styles from '../Tabela.module.css';
import { COLUMN_ICONS, FILTER_CONDITIONS, EMPTY_CONDITIONS, RANGE_CONDITIONS } from '../constants';
import { Select } from './Select';

export const AdvancedFilterMenu = memo(forwardRef(({ 
  menuState,
  filterGroup,
  columns,
  onClose, 
  onUpdateFilterGroup,
  onSaveFilterGroup,
  onDeleteFilter,
  onCancel,
  refList,
  getExtraRefs
}, ref) => {
  const menuRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Local state for editing
  const [localGroup, setLocalGroup] = useState(null);
  
  // Dropdown states
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [openAddRuleMenu, setOpenAddRuleMenu] = useState(null);
  const actionButtonRefs = useRef(new Map());
  const actionDropdownRef = useRef(null);
  const [actionDropdownPosition, setActionDropdownPosition] = useState({ top: 0, left: 0 });
  const addRuleButtonRefs = useRef(new Map());
  const addRuleDropdownRef = useRef(null);
  const [addRuleDropdownPosition, setAddRuleDropdownPosition] = useState({ top: 0, left: 0 });
  
  // Session management refs
  const currentSessionRef = useRef(null);
  const menuStateSessionRef = useRef(null);
  const prevSessionRef = useRef(null);
  const closeTimerRef = useRef(null);
  const isClosingRef = useRef(false);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Sync state with menuState
  useEffect(() => {
    menuStateSessionRef.current = menuState.sessionId;
    
    if (menuState.isOpen && menuState.type === 'advanced-filter-menu') {
      const isNewSession = prevSessionRef.current !== menuState.sessionId;
      
      currentSessionRef.current = menuState.sessionId;
      setIsVisible(true);
      
      if (isNewSession && !closeTimerRef.current) {
        isClosingRef.current = false;
        setIsClosing(false);
      }
      
      if (closeTimerRef.current && isNewSession && !isClosingRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      
      // Sync local group when opening new menu
      if (isNewSession && filterGroup) {
        prevSessionRef.current = menuState.sessionId;
        setLocalGroup(JSON.parse(JSON.stringify(filterGroup)));
        setOpenActionMenu(null);
        setOpenAddRuleMenu(null);
      }
    }
  }, [menuState.isOpen, menuState.sessionId, menuState.type, filterGroup]);

  // Handle close with sessionId verification
  const handleClose = useCallback(() => {
    if (closeTimerRef.current) {
      return;
    }
    
    const closingSessionId = currentSessionRef.current;
    
    isClosingRef.current = true;
    setIsClosing(true);
    
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      
      if (currentSessionRef.current !== closingSessionId) {
        isClosingRef.current = false;
        setIsClosing(false);
        return;
      }
      
      setIsVisible(false);
      isClosingRef.current = false;
      setIsClosing(false);
      setOpenActionMenu(null);
      setOpenAddRuleMenu(null);
      onClose(closingSessionId);
    }, 180);
  }, [onClose]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    close: handleClose,
    getElement: () => menuRef.current,
    updateGroup: (group) => setLocalGroup(JSON.parse(JSON.stringify(group)))
  }), [handleClose]);

  // Click outside handler
  useEffect(() => {
    if (!isVisible || isClosing) return;

    const handleClickOutside = (event) => {
      const clickedOnSelectDropdown = event.target?.closest?.(`.${styles.select__dropdown}`);
      if (clickedOnSelectDropdown) {
        return;
      }
      
      const clickedOnActionDropdown = actionDropdownRef.current?.contains(event.target);
      const clickedOnAddRuleDropdown = event.target?.closest?.(`.${styles.advancedFilterMenu__addRuleDropdown}`);
      
      if (clickedOnActionDropdown || clickedOnAddRuleDropdown) {
        return;
      }
      
      const extraRefs = getExtraRefs?.() || [];
      const allRefs = [...(refList || []), ...extraRefs];
      const isClickOnRef = allRefs.some(r => r?.contains?.(event.target));
      
      if (menuRef.current && !menuRef.current.contains(event.target) && !isClickOnRef) {
        handleClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, isClosing, handleClose, refList, getExtraRefs]);

  // Escape key handler
  useEffect(() => {
    if (!isVisible || isClosing) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        // Close dropdowns first, then menu
        if (openActionMenu || openAddRuleMenu) {
          setOpenActionMenu(null);
          setOpenAddRuleMenu(null);
        } else {
          handleClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, isClosing, handleClose, openActionMenu, openAddRuleMenu]);

  // Calculate action dropdown position
  useEffect(() => {
    if (!openActionMenu) return;

    const updatePosition = () => {
      const pathKey = openActionMenu.path.length === 0 ? 'root' : openActionMenu.path.join('-');
      const buttonElement = actionButtonRefs.current.get(pathKey);
      
      if (!buttonElement) return;

      const buttonRect = buttonElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      const dropdownWidth = 140;
      const dropdownHeight = 120;
      
      let top = buttonRect.bottom + scrollY + 4;
      let left = buttonRect.right + scrollX - dropdownWidth;
      
      if (left < scrollX) {
        left = buttonRect.left + scrollX;
      }
      
      if (top + dropdownHeight > viewportHeight + scrollY) {
        top = buttonRect.top + scrollY - dropdownHeight - 4;
      }
      
      setActionDropdownPosition({ top, left });
    };

    updatePosition();
    const timeoutId = setTimeout(updatePosition, 0);
    
    return () => clearTimeout(timeoutId);
  }, [openActionMenu]);

  // Calculate add rule dropdown position
  useEffect(() => {
    if (!openAddRuleMenu) return;

    const updatePosition = () => {
      const pathKey = openAddRuleMenu.path.length === 0 ? 'root' : openAddRuleMenu.path.join('-');
      const buttonElement = addRuleButtonRefs.current.get(pathKey);
      
      if (!buttonElement) return;

      const buttonRect = buttonElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      const dropdownWidth = 180;
      const dropdownHeight = 80;
      
      let top = buttonRect.bottom + scrollY + 4;
      let left = buttonRect.left + scrollX;
      
      if (left + dropdownWidth > viewportWidth + scrollX) {
        left = buttonRect.right + scrollX - dropdownWidth;
      }
      
      if (top + dropdownHeight > viewportHeight + scrollY) {
        top = buttonRect.top + scrollY - dropdownHeight - 4;
      }
      
      setAddRuleDropdownPosition({ top, left });
    };

    updatePosition();
    const timeoutId = setTimeout(updatePosition, 0);
    
    return () => clearTimeout(timeoutId);
  }, [openAddRuleMenu]);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!openActionMenu && !openAddRuleMenu) return;

    const handleDropdownClickOutside = (event) => {
      const clickedOnActionDropdown = actionDropdownRef.current?.contains(event.target);
      const clickedOnActionButton = Array.from(actionButtonRefs.current.values()).some(
        btn => btn?.contains(event.target)
      );
      const clickedOnAddRuleDropdown = addRuleDropdownRef.current?.contains(event.target);
      const clickedOnAddRuleButton = Array.from(addRuleButtonRefs.current.values()).some(
        btn => btn?.contains(event.target)
      );
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6c3ae44d-694c-470a-8389-0c131f51518f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdvancedFilterMenu.jsx:204',message:'Click outside handler triggered',data:{clickedOnActionDropdown,clickedOnActionButton,clickedOnAddRuleDropdown:!!clickedOnAddRuleDropdown,clickedOnAddRuleButton:!!clickedOnAddRuleButton,targetTag:event.target?.tagName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      if (!clickedOnActionDropdown && !clickedOnActionButton &&
          !clickedOnAddRuleDropdown && !clickedOnAddRuleButton) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6c3ae44d-694c-470a-8389-0c131f51518f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdvancedFilterMenu.jsx:213',message:'Closing dropdowns - click outside',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        setOpenActionMenu(null);
        setOpenAddRuleMenu(null);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleDropdownClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleDropdownClickOutside);
    };
  }, [openActionMenu, openAddRuleMenu]);

  // Helper to navigate to a path in the group structure
  const getItemAtPath = useCallback((group, path) => {
    let item = group;
    for (const index of path) {
      if (!item.rules || !item.rules[index]) return null;
      item = item.rules[index];
    }
    return item;
  }, []);

  // Helper to get parent and index from path
  const getParentAndIndex = useCallback((group, path) => {
    if (path.length === 0) return { parent: null, index: -1 };
    
    const parentPath = path.slice(0, -1);
    const index = path[path.length - 1];
    
    let parent = group;
    for (const i of parentPath) {
      if (!parent.rules || !parent.rules[i]) return { parent: null, index: -1 };
      parent = parent.rules[i];
    }
    
    return { parent, index };
  }, []);

  // Update rule at path
  const updateRuleAtPath = useCallback((path, updates) => {
    if (!localGroup) return;
    
    const newGroup = JSON.parse(JSON.stringify(localGroup));
    const { parent, index } = getParentAndIndex(newGroup, path);
    
    if (parent && parent.rules && parent.rules[index]) {
      parent.rules[index] = { ...parent.rules[index], ...updates };
      setLocalGroup(newGroup);
      onUpdateFilterGroup?.(newGroup);
    }
  }, [localGroup, getParentAndIndex, onUpdateFilterGroup]);

  const handleToggleLogic = useCallback((path, currentLogic, newLogic) => {
    if (newLogic) {
      updateRuleAtPath(path, { logic: newLogic });
    } else {
      const updatedLogic = currentLogic === 'AND' ? 'OR' : 'AND';
      updateRuleAtPath(path, { logic: updatedLogic });
    }
  }, [updateRuleAtPath]);

  // Update column at path
  const handleUpdateColumn = useCallback((path, columnKey) => {
    const column = columns.find(c => c.key === columnKey);
    if (!column) return;
    
    const type = column.type || 'text';
    const conditions = FILTER_CONDITIONS[type] || FILTER_CONDITIONS.text;
    const defaultCondition = conditions[0]?.value || 'is';
    
    updateRuleAtPath(path, {
      key: columnKey,
      label: column.title || columnKey,
      type: type,
      condition: defaultCondition,
      value: '',
      valueTo: ''
    });
  }, [columns, updateRuleAtPath]);

  // Update condition at path
  const handleUpdateCondition = useCallback((path, condition) => {
    const updates = { condition };
    
    // Clear values for empty conditions
    if (EMPTY_CONDITIONS.includes(condition)) {
      updates.value = '';
      updates.valueTo = '';
    }
    
    updateRuleAtPath(path, updates);
  }, [updateRuleAtPath]);

  // Update value at path
  const handleUpdateValue = useCallback((path, value) => {
    updateRuleAtPath(path, { value });
  }, [updateRuleAtPath]);

  // Update valueTo at path (for between)
  const handleUpdateValueTo = useCallback((path, valueTo) => {
    updateRuleAtPath(path, { valueTo });
  }, [updateRuleAtPath]);

  // Remove rule at path
  const handleRemoveRule = useCallback((path) => {
    if (!localGroup || path.length === 0) return;
    
    const newGroup = JSON.parse(JSON.stringify(localGroup));
    const { parent, index } = getParentAndIndex(newGroup, path);
    
    if (parent && parent.rules) {
      parent.rules.splice(index, 1);
      setLocalGroup(newGroup);
      onUpdateFilterGroup?.(newGroup);
    }
    
    setOpenActionMenu(null);
  }, [localGroup, getParentAndIndex, onUpdateFilterGroup]);

  // Duplicate rule at path
  const handleDuplicateRule = useCallback((path) => {
    if (!localGroup || path.length === 0) return;
    
    const newGroup = JSON.parse(JSON.stringify(localGroup));
    const { parent, index } = getParentAndIndex(newGroup, path);
    
    if (parent && parent.rules && parent.rules[index]) {
      const duplicated = JSON.parse(JSON.stringify(parent.rules[index]));
      duplicated.id = generateId();
      // If it's a group, regenerate all rule IDs inside
      if (duplicated.type === 'group' && duplicated.rules) {
        const regenerateIds = (rules) => {
          rules.forEach(rule => {
            rule.id = generateId();
            if (rule.type === 'group' && rule.rules) {
              regenerateIds(rule.rules);
            }
          });
        };
        regenerateIds(duplicated.rules);
      }
      parent.rules.splice(index + 1, 0, duplicated);
      setLocalGroup(newGroup);
      onUpdateFilterGroup?.(newGroup);
    }
    
    setOpenActionMenu(null);
  }, [localGroup, getParentAndIndex, generateId, onUpdateFilterGroup]);

  // Transform rule to group at path
  const handleTransformToGroup = useCallback((path) => {
    if (!localGroup || path.length === 0) return;
    
    const newGroup = JSON.parse(JSON.stringify(localGroup));
    const { parent, index } = getParentAndIndex(newGroup, path);
    
    if (parent && parent.rules && parent.rules[index]) {
      const rule = parent.rules[index];
      // Don't transform if already a group
      if (rule.type === 'group') {
        setOpenActionMenu(null);
        return;
      }
      
      const newGroupItem = {
        id: generateId(),
        type: 'group',
        logic: 'AND',
        rules: [{ ...rule, id: generateId() }]
      };
      
      parent.rules[index] = newGroupItem;
      setLocalGroup(newGroup);
      onUpdateFilterGroup?.(newGroup);
    }
    
    setOpenActionMenu(null);
  }, [localGroup, getParentAndIndex, generateId, onUpdateFilterGroup]);

  // Add new rule at path
  const handleAddRule = useCallback((parentPath = []) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6c3ae44d-694c-470a-8389-0c131f51518f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdvancedFilterMenu.jsx:396',message:'handleAddRule called',data:{hasLocalGroup:!!localGroup,parentPath:JSON.stringify(parentPath)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    if (!localGroup) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/6c3ae44d-694c-470a-8389-0c131f51518f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdvancedFilterMenu.jsx:398',message:'handleAddRule early return - no localGroup',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    const newGroup = JSON.parse(JSON.stringify(localGroup));
    let targetArray = newGroup.rules;
    
    if (!targetArray) {
      newGroup.rules = [];
      targetArray = newGroup.rules;
    }
    
    // Navigate to the correct parent
    for (const index of parentPath) {
      if (!targetArray[index]) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6c3ae44d-694c-470a-8389-0c131f51518f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdvancedFilterMenu.jsx:410',message:'handleAddRule early return - invalid path index',data:{index,parentPath:JSON.stringify(parentPath),targetArrayLength:targetArray.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return;
      }
      if (targetArray[index].type === 'group' && targetArray[index].rules) {
        targetArray = targetArray[index].rules;
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6c3ae44d-694c-470a-8389-0c131f51518f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdvancedFilterMenu.jsx:414',message:'handleAddRule early return - not a group',data:{index,itemType:targetArray[index]?.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        return;
      }
    }
    
    // Create new rule with default values
    const defaultColumn = columns[0];
    const type = defaultColumn?.type || 'text';
    const conditions = FILTER_CONDITIONS[type] || FILTER_CONDITIONS.text;
    
    const newRule = {
      id: generateId(),
      type: 'rule',
      key: defaultColumn?.key || '',
      label: defaultColumn?.title || 'Selecione',
      columnType: type,
      condition: conditions[0]?.value || 'is',
      value: '',
      valueTo: '',
      logic: 'AND'
    };
    
    targetArray.push(newRule);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6c3ae44d-694c-470a-8389-0c131f51518f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdvancedFilterMenu.jsx:435',message:'handleAddRule pushing new rule',data:{newRuleId:newRule.id,newRuleKey:newRule.key,targetArrayLength:targetArray.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    setLocalGroup(newGroup);
    onUpdateFilterGroup?.(newGroup);
    setOpenAddRuleMenu(null);
  }, [localGroup, columns, generateId, onUpdateFilterGroup]);

  // Add new group at path
  const handleAddGroup = useCallback((parentPath = []) => {
    if (!localGroup) return;
    
    const newGroup = JSON.parse(JSON.stringify(localGroup));
    let targetArray = newGroup.rules;
    
    if (!targetArray) {
      newGroup.rules = [];
      targetArray = newGroup.rules;
    }
    
    // Navigate to the correct parent
    for (const index of parentPath) {
      if (!targetArray[index]) return;
      if (targetArray[index].type === 'group' && targetArray[index].rules) {
        targetArray = targetArray[index].rules;
      } else {
        return;
      }
    }
    
    // Create new group with one empty rule
    const defaultColumn = columns[0];
    const type = defaultColumn?.type || 'text';
    const conditions = FILTER_CONDITIONS[type] || FILTER_CONDITIONS.text;
    
    const newGroupItem = {
      id: generateId(),
      type: 'group',
      logic: 'AND',
      rules: [{
        id: generateId(),
        type: 'rule',
        key: defaultColumn?.key || '',
        label: defaultColumn?.title || 'Selecione',
        columnType: type,
        condition: conditions[0]?.value || 'is',
        value: '',
        valueTo: '',
        logic: 'AND'
      }]
    };
    
    targetArray.push(newGroupItem);
    setLocalGroup(newGroup);
    onUpdateFilterGroup?.(newGroup);
    setOpenAddRuleMenu(null);
  }, [localGroup, columns, generateId, onUpdateFilterGroup]);

  // Save filter
  const handleSave = useCallback(() => {
    if (!localGroup) return;
    onSaveFilterGroup(localGroup);
    handleClose();
  }, [localGroup, onSaveFilterGroup, handleClose]);

  // Delete filter
  const handleDelete = useCallback(() => {
    onDeleteFilter?.();
    handleClose();
  }, [onDeleteFilter, handleClose]);

  // Cancel
  const handleCancel = useCallback(() => {
    onCancel?.();
    handleClose();
  }, [onCancel, handleClose]);

  // Get column icon
  const getColumnIcon = useCallback((type) => {
    return COLUMN_ICONS[type ?? 'text'];
  }, []);

  // Render RuleRow component
  const renderRuleRow = useCallback((rule, path, isFirstInGroup = false, parentLogic = 'AND') => {
    const pathKey = path.join('-');
    const column = columns.find(c => c.key === rule.key);
    const columnType = column?.type || rule.columnType || 'text';
    const conditions = FILTER_CONDITIONS[columnType] || FILTER_CONDITIONS.text;
    
    const isEmptyCondition = EMPTY_CONDITIONS.includes(rule.condition);
    const isRangeCondition = RANGE_CONDITIONS.includes(rule.condition);
    const showActionMenu = openActionMenu && openActionMenu.path.join('-') === pathKey;

    return (
      <div key={rule.id || `rule-${pathKey}`} className={styles.advancedFilterMenu__ruleRow}>
        {/* Logic toggle (Onde / And / Or) */}
        {isFirstInGroup ? (
          <span className={`${styles.advancedFilterMenu__logicToggle} ${styles.static}`}>
            Onde
          </span>
        ) : (
          <Select
            value={rule.logic || 'AND'}
            onChange={(value) => updateRuleAtPath(path, { logic: value })}
            options={[
              { value: 'AND', label: 'E' },
              { value: 'OR', label: 'Ou' }
            ]}
            className={`${styles.advancedFilterMenu__logicSelect} ${styles.advancedFilterMenu__logicToggle}`}
          />
        )}

        {/* Column select */}
        <Select
          value={rule.key || ''}
          onChange={(value) => handleUpdateColumn(path, value)}
          options={columns.map(col => ({ value: col.key, label: col.title || col.key }))}
          placeholder="Coluna"
          className={styles.advancedFilterMenu__columnSelect}
        />

        {/* Condition select */}
        <Select
          value={rule.condition || ''}
          onChange={(value) => handleUpdateCondition(path, value)}
          options={conditions.map(cond => ({ value: cond.value, label: cond.label }))}
          className={styles.advancedFilterMenu__conditionSelect}
        />

        {/* Value input */}
        {!isEmptyCondition && (
          <>
            <input
              type={columnType === 'number' ? 'number' : columnType === 'date' ? 'date' : 'text'}
              className={styles.advancedFilterMenu__valueInput}
              value={rule.value || ''}
              onChange={(e) => handleUpdateValue(path, e.target.value)}
              placeholder="Valor"
            />
            
            {/* Value To input (for between/range) */}
            {isRangeCondition && (
              <>
                <span className={styles.advancedFilterMenu__rangeSeparator}>e</span>
                <input
                  type={columnType === 'number' ? 'number' : columnType === 'date' ? 'date' : 'text'}
                  className={styles.advancedFilterMenu__valueToInput}
                  value={rule.valueTo || ''}
                  onChange={(e) => handleUpdateValueTo(path, e.target.value)}
                  placeholder="Valor"
                />
              </>
            )}
          </>
        )}

        {/* Action menu button */}
        <div style={{ position: 'relative', marginLeft: 'auto', flexShrink: 0 }}>
          <button
            ref={(el) => {
              if (el) {
                actionButtonRefs.current.set(pathKey, el);
              } else {
                actionButtonRefs.current.delete(pathKey);
              }
            }}
            className={styles.advancedFilterMenu__actionBtn}
            onClick={(e) => {
              e.stopPropagation();
              setOpenActionMenu(showActionMenu ? null : { path });
            }}
            title="Ações"
          >
            <i className="fas fa-ellipsis-vertical" />
          </button>
        </div>
      </div>
    );
  }, [columns, openActionMenu, handleToggleLogic, handleUpdateColumn, handleUpdateCondition, handleUpdateValue, handleUpdateValueTo, handleDuplicateRule, handleTransformToGroup, handleRemoveRule]);

  // Render RuleGroup component (recursive)
  const renderRuleGroup = useCallback((group, path = [], isFirstInParent = false, parentLogic = 'AND') => {
    const pathKey = path.length === 0 ? 'root' : path.join('-');
    const isRootGroup = path.length === 0;
    const openAddRuleMenuPathKey = openAddRuleMenu ? (openAddRuleMenu.path.length === 0 ? 'root' : openAddRuleMenu.path.join('-')) : null;
    const showAddMenu = openAddRuleMenu && openAddRuleMenuPathKey === pathKey;
    const openActionMenuPathKey = openActionMenu ? (openActionMenu.path.length === 0 ? 'root' : openActionMenu.path.join('-')) : null;
    const showActionMenu = openActionMenu && openActionMenuPathKey === pathKey;
    // #region agent log
    if (openAddRuleMenu) {
      fetch('http://127.0.0.1:7242/ingest/6c3ae44d-694c-470a-8389-0c131f51518f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdvancedFilterMenu.jsx:653',message:'Calculating showAddMenu',data:{pathKey,openAddRuleMenuPathKey,showAddMenu,isRootGroup},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    }
    // #endregion

    const content = (
      <>
        {/* Group header for non-root groups */}
        {!isRootGroup && (
          <div className={styles.advancedFilterMenu__ruleRow}>
            {isFirstInParent ? (
              <span className={`${styles.advancedFilterMenu__logicToggle} ${styles.static}`}>
                Onde
              </span>
            ) : (
              <Select
                value={group.logic || 'AND'}
                onChange={(value) => {
                  const newGroup = JSON.parse(JSON.stringify(localGroup));
                  const { parent, index } = getParentAndIndex(newGroup, path);
                  if (parent && parent.rules && parent.rules[index]) {
                    parent.rules[index].logic = value;
                    setLocalGroup(newGroup);
                    onUpdateFilterGroup?.(newGroup);
                  }
                }}
                options={[
                  { value: 'AND', label: 'E' },
                  { value: 'OR', label: 'Ou' }
                ]}
                className={styles.advancedFilterMenu__logicToggle}
              />
            )}
            <span style={{ flex: 1, fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>
              Grupo de regras ({group.logic === 'AND' ? 'Todas' : 'Qualquer'})
            </span>
            
            {/* Group action menu */}
            <div style={{ position: 'relative' }}>
              <button
                className={styles.advancedFilterMenu__actionBtn}
                onClick={() => setOpenActionMenu(showActionMenu ? null : { path })}
                title="Ações"
              >
                <i className="fas fa-ellipsis-vertical" />
              </button>

              {showActionMenu && (
                <div className={styles.advancedFilterMenu__actionDropdown}>
                  <button
                    className={styles.advancedFilterMenu__actionDropdown__item}
                    onClick={() => handleDuplicateRule(path)}
                  >
                    <i className={`far fa-copy ${styles.advancedFilterMenu__actionDropdown__icon}`} />
                    Duplicar grupo
                  </button>
                  <button
                    className={`${styles.advancedFilterMenu__actionDropdown__item} ${styles.danger}`}
                    onClick={() => handleRemoveRule(path)}
                  >
                    <i className={`far fa-trash ${styles.advancedFilterMenu__actionDropdown__icon}`} />
                    Remover grupo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Group inner content */}
        <div className={isRootGroup ? '' : styles.advancedFilterMenu__group__inner}>
          {group.rules && group.rules.map((item, index) => {
            const itemPath = [...path, index];
            const isFirst = index === 0;
            
            if (item.type === 'group') {
              return renderRuleGroup(item, itemPath, isFirst, group.logic);
            }
            return renderRuleRow(item, itemPath, isFirst, group.logic);
          })}
          
          {/* Add rule button */}
          <div style={{ position: 'relative' }} className={isRootGroup ? '' : styles.advancedFilterMenu__group__addRule}>
            <button
              ref={(el) => {
                if (el) {
                  addRuleButtonRefs.current.set(pathKey, el);
                } else {
                  addRuleButtonRefs.current.delete(pathKey);
                }
              }}
              className={styles.advancedFilterMenu__addRule}
              onClick={(e) => {
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/6c3ae44d-694c-470a-8389-0c131f51518f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdvancedFilterMenu.jsx:783',message:'Add rule button clicked',data:{pathKey,path:JSON.stringify(path),showAddMenu,openAddRuleMenuPathKey,isRootGroup},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
                e.stopPropagation();
                setOpenAddRuleMenu(showAddMenu ? null : { path });
              }}
            >
              <i className={`far fa-plus ${styles.advancedFilterMenu__addRule__icon}`} />
              Adicionar regra
              <i className="fas fa-chevron-down" style={{ fontSize: '0.6rem', marginLeft: 'auto' }} />
            </button>
          </div>
        </div>
      </>
    );

    if (isRootGroup) {
      return content;
    }

    return (
      <div key={group.id || `group-${pathKey}`} className={styles.advancedFilterMenu__group}>
        {content}
      </div>
    );
  }, [localGroup, openAddRuleMenu, openActionMenu, getParentAndIndex, onUpdateFilterGroup, handleAddRule, handleAddGroup, handleDuplicateRule, handleRemoveRule, renderRuleRow]);

  if (!isVisible || menuState.type !== 'advanced-filter-menu' || !localGroup) return null;

  const menuStyle = {
    position: 'absolute',
    top: `${menuState.position.top}px`,
    left: `${menuState.position.left}px`,
    zIndex: 1001
  };

  const hasRules = localGroup.rules && localGroup.rules.length > 0;

  return (
    <div 
      ref={menuRef} 
      className={`${styles.advancedFilterMenu} ${isClosing ? styles.closing : ''}`} 
      style={menuStyle}
    >
      {/* Header */}
      <div className={styles.advancedFilterMenu__header}>
        <span className={styles.advancedFilterMenu__header__title}>
          Filtro Avançado
        </span>
        <button 
          className={styles.advancedFilterMenu__header__close}
          onClick={handleCancel}
        >
          <i className="far fa-xmark" />
        </button>
      </div>

      {/* Body */}
      <div className={styles.advancedFilterMenu__body}>
        {!hasRules ? (
          <div className={styles.advancedFilterMenu__empty}>
            <i className={`far fa-filter-slash ${styles.advancedFilterMenu__empty__icon}`} />
            <span className={styles.advancedFilterMenu__empty__text}>
              Nenhuma regra adicionada.
            </span>
            <button
              className={styles.advancedFilterMenu__addRule}
              onClick={() => handleAddRule([])}
              style={{ marginTop: '0.5rem' }}
            >
              <i className={`far fa-plus ${styles.advancedFilterMenu__addRule__icon}`} />
              Adicionar primeira regra
            </button>
          </div>
        ) : (
          renderRuleGroup(localGroup)
        )}
      </div>

      {/* Footer */}
      <div className={styles.advancedFilterMenu__footer}>
        <div className={styles.advancedFilterMenu__footer__left}>
          <button 
            className={`${styles.advancedFilterMenu__footer__button} ${styles.danger}`}
            onClick={handleDelete}
          >
            <i className={`far fa-trash ${styles.advancedFilterMenu__footer__button__icon}`} />
            Deletar
          </button>
        </div>
        <div className={styles.advancedFilterMenu__footer__right}>
          <button 
            className={styles.advancedFilterMenu__footer__button}
            onClick={handleCancel}
          >
            Cancelar
          </button>
          <button 
            className={`${styles.advancedFilterMenu__footer__button} ${styles.primary}`}
            onClick={handleSave}
          >
            <i className={`far fa-check ${styles.advancedFilterMenu__footer__button__icon}`} />
            Salvar
          </button>
        </div>
      </div>

      {/* Action dropdown portal */}
      {openActionMenu && createPortal(
        <div
          ref={actionDropdownRef}
          className={styles.advancedFilterMenu__actionDropdown}
          style={{
            position: 'absolute',
            top: `${actionDropdownPosition.top}px`,
            left: `${actionDropdownPosition.left}px`,
            zIndex: 1010
          }}
        >
          <button
            className={styles.advancedFilterMenu__actionDropdown__item}
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicateRule(openActionMenu.path);
              setOpenActionMenu(null);
            }}
          >
            <i className={`far fa-copy ${styles.advancedFilterMenu__actionDropdown__icon}`} />
            Duplicar regra
          </button>
          <button
            className={styles.advancedFilterMenu__actionDropdown__item}
            onClick={(e) => {
              e.stopPropagation();
              handleTransformToGroup(openActionMenu.path);
              setOpenActionMenu(null);
            }}
          >
            <i className={`far fa-layer-group ${styles.advancedFilterMenu__actionDropdown__icon}`} />
            Transformar em grupo
          </button>
          <button
            className={`${styles.advancedFilterMenu__actionDropdown__item} ${styles.danger}`}
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveRule(openActionMenu.path);
              setOpenActionMenu(null);
            }}
          >
            <i className={`far fa-trash ${styles.advancedFilterMenu__actionDropdown__icon}`} />
            Remover regra
          </button>
        </div>,
        document.body
      )}

      {/* Add rule dropdown portal */}
      {openAddRuleMenu && createPortal(
        <div
          ref={addRuleDropdownRef}
          className={styles.advancedFilterMenu__addRuleDropdown}
          style={{
            position: 'absolute',
            top: `${addRuleDropdownPosition.top}px`,
            left: `${addRuleDropdownPosition.left}px`,
            zIndex: 1010
          }}
        >
          <button
            className={styles.advancedFilterMenu__addRuleDropdown__item}
            onClick={(e) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/6c3ae44d-694c-470a-8389-0c131f51518f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdvancedFilterMenu.jsx:960',message:'Add rule simple button clicked',data:{pathKey:openAddRuleMenu.path.length === 0 ? 'root' : openAddRuleMenu.path.join('-'),path:JSON.stringify(openAddRuleMenu.path)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
              // #endregion
              e.stopPropagation();
              e.preventDefault();
              handleAddRule(openAddRuleMenu.path);
              setOpenAddRuleMenu(null);
            }}
          >
            <i className={`far fa-filter ${styles.advancedFilterMenu__addRuleDropdown__icon}`} />
            Adicionar regra simples
          </button>
          <button
            className={styles.advancedFilterMenu__addRuleDropdown__item}
            onClick={(e) => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/6c3ae44d-694c-470a-8389-0c131f51518f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdvancedFilterMenu.jsx:975',message:'Add group button clicked',data:{pathKey:openAddRuleMenu.path.length === 0 ? 'root' : openAddRuleMenu.path.join('-'),path:JSON.stringify(openAddRuleMenu.path)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
              // #endregion
              e.stopPropagation();
              e.preventDefault();
              handleAddGroup(openAddRuleMenu.path);
              setOpenAddRuleMenu(null);
            }}
          >
            <i className={`far fa-layer-group ${styles.advancedFilterMenu__addRuleDropdown__icon}`} />
            Adicionar grupo de regras
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}));

AdvancedFilterMenu.displayName = 'AdvancedFilterMenu';