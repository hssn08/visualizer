---
phase: 07-dark-mode-polish
plan: 01
subsystem: ui
tags: [dark-mode, tailwind, shadcn, react-flow, json-edit-react, zustand, collapsible-panels]

# Dependency graph
requires:
  - phase: 06-export-default-flow
    provides: Complete app with toolbar, panels, canvas, and 237 tests
provides:
  - ThemeProvider context with localStorage persistence and system theme resolution
  - ModeToggle dropdown with Light/Dark/System options
  - Dark-mode-aware canvas (ReactFlow colorMode prop)
  - Dark-mode-aware node colors, edge strokes, label badges
  - Dark-mode-aware JSON editor (githubDarkTheme swap)
  - Collapsible NodePalette via toolbar PanelLeft toggle
  - Collapsible PropertyPanel via toolbar PanelRight toggle
  - paletteOpen and propertyPanelOpen state in UiSlice
affects: [07-dark-mode-polish]

# Tech tracking
tech-stack:
  added: [shadcn/dropdown-menu]
  patterns: [ThemeProvider context, useTheme hook, colorMode prop, render prop for base-ui trigger composition]

key-files:
  created:
    - src/components/theme-provider.tsx
    - src/components/toolbar/ModeToggle.tsx
    - src/components/ui/dropdown-menu.tsx
    - src/components/__tests__/theme-provider.test.tsx
    - src/components/toolbar/__tests__/ModeToggle.test.tsx
  modified:
    - src/App.tsx
    - src/components/toolbar/Toolbar.tsx
    - src/components/canvas/FlowCanvas.tsx
    - src/components/canvas/StepNode.tsx
    - src/components/canvas/ConditionalEdge.tsx
    - src/components/panel/JsonFallbackEditor.tsx
    - src/components/preview/JsonPreviewPanel.tsx
    - src/lib/nodeClassify.ts
    - src/store/types.ts
    - src/store/uiSlice.ts
    - src/test-setup.ts

key-decisions:
  - "render prop instead of asChild for base-ui DropdownMenuTrigger composition"
  - "Conditional JS (isDark flag) for edge stroke colors instead of CSS variables"
  - "bg-card CSS variable for StepNode base background instead of bg-white"
  - "ring-ring CSS variable for selected node ring instead of hardcoded ring-blue-400"
  - "Conditional rendering (unmount) for collapsed panels rather than CSS display:none"

patterns-established:
  - "ThemeProvider context wraps entire app at top level"
  - "useTheme hook resolves system theme via matchMedia for components needing concrete dark/light"
  - "dark: Tailwind variant classes for all light-mode hardcoded colors"
  - "EDGE_STYLES_DARK parallel object for inline SVG stroke colors"
  - "Panel toggle buttons in toolbar with variant switch for active state indication"

requirements-completed: [UI-01, UI-05]

# Metrics
duration: 5min
completed: 2026-03-13
---

# Phase 7 Plan 1: Dark Mode & Collapsible Panels Summary

**Dark/light/system theme toggle with full canvas/panel propagation and collapsible sidebar panels via toolbar toggles**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-13T11:33:18Z
- **Completed:** 2026-03-13T11:39:15Z
- **Tasks:** 3
- **Files modified:** 20

## Accomplishments
- Full dark mode support: ThemeProvider context, ModeToggle dropdown, localStorage persistence
- Dark mode propagated to all subsystems: ReactFlow colorMode, node colors, edge strokes, label badges, JSON editor theme
- Collapsible NodePalette and PropertyPanel via toolbar toggle buttons with active state indication
- 17 new tests (7 ThemeProvider + 2 ModeToggle + 2 FlowCanvas colorMode + 2 JsonFallbackEditor dark theme + 4 App collapse)
- All 254 tests passing (237 existing + 17 new)

## Task Commits

Each task was committed atomically:

1. **Task 1: Dark mode infrastructure** - `876b8bc` (feat) - ThemeProvider, ModeToggle, App wiring, matchMedia mock, 9 tests
2. **Task 2: Dark mode propagation** - `cb7400c` (feat) - Canvas colorMode, node/edge dark variants, JSON editor theme swap, 4 tests
3. **Task 3: Collapsible panels** - `6c9ff77` (feat) - UiSlice state, toolbar toggles, conditional rendering, 4 tests

## Files Created/Modified
- `src/components/theme-provider.tsx` - ThemeProvider context and useTheme hook
- `src/components/toolbar/ModeToggle.tsx` - Theme toggle dropdown with Sun/Moon icons
- `src/components/ui/dropdown-menu.tsx` - shadcn dropdown-menu component (installed)
- `src/App.tsx` - ThemeProvider wrapping, conditional palette/panel rendering
- `src/components/toolbar/Toolbar.tsx` - ModeToggle, PanelLeft/PanelRight toggle buttons
- `src/components/canvas/FlowCanvas.tsx` - colorMode prop passed to ReactFlow
- `src/components/canvas/StepNode.tsx` - bg-card, dark: variants for badges and ring
- `src/components/canvas/ConditionalEdge.tsx` - Theme-aware stroke colors, dark: label badges
- `src/components/panel/JsonFallbackEditor.tsx` - githubDarkTheme/githubLightTheme swap
- `src/components/preview/JsonPreviewPanel.tsx` - bg-muted/50 dark-aware styling
- `src/lib/nodeClassify.ts` - dark:bg-*-950 variants in ROLE_COLORS
- `src/store/types.ts` - paletteOpen, propertyPanelOpen, toggle actions
- `src/store/uiSlice.ts` - Toggle implementations with boolean defaults
- `src/test-setup.ts` - matchMedia mock for all theme tests

## Decisions Made
- Used `render` prop instead of `asChild` for base-ui DropdownMenuTrigger (avoids nested button warning)
- Conditional JS (isDark flag) for edge stroke colors rather than CSS variables (simpler, centralized in EDGE_STYLES_DARK)
- `bg-card` CSS variable for StepNode base instead of hardcoded `bg-white` (auto-switches with dark mode)
- `ring-ring` CSS variable for selected node ring instead of `ring-blue-400` (theme-aware)
- Conditional rendering (unmount) for collapsed panels rather than CSS display:none (clean re-mount with correct state)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed StepNode test checking for hardcoded ring-blue-400**
- **Found during:** Task 2
- **Issue:** Existing StepNode test asserted `ring-blue-400` class which was changed to `ring-ring`
- **Fix:** Updated test assertion from `ring-blue-400` to `ring-ring`
- **Files modified:** src/components/canvas/__tests__/StepNode.test.tsx
- **Verification:** Test passes with updated assertion
- **Committed in:** cb7400c (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor test assertion update, necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dark mode and collapsible panels fully operational
- Ready for Plan 07-02 (responsive layout, production polish, build optimization)
- All 254 tests passing, no blockers

## Self-Check: PASSED

All 5 created files exist. All 3 task commits verified (876b8bc, cb7400c, 6c9ff77). 254 tests passing.

---
*Phase: 07-dark-mode-polish*
*Completed: 2026-03-13*
