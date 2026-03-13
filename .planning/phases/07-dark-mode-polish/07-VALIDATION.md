---
phase: 7
slug: dark-mode-polish
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-13
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 + @testing-library/react 16.3.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter verbose` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter verbose`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | UI-01 | unit | `npx vitest run src/components/__tests__/theme-provider.test.tsx` | W0 | pending |
| 07-01-02 | 01 | 1 | UI-01 | unit | `npx vitest run src/components/toolbar/__tests__/ModeToggle.test.tsx` | W0 | pending |
| 07-01-03 | 01 | 1 | UI-01 | unit | `npx vitest run src/components/canvas/__tests__/FlowCanvas.test.tsx -t "colorMode"` | W0 | pending |
| 07-01-04 | 01 | 1 | UI-01 | unit | `npx vitest run src/components/panel/__tests__/JsonFallbackEditor.test.tsx -t "dark"` | W0 | pending |
| 07-01-05 | 01 | 1 | UI-05 | unit | `npx vitest run src/__tests__/App.test.tsx -t "palette collapse"` | W0 | pending |
| 07-01-06 | 01 | 1 | UI-05 | unit | `npx vitest run src/__tests__/App.test.tsx -t "property panel collapse"` | W0 | pending |
| 07-02-01 | 02 | 2 | UI-06 | unit | `npx vitest run src/hooks/__tests__/useMediaQuery.test.ts` | W0 | pending |
| 07-02-02 | 02 | 2 | UI-06 | unit | `npx vitest run src/__tests__/App.test.tsx -t "responsive"` | W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/components/__tests__/theme-provider.test.tsx` — stubs for UI-01 (theme persistence, dark class)
- [ ] `src/components/toolbar/__tests__/ModeToggle.test.tsx` — stubs for UI-01 (toggle renders and switches)
- [ ] `src/components/canvas/__tests__/FlowCanvas.test.tsx` — stubs for UI-01 (colorMode prop forwarding)
- [ ] `src/components/panel/__tests__/JsonFallbackEditor.test.tsx` — stubs for UI-01 (dark theme swap)
- [ ] `src/hooks/__tests__/useMediaQuery.test.ts` — stubs for UI-06 (viewport detection)
- [ ] `window.matchMedia` mock in `src/test-setup.ts` — shared fixture for all theme tests
- [ ] Install dropdown-menu component: `npx shadcn@latest add dropdown-menu`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dark mode visual appearance looks correct | UI-01 | Visual quality requires human judgment | Toggle dark mode; verify all nodes, edges, panels, toolbar have appropriate contrast and no bright-on-dark artifacts |
| Interactions feel smooth and polished | UI-01, UI-05 | Subjective quality assessment | Click through all workflows; toggle panels; switch themes; verify no jank or flash |
| Layout adapts gracefully on small screens | UI-06 | Responsive behavior needs visual check | Resize browser to <768px; verify panels collapse; verify canvas remains usable |

---

## Task-to-Test File Mapping

| Task | Test Files Created | Coverage |
|------|--------------------|----------|
| 07-01 Task 1 (infrastructure) | `theme-provider.test.tsx`, `ModeToggle.test.tsx` | ThemeProvider context, ModeToggle dropdown |
| 07-01 Task 2 (propagation) | `FlowCanvas.test.tsx`, `JsonFallbackEditor.test.tsx` | colorMode prop, dark theme swap |
| 07-01 Task 3 (collapsible panels) | `App.test.tsx` (extended) | palette collapse, property panel collapse |
| 07-02 Task 1 (responsive) | `useMediaQuery.test.ts`, `App.test.tsx` (extended) | viewport detection, responsive collapse |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
