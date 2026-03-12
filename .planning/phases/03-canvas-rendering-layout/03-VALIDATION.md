---
phase: 3
slug: canvas-rendering-layout
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + jsdom + @testing-library/react 16.3.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter verbose` |
| **Full suite command** | `npx vitest run --reporter verbose` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter verbose`
- **After every plan wave:** Run `npx vitest run --reporter verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | NODE-01 | unit | `npx vitest run src/components/canvas/__tests__/StepNode.test.tsx -t "header"` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | NODE-02 | unit | `npx vitest run src/components/canvas/__tests__/StepNode.test.tsx -t "description"` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | NODE-03 | unit | `npx vitest run src/lib/__tests__/nodeClassify.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | NODE-04 | unit | `npx vitest run src/components/canvas/__tests__/StepNode.test.tsx -t "badge"` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | NODE-05 | unit | `npx vitest run src/components/canvas/__tests__/StepNode.test.tsx -t "target handle"` | ❌ W0 | ⬜ pending |
| 03-01-06 | 01 | 1 | NODE-06 | unit | `npx vitest run src/components/canvas/__tests__/StepNode.test.tsx -t "source handle"` | ❌ W0 | ⬜ pending |
| 03-01-07 | 01 | 1 | NODE-07 | unit | `npx vitest run src/components/canvas/__tests__/StepNode.test.tsx -t "selected"` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | EDGE-01 | unit | `npx vitest run src/components/canvas/__tests__/ConditionalEdge.test.tsx -t "next"` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | EDGE-02 | unit | `npx vitest run src/components/canvas/__tests__/ConditionalEdge.test.tsx -t "condition"` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | EDGE-03 | unit | `npx vitest run src/components/canvas/__tests__/ConditionalEdge.test.tsx -t "timeout"` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 1 | EDGE-04 | unit | `npx vitest run src/components/canvas/__tests__/ConditionalEdge.test.tsx -t "no_match"` | ❌ W0 | ⬜ pending |
| 03-02-05 | 02 | 1 | EDGE-05 | unit | `npx vitest run src/components/canvas/__tests__/ConditionalEdge.test.tsx -t "intent"` | ❌ W0 | ⬜ pending |
| 03-02-06 | 02 | 1 | EDGE-06 | unit | `npx vitest run src/components/canvas/__tests__/ConditionalEdge.test.tsx -t "label"` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 1 | NAV-05 | unit | `npx vitest run src/lib/__tests__/layout.test.ts` | ❌ W0 | ⬜ pending |
| 03-03-02 | 03 | 1 | NAV-06 | unit | `npx vitest run src/lib/__tests__/layout.test.ts -t "direction"` | ❌ W0 | ⬜ pending |
| 03-03-03 | 03 | 1 | NAV-01 | integration | `npx vitest run src/components/canvas/__tests__/FlowCanvas.test.tsx -t "renders nodes"` | ❌ W0 | ⬜ pending |
| 03-03-04 | 03 | 1 | NAV-03 | integration | `npx vitest run src/components/canvas/__tests__/FlowCanvas.test.tsx -t "minimap"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/layout.test.ts` — stubs for NAV-05, NAV-06 (dagre getLayoutedElements)
- [ ] `src/lib/__tests__/nodeClassify.test.ts` — stubs for NODE-03 (role classification)
- [ ] `src/components/canvas/__tests__/StepNode.test.tsx` — stubs for NODE-01..07 (custom node rendering)
- [ ] `src/components/canvas/__tests__/ConditionalEdge.test.tsx` — stubs for EDGE-01..06 (custom edge rendering)
- [ ] `src/components/canvas/__tests__/FlowCanvas.test.tsx` — stubs for NAV-01, NAV-03 (integration)
- [ ] Install @dagrejs/dagre: `npm install @dagrejs/dagre`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Nodes are draggable | NAV-01 | jsdom lacks DOM measurement APIs for React Flow drag | Import a flow, drag a node, verify position updates |
| Canvas fills viewport | NAV-02 | Layout measurement requires real browser | Verify canvas stretches to full viewport height |
| Controls zoom/fit work | NAV-04 | Button interactions require real browser viewport | Click zoom in/out, fit-to-view buttons |
| Visual edge distinction | EDGE-01..05 | SVG rendering not available in jsdom | Import flow, verify solid/dashed/dotted styles visually |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
