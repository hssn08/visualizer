# Phase 1: Project Scaffold & Foundation - Research

**Researched:** 2026-03-12
**Domain:** Vite + React + TypeScript + Tailwind v4 + shadcn/ui + React Flow + Zustand project scaffolding
**Confidence:** HIGH

## Summary

Phase 1 is pure infrastructure: create a working Vite dev environment with all dependencies installed, Tailwind v4 + shadcn/ui rendering correctly, a Zustand store wired to React Flow, and a blank canvas visible in the browser. There are no user-facing requirements -- this phase enables all subsequent phases.

The critical technical challenges are: (1) getting Tailwind v4's CSS-first configuration working with shadcn/ui CLI v4, (2) importing React Flow CSS in the correct order so Tailwind's Preflight reset does not strip React Flow styles, (3) ensuring the React Flow container has explicit dimensions so the canvas is visible, and (4) setting up the Zustand store with the slices pattern and temporal (zundo) middleware from the start so undo/redo can be integrated later without a rewrite.

**Primary recommendation:** Use `npm create vite@latest` with the `react-ts` template as the starting point, then layer on Tailwind v4 via `@tailwindcss/vite`, initialize shadcn/ui via CLI, install `@xyflow/react` and `zustand`/`zundo`, and wire up the store + canvas in a single App component wrapped by `ReactFlowProvider`.

<phase_requirements>
## Phase Requirements

This phase is infrastructure-only -- no user-facing requirement IDs. It enables all subsequent phases by establishing:

| Infrastructure Need | What It Enables | Research Support |
|----|-------------|-----------------|
| Vite + React + TypeScript project | All phases -- build tooling, dev server, type safety | Standard Stack section: exact versions, template, config |
| Tailwind v4 + shadcn/ui | Phases 3-7: all UI components, property panel, toolbar, dark mode | Standard Stack + CSS Setup Pattern |
| @xyflow/react with ReactFlowProvider | Phases 2-7: canvas rendering, nodes, edges, interactivity | Architecture Pattern 1 + Pitfall Prevention |
| Zustand store with slices + zundo | Phases 2-7: state management, undo/redo, import/export | Architecture Pattern 2 + Store Skeleton Pattern |
| TypeScript types | Phases 2-7: type safety for nodes, edges, call flow data | Architecture Pattern 3 |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 7.x | Build tool / dev server | Fastest DX for client-side SPA. `@tailwindcss/vite` plugin for native Tailwind integration. |
| React | 19.x | UI framework | Required by @xyflow/react 12.10+ via Zustand v5's `useSyncExternalStore`. |
| TypeScript | ~5.9 | Type safety | Stable release. @xyflow/react ships complete type definitions. Pin to ~5.9 (TS 6.0 is still RC). |
| @xyflow/react | 12.10.x | Node graph canvas | Dominant React library for node-based UIs. Built-in drag/drop, zoom/pan, minimap, handles. |
| Zustand | 5.0.x | State management | React Flow's officially recommended state manager. Minimal API, no boilerplate. |
| zundo | 2.3.x | Undo/redo middleware | Temporal middleware for Zustand. Required for Phase 5 undo/redo. Install now to avoid store refactor later. |
| Tailwind CSS | 4.2.x | Styling | CSS-first config (no tailwind.config.js). Use `@tailwindcss/vite` plugin. |
| shadcn/ui | latest (CLI v4) | UI component system | Copies Radix UI + Tailwind components into `src/components/ui/`. Fully supports Tailwind v4. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.577.x | Icons | shadcn/ui's default icon set. Tree-shakeable. |
| clsx | 2.x | Conditional class joining | Used in shadcn's `cn()` utility. |
| tailwind-merge | 2.x | Tailwind class deduplication | Used in shadcn's `cn()` utility. |
| class-variance-authority | 0.7.x | Component variants | Used by shadcn components. Installed by `shadcn init`. |
| tw-animate-css | latest | Animation utilities | Replaces deprecated `tailwindcss-animate` for Tailwind v4. Required by shadcn. |

### Dev Dependencies

| Library | Version | Purpose |
|---------|---------|---------|
| @vitejs/plugin-react | 5.x | Vite React integration (Fast Refresh, JSX) |
| @tailwindcss/vite | 4.2.x | Native Tailwind v4 Vite plugin |
| tailwindcss | 4.2.x | Tailwind CSS engine (peer of @tailwindcss/vite) |
| @types/react | latest | React type definitions |
| @types/react-dom | latest | ReactDOM type definitions |
| vitest | latest | Test framework (for Nyquist validation) |
| @testing-library/react | latest | React component testing utilities |
| @testing-library/dom | latest | DOM testing utilities |
| jsdom | latest | DOM environment for Vitest |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite | Next.js | Only if SSR/SEO/API routes needed. Adds unnecessary complexity for a client-side SPA. |
| Zustand | Redux Toolkit | Only if team already uses Redux. 10x more boilerplate. React Flow uses Zustand internally. |
| shadcn/ui | Material UI | Heavy, opinionated, conflicts with Tailwind's utility approach. |

### What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `reactflow` (old package) | Deprecated, renamed to `@xyflow/react` in v12 | `@xyflow/react` |
| `tailwindcss-animate` | Incompatible with Tailwind v4's CSS-first architecture | `tw-animate-css` |
| `tailwind.config.js` | Tailwind v4 uses CSS-first config via `@theme` blocks | `src/index.css` with `@theme inline` |

**Installation:**

```bash
# Step 1: Scaffold Vite project
npm create vite@latest visualizer -- --template react-ts
cd visualizer
npm install

# Step 2: Core dependencies
npm install @xyflow/react zustand zundo lucide-react clsx tailwind-merge class-variance-authority tw-animate-css

# Step 3: Dev dependencies
npm install -D @tailwindcss/vite tailwindcss vitest @testing-library/react @testing-library/dom jsdom

# Step 4: Initialize shadcn/ui (after configuring Vite + Tailwind + path aliases)
npx shadcn@latest init

# Step 5: Add initial shadcn components
npx shadcn@latest add button
```

## Architecture Patterns

### Recommended Project Structure (Phase 1 Scope)

```
src/
├── components/
│   ├── canvas/
│   │   └── FlowCanvas.tsx       # ReactFlow component with store bindings
│   └── ui/                      # shadcn/ui primitives (generated by CLI)
│       └── button.tsx
├── store/
│   ├── index.ts                 # Combined store with temporal middleware
│   ├── flowSlice.ts             # nodes, edges, onNodesChange, onEdgesChange, onConnect
│   ├── uiSlice.ts               # selectedNodeId, panel states, layout direction
│   └── types.ts                 # Store type definitions
├── lib/
│   └── utils.ts                 # cn() utility (generated by shadcn init)
├── types/
│   └── callFlow.ts              # Call flow JSON types (placeholder)
├── App.tsx                      # Root: ReactFlowProvider + layout shell
├── main.tsx                     # Vite entry point
└── index.css                    # Tailwind + React Flow + shadcn theme CSS
```

**Rationale:** Only create files needed for Phase 1 success criteria. The `store/` directory uses the slices pattern from the start so Phase 2+ can add slices without refactoring. The `types/` directory is a placeholder that Phase 2 will populate with call flow types.

### Pattern 1: Zustand Store with Slices + Temporal Middleware

**What:** All application state lives in a single Zustand store, organized into feature slices. Zundo's `temporal` middleware wraps the store for undo/redo. Components subscribe via `useShallow` selectors.

**When to use:** Always for React Flow apps. React Flow officially recommends Zustand because custom nodes need direct store access.

**Example:**

```typescript
// store/types.ts
import type { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';

export interface FlowSlice {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
}

export interface UiSlice {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
}

export type AppState = FlowSlice & UiSlice;
```

```typescript
// store/flowSlice.ts
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { StateCreator } from 'zustand';
import type { AppState, FlowSlice } from './types';

export const createFlowSlice: StateCreator<
  AppState,  // Full combined type
  [],        // Middleware mutators (set/get)
  [],        // Middleware mutators (store API)
  FlowSlice  // This slice's return type
> = (set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) =>
    set({ edges: addEdge(connection, get().edges) }),
});
```

```typescript
// store/index.ts
import { create } from 'zustand';
import { temporal } from 'zundo';
import { createFlowSlice } from './flowSlice';
import { createUiSlice } from './uiSlice';
import type { AppState } from './types';

export const useAppStore = create<AppState>()(
  temporal(
    (...a) => ({
      ...createFlowSlice(...a),
      ...createUiSlice(...a),
    }),
    {
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
      limit: 100,
    }
  )
);
```

**Source:** [Zustand slices pattern](https://deepwiki.com/pmndrs/zustand/7.1-slices-pattern), [Zundo temporal middleware](https://github.com/charkour/zundo), [React Flow state management](https://reactflow.dev/learn/advanced-use/state-management)

### Pattern 2: ReactFlowProvider at App Root

**What:** Wrap the entire editor layout (canvas + all sibling panels) in a single `<ReactFlowProvider>` so any component can use React Flow hooks (`useReactFlow`, `screenToFlowPosition`, `fitView`).

**When to use:** Always. If sibling components (toolbar, sidebar, property panel) are outside the provider, they cannot access React Flow's context and will throw runtime errors.

**Example:**

```typescript
// App.tsx
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FlowCanvas } from './components/canvas/FlowCanvas';

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex">
        {/* Sidebar placeholder - Phase 5 */}
        <div className="flex-1">
          <FlowCanvas />
        </div>
        {/* Property panel placeholder - Phase 4 */}
      </div>
    </ReactFlowProvider>
  );
}
```

**Source:** [React Flow hooks and providers](https://reactflow.dev/learn/advanced-use/hooks-providers), [ReactFlowProvider example](https://reactflow.dev/examples/misc/provider)

### Pattern 3: CSS Import Order (Critical)

**What:** React Flow's CSS must be imported in the correct order relative to Tailwind. Tailwind's Preflight reset can strip React Flow's base styles if loaded after.

**Correct order in `src/index.css`:**

```css
/* 1. React Flow base styles FIRST */
@import "@xyflow/react/dist/style.css";

/* 2. Tailwind CSS */
@import "tailwindcss";

/* 3. Animation utilities for shadcn */
@import "tw-animate-css";

/* 4. shadcn theme CSS variables */
@import "shadcn/tailwind.css";

/* 5. Tailwind v4 dark mode variant */
@custom-variant dark (&:is(.dark *));

/* 6. Theme configuration */
@theme inline {
  /* shadcn color variables mapped to Tailwind */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... full theme block from shadcn init ... */
}

/* 7. Base layer */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Source:** [React Flow theming docs](https://reactflow.dev/learn/customization/theming), [shadcn/ui manual installation](https://ui.shadcn.com/docs/installation/manual)

### Anti-Patterns to Avoid

- **Defining `nodeTypes` inside a component:** Creates a new object reference every render, causing React Flow to unmount/remount ALL custom nodes. Define at module scope or in a separate file.
- **Using `useState` for nodes/edges:** Cannot integrate zundo for undo/redo. Cannot access state from custom nodes without prop drilling. Use Zustand from day one.
- **Missing `ReactFlowProvider`:** Sidebar and toolbar components cannot use `useReactFlow()`. Wrap at the app root.
- **React Flow container with no height:** The canvas collapses to 0 height. Every ancestor must propagate height. Use `h-screen` on root + `flex-1` on canvas container.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Node state management | Custom useState + context for nodes/edges | Zustand + `applyNodeChanges`/`applyEdgeChanges` | React Flow's helper functions handle all change types (position, selection, removal, dimensions). Rolling your own misses edge cases. |
| CSS class merging | String concatenation for conditional classes | `cn()` utility from shadcn (clsx + tailwind-merge) | Handles Tailwind class conflicts (e.g., `p-4` vs `p-2`) correctly. |
| Component variants | Inline conditional styling | class-variance-authority (CVA) | Type-safe variant API used by all shadcn components. |
| Undo/redo infrastructure | Custom undo stack | zundo `temporal` middleware | Sub-700 bytes, handles partialize, throttling, state diffing. Install now even though feature is Phase 5. |
| Path aliases | Relative imports (`../../lib/utils`) | `@/` alias via tsconfig paths + vite resolve | shadcn/ui requires `@/` alias. Cleaner imports across the project. |

## Common Pitfalls

### Pitfall 1: React Flow Container Has Zero Height

**What goes wrong:** The React Flow canvas renders as invisible because its parent container collapses to 0 height.
**Why it happens:** CSS `height: 100%` only works if every ancestor has explicit height. Flex layouts without `flex-1` collapse empty containers.
**How to avoid:** Use `h-screen` on the outermost div. Use `flex-1` on the canvas container. Test by adding a temporary red border.
**Warning signs:** Console warning "The React Flow parent container needs a width and a height"; blank white area; nodes exist in React DevTools but are not visible.

### Pitfall 2: Wrong CSS Import Path or Order

**What goes wrong:** Edges invisible, background pattern missing, controls broken.
**Why it happens:** (a) Using old `reactflow/dist/style.css` path instead of `@xyflow/react/dist/style.css`; (b) Tailwind's Preflight reset strips React Flow styles when loaded first.
**How to avoid:** Import `@xyflow/react/dist/style.css` BEFORE `@import "tailwindcss"` in index.css. Verify edges are visible (SVG paths), not just nodes.
**Warning signs:** Nodes visible but edges invisible; background dots missing; controls look broken.

### Pitfall 3: Using React Flow Hooks Outside ReactFlowProvider

**What goes wrong:** Runtime error: "useReactFlow must be used within a ReactFlowProvider."
**Why it happens:** React Flow uses React Context. Sibling components (toolbar, sidebar) outside the provider cannot access it.
**How to avoid:** Wrap the entire editor layout in `<ReactFlowProvider>` at the app root, not just the canvas.

### Pitfall 4: tsconfig Path Aliases Not in Both Files

**What goes wrong:** `@/` imports fail at build time or in IDE.
**Why it happens:** Vite splits TypeScript config into `tsconfig.json` and `tsconfig.app.json`. Path aliases must be in BOTH files, plus `vite.config.ts` needs a `resolve.alias` entry.
**How to avoid:** Add `baseUrl` and `paths` to both tsconfig files. Add `resolve.alias` mapping `@` to `./src` in vite.config.ts.

### Pitfall 5: shadcn Init Before Tailwind Is Configured

**What goes wrong:** shadcn CLI fails or generates v3-style config.
**Why it happens:** shadcn init detects the Tailwind version from installed packages and CSS config. If Tailwind v4 + `@tailwindcss/vite` are not set up first, it may generate incompatible output.
**How to avoid:** Strict ordering: (1) install dependencies, (2) configure vite.config.ts with `@tailwindcss/vite` plugin, (3) set up path aliases, (4) create initial CSS file with `@import "tailwindcss"`, (5) THEN run `npx shadcn@latest init`.

## Code Examples

### Vite Configuration (vite.config.ts)

```typescript
// Source: shadcn/ui Vite installation + @tailwindcss/vite docs
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### tsconfig.json Path Aliases

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Note: Also add the same `baseUrl` and `paths` to `tsconfig.app.json`.

### FlowCanvas Component

```typescript
// Source: React Flow quick start + Zustand integration guide
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store';

export function FlowCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useAppStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      onNodesChange: s.onNodesChange,
      onEdgesChange: s.onEdgesChange,
      onConnect: s.onConnect,
    }))
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
```

### shadcn components.json (for Vite + Tailwind v4)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### cn() Utility (lib/utils.ts)

```typescript
// Source: shadcn/ui manual installation
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `reactflow` package | `@xyflow/react` | v12 (2024) | Must use new import path for CSS and components |
| `tailwind.config.js` | CSS-first config with `@theme` | Tailwind v4 (2025) | No JS config file. All customization in CSS. |
| `tailwindcss-animate` plugin | `tw-animate-css` CSS import | Tailwind v4 (2025) | Old plugin incompatible with v4's architecture |
| `node.width` / `node.height` | `node.measured.width` / `node.measured.height` | React Flow v12 | Old properties return `undefined` in v12 |
| Named import `useNodesState` | Use Zustand store directly | React Flow v12 recommendation | `useNodesState` still works but Zustand is recommended for non-trivial apps |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (latest, Vite-native) |
| Config file | `vitest.config.ts` (or inline in `vite.config.ts`) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map

Since Phase 1 is infrastructure, validation is primarily smoke tests verifying the scaffold works:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Vite dev server starts | smoke | `npx vite build` (build succeeds = valid config) | No -- Wave 0 |
| INFRA-02 | Zustand store has nodes/edges/handlers | unit | `npx vitest run src/store/__tests__/store.test.ts -t "store"` | No -- Wave 0 |
| INFRA-03 | TypeScript compiles with zero errors | smoke | `npx tsc --noEmit` | N/A (built-in) |
| INFRA-04 | ReactFlowProvider wraps app | unit | `npx vitest run src/__tests__/App.test.tsx -t "provider"` | No -- Wave 0 |
| INFRA-05 | shadcn button renders | unit | `npx vitest run src/components/ui/__tests__/button.test.tsx` | No -- Wave 0 |

### Sampling Rate

- **Per task commit:** `npx tsc --noEmit && npx vitest run`
- **Per wave merge:** `npx tsc --noEmit && npx vitest run`
- **Phase gate:** Full suite green + `npm run dev` visual verification

### Wave 0 Gaps

- [ ] `vitest.config.ts` -- Vitest configuration with jsdom environment
- [ ] `src/store/__tests__/store.test.ts` -- Verifies store has required fields and handlers
- [ ] `src/__tests__/App.test.tsx` -- Verifies ReactFlowProvider wraps the app
- [ ] `src/components/ui/__tests__/button.test.tsx` -- Verifies shadcn button renders
- [ ] Dev dependencies: `vitest @testing-library/react @testing-library/dom jsdom`

## Open Questions

1. **shadcn `init` CLI interactive prompts**
   - What we know: `npx shadcn@latest init` prompts for style, color, etc. The `-t vite` flag may scaffold everything automatically.
   - What's unclear: Whether the `-t vite` flag creates the full project or just configures an existing one. The manual installation path is documented and reliable.
   - Recommendation: Use the standard `npx shadcn@latest init` on an already-configured Vite project. If it asks questions, choose: style=default, baseColor=neutral, cssVariables=yes, rsc=false. Fallback to manual installation (documented above) if CLI misbehaves.

2. **React Flow CSS import with Tailwind v4 `@import` syntax**
   - What we know: React Flow requires `@xyflow/react/dist/style.css`. Tailwind v4 uses `@import "tailwindcss"` syntax in CSS.
   - What's unclear: Whether `@import "@xyflow/react/dist/style.css"` works as a CSS `@import` inside index.css with Vite's CSS pipeline, or if it must be a JS import in main.tsx.
   - Recommendation: Try CSS `@import` first (cleaner). If it does not resolve, use JS import in main.tsx (`import '@xyflow/react/dist/style.css'`) before the CSS entry point.

## Sources

### Primary (HIGH confidence)
- [shadcn/ui Manual Installation](https://ui.shadcn.com/docs/installation/manual) -- Complete CSS setup with Tailwind v4 theme variables, `cn()` utility, components.json format
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite) -- Vite-specific setup steps, path alias config
- [React Flow Installation](https://reactflow.dev/learn/getting-started/installation-and-requirements) -- CSS import path, container sizing requirement
- [React Flow Quick Start](https://reactflow.dev/learn) -- Basic ReactFlow component setup with controlled state
- [React Flow State Management](https://reactflow.dev/learn/advanced-use/state-management) -- Official Zustand integration pattern
- [React Flow Hooks and Providers](https://reactflow.dev/learn/advanced-use/hooks-providers) -- ReactFlowProvider wrapping requirement
- [Zundo GitHub](https://github.com/charkour/zundo) -- temporal middleware API, partialize, handleSet, limit options
- [Zustand Slices Pattern](https://deepwiki.com/pmndrs/zustand/7.1-slices-pattern) -- StateCreator typing, combining slices, cross-slice access
- [Vite Getting Started](https://vite.dev/guide/) -- `npm create vite@latest` with `react-ts` template

### Secondary (MEDIUM confidence)
- [Vitest Getting Started](https://vitest.dev/guide/) -- Vitest setup with Vite
- [@xyflow/react npm](https://www.npmjs.com/package/@xyflow/react) -- v12.10.x verified March 2026

### Project Research (HIGH confidence)
- `.planning/research/STACK.md` -- Full version compatibility matrix, installation commands
- `.planning/research/ARCHITECTURE.md` -- Project structure, store architecture, component responsibilities
- `.planning/research/PITFALLS.md` -- Phase 1 pitfalls: container dimensions, CSS order, provider wrapping, nodeTypes

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All versions verified against npm and official docs. Compatibility matrix confirmed in STACK.md.
- Architecture: HIGH -- Patterns from official React Flow + Zustand guides, validated against project architecture research.
- Pitfalls: HIGH -- Pitfalls sourced from official React Flow troubleshooting docs and community issues.
- CSS setup: MEDIUM -- React Flow CSS import order with Tailwind v4 `@import` syntax is a novel combination; may need JS import fallback.

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable stack, 30-day window)
