# Stack Research

**Domain:** Node-based flow editor / visual JSON editor (client-side SPA)
**Researched:** 2026-03-12
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.2.x | UI framework | Current stable. Needed for @xyflow/react 12.10+ which depends on Zustand v5 (uses `useSyncExternalStore` for React 19 concurrent rendering). |
| @xyflow/react | 12.10.x | Node graph canvas | The dominant React library for node-based UIs. No serious competitor in the React ecosystem for this use case. 24K+ GitHub stars, active maintenance, built-in drag/drop, zoom/pan, minimap, handles, edge routing. Used by Stripe, Zapier, and others for flow editors. |
| Vite | 7.x | Build tool / dev server | Purely client-side SPA with no SSR/API needs -- Next.js would add unnecessary complexity. Vite is 5x faster cold start and HMR is near-instant. The @tailwindcss/vite plugin integrates natively. |
| TypeScript | 5.9.x | Type safety | Mandatory for a project this size. @xyflow/react ships complete type definitions. Use 5.9 stable -- TS 6.0 is still RC as of March 2026. |
| Tailwind CSS | 4.2.x | Styling | Ground-up rewrite with CSS-first config (no tailwind.config.js). 5x faster full builds, 100x faster incremental. shadcn/ui fully supports Tailwind v4. Use @tailwindcss/vite plugin. |
| shadcn/ui | latest (CLI v4) | UI component system | Not a dependency -- copies component source into your project. Gives you Radix UI primitives + Tailwind styling for panels, dialogs, dropdowns, buttons, sheets, and tabs. Perfect for the property panel, toolbar, and sidebar palette. |
| Zustand | 5.0.x | State management | React Flow's officially recommended state manager (it uses Zustand internally). Minimal API, no boilerplate, works with React 19 via `useSyncExternalStore`. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zundo | 2.3.x | Undo/redo middleware for Zustand | Wrap the flow store with `temporal` middleware. Gives `undo()`, `redo()`, `clear()` in <700 bytes. Required for the undo/redo feature. |
| @dagrejs/dagre | 2.0.x | Directed graph auto-layout | Compute node positions for top-to-bottom and left-to-right layouts. Use the `@dagrejs/dagre` scoped package (not the deprecated `dagre` package). Sufficient for DAG/tree structures -- ELKjs is overkill here. |
| json-edit-react | 1.29.x | Inline JSON tree editor | Property panel fallback editor for any JSON field not covered by structured inputs. Supports theming, drag-drop reordering, search/filter, inline editing. Self-contained -- no external UI dependency. |
| lucide-react | 0.577.x | Icon library | shadcn/ui's default icon set. Tree-shakeable, so only imported icons hit the bundle. Consistent design language with the rest of the UI. |
| clsx | 2.x | Conditional class joining | Used inside the `cn()` utility function that shadcn/ui generates. Combines with tailwind-merge. |
| tailwind-merge | 2.x | Tailwind class deduplication | Resolves conflicting Tailwind classes (e.g., `p-4` vs `p-2`). Required by shadcn/ui's `cn()` utility. |
| class-variance-authority | 0.7.x | Component variant API | Type-safe variant definitions for custom components. Used by shadcn/ui components internally. Installed automatically by `shadcn init`. |
| tw-animate-css | latest | Tailwind v4 animation utilities | Replaces deprecated `tailwindcss-animate`. Required by shadcn/ui for accordion, dialog, and sheet animations. CSS import, not a JS plugin. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| @vitejs/plugin-react | 5.x | Vite React integration | Fast Refresh, JSX transform. Install as dev dependency. |
| @tailwindcss/vite | 4.2.x | Tailwind CSS Vite plugin | Native Vite integration for Tailwind v4. Replaces PostCSS-based setup. |
| ESLint | 9.x | Linting | Use flat config (eslint.config.js). ESLint 10 dropped eslintrc entirely -- stay on 9.x for now for broader plugin compatibility unless already on 10. |
| typescript-eslint | 8.x | TypeScript ESLint rules | Flat config compatible. Provides type-aware linting. |
| Prettier | 3.x | Code formatting | Use prettier-plugin-tailwindcss for automatic class sorting. |

## Installation

```bash
# Core
npm install react react-dom @xyflow/react zustand zundo @dagrejs/dagre json-edit-react lucide-react clsx tailwind-merge class-variance-authority tw-animate-css

# Dev dependencies
npm install -D typescript@~5.9 vite @vitejs/plugin-react @tailwindcss/vite tailwindcss eslint @eslint/js typescript-eslint prettier prettier-plugin-tailwindcss @types/react @types/react-dom

# Initialize shadcn/ui (after Vite + Tailwind are configured)
npx shadcn@latest init
```

**Scaffolding shortcut:**
```bash
# Create new Vite + React + TS project
npm create vite@latest visualizer -- --template react-ts
cd visualizer
npm install
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| @xyflow/react | Rete.js 2.x | Only if you need Angular/Vue/Svelte support or a visual scripting engine with built-in execution. Rete is more complex, has a steeper learning curve, and less React-specific documentation. |
| @xyflow/react | JsPlumb Toolkit | Only if you need enterprise licensing/support. Commercial product, not OSS. More verbose API. |
| @xyflow/react | litegraph.js | Never for this project. Canvas-based (not React), no TypeScript types, poor DX. Designed for shader/compute graphs, not flow editors. |
| Zustand | Redux Toolkit | Only if team already uses Redux. Zustand is simpler, React Flow uses it internally, and zundo integrates natively for undo/redo. |
| Zustand | Jotai | Only if state is primarily atomic/independent values. Flow editor state is highly interconnected (nodes reference edges, edges reference nodes) -- Zustand's single store is a better fit. |
| @dagrejs/dagre | ELKjs (@nicolo-ribaudo/elkjs-wasm) | Only if you need advanced layout algorithms (layered with port constraints, force-directed, stress). ELKjs is 200KB+ WASM, async API, and overkill for DAG layout. |
| @dagrejs/dagre | d3-hierarchy | Only for strict tree layouts. Cannot handle DAGs with multiple parents or cross-links, which call flows have. |
| Vite | Next.js | Only if you need SSR, API routes, or SEO. This is an internal tool SPA -- Next.js adds routing framework overhead, server dependency, and build complexity for zero benefit. |
| shadcn/ui | Radix UI (direct) | Only if you want full control without any Tailwind styling starting point. shadcn/ui wraps Radix anyway -- you get the same primitives with a styled starting point you can modify. |
| json-edit-react | @monaco-editor/react | Only if you want a full code editor experience (syntax highlighting, intellisense). Monaco is 2MB+ and overkill for a property panel. json-edit-react is purpose-built for structured JSON editing at ~30KB. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `reactflow` (old package name) | Deprecated. Renamed to `@xyflow/react` in v12. The old package will not receive updates. | `@xyflow/react` |
| `dagre` (unscoped package) | Unmaintained original. The `@dagrejs/dagre` scoped package is the actively maintained fork with v2.0 improvements. | `@dagrejs/dagre` |
| `tailwindcss-animate` | Deprecated for Tailwind v4. Uses legacy JS plugin system incompatible with Tailwind v4's CSS-first architecture. | `tw-animate-css` |
| `react-router-dom` | Merged into `react-router` in v7. Importing from `react-router-dom` still works but is unnecessary. | `react-router` (if routing is ever needed -- currently not needed for this SPA) |
| Create React App (CRA) | Officially deprecated. Slow builds, no active maintenance, lacks modern features. | Vite |
| Material UI / Ant Design | Heavy, opinionated component libraries that conflict with Tailwind's utility-first approach. Massive bundle size. Difficult to customize to match a custom design. | shadcn/ui + Tailwind CSS |
| Redux + redux-undo | Massive boilerplate for this use case. Zustand + zundo achieves the same with 1/10th the code. React Flow already uses Zustand internally -- mixing Redux creates two state systems. | Zustand + zundo |
| CSS Modules / styled-components | Tailwind v4 is the industry standard for utility-first styling. CSS-in-JS has performance overhead at runtime. CSS Modules fragment styling across files. | Tailwind CSS |

## Stack Patterns by Variant

**If the flow editor needs to support very large graphs (200+ nodes):**
- Enable React Flow's `nodesDraggable={false}` during layout computation
- Use `createWithEqualityFn` from Zustand with `shallow` comparison to prevent cascading re-renders
- Wrap all custom node components in `React.memo`
- Use `useShallow` selectors when selecting multiple store fields
- Consider virtualizing the node list (React Flow handles this internally for off-screen nodes)

**If dark mode theming is needed (it is per requirements):**
- React Flow v12 has built-in dark mode via CSS class `dark` on `<ReactFlow>`
- shadcn/ui supports dark mode natively via Tailwind's `dark:` variant
- Tailwind v4 uses CSS `@custom-variant dark (&:is(.dark *))` pattern
- json-edit-react v1.29 supports theming -- pass a dark theme object

**If the property panel needs complex form validation:**
- Do NOT add a form library for v1. The property panel edits JSON properties directly via controlled inputs
- If validation becomes necessary later, use Zod + React Hook Form (shadcn/ui has form components built on these)

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @xyflow/react@12.10.x | react@19.x, zustand@5.x | v12.10+ updated peer deps to support React 19 via Zustand v5's `useSyncExternalStore` |
| zustand@5.0.x | react@18.x or react@19.x | v5 dropped React <18 support, requires `useSyncExternalStore` (built into React 18+) |
| zundo@2.3.x | zustand@5.x | zundo 2.x is compatible with Zustand 5. Uses the `temporal` middleware pattern. |
| shadcn/ui (CLI v4) | tailwindcss@4.x, react@19.x | CLI v4 (March 2026) generates Tailwind v4-compatible components. Uses tw-animate-css instead of tailwindcss-animate. |
| @tailwindcss/vite@4.2.x | vite@7.x, tailwindcss@4.2.x | Version-locked with tailwindcss. Install same minor version. |
| json-edit-react@1.29.x | react@18.x or react@19.x | No peer dependency issues. Standalone component. |
| @dagrejs/dagre@2.0.x | (standalone) | Pure JS library, no React dependency. Works with any framework. |

## Key Architecture Decisions Driven by Stack

1. **Single Zustand store for all flow state.** Nodes, edges, selected items, UI panels, and undo history all live in one store wrapped with `temporal` middleware. This is React Flow's recommended pattern and enables zundo undo/redo across all mutations.

2. **No routing library needed.** This is a single-view SPA. The entire app is one canvas with collapsible panels. Adding react-router would be unnecessary complexity. If multi-file editing or tabs are added later, reconsider.

3. **shadcn/ui components are owned code, not dependencies.** Components are copied into `src/components/ui/`. They can be freely modified for the property panel, toolbar, and sidebar without worrying about upstream breaking changes.

4. **Tailwind v4 CSS-first configuration.** No `tailwind.config.js` file. All customization (colors, spacing, animations) lives in `src/index.css` via `@theme` blocks. This is a significant change from v3.

## Sources

- [@xyflow/react npm](https://www.npmjs.com/package/@xyflow/react) -- v12.10.1, verified March 2026 (HIGH confidence)
- [React Flow State Management Guide](https://reactflow.dev/learn/advanced-use/state-management) -- Official Zustand integration pattern (HIGH confidence)
- [React Flow Performance Guide](https://reactflow.dev/learn/advanced-use/performance) -- Memoization and useShallow patterns (HIGH confidence)
- [zustand npm](https://www.npmjs.com/package/zustand) -- v5.0.11 (HIGH confidence)
- [Zustand v5 Announcement](https://pmnd.rs/blog/announcing-zustand-v5) -- useSyncExternalStore migration (HIGH confidence)
- [zundo GitHub](https://github.com/charkour/zundo) -- v2.3.0, temporal middleware API (HIGH confidence)
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) -- CSS-first architecture, v4.2.1 current (HIGH confidence)
- [shadcn/ui Vite Installation](https://ui.shadcn.com/docs/installation/vite) -- Tailwind v4 + Vite setup steps (HIGH confidence)
- [shadcn/ui Tailwind v4 Migration](https://ui.shadcn.com/docs/tailwind-v4) -- tw-animate-css replaces tailwindcss-animate (HIGH confidence)
- [@dagrejs/dagre npm](https://www.npmjs.com/package/@dagrejs/dagre) -- v2.0.4 (HIGH confidence)
- [json-edit-react GitHub](https://github.com/CarlosNZ/json-edit-react) -- v1.29.0 (HIGH confidence)
- [React Flow + Zustand v5 + React 19 compatibility](https://x.com/xyflowdev/status/1877044785485087175) -- Official xyflow confirmation (HIGH confidence)
- [Vite releases](https://vite.dev/releases) -- v7.3.1 current (HIGH confidence)
- [TypeScript 5.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html) -- v5.9.3 stable, TS 6.0 RC available but not yet stable (HIGH confidence)
- [ESLint v10.0.0 release](https://eslint.org/blog/2026/02/eslint-v10.0.0-released/) -- Flat config now mandatory (MEDIUM confidence)

---
*Stack research for: Node-based flow editor / visual JSON editor*
*Researched: 2026-03-12*
