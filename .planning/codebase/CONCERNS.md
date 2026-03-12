# Codebase Concerns

**Analysis Date:** 2026-03-12

## Architectural Risks

**JSON-to-Flow Bidirectional Conversion Complexity:**
- Issue: The core algorithm in `src/lib/jsonToFlow.ts` must intelligently detect "steps containers" in arbitrary JSON, infer connection fields (`next`, `conditions`, `timeout_next`, `intent_detector_routes`, etc.), and later reconstruct the original JSON perfectly in `src/lib/flowToJson.ts`. This is error-prone because:
  - Different JSON schemas may use different connection field names (not all will use `conditions`; some might use `intents`, `branches`, `routes`, etc.)
  - Nested or deeply structured JSON will be hard to map to 2D graphs
  - Roundtrip conversion (JSON → Flow → JSON) must preserve all unrepresented fields perfectly, or data loss occurs
- Impact: Bugs in conversion logic could silently corrupt user data on export. Users may save a modified flow and lose metadata fields.
- Fix approach:
  - Write comprehensive unit tests for roundtrip conversion with sample JSON (test/lib/jsonToFlow.test.ts, test/lib/flowToJson.test.ts)
  - Add validation layer that compares input JSON with output JSON after roundtrip
  - Document the assumptions about JSON structure (e.g., "steps must be in a top-level key whose value is an object of objects")
  - Consider adding a "JSON Structure Analyzer" phase that requires user confirmation of detected structure before visualizing

**Node Identification Fragility:**
- Issue: The algorithm uses step keys (e.g., "hello", "main_pitch") as node IDs. If a user edits a node's title in the property panel, the old key is lost unless the title-edit logic also updates all edge references to that node.
- Files: `src/components/panels/PropertyPanel.tsx`, `src/store/flowStore.ts`
- Impact: Editing a node's name could break all connections to/from that node, creating orphaned edges.
- Fix approach: Make node renaming a special operation that updates all dependent edges. Or use UUIDs for internal node IDs and keep the step key as separate metadata.

**Edge Connection Inference:**
- Issue: When a user draws a new edge in the canvas, `src/store/flowStore.ts` must decide whether to add it to `next`, or add/update a `conditions` array entry. The spec says "update... based on edges" but doesn't specify the logic:
  - Is it one edge per source → always goes to `next`?
  - Multiple edges → goes to `conditions` array?
  - How are `timeout_next` vs `next` vs `conditions` distinguished when creating new edges?
- Files: `src/store/flowStore.ts` (onConnect handler), `src/lib/flowToJson.ts`
- Impact: User draws an edge expecting it to be a timeout route, but the system interprets it as a condition. The exported JSON doesn't match intent.
- Fix approach: Make edge creation require user intent selection (dialog: "What type of edge? Normal / Timeout / No Match / Intent Route?"). Or color-code handles and only allow specific handle-to-handle connections.

## Data Integrity Concerns

**Unvalidated JSON Import:**
- Issue: `src/components/panels/FlowToolbar.tsx` accepts any JSON file via file picker and directly parses it. There's no schema validation or error handling if the JSON is malformed or missing required fields.
- Impact: Corrupted or unexpected JSON could crash the visualizer or create an unrenderable graph (e.g., circular references, missing `steps` key).
- Fix approach: Add JSON Schema validation (use `ajv` package) with a fallback error UI that shows what's wrong. Provide sample JSON for user to fix.

**Loss of Custom Fields on New Node Creation:**
- Issue: When a user creates a new node via drag-and-drop from `src/components/flow/NodePalette.tsx`, the initial node data is just `{ label: 'New Step' }`. Any fields the user adds later are preserved, but if they switch layouts or the flow is re-parsed, those fields may be lost if not properly persisted to the store.
- Files: `src/components/flow/NodePalette.tsx`, `src/store/flowStore.ts`
- Impact: A newly created node might lose custom metadata when exported.
- Fix approach: Ensure `updateNodeData` in the store always performs a deep merge, not shallow. Test that new node fields survive export/import roundtrip.

## Performance Bottlenecks

**Auto-Layout on Every Load:**
- Issue: The spec says "on import → ... → auto-layout → render". The dagre layout is computed on every JSON load via `src/lib/autoLayout.ts`. For large flows (100+ nodes), this could block the UI.
- Files: `src/lib/autoLayout.ts`, `src/components/flow/FlowCanvas.tsx`
- Impact: Slow import experience for complex flows. Layout algorithm runs on main thread.
- Fix approach:
  - Defer layout to a Web Worker if flow has >50 nodes (use `web-worker` or `pako`-like pattern)
  - Add progress indicator during layout
  - Cache layout results and only recompute on node/edge changes, not every render
  - Use React Flow's `useNodesInitialized()` hook to ensure nodes are measured before layout (spec mentions this correctly)

**Zustand Store Re-render Overhead:**
- Issue: The store in `src/store/flowStore.ts` includes large objects (nodes, edges, originalJson). Every change to ANY part of the store triggers re-renders of all subscribers. In a large graph with frequent updates, this could cascade.
- Impact: Dragging nodes, editing properties, or hovering could cause frame drops.
- Fix approach:
  - Use `useShallow` selector hook everywhere (spec mentions this, ensure it's followed)
  - Split the store into multiple smaller stores: one for layout (nodes/edges), one for UI (selectedNodeId, isPanelOpen), one for data (originalJson)
  - Consider using React Flow's built-in state instead of Zustand for nodes/edges

**JSON Serialization on Export:**
- Issue: `src/lib/flowToJson.ts` serializes the entire current graph to JSON and creates a Blob. For large flows, this could be slow, especially if the JSON is nested/complex.
- Impact: "Export JSON" button hangs for large files.
- Fix approach: Stream export or defer serialization to Web Worker. Add compression option (gzip) for download.

## Security Considerations

**XSS Risk in Custom Node Rendering:**
- Issue: The `src/components/flow/StepNode.tsx` renders node data (description, text, disposition, action) directly as JSX. If the JSON contains malicious HTML/scripts in these fields, they could execute.
- Impact: User uploads a malicious JSON → script injected into the visualizer → possible credential theft or data exfiltration.
- Fix approach:
  - Sanitize all text fields with `DOMPurify` before rendering
  - Use `textContent` instead of `innerHTML` for any user-provided strings
  - Test with JSON containing `<script>`, `onerror=`, etc.

**File Upload Restrictions:**
- Issue: The file picker in `src/components/panels/FlowToolbar.tsx` accepts any `.json` file without size limits.
- Impact: User uploads a 1GB JSON file → browser memory exhaustion, tab crash.
- Fix approach: Add file size validation (max 10MB), add progress feedback for parsing large files.

**No Authentication/Authorization:**
- Issue: The spec doesn't mention auth. Flows may contain sensitive data (call scripts, routing logic, agent names). There's no mechanism to prevent sharing or exfiltration.
- Impact: If deployed as a web app, anyone with the URL can create/edit/export flows.
- Fix approach: Out of scope for v1 (note this as a future concern). If data is sensitive, recommend local-only usage or add basic auth headers.

## Known Design Gaps

**Missing: Undo/Redo:**
- Issue: Spec mentions "(if feasible, otherwise skip for v1)" but provides no fallback.
- Impact: Users must be careful; one wrong click and they lose work.
- Fix approach: Implement at least one-level undo via Zustand snapshot history. Or defer to v2.

**Missing: Validation Rules:**
- Issue: There's no validation that a flow is "valid" (e.g., no orphaned steps, no circular references, all condition destinations exist). The visualizer doesn't prevent creating an invalid graph.
- Impact: User exports a broken flow that won't execute in the backend.
- Fix approach: Add a "Validate Flow" action that walks the graph and reports issues. Highlight broken nodes in red.

**Missing: Handling Circular References:**
- Issue: If JSON contains a step that references itself (or creates a cycle), the dagre layout might produce odd results or infinite recursion.
- Files: `src/lib/autoLayout.ts`
- Impact: Visualizer hangs or produces unreadable layout.
- Fix approach: Add cycle detection before layout. Warn user and suggest breaking the cycle.

**Missing: Keyboard Shortcuts:**
- Issue: Spec mentions Ctrl+Z and Delete, but doesn't detail if they're implemented.
- Files: `src/components/flow/FlowCanvas.tsx`
- Impact: Users expect Delete key to work; if not, it's a UX gap.
- Fix approach: Add `onKeyDown` handler to FlowCanvas that dispatches delete/undo actions.

**Missing: Undo for Import:**
- Issue: User imports a new JSON, replacing the current flow. There's no way to undo and recover the previous flow.
- Files: `src/store/flowStore.ts` (loadJson action)
- Impact: Accidental re-import could erase work.
- Fix approach: Add a snapshot/history system. Or at least add a confirmation dialog before loading a new JSON.

## Fragile Areas

**React Flow Version Lock:**
- Issue: Spec mandates @xyflow/react v12+ (released late 2024). The API is still evolving. Breaking changes are likely in v13+.
- Files: `package.json`, all components using React Flow
- Impact: Future major version upgrade could require large refactoring.
- Fix approach: Pin to exact version initially (e.g., "^12.1.0"). Add integration tests to catch breaking changes early. Review React Flow changelog quarterly.

**json-edit-react Dependency:**
- Issue: `json-edit-react` (600 stars) is less mature than major libraries. The component is used for the fallback JSON editor (`src/components/panels/JsonPreview.tsx`). If it breaks or becomes unmaintained, there's no built-in alternative.
- Impact: JSON editor breaks → users can't edit raw JSON as fallback.
- Fix approach:
  - Test the component thoroughly early (test/components/JsonPreview.test.tsx)
  - Consider a fallback implementation using `<textarea>` + JSON.parse/stringify if json-edit-react fails
  - Monitor npm package for updates/security issues

**Dagre Layout Assumptions:**
- Issue: The autoLayout function assumes nodes have static dimensions (280x150). React Flow v12 provides `node.measured` dimensions, but if a node's content is dynamic, measured size might not match what's passed to dagre.
- Files: `src/lib/autoLayout.ts`
- Impact: Layout might be slightly misaligned, or nodes could overlap on first layout.
- Fix approach: Ensure `useNodesInitialized()` is called before layout (spec mentions this). Use `node.measured` in dagre setup.

**React Flow Drag Interaction Conflicts:**
- Issue: The spec mentions `className="nodrag"` for interactive elements inside custom nodes. But there's no global strategy for handling:
  - Text selection inside node cards
  - Scrolling in long property panels overlapping the canvas
  - Conflicting touch gestures on mobile (if used)
- Files: `src/components/flow/StepNode.tsx`, `src/components/panels/PropertyPanel.tsx`
- Impact: Accidental drag of canvas when user tries to select text or scroll.
- Fix approach: Test interaction thoroughly. Use `pointer-events: none` on non-interactive elements. Add specific event handlers for known edge cases.

## Scaling Limits

**Graph Size Limits:**
- Current: Spec doesn't mention max nodes. Dagre can handle 1000+ nodes, but:
  - React rendering 1000+ custom node components is slow
  - Zustand store updates on every change → O(n) subscribers re-render
  - Canvas pan/zoom might stutter
- Limit: Likely breaks around 500+ nodes (depends on hardware)
- Scaling path:
  - Virtualization: Only render visible nodes (use react-window-like approach)
  - Split large flows into sub-flows/groups
  - Add warning at 200+ nodes: "Consider breaking this into multiple flows"

**Export File Size:**
- Current: Spec doesn't mention. A flow with 100 nodes and metadata could easily be 1MB+
- Limit: Browser download limits vary; some corporate proxies restrict >100MB
- Scaling path: Add compression (gzip), streaming export, or archive format (zip)

## Missing Critical Features

**No Multi-User Collaboration:**
- Issue: If multiple users need to edit the same flow, there's no real-time sync, conflict resolution, or locking.
- Impact: Last-write-wins data loss. Specification is single-user only.
- Fix approach: Out of scope for v1. If needed later, consider Firebase Realtime or Yjs + WebSocket.

**No Flow Execution/Testing:**
- Issue: The visualizer can edit the JSON, but there's no way to preview or test the flow (e.g., simulate following a path, checking all branches are reachable).
- Impact: User exports a flow that fails in production (e.g., missing next steps, broken conditions).
- Fix approach: Out of scope for v1. v2 could add a "Test Flow" mode that steps through execution with mock data.

**No Version Control / Diff:**
- Issue: No built-in git-like history or ability to compare two flow versions.
- Impact: User doesn't know what changed between exports. Hard to review changes.
- Fix approach: Out of scope for v1. Could add simple versioning later (snapshot list, basic diff viewer).

## Test Coverage Gaps

**JSON Roundtrip Conversion:**
- What's not tested: Unit tests for jsonToFlow.ts and flowToJson.ts with various JSON structures, especially:
  - Flows with all edge types (next, conditions, timeout_next, intent_detector_routes, no_match_next)
  - Flows with deeply nested steps
  - Flows with numeric/boolean fields in steps
  - Flows missing expected fields (e.g., no conditions)
- Files: `src/lib/jsonToFlow.ts`, `src/lib/flowToJson.ts`
- Risk: Silent data corruption, undetected loss of fields
- Priority: High

**Canvas Interaction & Drag-Drop:**
- What's not tested: User interactions:
  - Drag node on canvas → position updates in store
  - Draw edge between nodes → connection stored correctly
  - Delete node via Delete key → node removed, edges cleaned up
  - Drag node from palette onto canvas → new node created
- Files: `src/components/flow/FlowCanvas.tsx`, `src/components/flow/StepNode.tsx`, `src/components/flow/NodePalette.tsx`
- Risk: Core UX broken without user knowing
- Priority: High

**Property Panel Updates:**
- What's not tested: Editing node properties:
  - Edit description field → updateNodeData called → node.data updated
  - Change connection dropdown → edge targets updated
  - Edit raw JSON in json-edit-react → node.data merged correctly
- Files: `src/components/panels/PropertyPanel.tsx`
- Risk: User edits a field, thinks it's saved, but it's lost on export
- Priority: High

**File Import/Export:**
- What's not tested: File operations:
  - Import valid JSON → flow renders
  - Import malformed JSON → error shown, app doesn't crash
  - Import large JSON (>10MB) → doesn't hang
  - Export → file download contains current graph state
  - Export → roundtrip (export, import) preserves flow
- Files: `src/components/panels/FlowToolbar.tsx`, `src/lib/jsonToFlow.ts`, `src/lib/flowToJson.ts`
- Risk: Data loss, corruption, or crashes on user workflows
- Priority: Critical

**Auto-Layout:**
- What's not tested: Dagre integration:
  - Layout with various graph shapes (linear, branching, complex)
  - Layout with >100 nodes (performance)
  - Layout direction toggle (TB vs LR)
  - Layout with circular references (should not hang)
- Files: `src/lib/autoLayout.ts`, `src/components/panels/FlowToolbar.tsx`
- Risk: Unrenderable or slow layouts
- Priority: Medium

**Error Handling:**
- What's not tested: Exception scenarios:
  - JSON parsing error
  - React Flow initialization failure
  - Zustand store error
  - File download cancellation
- Files: All
- Risk: User sees blank screen or cryptic error
- Priority: Medium

## Implementation Order Risks

**Spec Defines Everything Except Error Cases:**
- Issue: The spec is prescriptive about happy paths but silent on edge cases:
  - What happens if JSON has no `steps` key?
  - What if a condition references a non-existent step?
  - What if the user deletes all nodes?
  - What if the browser runs out of memory loading a huge JSON?
- Impact: Different implementers could make conflicting assumptions, leading to bugs.
- Fix approach: Before coding, create a "Specification Clarification" document addressing all "what if?" cases. Get stakeholder sign-off.

**Zustand + React Flow Integration Not Fully Specified:**
- Issue: The spec shows Zustand store interface and mentions `useShallow`, but doesn't detail:
  - Does Zustand own the nodes/edges, or does React Flow via its internal hooks?
  - If both, how are they kept in sync?
  - What happens if React Flow updates a node directly (via internal drag) and Zustand doesn't know?
- Impact: Potential state divergence bugs (React Flow rendered state ≠ Zustand stored state).
- Fix approach: During implementation, write explicit tests verifying Zustand and React Flow are always in sync.

---

*Concerns audit: 2026-03-12*
