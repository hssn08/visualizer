# Feature Research

**Domain:** Visual call flow / IVR / chatbot flow editor (internal tool)
**Researched:** 2026-03-12
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = the tool provides no value over editing raw JSON.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| JSON file import via file picker | Core value prop is "load a flow, see it visually." Without import, there is no product. | LOW | Must auto-detect step container in arbitrary JSON structures. Handle malformed JSON gracefully with error messages. |
| Render steps as draggable nodes on canvas | Every flow editor (Voiceflow, Twilio Studio, Node-RED, Cloverhound) renders steps as movable blocks on a canvas. This IS the product. | MEDIUM | Use React Flow custom nodes. Must support 50+ nodes smoothly per project constraint. Memoize aggressively. |
| Render edges between steps with distinct visual styles | Users need to instantly distinguish connection types: normal flow vs conditional vs timeout vs error. All competitors do this. | MEDIUM | Solid for `next`, labeled for `conditions`, dashed for `timeout`, dotted for `intent_routes`. Color-coding edges by type adds clarity. |
| Edge labels (intent names, condition text, "timeout") | Without labels, edges are meaningless lines. Node-RED, Voiceflow, and Twilio Studio all label their edges. | LOW | Display on the edge path. Must remain readable at various zoom levels. |
| Node color-coding by role | Users must instantly identify start nodes, terminal nodes, error handlers. Voiso, Cloverhound, and Twilio Studio all color-code by role. | LOW | Green=start, red=terminal, orange=error-recovery, blue=normal. Keep palette minimal (4-5 colors max). |
| Click-to-edit property panel | Double-click or select a node to edit its properties in a side panel. Node-RED, Voiceflow, and Twilio Studio all use this pattern. | MEDIUM | Structured fields for common properties (description, text, audio_file, wait_for_response, pause_duration, timeout). JSON fallback editor for everything else. |
| Multiple output handles per node | Call flows have multiple exit paths (next, conditions, timeout, no_match, intent routes). Each needs its own visual connection point. Cloverhound Menu step shows numbered outputs per DTMF option. | MEDIUM | One labeled handle per connection type. Critical for visual clarity with complex branching. |
| Export modified JSON back to file | The other half of the core value prop. Users must get valid JSON back. | LOW | Must preserve ALL original fields including ones not visually represented. Lossless round-trip is non-negotiable per project constraints. |
| Zoom, pan, and fit-to-view | Standard canvas interactions. Every node editor has these. Users will try to scroll/pinch/zoom instinctively. | LOW | React Flow provides these out of the box via Controls component and mouse/trackpad handlers. |
| Minimap | For flows with 20+ nodes, users need spatial orientation. Node-RED, React Flow, and Flowyte all include minimaps as standard. | LOW | React Flow provides MiniMap component. Cheap to add, high usability value. |
| Auto-layout (dagre) | Users should not have to manually position 50 nodes. Every serious flow editor offers auto-layout. Dagre is standard for DAGs/trees. | MEDIUM | Top-to-bottom and left-to-right options. Must recalculate on structural changes. Dagre is the right choice (ELKjs is overkill for DAG structures). |
| Undo/redo | Users expect Ctrl+Z to work. Losing edits without undo is unacceptable in any editor. Node-RED, Voiceflow, and Twilio Studio all support it. | MEDIUM | Zundo temporal middleware on Zustand gives this with minimal code. Snapshot-based approach per React Flow's recommendation. |
| Delete nodes and edges with confirmation | Basic editing operation. Every editor supports this. | LOW | Backspace/Delete key for selected elements. Confirmation dialog for node deletion (edges can be deleted without confirmation since they are easily re-created). |
| Add new nodes | Must be able to create new steps, not just edit imported ones. All competitors have this. | MEDIUM | Drag from sidebar palette or click-to-add. Template types: Basic Step, Decision Step, Terminal Step. |
| Draw new edges by dragging between handles | Standard node editor interaction pattern. React Flow supports this natively. | LOW | Drag from source handle to target handle. Validate connections (prevent self-connections, duplicate edges). |
| Keyboard shortcuts | Power users expect Delete, Ctrl+Z, Ctrl+Shift+Z, Ctrl+A at minimum. Node-RED has extensive keyboard shortcuts. | LOW | React Flow supports deleteKeyCode, selectionKeyCode props. Add standard shortcuts progressively. |
| Key info badges on nodes | Users need to see critical properties without opening the property panel. Voiso added node naming in 2025 specifically for this. | LOW | Show wait_for_response, disposition, action, criticalstep as small badges/pills on the node face. |
| Dark mode | Standard for developer/internal tools in 2026. Missing dark mode feels dated. | LOW | Tailwind CSS dark mode support. shadcn/ui has built-in dark mode theming. Mostly CSS work. |

### Differentiators (Competitive Advantage)

Features that set this tool apart from editing raw JSON. Not all are needed for v1, but each adds meaningful value. Ordered by impact.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Lossless JSON round-trip (preserving unknown fields) | Most visual editors lose data -- they only serialize fields they understand. This tool preserves EVERYTHING including voice_settings, max_clarification_retries, and any future fields. This is the single biggest differentiator vs building flows in a hosted platform. | MEDIUM | Store original JSON alongside the visual representation. On export, merge edits back into original structure. Never drop unknown keys. |
| Live JSON preview panel | See the current state of the JSON as you edit visually. No other call flow editor shows you the underlying data in real-time. Bridges the gap between visual editing and the JSON artifact the team actually deploys. | LOW | Read-only JSON viewer synced to current state. Syntax highlighted. Collapsible sections. Could use json-edit-react in read-only mode. |
| Layout direction toggle (TB / LR) | Most flow editors lock you into one direction. Offering both top-to-bottom and left-to-right lets users pick what works for their flow's shape. Wide flows look better LR; deep flows look better TB. | LOW | Pass rankdir option to dagre. Re-layout on toggle. Simple but surprisingly useful. |
| Auto-detect step container in arbitrary JSON | Generic JSON flow editors do not exist. This tool can take ANY JSON with a step-based structure and render it, not just one proprietary format. Other tools (Voiso, Cloverhound) only work with their own format. | HIGH | Heuristic detection: find objects with `next`, `conditions`, `timeout_next`, `no_match_next`, `intent_detector_routes` linking fields. Must handle various JSON shapes. |
| Full JSON editor fallback in property panel | When structured fields do not cover a property, drop into a full JSON editor for that node. Combines the convenience of forms with the power of raw editing. Node-RED has a similar pattern with its "raw" mode. | LOW | json-edit-react handles this. Themeable, supports inline editing, drag-drop reordering. |
| Connection editing via dropdowns | Edit where a node's `next`, `timeout_next`, etc. point by selecting from a dropdown of available step names. Faster than drawing edges for reconnection tasks. | LOW | Populate dropdown from current node list. Update both the data model and the visual edge on change. |
| Search/find nodes | For flows with 30+ nodes, finding a specific step by name is critical. Node-RED has a global search (Ctrl+F) that highlights matching nodes. React Flow has a NodeSearch component. | MEDIUM | Search by node label/step name. Highlight matches. Click result to pan-and-zoom to that node. |
| Copy/paste nodes | Duplicating similar steps saves time. React Flow has a copy-paste example using Ctrl+C/Ctrl+V with Shift+click multi-select. | MEDIUM | Copy selected nodes with their properties. Paste creates new nodes with unique IDs. Must handle edge references carefully. |
| Snap-to-grid and alignment helpers | Makes manually-adjusted layouts look professional. React Flow supports SnapGrid type and helper lines example. | LOW | Enable snapToGrid on React Flow. Optional helper lines that appear during drag for alignment. |
| Default test flow on first visit | New users see the tool in action immediately without needing a JSON file. Reduces time-to-value from minutes to seconds. | LOW | Bundle the Medicare call flow spec as a default. Load it on first visit. Clear messaging that it is a demo. |
| Responsive/collapsible panels | Usable on smaller screens and when users want maximum canvas space. Sidebar and property panel should collapse. | LOW | Resizable panels with collapse toggles. Remember panel state. Standard pattern in developer tools. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems for THIS project specifically (internal tool, single-user, client-side SPA).

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Multi-user real-time collaboration | "Google Docs for flows" sounds appealing | Requires WebSocket server, conflict resolution (CRDT/OT), user presence, and complete architecture change. Massive complexity for a team that edits flows one at a time. Out of scope per PROJECT.md. | File-based workflow: one person edits, exports JSON, shares file. Version control (git) handles collaboration. |
| Server-side persistence / database | "Save my flows to the cloud" | Requires backend infrastructure, authentication, deployment ops. Contradicts the "purely client-side SPA" constraint. Adds maintenance burden for an internal tool. | File import/export is the persistence model. Browser localStorage for auto-save as a convenience. |
| Custom JSON schema validation | "Validate my flow against a schema" | Call flow JSON schemas vary by customer/project and evolve frequently. Building a schema validator ties the tool to a specific format and creates maintenance burden. | Structural validation only: check that referenced step names exist, flag orphan nodes, warn about unreachable steps. No schema enforcement. |
| Authentication / user accounts | "Track who edited what" | Requires auth infrastructure, session management, user database. Way overkill for an internal team tool. | Not needed. Git commit history tracks who changed what. |
| Version history / diffing | "See what changed between versions" | Requires persistence layer, diff algorithm for graph structures, UI for comparing versions. Significant complexity. | Undo/redo covers in-session changes. Export snapshots to files and use git diff / JSON diff tools externally. |
| Mobile-native experience | "Edit flows on my phone" | Node graph editors are fundamentally desktop interactions. Touch targets for handles, edges, and node properties are too small on mobile. | Responsive layout for tablets (view-only is fine on mobile), but editing is desktop-primary. |
| Drag-and-drop from external file system | "Drop a JSON file onto the canvas" | HTML5 drag-and-drop from filesystem is inconsistent across browsers and OS. File picker is more reliable and universally understood. | Standard file picker dialog. Could add drop-zone as progressive enhancement later, but not worth prioritizing. |
| AI-powered flow generation | "Generate a flow from a prompt" | Requires LLM integration, prompt engineering, output validation, and the generated flows would still need manual review. Adds external dependency and complexity. Cool demo but low daily utility for experienced flow authors. | Focus on making manual editing fast. Templates cover common patterns. |
| Plugin/extension system | "Let teams add custom node types" | Architecture overhead for plugin loading, sandboxing, API surface. Internal tool with a small team does not need extensibility. | Hard-code the node types that exist in the call flow JSON spec. Add new types directly to the codebase when needed. |

## Feature Dependencies

```
[JSON Import]
    |
    +-- requires --> [Auto-detect step container]
    |                    |
    |                    +-- enables --> [Render nodes on canvas]
    |                                       |
    |                                       +-- requires --> [Multiple output handles]
    |                                       |
    |                                       +-- enables --> [Render edges with styles]
    |                                       |                   |
    |                                       |                   +-- enables --> [Edge labels]
    |                                       |
    |                                       +-- enables --> [Node color-coding]
    |                                       |
    |                                       +-- enables --> [Key info badges]
    |                                       |
    |                                       +-- enables --> [Auto-layout (dagre)]
    |                                       |                   |
    |                                       |                   +-- enhances --> [Layout direction toggle]
    |                                       |
    |                                       +-- enables --> [Click-to-edit property panel]
    |                                       |                   |
    |                                       |                   +-- requires --> [Structured field editors]
    |                                       |                   |
    |                                       |                   +-- enhances --> [JSON editor fallback]
    |                                       |                   |
    |                                       |                   +-- enhances --> [Connection editing dropdowns]
    |                                       |
    |                                       +-- enables --> [Delete nodes/edges]
    |                                       |
    |                                       +-- enables --> [Draw new edges]
    |                                       |
    |                                       +-- enables --> [Add new nodes]
    |                                       |                   |
    |                                       |                   +-- enhances --> [Copy/paste nodes]
    |                                       |
    |                                       +-- enables --> [Search/find nodes]
    |                                       |
    |                                       +-- enables --> [Zoom/pan/minimap]

[Zustand store]
    |
    +-- requires --> [State management setup]
                        |
                        +-- enables --> [Undo/redo (Zundo)]
                        |
                        +-- enables --> [Live JSON preview]
                        |
                        +-- enables --> [JSON export]

[JSON Export]
    +-- requires --> [Lossless round-trip logic]
    +-- requires --> [Zustand store with current state]
```

### Dependency Notes

- **Render nodes requires Auto-detect step container:** The parser that identifies steps in arbitrary JSON is the foundation. Without it, nothing renders.
- **Property panel requires Structured field editors:** The panel needs to know which fields to show as forms vs raw JSON. Field definitions drive the UI.
- **Undo/redo requires Zustand store:** Zundo wraps Zustand with temporal middleware. The state management architecture must be in place first.
- **Copy/paste enhances Add new nodes:** Copy/paste is a faster version of "add node" -- it reuses the same node creation logic but pre-fills properties from the source.
- **JSON export requires Lossless round-trip logic:** The merge-back-to-original-JSON strategy must be designed from the start, not bolted on later. This affects how state is structured.
- **Search/find requires Render nodes:** Needs node data in state to search against and canvas to navigate to results.

## MVP Definition

### Launch With (v1)

Minimum viable product -- what is needed to replace hand-editing JSON files.

- [ ] JSON file import with auto-detect step container -- the entry point for all workflows
- [ ] Render nodes on canvas with color-coding and info badges -- instant visual understanding of flow structure
- [ ] Render styled edges with labels -- see how steps connect and why
- [ ] Multiple output handles per node -- visual clarity for branching logic
- [ ] Auto-layout with dagre (TB and LR) -- usable layout without manual positioning
- [ ] Click-to-edit property panel with structured fields -- edit step properties without touching JSON
- [ ] JSON editor fallback in property panel -- handle any field not covered by structured inputs
- [ ] Connection editing via dropdowns -- rewire flows without redrawing edges
- [ ] Add new nodes from sidebar palette -- create new steps
- [ ] Delete nodes (with confirmation) and edges -- remove steps
- [ ] Draw new edges between handles -- create new connections
- [ ] Undo/redo -- safety net for all editing
- [ ] Export modified JSON (lossless round-trip) -- the output artifact
- [ ] Zoom, pan, minimap, fit-to-view -- canvas navigation
- [ ] Keyboard shortcuts (Delete, Ctrl+Z, Ctrl+Shift+Z) -- power user efficiency
- [ ] Default test flow on first visit -- immediate demonstration of value

### Add After Validation (v1.x)

Features to add once the core editing loop is validated with the team.

- [ ] Live JSON preview panel -- add when users ask "what does the JSON look like right now?"
- [ ] Search/find nodes -- add when flows consistently exceed 20 nodes and users complain about finding steps
- [ ] Copy/paste nodes -- add when users are creating many similar steps and want duplication
- [ ] Snap-to-grid and alignment helpers -- add when users care about layout aesthetics beyond auto-layout
- [ ] Dark mode -- add based on team preference (low effort, high polish)
- [ ] Responsive/collapsible panels -- add when users complain about screen real estate
- [ ] Edge bending / draggable control points -- add when auto-layout edges overlap and users want manual control

### Future Consideration (v2+)

Features to defer until the tool has proven daily utility.

- [ ] Structural validation (orphan nodes, unreachable steps, missing required connections) -- defer because the team knows their flows well; validation becomes valuable as the team grows
- [ ] Flow statistics / complexity metrics (node count, max depth, branch count) -- defer because nice-to-have analytics, not editing functionality
- [ ] Multiple flow tabs / multi-file editing -- defer because users work on one flow at a time currently
- [ ] Subflow grouping (collapse a section into a single node) -- defer because significant complexity, only valuable for very large flows (50+ nodes)
- [ ] Flow comparison / diff view -- defer because git diff handles this externally; in-tool diff is a large feature

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| JSON import + auto-detect | HIGH | MEDIUM | P1 |
| Node rendering with color-coding | HIGH | MEDIUM | P1 |
| Edge rendering with styles/labels | HIGH | MEDIUM | P1 |
| Multiple output handles | HIGH | MEDIUM | P1 |
| Auto-layout (dagre TB/LR) | HIGH | MEDIUM | P1 |
| Property panel (structured fields) | HIGH | MEDIUM | P1 |
| JSON editor fallback | HIGH | LOW | P1 |
| Connection editing dropdowns | MEDIUM | LOW | P1 |
| Add new nodes (palette) | HIGH | MEDIUM | P1 |
| Delete nodes/edges | HIGH | LOW | P1 |
| Draw new edges | HIGH | LOW | P1 |
| Undo/redo | HIGH | LOW | P1 |
| JSON export (lossless) | HIGH | MEDIUM | P1 |
| Zoom/pan/minimap/fit-to-view | HIGH | LOW | P1 |
| Keyboard shortcuts | MEDIUM | LOW | P1 |
| Default test flow | MEDIUM | LOW | P1 |
| Node info badges | MEDIUM | LOW | P1 |
| Live JSON preview | MEDIUM | LOW | P2 |
| Search/find nodes | MEDIUM | MEDIUM | P2 |
| Copy/paste nodes | MEDIUM | MEDIUM | P2 |
| Dark mode | LOW | LOW | P2 |
| Snap-to-grid / alignment | LOW | LOW | P2 |
| Collapsible panels | LOW | LOW | P2 |
| Edge bending control points | LOW | MEDIUM | P2 |
| Structural validation | MEDIUM | HIGH | P3 |
| Flow statistics | LOW | LOW | P3 |
| Multi-file tabs | LOW | MEDIUM | P3 |
| Subflow grouping | LOW | HIGH | P3 |
| Flow diff/comparison | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch -- required to replace hand-editing JSON
- P2: Should have, add when possible -- improves daily workflow
- P3: Nice to have, future consideration -- valuable but not blocking adoption

## Competitor Feature Analysis

| Feature | Node-RED | Voiceflow | Twilio Studio | Cloverhound Route | Our Approach |
|---------|----------|-----------|---------------|-------------------|--------------|
| Canvas with drag/drop | Yes, mature | Yes, polished | Yes, widget-based | Yes, basic | React Flow custom nodes. Match Node-RED maturity. |
| Node palette/sidebar | Categories, filterable, collapsible | 5 categories (Talk, Listen, Logic, Dev, AI) | Widget library | Step types in sidebar | Sidebar palette with 3 templates (Basic, Decision, Terminal). Keep it simple. |
| Property editing | Double-click opens form, raw JSON mode | Inline in canvas | Click widget to configure | Click step, options icon | Side panel with structured fields + JSON fallback. Best of both worlds. |
| Edge styles | One style, labeled | Styled by type | Widget-to-widget lines | Basic lines with bendable midpoints | 4 distinct styles (solid/labeled/dashed/dotted) for connection types. More expressive than competitors. |
| Auto-layout | Basic alignment | Auto-arrange | Fixed grid | Manual only | Dagre with TB/LR toggle. Better than most competitors. |
| Search | Ctrl+F global search, highlights matches | Limited | Not prominent | None | v1.x: Search by step name with pan-to-node. |
| Undo/redo | Full history | Yes | Yes | Not documented | Zundo-powered snapshot undo/redo. |
| Import/export | JSON import/export with clipboard | Proprietary format | Proprietary | JSON export | Lossless JSON round-trip. Key differentiator -- no data loss. |
| Subflows | Yes, reusable components | Yes | Not supported | Connector/Outlet steps | Defer to v2+. Not needed for current flow complexity. |
| Versioning | Git-based via FlowFuse | Built-in versions | Flow versions with diff | Save button | File-based. Git handles versioning externally. |
| Collaboration | FlowFuse adds multi-user | Multi-user workspace | Team sharing | Not documented | Not applicable -- single-user internal tool. |
| Validation | Deploy-time validation | Test in builder | Built-in testing | Decision logic validation | Defer validation to v2+. Structural checks only. |
| Dark mode | Yes | Yes | No | No | P2 feature. Low effort with shadcn/Tailwind. |

## Sources

- [SignalWire Call Flow Builder](https://signalwire.com/technology/call-flow-builder) - CPaaS flow builder feature reference
- [Voiso Flow Builder docs](https://docs.voiso.com/docs/inbound-flow-builder-overview) - Inbound flow builder features and 2025 updates
- [Synergy Codes Call Flow Builder](https://www.synergycodes.com/call-flow-builder-ivr-chatbot) - Custom call flow builder development
- [Cloverhound Route Editor Features](https://route.cloverhound.com/docs/editor_features) - Call flow editor for contact centers
- [Voiceflow Platform Overview](https://www.voiceflow.com/features/platform-overview) - Chat and voice AI agent builder
- [Twilio Studio](https://www.twilio.com/docs/studio) - Visual IVR and communications workflow builder
- [Node-RED Editor Palette](https://nodered.org/docs/user-guide/editor/palette/) - Flow editor palette UX patterns
- [Node-RED Search](https://nodered.org/docs/user-guide/editor/workspace/search) - Search functionality in flow editors
- [React Flow Undo/Redo](https://reactflow.dev/examples/interaction/undo-redo) - Implementation patterns
- [React Flow Copy/Paste](https://reactflow.dev/examples/interaction/copy-paste) - Implementation patterns
- [React Flow Validation](https://reactflow.dev/examples/interaction/validation) - Connection validation
- [React Flow Auto Layout](https://reactflow.dev/examples/layout/auto-layout) - Layout algorithms
- [React Flow Helper Lines](https://reactflow.dev/examples/interaction/helper-lines) - Snap/alignment
- [React Flow Node Search](https://reactflow.dev/ui/components/node-search) - Search component
- [React Flow Expand/Collapse](https://reactflow.dev/examples/layout/expand-collapse) - Grouping patterns
- [React Flow Dagre Layout](https://reactflow.dev/examples/layout/dagre) - Dagre integration
- [Cambridge Intelligence Graph UX](https://cambridge-intelligence.com/graph-visualization-ux-how-to-avoid-wrecking-your-graph-visualization/) - Node graph UX best practices
- [xyflow/awesome-node-based-uis](https://github.com/xyflow/awesome-node-based-uis) - Curated list of node-based UI resources
- [MightyCall Call Flow Designer](https://www.mightycall.com/features/call-flow-designer/) - Call flow feature set
- [CloudTalk Call Flow Designer](https://www.cloudtalk.io/call-flow-designer/) - Call flow feature set
- [Flowyte Visual IVR Builder](https://www.flowyte.com/features/ivr-builder) - IVR builder features

---
*Feature research for: Visual call flow / IVR / chatbot flow editor*
*Researched: 2026-03-12*
