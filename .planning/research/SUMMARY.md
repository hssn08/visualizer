# Project Research Summary

**Project:** Visualizer
**Domain:** Visual call flow / IVR editor -- client-side SPA with node-based graph UI
**Researched:** 2026-03-12
**Confidence:** HIGH

## Executive Summary

This project is a client-side visual editor for call flow JSON files, built as a single-page application. The dominant pattern for building node-based flow editors in React is the @xyflow/react library (React Flow v12) backed by a Zustand store, with dagre for auto-layout. This stack is mature, well-documented, and used in production by companies like Stripe and Zapier. There is no serious competitor to React Flow in the React ecosystem for this use case. The supporting cast -- Vite 7, Tailwind CSS 4, shadcn/ui, TypeScript 5.9 -- are all current stable releases with verified compatibility. The full stack has been validated for React 19 + Zustand 5 + React Flow 12.10 interoperability.

The recommended approach is to build the JSON transform layer first (import/export with lossless round-trip), then the canvas with basic nodes, then progressively add editing features. The single most important architectural decision is preserving ALL original JSON fields through the import-edit-export cycle. This must be designed into the data model from day one -- retrofitting it later requires rewriting the entire data layer. The second critical decision is using Zustand as the external store from the start (not React useState), because undo/redo, sidebar access, and property panel editing all depend on it.

The key risks are: (1) JSON round-trip data loss if the transform layer is not designed for field preservation from the beginning, (2) dagre layout timing issues caused by React Flow's asynchronous node measurement, and (3) undo/redo recording every drag micro-movement if Zundo is not configured with throttling and partialize. All three have well-documented solutions, but each requires deliberate upfront design rather than bolting on later. The pitfalls research identified 7 critical issues, all with clear prevention strategies mapped to specific build phases.

## Key Findings

### Recommended Stack

The stack centers on React 19 + @xyflow/react 12.10 + Zustand 5 + Vite 7. Every dependency has been version-checked for compatibility as of March 2026. Notably, Tailwind CSS v4 introduces a CSS-first configuration model (no tailwind.config.js), and shadcn/ui CLI v4 generates Tailwind v4-compatible components using tw-animate-css instead of the deprecated tailwindcss-animate.

**Core technologies:**
- **@xyflow/react 12.10:** Node graph canvas -- dominant React library, 24K+ stars, built-in drag/drop/zoom/pan/minimap/handles
- **Zustand 5 + Zundo 2.3:** State management + undo/redo -- React Flow's officially recommended state manager; zundo adds temporal middleware in <700 bytes
- **Vite 7:** Build tool -- purely client-side SPA needs no SSR; 5x faster cold start than Next.js
- **Tailwind CSS 4.2 + shadcn/ui:** Styling and component system -- shadcn copies components into your project (owned code, not a dependency)
- **@dagrejs/dagre 2.0:** Auto-layout -- sufficient for DAG/tree structures; ELKjs is overkill
- **json-edit-react 1.29:** Inline JSON editor for property panel fallback -- 30KB vs Monaco's 2MB

**Critical version notes:** Use `@xyflow/react` (not deprecated `reactflow`), `@dagrejs/dagre` (not unmaintained `dagre`), and `tw-animate-css` (not deprecated `tailwindcss-animate`).

### Expected Features

**Must have (table stakes -- 17 features for v1):**
- JSON file import with auto-detect step container
- Render nodes on canvas with color-coding by role and key info badges
- Render styled edges with labels (solid/labeled/dashed/dotted by connection type)
- Multiple output handles per node (next, conditions, timeout, intent routes)
- Auto-layout with dagre (top-to-bottom and left-to-right)
- Click-to-edit property panel with structured fields + JSON editor fallback
- Connection editing via dropdowns
- Add new nodes from sidebar palette, delete nodes/edges, draw new edges
- Undo/redo, keyboard shortcuts, zoom/pan/minimap
- Export modified JSON with lossless round-trip
- Default test flow on first visit

**Should have (v1.x after validation -- 7 features):**
- Live JSON preview panel, search/find nodes, copy/paste nodes
- Snap-to-grid, dark mode, collapsible panels, edge bending control points

**Defer (v2+):**
- Structural validation, flow statistics, multi-file tabs, subflow grouping, flow diff/comparison

**Anti-features (explicitly out of scope):**
- Real-time collaboration, server-side persistence, authentication, custom schema validation, mobile editing, AI flow generation, plugin system

### Architecture Approach

The architecture follows a three-layer model: UI shell (React Flow canvas + panels) -> Zustand store (single store with flow/UI/JSON slices + Zundo temporal middleware) -> pure function utilities (JSON transform layer + dagre layout engine). The JSON transform layer is the most critical architectural boundary -- it converts between the external call flow JSON format and the internal React Flow representation while preserving all unknown fields for lossless round-trip. Components subscribe to specific store slices via useShallow selectors to prevent cascading re-renders.

**Major components:**
1. **JSON Transform Layer** (lib/transform/) -- pure functions for importFlow() and exportFlow() with unknown field preservation; zero React dependencies; must be testable in isolation
2. **Zustand Store** (store/) -- single store with three slices (flow, UI, JSON) wrapped in Zundo temporal middleware; partialize tracks only nodes/edges for undo
3. **React Flow Canvas** (components/canvas/) -- controlled ReactFlow component consuming nodes/edges from store; custom node types defined at module scope
4. **Custom Nodes/Edges** (components/nodes/, components/edges/) -- React.memo components with dynamic handles; 3 node types (Step, Decision, Terminal) and 3+ edge types (conditional, timeout, intent)
5. **Property Panel** (components/panels/) -- structured field editors for known properties, json-edit-react fallback for unknown properties, connection dropdowns
6. **Layout Engine** (lib/layout/) -- dagre wrapper with TB/LR direction; triggered on explicit user action only, not on every change
7. **App Shell** -- shadcn ResizablePanelGroup for sidebar/canvas/property panel; ReactFlowProvider wrapping all children

### Critical Pitfalls

1. **JSON round-trip data loss** -- Store raw step objects in node.data during import; merge edits back on export. Never destructure and discard unknown fields. Test with a zero-edit import-export diff. Recovery cost is HIGH if caught late.
2. **Dagre layout timing** -- Nodes must be measured by React Flow before dagre can compute positions. Render nodes with opacity:0 first, wait for node.measured.width to populate, then run dagre and reveal. Uses v12's `node.measured` (not v11's `node.width`).
3. **Undo/redo micro-movement recording** -- Configure Zundo with throttled handleSet and partialize to exclude transient state. Record drag positions only on onNodeDragStop, not during drag. Set a history limit (50-100 entries).
4. **nodeTypes/edgeTypes defined inside components** -- Creates new object reference every render, causing React Flow to unmount/remount all nodes. Define at module scope. Trivial fix but hard to diagnose.
5. **ReactFlowProvider scope** -- Must wrap the entire layout (canvas + sidebar + property panel + toolbar), not just the canvas. Otherwise sibling components cannot use React Flow hooks.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Project Scaffold and Foundation
**Rationale:** Every other phase depends on correct Vite/Tailwind/shadcn setup, TypeScript types, Zustand store skeleton, and ReactFlowProvider placement. Four critical pitfalls (nodeTypes at module scope, container dimensions, CSS import order, provider wrapping) must be addressed here.
**Delivers:** Running Vite app with React Flow rendering an empty canvas, Zustand store with three slice stubs, shadcn/ui initialized, Tailwind v4 configured, TypeScript types for call flow domain.
**Addresses:** Project scaffolding, canvas rendering, store foundation.
**Avoids:** Pitfalls 4, 5, 6, 7 (inline nodeTypes, provider scope, zero dimensions, CSS order).

### Phase 2: JSON Transform Layer + Import
**Rationale:** The transform layer is the hardest architectural decision and the highest-cost pitfall if done wrong. It must be built and tested before any editing features exist. Lossless round-trip fidelity is a non-negotiable constraint.
**Delivers:** importFlow() and exportFlow() pure functions with full unknown-field preservation, file picker import, default test flow on first visit, basic JSON export.
**Addresses:** JSON import, auto-detect step container, lossless round-trip export, default test flow.
**Avoids:** Pitfall 4 (JSON round-trip data loss). This is where the raw-step preservation pattern gets established.

### Phase 3: Canvas Rendering + Layout
**Rationale:** Depends on transform layer output (nodes/edges). Custom nodes and edges are the visual core of the product. Layout timing with dagre is the second-hardest integration problem.
**Delivers:** Custom node components (Step, Decision, Terminal) with color-coding, badges, and dynamic handles. Styled edge types (solid, labeled, dashed, dotted). Dagre auto-layout with TB/LR toggle. Minimap and controls.
**Addresses:** Node rendering, edge rendering, node color-coding, key info badges, multiple output handles, auto-layout, layout direction toggle, zoom/pan/minimap.
**Avoids:** Pitfall 2 (dagre layout timing), Pitfall 1 (nodeTypes at module scope -- verified here with real nodes).

### Phase 4: Property Panel + Editing
**Rationale:** Depends on canvas (need nodes to select) and store (need state management for edits). The property panel is the primary editing interface.
**Delivers:** Click-to-select node, property panel with structured fields, JSON editor fallback, connection editing dropdowns, sidebar palette with drag-to-add.
**Addresses:** Property panel, structured fields, JSON fallback editor, connection dropdowns, add new nodes.
**Avoids:** json-edit-react mutation bypass (must clone data and update via Zustand set()).

### Phase 5: Graph Editing Operations
**Rationale:** Depends on canvas and store. These are the mutation operations that make the tool an editor rather than a viewer. Undo/redo must be designed here with careful Zundo configuration.
**Delivers:** Delete nodes/edges, draw new edges, undo/redo, keyboard shortcuts.
**Addresses:** Delete, draw edges, undo/redo, keyboard shortcuts.
**Avoids:** Pitfall 3 (undo micro-movements), focus management pitfall (Delete key in text inputs).

### Phase 6: Export + Polish
**Rationale:** Export wiring depends on all editing operations being complete so the full import-edit-export cycle can be tested end-to-end. Polish features are low-effort, high-impact additions.
**Delivers:** Export button with file download, end-to-end round-trip verification, dark mode, collapsible panels, snap-to-grid.
**Addresses:** JSON export UX, dark mode, responsive panels, snap-to-grid.

### Phase 7: Enhanced Features (v1.x)
**Rationale:** These features add daily-workflow value but are not required for the core import-edit-export loop. Ship after validating the core with the team.
**Delivers:** Live JSON preview, search/find nodes, copy/paste nodes, edge bending.
**Addresses:** All P2 features from the prioritization matrix.

### Phase Ordering Rationale

- **Transform layer before canvas** because the node/edge data structures produced by importFlow() dictate custom node component design. Building nodes first creates throwaway work.
- **Canvas before property panel** because the property panel needs selectable nodes to edit.
- **Editing operations grouped together** because undo/redo must wrap all mutation types (add, delete, edit, connect). Configuring Zundo once for all operations is cleaner than retrofitting.
- **Export last in the core phases** because it exercises the full pipeline and serves as an integration test for everything before it.
- **Seven phases rather than nine** (compared to ARCHITECTURE.md's build order) because some of those phases are too granular for roadmap purposes and can be combined.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Transform Layer):** The auto-detect step container heuristic is the highest-complexity feature (rated HIGH in FEATURES.md). Needs research into the variety of JSON structures the team uses. Examine real call flow files during phase planning.
- **Phase 3 (Canvas + Layout):** Dagre layout timing with React Flow's async measurement is a known hard problem. Reference React Flow's official auto-layout example and useAutoLayout hook during implementation.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Scaffold):** Vite + React + Tailwind + shadcn setup is thoroughly documented by all four libraries.
- **Phase 4 (Property Panel):** Standard React form patterns with json-edit-react. Well-documented.
- **Phase 5 (Editing Operations):** React Flow's official examples cover delete, edge drawing, and Zundo undo/redo directly.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified against npm and official announcements as of March 2026. Compatibility matrix fully checked (React 19 + Zustand 5 + RF 12.10 + Tailwind 4 + shadcn CLI v4). |
| Features | HIGH | Feature landscape validated against 6 competitor products (Node-RED, Voiceflow, Twilio Studio, Cloverhound, SignalWire, Voiso). MVP definition is clear and scoped. |
| Architecture | HIGH | Architecture follows React Flow's official recommended patterns (Zustand store, external nodeTypes, controlled mode). Validated against official docs, examples, and community resources. |
| Pitfalls | HIGH | All 7 critical pitfalls verified against official React Flow troubleshooting docs, GitHub issues, and migration guides. Recovery costs assessed. |

**Overall confidence:** HIGH

### Gaps to Address

- **Auto-detect step container heuristic:** Research identified this as HIGH complexity but did not define the detection algorithm. During Phase 2 planning, examine 3-5 real call flow JSON files from the team to determine the heuristic rules (look for objects with `next`/`conditions`/`timeout_next` linking fields).
- **Exact structured fields for property panel:** FEATURES.md lists common fields (description, text, audio_file, wait_for_response, pause_duration, timeout) but the complete field inventory depends on the actual JSON schema. Gather this from real data during Phase 4 planning.
- **Performance threshold validation:** Stack research recommends optimizations for 50+ nodes (React.memo, useShallow, dagre debouncing). The actual performance ceiling should be tested with a representative large flow during Phase 3.
- **Edge label readability at scale:** Dagre node/edge spacing values (rankSep, nodeSep) need tuning with real flows. Default values may cause label overlap on dense graphs.

## Sources

### Primary (HIGH confidence)
- [@xyflow/react npm v12.10](https://www.npmjs.com/package/@xyflow/react) -- core library version and API
- [React Flow State Management Guide](https://reactflow.dev/learn/advanced-use/state-management) -- Zustand integration pattern
- [React Flow Performance Guide](https://reactflow.dev/learn/advanced-use/performance) -- memoization and selector patterns
- [React Flow Common Errors](https://reactflow.dev/learn/troubleshooting/common-errors) -- pitfall verification
- [React Flow v12 Migration Guide](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) -- breaking changes (node.measured)
- [Zustand v5 Announcement](https://pmnd.rs/blog/announcing-zustand-v5) -- useSyncExternalStore migration
- [Zundo GitHub](https://github.com/charkour/zundo) -- temporal middleware API and options
- [Tailwind CSS v4 Release](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first architecture
- [shadcn/ui Tailwind v4 Migration](https://ui.shadcn.com/docs/tailwind-v4) -- tw-animate-css, CLI v4

### Secondary (MEDIUM confidence)
- [Synergy Codes - State Management in React Flow](https://www.synergycodes.com/blog/state-management-in-react-flow) -- performance patterns
- [Cambridge Intelligence Graph UX](https://cambridge-intelligence.com/graph-visualization-ux-how-to-avoid-wrecking-your-graph-visualization/) -- UX best practices
- Competitor analysis: Node-RED, Voiceflow, Twilio Studio, Cloverhound Route, SignalWire, Voiso, Flowyte

### Tertiary (needs validation during implementation)
- Auto-detect step container heuristic -- derived from PROJECT.md spec, not validated against real JSON variety
- Dagre spacing values for label readability -- requires tuning with real flows

---
*Research completed: 2026-03-12*
*Ready for roadmap: yes*
