# Phase 6: Export & Default Flow - Research

**Researched:** 2026-03-13
**Domain:** JSON export/download, live preview panel, default flow loading
**Confidence:** HIGH

## Summary

Phase 6 completes the import-edit-export loop by enhancing the existing ExportButton (which already has a working Blob download implementation), adding a live JSON preview panel, and loading the Medicare test flow on first visit. The codebase is well-prepared for this phase: `flowToJson` already handles lossless round-trip conversion, the `jsonPreviewOpen` toggle already exists in UiSlice, and the Medicare sample flow JSON (`sampleFlow.json`) is the established test fixture used across 20+ test files.

The primary risk areas are (1) ensuring the JSON preview panel stays performant with large flows by avoiding re-serialization on every render, and (2) verifying that the default flow loading does not interfere with the undo/redo temporal history.

**Primary recommendation:** Leverage everything already built -- the ExportButton just needs minor refinement, the JSON preview panel needs a new component wired to the existing `jsonPreviewOpen` state, and the default flow uses the existing `importJson` action called from a `useEffect` on App mount.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| IMP-03 | Default test flow (Medicare call flow) loads on first visit | Move sampleFlow.json to `src/data/defaultFlow.json`, call `importJson` on mount via `useEffect` when store is empty |
| EXP-01 | User can export modified JSON via download button | ExportButton already implements Blob download -- verify/enhance with filename from flow_name |
| EXP-02 | Exported JSON preserves all original fields not visually represented | Already implemented via `flowToJson` shallow clone + `metadata.wrapperFields` spread |
| EXP-03 | Exported JSON updates connection fields based on current edges | Already implemented via `updateConnectionFields` in `flowToJson.ts` |
| EXP-04 | Live JSON preview panel shows current state (toggleable) | New `JsonPreviewPanel` component using `flowToJson` + `JSON.stringify` in a scrollable `<pre>` |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.11 | State management | Already manages all flow state; `jsonPreviewOpen` toggle exists |
| @xyflow/react | 12.10.1 | Flow canvas | Provides nodes/edges consumed by flowToJson |
| lucide-react | 0.577.0 | Icons | Download, Braces, X icons for export/preview UI |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| shadcn/ui (scroll-area) | v4 | Scrollable container | JSON preview panel scroll wrapper |
| shadcn/ui (button) | v4 | Toolbar buttons | Export button, preview toggle already use this |

### No New Dependencies Needed

The JSON preview panel does NOT need a syntax highlighting library. Use a pure CSS approach with `JSON.stringify(json, null, 2)` in a `<pre>` tag. Reasons:
- The panel is read-only preview, not an editor (json-edit-react already handles editing)
- Adding react-syntax-highlighter would add ~150KB to the bundle for a feature that only needs readable formatted output
- `JSON.stringify` with 2-space indent is already readable; optional CSS coloring via a simple regex-to-spans function adds zero dependencies
- The existing dark mode story (Phase 7) can style the `<pre>` naturally via Tailwind

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Component Structure
```
src/
  data/
    defaultFlow.json         # Medicare flow moved from test fixtures (IMP-03)
  components/
    preview/
      JsonPreviewPanel.tsx   # New: live JSON preview panel (EXP-04)
      __tests__/
        JsonPreviewPanel.test.tsx
  components/
    toolbar/
      ExportButton.tsx       # Existing: minor enhancement
  lib/
    flowToJson.ts            # Existing: no changes needed
```

### Pattern 1: Default Flow Loading on Mount
**What:** Call `importJson` with the default Medicare flow when the app first loads
**When to use:** On initial mount when store has no nodes/edges
**Example:**
```typescript
// In App.tsx or a dedicated useDefaultFlow hook
import defaultFlow from '@/data/defaultFlow.json';

function App() {
  const metadata = useAppStore((s) => s.metadata);

  useEffect(() => {
    // Only load default if no flow is loaded (first visit)
    if (!metadata) {
      useAppStore.getState().importJson(defaultFlow as Record<string, unknown>);
    }
  }, []); // eslint-disable-line -- intentionally run once on mount
  // ...
}
```

**Key detail:** Use `useAppStore.getState()` (non-reactive) inside the effect to avoid re-subscription. Check `metadata === null` as the sentinel for "no flow loaded." Clear temporal history after default load so the initial state is not an undo step.

### Pattern 2: Live JSON Preview Panel
**What:** A side panel showing `flowToJson` output as formatted JSON, toggled via toolbar button
**When to use:** When `jsonPreviewOpen` is true in UiSlice
**Example:**
```typescript
// JsonPreviewPanel.tsx
export function JsonPreviewPanel() {
  const { nodes, edges, metadata } = useAppStore(useShallow((s) => ({
    nodes: s.nodes, edges: s.edges, metadata: s.metadata,
  })));

  if (!metadata) return null;

  const json = flowToJson(nodes, edges, metadata);
  const formatted = JSON.stringify(json, null, 2);

  return (
    <div className="w-96 border-l flex flex-col min-h-0">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-sm font-medium">JSON Preview</span>
        <Button variant="ghost" size="icon" onClick={toggleJsonPreview}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <pre className="p-3 text-xs font-mono whitespace-pre overflow-x-auto">
          {formatted}
        </pre>
      </ScrollArea>
    </div>
  );
}
```

### Pattern 3: Export with Dynamic Filename
**What:** Use `flow_name` from metadata for the download filename
**When to use:** ExportButton enhancement
**Example:**
```typescript
const flowName = metadata.wrapperFields.flow_name as string | undefined;
const safeName = (flowName ?? 'flow').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
a.download = `${safeName}.json`;
```

### Anti-Patterns to Avoid
- **Re-computing flowToJson on every keystroke:** The preview panel subscribes to nodes/edges which change on every edit. `flowToJson` is O(n) where n is nodes -- acceptable for call flows (typically < 100 nodes). Do NOT add debouncing complexity unless proven slow.
- **Storing preview JSON in the store:** This is a derived value -- compute it in the component, not the store. Storing it would double the state update frequency.
- **Using dangerouslySetInnerHTML for JSON display:** Unnecessary risk when React text content works fine. If syntax highlighting is desired, use spans rendered via React, not innerHTML.
- **Loading default flow in store initializer:** This would cause the flow to be present in the initial temporal state, making undo impossible. Load it in a useEffect instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON serialization | Custom JSON formatter | `JSON.stringify(obj, null, 2)` | Handles all edge cases, escape sequences, Unicode |
| File download | Custom download service | Blob + createObjectURL + anchor click | Standard browser API, already implemented in ExportButton |
| Scrollable container | Custom scroll logic | shadcn ScrollArea (already installed) | Handles overflow, virtual scrolling, consistent styling |
| JSON round-trip verification | Manual field comparison | `JSON.parse(JSON.stringify(output))` deep equality | Normalizes undefined/prototype differences |

**Key insight:** The entire export pipeline (`flowToJson` -> `JSON.stringify` -> `Blob` -> download) is already implemented. Phase 6 is primarily about wiring up the preview panel UI and loading a default flow.

## Common Pitfalls

### Pitfall 1: Default Flow Creates Undo History Entry
**What goes wrong:** Loading the default flow via `importJson` creates an undo step, so the first Ctrl+Z on a fresh visit reverts to an empty canvas.
**Why it happens:** `importJson` updates nodes/edges which are tracked by Zundo temporal middleware.
**How to avoid:** After loading the default flow, clear the temporal history: `useAppStore.temporal.getState().clear()`.
**Warning signs:** First Ctrl+Z results in blank canvas instead of undoing the user's first edit.

### Pitfall 2: JSON Preview Re-renders Cause Canvas Lag
**What goes wrong:** The preview panel re-renders on every node position change during drag, causing frame drops.
**Why it happens:** The panel subscribes to `nodes` which updates on every drag pixel.
**How to avoid:** This is acceptable for typical call flows (< 100 nodes). If proven slow, add `useMemo` with a shallow comparison or debounce the JSON computation. Do NOT pre-optimize.
**Warning signs:** Visible lag when dragging nodes with preview panel open.

### Pitfall 3: Blob URL Memory Leak
**What goes wrong:** Each export creates a Blob URL that persists in memory until page unload.
**Why it happens:** `URL.createObjectURL` creates a reference that must be explicitly revoked.
**How to avoid:** The existing ExportButton already calls `URL.revokeObjectURL(url)` after the click. Maintain this pattern.
**Warning signs:** Memory growing with repeated exports (check via DevTools memory panel).

### Pitfall 4: Default Flow File Location
**What goes wrong:** The default flow JSON is in `src/lib/__tests__/fixtures/`, mixing test data with production assets.
**Why it happens:** The Medicare flow was initially created as a test fixture.
**How to avoid:** Copy (not move) the file to `src/data/defaultFlow.json` for the production import. The test fixture remains in `__tests__/fixtures/` for test isolation. Both files have identical content.
**Warning signs:** Build includes test fixture paths in production bundle.

### Pitfall 5: Export Filename Collision with Special Characters
**What goes wrong:** `flow_name` from JSON may contain spaces, slashes, or special characters that create invalid filenames.
**Why it happens:** The flow_name field is user-authored free text.
**How to avoid:** Sanitize the filename by replacing non-alphanumeric characters (except hyphens/underscores) with underscores. Fallback to `flow.json` if no flow_name.
**Warning signs:** Download fails or creates oddly-named files on Windows.

## Code Examples

### Export Button (existing implementation -- works as-is)
```typescript
// Source: src/components/toolbar/ExportButton.tsx (existing)
const handleExport = () => {
  if (!metadata) return;
  const json = flowToJson(nodes, edges, metadata);
  const blob = new Blob([JSON.stringify(json, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'flow.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
```

### Default Flow Loading (new pattern)
```typescript
// useDefaultFlow hook or inline in App.tsx
useEffect(() => {
  const { metadata } = useAppStore.getState();
  if (!metadata) {
    useAppStore.getState().importJson(defaultFlow as Record<string, unknown>);
    // Clear undo history so default flow load is not an undo step
    useAppStore.temporal.getState().clear();
  }
}, []);
```

### JSON Preview Panel Layout Integration
```typescript
// In App.tsx, add preview panel alongside canvas
<div className="flex flex-1 min-h-0">
  <NodePalette />
  <div className="flex-1">
    <FlowCanvas />
  </div>
  {selectedNodeId && <PropertyPanel nodeId={selectedNodeId} />}
  {jsonPreviewOpen && <JsonPreviewPanel />}
</div>
```

### Round-Trip Verification Test Pattern
```typescript
// Source: src/lib/__tests__/roundTrip.test.ts (existing pattern)
it('import -> edit -> export -> re-import produces consistent result', () => {
  const { nodes, edges, metadata } = jsonToFlow(sampleFlow);
  // Simulate an edit (change a connection target)
  const editedEdges = edges.map(e =>
    e.source === 'greeting' && e.data?.edgeType === 'next'
      ? { ...e, target: 'manual_lookup' }
      : e
  );
  const exported = flowToJson(nodes, editedEdges, metadata);
  // Re-import the exported JSON
  const reimported = jsonToFlow(exported);
  const reExported = flowToJson(reimported.nodes, reimported.edges, reimported.metadata);
  // Round-trip should be stable
  expect(JSON.parse(JSON.stringify(reExported))).toEqual(JSON.parse(JSON.stringify(exported)));
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FileSaver.js library for downloads | Native Blob + createObjectURL | 2020+ | No dependency needed; native API is sufficient |
| react-json-view for preview | json-edit-react for editing, plain `<pre>` for preview | 2024+ | react-json-view is unmaintained; json-edit-react is already in the project |
| Syntax highlighting libraries for JSON preview | CSS-only or no highlighting for read-only preview | 2024+ | Bundle size matters more than aesthetics for a toggle panel |

**Deprecated/outdated:**
- `FileSaver.js`: Unnecessary for modern browsers -- native Blob download works everywhere
- `react-json-view`: Unmaintained since 2022; the project already uses `json-edit-react` for editing

## Open Questions

1. **Should PropertyPanel and JsonPreviewPanel be mutually exclusive?**
   - What we know: Both render in the right side of the layout. Having both open simultaneously would consume significant horizontal space.
   - What's unclear: Whether users would want both open at once.
   - Recommendation: Allow both to coexist (they serve different purposes -- editing vs previewing). The PropertyPanel is 320px (`w-80`) and the preview is 384px (`w-96`). On typical 1920px+ screens, both fit alongside the canvas. The user can close either panel independently.

2. **Should the JSON preview update in real-time during node drag?**
   - What we know: During drag, nodes change position on every frame. `flowToJson` re-running on every frame is wasteful but the node positions are NOT in the JSON output (positions are React Flow state only).
   - What's unclear: Whether `node.data.step` changes during drag would trigger preview updates.
   - Recommendation: Since `flowToJson` reads `node.data.step` (not positions), and step data does not change during drag, the preview will naturally NOT update during drag. No optimization needed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter verbose` |
| Full suite command | `npx vitest run --reporter verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| IMP-03 | Default Medicare flow loads on first visit (nodes/edges populated) | unit | `npx vitest run src/__tests__/App.test.tsx -x` | Needs new tests in existing file |
| EXP-01 | Export button triggers download of .json file | unit | `npx vitest run src/components/toolbar/__tests__/ExportButton.test.tsx -x` | New file needed |
| EXP-02 | Exported JSON preserves all non-visual fields | unit | `npx vitest run src/lib/__tests__/flowToJson.test.ts -x` | Already covered (18 tests) |
| EXP-03 | Connection fields reflect current edge state | unit | `npx vitest run src/lib/__tests__/flowToJson.test.ts -x` | Already covered (18 tests) |
| EXP-04 | JSON preview panel toggles open/closed showing current state | unit | `npx vitest run src/components/preview/__tests__/JsonPreviewPanel.test.tsx -x` | New file needed |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter verbose`
- **Per wave merge:** `npx vitest run --reporter verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/preview/__tests__/JsonPreviewPanel.test.tsx` -- covers EXP-04 (preview panel renders, toggles, shows current JSON)
- [ ] `src/components/toolbar/__tests__/ExportButton.test.tsx` -- covers EXP-01 (export triggers download with correct content)
- [ ] New tests in `src/__tests__/App.test.tsx` -- covers IMP-03 (default flow loads on mount)
- [ ] `src/lib/__tests__/roundTrip.test.ts` -- add edit-then-round-trip test for EXP-02/EXP-03 verification

*(Existing `flowToJson.test.ts` and `roundTrip.test.ts` already cover EXP-02 and EXP-03 core logic with 18+ tests)*

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/lib/flowToJson.ts`, `src/components/toolbar/ExportButton.tsx`, `src/store/uiSlice.ts` -- verified all existing implementations
- Existing tests: `src/lib/__tests__/flowToJson.test.ts` (18 tests), `src/lib/__tests__/roundTrip.test.ts` (6 tests) -- round-trip already verified
- [MDN: Blob API](https://developer.mozilla.org/en-US/docs/Web/API/Blob) -- standard download pattern
- [MDN: URL.createObjectURL](https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static) -- memory management (revokeObjectURL)

### Secondary (MEDIUM confidence)
- [JSON pretty-print with syntax highlighting](https://dev.to/gauravadhikari1997/show-json-as-pretty-print-with-syntax-highlighting-3jpm) -- CSS-only JSON highlighting pattern (opted against for simplicity)

### Tertiary (LOW confidence)
- None -- all patterns verified against existing codebase and MDN docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies; everything already installed
- Architecture: HIGH -- builds on existing patterns (flowToJson, UiSlice toggle, importJson)
- Pitfalls: HIGH -- verified against existing codebase; temporal history clearing is well-documented in Zundo

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable -- no fast-moving dependencies)
