# Architecture Research

**Domain:** Visual flow editor / node graph editor for JSON call flow scripts
**Researched:** 2026-03-12
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
+------------------------------------------------------------------+
|                        UI Shell (App.tsx)                         |
|  +-------------------+  +--------------------+  +-------------+  |
|  | Sidebar Palette   |  |   React Flow       |  |  Property   |  |
|  | (Node Templates)  |  |   Canvas           |  |  Panel      |  |
|  |                   |  |  +---------+        |  | (Edit Node) |  |
|  | [Basic Step]      |  |  | Custom  |        |  |             |  |
|  | [Decision Step]   |  |  | Nodes   |------->|  | Structured  |  |
|  | [Terminal Step]   |  |  +---------+        |  | Fields      |  |
|  |                   |  |  +---------+        |  |             |  |
|  |                   |  |  | Styled  |        |  | JSON Editor |  |
|  |                   |  |  | Edges   |        |  | Fallback    |  |
|  |                   |  |  +---------+        |  |             |  |
|  +-------------------+  +--------------------+  +-------------+  |
|                                                                  |
|  +-----------------------------+  +----------------------------+ |
|  | Toolbar                     |  | JSON Preview Panel         | |
|  | (Layout, Undo, Export, etc) |  | (Live read-only view)      | |
|  +-----------------------------+  +----------------------------+ |
+------------------------------------------------------------------+
         |                    |                    |
         v                    v                    v
+------------------------------------------------------------------+
|                     Zustand Store (+ Zundo)                      |
|  +-------------+  +-------------+  +---------------------------+ |
|  | Flow Slice  |  | UI Slice    |  | JSON Slice                | |
|  | nodes[]     |  | selectedId  |  | originalJson              | |
|  | edges[]     |  | panelOpen   |  | stepKeyMap                | |
|  | onNodes...  |  | layoutDir   |  | unknownFields             | |
|  | onEdges...  |  | darkMode    |  | importJson()              | |
|  | onConnect   |  |             |  | exportJson()              | |
|  +-------------+  +-------------+  +---------------------------+ |
+------------------------------------------------------------------+
         |                                         |
         v                                         v
+----------------------------+   +----------------------------------+
| Layout Engine              |   | JSON Transform Layer             |
| (dagre)                    |   | callFlowToReactFlow()            |
| getLayoutedElements()      |   | reactFlowToCallFlow()            |
| TB / LR direction          |   | preserveUnknownFields()          |
+----------------------------+   +----------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| App Shell | Layout orchestration, panel sizing, theme provider | Top-level component with resizable panel layout via shadcn ResizablePanelGroup |
| React Flow Canvas | Node rendering, edge rendering, viewport controls, drag/drop, selection | `<ReactFlow>` component with custom nodeTypes/edgeTypes, minimap, controls |
| Custom Nodes | Render step data, expose dynamic handles, display badges | React.memo components with `<Handle>` per connection type |
| Styled Edges | Render connections with distinct styles per type | Custom edge components: solid (next), labeled (conditions), dashed (timeout), dotted (intent) |
| Sidebar Palette | Provide draggable node templates for new step creation | List of template cards with onDragStart setting transferData |
| Property Panel | Edit selected node's structured fields, connection dropdowns, JSON fallback | Conditional render based on selectedNodeId from store |
| Toolbar | Layout toggle, undo/redo, import/export, fit view, zoom | shadcn Button/ToggleGroup triggering store actions |
| JSON Preview | Live read-only view of current flow as JSON | Memoized JSON.stringify of exportJson() output |
| Zustand Store | Central state: nodes, edges, UI state, JSON data, undo history | Single store with slices pattern, Zundo temporal middleware |
| JSON Transform Layer | Convert between call flow JSON and React Flow format | Pure functions: parse JSON steps into nodes/edges, serialize back |
| Layout Engine | Auto-arrange nodes in DAG layout | dagre wrapper with configurable direction (TB/LR) |

## Recommended Project Structure

```
src/
+-- components/              # React components
|   +-- canvas/              # React Flow canvas wrapper
|   |   +-- FlowCanvas.tsx   # Main ReactFlow component with props from store
|   |   +-- Minimap.tsx      # Minimap configuration
|   |   +-- Controls.tsx     # Zoom/fit-view controls
|   +-- nodes/               # Custom node types
|   |   +-- StepNode.tsx     # Generic step node (memoized)
|   |   +-- DecisionNode.tsx # Decision/branching node
|   |   +-- TerminalNode.tsx # Terminal/end node
|   |   +-- nodeTypes.ts     # nodeTypes registry object
|   +-- edges/               # Custom edge types
|   |   +-- ConditionalEdge.tsx  # Labeled edge for conditions
|   |   +-- TimeoutEdge.tsx      # Dashed edge for timeouts
|   |   +-- IntentEdge.tsx       # Dotted edge for intent routes
|   |   +-- edgeTypes.ts         # edgeTypes registry object
|   +-- panels/              # Side panels and overlays
|   |   +-- PropertyPanel.tsx    # Node property editor
|   |   +-- StructuredFields.tsx # Known-field form inputs
|   |   +-- JsonEditorPanel.tsx  # json-edit-react fallback
|   |   +-- JsonPreview.tsx      # Read-only JSON preview
|   |   +-- SidebarPalette.tsx   # Drag-and-drop node templates
|   +-- toolbar/             # Top toolbar actions
|   |   +-- Toolbar.tsx      # Layout, undo, redo, import, export
|   +-- ui/                  # shadcn/ui primitives (generated)
|       +-- button.tsx
|       +-- ...
+-- store/                   # Zustand state management
|   +-- index.ts             # Combined store creation with Zundo
|   +-- flowSlice.ts         # Nodes, edges, React Flow handlers
|   +-- uiSlice.ts           # Selected node, panel state, layout direction
|   +-- jsonSlice.ts         # Original JSON, import/export, unknown fields
|   +-- types.ts             # Store type definitions
+-- lib/                     # Pure utility functions (no React)
|   +-- transform/           # JSON <-> React Flow conversion
|   |   +-- importFlow.ts    # Call flow JSON -> nodes[] + edges[]
|   |   +-- exportFlow.ts    # nodes[] + edges[] -> call flow JSON
|   |   +-- fieldMapping.ts  # Step field detection and mapping
|   +-- layout/              # Layout engine
|   |   +-- dagre.ts         # Dagre wrapper: getLayoutedElements()
|   +-- constants.ts         # Node dimensions, colors, edge styles
|   +-- utils.ts             # Shared utility functions
+-- hooks/                   # Custom React hooks
|   +-- useFlowStore.ts      # Typed store selectors with useShallow
|   +-- useKeyboardShortcuts.ts  # Delete, Ctrl+Z, etc.
|   +-- useDragAndDrop.ts    # DnD from palette to canvas
+-- types/                   # TypeScript type definitions
|   +-- callFlow.ts          # Call flow JSON schema types
|   +-- node.ts              # Custom node data types
|   +-- edge.ts              # Custom edge data types
+-- data/                    # Static data
|   +-- defaultFlow.ts       # Medicare call flow for first visit
+-- App.tsx                  # Root: theme, layout, ReactFlowProvider
+-- main.tsx                 # Vite entry point
+-- index.css                # Tailwind CSS + React Flow styles
```

### Structure Rationale

- **components/nodes/ and components/edges/:** Isolated per-type because each node/edge type is a standalone memoized component. The registry files (nodeTypes.ts, edgeTypes.ts) must be defined outside any React component to prevent React Flow from re-mounting nodes on every render.
- **store/ with slices:** Zustand slices pattern keeps the store modular. Flow state (nodes/edges) is separate from UI state (selection, panels) and JSON state (original data, unknown fields). Cross-slice access uses get() within actions.
- **lib/transform/:** The JSON transform layer is pure functions with no React dependency. This is the most critical architectural boundary -- it must be testable in isolation and handle lossless round-trips.
- **hooks/:** Custom hooks wrap store selectors with useShallow to prevent unnecessary re-renders. This is where performance optimization lives.
- **types/:** Separate from store types because call flow types represent the external JSON schema (domain types) while store types represent internal app state.

## Architectural Patterns

### Pattern 1: External Store with Zustand Slices + Zundo

**What:** All application state lives in a single Zustand store, organized into feature slices (flow, UI, JSON). Zundo temporal middleware wraps the store to provide undo/redo via time-travel. Components subscribe to specific slices via useShallow selectors.

**When to use:** Always for React Flow apps beyond trivial demos. React Flow recommends Zustand over useState/useReducer because nodes need to update their own data from within custom node components, which is impossible with prop drilling alone.

**Trade-offs:** Slightly more boilerplate than useState, but eliminates prop drilling, enables undo/redo for free, and prevents the re-render cascades that kill performance.

**Example:**
```typescript
// store/flowSlice.ts
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { StateCreator } from 'zustand';

export interface FlowSlice {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
}

export const createFlowSlice: StateCreator<AppState, [], [], FlowSlice> = (set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) =>
    set({ edges: addEdge(connection, get().edges) }),
});

// store/index.ts
import { create } from 'zustand';
import { temporal } from 'zundo';
import { createFlowSlice } from './flowSlice';
import { createUiSlice } from './uiSlice';
import { createJsonSlice } from './jsonSlice';

export const useAppStore = create<AppState>()(
  temporal(
    (...a) => ({
      ...createFlowSlice(...a),
      ...createUiSlice(...a),
      ...createJsonSlice(...a),
    }),
    {
      // Only track meaningful changes for undo, not drag positions
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);
```

### Pattern 2: JSON Transform Layer (Import/Export Boundary)

**What:** A pair of pure functions that form the boundary between the external call flow JSON format and the internal React Flow representation. `importFlow()` parses JSON steps into nodes[] and edges[], stashing unknown fields for preservation. `exportFlow()` reconstructs the original JSON structure from nodes/edges plus the stashed unknown fields.

**When to use:** Any time you need to load an external data format into React Flow and export it back without data loss.

**Trade-offs:** Adds a layer of indirection, but is absolutely essential for lossless round-tripping. Without it, unknown JSON fields get silently dropped.

**Example:**
```typescript
// lib/transform/importFlow.ts
interface ImportResult {
  nodes: Node[];
  edges: Edge[];
  unknownFields: Record<string, unknown>; // Top-level fields not in steps
  stepUnknownFields: Record<string, Record<string, unknown>>; // Per-step extras
}

export function importFlow(json: Record<string, unknown>): ImportResult {
  const stepsKey = detectStepsContainer(json); // finds "steps" or similar
  const steps = json[stepsKey] as Record<string, StepData>;

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const stepUnknownFields: Record<string, Record<string, unknown>> = {};

  for (const [stepId, step] of Object.entries(steps)) {
    // Extract known visual fields, stash the rest
    const { next, conditions, timeout_next, no_match_next,
            intent_detector_routes, ...visualFields } = step;
    const { description, text, audio_file, ...unknownStepFields } = visualFields;

    stepUnknownFields[stepId] = unknownStepFields;

    nodes.push({
      id: stepId,
      type: classifyNodeType(step), // 'step' | 'decision' | 'terminal'
      position: { x: 0, y: 0 }, // dagre will position
      data: { stepId, ...step },
    });

    // Create edges for each connection type
    if (next) edges.push({ id: `${stepId}->next->${next}`, source: stepId,
                            target: next, sourceHandle: 'next', type: 'default' });
    // ... conditions, timeout, intent routes similarly
  }

  // Stash top-level unknown fields
  const { [stepsKey]: _, ...unknownFields } = json;

  return { nodes, edges, unknownFields, stepUnknownFields };
}
```

### Pattern 3: Memoized Custom Nodes with Dynamic Handles

**What:** Each custom node type is a React.memo component that renders labeled handles based on its data. Handles are generated dynamically from the step's connection fields (one handle for "next", one per condition, one for timeout, etc.). When handle count changes, useUpdateNodeInternals is called.

**When to use:** For any node that has a variable number of output connections based on its data.

**Trade-offs:** Dynamic handles require careful management of useUpdateNodeInternals to keep React Flow's internal handle position cache in sync. Worth the complexity because it gives visual clarity about which handle carries which connection.

**Example:**
```typescript
// components/nodes/StepNode.tsx
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

const StepNode = memo(({ data, id }: NodeProps) => {
  const handles = buildHandles(data); // derive from step connections

  return (
    <div className={cn('rounded-lg border-2 p-3 shadow-md', colorByRole(data))}>
      <div className="font-medium text-sm">{data.stepId}</div>
      {data.description && <div className="text-xs text-muted-foreground">{data.description}</div>}
      <div className="flex gap-1 mt-1">
        {data.wait_for_response && <Badge>wait</Badge>}
        {data.disposition && <Badge>disposition</Badge>}
      </div>

      {/* Single target handle at top */}
      <Handle type="target" position={Position.Top} />

      {/* Dynamic source handles at bottom, one per connection */}
      {handles.map((h) => (
        <Handle
          key={h.id}
          id={h.id}
          type="source"
          position={Position.Bottom}
          style={{ left: h.offsetPercent + '%' }}
        />
      ))}
    </div>
  );
});
```

### Pattern 4: Resizable Panel Layout Shell

**What:** The app shell uses shadcn's ResizablePanelGroup to create a three-column layout: sidebar palette (collapsible), main canvas, and property panel (conditional). Panels resize via drag handles.

**When to use:** Any editor app where users need a persistent canvas with optional side panels that can be resized or collapsed.

**Trade-offs:** More complex than fixed widths, but gives users control over their workspace. shadcn's ResizablePanelGroup handles the resize math.

## Data Flow

### Import Flow (JSON -> Canvas)

```
User drops JSON file
    |
    v
FileReader reads text
    |
    v
JSON.parse() -> raw object
    |
    v
importFlow(rawJson) [lib/transform/importFlow.ts]
    |
    +---> nodes[]  ----\
    +---> edges[]  -----+---> store.setImportedFlow()
    +---> unknownFields -/        |
    +---> stepUnknownFields --/   v
                            Zustand Store updates
                                  |
                                  v
                        getLayoutedElements(nodes, edges, direction) [lib/layout/dagre.ts]
                                  |
                                  v
                        store.setNodes(layoutedNodes)
                                  |
                                  v
                        ReactFlow re-renders canvas
```

### Edit Flow (User Interaction -> State -> Canvas)

```
User clicks node on canvas
    |
    v
ReactFlow onNodeClick -> store.setSelectedNodeId(id)
    |
    v
Property Panel renders (subscribed to selectedNodeId)
    |
    v
User edits field in Property Panel
    |
    v
store.updateNodeData(nodeId, fieldPath, value)
    |
    +---> Updates node.data in nodes[]
    +---> Zundo records snapshot for undo
    |
    v
ReactFlow re-renders affected node (React.memo + shallow compare)
JSON Preview re-renders (memoized export)
```

### Export Flow (Canvas -> JSON)

```
User clicks Export button
    |
    v
store.exportJson() calls exportFlow(nodes, edges, unknownFields, stepUnknownFields)
    |
    v
exportFlow() [lib/transform/exportFlow.ts]
    |
    +---> Iterates nodes, rebuilds step objects
    +---> Iterates edges, reconstructs next/conditions/timeout/intent references
    +---> Merges back unknownFields (top-level) and stepUnknownFields (per-step)
    +---> Returns complete JSON matching original structure
    |
    v
JSON.stringify(result, null, 2)
    |
    v
Blob + URL.createObjectURL + download link click
```

### Undo/Redo Flow

```
User presses Ctrl+Z
    |
    v
useKeyboardShortcuts hook fires
    |
    v
useAppStore.temporal.getState().undo()
    |
    v
Zundo restores previous { nodes, edges } snapshot
    |
    v
ReactFlow re-renders, Property Panel updates if selected node changed
```

### State Management Architecture

```
+----------------------------------------------------+
|              Zustand Store (single)                 |
|                                                     |
|  flowSlice:                                         |
|    nodes: Node[]                                    |
|    edges: Edge[]                                    |
|    onNodesChange()  (applyNodeChanges)              |
|    onEdgesChange()  (applyEdgeChanges)              |
|    onConnect()      (addEdge)                       |
|    addNode()                                        |
|    deleteNode()                                     |
|    updateNodeData()                                 |
|                                                     |
|  uiSlice:                                           |
|    selectedNodeId: string | null                    |
|    sidebarOpen: boolean                             |
|    propertyPanelOpen: boolean                       |
|    layoutDirection: 'TB' | 'LR'                     |
|    darkMode: boolean                                |
|    setSelectedNodeId()                              |
|    toggleLayoutDirection()                          |
|    toggleDarkMode()                                 |
|                                                     |
|  jsonSlice:                                         |
|    originalJson: Record<string, unknown> | null     |
|    stepsKey: string                                 |
|    unknownFields: Record<string, unknown>           |
|    stepUnknownFields: Record<string, Record<...>>   |
|    importJson(file: File)                           |
|    exportJson(): Record<string, unknown>            |
|                                                     |
|  +--- Zundo temporal middleware ----+               |
|  |  pastStates[]                    |               |
|  |  futureStates[]                  |               |
|  |  undo() / redo()                 |               |
|  |  partialize: { nodes, edges }    |               |
|  +----------------------------------+               |
+----------------------------------------------------+
         |
         | useShallow selectors
         v
+----------------------------------------------------+
|              React Component Tree                   |
|                                                     |
|  App                                                |
|   +-- ReactFlowProvider                             |
|       +-- ResizablePanelGroup                       |
|           +-- SidebarPalette  (reads: nothing)      |
|           +-- FlowCanvas      (reads: nodes, edges) |
|           |   +-- StepNode    (reads: node.data)    |
|           |   +-- DecisionNode                      |
|           |   +-- TerminalNode                      |
|           |   +-- CustomEdges                       |
|           +-- PropertyPanel   (reads: selectedNode) |
|           +-- Toolbar         (reads: ui state)     |
|           +-- JsonPreview     (reads: nodes, edges) |
+----------------------------------------------------+
```

### Key Data Flows

1. **Import:** File -> JSON.parse -> importFlow() -> store.setImportedFlow() -> dagre layout -> canvas renders. The transform layer is the critical boundary that must preserve all fields.
2. **Edit:** User interaction -> store action -> state update -> Zundo snapshot -> affected components re-render via shallow selectors.
3. **Export:** store.exportFlow() -> reconstruct JSON with original structure + unknown fields -> download file. Must produce valid JSON matching the original schema.
4. **Undo/Redo:** Keyboard shortcut -> Zundo temporal undo/redo -> restores previous nodes/edges snapshot -> canvas re-renders.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 1-20 nodes | No optimization needed. Default React Flow handles this fine. |
| 20-50 nodes | Memoize custom nodes with React.memo. Use useShallow selectors in store hooks. Memoize nodeTypes/edgeTypes objects outside components. |
| 50-100 nodes | Consider virtualization (React Flow handles this natively for off-screen nodes). Debounce JSON preview updates. Use partialize in Zundo to avoid storing position-only changes during drag. |
| 100+ nodes | Unlikely for call flows, but if needed: batch state updates, consider web workers for dagre layout calculation, lazy-load the JSON preview panel. |

### Scaling Priorities

1. **First bottleneck: Custom node re-renders during drag.** Every node position change triggers onNodesChange, which updates the nodes array. Without React.memo on custom nodes and useShallow selectors, ALL nodes re-render on every frame during a drag. Fix: React.memo + useShallow + stable nodeTypes reference.
2. **Second bottleneck: Dagre layout on large graphs.** Dagre is synchronous and blocks the main thread. For 50+ nodes, wrap in requestAnimationFrame or setTimeout to avoid UI freeze. Not likely a problem for typical call flows.

## Anti-Patterns

### Anti-Pattern 1: Defining nodeTypes Inside a Component

**What people do:** Declare `const nodeTypes = { step: StepNode }` inside a React component function.
**Why it's wrong:** Creates a new object reference every render, causing React Flow to unmount and remount ALL custom nodes on every render cycle. Destroys performance and causes visible flickering.
**Do this instead:** Define nodeTypes in a separate file (nodeTypes.ts) or at module scope outside any component. Import it as a stable reference.

### Anti-Pattern 2: Storing React Flow State in useState

**What people do:** Use `const [nodes, setNodes] = useState([])` and pass setNodes through data props to custom nodes.
**Why it's wrong:** Custom nodes cannot call setNodes without prop drilling through the data field. As complexity grows, this becomes unmanageable. Also prevents undo/redo integration.
**Do this instead:** Use Zustand store from the beginning. Custom nodes access the store directly via hooks. React Flow officially recommends this approach.

### Anti-Pattern 3: Mutating Node Data Directly

**What people do:** `node.data.description = "new value"` and expect React Flow to re-render.
**Why it's wrong:** React Flow uses reference equality to detect changes. Mutating in place means the reference hasn't changed, so nothing re-renders.
**Do this instead:** Create a new data object: `set({ nodes: nodes.map(n => n.id === id ? { ...n, data: { ...n.data, description: "new value" } } : n) })`.

### Anti-Pattern 4: Recording Every Position Change in Undo History

**What people do:** Let Zundo track all state changes including every pixel of node dragging.
**Why it's wrong:** Dragging a node 100 pixels creates 60+ undo states. User presses Ctrl+Z and the node barely moves.
**Do this instead:** Use Zundo's `partialize` option and/or `handleSet` with throttling. Only record position snapshots on drag-end (onNodeDragStop), not during drag.

### Anti-Pattern 5: Lossy JSON Round-Trip

**What people do:** Only store fields they know about (description, next, conditions) in node.data, discarding everything else during import.
**Why it's wrong:** Export produces JSON missing voice_settings, max_clarification_retries, and other fields the editor doesn't visualize. Data loss is unacceptable for a production tool.
**Do this instead:** Stash ALL unknown fields in a parallel structure (stepUnknownFields) during import. Merge them back during export. The transform layer is the guardian of data integrity.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| JSON Transform <-> Store | Pure function calls. importFlow() returns data, store sets it. exportFlow() reads store state. | Transform layer has ZERO React dependencies. Fully testable with plain objects. |
| Store <-> React Flow Canvas | Store provides nodes/edges/handlers via useShallow selectors. ReactFlow calls onNodesChange/onEdgesChange/onConnect. | ReactFlow is a controlled component; store is the single source of truth. |
| Store <-> Property Panel | Panel reads selectedNodeId + node data. Panel calls store.updateNodeData(). | Panel never modifies nodes directly. Always goes through store action. |
| Store <-> Zundo Temporal | Zundo wraps store creation. Temporal state accessed via useAppStore.temporal.getState(). | partialize controls what gets tracked. Only nodes/edges, not UI state. |
| Dagre Layout <-> Store | Store action calls getLayoutedElements() then sets nodes with new positions. | Dagre is a pure function: nodes/edges in, positioned nodes out. |
| Sidebar Palette <-> Canvas | HTML5 Drag and Drop. Palette sets dataTransfer with node template type. Canvas onDrop reads it and calls store.addNode(). | No direct component communication. DnD events are the interface. |

### Build Order (Dependency Chain)

This ordering reflects hard dependencies between components. Later phases depend on earlier ones.

```
Phase 1: Foundation (no dependencies)
  +-- TypeScript types (callFlow.ts, node.ts, edge.ts)
  +-- Zustand store skeleton (slices with minimal actions)
  +-- Vite + Tailwind + shadcn/ui setup
  +-- Constants (node dimensions, colors)

Phase 2: Transform Layer (depends on: types)
  +-- importFlow() - JSON -> nodes/edges
  +-- exportFlow() - nodes/edges -> JSON
  +-- Unit tests for round-trip fidelity

Phase 3: Canvas + Basic Nodes (depends on: store, types)
  +-- FlowCanvas component with ReactFlow
  +-- Basic StepNode (single type, static handles)
  +-- Default edge rendering
  +-- Minimap, controls, viewport

Phase 4: Layout Engine (depends on: canvas, nodes)
  +-- dagre wrapper function
  +-- Layout direction toggle (TB/LR)
  +-- Re-layout on demand

Phase 5: Import + Wiring (depends on: transform, canvas, layout)
  +-- File picker import
  +-- Wire importFlow -> store -> dagre -> canvas
  +-- Default flow on first visit

Phase 6: Property Panel (depends on: store, canvas)
  +-- Selected node detection
  +-- Structured field editors
  +-- json-edit-react fallback
  +-- Connection editing dropdowns

Phase 7: Advanced Nodes + Edges (depends on: property panel, canvas)
  +-- Decision nodes with dynamic condition handles
  +-- Terminal nodes
  +-- Styled edges (conditional, timeout, intent)
  +-- Node color-coding and badges

Phase 8: Editing Operations (depends on: store, canvas)
  +-- Add node from palette (drag-and-drop)
  +-- Delete node/edge with confirmation
  +-- Draw new edges between handles
  +-- Undo/redo (Zundo integration)
  +-- Keyboard shortcuts

Phase 9: Export + Polish (depends on: transform, editing)
  +-- Export JSON with lossless round-trip
  +-- JSON preview panel
  +-- Dark mode
  +-- Responsive/collapsible panels
```

## Sources

- [React Flow - State Management with Zustand](https://reactflow.dev/learn/advanced-use/state-management) - Official guide on Zustand integration
- [React Flow - Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes) - Custom node patterns and Handle usage
- [React Flow - Handles](https://reactflow.dev/learn/customization/handles) - Multiple handles, dynamic handles
- [React Flow - Performance](https://reactflow.dev/learn/advanced-use/performance) - Memoization, useShallow, re-render prevention
- [React Flow - Dagre Tree Example](https://reactflow.dev/examples/layout/dagre) - Dagre layout integration
- [React Flow - Undo and Redo Example](https://reactflow.dev/examples/interaction/undo-redo) - Zundo integration pattern
- [React Flow - Save and Restore](https://reactflow.dev/examples/interaction/save-and-restore) - JSON serialization
- [React Flow - Workflow Editor Template](https://reactflow.dev/ui/templates/workflow-editor) - Reference architecture
- [React Flow - useUpdateNodeInternals](https://reactflow.dev/api-reference/hooks/use-update-node-internals) - Dynamic handle updates
- [Zundo GitHub](https://github.com/charkour/zundo) - Temporal middleware for undo/redo
- [Zustand Slices Pattern Discussion](https://github.com/pmndrs/zustand/discussions/2496) - Slice composition best practices
- [json-edit-react GitHub](https://github.com/CarlosNZ/json-edit-react) - Inline JSON editor component
- [Synergy Codes - State Management in React Flow](https://www.synergycodes.com/blog/state-management-in-react-flow) - Performance patterns
- [React Flow UI Components updated to React 19 and Tailwind CSS 4](https://reactflow.dev/whats-new/2025-10-28) - shadcn/ui + Tailwind v4 compatibility

---
*Architecture research for: Flow Editor / Visual Workflow Builder*
*Researched: 2026-03-12*
