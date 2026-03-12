# Phase 5: Graph Editing & Undo/Redo - Research

**Researched:** 2026-03-12
**Domain:** React Flow graph editing, drag-and-drop node creation, Zundo undo/redo
**Confidence:** HIGH

## Summary

Phase 5 adds full graph editing capabilities to the flow editor: a sidebar node palette with drag-and-drop creation, edge drawing/deletion synced with step data, node deletion with confirmation, and undo/redo for all operations. The project already has Zundo temporal middleware configured with `partialize` (tracking nodes + edges only) and a 100-step limit. The store already has `onConnect` wired via `addEdge`. The primary work is: (1) building a DnD sidebar palette, (2) augmenting `onConnect` and `onEdgesChange` to sync edge changes back to step data, (3) adding node deletion with confirmation dialog, and (4) wiring Zundo's `pause`/`resume` for drag throttling plus keyboard shortcuts.

The existing `flowToJson` already derives connection fields from edges, so the "source of truth" model is: **edges array is the source of truth for connections; step data is synced from edges**. For GRAPH-06 and GRAPH-07, the store must update `node.data.step` connection fields whenever edges are created or deleted, so that the property panel and JSON editor reflect current state in real-time.

**Primary recommendation:** Use Zundo's `pause()`/`resume()` on `onNodeDragStart`/`onNodeDragStop` rather than `handleSet` throttle, as it is cleaner and produces exactly one undo step per drag. Use React Flow's `onBeforeDelete` for confirmation dialogs. Use shadcn AlertDialog for the confirmation UI.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GRAPH-01 | User can add new nodes via drag-and-drop from sidebar palette | DnD pattern: pointer events + `screenToFlowPosition` + Zustand `setNodes` |
| GRAPH-02 | Palette offers Basic Step, Decision Step, Terminal Step templates | Three templates with predefined step data structures matching edge extractors |
| GRAPH-03 | User can draw new edges by dragging between node handles | Already wired via `onConnect`; needs augmentation to sync step data and set edge type/data |
| GRAPH-04 | User can delete nodes with confirmation dialog | `onBeforeDelete` callback with shadcn AlertDialog; resolves Promise on user action |
| GRAPH-05 | User can delete edges | Already handled by React Flow's built-in edge deletion; needs `onEdgesDelete` callback |
| GRAPH-06 | Deleting an edge removes the corresponding connection field from step data | `onEdgesDelete` handler clears the matching field on source node's `step` object |
| GRAPH-07 | Drawing a new edge adds the appropriate field to source step data | Custom `onConnect` handler sets `step.next` (or other field) based on sourceHandle |
| UNDO-01 | User can undo any editing action with Ctrl+Z | `useAppStore.temporal.getState().undo()` bound to keyboard event |
| UNDO-02 | User can redo with Ctrl+Shift+Z | `useAppStore.temporal.getState().redo()` bound to keyboard event |
| UNDO-03 | Node dragging is throttled so a full drag is one undo step | `pause()` on `onNodeDragStart`, `resume()` on `onNodeDragStop` |
| UI-03 | Keyboard shortcut: Delete/Backspace removes selected node | React Flow's `deleteKeyCode` prop (default is 'Backspace') combined with `onBeforeDelete` |
| UI-04 | Keyboard shortcut: Ctrl+Z undo, Ctrl+Shift+Z redo | Global keydown listener in a `useUndoRedo` hook |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @xyflow/react | ^12.10.1 | React Flow canvas, handles, edge drawing, node deletion | Project's graph library |
| zustand | ^5.0.11 | State management for nodes, edges, UI state | Already configured with slices |
| zundo | ^2.3.0 | Temporal middleware for undo/redo history | Already wired with partialize + limit |
| shadcn/ui | v4 | UI components (AlertDialog for confirmation) | Project's component library |
| lucide-react | ^0.577.0 | Icons for palette items | Already installed |

### Supporting (needs install)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn AlertDialog | (shadcn component) | Node deletion confirmation dialog | GRAPH-04 requires confirmation before deletion |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Zundo pause/resume for drag | Zundo handleSet + lodash.throttle | Throttle still produces multiple undo entries within window; pause/resume is exact |
| onBeforeDelete for confirmation | Custom delete handler with deleteKeyCode=null | onBeforeDelete is the official React Flow pattern for async confirmation |
| HTML5 drag-and-drop API | Pointer events DnD | React Flow's official example uses pointer events; more reliable cross-platform |
| Native window.confirm() | shadcn AlertDialog | AlertDialog is non-blocking, themeable, consistent with project's UI library |

**Installation:**
```bash
npx shadcn@latest add alert-dialog
```

No new npm packages are needed. Zundo and all other dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    palette/
      NodePalette.tsx          # Left sidebar with draggable node templates
      PaletteItem.tsx          # Individual draggable palette entry
      nodeTemplates.ts         # Template definitions for Basic/Decision/Terminal
      __tests__/
        NodePalette.test.tsx
    canvas/
      FlowCanvas.tsx           # Extended with DnD handlers and delete handlers
    ui/
      alert-dialog.tsx         # shadcn AlertDialog component (auto-generated)
  hooks/
    useUndoRedo.ts             # Keyboard shortcuts + undo/redo API
    useNodeDelete.ts           # Node deletion with confirmation (onBeforeDelete)
  store/
    flowSlice.ts               # Extended with addNode, deleteNode, syncEdgeToStepData
```

### Pattern 1: Pointer-Event Drag-and-Drop from Sidebar
**What:** Sidebar items use `onPointerDown` to initiate drag. On `pointerup`, check if the drop target is `.react-flow`, convert screen coordinates to flow coordinates via `screenToFlowPosition`, and add the new node to the store.
**When to use:** GRAPH-01, GRAPH-02 (node palette drag-and-drop creation)
**Example:**
```typescript
// Source: React Flow official drag-and-drop example (reactflow.dev/examples/interaction/drag-and-drop)
// In the sidebar item:
onPointerDown={(event) => {
  event.preventDefault();
  (event.target as HTMLElement).setPointerCapture(event.pointerId);
  setDragging(true);
  setDropAction(({ position }) => {
    const newNode = {
      id: generateStepKey(template.type),
      type: 'step',
      position,
      data: {
        label: template.label,
        step: { ...template.defaultStep },
        isFirstNode: false,
      },
    };
    store.setNodes([...store.nodes, newNode]);
  });
}}

// On pointerup (via document listener):
const flowPosition = screenToFlowPosition({ x: event.clientX, y: event.clientY });
dropAction?.({ position: flowPosition });
```

### Pattern 2: Edge-to-Step-Data Sync on Connect
**What:** When a user draws a new edge (onConnect), the handler adds the edge AND updates the source node's step data with the appropriate connection field. The sourceHandle ID determines which field to set.
**When to use:** GRAPH-07 (drawing an edge adds connection field to step data)
**Example:**
```typescript
// Custom onConnect that syncs edge to step data:
onConnect: (connection) => {
  const { sourceHandle, source, target } = connection;
  // Add edge with proper type and data
  const newEdge: Edge = {
    id: `${source}->${sourceHandle}->${target}`,
    source,
    target,
    sourceHandle,
    targetHandle: connection.targetHandle,
    type: 'conditional',
    data: { edgeType: deriveEdgeType(sourceHandle) },
  };
  set({ edges: [...get().edges, newEdge] });

  // Sync to step data based on sourceHandle
  if (sourceHandle === 'next') {
    get().updateNodeData(source, { next: target });
  } else if (sourceHandle === 'timeout') {
    get().updateNodeData(source, { timeout_next: target });
  } else if (sourceHandle === 'no_match') {
    get().updateNodeData(source, { no_match_next: target });
  }
  // conditions and intent routes need index/name extraction from handle ID
}
```

### Pattern 3: Pause/Resume Undo During Drag
**What:** Call `useAppStore.temporal.getState().pause()` when a node drag starts and `resume()` when it stops. All position changes during the drag are applied to the store but NOT recorded in undo history. On resume, Zundo captures the final state as one undo step.
**When to use:** UNDO-03 (dragging a node is one undo step)
**Example:**
```typescript
// In FlowCanvas:
const onNodeDragStart = useCallback(() => {
  useAppStore.temporal.getState().pause();
}, []);

const onNodeDragStop = useCallback(() => {
  useAppStore.temporal.getState().resume();
}, []);

<ReactFlow
  onNodeDragStart={onNodeDragStart}
  onNodeDragStop={onNodeDragStop}
  // ...
/>
```

### Pattern 4: Async Confirmation via onBeforeDelete
**What:** React Flow's `onBeforeDelete` callback receives nodes and edges about to be deleted. Return a Promise that resolves to `true` (allow) or `false` (cancel). Show shadcn AlertDialog while the Promise is pending.
**When to use:** GRAPH-04 (delete node with confirmation dialog)
**Example:**
```typescript
// This requires a state-driven dialog pattern since onBeforeDelete is async:
const [deleteConfirm, setDeleteConfirm] = useState<{
  nodes: Node[];
  edges: Edge[];
  resolve: (value: boolean) => void;
} | null>(null);

const onBeforeDelete = useCallback(async ({ nodes, edges }) => {
  if (nodes.length === 0) return true; // Edge-only deletion: no confirmation needed
  return new Promise<boolean>((resolve) => {
    setDeleteConfirm({ nodes, edges, resolve });
  });
}, []);

// In JSX:
<AlertDialog open={!!deleteConfirm}>
  <AlertDialogContent>
    <AlertDialogTitle>Delete Node?</AlertDialogTitle>
    <AlertDialogDescription>
      This will remove "{deleteConfirm?.nodes[0]?.id}" and its connected edges.
    </AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => { deleteConfirm?.resolve(false); setDeleteConfirm(null); }}>
        Cancel
      </AlertDialogCancel>
      <AlertDialogAction onClick={() => { deleteConfirm?.resolve(true); setDeleteConfirm(null); }}>
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Pattern 5: Keyboard Shortcut Hook
**What:** A custom hook that attaches a global keydown listener for Ctrl+Z (undo) and Ctrl+Shift+Z (redo). Uses `useAppStore.temporal.getState()` to call `undo()`/`redo()`.
**When to use:** UNDO-01, UNDO-02, UI-04
**Example:**
```typescript
export function useUndoRedo() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useAppStore.temporal.getState().redo();
        } else {
          useAppStore.temporal.getState().undo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

### Anti-Patterns to Avoid
- **Storing undo history in component state:** Undo/redo MUST go through Zundo temporal middleware on the Zustand store, never through React useState.
- **Using HTML5 drag-and-drop for palette:** The React Flow official example uses pointer events. HTML5 DnD has quirks with ghost images and drop zones that don't play well with React Flow's coordinate system.
- **Calling addEdge from @xyflow/react directly in onConnect:** The default `addEdge` utility does not set `type: 'conditional'` or `data: { edgeType: ... }`. Must create edge manually with proper ID format, type, and data so it renders with the ConditionalEdge component and can be synced to step data.
- **Using handleSet throttle for drag:** Throttle-based approaches still record multiple intermediate states within the throttle window. `pause()`/`resume()` is exact: zero intermediate states.
- **Deleting nodes without removing connected edges:** React Flow's `deleteElements` helper handles this automatically, but if doing manual deletion, MUST also remove edges where `edge.source === nodeId || edge.target === nodeId`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Undo/redo state machine | Custom history stack | Zundo temporal middleware (already configured) | Handles partialize, limit, equality, pause/resume |
| Edge creation duplicate prevention | Manual duplicate check | Check edge array before adding; use unique ID format | `addEdge` from @xyflow/react handles duplication but doesn't set our custom edge type |
| Screen-to-flow coordinate conversion | Manual viewport math | `useReactFlow().screenToFlowPosition()` | Accounts for zoom, pan, and DPI correctly |
| Node + connected edge deletion | Manual edge filtering | React Flow's built-in deletion via `onBeforeDelete` + `onDelete` | Handles cascading edge removal automatically |
| Accessible confirmation dialog | Custom modal | shadcn AlertDialog | Focus trap, keyboard nav, screen reader announcements |

**Key insight:** React Flow already handles the heavy lifting for deletion (cascading edge removal), connection validation, and coordinate transforms. The main custom work is syncing edge changes back to step data and wiring up the DnD palette.

## Common Pitfalls

### Pitfall 1: addEdge Creates Edges Without Custom Type/Data
**What goes wrong:** The `addEdge` utility from @xyflow/react creates a minimal edge from a Connection object. It does NOT set `type: 'conditional'` or `data: { edgeType: 'next' }`, so newly drawn edges won't render with the ConditionalEdge component and won't be synced to step data by flowToJson.
**Why it happens:** `addEdge` only uses the fields from the Connection type: source, target, sourceHandle, targetHandle.
**How to avoid:** Replace the current `onConnect` handler. Instead of `addEdge(connection, edges)`, manually construct the Edge with the proper ID format (`source->handleId->target`), `type: 'conditional'`, and appropriate `data.edgeType` derived from the sourceHandle.
**Warning signs:** New edges render as plain lines (no styled ConditionalEdge), or export doesn't include connection fields for manually drawn edges.

### Pitfall 2: onNodeDragStop Fires Without Actual Movement
**What goes wrong:** React Flow fires `onNodeDragStop` even when a node is clicked without being dragged. If you resume undo tracking on every `onNodeDragStop`, you may create spurious undo entries.
**Why it happens:** Known React Flow behavior -- selection triggers the drag lifecycle.
**How to avoid:** Track whether the node actually moved by comparing position on `onNodeDragStart` vs `onNodeDragStop`. Only resume if position changed, OR accept that pause/resume on click without movement is harmless (Zundo won't create an entry if state hasn't changed, since `equality` check compares partialized state).
**Warning signs:** Extra undo steps that seem to do nothing.

### Pitfall 3: Step Data Out of Sync with Edges
**What goes wrong:** After drawing or deleting an edge, the node's `step` object in `node.data.step` still reflects the old connection fields. The property panel shows stale connections, and the JSON editor shows outdated data.
**Why it happens:** `flowToJson` derives connections from edges (correct for export), but the live step data in the store is NOT automatically updated when edges change.
**How to avoid:** After every edge creation (`onConnect`) and edge deletion (`onEdgesDelete`), explicitly update the source node's step data to reflect the new connection. Use the existing `updateNodeData` action.
**Warning signs:** PropertyPanel ConnectionEditor shows connections that don't match the actual edges on canvas.

### Pitfall 4: Node ID Collisions When Creating New Nodes
**What goes wrong:** New nodes created from the palette need unique IDs that serve as step keys. If the ID generation doesn't account for existing nodes, duplicates cause React Flow errors.
**Why it happens:** Simple incrementing counters (e.g., `new_step_1`) may collide with existing step keys from imported flows.
**How to avoid:** Generate IDs that combine a prefix with a counter, and check against existing node IDs: `new_step_N` where N increments until unique. Or use a UUID-like approach.
**Warning signs:** React warnings about duplicate keys, nodes overlapping or replacing each other.

### Pitfall 5: Deleting a Node Doesn't Update Other Nodes' Step Data
**What goes wrong:** When node B is deleted, any other node A that has `step.next = "B"` still references a nonexistent step.
**Why it happens:** Edge deletion removes the edge from the array, but the source node's step data still has the connection field.
**How to avoid:** In the `onDelete` or `onEdgesDelete` callback (which fires for edges connected to deleted nodes), clean up the source node's step data by removing the connection field.
**Warning signs:** Export produces JSON with dangling references to deleted step keys.

### Pitfall 6: AlertDialog Blocks React Flow's Delete Flow
**What goes wrong:** `onBeforeDelete` returns a Promise. If the AlertDialog state management is wrong (e.g., dialog never renders, or resolve never called), the delete operation hangs indefinitely.
**Why it happens:** The Promise-based pattern requires careful coordination between React state (dialog visibility) and the Promise resolve callback.
**How to avoid:** Keep the confirmation state and resolve function in a single state variable. Always resolve the Promise in both Cancel and Delete handlers, and on dialog close.
**Warning signs:** Node appears selected for deletion but nothing happens, or UI becomes unresponsive after pressing Delete.

## Code Examples

### Node Template Definitions
```typescript
// Source: Project-specific, based on existing edge extractor patterns

export interface NodeTemplate {
  type: string;
  label: string;
  description: string;
  icon: string; // lucide icon name
  defaultStep: Record<string, unknown>;
}

export const NODE_TEMPLATES: NodeTemplate[] = [
  {
    type: 'basic',
    label: 'Basic Step',
    description: 'A step with a single "next" connection',
    icon: 'Square',
    defaultStep: {
      description: '',
      text: '',
      next: '',
    },
  },
  {
    type: 'decision',
    label: 'Decision Step',
    description: 'A step with conditional branches',
    icon: 'GitBranch',
    defaultStep: {
      description: '',
      text: '',
      wait_for_response: true,
      conditions: [],
    },
  },
  {
    type: 'terminal',
    label: 'Terminal Step',
    description: 'An endpoint (hangup/transfer)',
    icon: 'CircleStop',
    defaultStep: {
      description: '',
      text: '',
      action: 'hangup',
    },
  },
];
```

### Deriving Edge Type from Source Handle
```typescript
// Used in onConnect to determine edge data type from the handle ID
export function deriveEdgeType(sourceHandle: string | null): string {
  if (!sourceHandle || sourceHandle === 'next') return 'next';
  if (sourceHandle === 'timeout') return 'timeout';
  if (sourceHandle === 'no_match') return 'no_match';
  if (sourceHandle.startsWith('condition-')) return 'condition';
  if (sourceHandle.startsWith('intent-')) return 'intent';
  return 'next'; // fallback
}
```

### Sync Edge Deletion to Step Data
```typescript
// Called from onEdgesDelete or onDelete callback
function removeConnectionFromStep(
  edge: Edge,
  updateNodeData: (nodeId: string, patch: Record<string, unknown>) => void,
  getNode: (id: string) => Node | undefined
): void {
  const edgeType = edge.data?.edgeType;
  const sourceNode = getNode(edge.source);
  if (!sourceNode) return;

  const step = (sourceNode.data as { step: Record<string, unknown> }).step;

  switch (edgeType) {
    case 'next':
      updateNodeData(edge.source, { next: undefined });
      break;
    case 'timeout':
      updateNodeData(edge.source, { timeout_next: undefined });
      break;
    case 'no_match':
      updateNodeData(edge.source, { no_match_next: undefined });
      break;
    case 'condition': {
      const idx = edge.data?.conditionIndex as number;
      if (idx != null && Array.isArray(step.conditions)) {
        const conditions = [...(step.conditions as Record<string, unknown>[])];
        if (conditions[idx]) {
          conditions[idx] = { ...conditions[idx] };
          delete conditions[idx].next;
        }
        updateNodeData(edge.source, { conditions });
      }
      break;
    }
    case 'intent': {
      const intentName = edge.data?.intentName as string;
      if (intentName && step.intent_detector_routes) {
        const routes = { ...(step.intent_detector_routes as Record<string, string>) };
        delete routes[intentName];
        updateNodeData(edge.source, {
          intent_detector_routes: Object.keys(routes).length > 0 ? routes : undefined,
        });
      }
      break;
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HTML5 DnD API for sidebar drag | Pointer events API | React Flow v12 (2024) | Better cross-platform, no ghost image issues |
| handleSet + throttle for drag undo | pause/resume temporal tracking | Zundo v2.0+ (2024) | Exact one-step undo per drag, no timing heuristics |
| Manual undo stack | Zundo temporal middleware | Zundo v2.0 (2023) | Automatic partialize, diff, equality, limit |
| onConnect + addEdge utility | Custom onConnect with manual edge construction | Project-specific | Ensures custom edge types and data are always set |
| window.confirm() for deletion | onBeforeDelete + AlertDialog | React Flow v12 | Non-blocking, accessible, themed confirmation |

**Deprecated/outdated:**
- `useNodesState`/`useEdgesState` hooks: The project uses Zustand store directly, which is the recommended pattern for complex state.
- `deleteKeyCode={null}` workaround: No longer needed; `onBeforeDelete` handles confirmation cleanly.

## Open Questions

1. **Edge creation for new nodes with no handles initially**
   - What we know: New nodes from palette have `step.next = ''` (Basic) or `step.conditions = []` (Decision). The `buildOutputHandles` function only creates handles when connection fields have values.
   - What's unclear: Should new Basic nodes render with a "next" handle even when `next` is empty string? Or should users first set the "next" field via the property panel?
   - Recommendation: Treat empty string `''` as having a handle (modify `buildOutputHandles` to show a handle for `typeof step.next === 'string'` which already works). For Decision nodes with empty `conditions` array, add a "+" button or initial condition in the template. The simplest approach: Basic step starts with `next: ''` which already satisfies the handle check.

2. **Palette sidebar position vs property panel**
   - What we know: App.tsx already has a `{/* Sidebar placeholder - Phase 5 */}` comment on the LEFT side. PropertyPanel is on the RIGHT.
   - What's unclear: Whether both can be open simultaneously without crowding.
   - Recommendation: Palette on the left (narrow, ~56px collapsed / ~200px expanded), property panel on the right (w-80). Both can coexist. The `flex-1` canvas between them handles responsive sizing.

3. **Undo/redo across property panel edits**
   - What we know: Zundo partializes on `nodes` and `edges`. Property edits go through `updateNodeData` which modifies `nodes`. So property edits ARE tracked in undo history.
   - What's unclear: Whether rapid typing in text fields creates too many undo entries.
   - Recommendation: This is acceptable for Phase 5. Debouncing property edits is a Phase 7 polish concern. The 100-step limit prevents memory issues.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0 + jsdom + @testing-library/react 16 |
| Config file | `/root/visualizer/vitest.config.ts` |
| Quick run command | `npx vitest --run` |
| Full suite command | `npx vitest --run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRAPH-01 | Drag-drop from palette creates new node in store | unit | `npx vitest --run src/components/palette/__tests__/NodePalette.test.tsx -t "creates node"` | Wave 0 |
| GRAPH-02 | Palette contains Basic/Decision/Terminal templates | unit | `npx vitest --run src/components/palette/__tests__/NodePalette.test.tsx -t "templates"` | Wave 0 |
| GRAPH-03 | Drawing edge between handles adds edge to store | unit | `npx vitest --run src/store/__tests__/store.test.ts -t "onConnect"` | Wave 0 |
| GRAPH-04 | Delete node shows confirmation dialog | unit | `npx vitest --run src/hooks/__tests__/useNodeDelete.test.ts` | Wave 0 |
| GRAPH-05 | Edge deletion removes edge from store | unit | `npx vitest --run src/store/__tests__/store.test.ts -t "deleteEdge"` | Wave 0 |
| GRAPH-06 | Edge deletion removes connection field from step data | unit | `npx vitest --run src/store/__tests__/store.test.ts -t "sync edge delete"` | Wave 0 |
| GRAPH-07 | New edge adds connection field to step data | unit | `npx vitest --run src/store/__tests__/store.test.ts -t "sync edge create"` | Wave 0 |
| UNDO-01 | Ctrl+Z undoes last action | unit | `npx vitest --run src/hooks/__tests__/useUndoRedo.test.ts -t "undo"` | Wave 0 |
| UNDO-02 | Ctrl+Shift+Z redoes | unit | `npx vitest --run src/hooks/__tests__/useUndoRedo.test.ts -t "redo"` | Wave 0 |
| UNDO-03 | Drag is one undo step (pause/resume) | unit | `npx vitest --run src/store/__tests__/store.test.ts -t "drag undo"` | Wave 0 |
| UI-03 | Delete/Backspace removes selected node | unit | `npx vitest --run src/hooks/__tests__/useNodeDelete.test.ts -t "keyboard"` | Wave 0 |
| UI-04 | Keyboard shortcuts Ctrl+Z / Ctrl+Shift+Z | unit | `npx vitest --run src/hooks/__tests__/useUndoRedo.test.ts -t "keyboard"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest --run` (all 167+ tests in ~1.5s)
- **Per wave merge:** `npx vitest --run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/palette/__tests__/NodePalette.test.tsx` -- covers GRAPH-01, GRAPH-02
- [ ] `src/hooks/__tests__/useUndoRedo.test.ts` -- covers UNDO-01, UNDO-02, UI-04
- [ ] `src/hooks/__tests__/useNodeDelete.test.ts` -- covers GRAPH-04, UI-03
- [ ] `src/store/__tests__/store.test.ts` -- extend existing file for GRAPH-03, GRAPH-05, GRAPH-06, GRAPH-07, UNDO-03
- [ ] `src/components/ui/alert-dialog.tsx` -- shadcn AlertDialog component install

## Sources

### Primary (HIGH confidence)
- React Flow official drag-and-drop example: https://reactflow.dev/examples/interaction/drag-and-drop -- DnD pattern with pointer events and screenToFlowPosition
- React Flow API reference (ReactFlow component): https://reactflow.dev/api-reference/react-flow -- onBeforeDelete, deleteKeyCode, onDelete, onEdgesDelete, onNodesDelete props
- React Flow Connection type: https://reactflow.dev/api-reference/types/connection -- source, target, sourceHandle, targetHandle fields
- React Flow NodeChange type: https://reactflow.dev/api-reference/types/node-change -- NodePositionChange with dragging boolean
- Zundo GitHub README: https://github.com/charkour/zundo -- temporal middleware API, pause/resume, handleSet, partialize, limit
- Zundo DeepWiki: https://deepwiki.com/charkour/zundo -- handleSet throttle example, temporal store API (undo, redo, clear, pause, resume)
- shadcn AlertDialog: https://ui.shadcn.com/docs/components/radix/alert-dialog -- component API and usage

### Secondary (MEDIUM confidence)
- React Flow + Zundo undo/redo DeepWiki: https://deepwiki.com/youngjuning/reactflow-cn.js.org/4.1-undoredo-functionality -- pause/resume pattern for drag, keyboard shortcut wiring
- React Flow onBeforeDelete: https://reactflow.dev/api-reference/types/on-before-delete -- async confirmation pattern
- React Flow addEdge utility: https://reactflow.dev/api-reference/utils/add-edge -- duplicate prevention, minimal edge creation

### Tertiary (LOW confidence)
- None. All findings verified with primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and configured; only need shadcn AlertDialog component
- Architecture: HIGH - existing store patterns (slices, partialize, updateNodeData) directly extend for this phase
- Pitfalls: HIGH - verified against React Flow official docs and Zundo source; edge sync issues confirmed by reading flowToJson.ts
- DnD pattern: HIGH - React Flow's official example provides complete working code
- Undo/redo: HIGH - Zundo's pause/resume API confirmed in DeepWiki docs with code examples

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable ecosystem, no major releases expected)
