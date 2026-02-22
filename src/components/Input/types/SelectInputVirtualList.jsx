import React, { useRef, useState, useEffect, useCallback } from 'react';

const ITEM_HEIGHT = 40;
const OVERSCAN = 2;

/**
 * Virtual list: renders only visible items + overscan for smooth scrolling.
 */
export function SelectInputVirtualList({
  options = [],
  selectedValues,
  highlightedIndex,
  renderOption,
  className,
  listRef,
}) {
  const scrollRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      setContainerHeight(el.clientHeight);
    });
    ro.observe(el);
    setContainerHeight(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (highlightedIndex < 0 || !scrollRef.current) return;
    const el = scrollRef.current;
    const itemTop = highlightedIndex * ITEM_HEIGHT;
    const itemBottom = itemTop + ITEM_HEIGHT;
    const viewTop = el.scrollTop;
    const viewBottom = el.scrollTop + el.clientHeight;
    if (itemTop < viewTop) {
      el.scrollTop = itemTop;
    } else if (itemBottom > viewBottom) {
      el.scrollTop = itemBottom - el.clientHeight;
    }
  }, [highlightedIndex]);

  const totalHeight = options.length * ITEM_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(options.length - 1, startIndex + visibleCount);
  const visibleOptions = options.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * ITEM_HEIGHT;

  return (
    <div
      ref={(node) => {
        scrollRef.current = node;
        if (typeof listRef === 'function') listRef(node);
        else if (listRef) listRef.current = node;
      }}
      className={className}
      onScroll={handleScroll}
      style={{ overflow: 'auto', overflowX: 'hidden' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleOptions.map((opt, i) => {
            const globalIndex = startIndex + i;
            const isSelected = selectedValues?.has(opt.value);
            const isHighlighted = globalIndex === highlightedIndex;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                data-index={globalIndex}
                style={{
                  height: ITEM_HEIGHT,
                  minHeight: ITEM_HEIGHT,
                  boxSizing: 'border-box',
                }}
              >
                {renderOption
                  ? renderOption(opt, { isSelected, isHighlighted, index: globalIndex })
                  : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
