# Phase 3: Canvas Rendering & Layout - Research

**Researched:** 2026-03-12
**Domain:** React Flow custom nodes, custom edges, dagre auto-layout
**Confidence:** HIGH

## Summary

Phase 3 transforms the basic React Flow canvas (currently rendering default node rectangles in a grid layout) into a polished, color-coded node graph with labeled edges, auto-layout, and navigation controls. The work spans three plans: a custom StepNode component (03-01), a custom ConditionalEdge component (03-02), and dagre auto-layout integration with controls (03-03).

The existing codebase already has @xyflow/react 12.10.1 installed with ReactFlowProvider, FlowCanvas, Background, Controls, and MiniMap components wired up. The edge extractor already assigns `sourceHandle` IDs and `data.edgeType` to every edge, and full step data lives in `node.data.step`. This means the custom components can read all the data they need directly from props -- no store changes are required for rendering.

**Primary recommendation:** Build custom node and edge components as pure presentational React components that derive all visual state (colors, badges, handle layout, edge styles) from the existing node.data and edge.data structures. Install @dagrejs/dagre 2.0.4 and create a `getLayoutedElements` utility that replaces the current grid layout in jsonToFlow.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| NAV-01 | Steps render as draggable nodes on pannable, zoomable canvas | ReactFlow already provides this; custom StepNode inherits drag/pan/zoom behavior |
| NAV-02 | Canvas fills full viewport height with React Flow container | Already implemented in App.tsx flex layout; no changes needed |
| NAV-03 | Minimap shows overview of full graph | MiniMap already rendered in FlowCanvas; add nodeColor function for color-coded mini nodes |
| NAV-04 | Controls for zoom in, zoom out, fit-to-view | Controls already rendered in FlowCanvas; built-in buttons work |
| NAV-05 | Auto-layout via dagre positions nodes in readable tree structure | Install @dagrejs/dagre; create getLayoutedElements function; call on import and on-demand |
| NAV-06 | Layout direction toggle between TB and LR | getLayoutedElements accepts direction param; add store field + toolbar button |
| NODE-01 | Each node shows step key/name as header | StepNode reads node.id (step key) and node.data.step.description |
| NODE-02 | Each node shows step description | StepNode renders node.data.step.description in body area |
| NODE-03 | Nodes color-coded by role (green=start, red=terminal, orange=error, blue=normal) | Derive role from step data: first node=start, action=hangup/transfer=terminal, description contains retry/error=recovery |
| NODE-04 | Info badges for key fields (wait_for_response, disposition, action, criticalstep) | StepNode renders small badge chips from node.data.step fields |
| NODE-05 | Each node has one input handle at top | Single Handle type="target" at Position.Top |
| NODE-06 | Each node has multiple labeled output handles | Dynamic Handles from step's connections: next, conditions[], timeout, no_match, intents |
| NODE-07 | Selected node has visible highlight/glow | Custom node reads `selected` prop; apply ring/glow CSS class when true |
| EDGE-01 | Normal "next" edges render as solid lines | Custom edge checks data.edgeType==="next"; BaseEdge with default solid style |
| EDGE-02 | Condition edges render as solid lines with colored label badges | edgeType==="condition"; solid stroke + EdgeLabelRenderer badge |
| EDGE-03 | Timeout edges render as dashed orange lines | edgeType==="timeout"; strokeDasharray + orange stroke color |
| EDGE-04 | No match/fallback edges render as dashed gray lines | edgeType==="no_match"; strokeDasharray + gray stroke color |
| EDGE-05 | Intent route edges render as dotted red lines | edgeType==="intent"; dotted strokeDasharray + red stroke color |
| EDGE-06 | All edges display their label text | EdgeLabelRenderer with positioned badge div for every edge with a label |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @xyflow/react | 12.10.1 | Node graph canvas, custom nodes/edges, handles | Already installed; React Flow is THE standard for node-based UIs |
| @dagrejs/dagre | 2.0.4 | Directed graph auto-layout (DAG/tree) | React Flow's recommended layout lib for tree/DAG graphs; ships with TypeScript types |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tailwindcss | 4.2.1 | Utility-first CSS for node/edge styling | All component styling |
| lucide-react | 0.577.0 | Icons for badges and controls | Info badges, layout toggle icon |
| zustand | 5.0.11 | State management | Store layoutDirection field for TB/LR toggle |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dagrejs/dagre | elkjs | ELK is more powerful (sub-flows, ports) but 10x larger bundle; dagre is sufficient for flat DAG call flows |
| Custom CSS for edges | SVG markers via markerEnd | Markers add complexity; CSS strokeDasharray + color is simpler and sufficient |

**Installation:**
```bash
npm install @dagrejs/dagre
```

No @types package needed -- @dagrejs/dagre 2.0.4 ships its own TypeScript types at `./dist/dagre.d.ts`.

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    canvas/
      FlowCanvas.tsx          # Updated: pass nodeTypes, edgeTypes, onNodeClick
      StepNode.tsx             # NEW: custom node component
      ConditionalEdge.tsx      # NEW: custom edge component
      nodeTypes.ts             # NEW: nodeTypes registry object (defined OUTSIDE component)
      edgeTypes.ts             # NEW: edgeTypes registry object (defined OUTSIDE component)
  lib/
    layout.ts                  # NEW: getLayoutedElements dagre utility
    nodeClassify.ts            # NEW: classify node role -> color (start/terminal/error/normal)
    jsonToFlow.ts              # MODIFIED: use dagre layout instead of grid
  store/
    flowSlice.ts               # MODIFIED: add layoutDirection, autoLayout action
    types.ts                   # MODIFIED: add layoutDirection to FlowSlice
```

### Pattern 1: Custom Node Type Registration (OUTSIDE component)
**What:** Define nodeTypes and edgeTypes as module-level constants, not inside React components.
**When to use:** Always -- React Flow warns and re-renders the entire graph if these objects change reference.
**Example:**
```typescript
// src/components/canvas/nodeTypes.ts
// Source: https://reactflow.dev/learn/customization/custom-nodes
import { StepNode } from './StepNode';
import type { NodeTypes } from '@xyflow/react';

export const nodeTypes: NodeTypes = {
  step: StepNode,
};
```

```typescript
// src/components/canvas/edgeTypes.ts
import { ConditionalEdge } from './ConditionalEdge';
import type { EdgeTypes } from '@xyflow/react';

export const edgeTypes: EdgeTypes = {
  conditional: ConditionalEdge,
};
```

### Pattern 2: Custom Node with Dynamic Handles
**What:** StepNode renders one target Handle plus N source Handles based on step connections.
**When to use:** Every node -- the number of output handles varies per step.
**Example:**
```typescript
// Source: https://reactflow.dev/api-reference/components/handle
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { Node } from '@xyflow/react';

type StepNodeData = {
  label: string;
  step: Record<string, unknown>;
};
type StepNodeType = Node<StepNodeData, 'step'>;

export function StepNode({ id, data, selected }: NodeProps<StepNodeType>) {
  const step = data.step;
  const handles = buildOutputHandles(step); // derive from step connections

  return (
    <div className={cn('rounded-lg border-2 bg-white shadow-md p-3 min-w-[200px]',
      selected && 'ring-2 ring-blue-500 shadow-blue-200',
      borderColorClass(id, step) // green/red/orange/blue
    )}>
      {/* Target handle - one per node */}
      <Handle type="target" position={Position.Top} id="target" />

      {/* Header: step key */}
      <div className="font-semibold text-sm">{id}</div>
      {/* Description */}
      <div className="text-xs text-muted-foreground">{step.description as string}</div>
      {/* Badges */}
      <div className="flex flex-wrap gap-1 mt-1">
        {step.wait_for_response && <Badge>wait_for_response</Badge>}
        {step.action && <Badge>{step.action as string}</Badge>}
        {/* ... more badges */}
      </div>

      {/* Source handles - one per connection type */}
      {handles.map((h, i) => (
        <Handle
          key={h.id}
          type="source"
          position={Position.Bottom}
          id={h.id}
          style={{ left: `${((i + 1) / (handles.length + 1)) * 100}%` }}
        />
      ))}
    </div>
  );
}
```

### Pattern 3: Custom Edge with Style Variants
**What:** Single ConditionalEdge component that reads edge.data.edgeType to determine style.
**When to use:** All edges -- one component handles all 5 visual variants.
**Example:**
```typescript
// Source: https://reactflow.dev/examples/edges/custom-edges
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

const EDGE_STYLES: Record<string, { stroke: string; strokeDasharray?: string }> = {
  next:     { stroke: '#64748b' },                        // solid slate
  condition:{ stroke: '#3b82f6' },                        // solid blue
  timeout:  { stroke: '#f97316', strokeDasharray: '8,4' },// dashed orange
  no_match: { stroke: '#9ca3af', strokeDasharray: '8,4' },// dashed gray
  intent:   { stroke: '#ef4444', strokeDasharray: '3,3' },// dotted red
};

export function ConditionalEdge(props: EdgeProps) {
  const { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
          data, label, markerEnd, id } = props;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
  });

  const edgeType = (data?.edgeType as string) || 'next';
  const style = EDGE_STYLES[edgeType] || EDGE_STYLES.next;

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            }}
            className="nodrag nopan bg-white border rounded px-1.5 py-0.5 text-xs shadow-sm"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
```

### Pattern 4: Dagre Layout Utility
**What:** Pure function that takes nodes+edges+direction, returns repositioned nodes.
**When to use:** On import, on layout direction change, and from toolbar "Auto Layout" button.
**Example:**
```typescript
// Source: https://reactflow.dev/examples/layout/dagre
import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 250;
const NODE_HEIGHT = 120;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === 'LR';

  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? 'left' : 'top',
      sourcePosition: isHorizontal ? 'right' : 'bottom',
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

### Pattern 5: Node Role Classification
**What:** Determine node color based on step data, not manual tagging.
**When to use:** StepNode border color and MiniMap nodeColor.
**Example:**
```typescript
export type NodeRole = 'start' | 'terminal' | 'error' | 'normal';

export function classifyNodeRole(
  nodeId: string,
  step: Record<string, unknown>,
  isFirstNode: boolean
): NodeRole {
  if (isFirstNode) return 'start';
  // Terminal: has action=hangup or action=transfer, no outgoing next/conditions
  const action = step.action as string | undefined;
  if (action === 'hangup' || action === 'transfer') return 'terminal';
  // Error/recovery: description contains retry/error/timeout patterns
  const desc = ((step.description as string) || '').toLowerCase();
  if (desc.includes('retry') || desc.includes('error') || desc.includes('recovery'))
    return 'error';
  return 'normal';
}

export const ROLE_COLORS: Record<NodeRole, { border: string; bg: string; minimap: string }> = {
  start:    { border: 'border-green-500',  bg: 'bg-green-50',  minimap: '#22c55e' },
  terminal: { border: 'border-red-500',    bg: 'bg-red-50',    minimap: '#ef4444' },
  error:    { border: 'border-orange-500', bg: 'bg-orange-50', minimap: '#f97316' },
  normal:   { border: 'border-blue-500',   bg: 'bg-blue-50',   minimap: '#3b82f6' },
};
```

### Anti-Patterns to Avoid
- **Defining nodeTypes/edgeTypes inside a component:** Causes React Flow to re-mount ALL nodes/edges on every render. Always define at module level or wrap in useMemo with empty deps.
- **Mutating node.data directly:** React Flow nodes are immutable. Use store actions (setNodes) to update.
- **Using node.data.label for display when step has richer data:** The existing label is fine for default nodes but StepNode should read step.description, step.action, etc. directly from node.data.step.
- **Calling dagre layout on every render:** Layout is expensive. Call only on import, direction change, or explicit "Auto Layout" click. Store the result in Zustand.
- **Mixing Handle position with layout direction:** When direction changes from TB to LR, source/target positions must flip. The dagre utility handles this by setting sourcePosition/targetPosition on nodes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Graph auto-layout | Manual x/y positioning algorithm | @dagrejs/dagre | Dagre handles rank assignment, edge routing, crossing minimization -- hundreds of edge cases |
| Edge path rendering | Manual SVG path calculations | getSmoothStepPath / getBezierPath | React Flow's path utils handle all quadrant combinations, label positioning, and offsets |
| Edge label positioning | Manual midpoint math | EdgeLabelRenderer + labelX/labelY | Path utilities compute the exact center; the renderer portals content above the SVG layer |
| Node selection state | Custom onClick + state tracking | React Flow's built-in selected prop | React Flow manages selection, multi-select, and deselection internally |
| Zoom/pan/fit controls | Custom scroll/drag handlers | Controls component + fitView | Built-in Controls provides zoom in/out/fit buttons with proper viewport math |
| Minimap overview | Canvas thumbnail rendering | MiniMap component with nodeColor | Built-in MiniMap syncs viewport automatically |

**Key insight:** React Flow provides the entire interaction layer (drag, select, pan, zoom, connect). Custom nodes and edges are purely visual -- they receive props and render JSX. Never re-implement what the framework handles.

## Common Pitfalls

### Pitfall 1: nodeTypes/edgeTypes Object Recreated Each Render
**What goes wrong:** React Flow logs a warning and unmounts/remounts all nodes, causing flicker and lost state.
**Why it happens:** Defining `const nodeTypes = { step: StepNode }` inside a component creates a new object reference each render.
**How to avoid:** Define nodeTypes and edgeTypes as module-level constants in separate files (nodeTypes.ts, edgeTypes.ts).
**Warning signs:** Console warning "It looks like you have created a new nodeTypes or edgeTypes object."

### Pitfall 2: Dagre Position Offset
**What goes wrong:** Nodes appear shifted -- their top-left corner is at the center of where dagre intended them.
**Why it happens:** Dagre computes CENTER positions, but React Flow uses TOP-LEFT origin.
**How to avoid:** Subtract half the node width and height: `x: pos.x - WIDTH/2, y: pos.y - HEIGHT/2`.
**Warning signs:** Nodes overlap or cluster in the top-left quadrant.

### Pitfall 3: Handle IDs Must Match Edge sourceHandle/targetHandle
**What goes wrong:** Edges don't connect to the correct handles or don't render at all.
**Why it happens:** The edge's `sourceHandle` field must exactly match the Handle component's `id` prop.
**How to avoid:** The edge extractor already uses IDs like "next", "condition-0", "timeout", "no_match", "intent-DNC". The StepNode must use these exact same IDs for its Handle components.
**Warning signs:** Edges connect to the wrong handle or snap to the center of the node.

### Pitfall 4: Multiple Handles on Same Position Stack on Top of Each Other
**What goes wrong:** Output handles overlap and are unusable.
**Why it happens:** Multiple Handle components at Position.Bottom all render at the center bottom by default.
**How to avoid:** Set explicit `style={{ left: ... }}` to distribute handles evenly across the bottom edge. Use percentage-based positioning: `left: ((i+1)/(count+1))*100 + '%'`.
**Warning signs:** Only one handle dot visible at the bottom of nodes that should have multiple.

### Pitfall 5: Edge Labels Not Clickable / Not Visible
**What goes wrong:** EdgeLabelRenderer content doesn't respond to clicks or appears behind edges.
**Why it happens:** EdgeLabelRenderer div has `pointer-events: none` by default.
**How to avoid:** Add `pointerEvents: 'all'` to label style and `className="nodrag nopan"` to prevent canvas drag when clicking labels.
**Warning signs:** Labels visible but not interactive, or labels cause unintended canvas panning.

### Pitfall 6: Stale Layout After Direction Change
**What goes wrong:** Toggling TB/LR doesn't update handle positions on nodes.
**Why it happens:** Dagre computes new x/y positions but the node's sourcePosition/targetPosition also need updating.
**How to avoid:** The getLayoutedElements function must set `targetPosition` and `sourcePosition` on each node based on the direction parameter (TB: top/bottom, LR: left/right).
**Warning signs:** Nodes reposition but edges still route from old handle positions.

### Pitfall 7: Node Type Not Set to Custom Type
**What goes wrong:** Nodes render as default rectangles instead of custom StepNode.
**Why it happens:** Existing jsonToFlow sets `type: 'default'`. Must change to `type: 'step'` to use the custom node.
**How to avoid:** Update the stepsToNodes function in jsonToFlow.ts to set `type: 'step'`.
**Warning signs:** All nodes render as plain rectangles with just a text label.

### Pitfall 8: Edge Type Not Set to Custom Type
**What goes wrong:** Edges render as plain default lines without style variants or labels.
**Why it happens:** Existing edge extractor does not set `type` field on edges. Must set `type: 'conditional'`.
**How to avoid:** Update extractEdgesFromStep to add `type: 'conditional'` to every edge.
**Warning signs:** All edges look identical regardless of edgeType.

## Code Examples

### Updating jsonToFlow.ts to Use Custom Types
```typescript
// In stepsToNodes: change type from 'default' to 'step'
return entries.map(([key, step], i) => ({
  id: key,
  type: 'step',  // was 'default'
  position: { x: 0, y: 0 }, // dagre will compute actual positions
  data: {
    label: (step.description as string) || key,
    step: { ...step },
  },
}));
```

### Updating edgeExtractors.ts to Use Custom Edge Type
```typescript
// Add type: 'conditional' to every edge created
edges.push({
  id: `${stepKey}->next->${step.next}`,
  source: stepKey,
  target: step.next,
  type: 'conditional',  // NEW: use custom edge component
  sourceHandle: 'next',
  data: { edgeType: 'next' },
});
```

### Building Output Handles from Step Data
```typescript
interface HandleInfo {
  id: string;
  label: string;
}

function buildOutputHandles(step: Record<string, unknown>): HandleInfo[] {
  const handles: HandleInfo[] = [];

  if (typeof step.next === 'string') {
    handles.push({ id: 'next', label: 'Next' });
  }

  if (Array.isArray(step.conditions)) {
    (step.conditions as Array<Record<string, unknown>>).forEach((cond, i) => {
      if (cond.next) {
        const label = String(cond.condition_description || cond.condition || `Condition ${i+1}`);
        handles.push({ id: `condition-${i}`, label });
      }
    });
  }

  if (typeof step.timeout_next === 'string') {
    handles.push({ id: 'timeout', label: 'Timeout' });
  }

  if (typeof step.no_match_next === 'string') {
    handles.push({ id: 'no_match', label: 'No Match' });
  }

  if (step.intent_detector_routes && typeof step.intent_detector_routes === 'object') {
    for (const name of Object.keys(step.intent_detector_routes as Record<string, string>)) {
      handles.push({ id: `intent-${name}`, label: name });
    }
  }

  return handles;
}
```

### Wiring FlowCanvas with Custom Types
```typescript
// Source: https://reactflow.dev/learn/customization/custom-nodes
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import { nodeTypes } from './nodeTypes';
import { edgeTypes } from './edgeTypes';
import { ROLE_COLORS, classifyNodeRole } from '@/lib/nodeClassify';

export function FlowCanvas() {
  // ... existing store selectors ...

  const miniMapNodeColor = useCallback((node: Node) => {
    const role = classifyNodeRole(node.id, node.data.step, node.id === nodes[0]?.id);
    return ROLE_COLORS[role].minimap;
  }, [nodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={handleNodeClick}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap nodeColor={miniMapNodeColor} pannable zoomable />
    </ReactFlow>
  );
}
```

### Store Extension for Layout
```typescript
// Add to FlowSlice interface:
layoutDirection: 'TB' | 'LR';
setLayoutDirection: (dir: 'TB' | 'LR') => void;
autoLayout: () => void;

// Implementation in flowSlice:
layoutDirection: 'TB',
setLayoutDirection: (dir) => set({ layoutDirection: dir }),
autoLayout: () => {
  const { nodes, edges, layoutDirection } = get();
  const { nodes: layouted } = getLayoutedElements(nodes, edges, layoutDirection);
  set({ nodes: layouted });
},
```

### Integrating Dagre into Import Pipeline
```typescript
// In flowSlice.ts importJson:
importJson: (raw) => {
  const { nodes, edges, metadata } = jsonToFlow(raw);
  const { nodes: layouted } = getLayoutedElements(nodes, edges, get().layoutDirection);
  set({ nodes: layouted, edges, rawJson: raw, metadata });
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `reactflow` package | `@xyflow/react` package | v12 (2024) | New package name, same team. Import from @xyflow/react |
| `dagre` (unmaintained) | `@dagrejs/dagre` 2.0 | 2024 | Scoped package with TS types, maintained fork |
| `useUpdateNodeInternals` for dynamic handles | Handles re-render automatically | @xyflow/react 12.x | No need to manually update internals when handle count changes |
| `position` as string ('top') | `Position` enum (Position.Top) | v12 | Use the Position enum from @xyflow/react |
| EdgeText component for labels | EdgeLabelRenderer for complex labels | v11+ | EdgeLabelRenderer supports full HTML/React; EdgeText is SVG-only |

**Deprecated/outdated:**
- `react-flow-renderer` package: replaced by `@xyflow/react`
- `dagre` (original npm package): unmaintained, use `@dagrejs/dagre`
- `useUpdateNodeInternals`: rarely needed in v12; handles update automatically

## Open Questions

1. **Exact node height for dagre**
   - What we know: Nodes have variable content (different badge counts, handle counts). Dagre needs fixed dimensions.
   - What's unclear: Whether 120px is sufficient for all step types.
   - Recommendation: Use a generous NODE_HEIGHT (e.g., 150px) that accommodates the largest nodes. Can be tuned after visual testing.

2. **First node detection for "start" color**
   - What we know: The sample flow has "greeting" as the first step. Object.keys order in JS follows insertion order.
   - What's unclear: Whether JSON files always have the start step first.
   - Recommendation: Use the first key in the steps object as the start node. This is the simplest heuristic and matches the sample data. Can be refined in later phases if needed.

3. **Handle label text visibility**
   - What we know: Each output handle should show its label (e.g., "Next", "Timeout", condition descriptions).
   - What's unclear: Whether labels should be visible always or on hover only.
   - Recommendation: Show small text labels near each handle always, since this is critical for understanding the flow. Use tiny font (10px) to avoid clutter.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + jsdom + @testing-library/react 16.3.2 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter verbose` |
| Full suite command | `npx vitest run --reporter verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NAV-01 | Nodes render as draggable on canvas | integration | `npx vitest run src/components/canvas/__tests__/FlowCanvas.test.tsx -t "renders nodes"` | No - Wave 0 |
| NAV-02 | Canvas fills viewport | integration | Existing App.test.tsx covers basic rendering | Yes |
| NAV-03 | MiniMap renders with colors | integration | `npx vitest run src/components/canvas/__tests__/FlowCanvas.test.tsx -t "minimap"` | No - Wave 0 |
| NAV-04 | Controls render | integration | Existing App.test.tsx (Controls already rendered) | Yes |
| NAV-05 | Dagre auto-layout positions nodes | unit | `npx vitest run src/lib/__tests__/layout.test.ts` | No - Wave 0 |
| NAV-06 | TB/LR toggle works | unit | `npx vitest run src/lib/__tests__/layout.test.ts -t "direction"` | No - Wave 0 |
| NODE-01 | Node shows step key as header | unit | `npx vitest run src/components/canvas/__tests__/StepNode.test.tsx -t "header"` | No - Wave 0 |
| NODE-02 | Node shows description | unit | `npx vitest run src/components/canvas/__tests__/StepNode.test.tsx -t "description"` | No - Wave 0 |
| NODE-03 | Nodes color-coded by role | unit | `npx vitest run src/lib/__tests__/nodeClassify.test.ts` | No - Wave 0 |
| NODE-04 | Info badges render | unit | `npx vitest run src/components/canvas/__tests__/StepNode.test.tsx -t "badge"` | No - Wave 0 |
| NODE-05 | Input handle at top | unit | `npx vitest run src/components/canvas/__tests__/StepNode.test.tsx -t "target handle"` | No - Wave 0 |
| NODE-06 | Multiple labeled output handles | unit | `npx vitest run src/components/canvas/__tests__/StepNode.test.tsx -t "source handle"` | No - Wave 0 |
| NODE-07 | Selected node highlight | unit | `npx vitest run src/components/canvas/__tests__/StepNode.test.tsx -t "selected"` | No - Wave 0 |
| EDGE-01 | Next edges solid | unit | `npx vitest run src/components/canvas/__tests__/ConditionalEdge.test.tsx -t "next"` | No - Wave 0 |
| EDGE-02 | Condition edges solid+badge | unit | `npx vitest run src/components/canvas/__tests__/ConditionalEdge.test.tsx -t "condition"` | No - Wave 0 |
| EDGE-03 | Timeout edges dashed orange | unit | `npx vitest run src/components/canvas/__tests__/ConditionalEdge.test.tsx -t "timeout"` | No - Wave 0 |
| EDGE-04 | No match edges dashed gray | unit | `npx vitest run src/components/canvas/__tests__/ConditionalEdge.test.tsx -t "no_match"` | No - Wave 0 |
| EDGE-05 | Intent edges dotted red | unit | `npx vitest run src/components/canvas/__tests__/ConditionalEdge.test.tsx -t "intent"` | No - Wave 0 |
| EDGE-06 | Edges display label text | unit | `npx vitest run src/components/canvas/__tests__/ConditionalEdge.test.tsx -t "label"` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter verbose`
- **Per wave merge:** `npx vitest run --reporter verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/layout.test.ts` -- covers NAV-05, NAV-06 (dagre getLayoutedElements)
- [ ] `src/lib/__tests__/nodeClassify.test.ts` -- covers NODE-03 (role classification)
- [ ] `src/components/canvas/__tests__/StepNode.test.tsx` -- covers NODE-01..07 (custom node rendering)
- [ ] `src/components/canvas/__tests__/ConditionalEdge.test.tsx` -- covers EDGE-01..06 (custom edge rendering)
- [ ] `src/components/canvas/__tests__/FlowCanvas.test.tsx` -- covers NAV-01, NAV-03 (integration with canvas)
- [ ] Install @dagrejs/dagre: `npm install @dagrejs/dagre`

Note: Testing custom React Flow components in jsdom has limitations -- React Flow relies on DOM measurement APIs (getBoundingClientRect, ResizeObserver) that jsdom does not implement. Component tests should focus on: (1) rendered DOM structure (handles, badges, labels), (2) className assertions (color classes, selected class), (3) pure function unit tests for layout and classification. SVG path rendering and actual visual positioning are best verified via manual testing or Playwright e2e.

## Sources

### Primary (HIGH confidence)
- [@xyflow/react 12.10.1](https://reactflow.dev) - Custom nodes, custom edges, Handle API, EdgeLabelRenderer, MiniMap, Controls, TypeScript guide, dagre layout example
- [React Flow Custom Nodes](https://reactflow.dev/learn/customization/custom-nodes) - Node component props (id, data, selected, isConnectable), Handle usage, nodeTypes registration
- [React Flow Custom Edges](https://reactflow.dev/examples/edges/custom-edges) - BaseEdge, path utilities, EdgeLabelRenderer, edge style patterns
- [React Flow Dagre Example](https://reactflow.dev/examples/layout/dagre) - getLayoutedElements pattern, direction handling, position offset
- [React Flow Handle API](https://reactflow.dev/api-reference/components/handle) - Handle props, multiple handle IDs, position
- [React Flow EdgeLabelRenderer](https://reactflow.dev/api-reference/components/edge-label-renderer) - Label positioning, pointer events, nodrag/nopan classes
- [React Flow MiniMap API](https://reactflow.dev/api-reference/components/minimap) - nodeColor function, pannable, zoomable props
- [React Flow TypeScript Guide](https://reactflow.dev/learn/advanced-use/typescript) - Node generics, NodeProps typing, use `type` not `interface` for node data
- [React Flow BaseEdge API](https://reactflow.dev/api-reference/components/base-edge) - style prop, SVG attributes, interactionWidth
- [@dagrejs/dagre 2.0.4](https://www.npmjs.com/package/@dagrejs/dagre) - Built-in TypeScript types, graphlib.Graph API, layout options

### Secondary (MEDIUM confidence)
- [React Flow Performance Guide](https://reactflow.dev/learn/advanced-use/performance) - nodeTypes/edgeTypes memo requirement, useShallow pattern
- [React Flow Layouting Overview](https://reactflow.dev/learn/layouting/layouting) - Dagre limitations with sub-flows, node dimension requirements

### Tertiary (LOW confidence)
- None -- all findings verified via official React Flow documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - @xyflow/react 12.10.1 already installed, @dagrejs/dagre 2.0.4 is React Flow's recommended layout library with official example
- Architecture: HIGH - Patterns directly from React Flow official docs and examples, verified API signatures
- Pitfalls: HIGH - Handle ID matching, dagre position offset, nodeTypes recreation are all well-documented in React Flow troubleshooting guide

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable libraries, infrequent breaking changes)
