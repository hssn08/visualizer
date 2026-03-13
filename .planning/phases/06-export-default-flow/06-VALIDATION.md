---
phase: 6
slug: export-default-flow
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + jsdom |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter verbose` |
| **Full suite command** | `npx vitest run --reporter verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter verbose`
- **After every plan wave:** Run `npx vitest run --reporter verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | EXP-01 | unit | `npx vitest run src/components/toolbar/__tests__/ExportButton.test.tsx -x` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | EXP-02 | unit | `npx vitest run src/lib/__tests__/flowToJson.test.ts -x` | ✅ | ⬜ pending |
| 06-01-03 | 01 | 1 | EXP-03 | unit | `npx vitest run src/lib/__tests__/flowToJson.test.ts -x` | ✅ | ⬜ pending |
| 06-01-04 | 01 | 1 | EXP-02, EXP-03 | integration | `npx vitest run src/lib/__tests__/roundTrip.test.ts -x` | ✅ | ⬜ pending |
| 06-02-01 | 02 | 1 | EXP-04 | unit | `npx vitest run src/components/preview/__tests__/JsonPreviewPanel.test.tsx -x` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | IMP-03 | unit | `npx vitest run src/__tests__/App.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/toolbar/__tests__/ExportButton.test.tsx` — stubs for EXP-01 (export triggers download)
- [ ] `src/components/preview/__tests__/JsonPreviewPanel.test.tsx` — stubs for EXP-04 (preview panel renders, toggles, shows JSON)
- [ ] New tests in `src/__tests__/App.test.tsx` — stubs for IMP-03 (default flow loads on mount)
- [ ] `src/lib/__tests__/roundTrip.test.ts` — add edit-then-round-trip test for EXP-02/EXP-03

*Existing `flowToJson.test.ts` (18 tests) and `roundTrip.test.ts` (6 tests) already cover EXP-02 and EXP-03 core logic.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| File download triggers browser save dialog | EXP-01 | Blob/anchor download requires real browser | Click Export button, verify .json file downloads |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
