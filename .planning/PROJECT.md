# Flow Editor

## What This Is

A web-based visual editor for JSON call flow scripts. It takes any JSON file describing a step-based flow (call scripts, chatbot flows, IVR trees) and renders it as an interactive node graph where each step is a draggable node and each connection (next, conditions, timeout, intent routes) is a styled edge. Users can click nodes to edit properties, rearrange the layout, add/remove steps, and export the modified JSON back out. Built as an internal tool for a team that builds and maintains call center call flows.

## Core Value

Load a real call flow JSON, see the entire flow as a visual graph, edit any step's properties inline, and export valid JSON back — without ever hand-editing raw JSON files.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Import JSON file describing step-based flow via file picker
- [ ] Auto-detect step container in arbitrary JSON (objects with `next`, `conditions`, linking fields)
- [ ] Render each step as a draggable, styled node on a canvas
- [ ] Color-code nodes by role (start/green, terminal/red, error-recovery/orange, normal/blue)
- [ ] Show key info badges on nodes (wait_for_response, disposition, action, criticalstep)
- [ ] Render edges between steps with distinct styles (solid for next, labeled for conditions, dashed for timeout, dotted for intent routes)
- [ ] Display edge labels (intent names, "timeout", "no match", etc.)
- [ ] Click node to open property panel with structured fields (description, text, audio_file, wait_for_response, pause_duration, timeout)
- [ ] Full JSON editor fallback in property panel for any field not covered by structured inputs
- [ ] Edit node connections via dropdowns in property panel
- [ ] Add new nodes via drag-and-drop from a sidebar palette (Basic Step, Decision Step, Terminal Step templates)
- [ ] Delete nodes with confirmation
- [ ] Draw new edges by dragging between node handles
- [ ] Delete edges
- [ ] Auto-layout via dagre (top-to-bottom and left-to-right)
- [ ] Layout direction toggle (TB / LR)
- [ ] Export modified JSON back to file download preserving all original fields
- [ ] Zoom, pan, minimap, fit-to-view controls
- [ ] Undo/redo for all editing actions
- [ ] Live JSON preview panel showing current state
- [ ] Dark mode support
- [ ] Default test flow loaded on first visit (Medicare call flow from spec)
- [ ] Keyboard shortcuts (Delete to remove selected, Ctrl+Z undo, Ctrl+Shift+Z redo)
- [ ] Responsive/collapsible panels for smaller screens
- [ ] Multiple output handles per node (one per connection type: next, each condition, timeout, no_match, intent routes)
- [ ] Preserve all unknown JSON fields through import/edit/export round-trip

### Out of Scope

- Server-side rendering / API routes — purely client-side SPA
- Authentication / user accounts — internal tool, no login needed
- Multi-user collaboration / real-time sync — single user at a time
- Database / persistence — file-based import/export only
- Mobile-native app — web-only, responsive but desktop-primary
- Custom JSON schema validation — editor accepts any valid JSON
- Version history / diffing — undo/redo is sufficient for v1

## Context

- The team currently edits call flow JSON files by hand in text editors, which is error-prone for large flows with many conditional branches
- Call flows have a common pattern: a `steps` object containing step objects, each with fields like `next`, `conditions`, `timeout_next`, `no_match_next`, `intent_detector_routes` that reference other step keys
- Flows can be complex (20+ steps with multiple branching paths, recovery loops, terminal nodes)
- The tool must preserve ALL fields in the JSON including ones not visually represented (voice_settings, max_clarification_retries, etc.)
- Reference implementations exist: shadcn-next-workflows (266 stars), Visual Flow (samizak), React Flow's official Workflow Editor template
- json-edit-react v1.29 supports theming, drag-drop reordering, search/filter — ideal for the property panel fallback editor

## Constraints

- **Tech stack**: Vite + React + TypeScript, @xyflow/react v12, shadcn/ui, Tailwind CSS v4, Zustand v5, Zundo (undo/redo), @dagrejs/dagre, json-edit-react, lucide-react
- **Runtime**: Purely client-side, no server dependencies, runs in any modern browser
- **Data integrity**: JSON round-trip must be lossless — no fields dropped or reordered unexpectedly
- **Performance**: Must handle flows with 50+ nodes smoothly (memoize custom nodes, use useShallow selectors)
- **Compatibility**: Target Chrome, Firefox, Safari (latest versions)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vite over Next.js | Purely client-side SPA — no SSR/SEO/API routes needed. Vite is faster, simpler, less overhead. Similar tools (JSON Schema Studio, JSON-Tree-Visualizer) also use Vite. | -- Pending |
| Zustand v5 + Zundo for state | React Flow's officially recommended state manager. Zundo adds undo/redo with 3 lines of code via temporal middleware. | -- Pending |
| Dagre over ELKjs | Call flows are DAGs/trees. Dagre is simpler, faster, and sufficient. ELKjs is overkill for this structure. | -- Pending |
| json-edit-react for property panel fallback | Self-contained, themeable, supports inline editing, drag-drop reordering. No external UI library dependency. | -- Pending |
| Multiple output handles per node | Each connection type (next, conditions, timeout, intent routes) gets its own labeled handle for visual clarity | -- Pending |

---
*Last updated: 2025-03-12 after initialization*
