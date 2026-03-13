import { useEffect } from 'react';
import { useAppStore } from '@/store';

/**
 * Side-effect-only hook that attaches a global keydown listener for
 * undo (Ctrl/Cmd+Z) and redo (Ctrl/Cmd+Shift+Z).
 *
 * Call once at the App level to ensure shortcuts work from anywhere.
 */
export function useUndoRedo(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== 'z') return;

      e.preventDefault();

      if (e.shiftKey) {
        useAppStore.temporal.getState().redo();
      } else {
        useAppStore.temporal.getState().undo();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
