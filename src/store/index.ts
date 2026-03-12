import { create } from 'zustand';
import { temporal } from 'zundo';
import { createFlowSlice } from './flowSlice';
import { createUiSlice } from './uiSlice';
import type { AppState } from './types';

export const useAppStore = create<AppState>()(
  temporal(
    (...a) => ({
      ...createFlowSlice(...a),
      ...createUiSlice(...a),
    }),
    {
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
      limit: 100,
    }
  )
);
