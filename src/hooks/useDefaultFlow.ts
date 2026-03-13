import { useEffect } from 'react';
import { useAppStore } from '@/store';
import defaultFlow from '@/data/defaultFlow.json';

/**
 * Loads the default Medicare test flow on first visit when the store is empty.
 * Clears undo history after loading so Ctrl+Z won't revert to blank canvas.
 */
export function useDefaultFlow() {
  useEffect(() => {
    const { metadata } = useAppStore.getState();
    if (!metadata) {
      useAppStore.getState().importJson(defaultFlow as Record<string, unknown>);
      // Clear undo history so default load is not an undo step
      useAppStore.temporal.getState().clear();
    }
  }, []);
}
