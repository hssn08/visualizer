# Roadmap: Flow Editor

## Overview

Build a client-side visual editor for JSON call flow scripts in 7 phases. Start with project scaffolding and core infrastructure (Vite, React, Tailwind, Zustand, React Flow), then build the JSON transform layer for lossless import/export, render the interactive canvas with custom nodes and edges, add the property editing panel, wire up graph editing operations with undo/redo, implement export and the default test flow, and finish with dark mode and UI polish. Each phase delivers something incrementally usable.

## Phases

- [x] **Phase 1: Project Scaffold & Foundation** - Vite + React + Tailwind + shadcn + React Flow + Zustand store skeleton
- [x] **Phase 2: JSON Transform Layer** - Import JSON, auto-detect steps, convert to React Flow nodes/edges, preserve all fields
- [ ] **Phase 3: Canvas Rendering & Layout** - Custom nodes with color-coding and handles, custom edges with labels, dagre auto-layout
- [ ] **Phase 4: Property Panel & Toolbar** - Right sidebar with structured fields, JSON fallback editor, top toolbar
- [ ] **Phase 5: Graph Editing & Undo/Redo** - Node palette, add/delete nodes, draw/delete edges, Zundo undo/redo, keyboard shortcuts
- [ ] **Phase 6: Export & Default Flow** - Lossless JSON export, live JSON preview, default Medicare test flow on first visit
- [ ] **Phase 7: Dark Mode & Polish** - Dark mode, collapsible panels, responsive layout, final integration testing

## Phase Details

### Phase 1: Project Scaffold & Foundation
**Goal**: Working dev environment with all dependencies installed, Zustand store wired to React Flow, and a blank canvas rendering
**Depends on**: Nothing (first phase)
**Requirements**: (infrastructure — no user-facing requirements, enables all subsequent phases)
**Success Criteria** (what must be TRUE):
  1. `npm run dev` starts the app and shows a blank React Flow canvas
  2. Zustand store exists with nodes/edges/onNodesChange/onEdgesChange/onConnect
  3. shadcn/ui components render correctly with Tailwind v4
  4. ReactFlowProvider wraps the app, React Flow CSS is imported
  5. TypeScript compiles with zero errors
**Plans**: 2 plans

Plans:
- [x] 01-01: Vite project setup with React, TypeScript, Tailwind v4, shadcn/ui
- [x] 01-02: Zustand store skeleton with React Flow integration and app shell layout

### Phase 2: JSON Transform Layer
**Goal**: Import a JSON file and see it converted to React Flow nodes and edges (not yet rendered with custom components)
**Depends on**: Phase 1
**Requirements**: IMP-01, IMP-02, IMP-04
**Success Criteria** (what must be TRUE):
  1. User can click "Import" and select a JSON file
  2. App detects the steps container in the JSON automatically
  3. Each step becomes a React Flow node with the entire step object stored in node.data
  4. Edges are created for next, conditions, timeout_next, no_match_next, intent_detector_routes
  5. All original JSON fields are preserved in node data (no field stripping)
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — jsonToFlow forward transform: types, step detection, edge extraction, orchestrator
- [x] 02-02-PLAN.md — flowToJson reverse transform, store extension with importJson, ImportButton UI

### Phase 3: Canvas Rendering & Layout
**Goal**: Imported flow renders as a beautiful, color-coded node graph with labeled edges and auto-layout
**Depends on**: Phase 2
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05, NAV-06, NODE-01, NODE-02, NODE-03, NODE-04, NODE-05, NODE-06, NODE-07, EDGE-01, EDGE-02, EDGE-03, EDGE-04, EDGE-05, EDGE-06
**Success Criteria** (what must be TRUE):
  1. Nodes display step name, description, and info badges with color-coded borders
  2. Each node has labeled output handles for each connection type
  3. Edges are visually distinct (solid/dashed/dotted) with label badges
  4. Dagre auto-layout positions nodes in a readable tree (TB and LR)
  5. Minimap, zoom controls, and fit-to-view work
  6. Selecting a node highlights it
**Plans**: 3 plans

Plans:
- [ ] 03-01-PLAN.md — Custom StepNode component with color-coding, badges, and multiple output handles
- [ ] 03-02-PLAN.md — Custom ConditionalEdge component with label badges and distinct styles
- [ ] 03-03-PLAN.md — Dagre auto-layout, store extension, FlowCanvas wiring with custom types and minimap

### Phase 4: Property Panel & Toolbar
**Goal**: Click any node to edit its properties in a sidebar panel, with structured fields and a JSON fallback editor
**Depends on**: Phase 3
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, UI-02
**Success Criteria** (what must be TRUE):
  1. Clicking a node opens right sidebar with property panel
  2. Structured fields for description, text, audio_file, wait_for_response, pause_duration, timeout
  3. Connections section shows outgoing edges with dropdowns to change targets
  4. Full JSON editor (json-edit-react) shows complete node data below structured fields
  5. Changes update the Zustand store in real-time and reflect on canvas
  6. Clicking canvas background closes panel
  7. Top toolbar renders with Import, Export, Auto Layout, Direction, Fit buttons
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Store extension (updateNodeData, updateEdgeTarget), PropertyPanel with structured fields and connection editors
- [ ] 04-02-PLAN.md — json-edit-react integration for full JSON fallback editing in property panel
- [x] 04-03-PLAN.md — Full toolbar with Export, Auto Layout, Direction, Fit View, JSON Preview toggle

### Phase 5: Graph Editing & Undo/Redo
**Goal**: Full editing capabilities — add, delete, connect nodes; undo/redo all operations
**Depends on**: Phase 4
**Requirements**: GRAPH-01, GRAPH-02, GRAPH-03, GRAPH-04, GRAPH-05, GRAPH-06, GRAPH-07, UNDO-01, UNDO-02, UNDO-03, UI-03, UI-04
**Success Criteria** (what must be TRUE):
  1. Sidebar palette with Basic/Decision/Terminal templates; drag-drop creates new nodes
  2. Drawing an edge between handles adds connection field to source step data
  3. Deleting an edge removes connection field from step data
  4. Delete node shows confirmation and removes node + connected edges
  5. Ctrl+Z undoes any operation; Ctrl+Shift+Z redoes
  6. Dragging a node is one undo step (not per-pixel)
  7. Delete/Backspace keyboard shortcut removes selected node
**Plans**: 3 plans

Plans:
- [ ] 05-01: Node palette sidebar with drag-and-drop creation
- [ ] 05-02: Edge creation/deletion synced with step data, node deletion with confirmation
- [ ] 05-03: Zundo undo/redo integration with throttled drag tracking and keyboard shortcuts

### Phase 6: Export & Default Flow
**Goal**: Complete the import-edit-export loop; app is immediately usable on first visit
**Depends on**: Phase 5
**Requirements**: IMP-03, EXP-01, EXP-02, EXP-03, EXP-04
**Success Criteria** (what must be TRUE):
  1. Export button downloads a .json file with all original fields preserved
  2. Connection fields in exported JSON reflect current edge state
  3. Round-trip test: import -> edit -> export -> re-import produces consistent result
  4. Live JSON preview panel toggles open/closed showing current state
  5. Medicare test flow loads by default on first visit (no import needed)
**Plans**: 2 plans

Plans:
- [ ] 06-01: JSON export with lossless round-trip and file download
- [ ] 06-02: Live JSON preview panel and default test flow on first visit

### Phase 7: Dark Mode & Polish
**Goal**: Professional look and feel, responsive design, final quality pass
**Depends on**: Phase 6
**Requirements**: UI-01, UI-05, UI-06
**Success Criteria** (what must be TRUE):
  1. Dark mode toggle works and persists across sessions
  2. Property panel and node palette are collapsible via toggle buttons
  3. Layout adapts gracefully to smaller screens (panels collapse)
  4. All interactions feel smooth and polished
  5. No console errors or warnings in production build
**Plans**: 2 plans

Plans:
- [ ] 07-01: Dark mode with shadcn theme toggle, collapsible panels
- [ ] 07-02: Responsive layout, performance audit, production build verification

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Scaffold & Foundation | 2/2 | Complete | 2026-03-12 |
| 2. JSON Transform Layer | 2/2 | Complete | 2026-03-12 |
| 3. Canvas Rendering & Layout | 0/3 | Not started | - |
| 4. Property Panel & Toolbar | 2/3 | In Progress | - |
| 5. Graph Editing & Undo/Redo | 0/3 | Not started | - |
| 6. Export & Default Flow | 0/2 | Not started | - |
| 7. Dark Mode & Polish | 0/2 | Not started | - |
