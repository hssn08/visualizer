---
phase: 02-json-transform-layer
plan: 01
subsystem: lib
tags: [json, transform, react-flow, edge-extraction, step-detection]

# Dependency graph
requires:
  - phase: 01-project-scaffold-foundation
    provides: "@xyflow/react Node/Edge types, vitest test framework, project structure"
provides:
  - "jsonToFlow pure function: raw JSON -> { nodes, edges, metadata }"
  - "detectStepsContainer heuristic for arbitrary JSON step detection"
  - "extractEdgesFromStep for all 5 edge types with unique IDs"
  - "FlowTransformResult, JsonMetadata, StepContainerResult types"
  - "Test fixture with 9-step Medicare call flow"
affects: [02-02-flowToJson, 03-canvas-rendering, 06-export]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-transform-functions, tdd-red-green, linking-field-heuristic]

key-files:
  created:
    - src/lib/types.ts
    - src/lib/detectSteps.ts
    - src/lib/edgeExtractors.ts
    - src/lib/jsonToFlow.ts
    - src/lib/__tests__/detectSteps.test.ts
    - src/lib/__tests__/edgeExtractors.test.ts
    - src/lib/__tests__/jsonToFlow.test.ts
    - src/lib/__tests__/fixtures/sampleFlow.json
  modified: []

key-decisions:
  - "Step key = node ID: step keys in JSON are directly used as React Flow node IDs for natural edge source/target references"
  - "Full step object in node.data.step via spread copy for IMP-04 field preservation"
  - "Edge ID format ${stepKey}->${type}->${target} guarantees uniqueness across all edge types"
  - "Grid layout (4 cols, 300px X, 200px Y) as temporary placeholder until Phase 3 dagre"
  - "Minimum 2 step objects required for detection to avoid false positives"

patterns-established:
  - "Pure transform pattern: jsonToFlow has zero React/store dependencies, trivially testable"
  - "TDD workflow: RED (failing tests) -> GREEN (minimal implementation) -> commit cycle"
  - "Edge type tagging: data.edgeType on every edge enables Phase 3 visual differentiation"
  - "Linking field heuristic: score-based detection picks best candidate from top-level keys"

requirements-completed: [IMP-01, IMP-02]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 2 Plan 01: jsonToFlow Forward Transform Summary

**Pure transform pipeline: detectStepsContainer heuristic + extractEdgesFromStep for 5 edge types + jsonToFlow orchestrator with dangling edge filtering and full step data preservation**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T12:13:15Z
- **Completed:** 2026-03-12T12:17:38Z
- **Tasks:** 2
- **Files created:** 8

## Accomplishments
- Built complete forward JSON-to-ReactFlow transform as pure functions with zero framework dependencies
- Step container auto-detection via linking field scoring heuristic (next, conditions, timeout_next, no_match_next, intent_detector_routes)
- All 5 edge types extracted with unique IDs, proper labels, and sourceHandle metadata for Phase 3 rendering
- 37 new tests passing alongside 11 existing Phase 1 tests (48 total)
- Full step data preserved in node.data.step for lossless round-trip (IMP-04 foundation)

## Task Commits

Each task was committed atomically with TDD RED/GREEN commits:

1. **Task 1: Types, detectSteps, and edgeExtractors**
   - `61ebbd4` (test) - Failing tests for detectSteps and edgeExtractors
   - `5da5edc` (feat) - Implementation passing all 24 tests

2. **Task 2: jsonToFlow orchestrator**
   - `048d719` (test) - Failing tests for jsonToFlow
   - `d23e9e5` (feat) - Implementation passing all 13 tests

## Files Created/Modified
- `src/lib/types.ts` - FlowTransformResult, JsonMetadata, StepContainerResult type definitions
- `src/lib/detectSteps.ts` - Step container detection heuristic with isPlainObject helper
- `src/lib/edgeExtractors.ts` - Edge extraction for all 5 linking field types
- `src/lib/jsonToFlow.ts` - Orchestrator: detect steps, build nodes, collect edges, filter dangling
- `src/lib/__tests__/fixtures/sampleFlow.json` - Medicare enrollment call flow fixture (9 steps)
- `src/lib/__tests__/detectSteps.test.ts` - 12 tests for step detection
- `src/lib/__tests__/edgeExtractors.test.ts` - 12 tests for edge extraction
- `src/lib/__tests__/jsonToFlow.test.ts` - 13 tests for orchestrator

## Decisions Made
- Step key = node ID: step keys in JSON (e.g., "greeting") used directly as React Flow node IDs, making edge source/target references work naturally without a mapping table
- Full step object stored in node.data.step via spread copy to preserve all original fields (IMP-04)
- Edge ID format `${stepKey}->${type}->${target}` guarantees uniqueness even when multiple edges target the same node
- Grid layout (4 columns, 300px X gap, 200px Y gap) as temporary positioning until Phase 3 adds dagre auto-layout
- Minimum 2 step objects required by detectStepsContainer to avoid false positives on config objects

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- jsonToFlow is ready for Plan 02-02 to build flowToJson reverse transform
- Types are exported and ready for store extension (importJson action)
- Test fixture serves as the canonical test data for round-trip verification
- Edge type metadata (data.edgeType) ready for Phase 3 visual styling

---
*Phase: 02-json-transform-layer*
*Completed: 2026-03-12*
