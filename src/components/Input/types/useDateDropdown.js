import { useState, useEffect, useCallback } from 'react';

/**
 * Calculates dropdown position for the date picker.
 * Uses the actual dropdown container height (via dropdownRef) instead of a fixed size,
 * so TimePicker (hora) and DatePickerCalendar position correctly.
 */
export function useDateDropdown({
  triggerRef,
  dropdownRef,
  isOpen,
  onClose,
  portalContainer = document.body,
}) {
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 'auto',
    minWidth: 120,
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

  const computePosition = useCallback(
    (contentHeight) => {
      const trigger = triggerRef?.current;
      if (!trigger) return null;

      const triggerRect = trigger.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      const spaceBelow = viewportHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      let viewportTop = triggerRect.bottom;
      let direction = 'below';
      if (spaceBelow < contentHeight) {
        viewportTop = triggerRect.top - contentHeight;
        direction = 'above';
        if (viewportTop < 0) viewportTop = 0;
      }

      const dropdownWidth = Math.max(triggerRect.width, 280);
      let viewportLeft = triggerRect.left;
      if (viewportLeft + dropdownWidth > viewportWidth) {
        viewportLeft = viewportWidth - dropdownWidth;
      }
      if (viewportLeft < 0) viewportLeft = 0;

      const relative = convertToPortalRelative({ top: viewportTop, left: viewportLeft });

      return {
        top: relative.top,
        left: relative.left,
        width: `${Math.max(triggerRect.width, 280)}px`,
        minWidth: `${Math.max(triggerRect.width, 280)}px`,
        direction,
      };
    },
    [convertToPortalRelative, triggerRef]
  );

  // Phase 1: initial position (below) so dropdown can render and be measured
  useEffect(() => {
    if (!isOpen || !triggerRef?.current) {
      setPositionReady(false);
      return;
    }

    const trigger = triggerRef.current;
    const triggerRect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const dropdownWidth = Math.max(triggerRect.width, 280);
    let viewportLeft = triggerRect.left;
    if (viewportLeft + dropdownWidth > viewportWidth) viewportLeft = viewportWidth - dropdownWidth;
    if (viewportLeft < 0) viewportLeft = 0;

    const relative = convertToPortalRelative({
      top: triggerRect.bottom,
      left: viewportLeft,
    });

    setPosition({
      top: relative.top,
      left: relative.left,
      width: `${dropdownWidth}px`,
      minWidth: `${dropdownWidth}px`,
      direction: 'below',
    });
    setPositionReady(true);
  }, [isOpen, convertToPortalRelative, triggerRef]);

  // Phase 2: measure actual dropdown height and recalculate above/below
  const recalcFromMeasured = useCallback(() => {
    const dropdown = dropdownRef?.current;
    const trigger = triggerRef?.current;
    if (!dropdown || !trigger) return;

    const dropdownRect = dropdown.getBoundingClientRect();
    const contentHeight = dropdownRect.height + 8;
    const newPos = computePosition(contentHeight);
    if (newPos) setPosition((prev) => ({ ...prev, ...newPos }));
  }, [dropdownRef, triggerRef, computePosition]);

  useEffect(() => {
    if (!isOpen || !positionReady || !dropdownRef?.current || !triggerRef?.current) return;

    const raf = requestAnimationFrame(recalcFromMeasured);
    const onResize = () => recalcFromMeasured();
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [isOpen, positionReady, dropdownRef, triggerRef, recalcFromMeasured]);

  return { position, positionReady };
}
