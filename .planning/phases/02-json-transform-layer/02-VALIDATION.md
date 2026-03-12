---
phase: 2
slug: json-transform-layer
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest --run` |
| **Full suite command** | `npx vitest --run` |
| **Estimated runtime** | ~5 seconds |

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
| 02-01-01 | 01 | 1 | IMP-02 | unit | `npx vitest --run src/lib/__tests__/detectSteps.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | IMP-01 | unit | `npx vitest --run src/lib/__tests__/jsonToFlow.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | IMP-01 | unit | `npx vitest --run src/lib/__tests__/edgeExtractors.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | IMP-04 | unit | `npx vitest --run src/lib/__tests__/flowToJson.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | IMP-04 | unit | `npx vitest --run src/lib/__tests__/roundTrip.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | IMP-01 | unit | `npx vitest --run src/lib/__tests__/jsonToFlow.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/lib/__tests__/jsonToFlow.test.ts` — stubs for IMP-01, IMP-02
- [ ] `src/lib/__tests__/flowToJson.test.ts` — stubs for IMP-04
- [ ] `src/lib/__tests__/detectSteps.test.ts` — stubs for IMP-02
- [ ] `src/lib/__tests__/roundTrip.test.ts` — stubs for IMP-04
- [ ] `src/lib/__tests__/edgeExtractors.test.ts` — stubs for edge extraction
- [ ] Test fixture JSON file with representative call flow data

*Existing infrastructure covers test framework (Vitest already installed).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| File picker dialog opens on Import click | IMP-01 | Browser file dialog cannot be automated in unit tests | Click Import button, verify file dialog appears, select .json file |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
