# Vibe Coding Prompt: JSON Flow Visualizer & Editor

## What I Want Built

A web app that takes any JSON file describing a step-based flow (like a state machine, call script, chatbot flow, etc.) and:

1. **Visualizes it** as a node graph — each step becomes a draggable node, each connection (`next`, `conditions`, `timeout_next`, etc.) becomes an edge
2. **Lets me edit it** — click a node to open a property panel where I can edit any field
3. **Lets me rearrange it** — drag and drop nodes, auto-layout with a button
4. **Imports/Exports JSON** — load a JSON file, make changes, export the modified JSON back out
5. **Supports any JSON structure** — not hardcoded to one schema, but smart enough to detect step-like patterns (objects with `next` fields, `conditions` arrays, etc.)

---

## Tech Stack (USE EXACTLY THESE)

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 14+** (App Router) | Standard React framework, great DX |
| Node Graph | **@xyflow/react** (React Flow v12+) | 35K+ stars, MIT, built for this exact use case. Provides drag-and-drop nodes, edges, zooming, panning, minimap, controls out of the box |
| UI Components | **shadcn/ui** | Beautiful, accessible components. Use for sidebar, forms, dialogs, buttons, tabs, dropdowns |
| Styling | **Tailwind CSS v4** | Required by shadcn/ui |
| State Management | **Zustand** | React Flow's officially recommended state manager. Simple, performant |
| Auto Layout | **@dagrejs/dagre** | Computes optimal node positions for directed graphs. Simple API, widely used with React Flow |
| JSON Property Editing | **json-edit-react** | Drop-in React component for editing/viewing JSON objects inline. Supports edit, add, delete, collapse, drag-n-drop reordering, search/filter, theming. 600 stars, MIT. npm: `json-edit-react` |
| Icons | **lucide-react** | Already bundled with shadcn/ui |

### Install commands:
```bash
npx create-next-app@latest flow-editor --typescript --tailwind --eslint --app --src-dir
cd flow-editor
npx shadcn@latest init
npx shadcn@latest add button card dialog input label tabs select separator scroll-area sheet sidebar tooltip badge
npm install @xyflow/react @dagrejs/dagre zustand json-edit-react lucide-react
```

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main page - full screen flow editor
│   └── globals.css         # Tailwind + React Flow styles
├── components/
│   ├── flow/
│   │   ├── FlowCanvas.tsx       # Main React Flow canvas
│   │   ├── StepNode.tsx         # Custom node component for rendering steps
│   │   ├── ConditionalEdge.tsx  # Custom edge with labels (intent, timeout, etc.)
│   │   └── NodePalette.tsx      # Sidebar to drag new node types onto canvas
│   ├── panels/
│   │   ├── PropertyPanel.tsx    # Right sidebar - edit selected node's JSON properties
│   │   ├── JsonPreview.tsx      # Raw JSON preview/edit panel (uses json-edit-react)
│   │   └── FlowToolbar.tsx      # Top toolbar - import, export, auto-layout, settings
│   └── ui/                     # shadcn/ui components (auto-generated)
├── store/
│   └── flowStore.ts             # Zustand store for nodes, edges, selected node, JSON data
├── lib/
│   ├── jsonToFlow.ts            # Converts arbitrary JSON steps → React Flow nodes & edges
│   ├── flowToJson.ts            # Converts React Flow nodes & edges → JSON back
│   ├── autoLayout.ts            # Dagre layout logic
│   └── utils.ts                 # shadcn cn() util + helpers
└── types/
    └── flow.ts                  # TypeScript types
```

---

## Core Logic: JSON ↔ Flow Conversion

### The Critical Part: `jsonToFlow.ts`

This is the most important file. It must convert any JSON with a `steps` object (or similar) into React Flow nodes and edges.

**The algorithm:**
1. Take the input JSON
2. Find the "steps" container — look for a top-level key whose value is an object-of-objects where children have `next`, `conditions`, or similar linking fields
3. For each step key, create a React Flow node:
   - `id` = the step key (e.g., "hello", "main_pitch", "qualify")
   - `data` = the entire step object (all its properties)
   - `position` = initially {x: 0, y: 0} — will be computed by dagre
   - `type` = "stepNode" (our custom node type)
4. For each step, create edges by scanning for connection fields:
   - `next` field → create a simple edge (label: "next")
   - `conditions` array → for each condition, create an edge to `condition.next` (label: the intent, e.g., "positive", "negative")
   - `timeout_next` → create an edge (label: "timeout", styled differently — dashed)
   - `no_match_next` → create an edge (label: "no match", styled differently)
   - `intent_detector_routes` object → for each key/value, create an edge (label: the key, e.g., "not_interested", "do_not_call")
   - Any other field whose string value matches another step key → create an edge
5. Run dagre auto-layout on the resulting nodes and edges
6. Return `{ nodes, edges }`

### `flowToJson.ts`

The reverse: take the current React Flow nodes/edges and reconstruct the JSON:
1. Build the `steps` object from node data
2. Update `next`, `conditions`, etc. based on edges
3. Preserve all other fields from node data untouched
4. Reconstruct the full JSON with the original top-level fields (name, description, etc.) plus the updated steps

---

## Zustand Store: `flowStore.ts`

```typescript
interface FlowState {
  // Raw JSON
  originalJson: Record<string, any> | null;

  // React Flow state
  nodes: Node[];
  edges: Edge[];

  // UI state
  selectedNodeId: string | null;
  isPanelOpen: boolean;

  // Actions
  setOriginalJson: (json: Record<string, any>) => void;
  loadJson: (json: Record<string, any>) => void; // parses JSON → nodes/edges
  exportJson: () => Record<string, any>; // nodes/edges → JSON

  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  selectNode: (nodeId: string | null) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  addNode: (type: string, position: XYPosition) => void;
  deleteNode: (nodeId: string) => void;

  autoLayout: () => void; // run dagre
}
```

---

## Custom Node Component: `StepNode.tsx`

Each node should render as a card showing:
- **Header**: The step key/name (e.g., "main_pitch") with a colored top border
- **Description**: The step's `description` field
- **Key info badges**: Show important fields as small badges:
  - If `wait_for_response: true` → show a "Waits for response" badge
  - If `disposition` exists → show the disposition code
  - If `action` exists → show the action (e.g., "transfer", "hangup")
  - If `criticalstep: true` → highlight the node
- **Handles (connection points)**:
  - One input handle at the top
  - Multiple output handles at the bottom — one for `next`, and additional labeled ones for each condition/route

Color-code nodes by their role:
- Green border: entry/start nodes (first step, or steps with `greetings: true`)
- Red border: terminal nodes (steps with `action: "hangup"` or no `next`/`conditions`)
- Orange border: error/recovery nodes (steps with "exit" or "max" in the name)
- Blue border: normal flow nodes
- The selected node should have a visible highlight/glow

---

## Custom Edge Component: `ConditionalEdge.tsx`

Edges should be visually distinct based on type:
- **Normal "next"**: Solid line, default color
- **Condition (positive/negative intent)**: Solid line with a colored label badge on the edge
- **Timeout**: Dashed orange line
- **No match / fallback**: Dashed gray line
- **Intent routes (DNC, not interested, obscenity)**: Dotted red line

Each edge should show its label. Use React Flow's `EdgeLabelRenderer` for positioning labels along edges.

---

## Property Panel: `PropertyPanel.tsx`

When a node is selected (clicked), a right sidebar slides open showing:

1. **Node title** (editable) — the step key
2. **Structured fields** at the top for commonly used properties:
   - `description` — text input
   - `text` — textarea (the script text)
   - `audio_file` — text input
   - `wait_for_response` — toggle switch
   - `pause_duration` — number input
   - `timeout` — number input
3. **Connections section** showing all outgoing edges with dropdowns to change targets
4. **Full JSON editor** below using `json-edit-react` for the complete node data — this is the fallback for any fields not covered by structured inputs
5. **Delete node** button at the bottom (with confirmation)

The panel should update the Zustand store in real-time as fields change.

---

## Toolbar: `FlowToolbar.tsx`

A horizontal toolbar at the top with:
- **Import JSON** button — opens file picker for .json files, parses and loads
- **Export JSON** button — serializes current flow back to JSON, triggers download
- **Auto Layout** button — runs dagre to reposition all nodes
- **Layout direction** toggle — TB (top-to-bottom) or LR (left-to-right)
- **Zoom to fit** button
- **Undo/Redo** (if feasible, otherwise skip for v1)
- **JSON Preview** toggle — opens a panel showing the live JSON output

---

## Node Palette / Sidebar: `NodePalette.tsx`

A left sidebar (collapsible) with:
- A list of "template" nodes that can be dragged onto the canvas to create new steps
- Templates: "Basic Step", "Decision Step" (with conditions), "Terminal Step" (with disposition/action)
- Drag-and-drop uses React Flow's built-in drag-and-drop pattern (onDragStart sets transfer data, canvas onDrop creates the node)

---

## Auto Layout: `autoLayout.ts`

Use dagre to compute node positions:

```typescript
import dagre from '@dagrejs/dagre';

export function getLayoutedElements(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  const isHorizontal = direction === 'LR';

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80,    // horizontal spacing between nodes
    ranksep: 120,   // vertical spacing between ranks
    edgesep: 30,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 280, height: 150 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 140,
        y: nodeWithPosition.y - 75,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

---

## Sample Input JSON (for testing)

The app should work with this example JSON structure, but also handle variations:

```json
{
  "name": "example_flow",
  "description": "A sample flow script",
  "steps": {
    "step_a": {
      "description": "First step",
      "text": "Hello, how are you?",
      "wait_for_response": true,
      "next": "step_b",
      "conditions": [
        { "type": "intent", "intent": "positive", "next": "step_c" },
        { "type": "intent", "intent": "negative", "next": "step_d" }
      ],
      "timeout": 5,
      "timeout_next": "step_e"
    },
    "step_b": { "description": "Continue", "text": "...", "next": "step_c" },
    "step_c": { "description": "Success", "action": "transfer", "disposition": "XFER" },
    "step_d": { "description": "Not interested", "action": "hangup", "disposition": "NI" },
    "step_e": { "description": "Timeout recovery", "text": "Are you there?", "next": "step_a" }
  }
}
```

---

## Key Behaviors & UX

1. **On import**: Parse JSON → detect steps → convert to nodes/edges → auto-layout → render
2. **On node click**: Select node, open property panel on the right
3. **On node drag**: Update position in Zustand store (React Flow handles this)
4. **On edge delete**: Remove the corresponding connection field from the step data
5. **On new connection drawn**: Add the appropriate field to the source step's data (e.g., add to `conditions` array or set `next`)
6. **On export**: Convert current nodes/edges back to the original JSON structure, preserving all fields that weren't visually represented
7. **On auto-layout**: Recompute all node positions using dagre without changing any data
8. **Canvas**: Should fill the full viewport height. Dark mode support via shadcn's theme.
9. **Responsive**: Property panel and node palette should be collapsible on smaller screens
10. **Keyboard shortcuts**: Delete/Backspace to remove selected node, Ctrl+Z for undo if implemented

---

## Important Implementation Notes (React Flow v12 Specifics)

### Basics
- **React Flow requires a parent container with explicit width and height** — use `h-screen w-full` or similar
- **Import React Flow's CSS**: `import '@xyflow/react/dist/style.css'`
- **The `nodeTypes` and `edgeTypes` objects must be stable** — define them outside the component to avoid infinite re-renders:
  ```tsx
  const nodeTypes = { stepNode: StepNode };
  const edgeTypes = { conditional: ConditionalEdge };
  // then: <ReactFlow nodeTypes={nodeTypes} edgeTypes={edgeTypes} ... />
  ```
- **Custom nodes must be wrapped in `React.memo`** to avoid re-render issues

### Interactive Elements Inside Custom Nodes
- Use `className="nodrag"` on inputs, textareas, selects INSIDE custom nodes to prevent the node from being dragged when the user interacts with form elements
- Use `className="nowheel"` to prevent zoom when scrolling inside a node
- Use `className="nopan"` to prevent canvas panning when dragging inside a node

### Zustand Store Pattern (FOLLOW THIS EXACTLY)
```typescript
import { create } from 'zustand';
import {
  applyNodeChanges, applyEdgeChanges, addEdge,
  type Node, type Edge, type OnNodesChange, type OnEdgesChange, type OnConnect,
} from '@xyflow/react';

const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection) => {
    set({ edges: addEdge(connection, get().edges) });
  },
  updateNodeData: (nodeId, data) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    });
  },
  // ... other actions
}));
```

When consuming the store in components, use `useShallow` from `zustand/react/shallow` to avoid unnecessary re-renders:
```tsx
import { useShallow } from 'zustand/react/shallow';

const { nodes, edges, onNodesChange } = useFlowStore(
  useShallow((s) => ({ nodes: s.nodes, edges: s.edges, onNodesChange: s.onNodesChange }))
);
```

### Drag-and-Drop from Sidebar (v12 Pattern)
The sidebar uses HTML5 drag events. The key method is `screenToFlowPosition()` (replaces the old v11 `project()` method):

**Sidebar (drag source):**
```tsx
function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };
  return (
    <div draggable onDragStart={(e) => onDragStart(e, 'stepNode')}>
      Basic Step
    </div>
  );
}
```

**Canvas (drop target):**
```tsx
const { screenToFlowPosition } = useReactFlow();

const onDrop = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  const type = event.dataTransfer.getData('application/reactflow');
  if (!type) return;

  // screenToFlowPosition converts pixel coords to flow coords (accounting for zoom/pan)
  const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
  const newNode = { id: `${Date.now()}`, type, position, data: { label: 'New Step' } };
  setNodes((nds) => [...nds, newNode]);
}, [screenToFlowPosition, setNodes]);

const onDragOver = useCallback((event: React.DragEvent) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}, []);

// Pass to <ReactFlow onDrop={onDrop} onDragOver={onDragOver} ... />
```

### Node Click → Property Panel
Use `onNodeClick` on `<ReactFlow>` and `updateNodeData()` from `useReactFlow()`:
```tsx
<ReactFlow
  onNodeClick={(event, node) => selectNode(node.id)}
  onPaneClick={() => selectNode(null)}
/>
```

The `useReactFlow()` hook in v12 exposes `updateNodeData(nodeId, dataUpdate)` which does a shallow merge — use this for inline edits. But since we use Zustand, prefer the store's `updateNodeData` action instead.

### Auto-Layout: Use Measured Dimensions
In React Flow v12, after initial render, each node gets `node.measured.width` and `node.measured.height`. Use the `useNodesInitialized()` hook to know when all nodes have been measured, THEN run dagre:
```tsx
import { useNodesInitialized, useReactFlow } from '@xyflow/react';

function LayoutHandler() {
  const nodesInitialized = useNodesInitialized();
  const { getNodes, getEdges, setNodes, fitView } = useReactFlow();

  useEffect(() => {
    if (nodesInitialized) {
      const { nodes: layouted } = getLayoutedElements(getNodes(), getEdges(), 'TB');
      setNodes(layouted);
      requestAnimationFrame(() => fitView());
    }
  }, [nodesInitialized]);

  return null; // Headless layout component
}

// Mount inside <ReactFlow>:
// <ReactFlow ...><LayoutHandler /><Background /><Controls /></ReactFlow>
```

Update the dagre function to use measured dimensions:
```typescript
nodes.forEach((node) => {
  dagreGraph.setNode(node.id, {
    width: node.measured?.width ?? 280,
    height: node.measured?.height ?? 150,
  });
});
```

### Custom Edge with EdgeLabelRenderer
For the ConditionalEdge, use `BaseEdge` + `EdgeLabelRenderer` + path utilities:
```tsx
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

function ConditionalEdge({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data }: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          pointerEvents: 'all',
        }} className="nodrag nopan">
          <span className="bg-blue-100 text-xs px-2 py-0.5 rounded">{data?.label}</span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

### Other Key APIs
| Hook/Function | Purpose |
|---|---|
| `useReactFlow()` | Access `getNodes`, `getEdges`, `setNodes`, `setEdges`, `updateNodeData`, `screenToFlowPosition`, `fitView`, `toObject`, `setViewport` |
| `useNodesState(initial)` | Returns `[nodes, setNodes, onNodesChange]` — simpler alternative to Zustand |
| `useEdgesState(initial)` | Returns `[edges, setEdges, onEdgesChange]` |
| `useNodesInitialized()` | Returns `true` when all nodes have been measured (use before layout) |
| `useOnSelectionChange({ onChange })` | Fires when node/edge selection changes |
| `getConnectedEdges(nodes, edges)` | Gets all edges connected to given nodes |
| `getIncomers(node, nodes, edges)` | Gets parent nodes |
| `getOutgoers(node, nodes, edges)` | Gets child nodes |

### Preserve Unknown Fields
When converting JSON → flow → JSON, any fields in the original JSON that aren't visually represented (like `voice_settings`, `max_clarification_retries`, etc.) must be preserved in the node's `data` and written back on export. Store the ENTIRE step object in `node.data` — never strip fields.

### JSON Export/Import
React Flow's `useReactFlow()` has a `toObject()` method that returns `{ nodes, edges, viewport }`. But for YOUR use case, you need custom export logic (`flowToJson.ts`) that reconstructs the original JSON format, not React Flow's internal format.

For file download:
```tsx
const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'flow.json';
a.click();
URL.revokeObjectURL(url);
```

---

## Full Test JSON (use this as the default loaded on first visit)

```json
{
  "name": "medicare_realistic_human_framer",
  "description": "Realistic human-like intro with connection check and headset excuse pattern interrupt.",
  "max_clarification_retries": 2,
  "max_silence_retries": 1,
  "steps": {
    "hello": {
      "description": "Connection check to start the call.",
      "audio_file": "human_hello.wav",
      "text": "Hello? Hi, [Greetings Name] this is [Agent Name] from United Healthcare — is this a good time?",
      "wait_for_response": false,
      "greetings": true,
      "pause_duration": 2,
      "next": "introduction",
      "voice_settings": { "stability": 0.45, "similarity_boost": 0.8 }
    },
    "introduction": {
      "description": "Humanizing pattern interrupt and ID.",
      "audio_file": "human_intro.wav",
      "text": "Sorry about that — had a quick delay there. How are you doing today?",
      "wait_for_response": false,
      "pause_duration": 2,
      "next": "main_pitch",
      "voice_settings": { "stability": 0.5, "similarity_boost": 0.75 }
    },
    "main_pitch": {
      "description": "The sizzle regarding credits and utility allowance.",
      "audio_file": "human_pitch.wav",
      "text": "I'm calling to review some Medicare options that may be available to you. Do you currently have both Part A and Part B?",
      "wait_for_response": true,
      "timeout": 5,
      "conditions": [
        { "type": "intent", "intent": "positive", "next": "qualify" },
        { "type": "intent", "intent": "negative", "next": "ask_age_question" },
        { "type": "intent", "intent": "clarifying", "next": "explain_benefits" }
      ],
      "timeout_next": "ask_again_main_pitch",
      "criticalstep": true,
      "no_match_next": "clarify_main_pitch",
      "intent_detector_routes": {
        "not_interested": "not_interested",
        "do_not_call": "graceful_exit",
        "obscenity": "graceful_exit"
      },
      "voice_settings": { "stability": 0.5, "similarity_boost": 0.75 }
    },
    "ask_again_main_pitch": {
      "description": "Recovery for silence after main pitch.",
      "text": "Are you still there? I just need to confirm, do you have both Medicare Part A and B?",
      "wait_for_response": true,
      "timeout": 5,
      "conditions": [
        { "type": "intent", "intent": "positive", "next": "qualify" },
        { "type": "intent", "intent": "negative", "next": "ask_age_question" },
        { "type": "intent", "intent": "clarifying", "next": "explain_benefits" }
      ],
      "timeout_next": "max_silence_exit",
      "no_match_next": "not_interested",
      "intent_detector_routes": {
        "not_interested": "not_interested",
        "do_not_call": "graceful_exit",
        "obscenity": "graceful_exit"
      }
    },
    "clarify_main_pitch": {
      "description": "Recovery for unclear responses to main pitch.",
      "text": "Just to verify, are you enrolled in both Part A and Part B?",
      "wait_for_response": true,
      "timeout": 5,
      "conditions": [
        { "type": "intent", "intent": "positive", "next": "qualify" },
        { "type": "intent", "intent": "negative", "next": "ask_age_question" },
        { "type": "intent", "intent": "clarifying", "next": "explain_benefits" }
      ],
      "timeout_next": "ask_again_main_pitch",
      "no_match_next": "max_clarification_exit",
      "intent_detector_routes": {
        "not_interested": "not_interested",
        "do_not_call": "graceful_exit",
        "obscenity": "graceful_exit"
      }
    },
    "explain_benefits": {
      "description": "Detailed benefit explanation for clarifying questions.",
      "text": "This is to see if you might qualify for lower prescription costs and added benefits. Do you have both Part A and Part B?",
      "wait_for_response": true,
      "timeout": 5,
      "conditions": [
        { "type": "intent", "intent": "positive", "next": "qualify" },
        { "type": "intent", "intent": "negative", "next": "ask_age_question" },
        { "type": "intent", "intent": "clarifying", "next": "not_interested" }
      ],
      "timeout_next": "ask_again_explain_benefits",
      "no_match_next": "clarify_explain_benefits",
      "intent_detector_routes": {
        "not_interested": "not_interested",
        "do_not_call": "graceful_exit",
        "obscenity": "graceful_exit"
      }
    },
    "ask_again_explain_benefits": {
      "description": "Recovery for silence after benefit explanation.",
      "text": "Hello? Do you have both Medicare Part A and B?",
      "wait_for_response": true,
      "timeout": 5,
      "conditions": [
        { "type": "intent", "intent": "positive", "next": "qualify" },
        { "type": "intent", "intent": "negative", "next": "ask_age_question" },
        { "type": "intent", "intent": "clarifying", "next": "not_interested" }
      ],
      "timeout_next": "max_silence_exit",
      "no_match_next": "not_interested",
      "intent_detector_routes": {
        "not_interested": "not_interested",
        "do_not_call": "graceful_exit",
        "obscenity": "graceful_exit"
      }
    },
    "clarify_explain_benefits": {
      "description": "Recovery for unclear responses after benefit explanation.",
      "text": "Can you confirm if you have Medicare Part A and B?",
      "wait_for_response": true,
      "timeout": 5,
      "conditions": [
        { "type": "intent", "intent": "positive", "next": "qualify" },
        { "type": "intent", "intent": "negative", "next": "ask_age_question" },
        { "type": "intent", "intent": "clarifying", "next": "not_interested" }
      ],
      "timeout_next": "ask_again_explain_benefits",
      "no_match_next": "max_clarification_exit",
      "intent_detector_routes": {
        "not_interested": "not_interested",
        "do_not_call": "graceful_exit",
        "obscenity": "graceful_exit"
      }
    },
    "ask_age_question": {
      "description": "Age check for those without A&B.",
      "text": "I see. Are you at least 65 years of age?",
      "wait_for_response": true,
      "timeout": 5,
      "conditions": [
        { "type": "intent", "intent": "positive", "next": "age_qualify_message" },
        { "type": "intent", "intent": "negative", "next": "not_qualify" }
      ],
      "timeout_next": "ask_again_age_question",
      "no_match_next": "clarify_age_question",
      "intent_detector_routes": {
        "not_interested": "not_interested",
        "do_not_call": "graceful_exit",
        "obscenity": "graceful_exit"
      }
    },
    "ask_again_age_question": {
      "description": "Recovery for silence after age question.",
      "text": "Sorry, I didn't catch that. Are you 65 or older?",
      "wait_for_response": true,
      "timeout": 5,
      "conditions": [
        { "type": "intent", "intent": "positive", "next": "age_qualify_message" },
        { "type": "intent", "intent": "negative", "next": "not_qualify" }
      ],
      "timeout_next": "max_silence_exit",
      "no_match_next": "not_interested",
      "intent_detector_routes": {
        "not_interested": "not_interested",
        "do_not_call": "graceful_exit",
        "obscenity": "graceful_exit"
      }
    },
    "clarify_age_question": {
      "description": "Recovery for unclear responses to age question.",
      "text": "I just need to confirm, are you 65 years or older?",
      "wait_for_response": true,
      "timeout": 5,
      "conditions": [
        { "type": "intent", "intent": "positive", "next": "age_qualify_message" },
        { "type": "intent", "intent": "negative", "next": "not_qualify" }
      ],
      "timeout_next": "ask_again_age_question",
      "no_match_next": "max_clarification_exit",
      "intent_detector_routes": {
        "not_interested": "not_interested",
        "do_not_call": "graceful_exit",
        "obscenity": "graceful_exit"
      }
    },
    "qualify": {
      "description": "Transfer logic.",
      "text": "Perfect, your file is eligible for the update. Let me get a specialist on the line to finish this up for you. Please hold one second.",
      "wait_for_response": false,
      "pause_duration": 3,
      "next": "connecting_message"
    },
    "age_qualify_message": {
      "description": "Transfer for age-qualified users.",
      "text": "Great! Let me transfer you now to go over the options for your file. Please hold.",
      "wait_for_response": false,
      "pause_duration": 3,
      "next": "connecting_message"
    },
    "connecting_message": {
      "description": "TERMINAL: Transfer to agent.",
      "wait_for_response": false,
      "disposition": "RAXFER",
      "action": "transfer",
      "next": "exit"
    },
    "not_qualify": {
      "description": "TERMINAL: Not qualified.",
      "text": "I understand. It looks like you don't qualify for this specific update right now. Thanks anyway!",
      "wait_for_response": false,
      "disposition": "DNQ",
      "action": "hangup",
      "next": "exit"
    },
    "not_interested": {
      "description": "TERMINAL: Not interested.",
      "text": "No problem at all. Have a great rest of your day. Goodbye.",
      "wait_for_response": false,
      "disposition": "NI",
      "action": "hangup",
      "next": "exit"
    },
    "graceful_exit": {
      "description": "TERMINAL: DNC or hostile response.",
      "text": "I understand. I'll update our list. Have a good one.",
      "wait_for_response": false,
      "disposition": "DNC",
      "action": "hangup",
      "next": "exit"
    },
    "max_silence_exit": {
      "description": "TERMINAL: Maximum silence retries exceeded.",
      "text": "Hello? I think we have a bad connection. Take care.",
      "wait_for_response": false,
      "disposition": "DAIR 2",
      "action": "hangup",
      "next": "exit"
    },
    "max_clarification_exit": {
      "description": "TERMINAL: Maximum clarification retries exceeded.",
      "text": "I'm having trouble hearing you clearly. Maybe try us back another time. Take care!",
      "wait_for_response": false,
      "disposition": "NI",
      "action": "hangup",
      "next": "exit"
    },
    "exit": {
      "description": "Final step.",
      "wait_for_response": false
    }
  }
}
```

---

## Reference Projects to Study

These use the exact same stack and patterns:

1. **[shadcn-next-workflows](https://github.com/nobruf/shadcn-next-workflows)** — Next.js + React Flow + shadcn workflow builder (MIT, 266 stars). Closest reference for project structure.
2. **React Flow's [Workflow Editor Template](https://reactflow.dev/ui/templates/workflow-editor)** — Official template using React Flow UI + shadcn + Zustand + ELKjs. Shows the "gold standard" architecture.
3. **React Flow's [Dagre layout example](https://reactflow.dev/examples/layout/dagre)** — Copy-paste dagre integration code.
4. **[json-edit-react demo](https://carlosnz.github.io/json-edit-react/)** — See how the JSON editor component works and how to theme it.
5. **Supabase's [SchemaGraph.tsx](https://github.com/supabase/supabase/blob/master/apps/studio/components/interfaces/Database/Schemas/SchemaGraph.tsx)** — Production React Flow + dagre usage.
6. **Microsoft AutoGen Studio's [agentflow.tsx](https://github.com/microsoft/autogen/blob/main/python/packages/autogen-studio/frontend/src/components/views/playground/chat/agentflow/agentflow.tsx)** — Production @xyflow/react + Dagre usage.
