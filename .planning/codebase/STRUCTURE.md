# Codebase Structure

**Analysis Date:** 2026-03-12

## Directory Layout

```
.claude/
├── agents/                          # Agent role definitions
│   ├── gsd-planner.md              # Plan creation agent
│   ├── gsd-executor.md             # Plan execution agent
│   ├── gsd-verifier.md             # Verification agent
│   ├── gsd-phase-researcher.md     # Phase research agent
│   ├── gsd-project-researcher.md   # Project-wide research
│   ├── gsd-debugger.md             # Debugging agent
│   └── [6 more agents...]
│
├── commands/gsd/                    # User-facing command specs
│   ├── execute-phase.md            # /gsd:execute-phase command
│   ├── plan-phase.md               # /gsd:plan-phase command
│   ├── map-codebase.md             # /gsd:map-codebase command
│   ├── new-project.md              # /gsd:new-project command
│   └── [27 more commands...]
│
├── get-shit-done/                   # Core GSD system
│   ├── bin/
│   │   ├── gsd-tools.cjs           # Main CLI entry point (593 lines)
│   │   └── lib/
│   │       ├── core.cjs            # Shared utilities, error handling (492 lines)
│   │       ├── phase.cjs           # Phase lifecycle operations (901 lines)
│   │       ├── state.cjs           # STATE.md persistence layer (721 lines)
│   │       ├── verify.cjs          # Verification suite (820 lines)
│   │       ├── init.cjs            # Workflow initialization (710 lines)
│   │       ├── roadmap.cjs         # ROADMAP.md operations (298 lines)
│   │       ├── milestone.cjs       # Milestone archival (241 lines)
│   │       ├── template.cjs        # Template scaffolding (222 lines)
│   │       ├── frontmatter.cjs     # YAML frontmatter CRUD (299 lines)
│   │       ├── config.cjs          # .planning/config.json ops (169 lines)
│   │       └── commands.cjs        # High-level commands (548 lines)
│   │
│   ├── workflows/                  # Orchestrator workflows
│   │   ├── execute-phase.md        # Wave-based execution orchestration
│   │   ├── plan-phase.md           # Planning workflow
│   │   ├── map-codebase.md         # Codebase analysis
│   │   ├── transition.md           # Between-phase progression
│   │   └── [20+ more workflows...]
│   │
│   ├── references/                 # Technical references
│   │   ├── phase-argument-parsing.md
│   │   ├── decimal-phase-calculation.md
│   │   ├── git-integration.md
│   │   ├── model-profile-resolution.md
│   │   └── [9+ more references...]
│   │
│   └── templates/                  # Markdown scaffolds
│       ├── codebase/               # Codebase analysis outputs
│       │   ├── architecture.md
│       │   ├── structure.md
│       │   ├── stack.md
│       │   ├── conventions.md
│       │   ├── testing.md
│       │   ├── integrations.md
│       │   └── concerns.md
│       ├── phase-prompt.md         # Plan template
│       ├── summary.md              # Execution summary template
│       ├── verification.md         # Verification template
│       ├── continue-here.md        # Session continuation
│       └── [20+ more templates...]
│
├── skills/                          # Project-specific skills
│   ├── playwright-cli/              # E2E testing skill
│   │   ├── SKILL.md                # Skill overview
│   │   ├── references/             # Playwright CLI docs
│   │   └── [test patterns]
│   └── [other skills if present]
│
├── hooks/                           # Session lifecycle hooks
│   ├── gsd-check-update.js         # SessionStart: check for updates
│   ├── gsd-statusline.js           # Status bar rendering
│   └── gsd-context-monitor.js      # PostToolUse: track context usage
│
├── package.json                     # Node.js config (commonjs)
├── settings.json                    # Hook definitions
├── settings.local.json              # User local overrides
└── gsd-file-manifest.json          # Integrity manifest (hashes)

.planning/                           # Project execution state
├── config.json                      # User config: model_profile, branching_strategy, etc.
├── STATE.md                         # Current execution state + decision log
├── ROADMAP.md                       # Phase list with checkboxes and progress
├── REQUIREMENTS.md                  # Requirement IDs and traceability
├── codebase/                        # Analysis outputs (populated by map-codebase)
│   ├── ARCHITECTURE.md
│   ├── STRUCTURE.md
│   ├── STACK.md
│   ├── CONVENTIONS.md
│   ├── TESTING.md
│   ├── INTEGRATIONS.md
│   └── CONCERNS.md
├── phases/                          # Phase directories (one per major phase)
│   ├── 1/                           # Phase 1
│   │   ├── 1-CONTEXT.md            # User decisions for phase 1
│   │   ├── 1-01-PLAN.md            # Plan 1.01: first plan of phase 1
│   │   ├── 1-01-SUMMARY.md         # Execution results
│   │   ├── 1-02-PLAN.md
│   │   ├── 1-02-SUMMARY.md
│   │   └── 1-VERIFICATION.md       # Phase completion verification
│   ├── 2/
│   ├── 3.1/                         # Gap closure subphase (decimal)
│   └── [phases added dynamically]
├── debug/                           # Debug session artifacts
│   ├── {slug}.md                    # Active debug sessions
│   └── resolved/                    # Completed debug sessions
└── milestones/                      # Archived phases (after completion)
    ├── v0.5-phases/                 # Milestone v0.5
    │   ├── 1/
    │   └── 2/
    └── v1.0-phases/

VIBE_CODING_PROMPT.md                # Project spec (if this is project repo, not GSD repo)
```

## Directory Purposes

**`.claude/agents/`:**
- Purpose: Agent role definitions and capabilities
- Contains: Markdown files with role, tools, process steps, templates
- Key files: `gsd-planner.md`, `gsd-executor.md`, `gsd-verifier.md`

**`.claude/commands/gsd/`:**
- Purpose: User command specifications
- Contains: Command description, arguments, linked workflow reference
- Key files: `execute-phase.md`, `plan-phase.md`, `map-codebase.md`, `new-project.md`

**`.claude/get-shit-done/bin/`:**
- Purpose: Executable CLI tools
- Contains: Node.js CommonJS modules for state and phase operations
- Key files: `gsd-tools.cjs` (router), `lib/state.cjs` (persistence), `lib/phase.cjs` (lifecycle)

**`.claude/get-shit-done/workflows/`:**
- Purpose: Multi-agent orchestration patterns
- Contains: Bash-based workflows that load context, spawn agents, aggregate results
- Key files: `execute-phase.md` (wave execution), `plan-phase.md` (planning), `transition.md` (between phases)

**`.claude/get-shit-done/templates/`:**
- Purpose: Pre-formatted markdown scaffolds
- Contains: Frontmatter schemas, section templates, placeholder fields
- Subdirectory `codebase/`: Templates for analysis documents

**`.planning/`:**
- Purpose: Project execution state (git-tracked, updated per execution)
- Contains: Config, phases, state, requirements, codebase analysis, debug artifacts
- Key files: `STATE.md` (current position + history), `ROADMAP.md` (phase definitions)

**`.planning/phases/`:**
- Purpose: Per-phase artifacts
- Contains: CONTEXT.md (decisions), PLAN.md (per-plan specs), SUMMARY.md (results), VERIFICATION.md (goal check)
- Naming: `{phase}/{phase}-{number}-{TYPE}.md`

## Key File Locations

**Entry Points:**
- `.claude/get-shit-done/bin/gsd-tools.cjs`: CLI router — all state operations funnel through this
- `.claude/get-shit-done/workflows/*.md`: Orchestration entry points — loaded and followed by orchestrator

**Configuration:**
- `.planning/config.json`: User preferences (model_profile, branching_strategy, parallelization, etc.)
- `.planning/STATE.md`: Current execution position and decision history
- `.claude/settings.json`: Session hooks (SessionStart, PostToolUse, statusLine)

**Core Logic:**
- `.claude/get-shit-done/bin/lib/phase.cjs`: Phase lifecycle (create, add, remove, complete, renumber)
- `.claude/get-shit-done/bin/lib/state.cjs`: STATE.md read/write, position tracking, decision logging
- `.claude/get-shit-done/bin/lib/verify.cjs`: Verification suite (plan structure, completeness, references, commits)
- `.claude/get-shit-done/bin/lib/init.cjs`: Workflow initialization context generation

**Testing:**
- `.playwright/cli.config.json`: Playwright configuration (if playwright skill is enabled)
- No unit tests in codebase — integration tested via execution workflows

## Naming Conventions

**Files:**
- Agent defs: `gsd-{role}.md` (e.g., `gsd-executor.md`)
- Commands: `{command}.md` (e.g., `execute-phase.md`, `plan-phase.md`)
- Workflows: `{workflow}.md` (e.g., `execute-phase.md`, `transition.md`)
- Plans: `{phase}-{number}-PLAN.md` (e.g., `1-01-PLAN.md`, `3.1-02-PLAN.md`)
- Summaries: `{phase}-{number}-SUMMARY.md` (execution results)
- State files: `{UPPERCASE}.md` (STATE, ROADMAP, REQUIREMENTS)
- Config: `.json` (config.json, settings.json)
- Lib modules: `{purpose}.cjs` (phase.cjs, state.cjs)

**Directories:**
- Phase dirs: `{phase}/` (e.g., `1/`, `2/`, `3.1/`)
- Milestone dirs: `v{X}.{Y}-phases/` (e.g., `v0.5-phases/`)
- Workflow dirs: `workflows/`, `templates/`, `agents/`, `commands/gsd/`

## Where to Add New Code

**New Agent/Role:**
- Primary code: `.claude/agents/gsd-{role}.md`
- Pattern: Copy existing agent (e.g., `gsd-executor.md`), modify role, tools, process steps
- Reference: `.claude/agents/gsd-planner.md` for planning patterns, `.claude/agents/gsd-executor.md` for execution patterns

**New Workflow:**
- Primary code: `.claude/get-shit-done/workflows/{name}.md`
- Pattern: Bash/CLI-based orchestration; load context via `gsd-tools init`, spawn agents via Task(), aggregate results
- Reference: `.claude/get-shit-done/workflows/execute-phase.md` for complex orchestration, `.claude/get-shit-done/workflows/plan-phase.md` for simpler flow

**New CLI Command:**
- Implement in `.claude/get-shit-done/bin/lib/{module}.cjs`
- Router: Add case to `.claude/get-shit-done/bin/gsd-tools.cjs` switch statement
- Public interface: Create `.claude/commands/gsd/{command}.md` with description and linked workflow

**New Template:**
- Primary code: `.claude/get-shit-done/templates/{name}.md`
- Codebase templates: `.claude/get-shit-done/templates/codebase/{name}.md`
- Pattern: YAML frontmatter (required fields), markdown sections with `[Placeholder]` markers
- Reference: `.claude/get-shit-done/templates/phase-prompt.md` for plan template structure

**Phase Artifacts (during execution):**
- Plans: `.planning/phases/{N}/{N}-{M}-PLAN.md` (executor reads these)
- Context: `.planning/phases/{N}/{N}-CONTEXT.md` (planner decision log)
- Summaries: `.planning/phases/{N}/{N}-{M}-SUMMARY.md` (executor writes)
- Verification: `.planning/phases/{N}/{N}-VERIFICATION.md` (verifier writes)

## Special Directories

**`.claude/get-shit-done/templates/codebase/`:**
- Purpose: Templates for codebase analysis documents (STACK.md, ARCHITECTURE.md, etc.)
- Generated: No (templates are git-tracked)
- Committed: Yes (templates are tools, not outputs)
- Used by: `gsd-codebase-mapper` agent to generate analysis on demand

**`.planning/phases/`:**
- Purpose: Phase execution artifacts
- Generated: Yes (created by `phase add`, populated by executors)
- Committed: Yes (plans, summaries, context are source-of-truth)
- Lifetime: From phase creation through execution; moved to `.planning/milestones/` on completion

**`.planning/debug/`:**
- Purpose: Debug session artifacts (from `/gsd:debug` workflow)
- Generated: Yes
- Committed: Yes (debug artifacts are audit trail)
- Subdirectory `resolved/`: Completed debug sessions (moved on resolution)

**`.planning/milestones/`:**
- Purpose: Archive completed phases
- Generated: Yes (created by `milestone complete`)
- Committed: Yes
- Lifetime: Created at milestone marker, stays for historical reference

**`node_modules/` (if created):**
- Purpose: Node.js dependencies for CLI tools
- Generated: Yes (npm install)
- Committed: No (.gitignored)
- Note: GSD system is pure Node (no build step, no package.json dependencies required for core tools)

## Load Order & Initialization

**Session Start:**
1. `.claude/hooks/gsd-check-update.js` runs (SessionStart hook) → checks for GSD updates
2. User invokes command: `/gsd:{command}`
3. Claude Code routes to `.claude/commands/gsd/{command}.md`
4. Command definition points to `.claude/get-shit-done/workflows/{workflow}.md`
5. Workflow loads context via `gsd-tools init {workflow}` → returns JSON with all needed state
6. Workflow spawns agents (Task subagents) with context references

**Agent Loading (Executor Example):**
1. Orchestrator spawns agent with `subagent_type="gsd-executor"` and PLAN.md path
2. Agent loads `.claude/agents/gsd-executor.md`
3. Agent reads files specified in `<files_to_read>`: PLAN.md, STATE.md, config.json, project skills
4. Agent executes tasks, commits per task, creates SUMMARY.md
5. Agent updates STATE.md and returns to orchestrator

---

*Structure analysis: 2026-03-12*
