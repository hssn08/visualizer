# External Integrations

**Analysis Date:** 2026-03-12

## APIs & External Services

**Not Currently Integrated:**
- No third-party APIs are used in this application
- All operations are client-side JSON manipulation
- No external services are called

## Data Storage

**Databases:**
- Not used - This is a client-side only application

**File Storage:**
- Local filesystem only via browser File API
- Users import JSON files using file picker (`<input type="file">`)
- Users export JSON files via blob download (no server storage)

**Caching:**
- Browser localStorage (optional) - For user preferences and theme settings
- Session-based only

## Authentication & Identity

**Auth Provider:**
- Not used - No user authentication required
- Application is stateless and single-user (per browser session)

## Monitoring & Observability

**Error Tracking:**
- Not configured - Can be added later (e.g., Sentry)

**Logs:**
- Console logging only (development debugging)
- No server-side logs

## CI/CD & Deployment

**Hosting:**
- Designed for Vercel (Next.js first-class support)
- Can also deploy to: Netlify, AWS Amplify, Docker, self-hosted Node.js
- Environment: Stateless - no persistent state between deployments

**CI Pipeline:**
- Not configured yet - Can be added via:
  - GitHub Actions (for Next.js + TypeScript linting/build verification)
  - Vercel automatic deployments (recommended)

## Environment Configuration

**Required env vars:**
- None - Application requires no environment variables

**Optional env vars (for future enhancement):**
- None currently defined

**Secrets location:**
- Not applicable - No secrets required

## Webhooks & Callbacks

**Incoming:**
- None - Application has no server-side endpoints

**Outgoing:**
- None - Application has no external callbacks

## Browser APIs Used

**File I/O:**
- File API (`<input type="file">`) - For importing JSON files
- Blob API - For exporting JSON files
- URL.createObjectURL() - For generating download links

**Storage:**
- localStorage - For optional persistence of UI state (theme, layout preferences)
- sessionStorage - Temporary session data (not used by default)

**Canvas/Graphics:**
- Canvas API (via @xyflow/react) - For rendering the interactive graph canvas
- SVG (via React Flow) - For node and edge rendering

**Other:**
- requestAnimationFrame - For smooth animations and viewport fitting
- ResizeObserver (via React Flow) - For responsive canvas sizing

## Data Format

**Input/Output:**
- JSON (user imports and exports arbitrary JSON step-based flow structures)
- No validation against specific schema - Application is schema-agnostic
- Supports common flow patterns: `next`, `conditions`, `timeout_next`, `no_match_next`, `intent_detector_routes`

## CDN & Resource Loading

**No external CDN resources:**
- All JavaScript bundles included in application build
- Icons from lucide-react packaged locally
- No external CSS libraries loaded via CDN

## Third-Party Libraries (Included)

**React Flow Ecosystem:**
- @xyflow/react - Main library
- @xyflow/system - System utilities (transitive)
- reactflow-compat layer (if needed) - For v11 to v12 migration support (optional)

**State & Utilities:**
- zustand - State management
- immer - Immutable state patterns (transitive, optional dependency of zustand)

**Styling & UI:**
- tailwindcss - CSS framework
- class-variance-authority - CVA utility (used by shadcn/ui)
- clsx - Classname utility (used by shadcn/ui)

**Accessibility:**
- @radix-ui/* components - Headless UI with accessibility built-in

## Performance Considerations

**Bundle Size Impact:**
- @xyflow/react: ~60 KB gzipped
- zustand: ~2 KB gzipped
- @dagrejs/dagre: ~15 KB gzipped
- json-edit-react: ~25 KB gzipped
- Tailwind CSS: ~20 KB gzipped (after purge)
- Total estimated: ~120-150 KB gzipped for main bundle

**No external service calls** means no network latency for business logic.

## Security Considerations

**Client-Side Only:**
- No exposure of secrets or credentials
- All data processing happens in the browser
- JSON files are never sent to external servers
- Users have full control over their data

**Content Security Policy (CSP):**
- Can be configured in `next.config.js` if needed
- Not required for current functionality

## Future Integration Points

**If adding server functionality:**
- REST API endpoints in `src/app/api/` (Next.js API routes)
- Example: `/api/flows/save`, `/api/flows/list`, `/api/flows/[id]`

**If adding collaboration features:**
- WebSocket support via library like `socket.io`
- Real-time sync library like `yjs` or `automerge`

**If adding advanced features:**
- AI/ML: OpenAI API for intelligent step suggestions
- Validation: JSON schema validation via `ajv`
- Execution: Flow execution engine (external service or embedded)

---

*Integration audit: 2026-03-12*
