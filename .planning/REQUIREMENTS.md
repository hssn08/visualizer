# Requirements: Flow Editor

**Defined:** 2026-03-12
**Core Value:** Load a real call flow JSON, see the entire flow as a visual graph, edit any step's properties inline, and export valid JSON back — without ever hand-editing raw JSON files.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Import & Parsing

- [x] **IMP-01**: User can import a JSON file via file picker
- [x] **IMP-02**: App auto-detects the step container in arbitrary JSON (objects with `next`, `conditions`, or similar linking fields)
- [ ] **IMP-03**: Default test flow (Medicare call flow) loads on first visit
- [x] **IMP-04**: App preserves all original JSON fields including ones not visually represented (voice_settings, max_clarification_retries, etc.)

### Canvas & Navigation

- [ ] **NAV-01**: Steps render as draggable nodes on a pannable, zoomable canvas
- [ ] **NAV-02**: Canvas fills full viewport height with React Flow container
- [ ] **NAV-03**: Minimap shows overview of full graph
- [ ] **NAV-04**: Controls for zoom in, zoom out, fit-to-view
- [ ] **NAV-05**: Auto-layout via dagre positions nodes in readable tree structure
- [ ] **NAV-06**: Layout direction toggle between top-to-bottom and left-to-right

### Node Rendering

- [ ] **NODE-01**: Each node shows step key/name as header
- [ ] **NODE-02**: Each node shows step description
- [ ] **NODE-03**: Nodes are color-coded by role (green=start, red=terminal, orange=error/recovery, blue=normal)
- [ ] **NODE-04**: Info badges show key fields (wait_for_response, disposition, action, criticalstep)
- [ ] **NODE-05**: Each node has one input handle at top
- [ ] **NODE-06**: Each node has multiple labeled output handles (next, each condition, timeout, no_match, intent routes)
- [ ] **NODE-07**: Selected node has visible highlight/glow

### Edge Rendering

- [x] **EDGE-01**: Normal "next" edges render as solid lines
- [x] **EDGE-02**: Condition edges render as solid lines with colored label badges
- [x] **EDGE-03**: Timeout edges render as dashed orange lines
- [x] **EDGE-04**: No match/fallback edges render as dashed gray lines
- [x] **EDGE-05**: Intent route edges (DNC, not interested, obscenity) render as dotted red lines
- [x] **EDGE-06**: All edges display their label text

### Property Editing

- [ ] **EDIT-01**: Clicking a node opens a right sidebar property panel
- [ ] **EDIT-02**: Panel shows structured fields for common properties (description, text, audio_file, wait_for_response, pause_duration, timeout)
- [ ] **EDIT-03**: Panel shows connections section with dropdowns to change edge targets
- [ ] **EDIT-04**: Panel includes full JSON editor (json-edit-react) for all node data as fallback
- [ ] **EDIT-05**: Property changes update the store in real-time
- [x] **EDIT-06**: Clicking canvas background deselects node and closes panel

### Graph Editing

- [ ] **GRAPH-01**: User can add new nodes via drag-and-drop from sidebar palette
- [ ] **GRAPH-02**: Palette offers Basic Step, Decision Step, Terminal Step templates
- [ ] **GRAPH-03**: User can draw new edges by dragging between node handles
- [ ] **GRAPH-04**: User can delete nodes with confirmation dialog
- [ ] **GRAPH-05**: User can delete edges
- [ ] **GRAPH-06**: Deleting an edge removes the corresponding connection field from step data
- [ ] **GRAPH-07**: Drawing a new edge adds the appropriate field to source step data

### Undo/Redo

- [ ] **UNDO-01**: User can undo any editing action with Ctrl+Z
- [ ] **UNDO-02**: User can redo with Ctrl+Shift+Z
- [ ] **UNDO-03**: Node dragging is throttled so a full drag is one undo step (not per-pixel)

### Export

- [ ] **EXP-01**: User can export modified JSON via download button
- [ ] **EXP-02**: Exported JSON preserves all original fields not visually represented
- [ ] **EXP-03**: Exported JSON updates connection fields (next, conditions, etc.) based on current edges
- [ ] **EXP-04**: Live JSON preview panel shows current state (toggleable)

### UI & Polish

- [ ] **UI-01**: Dark mode support via shadcn theme
- [x] **UI-02**: Top toolbar with Import, Export, Auto Layout, Layout Direction, Zoom to Fit, JSON Preview toggle
- [ ] **UI-03**: Keyboard shortcut: Delete/Backspace removes selected node
- [ ] **UI-04**: Keyboard shortcut: Ctrl+Z undo, Ctrl+Shift+Z redo
- [ ] **UI-05**: Property panel and node palette are collapsible
- [ ] **UI-06**: Responsive layout adapts to smaller screens

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Editing

- **ADV-01**: Copy/paste nodes with Ctrl+C / Ctrl+V
- **ADV-02**: Multi-select nodes and move as group
- **ADV-03**: Search/filter nodes by name or property
- **ADV-04**: Edge bending / waypoints for cleaner routing
- **ADV-05**: Snap-to-grid for manual alignment

### Collaboration

- **COLLAB-01**: Share flow via URL (encode in query params or hash)
- **COLLAB-02**: Export flow as PNG/SVG image

## Out of Scope

| Feature | Reason |
|---------|--------|
| Server-side rendering / API routes | Purely client-side SPA, no server needed |
| Authentication / user accounts | Internal team tool, no login required |
| Multi-user collaboration / real-time sync | Single user at a time |
| Database / persistence | File-based import/export only |
| Mobile-native app | Desktop-primary internal tool |
| Custom JSON schema validation | Editor accepts any valid JSON |
| Version history / diffing | Undo/redo sufficient for v1 |
| AI-powered flow generation | Out of scope, adds external dependencies |
| Plugin/extension system | Would double complexity for no v1 value |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| IMP-01 | Phase 2 | Complete |
| IMP-02 | Phase 2 | Complete |
| IMP-03 | Phase 6 | Pending |
| IMP-04 | Phase 2 | Complete |
| NAV-01 | Phase 3 | Pending |
| NAV-02 | Phase 3 | Pending |
| NAV-03 | Phase 3 | Pending |
| NAV-04 | Phase 3 | Pending |
| NAV-05 | Phase 3 | Pending |
| NAV-06 | Phase 3 | Pending |
| NODE-01 | Phase 3 | Pending |
| NODE-02 | Phase 3 | Pending |
| NODE-03 | Phase 3 | Pending |
| NODE-04 | Phase 3 | Pending |
| NODE-05 | Phase 3 | Pending |
| NODE-06 | Phase 3 | Pending |
| NODE-07 | Phase 3 | Pending |
| EDGE-01 | Phase 3 | Complete |
| EDGE-02 | Phase 3 | Complete |
| EDGE-03 | Phase 3 | Complete |
| EDGE-04 | Phase 3 | Complete |
| EDGE-05 | Phase 3 | Complete |
| EDGE-06 | Phase 3 | Complete |
| EDIT-01 | Phase 4 | Pending |
| EDIT-02 | Phase 4 | Pending |
| EDIT-03 | Phase 4 | Pending |
| EDIT-04 | Phase 4 | Pending |
| EDIT-05 | Phase 4 | Pending |
| EDIT-06 | Phase 4 | Complete |
| GRAPH-01 | Phase 5 | Pending |
| GRAPH-02 | Phase 5 | Pending |
| GRAPH-03 | Phase 5 | Pending |
| GRAPH-04 | Phase 5 | Pending |
| GRAPH-05 | Phase 5 | Pending |
| GRAPH-06 | Phase 5 | Pending |
| GRAPH-07 | Phase 5 | Pending |
| UNDO-01 | Phase 5 | Pending |
| UNDO-02 | Phase 5 | Pending |
| UNDO-03 | Phase 5 | Pending |
| EXP-01 | Phase 6 | Pending |
| EXP-02 | Phase 6 | Pending |
| EXP-03 | Phase 6 | Pending |
| EXP-04 | Phase 6 | Pending |
| UI-01 | Phase 7 | Pending |
| UI-02 | Phase 4 | Complete |
| UI-03 | Phase 5 | Pending |
| UI-04 | Phase 5 | Pending |
| UI-05 | Phase 7 | Pending |
| UI-06 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 48 total
- Mapped to phases: 48
- Unmapped: 0

---
*Requirements defined: 2026-03-12*
*Last updated: 2026-03-12 after initial definition*
