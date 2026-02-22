import { useState, useEffect, useCallback } from 'react';

const ITEM_HEIGHT = 40;
const MAX_DROPDOWN_HEIGHT = 400;
const GAP_FROM_VIEWPORT = 8;
const SEARCH_INPUT_HEIGHT = 40;
const SELECT_ALL_HEIGHT = 40;
const SELECTED_CHIPS_MAX_HEIGHT = 120;

/**
 * Calculates dropdown position and direction (above/below trigger).
 * Default: below. Flips to above when there's more space above.
 */
export function useSelectDropdown({
  triggerRef,
  isOpen,
  onClose,
  optionsCount,
  multiple = false,
  hasSearch = true,
  hasSelectAll = false,
  selectedChipsCount = 0,
  portalContainer = document.body,
}) {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 'auto',
    minWidth: 120,
    direction: 'below',
    maxHeight: MAX_DROPDOWN_HEIGHT,
  });
  const [positionReady, setPositionReady] = useState(false);

  const convertToPortalRelative = useCallback(
    (viewportPos) => {
      if (portalContainer === document.body) return viewportPos;
      const rect = portalContainer?.getBoundingClientRect?.();
      if (!rect) return viewportPos;
      return {
        top: viewportPos.top - rect.top,
        left: viewportPos.left - rect.left,
      };
    },
    [portalContainer]
  );

  useEffect(() => {
    if (!isOpen || !triggerRef?.current) {
      setPositionReady(false);
      return;
    }

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const triggerRect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const spaceBelow = viewportHeight - triggerRect.bottom - GAP_FROM_VIEWPORT;
      const spaceAbove = triggerRect.top - GAP_FROM_VIEWPORT;

      const fixedContentHeight = (hasSearch ? SEARCH_INPUT_HEIGHT : 0)
        + (multiple && hasSelectAll ? SELECT_ALL_HEIGHT : 0)
        + (multiple && selectedChipsCount > 0 ? Math.min(selectedChipsCount * 28 + 24, SELECTED_CHIPS_MAX_HEIGHT) : 0)
        + 8;

      const availableHeightBelow = Math.min(spaceBelow, MAX_DROPDOWN_HEIGHT);
      const availableHeightAbove = Math.min(spaceAbove, MAX_DROPDOWN_HEIGHT);

      let viewportTop = triggerRect.bottom;
      let direction = 'below';
      let maxHeight = availableHeightBelow;

      if (spaceBelow < fixedContentHeight + ITEM_HEIGHT && spaceAbove > spaceBelow) {
        viewportTop = triggerRect.top - Math.min(spaceAbove, MAX_DROPDOWN_HEIGHT);
        direction = 'above';
        maxHeight = availableHeightAbove;
      } else {
        maxHeight = availableHeightBelow;
      }

      const dropdownWidth = Math.max(triggerRect.width, 120);
      let viewportLeft = triggerRect.left;
      if (viewportLeft + dropdownWidth > viewportWidth) {
        viewportLeft = viewportWidth - dropdownWidth;
      }
      if (viewportLeft < 0) viewportLeft = 0;

      const relative = convertToPortalRelative({ top: viewportTop, left: viewportLeft });

      setPosition({
        top: relative.top,
        left: relative.left,
        width: `${Math.max(triggerRect.width, 120)}px`,
        minWidth: `${triggerRect.width}px`,
        direction,
        maxHeight,
      });
      setPositionReady(true);
    };

    updatePosition();
    const t = setTimeout(updatePosition, 0);
    return () => clearTimeout(t);
  }, [
    isOpen,
    optionsCount,
    multiple,
    hasSearch,
    hasSelectAll,
    selectedChipsCount,
    convertToPortalRelative,
    triggerRef,
  ]);

  return { position, positionReady };
}
