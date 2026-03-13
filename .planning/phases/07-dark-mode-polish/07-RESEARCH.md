# Phase 7: Dark Mode & Polish - Research

**Researched:** 2026-03-13
**Domain:** Dark mode theming, collapsible panels, responsive layout, production polish
**Confidence:** HIGH

## Summary

Phase 7 adds dark mode support, collapsible side panels, responsive layout, and a final production quality pass. The project already has 90% of the dark mode infrastructure in place: Tailwind v4 with `@custom-variant dark (&:is(.dark *))`, complete `:root` and `.dark` CSS variable palettes in `index.css`, and shadcn/ui components that include `dark:` variant classes. What remains is adding the ThemeProvider (a small React context that toggles the `.dark` class on `<html>`), a toggle button in the toolbar, and propagating the theme to two subsystems that do not use CSS variables: React Flow (needs `colorMode` prop) and json-edit-react (needs theme object swap).

The StepNode component and ConditionalEdge both use hardcoded light-mode colors (e.g., `bg-white`, `bg-blue-50`, hex stroke colors) that must be updated to respect dark mode. The ROLE_COLORS object in `nodeClassify.ts` and the EDGE_STYLES/LABEL_STYLES in `ConditionalEdge.tsx` are the two spots that need dark-mode-aware alternatives.

For collapsible panels, the NodePalette and PropertyPanel already render conditionally or as fixed-width sidebars. Adding collapse state to UiSlice plus toggle buttons is straightforward. Responsive behavior follows naturally: on small screens, panels default to collapsed. The production build currently works but has a large chunk warning (693 KB) and existing TypeScript errors in test files that should be addressed in the final polish pass.

**Primary recommendation:** Use the official shadcn/ui Vite dark mode pattern (ThemeProvider context + localStorage + `useTheme` hook), pass derived `colorMode` to React Flow, and swap json-edit-react theme objects based on current theme.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | Dark mode support via shadcn theme | ThemeProvider pattern from shadcn/ui Vite docs; CSS variables already defined in index.css; React Flow colorMode prop; json-edit-react theme imports |
| UI-05 | Property panel and node palette are collapsible | UiSlice state extension with `paletteOpen`/`propertyPanelOpen` booleans; toggle buttons using lucide icons |
| UI-06 | Responsive layout adapts to smaller screens | Tailwind responsive breakpoints; panels default collapsed below md breakpoint; CSS media queries for toolbar wrapping |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | ^4.2.1 | Utility-first CSS with dark mode variant | Already configured with `@custom-variant dark` |
| shadcn/ui | v4 (base-nova) | Component library with dark mode classes | Already initialized; Button etc. include `dark:` variants |
| @xyflow/react | ^12.10.1 | Flow canvas with built-in colorMode prop | Accepts `'light' | 'dark' | 'system'` |
| json-edit-react | ^1.29.0 | JSON editor with importable theme objects | Exports `githubDarkTheme`, `monoDarkTheme`, etc. |
| lucide-react | ^0.577.0 | Icons (Sun, Moon, PanelLeftClose, etc.) | Already in use for toolbar icons |
| zustand | ^5.0.11 | State management for panel collapse state | UiSlice already handles selectedNodeId and jsonPreviewOpen |

### New Components to Install
| Component | Install Command | Purpose |
|-----------|----------------|---------|
| dropdown-menu | `npx shadcn@latest add dropdown-menu` | Theme toggle (Light/Dark/System) dropdown |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom ThemeProvider | next-themes | next-themes is Next.js-centric; the shadcn Vite pattern is a 40-line context that does the same thing without extra dependency |
| DropdownMenu toggle | Simple button cycle | Dropdown gives explicit Light/Dark/System choice; button requires users to guess cycle order |
| CSS-only responsive | Container queries | Browser support for container queries is good but Tailwind media queries are simpler and sufficient for this layout |

## Architecture Patterns

### Recommended File Structure
```
src/
  components/
    theme-provider.tsx        # NEW: ThemeProvider context + useTheme hook
    toolbar/
      ModeToggle.tsx          # NEW: Sun/Moon dropdown theme toggle
      Toolbar.tsx             # MODIFIED: add ModeToggle
    canvas/
      FlowCanvas.tsx          # MODIFIED: pass colorMode prop to ReactFlow
      StepNode.tsx            # MODIFIED: dark mode aware colors
      ConditionalEdge.tsx     # MODIFIED: dark mode aware styles
    palette/
      NodePalette.tsx         # MODIFIED: collapsible wrapper
    panel/
      PropertyPanel.tsx       # MODIFIED: collapsible wrapper
      JsonFallbackEditor.tsx  # MODIFIED: theme swap for json-edit-react
  lib/
    nodeClassify.ts           # MODIFIED: dark mode aware ROLE_COLORS
  store/
    uiSlice.ts                # MODIFIED: add paletteOpen, propertyPanelOpen
    types.ts                  # MODIFIED: add new UiSlice fields
  App.tsx                     # MODIFIED: wrap in ThemeProvider, wire panel collapse
  index.css                   # MINOR: may need dark mode overrides for React Flow controls
```

### Pattern 1: shadcn/ui Vite ThemeProvider
**What:** A React context that reads theme from localStorage, applies `.dark` class to `<html>`, and exposes `setTheme`.
**When to use:** All Vite (non-Next.js) projects using shadcn/ui.
**Example:**
```typescript
// Source: https://ui.shadcn.com/docs/dark-mode/vite
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches ? "dark" : "light"
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
```

### Pattern 2: React Flow colorMode Integration
**What:** Pass the resolved theme (not "system") to React Flow's `colorMode` prop.
**When to use:** Whenever the app has a dark mode toggle and uses React Flow.
**Example:**
```typescript
// Inside FlowCanvas, derive colorMode from useTheme()
import { useTheme } from '@/components/theme-provider';
import type { ColorMode } from '@xyflow/react';

function useResolvedColorMode(): ColorMode {
  const { theme } = useTheme();
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

// Then in JSX:
<ReactFlow colorMode={colorMode} ... />
```
React Flow's `.react-flow.dark` class auto-applies dark CSS variables for Background, Controls, MiniMap, handles, and selection.

### Pattern 3: json-edit-react Theme Swap
**What:** Import built-in dark theme and swap based on current color mode.
**When to use:** When json-edit-react renders inside a dark-mode-capable app.
**Example:**
```typescript
import { JsonEditor, githubDarkTheme, githubLightTheme } from 'json-edit-react';
import { useTheme } from '@/components/theme-provider';

function JsonFallbackEditor({ nodeId, step }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <JsonEditor
      data={step}
      theme={isDark ? githubDarkTheme : githubLightTheme}
      // ... other props
    />
  );
}
```
Available built-in themes: `defaultTheme`, `githubDarkTheme`, `githubLightTheme`, `monoDarkTheme`, `monoLightTheme`, `candyWrapperTheme`, `psychedelicTheme`.

### Pattern 4: Collapsible Panel with UiSlice State
**What:** Store panel open/closed state in Zustand UiSlice; render toggle buttons; conditionally render panel content.
**When to use:** Any sidebar that should be collapsible.
**Example:**
```typescript
// UiSlice additions
paletteOpen: boolean;
togglePalette: () => void;

// In App.tsx
{paletteOpen && <NodePalette />}

// Toggle button (e.g., in toolbar or as floating button)
<Button variant="outline" size="icon-sm" onClick={togglePalette}>
  <PanelLeft className="h-4 w-4" />
</Button>
```

### Pattern 5: Responsive Breakpoint Collapse
**What:** Use a `useMediaQuery` hook or Tailwind responsive classes to auto-collapse panels on small screens.
**When to use:** When panels should collapse by default on narrow viewports.
**Example:**
```typescript
// Simple useMediaQuery hook
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

// Usage: auto-collapse palette below md breakpoint
const isDesktop = useMediaQuery('(min-width: 768px)');
// Initialize paletteOpen based on isDesktop in useEffect
```

### Anti-Patterns to Avoid
- **Hardcoded hex colors in components:** StepNode uses `bg-white`, `bg-green-50`, etc. These MUST be replaced with Tailwind dark: variants or CSS variable references.
- **Hardcoded SVG stroke colors:** ConditionalEdge EDGE_STYLES uses hex colors like `#64748b`. These inline styles bypass Tailwind's dark mode. Use CSS variables or conditionally switch colors based on theme.
- **Storing theme in Zustand:** Theme state belongs in the ThemeProvider context (which uses localStorage). Zustand is for app state. Mixing them creates circular dependencies and SSR issues.
- **Forgetting React Flow colorMode:** Without passing `colorMode`, the Background, Controls, MiniMap, and default node styles remain light-colored even when the rest of the app is dark.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Theme persistence | Custom localStorage wrapper | shadcn ThemeProvider pattern | Handles system preference, localStorage, class toggle in ~40 lines |
| Theme toggle UI | Custom dropdown from scratch | shadcn DropdownMenu + ModeToggle pattern | Accessible, keyboard-navigable, matches existing UI |
| React Flow dark mode | Custom CSS overrides for RF elements | `colorMode` prop on ReactFlow | Built-in; handles Background, Controls, MiniMap, handles automatically |
| JSON editor dark theme | Custom CSS overrides | `githubDarkTheme` import from json-edit-react | Pre-built, tested, consistent styling |
| Media query detection | window.matchMedia polling | Simple `useMediaQuery` hook (6 lines) | Event-driven, cleanup on unmount |

**Key insight:** Dark mode support is 90% done via the existing CSS variable infrastructure. The remaining work is wiring the class toggle and handling the two components that bypass CSS variables (React Flow canvas elements and json-edit-react).

## Common Pitfalls

### Pitfall 1: StepNode Hardcoded Light Colors
**What goes wrong:** StepNode uses `bg-white`, `bg-green-50`, `bg-blue-50`, etc. In dark mode these remain bright white/pastel against a dark background.
**Why it happens:** StepNode was written before dark mode was considered. The ROLE_COLORS in `nodeClassify.ts` only define light-mode classes.
**How to avoid:** Add `dark:` variants to ROLE_COLORS. For example: `bg: 'bg-green-50 dark:bg-green-950'`. Also change `bg-white` to `bg-background` or `bg-card`.
**Warning signs:** Bright white nodes on dark canvas.

### Pitfall 2: ConditionalEdge Inline Stroke Colors
**What goes wrong:** EDGE_STYLES uses hardcoded hex strings (`#64748b`, `#3b82f6`, etc.) passed as inline `style={{ stroke }}`. Tailwind dark mode cannot reach inline styles.
**Why it happens:** React Flow edges require SVG stroke values as inline styles -- Tailwind classes don't work here.
**How to avoid:** Either (a) use CSS variables that change under `.dark` class, or (b) read the current theme via `useTheme()` and conditionally return different hex values from `getEdgeStyle()`. Option (b) is simpler since edge styles are already centralized.
**Warning signs:** Bright blue/orange edges on dark background with low contrast.

### Pitfall 3: LABEL_STYLES Hard-Coded Light Background
**What goes wrong:** Edge label badges use `bg-white`, `bg-blue-50`, etc. These remain bright in dark mode.
**Why it happens:** Same as StepNode -- written for light mode only.
**How to avoid:** Add `dark:` variant classes: `bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600`.

### Pitfall 4: React Flow Controls and MiniMap
**What goes wrong:** Without `colorMode` prop, React Flow Controls (zoom buttons) and MiniMap remain light-styled.
**Why it happens:** React Flow's built-in dark theme only activates when `colorMode="dark"` is explicitly passed.
**How to avoid:** Always pass `colorMode` derived from the ThemeProvider. The `.react-flow.dark` class triggers all RF CSS variable overrides automatically.

### Pitfall 5: localStorage Not Available in Tests
**What goes wrong:** Tests using ThemeProvider crash because `localStorage` is undefined or `window.matchMedia` is not implemented in jsdom.
**Why it happens:** jsdom has limited Web API support.
**How to avoid:** Mock `localStorage` and `window.matchMedia` in test setup or per-test. The existing test-setup.ts can be extended with a matchMedia mock.
**Warning signs:** `TypeError: window.matchMedia is not a function` in test output.

### Pitfall 6: Info Badges in StepNode
**What goes wrong:** Info badges use `bg-slate-100 text-slate-600` which becomes invisible in dark mode.
**Why it happens:** Hardcoded light-only Tailwind classes.
**How to avoid:** Change to `bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300`.

### Pitfall 7: Panel Collapse Breaking PropertyPanel nodeId Flow
**What goes wrong:** If PropertyPanel is collapsed while a node is selected, re-opening should show the selected node's properties.
**Why it happens:** If collapse simply unmounts the component, it works because `selectedNodeId` persists in store. But if collapse keeps the component mounted but hidden, scroll position may be lost.
**How to avoid:** Use conditional rendering (unmount when collapsed) rather than CSS `display:none`. The store's `selectedNodeId` ensures correct content on re-mount.

### Pitfall 8: Production Build Chunk Size
**What goes wrong:** Current build produces a 693 KB JS chunk (warning threshold is 500 KB).
**Why it happens:** All code in a single chunk. json-edit-react and @xyflow/react are large libraries.
**How to avoid:** Add `build.rollupOptions.output.manualChunks` to split vendor libraries. Or use dynamic `import()` for json-edit-react since it's only used when a node is selected.

## Code Examples

### ModeToggle Component (shadcn pattern for Vite)
```typescript
// Source: https://ui.shadcn.com/docs/dark-mode/vite
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm">
          <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Dark-Mode-Aware ROLE_COLORS
```typescript
export const ROLE_COLORS: Record<
  NodeRole,
  { border: string; bg: string; minimap: string }
> = {
  start:    { border: 'border-green-500', bg: 'bg-green-50 dark:bg-green-950', minimap: '#22c55e' },
  terminal: { border: 'border-red-500',   bg: 'bg-red-50 dark:bg-red-950',     minimap: '#ef4444' },
  error:    { border: 'border-orange-500', bg: 'bg-orange-50 dark:bg-orange-950', minimap: '#f97316' },
  normal:   { border: 'border-blue-500',  bg: 'bg-blue-50 dark:bg-blue-950',   minimap: '#3b82f6' },
};
```

### Dark-Mode-Aware LABEL_STYLES
```typescript
export const LABEL_STYLES: Record<string, string> = {
  next:      'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200',
  condition: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-200',
  timeout:   'bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-200',
  no_match:  'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300',
  intent:    'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200',
};
```

### Collapsible Panel Toggle in UiSlice
```typescript
// UiSlice extension
export interface UiSlice {
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  jsonPreviewOpen: boolean;
  toggleJsonPreview: () => void;
  paletteOpen: boolean;
  togglePalette: () => void;
}

// In createUiSlice:
paletteOpen: true,
togglePalette: () => set((s) => ({ paletteOpen: !s.paletteOpen })),
```

### matchMedia Mock for Tests
```typescript
// In test-setup.ts or individual test files
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| next-themes for all React apps | Built-in ThemeProvider for Vite; next-themes only for Next.js | shadcn v4 (March 2026) | No extra dependency for Vite projects |
| React Flow manual dark CSS | `colorMode` prop (RF 12+) | React Flow 12 (2024) | Automatic dark mode for all RF elements |
| json-edit-react theme strings | Import theme objects for tree-shaking | json-edit-react 1.19+ | Better bundle size; explicit imports |
| Tailwind v3 darkMode: 'class' | Tailwind v4 `@custom-variant dark` | Tailwind v4 (2025) | CSS-first configuration |

**Deprecated/outdated:**
- `darkMode: 'class'` in tailwind.config.js: Replaced by `@custom-variant dark (&:is(.dark *))` in CSS (already configured in this project)
- Tailwind v3 config file: This project uses Tailwind v4 CSS-first approach (no tailwind.config.js)

## Open Questions

1. **Edge stroke colors in dark mode**
   - What we know: EDGE_STYLES uses inline hex colors that bypass Tailwind dark mode. React Flow's `colorMode` does not affect custom edge component inline styles.
   - What's unclear: Whether CSS variables are cleaner than conditional JS. Both work.
   - Recommendation: Use conditional JS (read theme, return different hex values). Simpler than adding custom CSS variables just for 5 edge strokes. The edge component already centralizes colors in EDGE_STYLES.

2. **TypeScript errors in existing code**
   - What we know: `tsc -b` reports ~20 errors (mostly test files using `global`, StepNode rendering `unknown` as ReactNode, unused imports). These do NOT block vite build (which uses esbuild/SWC, not tsc).
   - What's unclear: Whether fixing these is in scope for this phase.
   - Recommendation: Fix the critical ones (StepNode `unknown` casts) as part of polish. Test file errors are less critical but easy to fix. Include in Plan 07-02 under production build verification.

3. **Chunk size optimization**
   - What we know: 693 KB single JS chunk. json-edit-react (~150 KB) and @xyflow/react (~350 KB) are the main contributors.
   - What's unclear: Whether code splitting is worth the complexity for an internal tool.
   - Recommendation: Add `manualChunks` to split vendor libs from app code. This is a one-liner in vite.config.ts and eliminates the build warning.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-01-a | ThemeProvider stores/retrieves theme from localStorage | unit | `npx vitest run src/components/__tests__/theme-provider.test.tsx -t "persists"` | Wave 0 |
| UI-01-b | Dark class applied to document root | unit | `npx vitest run src/components/__tests__/theme-provider.test.tsx -t "dark class"` | Wave 0 |
| UI-01-c | ModeToggle renders and switches themes | unit | `npx vitest run src/components/toolbar/__tests__/ModeToggle.test.tsx` | Wave 0 |
| UI-01-d | React Flow receives colorMode prop | unit | `npx vitest run src/components/canvas/__tests__/FlowCanvas.test.tsx -t "colorMode"` | Wave 0 |
| UI-01-e | json-edit-react receives dark theme | unit | `npx vitest run src/components/panel/__tests__/JsonFallbackEditor.test.tsx -t "dark"` | Wave 0 |
| UI-05-a | Palette toggle button collapses/expands | unit | `npx vitest run src/__tests__/App.test.tsx -t "palette collapse"` | Wave 0 |
| UI-05-b | Property panel has collapse toggle | unit | `npx vitest run src/__tests__/App.test.tsx -t "property panel collapse"` | Wave 0 |
| UI-06-a | Panels auto-collapse on narrow viewport | unit | `npx vitest run src/hooks/__tests__/useMediaQuery.test.ts` | Wave 0 |
| UI-06-b | Layout renders correctly at narrow width | unit | `npx vitest run src/__tests__/App.test.tsx -t "responsive"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + `npx tsc -b` clean (or documented exceptions) + `npx vite build` no errors

### Wave 0 Gaps
- [ ] `src/components/__tests__/theme-provider.test.tsx` -- covers UI-01-a, UI-01-b
- [ ] `src/components/toolbar/__tests__/ModeToggle.test.tsx` -- covers UI-01-c
- [ ] `src/hooks/__tests__/useMediaQuery.test.ts` -- covers UI-06-a
- [ ] `window.matchMedia` mock in `src/test-setup.ts` -- shared fixture for all theme tests
- [ ] Install dropdown-menu component: `npx shadcn@latest add dropdown-menu`

## Sources

### Primary (HIGH confidence)
- [shadcn/ui Vite dark mode docs](https://ui.shadcn.com/docs/dark-mode/vite) -- ThemeProvider pattern, ModeToggle component
- [React Flow colorMode type](https://reactflow.dev/api-reference/types/color-mode) -- `'light' | 'dark' | 'system'`
- [React Flow dark mode example](https://reactflow.dev/examples/styling/dark-mode) -- colorMode prop usage
- [React Flow theming docs](https://reactflow.dev/learn/customization/theming) -- CSS variables, `.react-flow.dark` class
- json-edit-react package source (local node_modules) -- confirmed exports: `githubDarkTheme`, `githubLightTheme`, `monoDarkTheme`, `monoLightTheme`, `candyWrapperTheme`, `psychedelicTheme`
- Project source code (all files read directly)

### Secondary (MEDIUM confidence)
- [shadcn/ui Vite dark mode docs](https://ui.shadcn.com/docs/dark-mode/vite) -- verified ModeToggle code pattern against actual shadcn v4 output

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and verified in node_modules
- Architecture: HIGH -- follows exact patterns from shadcn/ui official docs and React Flow docs
- Pitfalls: HIGH -- identified by direct code inspection of StepNode, ConditionalEdge, and nodeClassify
- Responsive: MEDIUM -- pattern is standard but specific breakpoints may need tuning during implementation

**Research date:** 2026-03-13
**Valid until:** 2026-04-13 (stable libraries, no fast-moving changes expected)
