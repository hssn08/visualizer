# Pitfalls Research

**Domain:** Flow editor / node graph editor (React Flow v12 + Zustand + Dagre)
**Researched:** 2026-03-12
**Confidence:** HIGH (majority of findings verified against official React Flow docs and GitHub issues)

## Critical Pitfalls

### Pitfall 1: Defining nodeTypes/edgeTypes Inside the Component

**What goes wrong:**
Passing a `nodeTypes` or `edgeTypes` object created inline inside a component causes React Flow to unmount and remount every custom node on every parent re-render. This destroys internal state, kills animations, and tanks performance with 50+ nodes.

**Why it happens:**
JavaScript creates a new object reference on every render. React Flow compares `nodeTypes` by reference. A new reference means "the types changed, re-create everything." Developers coming from other React patterns don't realize this is different from passing inline `style` objects.

**How to avoid:**
Define `nodeTypes` and `edgeTypes` as module-level constants outside any component. If they must be dynamic (rare), wrap in `useMemo` with an explicit dependency array.

```typescript
// CORRECT: module-level
const nodeTypes = { custom: CustomNode, decision: DecisionNode, terminal: TerminalNode };

// WRONG: inside component
function FlowEditor() {
  const nodeTypes = { custom: CustomNode }; // re-created every render
  return <ReactFlow nodeTypes={nodeTypes} />;
}
```

**Warning signs:**
- Nodes flicker or lose internal state (e.g., expanded panels collapse) when any unrelated state changes
- React DevTools shows custom node components unmounting/remounting repeatedly
- Sluggish UI even with only 10-20 nodes

**Phase to address:**
Phase 1 (scaffold). This must be correct from the very first line of code. Retrofitting is trivial but the bug is hard to diagnose.

---

### Pitfall 2: Layout Timing -- Dagre Needs Measured Dimensions Before Layout

**What goes wrong:**
Dagre requires the width and height of every node to compute positions. But React Flow does not know a node's dimensions until after it renders and the ResizeObserver fires. If you run dagre layout on initial load before measurement completes, all nodes stack at (0,0) or use wrong fallback dimensions. Custom nodes with variable content make this worse because you cannot hardcode a width.

**Why it happens:**
There is a chicken-and-egg problem: layout needs dimensions, dimensions need rendering, rendering needs positions. Developers call dagre in `useEffect` on mount, but `node.measured.width` is still `undefined` at that point.

**How to avoid:**
1. On initial load, render nodes with `opacity: 0` (or `visibility: hidden`) so they get measured without visual flicker.
2. Wait for `node.measured.width` and `node.measured.height` to be populated on all nodes before running dagre.
3. After dagre computes positions, set nodes with the new positions and `opacity: 1`.
4. Use the `onNodesInitialized` callback or a `useEffect` that watches for all nodes having `measured` values.

React Flow v12 stores dimensions in `node.measured.width` / `node.measured.height` (not `node.width` / `node.height` as in v11). Using the old property names silently returns `undefined`.

**Warning signs:**
- Nodes pile up at top-left corner on first load
- Layout "snaps" into place with visible jump after a delay
- Layout works for default nodes but breaks with custom nodes

**Phase to address:**
Phase 2 (layout). This is the single hardest integration problem between React Flow and dagre. Allocate extra time. Consider using React Flow's `useAutoLayout` hook from their official examples as a reference pattern.

---

### Pitfall 3: Undo/Redo Recording Every Drag Micro-Movement

**What goes wrong:**
Zundo's temporal middleware records a state snapshot on every Zustand `set()` call. When a user drags a node, React Flow fires `onNodesChange` for every pixel of movement, which calls `set()` each time. Result: a single drag creates hundreds of undo entries. Pressing Ctrl+Z moves the node back one pixel at a time instead of reverting the entire drag.

**Why it happens:**
Zundo records by default on every state mutation. React Flow's controlled mode calls `applyNodeChanges` on every `onNodesChange` event, which includes granular position changes during drag.

**How to avoid:**
1. Use Zundo's `handleSet` option with a throttle/debounce (e.g., 500ms) so rapid consecutive changes are batched into one history entry.
2. Alternatively, use selective recording: ignore `NodeChange` events of type `position` where `dragging: true`, and only record the final position on `onNodeDragStop`.
3. Use `partialize` to exclude transient UI state (selection highlights, hover states) from undo history.
4. Set a `limit` on Zundo (e.g., 50-100 entries) to prevent memory bloat from large state snapshots.

```typescript
const useStore = create(
  temporal(
    (set) => ({ /* ... */ }),
    {
      limit: 100,
      partialize: (state) => {
        const { transientUIState, ...tracked } = state;
        return tracked;
      },
      equality: (pastState, currentState) => shallow(pastState, currentState),
    }
  )
);
```

**Warning signs:**
- Ctrl+Z seems to "do nothing" (it's undoing a 1px move)
- Memory usage climbs steadily during editing sessions
- Undo history contains hundreds of entries after simple edits

**Phase to address:**
Phase 3 (undo/redo). Design the undo strategy before wiring up Zundo. This is an architecture decision, not a simple "add middleware" task.

---

### Pitfall 4: JSON Round-Trip Data Loss

**What goes wrong:**
The project must import arbitrary call flow JSON, let users edit it visually, and export the modified JSON preserving ALL original fields -- including fields the editor does not display or understand. Data loss during this round-trip makes the tool dangerous to use on production call flows.

**Why it happens:**
When converting imported JSON to React Flow nodes, developers typically extract only the fields they need (`next`, `conditions`, `description`, etc.) and discard the rest. On export, they reconstruct JSON from only the fields they tracked. Unknown fields like `voice_settings`, `max_clarification_retries`, or future additions are silently dropped.

**How to avoid:**
1. Store the complete original step object in `node.data.rawStep` (or similar). Never destructure and discard.
2. When the user edits a property, update it in the raw step object, not in a separate structure.
3. On export, serialize from `node.data.rawStep`, not from a manually constructed object.
4. Write integration tests that import a JSON file, make zero edits, export, and diff -- the output must be byte-identical (or semantically identical if key ordering changes).
5. Preserve the original JSON structure (the wrapper around the `steps` object, metadata fields, etc.).

**Warning signs:**
- Exported JSON has fewer keys than imported JSON
- Fields like `voice_settings` disappear after round-trip
- JSON key ordering changes unexpectedly (use a stable serializer)

**Phase to address:**
Phase 1 (import/export). This is the foundational data model decision. Getting it wrong means rewriting the entire data layer. The raw-step preservation pattern must be established before any editing features are built.

---

### Pitfall 5: Using React Flow Hooks Outside ReactFlowProvider

**What goes wrong:**
Calling `useReactFlow()`, `useNodes()`, `useEdges()`, `useStore()`, or `useUpdateNodeInternals()` from a component that is not a descendant of `<ReactFlow />` or `<ReactFlowProvider />` throws a context error at runtime. This commonly happens with sidebar panels, property editors, and toolbar components that need to read/write flow state.

**Why it happens:**
React Flow uses React Context internally. The `<ReactFlow />` component provides its own context, but only to its children. Sibling components (like a sidebar) are outside this context. Developers wrap at the wrong level or forget to wrap at all.

**How to avoid:**
Wrap the entire editor layout (flow canvas + sidebar + toolbar + property panel) in a single `<ReactFlowProvider>` at the top level. Since this project uses Zustand for state management, the Zustand store can also serve as the bridge -- but React Flow-specific hooks (like `screenToFlowPosition`, `fitView`) still require the provider context.

```tsx
// CORRECT
function App() {
  return (
    <ReactFlowProvider>
      <div className="flex">
        <Sidebar />           {/* Can use useReactFlow() */}
        <FlowCanvas />        {/* Contains <ReactFlow /> */}
        <PropertyPanel />     {/* Can use useReactFlow() */}
      </div>
    </ReactFlowProvider>
  );
}
```

**Warning signs:**
- Runtime error: "useReactFlow must be used within a ReactFlowProvider"
- Sidebar or property panel cannot access flow state
- Developers resort to prop drilling instead of using hooks

**Phase to address:**
Phase 1 (scaffold). The component tree structure must have the provider at the root from the start.

---

### Pitfall 6: React Flow Container With Zero Dimensions

**What goes wrong:**
React Flow measures its parent DOM element to size the canvas. If the parent container has no explicit height (or relies on content for height, which is 0 when empty), the canvas renders as invisible -- nodes exist in state but nothing appears on screen.

**Why it happens:**
CSS `height: 100%` only works if every ancestor also has an explicit height. In a Vite + Tailwind setup, developers often use flex layouts where a child div collapses to 0 height because no `flex-1` or `h-full` class is applied. The React Flow canvas is empty by default (no intrinsic content height), so it collapses.

**How to avoid:**
Ensure the React Flow container has explicit dimensions. In a Tailwind layout, the typical pattern is:

```html
<div class="h-screen flex">
  <aside class="w-64">Sidebar</aside>
  <div class="flex-1">  <!-- THIS must have dimensions -->
    <ReactFlow ... />
  </div>
</div>
```

Every element from `<html>` down to the React Flow parent must propagate height. Test by adding a temporary red border to the container.

**Warning signs:**
- Console warning: "The React Flow parent container needs a width and a height"
- Blank white area where the canvas should be
- Nodes exist in state (visible in React DevTools) but are not rendered

**Phase to address:**
Phase 1 (scaffold). One of the first things to verify when setting up the canvas.

---

### Pitfall 7: Missing or Misordered CSS Imports

**What goes wrong:**
React Flow ships mandatory base styles. Without importing `@xyflow/react/dist/style.css`, nodes render as unstyled divs, edges are invisible, controls don't appear, and the background pattern is missing. When using Tailwind, if Tailwind's CSS is imported before React Flow's CSS, Tailwind's reset layer strips React Flow's styles.

**Why it happens:**
The `@xyflow/react` package (v12) changed the import path from `reactflow/dist/style.css`. Developers copy v11 examples and the old import silently fails. Tailwind's Preflight reset (`@tailwind base`) aggressively normalizes styles, overriding React Flow defaults if loaded first.

**How to avoid:**
1. Import React Flow styles before Tailwind: `import '@xyflow/react/dist/style.css'` must come before your Tailwind entry point.
2. For custom theming, use `@xyflow/react/dist/base.css` (mandatory minimum) and add your own styles on top.
3. Verify edges are visible (SVG paths), not just nodes (HTML divs), after setup.

**Warning signs:**
- Nodes visible but edges invisible
- Background dots/pattern missing
- Controls component renders but looks broken
- Works in dev but breaks in production (CSS ordering differs in build)

**Phase to address:**
Phase 1 (scaffold). Must be correct in the initial Vite/Tailwind configuration.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoded node dimensions for dagre | Layout works immediately without measurement dance | Custom nodes with variable content break; every node type change requires manual dimension updates | Never for this project (custom nodes with badges, variable handles) |
| Storing nodes/edges in React state instead of Zustand | Simpler initial setup with `useNodesState`/`useEdgesState` | Cannot integrate Zundo for undo/redo; sidebar/property panel cannot access state without prop drilling; must rewrite state layer later | Only for throwaway prototypes |
| Using `toObject()` as the export format | Quick save/restore | React Flow's JSON format includes internal fields (`measured`, `selected`, `dragging`) that pollute the output; not compatible with the original call flow JSON format | Never -- must build a custom export that maps back to the original JSON schema |
| Inline edge labels via the `label` prop | Simple, one-line setup | Cannot style labels independently, no click handlers, poor positioning on complex paths, no overflow control | Acceptable for MVP, but plan migration to `EdgeLabelRenderer` |
| Single handle per node (source + target) | Simpler node component | Cannot visually distinguish which connection type an edge represents (next vs. condition vs. timeout); contradicts a core requirement | Never for this project (multiple output handles is a requirement) |
| Skipping `useUpdateNodeInternals` after dynamic handle changes | Fewer API calls | Edges connect to stale handle positions; phantom handles appear; edges point to wrong locations after node content changes | Never -- always call after handle count or position changes |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| React Flow + Zustand | Using `useStore` from `@xyflow/react` (React Flow's internal store) when you mean your own Zustand store. Naming collision. | Name your store explicitly (e.g., `useFlowEditorStore`). Use React Flow's `useStore` only for reading React Flow internals like `nodeInternals`. |
| React Flow + Dagre | Passing `node.width` / `node.height` (v11 pattern) instead of `node.measured.width` / `node.measured.height` (v12). Dagre silently gets `undefined` and uses default 0x0. | Always read dimensions from `node.measured` in v12. Add a guard: `if (!node.measured?.width) return;` |
| Zustand + Zundo | Calling `temporal` middleware without `partialize`, which records the entire store (including React Flow internal state like viewport position, selection, etc.) on every change. | Always use `partialize` to record only the data you want to undo (nodes, edges, custom state). Exclude transient state. |
| React Flow + Tailwind | Tailwind's `@apply` in custom node CSS conflicting with React Flow's inline styles for positioning. Nodes jump to wrong positions. | Never override React Flow's `position`, `transform`, or `z-index` styles on node wrappers. Only style the node content inside. |
| screenToFlowPosition + drag-and-drop | Passing `event.screenX` / `event.screenY` instead of `event.clientX` / `event.clientY`. The naming `screenToFlowPosition` is misleading -- it expects client coordinates. | Always use `event.clientX` and `event.clientY` with `screenToFlowPosition`. |
| json-edit-react + node.data | Allowing json-edit-react to mutate the data object directly, which bypasses Zustand's `set()` and breaks undo/redo tracking. | Clone data before passing to json-edit-react. On change callback, update via Zustand `set()`. |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Subscribing to `nodes` or `edges` array in components that don't need all nodes | Every component re-renders on every node drag, edge change, or selection toggle | Use `useShallow` with granular selectors: `useStore(useShallow(s => [s.specificField]))`. For individual node data, use `useStore(s => s.nodeLookup.get(id))` | 30+ nodes with complex custom node components |
| Custom node components not wrapped in `React.memo` | All nodes re-render when any single node changes | Wrap every custom node component in `React.memo()`. React Flow provides memo optimization but only if the component reference is stable. | 20+ nodes; noticeable at 50+ |
| Rendering all edge labels as React components in SVG | SVG foreignObject rendering is expensive; labels don't respect viewport culling | Use `EdgeLabelRenderer` which renders labels as HTML outside SVG. React Flow already culls off-screen edges but SVG labels bypass this. | 50+ edges with labels |
| Running dagre layout on every node/edge change | Layout computation blocks the main thread; 100+ node graph causes visible jank | Only re-layout on explicit user action (button click) or structural changes (node add/delete). Never re-layout on drag or selection changes. | 40+ nodes with dagre; 100+ with ELK |
| Not using `getNode()` for single-node lookups | Filtering the entire nodes array is O(n). With frequent lookups in event handlers (hover, click), this adds up. | Use `getNode(id)` from `useReactFlow()` which is O(1) via internal Map lookup. | 100+ nodes with frequent interactions |
| Storing derived data in Zustand instead of computing it | Redundant state that must be kept in sync; stale data bugs | Compute derived values (e.g., "nodes connected to selected node") in selectors or `useMemo`, not in the store. | Any scale, but debugging cost grows with complexity |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Auto-layout overwriting manual node positions without warning | User spends 5 minutes arranging nodes perfectly, clicks auto-layout, all positions lost with no undo | Make auto-layout an explicit, undo-able action. Show confirmation if nodes have been manually positioned. Record pre-layout state in undo history. |
| Edge labels overlapping on dense graphs | Users cannot read which condition leads where -- defeats the purpose of visualization | Increase dagre `rankSep` and `nodeSep` for graphs with many labeled edges. Consider hiding labels at low zoom levels. Use `EdgeLabelRenderer` for better label positioning. |
| Property panel steals focus from canvas | User tries to press Delete to remove a node but the property panel's text input captures the keypress | Implement focus management: keyboard shortcuts only fire when canvas has focus. Use `event.target` checks. Disable global shortcuts when input elements are focused. |
| No visual feedback during JSON import | User drops a large JSON file, nothing happens for 2 seconds, they think it failed | Show loading indicator during import. For large files, parse and layout in a microtask or Web Worker. |
| Nodes overlap after auto-layout with many edges | Dagre minimizes edge crossings but doesn't account for edge label space or handle positions | Add padding to node dimensions passed to dagre (actual width + label margin). Use `ranker: 'tight-tree'` for cleaner layouts. |
| Delete confirmation for every single node | Annoying for power users doing bulk cleanup | Use confirmation only for nodes with connections. Support multi-select + batch delete. Make confirmation optional in settings. |

## "Looks Done But Isn't" Checklist

- [ ] **JSON Import:** Test with a JSON file containing fields the editor doesn't display (e.g., `voice_settings`, `max_clarification_retries`). Export and verify ALL fields survive the round-trip.
- [ ] **Edge Connections:** Verify that edges connect to the correct handles when a node has multiple output handles. Test that `sourceHandle` and `targetHandle` IDs are set correctly.
- [ ] **Undo/Redo:** Test that Ctrl+Z after dragging a node reverts the entire drag, not just one pixel. Test undo across different action types (edit property, add node, delete edge).
- [ ] **Layout with Custom Nodes:** Test auto-layout with nodes of different heights (a node with 2 handles vs. one with 8 handles). Verify no overlapping.
- [ ] **Large Flow Performance:** Load a 50+ node flow. Pan and zoom. Verify no dropped frames. Open React DevTools Profiler and confirm custom nodes are not all re-rendering on every interaction.
- [ ] **Export Fidelity:** Export a flow, re-import it, export again. Diff the two exports. They must be identical.
- [ ] **Keyboard Shortcuts:** Test Delete key when a text input in the property panel is focused -- it should delete text, not the selected node.
- [ ] **Dark Mode:** Toggle dark mode with a flow loaded. Verify edges, labels, background pattern, minimap, and controls all respond to the theme change.
- [ ] **fitView on Load:** Import a flow and verify it fits the viewport. Resize the browser window and verify fitView still works.
- [ ] **Multiple Handle Types:** Create a node with next, condition, and timeout handles. Draw edges to each. Delete one edge. Verify the others remain connected to the correct handles.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| nodeTypes defined inline | LOW | Move object to module scope. 5-minute fix, instant improvement. |
| Dagre layout timing wrong | MEDIUM | Implement opacity-0 render-then-layout pattern. Requires refactoring the layout trigger logic. Half-day effort. |
| Undo/redo records every micro-change | MEDIUM | Add throttling to Zundo config and implement `onNodeDragStop` recording. Requires careful testing of all undo scenarios. |
| JSON round-trip data loss | HIGH | If discovered late, must restructure the entire data model to preserve raw step objects. Every feature that reads/writes node data must be updated. Multi-day effort. |
| Wrong CSS import order | LOW | Swap import order. Verify in both dev and production builds. |
| Container zero dimensions | LOW | Add explicit height class. 2-minute fix once identified. |
| Hooks outside provider | LOW | Move `<ReactFlowProvider>` up the tree. May require minor component restructuring. |
| Performance death by re-renders | MEDIUM-HIGH | Requires auditing every component that subscribes to store state, adding `useShallow`, wrapping nodes in `React.memo`, and potentially restructuring selectors. Effort scales with codebase size. |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| nodeTypes defined outside component | Phase 1: Scaffold | Code review: `nodeTypes` is a module-level constant |
| Container dimensions | Phase 1: Scaffold | Visual: canvas renders at correct size in flex layout |
| CSS import order | Phase 1: Scaffold | Visual: edges visible, background pattern renders, dark mode works |
| ReactFlowProvider wrapping | Phase 1: Scaffold | All sibling panels can call `useReactFlow()` without error |
| JSON round-trip preservation | Phase 1: Import/Export | Test: import JSON, export immediately, diff is empty |
| Dagre layout timing | Phase 2: Layout | Visual: no flicker on load; nodes appear in correct positions |
| Dagre node spacing for labels | Phase 2: Layout | Visual: edge labels readable on a 20+ node flow |
| screenToFlowPosition coordinates | Phase 2: Drag-and-drop from sidebar | Test: node drops at cursor position, not offset |
| Multiple handle management | Phase 2: Node components | Test: edges connect to correct handles; `useUpdateNodeInternals` called on handle changes |
| Performance (memo, selectors) | Phase 3: Polish | Profiler: dragging a node does not re-render other nodes |
| Undo/redo granularity | Phase 3: Undo/Redo | Test: single Ctrl+Z reverts a complete drag, not one pixel |
| Zundo memory management | Phase 3: Undo/Redo | Monitor: memory usage stays flat during 30-minute editing session |
| Focus management for shortcuts | Phase 3: Polish | Test: Delete key in text input does not delete selected node |
| Auto-layout overwrites manual positions | Phase 3: UX Polish | UX: auto-layout is undo-able; confirmation shown if manual positions exist |

## Sources

- [Common Errors - React Flow (official troubleshooting)](https://reactflow.dev/learn/troubleshooting/common-errors)
- [Performance Guide - React Flow](https://reactflow.dev/learn/advanced-use/performance)
- [Migrate to React Flow 12 (breaking changes)](https://reactflow.dev/learn/troubleshooting/migrate-to-v12)
- [State Management with Zustand - React Flow](https://reactflow.dev/learn/advanced-use/state-management)
- [Dagre Layout Example - React Flow](https://reactflow.dev/examples/layout/dagre)
- [Custom Nodes - React Flow](https://reactflow.dev/learn/customization/custom-nodes)
- [Theming (CSS import order) - React Flow](https://reactflow.dev/learn/customization/theming)
- [Zundo GitHub - temporal middleware options](https://github.com/charkour/zundo)
- [fitView timing fix in v12.5.0](https://reactflow.dev/whats-new/2025-03-27)
- [useUpdateNodeInternals - React Flow](https://reactflow.dev/api-reference/hooks/use-update-node-internals)
- [Drag and Drop example - React Flow](https://reactflow.dev/examples/interaction/drag-and-drop)
- [Edge Label Renderer - React Flow](https://reactflow.dev/examples/edges/edge-label-renderer)
- [Node re-rendering issue #4983](https://github.com/xyflow/xyflow/issues/4983)
- [Layout measurement discussion #2973](https://github.com/xyflow/xyflow/discussions/2973)
- [Undo/redo discussion #3364](https://github.com/xyflow/xyflow/discussions/3364)
- [Synergy Codes - State Management in React Flow (ebook)](https://www.synergycodes.com/blog/state-management-in-react-flow)
- [Overlapping edges discussion #2757](https://github.com/xyflow/xyflow/discussions/2757)
- [fitView onInit issue #4793](https://github.com/xyflow/xyflow/issues/4793)
- [Dagre edges overlap on nodes #4800](https://github.com/xyflow/xyflow/issues/4800)

---
*Pitfalls research for: React Flow v12 + Zustand flow editor*
*Researched: 2026-03-12*
