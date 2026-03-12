---
phase: 02-json-transform-layer
plan: 02
subsystem: lib
tags: [json, transform, reverse-transform, round-trip, import, zustand, react, file-picker]

# Dependency graph
requires:
  - phase: 02-json-transform-layer
    plan: 01
    provides: "jsonToFlow forward transform, types, edgeExtractors, sampleFlow fixture"
  - phase: 01-project-scaffold-foundation
    provides: "Zustand store, FlowCanvas, shadcn Button, lucide-react"
provides:
  - "flowToJson reverse transform: nodes + edges + metadata -> original JSON structure"
  - "Lossless round-trip: jsonToFlow -> flowToJson preserves all fields"
  - "Store importJson action: raw JSON -> parsed nodes/edges/rawJson/metadata"
  - "Store setNodes/setEdges actions for programmatic state updates"
  - "ImportButton component with file picker for JSON import"
  - "App toolbar layout with import button above canvas"
affects: [03-canvas-rendering, 04-property-panel, 05-sidebar, 06-export]

# Tech tracking
tech-stack:
  added: []
  patterns: [reverse-transform, round-trip-lossless, file-import-ui, toolbar-layout]

key-files:
  created:
    - src/lib/flowToJson.ts
    - src/lib/__tests__/flowToJson.test.ts
    - src/lib/__tests__/roundTrip.test.ts
    - src/components/toolbar/ImportButton.tsx
  modified:
    - src/store/types.ts
    - src/store/flowSlice.ts
    - src/App.tsx
    - src/store/__tests__/store.test.ts
    - src/__tests__/App.test.tsx

key-decisions:
  - "delete operator for absent connections: ensures JSON.stringify produces clean output without null/undefined fields"
  - "Shallow clone of node.data.step in flowToJson: prevents mutation of store state during export"
  - "Shallow clone of conditions array items: preserves non-next fields while updating connection targets"
  - "rawJson and metadata excluded from Zundo partialize: import metadata should not create undo history"

patterns-established:
  - "Reverse transform pattern: flowToJson mirrors jsonToFlow for bidirectional conversion"
  - "Connection field update via edge filtering: outgoing edges grouped by edgeType for each step"
  - "File import pattern: hidden input + Button + useRef for clean file picker UX"
  - "Toolbar layout: border-b bar above flex-1 canvas area for action buttons"

requirements-completed: [IMP-01, IMP-04]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 2 Plan 02: flowToJson Reverse Transform and Import Pipeline Summary

**Lossless reverse transform flowToJson with round-trip verification, Zustand importJson action, and ImportButton UI completing the full JSON import pipeline**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T12:21:38Z
- **Completed:** 2026-03-12T12:25:58Z
- **Tasks:** 2
- **Files created:** 4
- **Files modified:** 5

## Accomplishments
- Built flowToJson reverse transform that reconstructs original JSON from ReactFlow nodes, edges, and metadata
- All 5 connection field types updated from edge state (next, conditions, timeout_next, no_match_next, intent_detector_routes)
- Round-trip test proves lossless conversion: jsonToFlow -> flowToJson preserves every field including non-visual ones
- Extended Zustand store with importJson, setNodes, setEdges, rawJson, metadata
- ImportButton component with file picker triggers full import pipeline
- 24 new tests passing (18 flowToJson/roundTrip + 5 store + 1 App), 72 total

## Task Commits

Each task was committed atomically with TDD RED/GREEN commits:

1. **Task 1: flowToJson reverse transform with round-trip tests**
   - `a42f005` (test) - Failing tests for flowToJson and round-trip
   - `1319c49` (feat) - Implementation passing all 18 tests

2. **Task 2: Extend store with importJson and wire ImportButton into App**
   - `f7c0759` (feat) - Store extension, ImportButton, App toolbar layout

## Files Created/Modified
- `src/lib/flowToJson.ts` - Reverse transform: nodes + edges + metadata -> JSON with connection field updates
- `src/lib/__tests__/flowToJson.test.ts` - 12 unit tests for flowToJson (wrapper fields, all 5 edge types, delete semantics)
- `src/lib/__tests__/roundTrip.test.ts` - 6 round-trip tests (full structure, wrapper fields, non-visual fields, conditions, intents)
- `src/components/toolbar/ImportButton.tsx` - File picker button with error handling and input reset
- `src/store/types.ts` - Extended FlowSlice with rawJson, metadata, setNodes, setEdges, importJson
- `src/store/flowSlice.ts` - importJson calls jsonToFlow, setNodes/setEdges direct setters
- `src/App.tsx` - Toolbar layout with ImportButton above flex canvas area
- `src/store/__tests__/store.test.ts` - 5 new tests for store extensions
- `src/__tests__/App.test.tsx` - 1 new test for ImportButton rendering

## Decisions Made
- Used `delete` operator for absent connection fields to ensure clean JSON output (no null/undefined in serialized JSON)
- Shallow clone of node.data.step and condition items to prevent mutation of live store state during export
- rawJson and metadata excluded from Zundo partialize (already correct in store/index.ts) -- import metadata is reference data, not user-editable state that should have undo history

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Complete import pipeline ready: user can click Import, select JSON, see nodes rendered on canvas
- flowToJson ready for Phase 6 export functionality
- Toolbar established for Phase 4 to add more action buttons
- Store extension pattern established for future slice additions
- 72 tests providing solid regression safety net for Phase 3 canvas rendering work

## Self-Check: PASSED

All 8 files verified present. All 3 commits verified in git log.

---
*Phase: 02-json-transform-layer*
*Completed: 2026-03-12*
