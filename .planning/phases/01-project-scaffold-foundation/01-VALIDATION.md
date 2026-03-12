---
phase: 1
slug: project-scaffold-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (latest, Vite-native) |
| **Config file** | `vitest.config.ts` (or inline in `vite.config.ts`) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit && npx vitest run`
- **After every plan wave:** Run `npx tsc --noEmit && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green + `npm run dev` visual verification
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | INFRA-01 | smoke | `npx vite build` | No -- Wave 0 | pending |
| 01-02-01 | 02 | 1 | INFRA-02 | unit | `npx vitest run src/store/__tests__/store.test.ts` | No -- Wave 0 | pending |
| 01-02-02 | 02 | 1 | INFRA-03 | smoke | `npx tsc --noEmit` | N/A (built-in) | pending |
| 01-02-03 | 02 | 1 | INFRA-04 | unit | `npx vitest run src/__tests__/App.test.tsx` | No -- Wave 0 | pending |
| 01-02-04 | 02 | 1 | INFRA-05 | unit | `npx vitest run src/components/ui/__tests__/button.test.tsx` | No -- Wave 0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `@testing-library/react` + `jsdom` installed as dev dependencies
- [ ] `vitest.config.ts` created with jsdom environment
- [ ] `src/store/__tests__/store.test.ts` — stub for Zustand store tests
- [ ] `src/__tests__/App.test.tsx` — stub for ReactFlowProvider wrapping
- [ ] `src/components/ui/__tests__/button.test.tsx` — stub for shadcn component render

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Blank React Flow canvas renders visually | INFRA-01 | Visual check — canvas rendering is not trivially testable headlessly | `npm run dev`, open browser, verify blank canvas with controls visible |
| shadcn/ui components styled correctly with Tailwind v4 | INFRA-05 | Visual styling verification | Inspect rendered button in browser devtools for correct Tailwind classes |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
