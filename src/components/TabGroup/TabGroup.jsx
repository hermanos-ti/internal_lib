import styles from './TabGroup.module.css';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const getFirstEnabledId = (tabsList) => {
  const firstEnabled = tabsList.find((tab) => !tab.disabled);
  return firstEnabled ? firstEnabled.id : '';
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const TabGroup = ({
  tabs = [],
  placement = 'top',
  active = '',
  activation = 'auto',
  withoutScrollControls = false,
  tabShow,
  tabHide,
}) => {
  const [localTabs, setLocalTabs] = useState(() => tabs);
  const [activeId, setActiveId] = useState(() => active || getFirstEnabledId(tabs));
  const [focusedId, setFocusedId] = useState('');

  const tablistRef = useRef(null);
  const tabRefs = useRef({});
  const prevActiveRef = useRef('');
  const prevActivePropRef = useRef(active);

  const [canScrollBefore, setCanScrollBefore] = useState(false);
  const [canScrollAfter, setCanScrollAfter] = useState(false);

  useEffect(() => {
    setLocalTabs(tabs);
  }, [tabs]);

  useEffect(() => {
    // Só atualiza activeId quando a prop active mudar externamente
    if (active !== prevActivePropRef.current) {
      prevActivePropRef.current = active;
      if (active) {
        setActiveId(active);
        return;
      }
    }

    // Se não há active definido ou a tab ativa não existe mais, usa a primeira habilitada
    if (!active && (!activeId || !localTabs.some((tab) => tab.id === activeId && !tab.disabled))) {
      setActiveId(getFirstEnabledId(localTabs));
    }
  }, [active, activeId, localTabs]);

  useEffect(() => {
    const previousId = prevActiveRef.current;
    if (previousId !== activeId) {
      const previousTab = localTabs.find((tab) => tab.id === previousId);
      const nextTab = localTabs.find((tab) => tab.id === activeId);

      if (previousTab && typeof tabHide === 'function') {
        tabHide(previousTab);
      }
      if (nextTab && typeof tabShow === 'function') {
        tabShow(nextTab);
      }

      prevActiveRef.current = activeId;
    }
  }, [activeId, localTabs, tabHide, tabShow]);

  const isVertical = placement === 'start' || placement === 'end';

  const updateScrollState = useCallback(() => {
    const node = tablistRef.current;
    if (!node) return;

    if (isVertical) {
      setCanScrollBefore(node.scrollTop > 0);
      setCanScrollAfter(node.scrollTop + node.clientHeight < node.scrollHeight);
    } else {
      setCanScrollBefore(node.scrollLeft > 0);
      setCanScrollAfter(node.scrollLeft + node.clientWidth < node.scrollWidth);
    }
  }, [isVertical]);

  useEffect(() => {
    updateScrollState();
    const handleResize = () => updateScrollState();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateScrollState]);

  const scrollByAmount = useCallback(
    (direction) => {
      const node = tablistRef.current;
      if (!node) return;
      const amount = 150 * direction;
      if (isVertical) {
        node.scrollBy({ top: amount, behavior: 'smooth' });
      } else {
        node.scrollBy({ left: amount, behavior: 'smooth' });
      }
    },
    [isVertical]
  );

  const getTabIndex = useCallback(
    (id) => {
      if (focusedId) {
        return id === focusedId ? 0 : -1;
      }
      return id === activeId ? 0 : -1;
    },
    [activeId, focusedId]
  );

  const enabledTabs = useMemo(
    () => localTabs.filter((tab) => !tab.disabled),
    [localTabs]
  );

  const moveFocus = useCallback(
    (direction) => {
      if (enabledTabs.length === 0) return;

      const currentIndex = Math.max(
        enabledTabs.findIndex((tab) => tab.id === (focusedId || activeId)),
        0
      );
      const nextIndex = clamp(currentIndex + direction, 0, enabledTabs.length - 1);
      const nextTab = enabledTabs[nextIndex];
      if (!nextTab) return;

      setFocusedId(nextTab.id);
      tabRefs.current[nextTab.id]?.focus();
      if (activation === 'auto') {
        setActiveId(nextTab.id);
      }
    },
    [activation, activeId, enabledTabs, focusedId]
  );

  const handleKeyDown = (event) => {
    const { key } = event;
    if (key === 'ArrowRight' && !isVertical) {
      event.preventDefault();
      moveFocus(1);
    }
    if (key === 'ArrowLeft' && !isVertical) {
      event.preventDefault();
      moveFocus(-1);
    }
    if (key === 'ArrowDown' && isVertical) {
      event.preventDefault();
      moveFocus(1);
    }
    if (key === 'ArrowUp' && isVertical) {
      event.preventDefault();
      moveFocus(-1);
    }
    if ((key === 'Enter' || key === ' ') && activation === 'manual') {
      event.preventDefault();
      if (focusedId) {
        setActiveId(focusedId);
      }
    }
  };

  const handleRemove = (tabId) => {
    setLocalTabs((prevTabs) => {
      const nextTabs = prevTabs.filter((tab) => tab.id !== tabId);
      if (tabId === activeId) {
        const nextActive = getFirstEnabledId(nextTabs);
        setActiveId(nextActive);
      }
      return nextTabs;
    });
  };

  const tabGroupClass = [
    styles.tabGroup,
    placement === 'bottom' && styles.tabGroupBottom,
    placement === 'start' && styles.tabGroupStart,
    placement === 'end' && styles.tabGroupEnd,
  ]
    .filter(Boolean)
    .join(' ');

  const tabListClass = [
    styles.tabList,
    isVertical && styles.tabListVertical,
  ]
    .filter(Boolean)
    .join(' ');

  const scrollButtonClass = (visible) =>
    [
      styles.scrollButton,
      !visible && styles.scrollButtonHidden,
    ]
      .filter(Boolean)
      .join(' ');

  return (
    <div className={tabGroupClass}>
      <div className={styles.tabListContainer}>
        {!withoutScrollControls && (
          <button
            className={scrollButtonClass(canScrollBefore)}
            type="button"
            aria-label={isVertical ? 'Rolar para cima' : 'Rolar para a esquerda'}
            onClick={() => scrollByAmount(-1)}
          >
            {isVertical ? '˄' : '‹'}
          </button>
        )}
        <div
          ref={tablistRef}
          className={styles.tabListScroll}
          onScroll={updateScrollState}
        >
          <div
            role="tablist"
            aria-orientation={isVertical ? 'vertical' : 'horizontal'}
            className={tabListClass}
            onKeyDown={handleKeyDown}
          >
            {localTabs.map((tab) => {
              const isActive = tab.id === activeId;
              const isDisabled = tab.disabled;
              const tabClass = [
                styles.tabButton,
                isActive && styles.tabButtonActive,
                isDisabled && styles.tabButtonDisabled,
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  ref={(node) => {
                    if (node) {
                      tabRefs.current[tab.id] = node;
                    }
                  }}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  aria-disabled={isDisabled}
                  tabIndex={getTabIndex(tab.id)}
                  className={tabClass}
                  onClick={() => {
                    if (!isDisabled) {
                      setActiveId(tab.id);
                    }
                  }}
                  onFocus={() => setFocusedId(tab.id)}
                >
                  {tab.icone && <span className={styles.tabIcon}>{tab.icone}</span>}
                  <span>{tab.label}</span>
                  {tab.removable && (
                    <button
                      type="button"
                      className={styles.removeButton}
                      aria-label={`Remover ${tab.label}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemove(tab.id);
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {!withoutScrollControls && (
          <button
            className={scrollButtonClass(canScrollAfter)}
            type="button"
            aria-label={isVertical ? 'Rolar para baixo' : 'Rolar para a direita'}
            onClick={() => scrollByAmount(1)}
          >
            {isVertical ? '˅' : '›'}
          </button>
        )}
      </div>
      {activeId && (
        <div
          id={`panel-${activeId}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeId}`}
          className={[
            styles.panel,
            placement === 'top' && styles.panelTop,
            placement === 'bottom' && styles.panelBottom,
            placement === 'start' && styles.panelStart,
            placement === 'end' && styles.panelEnd,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {localTabs.find((tab) => tab.id === activeId)?.content ?? null}
        </div>
      )}
    </div>
  );
};