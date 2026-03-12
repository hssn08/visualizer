# Technology Stack

**Analysis Date:** 2026-03-12

## Languages

**Primary:**
- TypeScript - Full application development with type safety
- JavaScript - Build scripts, hooks, Node.js utilities
- JSON - Configuration and data format

**Secondary:**
- CSS/SCSS - Styling (via Tailwind)
- HTML - Markup (via JSX/TSX)

## Runtime

**Environment:**
- Node.js (version specified in `.nvmrc` or package.json `engines` field)

**Package Manager:**
- npm (v10+)
- Lockfile: `package-lock.json` (expected)

## Frameworks

**Core:**
- Next.js 14+ (App Router) - React framework with server-side rendering, routing, and optimized builds
- React 18+ - UI library (dependency of Next.js)

**UI Components:**
- shadcn/ui (latest) - Accessible component library built on Radix UI and Tailwind CSS
- Radix UI - Headless UI primitives (transitive dependency via shadcn/ui)

**Node Graph Visualization:**
- @xyflow/react v12+ - React Flow library for interactive node/edge canvas, drag-and-drop, zooming, panning, minimap

**State Management:**
- Zustand - Lightweight state management for flow nodes, edges, UI state, and selected node tracking

**Auto Layout:**
- @dagrejs/dagre - Directed acyclic graph layout engine for computing optimal node positions

**JSON Editing:**
- json-edit-react - React component for inline JSON property editing with collapse, add, delete, drag-and-drop, search

**Icons:**
- lucide-react - SVG icon library (bundled with shadcn/ui)

**Styling:**
- Tailwind CSS v4 - Utility-first CSS framework (required by shadcn/ui)

**Testing:**
- Testing framework: Not yet specified in VIBE_CODING_PROMPT.md
- Options: Jest, Vitest (common with Next.js 14+)

**Build/Dev:**
- Next.js bundler (webpack) - Included in Next.js
- ESLint - Code linting (recommended for Next.js projects)
- Prettier - Code formatting (optional, recommended)

## Key Dependencies

**Critical:**
- @xyflow/react v12+ - Provides the entire interactive graph canvas and React Flow ecosystem
- zustand - State management for all flow operations and UI state
- @dagrejs/dagre - Layout computation for automatic node positioning
- json-edit-react - Full JSON property editing interface

**Infrastructure & UI:**
- next v14+ - Application framework and server
- react v18+ - Component library
- react-dom v18+ - DOM rendering
- @radix-ui/* - Headless component primitives (auto-installed via shadcn/ui)
- tailwindcss v4 - CSS framework

**Development:**
- typescript - Type checking and development
- tailwindcss - CSS framework CLI and compiler
- autoprefixer - PostCSS plugin for Tailwind
- postcss - CSS processing framework

## Configuration

**Environment:**
- No environment variables required for core functionality
- Optional: File import/export uses browser File APIs (no server config needed)
- Optional: Color theme and preferences can be stored in localStorage

**Build:**
- `next.config.js` - Next.js build and runtime configuration
- `tsconfig.json` - TypeScript compiler configuration
- `tailwind.config.ts` - Tailwind CSS theming and customization
- `postcss.config.js` - PostCSS plugins (Tailwind)
- `.eslintrc.json` or `.eslintrc.js` - ESLint rules (optional)
- `.prettierrc` - Prettier formatting rules (optional)

**shadcn/ui:**
- `components.json` - Configuration for component generation via `npx shadcn@latest init`

## Platform Requirements

**Development:**
- Node.js 18+ (recommended: 20 LTS)
- npm 10+
- Modern development machine (macOS, Linux, Windows WSL2)
- Code editor (VS Code recommended)

**Production:**
- Node.js runtime or Node-compatible serverless platform (Vercel, Netlify, AWS Lambda, Docker)
- Minimum RAM: 512MB
- Minimum CPU: 1 vCPU

**Browser Support:**
- Modern browsers with ES2020 support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Installation

**Initial project setup:**
```bash
npx create-next-app@latest flow-editor --typescript --tailwind --eslint --app --src-dir
cd flow-editor
npx shadcn@latest init
npx shadcn@latest add button card dialog input label tabs select separator scroll-area sheet sidebar tooltip badge
npm install @xyflow/react @dagrejs/dagre zustand json-edit-react lucide-react
```

**Development server:**
```bash
npm run dev
# Runs on http://localhost:3000
```

**Build for production:**
```bash
npm run build
npm start
```

## Notes

- The stack is intentionally modern and standard: Next.js 14, React 18, TypeScript, Tailwind v4
- Zustand is chosen over Redux/Context because it's simpler and recommended by React Flow maintainers
- @xyflow/react v12 (not v11) is required for the newer API including `screenToFlowPosition()` method
- No database layer is part of this stack — all operations are in-browser with JSON import/export
- No backend API integrations — file operations are client-side only
- Dark mode support is built-in via shadcn/ui theming

---

*Stack analysis: 2026-03-12*
