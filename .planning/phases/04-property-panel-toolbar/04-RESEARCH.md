# Phase 4: Property Panel & Toolbar - Research

**Researched:** 2026-03-12
**Domain:** React sidebar panels, form controls, JSON editing, toolbar actions
**Confidence:** HIGH

## Summary

Phase 4 adds two major UI surfaces: a right sidebar property panel for editing selected node data, and a top toolbar with action buttons. The property panel must show structured form fields (description, text, audio_file, etc.), a connections editor with dropdowns to re-target outgoing edges, and a full JSON fallback editor via `json-edit-react`. The toolbar must provide Import, Export, Auto Layout, Direction toggle, and Fit View buttons.

The existing architecture is well-prepared for this phase. The Zustand store already has `selectedNodeId` and `setSelectedNodeId` wired to `onNodeClick`/`onPaneClick` in FlowCanvas. Node data lives at `node.data.step` as a `Record<string, unknown>`, and `flowToJson` already rebuilds connection fields from edges. The key integration challenge is updating `node.data.step` fields in the store when the user edits structured fields or the JSON editor, and ensuring those changes propagate to both the canvas and the JSON editor simultaneously.

**Primary recommendation:** Build the property panel as a pure React component outside ReactFlow (not using `<Panel>`), positioned in the App layout's flex container. Use shadcn/ui form components (Input, Textarea, Select, Label, Switch) for structured fields. Use `json-edit-react` with `setData` prop (not `onUpdate`) for the JSON fallback editor. Add store actions `updateNodeData(nodeId, patch)` and `updateEdgeTarget(edgeId, newTarget)` to handle edits. The toolbar is a simple row of shadcn Buttons with lucide-react icons, using `useReactFlow().fitView()` for the Fit View action.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| EDIT-01 | Clicking a node opens a right sidebar property panel | Store already has `selectedNodeId`; FlowCanvas already calls `setSelectedNodeId` on node click. Panel renders conditionally based on `selectedNodeId !== null`. |
| EDIT-02 | Panel shows structured fields for common properties (description, text, audio_file, wait_for_response, pause_duration, timeout) | shadcn/ui Input, Textarea, Switch components provide form controls. Node data at `node.data.step` contains these fields. |
| EDIT-03 | Panel shows connections section with dropdowns to change edge targets | Store has `edges` array with `source`/`target`/`data.edgeType`. All node IDs available from `nodes`. shadcn Select for dropdowns. |
| EDIT-04 | Panel includes full JSON editor (json-edit-react) for all node data as fallback | `json-edit-react@1.29` provides `JsonEditor` component with `data`/`setData` props. Not yet installed; needs `npm install json-edit-react`. |
| EDIT-05 | Property changes update the store in real-time | New store action `updateNodeData(nodeId, patch)` merges partial data into `node.data.step` and updates the nodes array. |
| EDIT-06 | Clicking canvas background deselects node and closes panel | FlowCanvas already calls `setSelectedNodeId(null)` on `onPaneClick`. Panel conditionally renders when `selectedNodeId` is null. |
| UI-02 | Top toolbar with Import, Export, Auto Layout, Layout Direction, Zoom to Fit, JSON Preview toggle | Toolbar is a row of shadcn Buttons. Import already exists. Export uses `flowToJson` + download. Auto Layout and Direction use existing store actions. Fit View uses `useReactFlow().fitView()`. JSON Preview toggle is a UI state boolean. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| json-edit-react | 1.29.x | Full JSON fallback editor in property panel | Already decided in project (STATE.md). Self-contained, themeable, MIT licensed. |
| @xyflow/react | 12.10.x | Canvas, `useReactFlow` hook for fitView | Already installed. `useReactFlow().fitView()` for toolbar Fit View button. |
| zustand | 5.x | State management for node data updates | Already installed. Extend store with `updateNodeData` action. |
| lucide-react | 0.577.x | Icons for toolbar buttons | Already installed. Import, Download, LayoutGrid, ArrowUpDown, Maximize2 icons. |

### Supporting (shadcn/ui components to install)
| Component | Install Command | Purpose | When to Use |
|-----------|----------------|---------|-------------|
| Input | `npx shadcn@latest add input` | Text fields for description, text, audio_file | Structured property fields |
| Textarea | `npx shadcn@latest add textarea` | Multi-line text editing | Text/description fields that may be long |
| Label | `npx shadcn@latest add label` | Accessible form labels | Every form field in property panel |
| Select | `npx shadcn@latest add select` | Dropdown for edge target selection | Connection editor dropdowns |
| Switch | `npx shadcn@latest add switch` | Boolean toggles | wait_for_response toggle |
| Separator | `npx shadcn@latest add separator` | Visual dividers between panel sections | Between structured fields, connections, JSON editor |
| ScrollArea | `npx shadcn@latest add scroll-area` | Scrollable panel content | Property panel may overflow viewport height |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| json-edit-react | Monaco Editor | Overkill for inline JSON editing; 2MB+ bundle. json-edit-react is ~50KB and purpose-built. |
| shadcn Select | Native `<select>` | shadcn Select provides consistent styling, keyboard navigation, and portal rendering. |
| External sidebar | React Flow `<Panel>` | `<Panel>` positions content inside the ReactFlow viewport area; sidebar should be outside the flow canvas to avoid viewport overlap. |

**Installation:**
```bash
npm install json-edit-react
npx shadcn@latest add input textarea label select switch separator scroll-area
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── canvas/           # Existing: FlowCanvas, StepNode, edges
│   ├── panel/            # NEW: Property panel components
│   │   ├── PropertyPanel.tsx      # Main panel shell (conditional render)
│   │   ├── StructuredFields.tsx   # Form fields for common properties
│   │   ├── ConnectionEditor.tsx   # Edge target dropdowns
│   │   └── JsonFallbackEditor.tsx # json-edit-react wrapper
│   ├── toolbar/          # Existing: ImportButton; NEW: full toolbar
│   │   └── Toolbar.tsx            # All toolbar buttons in one component
│   └── ui/               # shadcn components (auto-generated)
├── store/
│   ├── flowSlice.ts      # EXTEND: add updateNodeData, updateEdgeTarget
│   ├── uiSlice.ts        # EXTEND: add jsonPreviewOpen state
│   └── types.ts          # EXTEND: add new action types
```

### Pattern 1: Property Panel as Conditional Sidebar
**What:** The PropertyPanel renders in the App layout's flex container, to the right of the canvas. It only renders when `selectedNodeId` is not null.
**When to use:** Always for this phase.
**Example:**
```typescript
// App.tsx layout pattern
// Source: Project architecture analysis
export default function App() {
  const selectedNodeId = useAppStore((s) => s.selectedNodeId);
  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col">
        <Toolbar />
        <div className="flex flex-1 min-h-0">
          <div className="flex-1">
            <FlowCanvas />
          </div>
          {selectedNodeId && <PropertyPanel nodeId={selectedNodeId} />}
        </div>
      </div>
    </ReactFlowProvider>
  );
}
```

### Pattern 2: Store-Driven Node Data Updates
**What:** A new `updateNodeData(nodeId, patch)` action in the flow slice that immutably updates `node.data.step` by merging a partial object. This keeps the single source of truth in Zustand.
**When to use:** Every time a structured field or JSON editor changes a value.
**Example:**
```typescript
// Source: Zustand immutable update pattern
updateNodeData: (nodeId, patch) => {
  set({
    nodes: get().nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              step: { ...(node.data.step as Record<string, unknown>), ...patch },
            },
          }
        : node
    ),
  });
},
```

### Pattern 3: Edge Target Update via Store Action
**What:** A `updateEdgeTarget(edgeId, newTarget)` action that changes an edge's target node. Since `flowToJson` rebuilds connection fields from edges, this is all that's needed.
**When to use:** When user selects a different target in the connections dropdown.
**Example:**
```typescript
// Source: React Flow edge update pattern
updateEdgeTarget: (edgeId, newTarget) => {
  set({
    edges: get().edges.map((edge) =>
      edge.id === edgeId ? { ...edge, target: newTarget } : edge
    ),
  });
},
```

### Pattern 4: json-edit-react with setData Callback
**What:** Use the `setData` prop (not `onUpdate`) to sync json-edit-react's internal state with the Zustand store. The `setData` callback receives the entire updated data object; replace the full `node.data.step` in the store.
**When to use:** For the JSON fallback editor.
**Example:**
```typescript
// Source: json-edit-react official docs (GitHub README)
<JsonEditor
  data={step}
  setData={(newStep) => updateNodeData(nodeId, newStep)}
  rootName={nodeId}
  collapse={2}
  theme="githubDarkTheme"  // or custom theme matching shadcn
/>
```

**Important note on setData:** The `setData` prop receives the complete updated data object. Since `node.data.step` is the full step, pass it directly as `data` and use the callback to replace the entire step. Do NOT use `onUpdate` for state management -- it's meant for side effects only (per official docs recommendation since v1.14.0).

### Pattern 5: Toolbar with useReactFlow Hook
**What:** The toolbar lives outside ReactFlow but inside ReactFlowProvider. It can use `useReactFlow()` to call `fitView()`. Other actions dispatch to the Zustand store.
**When to use:** For the Fit View and any viewport-related toolbar actions.
**Example:**
```typescript
// Source: React Flow official docs - useReactFlow hook
import { useReactFlow } from '@xyflow/react';

function Toolbar() {
  const { fitView } = useReactFlow();
  const { autoLayout, setLayoutDirection, layoutDirection } = useAppStore(
    useShallow((s) => ({
      autoLayout: s.autoLayout,
      setLayoutDirection: s.setLayoutDirection,
      layoutDirection: s.layoutDirection,
    }))
  );

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b">
      <ImportButton />
      <ExportButton />
      <Button onClick={() => autoLayout()}>Auto Layout</Button>
      <Button onClick={() => setLayoutDirection(layoutDirection === 'TB' ? 'LR' : 'TB')}>
        {layoutDirection === 'TB' ? 'Top-Bottom' : 'Left-Right'}
      </Button>
      <Button onClick={() => fitView({ padding: 0.2 })}>Fit View</Button>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Storing panel-local form state separate from Zustand:** Every field change should immediately update the store. Do not maintain a local form state and "save" on blur/close -- this creates sync issues and breaks the real-time update requirement (EDIT-05).
- **Using `onUpdate` for json-edit-react state management:** The library explicitly recommends `setData` since v1.14.0. Using `onUpdate` causes double-render issues and sync problems.
- **Putting PropertyPanel inside ReactFlow:** Using `<Panel position="top-right">` would overlay the panel on the canvas viewport. The panel should be a separate flex column outside `<ReactFlow>` so the canvas resizes to fill remaining space.
- **Rebuilding edge ID on target change:** Edge IDs currently encode the target (e.g., `stepKey->next->targetStep`). When changing an edge target, either regenerate the ID or accept stale IDs. Since React Flow uses `id` for keying, regenerate the ID to avoid stale references.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON tree editing | Custom recursive tree editor | json-edit-react | Complex UX (expand/collapse, type coercion, add/delete fields). Already decided for the project. |
| Form field components | Raw `<input>` elements | shadcn Input/Textarea/Select/Switch/Label | Consistent styling with project theme, accessibility, keyboard navigation |
| Scrollable overflow | CSS `overflow-y: auto` div | shadcn ScrollArea | Cross-browser consistent scrollbar styling |
| Icon set | SVG files or custom icons | lucide-react | Already in project, tree-shakeable, TypeScript-typed |
| File download | Custom blob/URL generation | Standard Blob + URL.createObjectURL pattern | Simple enough to inline (3-4 lines), no library needed |

**Key insight:** The structured fields are simple form inputs -- the complexity is in wiring them to the store correctly, not in the UI components themselves. The JSON editor is where a library saves enormous effort.

## Common Pitfalls

### Pitfall 1: json-edit-react Re-renders on Every Keystroke
**What goes wrong:** If the `data` prop reference changes on every store update, json-edit-react re-initializes its internal state, losing cursor position and expand/collapse state.
**Why it happens:** The `setData` callback writes to the store, which triggers a re-render with a new `data` reference, which json-edit-react treats as a full reset.
**How to avoid:** json-edit-react internally manages its own state after receiving the initial `data` prop. The `setData` prop is called by the library to notify the parent -- it does NOT cause json-edit-react to re-render from the prop. The key is to NOT derive `data` from a selector that changes on every keystroke. Pass the initial step object and let json-edit-react manage edits internally.
**Warning signs:** Cursor jumps to start of field, collapse state resets, typing feels laggy.

### Pitfall 2: Edge ID Staleness After Target Change
**What goes wrong:** Edge IDs currently encode the target (`stepKey->next->targetStep`). Changing an edge's target without updating its ID means the old ID no longer reflects reality.
**Why it happens:** The ID format was designed for initial creation, not mutation.
**How to avoid:** When updating an edge target, also regenerate the edge ID. Create a helper function like `buildEdgeId(source, edgeType, target)` to standardize ID creation.
**Warning signs:** React key warnings, flowToJson producing wrong connections, duplicate edge IDs.

### Pitfall 3: Structured Fields and JSON Editor Fight Over State
**What goes wrong:** User edits a field in the structured form; JSON editor shows the old value (or vice versa).
**Why it happens:** Two UI surfaces editing the same data must share a single source of truth.
**How to avoid:** Both surfaces read from `node.data.step` in the store. Structured fields dispatch `updateNodeData(nodeId, { fieldName: value })`. JSON editor dispatches a full step replacement. When the store updates, both re-render with the new data.
**Warning signs:** Edits in one panel not appearing in the other, stale data on re-open.

### Pitfall 4: Panel Width Stealing Canvas Space
**What goes wrong:** Opening the panel shrinks the canvas viewport, but React Flow doesn't re-calculate node positions or viewport.
**Why it happens:** React Flow needs a resize event to update its internal dimensions.
**How to avoid:** Use CSS transitions for panel open/close and rely on the browser's ResizeObserver (which React Flow listens to) to handle viewport updates automatically. The flex layout naturally handles this: when the panel appears, the canvas div shrinks, triggering React Flow's internal resize handler.
**Warning signs:** Nodes appear cut off, minimap doesn't match visible area.

### Pitfall 5: Export Button Without Metadata Check
**What goes wrong:** User clicks Export before importing any JSON, causing a crash because `metadata` is null.
**Why it happens:** `flowToJson` requires metadata (stepsKey, wrapperFields).
**How to avoid:** Disable Export button when `metadata === null` or `nodes.length === 0`. Use the `disabled` prop on the Button component.
**Warning signs:** Uncaught TypeError on first load when clicking Export.

## Code Examples

Verified patterns from official sources and project analysis:

### Export Button (File Download)
```typescript
// Source: Standard Web API + project flowToJson
function ExportButton() {
  const { nodes, edges, metadata } = useAppStore(
    useShallow((s) => ({ nodes: s.nodes, edges: s.edges, metadata: s.metadata }))
  );

  const handleExport = () => {
    if (!metadata) return;
    const json = flowToJson(nodes, edges, metadata);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flow.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={!metadata}>
      <Download data-icon="inline-start" />
      Export
    </Button>
  );
}
```

### Structured Field with Store Binding
```typescript
// Source: shadcn Input + Zustand store pattern
function StructuredFields({ nodeId, step }: { nodeId: string; step: Record<string, unknown> }) {
  const updateNodeData = useAppStore((s) => s.updateNodeData);

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={(step.description as string) ?? ''}
          onChange={(e) => updateNodeData(nodeId, { description: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="text">Text</Label>
        <Textarea
          id="text"
          value={(step.text as string) ?? ''}
          onChange={(e) => updateNodeData(nodeId, { text: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="wait_for_response"
          checked={!!step.wait_for_response}
          onCheckedChange={(checked) => updateNodeData(nodeId, { wait_for_response: checked })}
        />
        <Label htmlFor="wait_for_response">Wait for Response</Label>
      </div>
    </div>
  );
}
```

### Connection Editor with Select Dropdown
```typescript
// Source: shadcn Select + project edge structure
function ConnectionEditor({ nodeId }: { nodeId: string }) {
  const { edges, nodes, updateEdgeTarget } = useAppStore(
    useShallow((s) => ({
      edges: s.edges,
      nodes: s.nodes,
      updateEdgeTarget: s.updateEdgeTarget,
    }))
  );

  const outgoingEdges = edges.filter((e) => e.source === nodeId);
  const allNodeIds = nodes.map((n) => n.id);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Connections</h3>
      {outgoingEdges.map((edge) => (
        <div key={edge.id} className="flex items-center gap-2">
          <Label className="text-xs min-w-[80px]">
            {(edge.data?.edgeType as string) ?? 'next'}
          </Label>
          <Select
            value={edge.target}
            onValueChange={(newTarget) => updateEdgeTarget(edge.id, newTarget)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allNodeIds.map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
```

### json-edit-react Integration
```typescript
// Source: json-edit-react official docs + project integration
import { JsonEditor } from 'json-edit-react';

function JsonFallbackEditor({ nodeId, step }: { nodeId: string; step: Record<string, unknown> }) {
  const updateNodeData = useAppStore((s) => s.updateNodeData);

  return (
    <div className="border rounded-lg overflow-hidden">
      <JsonEditor
        data={step}
        setData={(newData) => {
          // setData receives the complete updated object
          updateNodeData(nodeId, newData as Record<string, unknown>);
        }}
        rootName={nodeId}
        collapse={2}
        minWidth="100%"
        maxWidth="100%"
      />
    </div>
  );
}
```

### Store Extension for updateNodeData
```typescript
// Source: Zustand immutable update pattern
// Add to FlowSlice interface:
updateNodeData: (nodeId: string, patch: Record<string, unknown>) => void;
updateEdgeTarget: (edgeId: string, newTarget: string) => void;

// Add to createFlowSlice:
updateNodeData: (nodeId, patch) => {
  set({
    nodes: get().nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            data: {
              ...node.data,
              step: { ...(node.data.step as Record<string, unknown>), ...patch },
            },
          }
        : node
    ),
  });
},
updateEdgeTarget: (edgeId, newTarget) => {
  set({
    edges: get().edges.map((edge) =>
      edge.id === edgeId
        ? {
            ...edge,
            id: edge.id.replace(/->([^>]+)$/, `->${newTarget}`),
            target: newTarget,
          }
        : edge
    ),
  });
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| json-edit-react `onUpdate` for state | `setData` prop for state | v1.14.0 (2024) | Simpler sync, fewer re-renders |
| Built-in theme strings | Imported theme objects | v1.19.0 (2024) | Tree-shaking improvement, breaking change in imports |
| React Flow v11 `useStore` | React Flow v12 `useReactFlow()` | @xyflow/react 12 (2024) | Cleaner hook API, better TypeScript |

**Deprecated/outdated:**
- json-edit-react: Using `onUpdate` for state management is discouraged since v1.14.0. Use `setData` instead.
- json-edit-react: Passing theme name as string no longer works since v1.19.0. Must import theme object (e.g., `import { githubDarkTheme } from 'json-edit-react'`).

## Open Questions

1. **json-edit-react full step replacement vs. patch**
   - What we know: `setData` receives the complete updated object. `updateNodeData` expects a patch (partial).
   - What's unclear: Whether the component always passes the full object or sometimes just the changed subtree.
   - Recommendation: In the `setData` callback, replace the entire step object rather than merging, since json-edit-react provides the complete state. Create a separate `replaceNodeStep(nodeId, fullStep)` action or just call `updateNodeData` with the full object (spread merge is safe when receiving full data).

2. **Edge ID regeneration on target change**
   - What we know: Current edge IDs encode source, type, and target. Changing target creates an inconsistency.
   - What's unclear: Whether React Flow cares about ID format or just needs uniqueness.
   - Recommendation: Regenerate the full ID using the same pattern (`source->type->newTarget`). React Flow uses ID for keying, so changing ID will unmount/remount the edge component, which is acceptable.

3. **JSON Preview toggle (UI-02) scope**
   - What we know: Requirements list "JSON Preview toggle" in the toolbar. EXP-04 says "Live JSON preview panel shows current state (toggleable)" but is assigned to Phase 6.
   - What's unclear: Whether Phase 4 should implement the toggle button only (disabled/placeholder) or the full preview.
   - Recommendation: Add the toggle button in Phase 4's toolbar but leave the actual JSON preview panel implementation to Phase 6 (EXP-04). The button can set a `jsonPreviewOpen` boolean in the UI slice, ready for Phase 6 to consume.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x + @testing-library/react 16.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDIT-01 | Clicking node opens right sidebar property panel | unit | `npx vitest run src/components/panel/__tests__/PropertyPanel.test.tsx -x` | Wave 0 |
| EDIT-02 | Structured fields for common properties | unit | `npx vitest run src/components/panel/__tests__/StructuredFields.test.tsx -x` | Wave 0 |
| EDIT-03 | Connections section with dropdowns to change edge targets | unit | `npx vitest run src/components/panel/__tests__/ConnectionEditor.test.tsx -x` | Wave 0 |
| EDIT-04 | Full JSON editor (json-edit-react) shows complete node data | unit | `npx vitest run src/components/panel/__tests__/JsonFallbackEditor.test.tsx -x` | Wave 0 |
| EDIT-05 | Property changes update store in real-time | unit | `npx vitest run src/store/__tests__/store.test.ts -x` | Extend existing |
| EDIT-06 | Clicking canvas background closes panel | unit | `npx vitest run src/__tests__/App.test.tsx -x` | Extend existing |
| UI-02 | Top toolbar with action buttons | unit | `npx vitest run src/components/toolbar/__tests__/Toolbar.test.tsx -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/panel/__tests__/PropertyPanel.test.tsx` -- covers EDIT-01, EDIT-06
- [ ] `src/components/panel/__tests__/StructuredFields.test.tsx` -- covers EDIT-02
- [ ] `src/components/panel/__tests__/ConnectionEditor.test.tsx` -- covers EDIT-03
- [ ] `src/components/panel/__tests__/JsonFallbackEditor.test.tsx` -- covers EDIT-04
- [ ] `src/components/toolbar/__tests__/Toolbar.test.tsx` -- covers UI-02
- [ ] Extend `src/store/__tests__/store.test.ts` -- covers EDIT-05 (updateNodeData, updateEdgeTarget actions)
- [ ] Extend `src/__tests__/App.test.tsx` -- covers EDIT-06 (panel visibility toggle)

## Sources

### Primary (HIGH confidence)
- Project source code analysis -- store/types.ts, flowSlice.ts, uiSlice.ts, FlowCanvas.tsx, StepNode.tsx, App.tsx, edgeExtractors.ts, flowToJson.ts
- [json-edit-react GitHub README](https://github.com/CarlosNZ/json-edit-react) -- API props, setData pattern, theme imports, restriction filters
- [React Flow useReactFlow docs](https://reactflow.dev/api-reference/hooks/use-react-flow) -- fitView, getNodes, updateNodeData methods
- [React Flow Panel component docs](https://reactflow.dev/api-reference/components/panel) -- positioning, usage (confirmed NOT suitable for sidebar)
- [shadcn/ui component docs](https://ui.shadcn.com/docs/components/radix/input) -- Input, Textarea, Select, Label, Switch, Separator, ScrollArea

### Secondary (MEDIUM confidence)
- [json-edit-react npm](https://www.npmjs.com/package/json-edit-react) -- version 1.29.0, last published ~Nov 2025
- [lucide-react](https://lucide.dev/guide/packages/lucide-react) -- icon names and import patterns

### Tertiary (LOW confidence)
- None -- all findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already decided and documented in STATE.md; versions verified against package.json
- Architecture: HIGH -- patterns derived from existing codebase analysis and official React Flow/Zustand docs
- Pitfalls: HIGH -- pitfalls identified from library documentation and codebase structure analysis

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable libraries, mature ecosystem)
