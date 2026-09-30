import { createContext, useContext } from 'react';

export const OrganogramaContext = createContext(null);

export function useOrganogramaContext() {
  const ctx = useContext(OrganogramaContext);
  if (!ctx) {
    throw new Error('useOrganogramaContext must be used within Organograma');
  }
  return ctx;
}

export function useOrganogramaContextSafe() {
  return useContext(OrganogramaContext);
}
