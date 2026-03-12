---
phase: 4
slug: property-panel-toolbar
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x + @testing-library/react 16.x |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | EDIT-01 | unit | `npx vitest run src/components/panel/__tests__/PropertyPanel.test.tsx -x` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | EDIT-02 | unit | `npx vitest run src/components/panel/__tests__/StructuredFields.test.tsx -x` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | EDIT-03 | unit | `npx vitest run src/components/panel/__tests__/ConnectionEditor.test.tsx -x` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | EDIT-05 | unit | `npx vitest run src/store/__tests__/store.test.ts -x` | ✅ extend | ⬜ pending |
| 04-01-05 | 01 | 1 | EDIT-06 | unit | `npx vitest run src/__tests__/App.test.tsx -x` | ✅ extend | ⬜ pending |
| 04-02-01 | 02 | 1 | EDIT-04 | unit | `npx vitest run src/components/panel/__tests__/JsonFallbackEditor.test.tsx -x` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | UI-02 | unit | `npx vitest run src/components/toolbar/__tests__/Toolbar.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/panel/__tests__/PropertyPanel.test.tsx` — stubs for EDIT-01, EDIT-06
- [ ] `src/components/panel/__tests__/StructuredFields.test.tsx` — stubs for EDIT-02
- [ ] `src/components/panel/__tests__/ConnectionEditor.test.tsx` — stubs for EDIT-03
- [ ] `src/components/panel/__tests__/JsonFallbackEditor.test.tsx` — stubs for EDIT-04
- [ ] `src/components/toolbar/__tests__/Toolbar.test.tsx` — stubs for UI-02
- [ ] Extend `src/store/__tests__/store.test.ts` — stubs for EDIT-05 (updateNodeData, updateEdgeTarget)
- [ ] Extend `src/__tests__/App.test.tsx` — stubs for EDIT-06 (panel visibility toggle)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Panel opens/closes smoothly without canvas jitter | EDIT-01, EDIT-06 | Visual layout interaction with ReactFlow resize | 1. Click node → verify panel slides in. 2. Click canvas → verify panel closes. 3. Check canvas doesn't jitter. |
| json-edit-react cursor position preserved during editing | EDIT-04 | Internal library state behavior | 1. Expand JSON editor. 2. Edit a string field. 3. Verify cursor stays in place, no re-render flash. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
