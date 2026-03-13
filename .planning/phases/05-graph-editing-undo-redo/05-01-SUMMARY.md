---
phase: 05-graph-editing-undo-redo
plan: 01
subsystem: ui
tags: [react-flow, dnd, pointer-events, zustand, palette, node-creation]

# Dependency graph
requires:
  - phase: 04-property-panel-toolbar
    provides: Store with nodes/edges, StepNode component, App layout with toolbar
provides:
  - NodePalette left sidebar with 3 draggable step templates
  - PaletteItem with pointer-event DnD pattern (shared module state)
  - nodeTemplates definitions (NODE_TEMPLATES, generateNodeId, createNodeFromTemplate)
  - addNode store action
  - FlowCanvas DnD drop handler with screenToFlowPosition
affects: [05-graph-editing-undo-redo, graph-editing, node-creation]

# Tech tracking
tech-stack:
  added: []
  patterns: [pointer-event-dnd, shared-module-dnd-state, template-based-node-creation]

key-files:
  created:
    - src/components/palette/nodeTemplates.ts
    - src/components/palette/PaletteItem.tsx
    - src/components/palette/NodePalette.tsx
    - src/components/palette/__tests__/NodePalette.test.tsx
  modified:
    - src/components/canvas/FlowCanvas.tsx
    - src/App.tsx

key-decisions:
  - "Pointer-event DnD with shared module state instead of HTML5 drag API"
  - "screenToFlowPosition for accurate coordinate conversion (handles zoom/pan/DPI)"
  - "Template-based node creation with unique ID generation via incrementing counter"

patterns-established:
  - "Pointer-event DnD: PaletteItem sets module-level template type on pointerDown, FlowCanvas reads and clears on pointerUp"
  - "Node creation: createNodeFromTemplate builds complete React Flow Node from template + position + existing IDs"
  - "ID generation: type_step_N pattern with collision avoidance via Set lookup"

requirements-completed: [GRAPH-01, GRAPH-02]

# Metrics
duration: 5min
completed: 2026-03-13
---

# Phase 5 Plan 1: Node Palette Summary

**Left sidebar node palette with 3 draggable templates (Basic/Decision/Terminal) using pointer-event DnD and screenToFlowPosition for canvas node creation**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-13T09:23:11Z
- **Completed:** 2026-03-13T09:28:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Node palette with Basic Step, Decision Step, and Terminal Step templates in left sidebar
- Pointer-event DnD pattern: drag from palette, drop on canvas creates new node at exact position
- 14 new tests covering templates, ID generation, createNodeFromTemplate, addNode store action, and GRAPH-01 contract
- Full test suite green (204 tests passing across 19 test files)

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Failing tests** - `a7bb6ed` (test)
2. **Task 1 (GREEN): Templates, ID gen, palette components** - `2113d8c` (feat)
3. **Task 2: DnD drop handler + App layout wiring** - `10dc316` (feat)

_TDD approach: RED tests committed first, then GREEN implementation._

## Files Created/Modified
- `src/components/palette/nodeTemplates.ts` - NODE_TEMPLATES array, generateNodeId, createNodeFromTemplate
- `src/components/palette/PaletteItem.tsx` - Draggable card with pointer-event DnD and lucide icons
- `src/components/palette/NodePalette.tsx` - Left sidebar component with "Add Step" header
- `src/components/palette/__tests__/NodePalette.test.tsx` - 14 tests for templates, ID, creation, store
- `src/components/canvas/FlowCanvas.tsx` - DnD drop handler using screenToFlowPosition + addNode
- `src/App.tsx` - NodePalette rendered in left sidebar slot

## Decisions Made
- **Pointer-event DnD with shared module state:** Used module-level variable in PaletteItem to pass template type to FlowCanvas drop handler, avoiding HTML5 drag API issues with ghost images and React Flow coordinate conflicts
- **screenToFlowPosition for coordinates:** React Flow's built-in method handles zoom, pan, and DPI correctly -- no manual viewport math needed
- **Incrementing counter for IDs:** `type_step_N` pattern with Set-based collision check ensures unique IDs even with imported flows

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Store addNode and onEdgesDelete already present from 05-02 RED phase**
- **Found during:** Task 2 (store integration)
- **Issue:** Plan 05-02's RED phase had already committed addNode to types.ts and flowSlice.ts
- **Fix:** No fix needed; used the existing addNode implementation which matched the plan specification
- **Files modified:** None (already committed by 05-02)
- **Verification:** All 14 palette tests pass including addNode store tests

---

**Total deviations:** 1 noted (pre-existing store changes from 05-02 RED phase)
**Impact on plan:** No scope creep. addNode implementation matched plan specification exactly.

## Issues Encountered
- Pre-existing failing test `useNodeDelete.test.ts` from plan 05-02's RED phase -- not related to this plan, excluded from verification

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Node palette complete and wired into App layout
- DnD infrastructure ready for Plans 05-02 (edge sync) and 05-03 (node deletion, undo/redo)
- addNode store action available for all node creation flows

## Self-Check: PASSED

- All 6 created/modified files verified on disk
- All 3 task commits verified in git log (a7bb6ed, 2113d8c, 10dc316)
- 204 tests passing across 19 test files (excluding pre-existing 05-02 RED phase failures)

---
*Phase: 05-graph-editing-undo-redo*
*Completed: 2026-03-13*
