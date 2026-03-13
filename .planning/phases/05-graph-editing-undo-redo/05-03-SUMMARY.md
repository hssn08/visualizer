---
phase: 05-graph-editing-undo-redo
plan: 03
subsystem: ui
tags: [zundo, undo-redo, keyboard-shortcuts, temporal, drag-throttle, zustand]

# Dependency graph
requires:
  - phase: 05-graph-editing-undo-redo
    provides: Node palette (05-01), edge sync and node deletion (05-02) — all editing operations that need undo/redo
  - phase: 01-project-setup
    provides: Zundo temporal middleware with partialize and limit on store
provides:
  - Global Ctrl/Cmd+Z undo and Ctrl/Cmd+Shift+Z redo keyboard shortcuts
  - Node drag creates exactly one undo step via temporal pause/snapshot/resume
  - useUndoRedo side-effect hook wired at App level
affects: [07-theme-polish]

# Tech tracking
tech-stack:
  added: []
  patterns: [temporal-pause-snapshot-resume for drag undo, global-keyboard-hook]

key-files:
  created:
    - src/hooks/useUndoRedo.ts
    - src/hooks/__tests__/useUndoRedo.test.ts
  modified:
    - src/components/canvas/FlowCanvas.tsx
    - src/store/__tests__/store.test.ts
    - src/App.tsx

key-decisions:
  - "Pause/snapshot/resume pattern for drag: Zundo resume() does not auto-create undo entry, so we capture pre-drag state and manually push to pastStates on drag stop"
  - "Reference equality check for click-without-drag: if nodes/edges refs unchanged during pause, skip undo entry creation"

patterns-established:
  - "Temporal pause/snapshot/resume: save partialized state before pause, push to pastStates after resume for collapsed undo"
  - "Side-effect-only hooks: useUndoRedo takes no params, returns nothing, just registers global keydown listener"

requirements-completed: [UNDO-01, UNDO-02, UNDO-03, UI-04]

# Metrics
duration: 8min
completed: 2026-03-13
---

# Plan 05-03: Undo/Redo Keyboard Shortcuts Summary

**Global Ctrl/Cmd+Z undo and Shift+Z redo with drag-as-single-step via temporal pause/snapshot/resume**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-13T10:55:00Z
- **Completed:** 2026-03-13T11:20:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- useUndoRedo hook with global keydown listener for Ctrl/Cmd+Z undo and Ctrl/Cmd+Shift+Z redo
- Node drag creates exactly one undo step: pre-drag snapshot captured, temporal paused during drag, snapshot pushed to history on drag stop
- Click-without-drag correctly produces no undo entry (reference equality check)
- 9 new tests (6 useUndoRedo + 3 temporal store tests), 219 total passing

## Task Commits

Each task was committed atomically:

1. **Task 1: useUndoRedo hook with global keyboard shortcuts** - `2389b22` (feat)
2. **Task 2: Drag pause/resume for single-step undo** - `ba0a0df` (feat)

_Note: TDD tasks have test + feat commits_

## Files Created/Modified
- `src/hooks/useUndoRedo.ts` - Side-effect-only hook: global keydown listener for undo/redo
- `src/hooks/__tests__/useUndoRedo.test.ts` - 6 tests: Ctrl+Z, Ctrl+Shift+Z, Meta variants, plain z rejection, cleanup
- `src/components/canvas/FlowCanvas.tsx` - onNodeDragStart/onNodeDragStop with pause/snapshot/resume pattern
- `src/store/__tests__/store.test.ts` - 3 temporal tests: addNode undo, pause/snapshot/resume, independent undo layers
- `src/App.tsx` - useUndoRedo() call at App level for global shortcuts

## Decisions Made
- Pause/snapshot/resume pattern instead of plain pause/resume: Zundo v2.3.0 resume() only sets isTracking=true without creating history entries, so pre-drag state must be manually pushed to pastStates
- Reference equality check on drag stop: avoids creating no-op undo entries when React Flow fires onNodeDragStop without actual position change

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Pause/resume alone insufficient for undo entry**
- **Found during:** Task 2 (Drag pause/resume implementation)
- **Issue:** Plan specified `temporal.pause()` / `temporal.resume()` but Zundo v2.3.0 resume() does not auto-create history entries — pre-drag state is silently lost
- **Fix:** Added snapshot capture before pause, manual push to pastStates after resume (with reference equality guard for click-without-drag)
- **Files modified:** src/components/canvas/FlowCanvas.tsx
- **Verification:** 3 temporal store tests pass, all 219 tests pass
- **Committed in:** ba0a0df (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential for correctness — without snapshot+push, drag undo would silently fail.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Phase 05 editing operations complete: palette DnD, edge sync, node deletion, undo/redo
- Every editing action (add node, draw edge, delete edge, delete node, property edits, drag) is undoable
- Ready for Phase 06 (JSON preview, validation) or Phase 07 (theme polish)

---
*Phase: 05-graph-editing-undo-redo*
*Completed: 2026-03-13*
