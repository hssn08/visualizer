import type { StateCreator } from 'zustand';
import type { AppState, UiSlice } from './types';

export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set) => ({
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  jsonPreviewOpen: false,
  toggleJsonPreview: () =>
    set((state) => ({ jsonPreviewOpen: !state.jsonPreviewOpen })),
});
