# Phase 2: JSON Transform Layer - Research

**Researched:** 2026-03-12
**Domain:** JSON parsing, graph data transformation, file I/O, React Flow data model
**Confidence:** HIGH

## Summary

Phase 2 converts arbitrary call flow JSON files into React Flow node/edge arrays and back again without data loss. The core challenge is twofold: (1) auto-detecting which part of an arbitrary JSON object contains the "steps" -- objects linked by `next`, `conditions`, `timeout_next`, `no_match_next`, and `intent_detector_routes` fields -- and (2) preserving every original JSON field through the full round-trip (import -> edit -> export) even for fields the editor never displays.

The existing Zustand store from Phase 1 already has `nodes: Node[]`, `edges: Edge[]`, and change handlers. Phase 2 adds `setNodes`/`setEdges` actions, a `rawJson` state field to preserve the full original document, and two pure transform functions: `jsonToFlow` (JSON -> nodes+edges) and `flowToJson` (nodes+edges -> JSON). The file import UI uses the standard HTML5 FileReader API triggered via a hidden `<input type="file">` element behind a shadcn Button -- no third-party upload library needed.

**Primary recommendation:** Build `jsonToFlow` and `flowToJson` as pure functions (no React/store dependency) with comprehensive unit tests. Store the full raw JSON in Zustand so `flowToJson` can reconstruct the complete document by merging edited node data back into the original structure.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| IMP-01 | User can import a JSON file via file picker | File import via hidden `<input type="file" accept=".json">` + FileReader API; store action `importJson(raw)` parses and loads |
| IMP-02 | App auto-detects the step container in arbitrary JSON (objects with `next`, `conditions`, or similar linking fields) | `detectStepsContainer` heuristic function scanning top-level keys for objects-of-objects with linking fields |
| IMP-04 | App preserves all original JSON fields including ones not visually represented | Store `rawJson` + `metadata` (non-step wrapper fields); `flowToJson` merges node.data back into original structure |
</phase_requirements>

## Standard Stack

### Core (already installed -- Phase 1)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @xyflow/react | ^12.10.1 | Node/Edge types, ReactFlow renderer | Already installed; Node and Edge types define the target data model |
| zustand | ^5.0.11 | State management | Already installed; store holds nodes, edges, rawJson |
| vitest | ^4.0.18 | Unit testing | Already installed; pure transform functions are ideal unit test targets |

### Supporting (no new dependencies needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| HTML5 FileReader API | native | Read JSON file contents | When user clicks Import button |
| JSON.parse / JSON.stringify | native | Parse and serialize JSON | In transform functions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native FileReader | react-dropzone / react-file-reader-input | Adds dependency for trivial functionality; native API is 5 lines of code |
| Custom step detection | json-to-reactflow npm package | Package converts generic JSON trees, not domain-specific call flow steps with edge semantics |
| Manual JSON diffing | lossless-json | Only needed for BigInt/precision; call flow JSON uses standard types |

**Installation:**
```bash
# No new packages needed -- all capabilities from Phase 1 stack + native APIs
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  lib/
    jsonToFlow.ts          # Pure function: raw JSON -> { nodes, edges, metadata }
    flowToJson.ts          # Pure function: nodes, edges, metadata -> JSON
    detectSteps.ts         # Heuristic to find step container in arbitrary JSON
    edgeExtractors.ts      # Extract edges from step fields (next, conditions, etc.)
    types.ts               # CallFlowStep, FlowTransformResult, StepContainer types
  lib/__tests__/
    jsonToFlow.test.ts     # Unit tests for forward transform
    flowToJson.test.ts     # Unit tests for reverse transform
    detectSteps.test.ts    # Unit tests for step detection heuristic
    roundTrip.test.ts      # Integration test: import -> export produces identical JSON
  store/
    flowSlice.ts           # Extended with setNodes, setEdges, importJson, rawJson, metadata
    types.ts               # Extended FlowSlice interface
  components/
    toolbar/
      ImportButton.tsx     # Hidden file input + shadcn Button trigger
```

### Pattern 1: Pure Transform Functions (No Side Effects)

**What:** `jsonToFlow` and `flowToJson` are pure functions that take data in and return data out. They have zero dependency on React, Zustand, or any component.

**When to use:** Always. This is the correct pattern for data transformation logic.

**Why:** Pure functions are trivially testable, composable, and reusable. The store action simply calls the pure function and sets state.

**Example:**
```typescript
// src/lib/jsonToFlow.ts
import type { Node, Edge } from '@xyflow/react';

export interface FlowTransformResult {
  nodes: Node[];
  edges: Edge[];
  metadata: JsonMetadata;
}

export interface JsonMetadata {
  /** The key path to the steps container (e.g., "steps" or "flow.steps") */
  stepsKey: string;
  /** All top-level fields that are NOT the steps container, preserved verbatim */
  wrapperFields: Record<string, unknown>;
}

export function jsonToFlow(rawJson: Record<string, unknown>): FlowTransformResult {
  const { stepsKey, steps } = detectStepsContainer(rawJson);

  // Preserve everything except the steps container
  const wrapperFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rawJson)) {
    if (key !== stepsKey) {
      wrapperFields[key] = value;
    }
  }

  const nodes = stepsToNodes(steps);
  const edges = stepsToEdges(steps);

  return {
    nodes,
    edges,
    metadata: { stepsKey, wrapperFields },
  };
}
```

### Pattern 2: Step Detection Heuristic

**What:** Algorithm to find which key in the JSON contains the call flow steps.

**When to use:** On every JSON import -- the user's JSON structure is not predefined.

**Algorithm:**
```typescript
// src/lib/detectSteps.ts

/** Linking fields that indicate an object is a call flow step */
const LINKING_FIELDS = ['next', 'conditions', 'timeout_next', 'no_match_next', 'intent_detector_routes'];

export interface StepContainerResult {
  stepsKey: string;
  steps: Record<string, Record<string, unknown>>;
}

export function detectStepsContainer(json: Record<string, unknown>): StepContainerResult {
  // Strategy: find the top-level key whose value is an object-of-objects
  // where the child objects contain linking fields (next, conditions, etc.)

  let bestKey = '';
  let bestScore = 0;
  let bestSteps: Record<string, Record<string, unknown>> = {};

  for (const [key, value] of Object.entries(json)) {
    if (!isPlainObject(value)) continue;

    const candidateSteps = value as Record<string, unknown>;
    let stepCount = 0;
    let linkingFieldCount = 0;

    for (const stepValue of Object.values(candidateSteps)) {
      if (!isPlainObject(stepValue)) continue;
      stepCount++;
      const step = stepValue as Record<string, unknown>;
      for (const field of LINKING_FIELDS) {
        if (field in step) linkingFieldCount++;
      }
    }

    // Score = number of child objects that have linking fields
    // Require at least 2 steps to avoid false positives
    if (stepCount >= 2 && linkingFieldCount > bestScore) {
      bestScore = linkingFieldCount;
      bestKey = key;
      bestSteps = candidateSteps as Record<string, Record<string, unknown>>;
    }
  }

  if (!bestKey) {
    throw new Error('Could not detect steps container in JSON. Expected an object containing step objects with linking fields (next, conditions, timeout_next, etc.).');
  }

  return { stepsKey: bestKey, steps: bestSteps };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
```

### Pattern 3: Edge Extraction by Type

**What:** Each linking field type produces edges with different semantics that Phase 3 will render with different styles.

**When to use:** During `jsonToFlow` conversion -- extract all connection types.

**Edge types and their source fields:**
```typescript
// src/lib/edgeExtractors.ts

/**
 * Extract all edges from a single step.
 * Each edge gets a `type` field in its `data` for Phase 3 styling.
 */
export function extractEdgesFromStep(
  stepKey: string,
  step: Record<string, unknown>
): Edge[] {
  const edges: Edge[] = [];

  // 1. Direct "next" field -> single edge
  if (typeof step.next === 'string') {
    edges.push({
      id: `${stepKey}->next->${step.next}`,
      source: stepKey,
      target: step.next,
      sourceHandle: 'next',
      data: { edgeType: 'next' },
    });
  }

  // 2. "conditions" array -> one edge per condition
  if (Array.isArray(step.conditions)) {
    step.conditions.forEach((cond: any, i: number) => {
      if (cond.next && typeof cond.next === 'string') {
        const label = cond.condition_description || cond.condition || `Condition ${i + 1}`;
        edges.push({
          id: `${stepKey}->condition-${i}->${cond.next}`,
          source: stepKey,
          target: cond.next,
          sourceHandle: `condition-${i}`,
          label: String(label),
          data: { edgeType: 'condition', conditionIndex: i },
        });
      }
    });
  }

  // 3. "timeout_next" -> single edge
  if (typeof step.timeout_next === 'string') {
    edges.push({
      id: `${stepKey}->timeout->${step.timeout_next}`,
      source: stepKey,
      target: step.timeout_next,
      sourceHandle: 'timeout',
      label: 'Timeout',
      data: { edgeType: 'timeout' },
    });
  }

  // 4. "no_match_next" -> single edge
  if (typeof step.no_match_next === 'string') {
    edges.push({
      id: `${stepKey}->no_match->${step.no_match_next}`,
      source: stepKey,
      target: step.no_match_next,
      sourceHandle: 'no_match',
      label: 'No Match',
      data: { edgeType: 'no_match' },
    });
  }

  // 5. "intent_detector_routes" object -> one edge per intent
  if (isPlainObject(step.intent_detector_routes)) {
    const routes = step.intent_detector_routes as Record<string, string>;
    for (const [intentName, targetStep] of Object.entries(routes)) {
      if (typeof targetStep === 'string') {
        edges.push({
          id: `${stepKey}->intent-${intentName}->${targetStep}`,
          source: stepKey,
          target: targetStep,
          sourceHandle: `intent-${intentName}`,
          label: intentName,
          data: { edgeType: 'intent', intentName },
        });
      }
    }
  }

  return edges;
}
```

### Pattern 4: Lossless Round-Trip via rawJson + metadata

**What:** Store the entire original JSON object plus metadata about where steps live. On export, merge edited node data back into the original structure.

**When to use:** Always -- this is how IMP-04 (preserve all fields) is satisfied.

**Example:**
```typescript
// src/lib/flowToJson.ts

export function flowToJson(
  nodes: Node[],
  edges: Edge[],
  metadata: JsonMetadata
): Record<string, unknown> {
  // Start with the wrapper fields (everything except steps)
  const result: Record<string, unknown> = { ...metadata.wrapperFields };

  // Rebuild the steps container from nodes
  const steps: Record<string, Record<string, unknown>> = {};

  for (const node of nodes) {
    // node.data contains the FULL original step object (IMP-04)
    const stepData = { ...node.data.step };

    // Update connection fields from current edges
    updateConnectionFields(stepData, node.id, edges);

    steps[node.id] = stepData;
  }

  // Place steps back at the original key path
  result[metadata.stepsKey] = steps;

  return result;
}

function updateConnectionFields(
  step: Record<string, unknown>,
  nodeId: string,
  edges: Edge[]
): void {
  const nodeEdges = edges.filter(e => e.source === nodeId);

  // Rebuild "next" from edges with edgeType 'next'
  const nextEdge = nodeEdges.find(e => e.data?.edgeType === 'next');
  if (nextEdge) {
    step.next = nextEdge.target;
  } else {
    delete step.next;
  }

  // Rebuild "conditions" array -- update .next on each condition
  if (Array.isArray(step.conditions)) {
    const condEdges = nodeEdges.filter(e => e.data?.edgeType === 'condition');
    for (const edge of condEdges) {
      const idx = edge.data?.conditionIndex;
      if (idx !== undefined && step.conditions[idx]) {
        step.conditions[idx].next = edge.target;
      }
    }
  }

  // Rebuild timeout_next
  const timeoutEdge = nodeEdges.find(e => e.data?.edgeType === 'timeout');
  step.timeout_next = timeoutEdge ? timeoutEdge.target : undefined;

  // Rebuild no_match_next
  const noMatchEdge = nodeEdges.find(e => e.data?.edgeType === 'no_match');
  step.no_match_next = noMatchEdge ? noMatchEdge.target : undefined;

  // Rebuild intent_detector_routes
  const intentEdges = nodeEdges.filter(e => e.data?.edgeType === 'intent');
  if (intentEdges.length > 0) {
    const routes: Record<string, string> = {};
    for (const edge of intentEdges) {
      routes[edge.data?.intentName] = edge.target;
    }
    step.intent_detector_routes = routes;
  }
}
```

### Pattern 5: Store Extension

**What:** Extend the existing FlowSlice with `setNodes`, `setEdges`, `importJson`, `rawJson`, and `metadata`.

**Example:**
```typescript
// Extended FlowSlice interface (store/types.ts)
export interface FlowSlice {
  nodes: Node[];
  edges: Edge[];
  rawJson: Record<string, unknown> | null;
  metadata: JsonMetadata | null;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  importJson: (raw: Record<string, unknown>) => void;
}
```

### Pattern 6: File Import UI

**What:** Hidden file input element triggered by a button click. No third-party library needed.

**Example:**
```typescript
// src/components/toolbar/ImportButton.tsx
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useAppStore } from '@/store';

export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null);
  const importJson = useAppStore((s) => s.importJson);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();      // Modern alternative to FileReader
    const json = JSON.parse(text);
    importJson(json);

    // Reset input so same file can be re-imported
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4 mr-2" />
        Import
      </Button>
    </>
  );
}
```

**Note on `file.text()`:** The `File.text()` method returns a Promise<string> and is supported in all modern browsers. It is simpler than FileReader for this use case.

### Anti-Patterns to Avoid

- **Storing step data separately from node.data:** Every step field MUST live inside `node.data.step` (or similar) so it survives React Flow's internal node operations. Do NOT split step properties across node fields.
- **Reconstructing JSON from scratch on export:** Always start from the original `rawJson` / `metadata.wrapperFields` and merge changes back. Never rebuild the entire document from just nodes/edges -- you will lose fields the editor does not model.
- **Generating node IDs different from step keys:** The step key in the JSON (e.g., `"greeting"`, `"transfer_agent"`) IS the node ID. This makes edge source/target references work naturally without a mapping table.
- **Parsing edges inside React components:** Edge extraction is pure data transformation. Keep it in `lib/`, not in component render functions.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File reading | Custom XHR/fetch uploader | Native `<input type="file">` + `file.text()` | Browser-native, no dependencies, handles encoding |
| JSON parsing | Custom parser | `JSON.parse()` | Standard, handles all valid JSON, throws on invalid |
| Node/Edge types | Custom graph types | `@xyflow/react` `Node` and `Edge` types | Must match what ReactFlow expects to render |
| Deep cloning for immutability | Manual recursive clone | Spread operator + structuredClone for deep objects | Zustand expects new references for re-render |

**Key insight:** The transforms are domain-specific (call flow semantics) and MUST be custom code. But the I/O layer (file reading, JSON parsing, type system) should use platform/library primitives.

## Common Pitfalls

### Pitfall 1: Mutating node.data breaks React Flow rendering
**What goes wrong:** Modifying properties on `node.data` in-place without creating a new node object. React Flow uses reference equality to detect changes.
**Why it happens:** Developers forget that Zustand + React Flow require immutable updates.
**How to avoid:** Always spread: `{ ...node, data: { ...node.data, step: { ...node.data.step, ...changes } } }`. Use `structuredClone` for deep nested objects when needed.
**Warning signs:** Edits in the property panel don't reflect on canvas until a re-mount.

### Pitfall 2: Edge IDs not unique when same target reached by multiple paths
**What goes wrong:** Two edges with the same ID cause React Flow to silently drop one.
**Why it happens:** Naive ID generation like `${source}-${target}` collides when a step has both a `next` and a `condition` pointing to the same target.
**How to avoid:** Include the edge type and index in the ID: `${source}->condition-${i}->${target}`.
**Warning signs:** Missing edges on canvas, especially for conditions that route to the same step.

### Pitfall 3: Losing fields during round-trip
**What goes wrong:** Exporting JSON that is missing fields like `voice_settings`, `max_clarification_retries`, etc.
**Why it happens:** Only storing "known" fields in node.data instead of the entire step object.
**How to avoid:** Store the COMPLETE step object in `node.data.step` using the index signature `Record<string, unknown>`. The `flowToJson` function then only updates connection fields while preserving everything else.
**Warning signs:** Diff between original and exported JSON shows missing keys.

### Pitfall 4: Step detection failing on nested JSON
**What goes wrong:** The heuristic only checks top-level keys but the steps might be at `flow.steps` or `config.callflow.steps`.
**Why it happens:** Real-world JSON structures vary.
**How to avoid:** Start with top-level detection (covers the common case). If no match found at top level, do one level of depth (check children of top-level objects). Throw a descriptive error if detection fails entirely so the user knows why.
**Warning signs:** Import works for some JSONs but fails silently for others.

### Pitfall 5: Dangling edge references
**What goes wrong:** An edge references a target step key that doesn't exist as a node (e.g., the step references a typo'd key or an external step).
**Why it happens:** Real call flow JSON files may have references to steps that don't exist in the current file.
**How to avoid:** Filter out edges whose target is not in the set of known step keys. Log a warning for discarded edges. Optionally create a "missing reference" placeholder node.
**Warning signs:** React Flow console warnings about missing node for edge target.

### Pitfall 6: File input not resettable
**What goes wrong:** User imports a file, makes changes, wants to re-import the SAME file -- nothing happens.
**Why it happens:** The `<input type="file">` `onChange` only fires when the value changes. Same filename = no change.
**How to avoid:** Reset `inputRef.current.value = ''` after each import.
**Warning signs:** Re-importing the same file does nothing.

## Code Examples

### Node Position Grid Layout (temporary until Phase 3 dagre)
```typescript
// Assign grid positions to nodes until Phase 3 adds dagre auto-layout
function assignGridPositions(nodes: Node[]): Node[] {
  const COLS = 4;
  const X_GAP = 300;
  const Y_GAP = 200;

  return nodes.map((node, i) => ({
    ...node,
    position: {
      x: (i % COLS) * X_GAP,
      y: Math.floor(i / COLS) * Y_GAP,
    },
  }));
}
```

### Steps to Nodes Conversion
```typescript
function stepsToNodes(steps: Record<string, Record<string, unknown>>): Node[] {
  const entries = Object.entries(steps);
  const COLS = 4;
  const X_GAP = 300;
  const Y_GAP = 200;

  return entries.map(([key, step], i) => ({
    id: key,
    type: 'default',             // Phase 3 will change to custom 'stepNode'
    position: {
      x: (i % COLS) * X_GAP,
      y: Math.floor(i / COLS) * Y_GAP,
    },
    data: {
      label: step.description || step.name || key,
      step: { ...step },        // FULL step object preserved (IMP-04)
    },
  }));
}
```

### Store importJson Action
```typescript
// In flowSlice.ts
importJson: (raw: Record<string, unknown>) => {
  const { nodes, edges, metadata } = jsonToFlow(raw);
  set({
    nodes,
    edges,
    rawJson: raw,
    metadata,
  });
},
```

### Sample Test Flow JSON Structure
```json
{
  "flow_name": "Medicare Enrollment",
  "version": "2.1",
  "voice_settings": {
    "provider": "elevenlabs",
    "voice_id": "abc123"
  },
  "steps": {
    "greeting": {
      "description": "Initial greeting",
      "text": "Hello, thank you for calling...",
      "audio_file": "greeting.wav",
      "wait_for_response": true,
      "next": "verify_identity",
      "timeout_next": "greeting_retry",
      "timeout": 10
    },
    "verify_identity": {
      "description": "Verify caller identity",
      "text": "Can I have your Medicare ID?",
      "wait_for_response": true,
      "conditions": [
        {
          "condition": "id_verified",
          "condition_description": "ID verified",
          "next": "plan_options"
        },
        {
          "condition": "id_not_found",
          "condition_description": "ID not found",
          "next": "manual_lookup"
        }
      ],
      "no_match_next": "verify_retry",
      "intent_detector_routes": {
        "hangup_request": "farewell",
        "speak_to_agent": "transfer_agent"
      },
      "max_clarification_retries": 3,
      "criticalstep": true
    },
    "transfer_agent": {
      "description": "Transfer to live agent",
      "text": "Let me transfer you to an agent.",
      "action": "transfer",
      "disposition": "transferred",
      "next": null
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `reactflow` package (v11) | `@xyflow/react` (v12) | 2024 | New generic Node<T>/Edge<T> types; `data` is required on Node |
| `useNodesState` / `useEdgesState` hooks | External state via Zustand | v12 recommended | Better for complex apps; hooks still work but Zustand is preferred |
| `File` + `FileReader` | `File.text()` returns Promise | All modern browsers | Cleaner async code, no event listener boilerplate |
| `JSON.parse` reviver for types | Standard JSON.parse (no special types in call flow data) | N/A | Call flow JSON uses only standard JSON types; no BigInt/Date concerns |

**Deprecated/outdated:**
- `reactflow` (v11) package name: Replaced by `@xyflow/react`. This project already uses v12.
- `useNodesState()` / `useEdgesState()`: Still available but not recommended when using Zustand for state management. This project correctly uses Zustand slices.

## Open Questions

1. **Exact JSON structure of user's call flow files**
   - What we know: Steps are objects keyed by name, with fields like `next`, `conditions`, `timeout_next`, `no_match_next`, `intent_detector_routes`. Sample structure documented above.
   - What's unclear: Exact nesting depth, whether steps are always at a top-level key, whether there are additional linking field patterns.
   - Recommendation: Build detection heuristic for top-level and one-level-deep. Include descriptive error messages when detection fails. The sample test JSON (Phase 6) will validate assumptions.

2. **Node positioning before dagre (Phase 3)**
   - What we know: Phase 2 only needs nodes to appear on canvas; Phase 3 adds proper dagre layout.
   - What's unclear: Whether a simple grid is sufficient or if some basic topological ordering would help.
   - Recommendation: Use simple grid layout. Phase 3 will replace it entirely with dagre. No point investing in intermediate layout.

3. **Conditions array structure variations**
   - What we know: Conditions have `condition`, `condition_description`, and `next` fields.
   - What's unclear: Whether conditions can have nested sub-conditions or additional fields.
   - Recommendation: Treat each condition entry as an opaque object (preserve all fields) that definitely has a `next` field. Only read `next` and `condition_description`/`condition` for edge extraction.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `/root/visualizer/vitest.config.ts` |
| Quick run command | `npx vitest --run` |
| Full suite command | `npx vitest --run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IMP-01 | Import JSON file via file picker | unit (store action) | `npx vitest --run src/lib/__tests__/jsonToFlow.test.ts` | Wave 0 |
| IMP-02 | Auto-detect step container | unit | `npx vitest --run src/lib/__tests__/detectSteps.test.ts` | Wave 0 |
| IMP-04 | Preserve all original fields | unit (round-trip) | `npx vitest --run src/lib/__tests__/roundTrip.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest --run`
- **Per wave merge:** `npx vitest --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/__tests__/jsonToFlow.test.ts` -- covers IMP-01, IMP-02 (forward transform + detection)
- [ ] `src/lib/__tests__/flowToJson.test.ts` -- covers reverse transform
- [ ] `src/lib/__tests__/detectSteps.test.ts` -- covers IMP-02 (step detection heuristic)
- [ ] `src/lib/__tests__/roundTrip.test.ts` -- covers IMP-04 (lossless round-trip)
- [ ] `src/lib/__tests__/edgeExtractors.test.ts` -- covers edge extraction for all 5 connection types
- [ ] Test fixture JSON file with representative call flow data

## Sources

### Primary (HIGH confidence)
- [React Flow Node API Reference](https://reactflow.dev/api-reference/types/node) - Complete Node type interface
- [React Flow Edge API Reference](https://reactflow.dev/api-reference/types/edge) - Complete Edge type interface
- [React Flow TypeScript Guide](https://reactflow.dev/learn/advanced-use/typescript) - Custom node/edge type patterns
- [React Flow State Management with Zustand](https://reactflow.dev/learn/advanced-use/state-management) - Store pattern with setNodes/setEdges
- [React Flow ReactFlowJsonObject](https://reactflow.dev/api-reference/types/react-flow-json-object) - Save/restore type structure

### Secondary (MEDIUM confidence)
- Existing project codebase (Phase 1 output) - Store structure, types, component patterns verified by reading source
- [MDN File.text()](https://developer.mozilla.org/en-US/docs/Web/API/Blob/text) - Modern file reading API

### Tertiary (LOW confidence)
- Call flow JSON structure - Inferred from requirements (next, conditions, timeout_next, no_match_next, intent_detector_routes field names) and user context (Medicare call flows). Exact structure unverified against real files.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies; all from Phase 1 + native APIs
- Architecture: HIGH - Pure function transform pattern is well-established; React Flow types verified against official docs
- Pitfalls: HIGH - Edge ID collisions, mutability bugs, and round-trip data loss are well-documented React Flow issues
- Call flow JSON structure: MEDIUM - Inferred from requirements text; real files may have variations

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable domain; React Flow v12 API unlikely to change)
