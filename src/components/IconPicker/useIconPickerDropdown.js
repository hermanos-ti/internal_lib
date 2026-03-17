import { useState, useEffect, useCallback } from 'react';

const POPOVER_WIDTH = 320;
const POPOVER_MAX_HEIGHT = 400;
const GAP_FROM_VIEWPORT = 8;

/**
 * Calculates IconPicker popover position (above or below trigger).
 * Uses fixed dimensions for the popover.
 */
export function useIconPickerDropdown({ triggerRef, isOpen, portalContainer = document.body }) {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    direction: 'below',
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

      const popoverHeight = Math.min(POPOVER_MAX_HEIGHT, Math.max(spaceBelow, spaceAbove));

      let viewportTop = triggerRect.bottom + GAP_FROM_VIEWPORT;
      let direction = 'below';

      if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
        viewportTop = triggerRect.top - Math.min(popoverHeight, spaceAbove) - GAP_FROM_VIEWPORT;
        direction = 'above';
      }

      let viewportLeft = triggerRect.left;
      if (viewportLeft + POPOVER_WIDTH > viewportWidth) {
        viewportLeft = viewportWidth - POPOVER_WIDTH;
      }
      if (viewportLeft < 0) viewportLeft = 0;

      const relative = convertToPortalRelative({ top: viewportTop, left: viewportLeft });

      setPosition({
        top: relative.top,
        left: relative.left,
        direction,
      });
      setPositionReady(true);
    };

    updatePosition();
    const t = setTimeout(updatePosition, 0);
    return () => clearTimeout(t);
  }, [isOpen, convertToPortalRelative, triggerRef]);

  return { position, positionReady };
}
