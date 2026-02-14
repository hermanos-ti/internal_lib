import { createContext } from 'react';

/**
 * Returns the DOM node to use as the container for createPortal.
 * When the returned value is null/undefined, callers should fall back to document.body.
 * @returns {HTMLElement | (() => HTMLElement | null) | null}
 */
export const PortalTargetContext = createContext(() => document.body);
