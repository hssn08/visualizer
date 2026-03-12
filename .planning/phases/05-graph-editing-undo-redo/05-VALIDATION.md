---
phase: 5
slug: graph-editing-undo-redo
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0 + jsdom + @testing-library/react 16 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest --run` |
| **Full suite command** | `npx vitest --run` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest --run`
- **After every plan wave:** Run `npx vitest --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | GRAPH-01 | unit | `npx vitest --run src/components/palette/__tests__/NodePalette.test.tsx -t "creates node"` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | GRAPH-02 | unit | `npx vitest --run src/components/palette/__tests__/NodePalette.test.tsx -t "templates"` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | GRAPH-03 | unit | `npx vitest --run src/store/__tests__/store.test.ts -t "onConnect"` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | GRAPH-04 | unit | `npx vitest --run src/hooks/__tests__/useNodeDelete.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 1 | GRAPH-05 | unit | `npx vitest --run src/store/__tests__/store.test.ts -t "deleteEdge"` | ❌ W0 | ⬜ pending |
| 05-02-04 | 02 | 1 | GRAPH-06 | unit | `npx vitest --run src/store/__tests__/store.test.ts -t "sync edge delete"` | ❌ W0 | ⬜ pending |
| 05-02-05 | 02 | 1 | GRAPH-07 | unit | `npx vitest --run src/store/__tests__/store.test.ts -t "sync edge create"` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | UNDO-01 | unit | `npx vitest --run src/hooks/__tests__/useUndoRedo.test.ts -t "undo"` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 2 | UNDO-02 | unit | `npx vitest --run src/hooks/__tests__/useUndoRedo.test.ts -t "redo"` | ❌ W0 | ⬜ pending |
| 05-03-03 | 03 | 2 | UNDO-03 | unit | `npx vitest --run src/store/__tests__/store.test.ts -t "drag undo"` | ❌ W0 | ⬜ pending |
| 05-03-04 | 03 | 2 | UI-03 | unit | `npx vitest --run src/hooks/__tests__/useNodeDelete.test.ts -t "keyboard"` | ❌ W0 | ⬜ pending |
| 05-03-05 | 03 | 2 | UI-04 | unit | `npx vitest --run src/hooks/__tests__/useUndoRedo.test.ts -t "keyboard"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/palette/__tests__/NodePalette.test.tsx` — stubs for GRAPH-01, GRAPH-02
- [ ] `src/hooks/__tests__/useUndoRedo.test.ts` — stubs for UNDO-01, UNDO-02, UI-04
- [ ] `src/hooks/__tests__/useNodeDelete.test.ts` — stubs for GRAPH-04, UI-03
- [ ] `src/store/__tests__/store.test.ts` — extend for GRAPH-03, GRAPH-05, GRAPH-06, GRAPH-07, UNDO-03
- [ ] `npx shadcn@latest add alert-dialog` — shadcn AlertDialog component install

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-drop from palette onto canvas | GRAPH-01 | Requires pointer event simulation across components | 1. Open app 2. Drag Basic Step from palette 3. Drop on canvas 4. Verify node appears |
| Keyboard Delete/Backspace triggers confirmation | UI-03 | React Flow keyboard integration requires full canvas focus | 1. Select node 2. Press Delete 3. Verify confirmation dialog appears |

*All other behaviors have unit-level automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
